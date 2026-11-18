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
    // data = urschool 的一筆老師資料；跳過 姓名／授課系所／職稱（已在卡片標題）
    var score = ["私心推薦", "學到東西", "口條好", "給分甜度"];
    for (var i = 3; i < 9; i++) {
      var item = window.profs_items[i];
      if (data[i] == null) continue;
      var value = String(data[i]).replace(" ★", "");
      content += `<p class="prof-row"><b>${item}</b><span>`;
      if (score.includes(item)) content += color_text(value, false);
      else if (item == "課業壓力") content += color_text(value, true);
      else content += shorten_string(value, 9);
      content += "</span></p>";
    }
    if (!content) content = `<p class="prof-empty">UR School 上還沒有評分</p>`;
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
function fillin_popup(name, entry, course_name) {
  var meta = entry ? [entry[1], entry[2]].filter((x) => x).join(" · ") : "";
  var body = entry
    ? formatter("professors", entry)
    : `<p class="prof-empty">UR School 沒有這位老師的資料🥺</p>`;
  $("#popup > .content").html(`
      <div class="header">${name}</div>
      <div class="meta prof-meta">${meta || shorten_string(course_name, 14)}</div>
      <div class="description">${body}</div>
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

// 從 urschool 找老師；同名的老師有好幾位時，優先用有評分的那筆
function find_professor(name) {
  var entries = ((window.json_data["urschool"] || {})["professors"] || {})[name];
  if (!Array.isArray(entries) || !entries.length) return null;
  return entries.find((e) => e[3] != null) || entries[0];
}
// 老師欄位 → [{ name, main }]，格式像「王小明*<br>李大華<br>…」，* 為主負責老師
function parse_professors(td) {
  return td.innerHTML
    .split(/<br\s*\/?>|\n|、/)
    .map((html) => $("<div>").html(html).text().trim())
    .filter((text) => text)
    .map((text) => ({ name: text.replace(/\*/g, "").trim(), main: text.includes("*") }));
}
var PROF_COLLAPSE_OVER = 4; // 超過這麼多位老師就收合
var PROF_SHOW_WHEN_COLLAPSED = 3;
function professor_chip(prof, course_name) {
  var entry = find_professor(prof.name);
  var rated = entry && entry[3] != null;
  var badge = rated
    ? `<span class="prof-score">${color_text(String(entry[3]).replace(" ★", ""), false)}</span>`
    : "";
  var chip = $(
    `<span class="prof-chip${prof.main ? " prof-main" : ""}${entry ? "" : " prof-none"}">${prof.name}${badge}</span>`,
  );
  chip
    .mouseenter(() => fillin_popup(prof.name, entry, course_name))
    .mouseleave(() => $("#popup").removeClass("visible").addClass("hidden"));
  return { chip, rated };
}
function render_professors(td, course_name) {
  var profs = parse_professors(td);
  if (!profs.length) return;
  var chips = profs.map((p) => ({ main: p.main, ...professor_chip(p, course_name) }));
  // 主負責老師 → 有評分 → 沒評分，同一組內維持原本順序
  var rank = (c) => (c.main ? 0 : c.rated ? 1 : 2);
  chips = chips.map((c, i) => ({ ...c, i })).sort((a, b) => rank(a) - rank(b) || a.i - b.i);

  var list = $(`<div class="prof-list"></div>`);
  chips.forEach((c) => list.append(c.chip));
  if (chips.length > PROF_COLLAPSE_OVER) {
    var hidden = chips.slice(PROF_SHOW_WHEN_COLLAPSED).map((c) => c.chip);
    hidden.forEach((chip) => chip.addClass("prof-extra"));
    var more = $(`<span class="prof-more">+${hidden.length} 位</span>`);
    more.click(() => {
      var open = list.toggleClass("prof-open").hasClass("prof-open");
      more.text(open ? "收合" : `+${hidden.length} 位`);
    });
    list.append(more);
  }
  $(td).removeClass("sm").empty().append(list);
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
          render_professors(td, course_name);
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
