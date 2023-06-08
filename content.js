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
            <p style="clear: both;"><span style="float: left;"><b>${window.profs_items[i]}：</b></span><span style="float: right;">`;
            if (score.includes(window.profs_items[i]))
              content += color_text(data[key][0][i].replace(" ★", ""), false);
            else if ("課業壓力" == window.profs_items[i])
              content += color_text(data[key][0][i].replace(" ★", ""), true);
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
    var items = ["收穫", "涼度", "甜度"];
    var color_table = ["red", "orange", "yellow", "olive", "green"];
    content += `
    <div class="ui divided selection list">`;
    for (const key in data) {
      if (Array.isArray(data[key]) && data[key][0] != "0.0") {
        for (var i = 0; i < 3; i++) {
          content += `
          <div class="ui label my-label" style="padding-left: 5px !important">
  ${items[i]}
  <div class="ui ${
    color_table[Math.round(parseInt(data[key][i]) / 2.5)]
  } label my-label">${parseInt(data[key][i])}</div>
</div>`;
          // <a class="item" style="clear: both;">
          // <span style="float: left; margin: 10px 0;"><b>${
          //   items[i]
          // }：</b></span><div class="ui ${
          //   color_table[parseInt(Math.round(parseFloat(data[key][i]) / 2.5))]
          // } label my-label" style="float: right; margin: 4px 0;">${Math.round(
          //   parseFloat(data[key][i])
          // )}
          // </div>
          // </a>`;
        }
      } else {
        content += `<div class="my-course-label">找不到資料🥺</div>`;
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
    data[value] = [{ res: "找不到資料🥺" }];
  }
  return data;
}

// filters out all blocks of plain text as a string array
// reference: https://stackoverflow.com/questions/68364942/get-innertext-and-split-by-br
function html_filter(html) {
  return html.replace(/\n/g, "<br>").split("<br>").map(e => e.replace(/\<(.*)\>/g, '').trim()).filter(e => e)
}

// turns a html string to an element
function htmlToElem(html) {
  let temp = document.createElement('template');
  html = html.trim(); // Never return a space text node as a result
  temp.innerHTML = html;
  return temp.content.firstChild;
}

// turns td into button(s)
// if the content of td contains two or more lines, it will call make_btn() multiple times, thus generating multiple buttons
function td2btn(course_name, td, trIdx, course_id, category) {
  $(td).removeClass("sm");
  td_content = category == "courses"
    ? td.querySelector("a").innerHTML
    : html_filter(td.innerHTML)
  td.innerHTML = '';

  td_content.forEach(element => make_btn(course_name,td,trIdx,course_id,category,element.replace("*", "")))
}

function make_btn(course_name, td, trIdx, course_id, category, value) {
  try {
    var content = `
            <div class="${
              category != "courses" ? "medium fluid ui button my-button" : ""
            } " id="button-${category}-${trIdx}-${value}">
             ${value}
            </div>
            `;
    if (category == "courses") {
      td.querySelector("a").appendChild(htmlToElem(content));
      // if (!$(td).children(".ips").length) $(td).find("br").remove();
    } else td.appendChild(htmlToElem(content));
  } catch {
    console.log("😵");
  }
  $(`#button-${category}-${trIdx}-${value}`)
    .mouseenter(function () {
      // filter data
      // $(`#popup`).removeClass("visible").addClass("hidden");
      if (category == "professors") {
        var value = $(this)[0].innerText;
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
        var value = $(this)[0].innerText;
        var prof_data = get_info(value, category);
        if (Array.isArray(Object.values(prof_data)[0][0]))
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
          // make_btn(course_name, td, trIdx, course_id, "courses");
          var course_data = get_info(course_id, "courses");
          if (
            course_data[course_id].length > 1 &&
            course_data[course_id][3]["課程名稱"] == course_name
          )
            $(td).append(`<div class="ui labels my-labels">
                        ${formatter("courses", course_data)}</div>`);
          else $(td).append(`<div class="my-course-label">找不到資料🥺</div>`);
        }
        if (tdIdx == 6) {
          td2btn(course_name, td, trIdx, course_id, "professors");
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
