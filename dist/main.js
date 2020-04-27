/**
 * @param callResult
 */
function show_handle(callResult) {
  var span = document.getElementById('output');
  span.textContent = ' ' + callResult.Ok;
}

function setMyHandle() {
  let input = document.getElementById('myNewHandleInput');
  console.log('new handle = ' + input.value);
  setHandle(input.value, console.log);
  show_handle({ Ok: input.value});
  input.value = '';
}


function handle_all_mails(callResult) {
  const mailGrid = document.querySelector('#mailGrid');
  let mailList = callResult.Ok;
  let items = []
  for (mailItem of mailList) {
    let item = {
      "username": mailItem.author, "subject": mailItem.subject, "date": mailItem.date,
    };
    items.push(item);
  }
  mailGrid.items = items;
}

function handle_handles(callResult) {
  const contactGrid = document.querySelector('#contactGrid');
  let handleList = callResult.Ok;
  let items = []
  for (handleItem of handleList) {
    // FIXME: exclude self from list
    let item = { "username": handleItem[0], "agentId": handleItem[1] };
    items.push(item);
  }
  contactGrid.items = items;
}