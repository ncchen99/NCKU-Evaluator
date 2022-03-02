console.log("🤖🆙");
//// content.js ////
function formatter(type, data) {
  var content = "";
  if (type == "prof") {
    var items = [
      "姓名",
      "授課系所",
      "職稱",
      "私心推薦",
      "學到東西",
      "口條好",
      "課業壓力",
      "給分甜度",
      "平均成績",
      "最高學歷",
      "值得一提",
      "綽號",
      "點名方式",
      "urschool_id",
    ];
    for (const key in data) {
      if (Array.isArray(data[key][0])) {
        if (Object.keys(data).length != 1)
          content += `<div class="ui raised segment">`;
        for (var i = 0; i < 8; i++) {
          if (data[key][0][i] != null) {
            content += `<p>${items[i]}:${data[key][0][i].replace(
              " ★",
              ""
            )}</p>`;
          }
        }
        if (Object.keys(data).length != 1) content += `</div>`;
      } else {
        if (Object.keys(data).length != 1)
          content += `<div class="ui raised segment">`;
        content += `<p>${key}:${data[key][0].res}<p>`;
        if (Object.keys(data).length != 1) content += `</div>`;
      }
    }
  }
  if (type == "course") {
  }
  return content;
}
function display_profs_data(profs_data, td, trIdx) {
  td.innerHTML = `
            <div class="medium fluid ui button my-button" id="button${trIdx}">
             ${td.innerHTML}
            </div>
            <div class="ui popup flowing bottom left transition hidden my-popup" id="popup${trIdx}">
              <div class='header'></div><div class='content'>${formatter(
                "prof",
                profs_data
              )}

              </div>
            </div>`;

  $(`.button#button${trIdx}`)
    .mouseenter(function () {
      var rect = $(`.button#button${trIdx}`)[0].getBoundingClientRect();
      $(`.popup#popup${trIdx}`).removeClass("hidden").addClass("visible");
      var rect_popup = $(`.popup#popup${trIdx}`)[0].getBoundingClientRect();
      var popup_height = rect_popup.bottom - rect_popup.top;
      console.log(popup_height);
      $(`.popup#popup${trIdx}`)
        .css(
          "top",
          rect.bottom -
            (popup_height + 10 + rect.bottom - rect.top) / 2 -
            document.body.getBoundingClientRect().top
        )
        .css("left", rect.left); //
    })
    .mouseleave(function () {
      setTimeout(function () {
        if (!$(".popup#popup${trIdx}").is(":hover"))
          $(`.popup#popup${trIdx}`).removeClass("visible").addClass("hidden");
      }, 50);
    });
  $(`.popup#popup${trIdx}`)
    .mouseenter(function () {
      var rect = $(`.button#button${trIdx}`)[0].getBoundingClientRect();
      $(`.popup#popup${trIdx}`).removeClass("hidden").addClass("visible");
      var rect_popup = $(`.popup#popup${trIdx}`)[0].getBoundingClientRect();
      var popup_height = rect_popup.bottom - rect_popup.top;
      console.log(popup_height);
      $(`.popup#popup${trIdx}`)
        .css(
          "top",
          rect.bottom -
            (popup_height + 10 + rect.bottom - rect.top) / 2 -
            document.body.getBoundingClientRect().top
        )
        .css("left", rect.left);
    })
    .mouseleave(function () {
      if (!$(`.button#button${trIdx}`).is(":hover"))
        $(`.popup#popup${trIdx}`).removeClass("visible").addClass("hidden");
    });
}
function filter_data(json_data) {
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
          display_profs_data(profs_data, td, trIdx);
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
