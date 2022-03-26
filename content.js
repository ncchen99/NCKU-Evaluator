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
  if (type == "professors") {
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
  if (type == "courses") {
    var items = ["收穫", "甜度", "涼度"];
    var color_table = ["red", "orange", "yellow", "olive", "green"];
    content += `
    <div class="ui divided selection list">`;
    for (const key in data) {
      if (Array.isArray(data[key]) && data[key][0] != "0.0") {
        for (var i = 0; i < 3; i++) {
          content += `
          <a class="item" style="clear: both;">
          <span style="float: left; margin: 10px 0;"><b>${
            items[i]
          }：</b></span><div class="ui ${
            color_table[parseInt(parseInt(data[key][i]) / 2.5)]
          } label my-label" style="float: right; margin: 4px 0;">${Math.round(
            parseFloat(data[key][i])
          )}
          </div>
          </a>`;
        }
      } else {
        content += `<p style="clear: both;"><span style="float: left;"><b>${key}</b></span>:<span style="float: right;">找不到耶🥺</span></p>`;
      }
    }
  }
  return content;
}
function fillin_popup(course_name, data, category) {
  course_name = shorten_string(course_name, 11);
  $("#popup > .content").html(`
      <div class="header">${course_name}</div>
      <div class="description">${formatter(category, data)}</div>
`);
  $(`#popup`).removeClass("hidden").addClass("visible");
}
function get_info(value, category) {
  var data = {};
  params = { professors: "urschool", courses: "nckuhub" };
  if (value in window.json_data[params[category]][category]) {
    data[value] = window.json_data[params[category]][category][value];
  } else {
    data[value] = [{ res: "找不到資料耶🥺" }];
  }
  return data;
}

function make_btn(course_name, td, trIdx, course_id, category) {
  $(td).removeClass("sm");
  // console.log(td.querySelector("a").innerHTML);
  try {
    var content = `
            <div class="${
              category != "courses" ? "medium fluid ui button my-button" : ""
            } ${
      category == "courses" ? "courses-button" : ""
    }" id="button-${category}-${trIdx}">
             ${
               category == "courses"
                 ? td.querySelector("a").innerHTML
                 : td.innerHTML
             }
            </div>
            `;
    if (category == "courses") {
      td.querySelector("a").innerHTML = content;
      if (!$(td).children(".ips").length) $(td).find("br").remove();
    } else td.innerHTML = content;
  } catch {
    console.log("😵");
  }
  $(`#button-${category}-${trIdx}`)
    .mouseenter(function () {
      // filter data
      // $(`#popup`).removeClass("visible").addClass("hidden");
      if (category == "professors") {
        var value = $(td).text().trim().replace("*", "<br>").split("<br>")[0];
        var prof_data = get_info(value, category);
        console.log("👋:" + value);
        fillin_popup(course_name, prof_data, category);
      } else {
        var course_data = get_info(course_id, category);
        console.log("👋:" + course_id);
        fillin_popup(course_name, course_data, category);
      }
    })
    .mouseleave(function () {
      $("#popup").removeClass("visible").addClass("hidden");
    })
    .click(function () {
      if (category == "professors") {
        var value = $(td).text().trim().replace("*", "<br>").split("<br>")[0];
        var prof_data = get_info(value, category);
        window
          .open(
            "https://urschool.org/teacher/" +
              Object.values(prof_data)[0][0].slice(-1)[0],
            "_blank"
          )
          .focus();
      }
    });
}
function modify_html() {
  $("table.table > thead  > tr > th:nth-child(7)")[0].style.width = "11%";
  // var profs_set = new Set();
  $("table.table > tbody  > tr:visible").each(function (trIdx, tr) {
    course_name = $(tr).find(".course_name").text().trim();
    course_id = $(tr).find(".dept_seq").text().trim();
    $(tr)
      .find("td")
      .each(function (tdIdx, td) {
        if (tdIdx == 4) {
          make_btn(course_name, td, trIdx, course_id, "courses");
        }
        if (tdIdx == 6) {
          make_btn(course_name, td, trIdx, course_id, "professors");
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
