async function get_data(url, type) {
  let res = await fetch(url);
  if (!res.ok) {
    console.log(`NETWORK ERROR: ${res.status}`);
    return { error: res.status };
  }
  return type == "json" ? await res.json() : await res.text();
}

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
      var item_bk = item;
      chrome.storage.local.get([sha], async function (result) {
        if (result[sha] != data && !data.error) {
          console.log("🥗");
          // Cookies.set(`${item}-sha256`, data, { expires: 30 });
          chrome.storage.local.set({ [sha]: data });
          json_data[item_bk] = await get_data(
            `https://ncchen.ga/ncku-evaluation/data/${item_bk}.json`,
            "json"
          );
          chrome.storage.local.set({
            [item_bk]: json_data[item_bk],
          });
        } else {
          chrome.storage.local.get([item_bk], function (result) {
            json_data[item_bk] = result[item_bk];
            console.log("🐢： " + JSON.stringify(json_data[item_bk]));
          });
        }
      });
    });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        method: "response_data",
        json_data: json_data,
      });
    });
    sendResponse({ complete: "ok" });
    // return true from the event listener to indicate you wish to send a response asynchronously
    // (this will keep the message channel open to the other end until sendResponse is called).
    // console.log("background get data event");
  } else {
    sendResponse({});
  } // snub them.
  return true;
});
