
// Map of (agentId -> username)
username_map = new Map();
// Map of (address -> mailItem)
mail_map = new Map();

// Generic callback: log response
function log_result(callResult) {
  console.log('callResult = ' + JSON.stringify(callResult));
}

// Callback for getMyHandle()
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

// Callback for getAllMails()
function handle_mails(callResult) {
  let mailGrid = document.querySelector('#mailGrid');
  let mailList = callResult.Ok;
  let items = []
  mail_map.clear()
  const folderBox = document.querySelector('#fileboxFolder');
  let selectedBox = folderBox.value;
  for (mailItem of mailList) {
    mail_map.set(mailItem.address, mailItem)
    if (is_OutMail(mailItem) && selectedBox === 'Inbox') {
      continue;
    }
    if (!is_OutMail(mailItem) && selectedBox === 'Outbox') {
      continue;
    }
    items.push(into_gridItem(mailItem));
  }
  mailGrid.items = items;
}


// Calback for getAllHandles()
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