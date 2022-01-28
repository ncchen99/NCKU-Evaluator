console.log("🤖🆙");

if ($("table.table").length > 0) {
  $("table.table > thead  > tr > th:nth-child(7)")[0].style.width = "11%";
  $("table.table > tbody  > tr:visible").each(function (trIdx, tr) {
    $(tr)
      .find("td")
      .each(function (tdIdx, td) {
        if (tdIdx == 6) {
          $(td).removeClass("sm"); //.addClass("ui segment").css("position", "list-item");
          td.innerHTML = `
            <div class="medium fluid ui button my-button" id="button${trIdx}">
             ${td.innerHTML}
            </div>
            <div class="ui popup flowing bottom left transition hidden my-popup" id="popup${trIdx}">
            <div class='header'>User Rating</div><div class='content'><div class='ui star rating'><i class='active icon'></i><i class='active icon'></i><i class='active icon'></i><i class='active icon'></i><i class='active icon'></i></div></div>
            </div>`;
          $(`.button#button${trIdx}`)
            .mouseenter(function () {
              // highlight the mouseover target
              var rect = $(`.button#button${trIdx}`)[0].getBoundingClientRect();
              $(`.popup#popup${trIdx}`)
                .removeClass("hidden")
                .addClass("visible");
              $(`.popup#popup${trIdx}`)
                .css("top", rect.bottom - document.body.getBoundingClientRect().top)
                .css("left",rect.left); //
            })
            .mouseleave(function () {
              // highlight the mouseover target
              $(`.popup#popup${trIdx}`)
                .removeClass("visible")
                .addClass("hidden");
            });
        }
      });
  });
}
