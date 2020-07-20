
// Map of (agentId -> username)
username_map = new Map();
// Map of (address -> mailItem)
mail_map = new Map();

//file_map = new Map();

myHandle = '<unknown>';

g_currentFolder = '';
g_currentMailItem = {};
g_manifest = null;
g_getChunks = [];

function onUploadClick() {
  const fileInput = document.getElementById('file-input');
  fileInput.click();
}

function readSingleFile(e) {
  console.log('readSingleFile: ' + JSON.stringify(e));
  const file = e.target.files[0];
  if (!file) {
    return;
  }
  console.log('file: ' + JSON.stringify(file));
  // Not supported in Safari for iOS.
  const name = file.name ? file.name : 'NOT SUPPORTED';
  // Not supported in Firefox for Android or Opera for Android.
  const type = file.type ? file.type : 'NOT SUPPORTED';
  // Unknown cross-browser support.
  const size = file.size ? file.size : 'NOT SUPPORTED';
  console.log({file, name, type, size});

  let fileList = document.getElementById('fileList');
  let items = fileList.items ? fileList.items : [];
  console.log({items});

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    const fileContent = {
      name, type, size, content
    }
    mail_map.set(name, fileContent)
    items.push(fileContent)
    //console.log(contents);
  };
  reader.readAsBinaryString(file);
}

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
    if (isMailDeleted(mailItem) && selectedBox !== systemFolders.TRASH) {
      continue;
    }
    if (is_OutMail(mailItem) && selectedBox === systemFolders.INBOX) {
      continue;
    }
    if (!is_OutMail(mailItem) && selectedBox === systemFolders.SENT) {
      continue;
    }
    items.push(into_gridItem(mailItem));
  }
  mailGrid.items = items;
}

var g_chunkList = [];
var g_fileList = [];

// Calback for writeChunk
function chunkResult(callResult) {
  console.log('chunkResult: ' + JSON.stringify(callResult))
  let chunkAddress = callResult.Ok;
  g_chunkList.push(chunkAddress);
}

// Calback for writeManifest
function manifestResult(callResult) {
  console.log('manifestResult: ' + JSON.stringify(callResult))
  let manifestAddress = callResult.Ok;
  g_fileList.push(manifestAddress);
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
  resetRecepients().then(function() {
    const debugMenu = document.querySelector('#DebugBar');
    debugMenu.items[0].disabled = false;
    debugMenu.render();
  });
}

const redDot = String.fromCodePoint(0x1F534);
const greenDot = String.fromCodePoint(0x1F7E2);

var hasPingResult = false;
var isAgentOnline = false;

async function resetRecepients() {
  const contactGrid = document.querySelector('#contactGrid');
  let items = [];
  for (entry of username_map.entries()) {
    username_map.set(handleItem[1], handleItem[0]);
    hasPingResult = false;
    isAgentOnline = false;
    pingAgent(entry[0], pingResult, handleSignal);
    while (!hasPingResult) {
      await sleep(10)
    }
    let item = { "username": entry[1], "agentId": entry[0], "recepientType": '',
      status: isAgentOnline? greenDot : redDot
    };
    items.push(item);
  }
  contactGrid.items = items;
  contactGrid.selectedItems = [];
  contactGrid.activeItem = null;
  contactGrid.render();
}

function pingResult(callResult) {
  isAgentOnline = callResult.Ok;
  hasPingResult = true;
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