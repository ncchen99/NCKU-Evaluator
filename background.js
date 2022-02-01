//// background.js ////

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 2. A page requested user data, respond with a copy of `user`
  if (message.name == "get-prof-data") {
    fetch(`https://ncchen.ga/ncku-evaluation/data/urschool/${message.prof}.json`)
      .then(function (response) {
        return response.json();
      })
      .then(function (result) {
        // console.log(result);
        sendResponse(result);
      }).catch(function(e) {
        console.log(e); // "oh, no!"
      });
  }
});
