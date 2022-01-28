console.log("🤖🆙");

if ($("table.table").length > 0) {
  $("table.table > tbody  > tr:visible").each(function (trIdx, tr) {
    $(tr)
      .find("td")
      .each(function (tdIdx, td) {
        if (tdIdx == 6) {
          $(td).removeClass("sm"); //.addClass("ui segment").css("position", "list-item");
          td.innerHTML = `
          <div class="main ui container">
          <div class="ui tab active">
            <div class="ui button" id="${trIdx}">
             ${td.innerHTML}
            </div>
            <div class="ui popup transition hidden" id="${
              trIdx + 1000
            }">
              <div class="header">User Rating</div>
                <div class="content"><div class="ui star rating"><i class="active icon"></i><i class="active icon"></i><i class="active icon"></i><i class="active icon"></i><i class="active icon"></i></div>
              </div>
            </div>
          </div>
          </div>`;
          $(`.button#${trIdx}`).popup({
            popup: $(`.popup#${trIdx + 1000}`),
            on: "hover",
            inline:true,
            minWidth:50,
          });
          td.addEventListener(
            "mouseover",
            function (event) {
              // highlight the mouseover target
              $(`.popup#${trIdx + 1000}`).removeClass("hidden").css("position","absolute");
            },
            false
          );
        }
      });
  });
}
