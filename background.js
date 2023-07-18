async function get_data(url, type) {
  let res = await fetch(url);
  if (!res.ok) {
    console.log(`NETWORK ERROR: ${res.status}`);
    return { error: res.status };
  }
  return type == "json" ? await res.json() : await res.text();
}

const getLocalStorage = async (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (result[key] === undefined) {
        resolve("");
      } else {
        resolve(result[key]);
      }
    });
  });
};

const setLocalStorage = async (key, value) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, function () {
      resolve();
    });
  });
};

var json_data = {};
const resource_list = ["nckuhub", "urschool"];

var json_data_proxy = new Proxy(json_data, {
  set: function (target, key, value) {
    target[key] = value;
    if (Object.keys(target).length == resource_list.length) {
      chrome.tabs.query(
        { active: true, currentWindow: true },
        function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            method: "response_data",
            json_data: json_data,
          });
        },
      );
    }
    return true;
  },
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.method) {
    case "get_data":
      resource_list.forEach(async (item) => {
        let latest_hash = await get_data(
          `https://ncchen.gay/ncku-evaluation/data/${item}-sha256.txt`,
          "text",
        );
        var sha = `${item}-sha256`;
        let sha_res = await getLocalStorage(sha);
        if (!latest_hash.error && sha_res != latest_hash) {
          console.log("🥗");
          await setLocalStorage(sha, latest_hash);
          await setLocalStorage(
            item,
            await get_data(
              `https://ncchen.gay/ncku-evaluation/data/${item}.json`,
              "json",
            ),
          );
        }
        json_data_proxy[item] = await getLocalStorage(item);
        console.log("🥳");
      });
      sendResponse({ complete: "ok" });
      break;
    default:
      sendResponse({});
      break;
  }
  return true;
});
