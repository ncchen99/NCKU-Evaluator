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
    ? parseInt(5 - parseFloat(score))
    : parseInt(parseFloat(score) - 1);
  return `<b><font color="${color_table[idx]}">` + +score + "</font></b>";
}
function formatter(type, data) {
  var content = "";
  if (type == "professors") {
    // window.profs_items[window.profs_items.indexOf("課業壓力")] = "課程涼度";
    var score = ["私心推薦", "學到東西", "口條好", "給分甜度"];
    for (const key in data) {
      if (Array.isArray(data[key][0])) {
        for (var i = 0; i < 9; i++) {
          if (data[key][0][i] != null) {
            content += `
            <p style="clear: both;"><span style="float: left;"><b>${window.profs_items[i]
              }：</b></span><span style="float: right;">`;
            if (score.includes(window.profs_items[i])) {
              content += color_text(data[key][0][i].replace(" ★", ""), false);
            } else if ("課業壓力" == window.profs_items[i]) {
              content += color_text(data[key][0][i].replace(" ★", ""), true);
            } else content += shorten_string(data[key][0][i], 9);
            content += "</span></p>";
          }
        }
      } else {
        content +=
          `<p style="clear: both;"><span style="float: left;"><b>${key}</b></span>:<span style="float: right;">${data[key][0].res
          }</span></p>`;
      }
    }
  }
  if (type == "courses") {
    var items = ["收穫", "涼度", "甜度"];
    var color_table = ["red", "orange", "yellow", "olive", "green"];
    for (const key in data) {
      for (var i = 0; i < 3; i++) {
        var score = Math.round(parseFloat(data[key][i]));
        content += `
          <div class="ui label my-label" style="padding-left: 5px !important">
  ${items[i]}
  <div class="ui ${color_table[Math.round(score / 2.5)]} label my-label">${score}</div>
</div>`;
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
  var params = { professors: "urschool", courses: "nckuhub" };
  var source = (window.json_data[params[category]] || {})[category] || {};
  if (Object.prototype.hasOwnProperty.call(source, value)) {
    data[value] = source[value];
  } else {
    data[value] = [{ res: "找不到資料🥺" }];
  }
  return data;
}
// NCKU Hub 有這門課、課名相符、而且至少有一筆評分
function has_course_rating(course_data, course_id, course_name) {
  var row = course_data[course_id];
  return (
    Array.isArray(row) &&
    row.length > 3 &&
    row[3]["課程名稱"] == course_name &&
    parseFloat(row[0]) > 0
  );
}

function make_btn(course_name, td, trIdx, course_id, category) {
  $(td).removeClass("sm");
  // console.log(td.querySelector("a").innerHTML);
  try {
    var content = `
            <div class="${category != "courses" ? "medium fluid ui button my-button" : ""
      } " id="button-${category}-${trIdx}">
             ${category == "courses" ? td.querySelector("a").innerHTML : td.innerHTML
      }
            </div>
            `;
    if (category == "courses") {
      td.querySelector("a").innerHTML = content;
      // if (!$(td).children(".ips").length) $(td).find("br").remove();
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
        // var course_data = get_info(course_id, category);
        console.log("👋:" + course_id);
        // fillin_popup(course_name, course_data, category);
      }
    })
    .mouseleave(function () {
      $("#popup").removeClass("visible").addClass("hidden");
    })
    .click(function () {
      if (category == "professors") {
        var value = $(td).text().trim().replace("*", "<br>").split("<br>")[0];
        var prof_data = get_info(value, category);
        if (Array.isArray(Object.values(prof_data)[0][0])) {
          window
            .open(
              "https://urschool.org/teacher/" +
              Object.values(prof_data)[0][0].slice(-1)[0],
              "_blank",
            )
            .focus();
        }
      }
    });
}
// 標準差（1~10 分制）→ 意見分散程度
function spread_text(sd) {
  if (sd == null) return "";
  if (sd < 1.5) return "一致";
  if (sd < 2.5) return "有分歧";
  return "兩極";
}
// 滑鼠移到 NCKU Hub 評分上時顯示的簡短說明
function hub_tooltip_html(row) {
  var stats = row[4];
  if (!stats) return "";
  var n = stats["人數"];
  var sd = stats["標準差"] || [];
  var items = ["收穫", "涼度", "甜度"];
  var html = `<div class="hub-tip-title">${n} 人評分${n < 5 ? "<span class='hub-tip-note'>（人數少，僅供參考）</span>" : ""}</div>`;
  for (var i = 0; i < 3; i++) {
    var mean = parseFloat(row[i]).toFixed(1);
    html += `<div class="hub-tip-row"><span>${items[i]}</span><b>${mean}</b>`;
    if (sd[i] != null) {
      html += `<span class="hub-tip-sd">± ${sd[i].toFixed(1)}</span><span class="hub-tip-spread hub-${spread_text(sd[i])}">${spread_text(sd[i])}</span>`;
    }
    html += `</div>`;
  }
  if (sd.some((x) => x != null)) {
    html += `<div class="hub-tip-foot">± 為標準差，越大代表大家看法越不同</div>`;
  }
  return html;
}
function bind_hub_tooltip(el, row) {
  var html = hub_tooltip_html(row);
  if (!html) return;
  $(el)
    .mouseenter(function () {
      var tip = $("#hub-tip").html(html).addClass("show");
      var rect = el.getBoundingClientRect();
      var top = rect.top - tip.outerHeight() - 8;
      if (top < 8) top = rect.bottom + 8;
      var left = Math.min(rect.left, window.innerWidth - tip.outerWidth() - 8);
      tip.css({ top: top, left: Math.max(8, left) });
    })
    .mouseleave(function () {
      $("#hub-tip").removeClass("show");
    });
}
function modify_html() {
  $("table.table > thead  > tr > th:nth-child(7)")[0].style.width = "11%";
  $("table.table > tbody  > tr:visible").each(function (trIdx, tr) {
    var course_name = $(tr).find(".course_name").text().trim();
    var course_id = $(tr).find(".dept_seq").text().trim();
    $(tr)
      .find("td")
      .each(function (tdIdx, td) {
        if (tdIdx == 4 && course_id) {
          var course_data = get_info(course_id, "courses");
          if (has_course_rating(course_data, course_id, course_name)) {
            var labels = $(`<div class="ui labels my-labels">
                        ${formatter("courses", course_data)}</div>`);
            $(td).append(labels);
            bind_hub_tooltip(labels[0], course_data[course_id]);
          } else {
            $(td).append(`<div class="my-course-label">找不到資料🥺</div>`);
          }
        }
        if (tdIdx == 6 && $(td).text().trim()) {
          make_btn(course_name, td, trIdx, course_id, "professors");
        }
      });
  });
}

function on_data(json_data) {
  window.json_data = json_data;
  window.profs_items = (json_data["urschool"] || {})["column names"] || [];
  modify_html();
  $(".loading-btn").remove();
}

if (
  $("table.table").length > 0 &&
  ($("table.table > thead  > tr > th:nth-child(7)").html() || "").includes("教師姓名")
) {
  $("body").append(
    `<div class="loading-btn"><i class="fa fa-spinner fa-spin"></i></div>`,
  );
  $("body").append(`<div id="hub-tip"></div>`);
  $("body").append(
    `<div class="ui card" id="popup">
    <div class="content">
    </div>
  </div>`,
  );
  chrome.runtime.sendMessage({ method: "get_data" }, function (response) {
    if (response && response.complete == "ok") {
      console.log("👌");
      on_data(response.json_data);
    } else {
      console.log("📛", chrome.runtime.lastError || response);
      $(".loading-btn").remove();
    }
  });
}
