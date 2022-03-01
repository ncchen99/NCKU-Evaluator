console.log("🤖🆙");
//// content.js ////

function display_data(profs_data, td, trIdx) {
  td.innerHTML = `
            <div class="medium fluid ui button my-button" id="button${trIdx}">
             ${td.innerHTML}
            </div>
            <div class="ui popup flowing bottom left transition hidden my-popup" id="popup${trIdx}">
            <div class='header'>User Rating</div>${JSON.stringify(
              profs_data
            )}<div class='content'><div class='ui star rating'><i class='active icon'></i><i class='active icon'></i><i class='active icon'></i><i class='active icon'></i><i class='active icon'></i></div></div>
            </div>`;
  $(`.button#button${trIdx}`)
    .mouseenter(function () {
      // highlight the mouseover target
      var rect = $(`.button#button${trIdx}`)[0].getBoundingClientRect();
      $(`.popup#popup${trIdx}`).removeClass("hidden").addClass("visible");
      $(`.popup#popup${trIdx}`)
        .css("top", rect.bottom - document.body.getBoundingClientRect().top)
        .css("left", rect.left); //
    })
    .mouseleave(function () {
      // highlight the mouseover target
      $(`.popup#popup${trIdx}`).removeClass("visible").addClass("hidden");
    });
}
function filter_data(json_data) {
  console.log(json_data);
  $("table.table > thead  > tr > th:nth-child(7)")[0].style.width = "11%";
  // var profs_set = new Set();
  $("table.table > tbody  > tr:visible").each(function (trIdx, tr) {
    $(tr)
      .find("td")
      .each(function (tdIdx, td) {
        if (tdIdx == 6) {
          var profs_data = {};
          $(td).removeClass("sm"); //.addClass("ui segment").css("position", "list-item");
          td.innerHTML
            .replace("*", "")
            .split("<br>")
            .forEach((value) => {
              if (value in json_data["urschool"]["professors"]) {
                profs_data[value] = json_data["urschool"]["professors"][value];
              } else {
                profs_data[value] = [{ res: "找不到資料耶🥺" }];
              }
              console.log("fetching:" + value);
            });
          display_data(profs_data, td, trIdx);
        }
      });
  });
}

var json_data = {};
// 接收資料
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("received");
  if (request.method == "response_data") {
    if (Object.keys(request.json_data).length != 0) {
      json_data = request.json_data;
      filter_data(json_data);
      sendResponse({ complete: "ok" });
      $(".loading-btn").remove();
    } else {
      location.reload();
    }
  }
  return true;
});

if (
  $("table.table").length > 0 &&
  $("table.table > thead  > tr > th:nth-child(7)").html().includes("教師姓名")
) {
  $("body").append(
    `<div class="loading-btn"><i class="fa fa-spinner fa-spin"></i></div>`
  );
  chrome.runtime.sendMessage({ method: "get_data" }, function (response) {
    if (response.complete == "ok") {
      console.log("👌👋");
    } else {
      console.log("📛");
    }
  });
}
