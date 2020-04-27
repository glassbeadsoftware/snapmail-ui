
username_map = new Map();
mail_map = new Map();

function log_result(callResult) {
  console.log('callResult = ' + JSON.stringify(callResult));
}

function show_handle(callResult) {
  var span = document.getElementById('handleDisplay');
  span.textContent = ' ' + callResult.Ok;
}

function setMyHandle() {
  let input = document.getElementById('myNewHandleInput');
  console.log('new handle = ' + input.value);
  setHandle(input.value, console.log);
  show_handle({ Ok: input.value});
  input.value = '';
}


function handle_mails(callResult) {
  const mailGrid = document.querySelector('#mailGrid');
  let mailList = callResult.Ok;
  let items = []
  mail_map.clear()
  for (mailItem of mailList) {
    mail_map.set(mailItem.date, mailItem)
    let username = username_map.get(mailItem.author)
    let item = {
      "username": username, "subject": mailItem.mail.subject, "date": mailItem.date,
    };
    items.push(item);
  }
  mailGrid.items = items;
}



function handle_handles(callResult) {
  const contactGrid = document.querySelector('#contactGrid');
  let handleList = callResult.Ok;
  let items = []
  username_map.clear()
  for (handleItem of handleList) {
    // FIXME: exclude self from list
    username_map.set(handleItem[1], handleItem[0])
    let item = { "username": handleItem[0], "agentId": handleItem[1] };
    items.push(item);
  }
  contactGrid.items = items;
}