console.log("🤖🆙");
window.json_data = {};
window.profs_items = [];
//// content.js ////
function shorten_string(string, len) {
  if (string.length > len) {
    string = string.substring(0, len - 1) + "...";
  }
  return string;
}
function color_text(score, reverse) {
  var color_table = ["#B03A2E", "#CA6F1E", "#D4AC0D", "#148F77", "#148F77"];
  var idx = reverse
    ? parseInt(6 - parseFloat(score))
    : parseInt(parseFloat(score) - 1);
  return `<b><font color="${color_table[idx]}">` + +score + "</font></b>";
}
function formatter(type, data) {
  var content = "";
  if (type == "prof") {
    window.profs_items[window.profs_items.indexOf("課業壓力")] = "課程涼度";
    var score = ["私心推薦", "學到東西", "口條好", "給分甜度", "課程涼度"];
    for (const key in data) {
      if (Array.isArray(data[key][0])) {
        for (var i = 0; i < 9; i++) {
          if (data[key][0][i] != null) {
            content += `
            <p style="clear: both;"><span style="float: left;"><b>${window.profs_items[i]}</b></span>:<span style="float: right;">`;
            if (score.includes(window.profs_items[i]))
              content += color_text(data[key][0][i].replace(" ★", ""), false);
            else content += shorten_string(data[key][0][i], 9);
            content += "</span></p>";
          }
        }
      } else {
        content += `<p style="clear: both;"><span style="float: left;"><b>${key}</b></span>:<span style="float: right;">${data[key][0].res}</span></p>`;
      }
    }
  }
  if (type == "course") {
  }
  return content;
}
function fillin_popup(course_name, profs_data) {
  course_name = shorten_string(course_name, 11);
  $("#popup > .content").html(`
      <div class="header">${course_name}</div>
      <div class="description">${formatter("prof", profs_data)}</div>
`);
  $(`#popup`).removeClass("hidden").addClass("visible");
}
function get_professor_info(value) {
  var profs_data = {};
  if (value in window.json_data["urschool"]["professors"]) {
    profs_data[value] = window.json_data["urschool"]["professors"][value];
  } else {
    profs_data[value] = [{ res: "找不到資料耶🥺" }];
  }
  return profs_data;
}
function make_btn(course_name, td, trIdx) {
  $(td).removeClass("sm");
  td.innerHTML = `
            <div class="medium fluid ui button my-button" id="button${trIdx}">
             ${td.innerHTML}
            </div>
            `;

  $(`.button#button${trIdx}`)
    .mouseenter(function () {
      // filter data
      // $(`#popup`).removeClass("visible").addClass("hidden");

      var value = $(td).text().trim().replace("*", "<br>").split("<br>")[0];
      var profs_data = get_professor_info(value);
      console.log("👋:" + value);
      fillin_popup(course_name, profs_data);
    })
    .mouseleave(function () {
      $("#popup").removeClass("visible").addClass("hidden");
    })
    .click(function () {
      var value = $(td).text().trim().replace("*", "<br>").split("<br>")[0];
      var profs_data = get_professor_info(value);
      console.log(profs_data);
      window
        .open(
          "https://urschool.org/teacher/" +
            Object.values(profs_data)[0][0].slice(-1)[0],
          "_blank"
        )
        .focus();
    });
}
function modify_html() {
  $("table.table > thead  > tr > th:nth-child(7)")[0].style.width = "11%";
  // var profs_set = new Set();
  $("table.table > tbody  > tr:visible").each(function (trIdx, tr) {
    course_name = $(tr).find(".course_name").text().trim();
    $(tr)
      .find("td")
      .each(function (tdIdx, td) {
        if (tdIdx == 6) {
          make_btn(course_name, td, trIdx);
        }
      });
  });
}

// 接收資料
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("🐍");
  if (request.method == "response_data") {
    if (Object.keys(request.json_data).length != 0) {
      window.json_data = request.json_data;
      window.profs_items = window.json_data["urschool"]["column names"];
      modify_html();
      sendResponse({ complete: "ok" });
      $(".loading-btn").remove();
    } else {
      location.reload();
      // 他是被逼ㄉ
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
  $("body").append(
    `<div class="ui card" id="popup">
    <div class="content">
    </div>
  </div>`
  );
  chrome.runtime.sendMessage({ method: "get_data" }, function (response) {
    if (response.complete == "ok") {
      console.log("👌");
    } else {
      console.log("📛");
    }
  });
}
