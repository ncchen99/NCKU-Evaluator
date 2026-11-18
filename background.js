const DATA_BASE_URL = "https://ncchen99.github.io/ncku-evaluation/data";
const resource_list = ["nckuhub", "urschool"];

async function get_data(url, type) {
  try {
    let res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      console.log(`NETWORK ERROR: ${res.status} ${url}`);
      return { error: res.status };
    }
    return type == "json" ? await res.json() : (await res.text()).trim();
  } catch (e) {
    console.log(`FETCH ERROR: ${e} ${url}`);
    return { error: String(e) };
  }
}

const getLocalStorage = async (key) => {
  const result = await chrome.storage.local.get([key]);
  return result[key] === undefined ? "" : result[key];
};

const setLocalStorage = async (items) => chrome.storage.local.set(items);

// 取得某一份資料：sha256 有變才重新下載，否則用快取
async function load_resource(item) {
  const sha_key = `${item}-sha256`;
  const latest_hash = await get_data(`${DATA_BASE_URL}/${item}-sha256.txt`, "text");
  const cached_hash = await getLocalStorage(sha_key);
  const cached_data = await getLocalStorage(item);
  if (!latest_hash.error && (latest_hash != cached_hash || !cached_data)) {
    console.log("🥗", item);
    const data = await get_data(`${DATA_BASE_URL}/${item}.json`, "json");
    if (!data.error) {
      // 資料下載成功才更新快取，避免把錯誤訊息存進去
      await setLocalStorage({ [item]: data, [sha_key]: latest_hash });
      return data;
    }
  }
  return cached_data;
}

// 同時有多個分頁要求資料時共用同一次下載
let pending = null;
async function load_all() {
  const values = await Promise.all(resource_list.map(load_resource));
  const json_data = {};
  resource_list.forEach((item, idx) => (json_data[item] = values[idx]));
  return json_data;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.method) {
    case "get_data":
      if (!pending) pending = load_all().finally(() => (pending = null));
      pending
        .then((json_data) => {
          console.log("🥳");
          sendResponse({ complete: "ok", json_data });
        })
        .catch((e) => sendResponse({ complete: "error", error: String(e) }));
      return true; // 非同步回覆
    default:
      sendResponse({});
      return false;
  }
});
