
// Map of (agentId -> username)
username_map = new Map();
// Map of (address -> mailItem)
mail_map = new Map();

myHandle = '<unknown';

// Generic callback: log response
function logResult(callResult) {
  console.log('callResult = ' + JSON.stringify(callResult));
}

// Callback for getMyHandle()
function showHandle(callResult) {
  var span = document.getElementById('handleDisplay');
  span.textContent = ' ' + callResult.Ok;
  myHandle = callResult.Ok;
}

function setMyHandle() {
  let input = document.getElementById('myNewHandleInput');
  console.log('new handle = ' + input.value);
  setHandle(input.value, console.log);
  showHandle({ Ok: input.value});
  input.value = '';
  setChangeHandleHidden(true)
}

function allowChangeHandle() {
  setChangeHandleHidden(false)
}

function cancelMyHandle() {
  setChangeHandleHidden(true)
}

function setChangeHandleHidden(hidden) {
  let handleButton = document.getElementById('handleDisplay');
  handleButton.hidden = !hidden;
  let handleInput = document.getElementById('myNewHandleInput');
  handleInput.hidden = hidden;
  let updateButton = document.getElementById('setMyHandleButton');
  updateButton.hidden = hidden;
  let cancelButton = document.getElementById('cancelHandleButton');
  cancelButton.hidden = hidden;
  if (hidden) {
    handleInput.value = ''
  } else {
    handleInput.value = myHandle
  }
}


// Callback for getAllMails()
function handleMails(callResult) {
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
function handleHandleList(callResult) {
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
