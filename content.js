console.log("Injecct!!");
if ($("table.table").length > 0) {
  $("table.table > tbody  > tr:visible").each(function (trIdx, tr) {
      // style="margin: 0; border: none;"
    $(tr)
      .find("td")
      .each(function (tdIdx, td) {
        $(td).addClass("ui segment");
        if (tdIdx == 6) {
          td.innerHTML =
            `<div class="ui useless button" id="` +
            trIdx +
            `">` +
            td.innerHTML +
            `</div>
              <div class="ui flowing popup top left transition" id="` +
            trIdx +
            `">
            <div class='header'>User Rating</div><div class='content'><div class='ui star rating'><i class='active icon'></i><i class='active icon'></i><i class='active icon'></i><i class='active icon'></i><i class='active icon'></i></div></div>
            `;
          $(".ui.useless.button#" + trIdx).popup({
            popup: "ui.flowing.popup#" + trIdx,
          });
          console.log("excuted");
          td.addEventListener(
            "mouseover",
            function (event) {
              // highlight the mouseover target  style="display:none"
              $(".ui.useless.button#" + trIdx).popup('show');
            },
            false
          );
        }
      });
  });
}
