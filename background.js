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

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.method == "get_data") {
    resource_list.forEach(async (item) => {
      let data = await get_data(
        `https://ncchen.ga/ncku-evaluation/data/${item}-sha256.txt`,
        "text"
      );
      var sha = `${item}-sha256`;
      let sha_res = await getLocalStorage(sha);
      if (sha_res != data && !data.error) {
        console.log("🥗");
        await setLocalStorage(sha, data);
        json_data[item] = await get_data(
          `https://ncchen.ga/ncku-evaluation/data/${item}.json`,
          "json"
        );
        await setLocalStorage(item, json_data[item]);
      } else {
        let data = await getLocalStorage(item);
        json_data[item] = data;
        console.log("🥳");
      }
    });
    setTimeout(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          method: "response_data",
          json_data: json_data,
        });
        return true;
      });
    }, 200);
    await sendResponse({ complete: "ok" });
  } else {
    await sendResponse({});
  }
  return true;
});
