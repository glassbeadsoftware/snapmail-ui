
// Map of (agentId -> username)
username_map = new Map();
// Map of (address -> mailItem)
mail_map = new Map();

myHandle = '<unknown>';
g_currentFolder = '';
g_currentMailItem = {};

// Generic callback: log response
function logResult(callResult) {
  console.log('callResult = ' + JSON.stringify(callResult));
}

// Callback for getMyHandle()
function showHandle(callResult) {
  var handleButton = document.getElementById('handleText');
  handleButton.textContent = ' ' + callResult.Ok;
  myHandle = callResult.Ok;
}

function setMyHandle() {
  let input = document.getElementById('myNewHandleInput');
  console.log('new handle = ' + input.value);
  setHandle(input.value, console.log, handleSignal);
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
  if (!hidden && myHandle !== '<noname>') {
    handleInput.value = myHandle
  } else {
    handleInput.value = ''
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
    // Determine if should add to grid
    if (isMailDeleted(mailItem) && selectedBox !== 'Trash') {
      continue;
    }
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
  }
  resetRecepients();
}

function resetRecepients() {
  const contactGrid = document.querySelector('#contactGrid');
  let items = [];
  for (entry of username_map.entries()) {
    username_map.set(handleItem[1], handleItem[0])
    let item = { "username": entry[1], "agentId": entry[0], "recepientType": '' };
    items.push(item);
  }
  contactGrid.items = items;
  contactGrid.selectedItems = [];
  contactGrid.activeItem = null;
  contactGrid.render();
}

// -- Signal -- //

function handleSignal(signalwrapper) {
  if (signalwrapper.signal.signal_type !== "User") {
    return;
  }
  switch (signalwrapper.signal.name) {
    case "received_mail": {
      let itemJson = signalwrapper.signal.arguments;
      let item = JSON.parse(itemJson).ReceivedMail;
      console.log("Received MailItem: " + JSON.stringify(item));
      const notification = document.querySelector('#notifyMail');
      notification.open();
      getAllMails(handleMails, update_fileBox, handleSignal)
      break;
    }
    case "received_ack": {
      let itemJson = signalwrapper.signal.arguments;
      let item = JSON.parse(itemJson).ReceivedAck;
      console.log("Received Ack: " + JSON.stringify(item))
      const notification = document.querySelector('#notifyAck');
      notification.open();
      getAllMails(handleMails, update_fileBox, handleSignal)
      break;
    }
  }
}
