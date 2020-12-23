import '@vaadin/vaadin-button';
import '@vaadin/vaadin-grid';
import '@vaadin/vaadin-item';
import '@vaadin/vaadin-upload';
import '@vaadin/vaadin-upload/vaadin-upload.js';
import '@vaadin/vaadin-text-field';
import '@vaadin/vaadin-ordered-layout';
import '@vaadin/vaadin-menu-bar';
// import '@vaadin/vaadin-list-box';
import '@vaadin/vaadin-split-layout';
import '@vaadin/vaadin-combo-box';
import '@vaadin/vaadin-text-field/vaadin-text-area';
import '@vaadin/vaadin-grid/vaadin-grid-column-group';
import '@vaadin/vaadin-grid/vaadin-grid-filter';
import '@vaadin/vaadin-grid/vaadin-grid-filter-column';
import '@vaadin/vaadin-grid/vaadin-grid-tree-toggle';
import '@vaadin/vaadin-grid/vaadin-grid-selection-column';
import '@vaadin/vaadin-grid/vaadin-grid-sort-column';
import '@vaadin/vaadin-grid/vaadin-grid-sorter';
import '@vaadin/vaadin-icons';
import '@vaadin/vaadin-icons/vaadin-icons';
import '@vaadin/vaadin-lumo-styles';
import '@vaadin/vaadin-lumo-styles/icons';
import '@vaadin/vaadin-notification';
//import '@vaadin-component-factory/vcf-tooltip';

import {AdminWebsocket, AppWebsocket} from '@holochain/conductor-api';

//import * from './app'
//import * as DNA from './hc_bridge'
//import * as DNA from './rsm_bridge'
import {sha256, arrayBufferToBase64, base64ToArrayBuffer, splitFile, sleep, base64regex} from './utils'
import {systemFolders, isMailDeleted, determineMailClass, into_gridItem, into_mailText, is_OutMail} from './mail'


// -- CONNECT TO ADMIN -- //

const TIMEOUT = 6000

const ADMIN_PORT = 1234
const APP_PORT = 8888

/**
 *
 */
const printAdmin = () => {
  g_adminWs.listDnas().then((dnaList) => {
    console.log({dnaList})
  })
  g_adminWs.listCellIds().then((cellList) => {
    console.log({cellList})
  })
  g_adminWs.listActiveApps().then((appList) => {
    console.log({appList})
  })
}

var g_adminWs = undefined;
var g_newKey = undefined;
AdminWebsocket.connect(`ws://localhost:${ADMIN_PORT}`, TIMEOUT).then((adminWs) => {
  g_adminWs = adminWs
  adminWs.generateAgentPubKey().then((newKey) => {
    g_newKey = newKey
    console.log({newKey})

    printAdmin()
  })
})

// -- CONNECT TO APP -- //

const receiveSignal = (signal/*: AppSignal*/) => {
  // impl...
  console.log({signal})
  resolve()
}

var g_appId = undefined
var g_cellId = undefined
var g_cellNick = undefined
var g_appClient = undefined
AppWebsocket.connect(`ws://localhost:${APP_PORT}`, TIMEOUT, receiveSignal).then((appClient) => {
  g_appClient = appClient
  console.log('*** Connected to Snapmail app: ' + JSON.stringify(appClient))
  appClient.appInfo({ installed_app_id: 'test-app' }, 1000).then((appInfo) => {
    console.log({appInfo})
    g_cellId = appInfo.cell_data[0][0];
    console.log({g_cellId})
    dumpState(g_cellId)

    appClient.callZome({
      cap: null,
      cell_id: g_cellId,
      zome_name: 'snapmail',
      fn_name: 'get_my_handle',
      provenance: g_newKey,
      payload: null,
    }, 30000).then((result) => {
      console.log('get_my_handle() result')
      console.log({result})
    })
  })
})

/**
 *
 */
const dumpState = (cellId) => {
  g_adminWs.dumpState({cell_id: cellId}).then((stateDump) => {
    console.log('stateDump of cell:')
    console.log({stateDump})
  })
}
//module.exports.dumpState = dumpState;


//---------------------------------------------------------------------------------------------------------------------
// DEBUG MODE
//---------------------------------------------------------------------------------------------------------------------

if (process.env.NODE_ENV === 'prod') {
  console.log = () => {};
}

/**
 * Setup recurrent handle and mail fetchs
 */
//var myVar = setInterval(onLoop, 1000);
// function onLoop() {
//   getAllHandles(handleHandleList)
//   getAllMails(handleMails, update_fileBox)
// }


//---------------------------------------------------------------------------------------------------------------------
// Globals
//---------------------------------------------------------------------------------------------------------------------

const redDot   = String.fromCodePoint(0x1F534);
const greenDot = String.fromCodePoint(0x1F7E2);

var g_hasAttachment = 0;
var g_hasPingResult = false;
var g_isAgentOnline = false;
var g_chunkList = [];
var g_fileList = [];

// Map of (agentId -> username)
var g_username_map = new Map();
// Map of (address -> mailItem)
var g_mail_map = new Map();

var g_myHandle = '<unknown>';
var g_currentFolder = '';
var g_currentMailItem = {};
var g_manifest = null;
var g_getChunks = [];

//---------------------------------------------------------------------------------------------------------------------
// App
//---------------------------------------------------------------------------------------------------------------------

/**
 * Set on load
 */
window.addEventListener('load', () => {
  initUi();
});


/**
 * Wrapper for dna call GetAllMails that throttles calls with a manual mutex
 */
var canGetAllMutex = true;
function callGetAllMails() {
  if (!canGetAllMutex) {
    return;
  }
  canGetAllMutex = false;
  DNA.getAllMails(handle_getAllMails, update_fileBox, handleSignal);
}

// -- Signal -- //

function handleSignal(signalwrapper) {
  if (signalwrapper.type !== undefined && signalwrapper.type !== "InstanceSignal") {
    return;
  }
  if (signalwrapper.signal.signal_type !== "User") {
    return;
  }
  switch (signalwrapper.signal.name) {
    case "received_mail": {
      let itemJson = signalwrapper.signal.arguments;
      let item = JSON.parse(itemJson).ReceivedMail;
      console.log("received_mail: " + JSON.stringify(item));
      const notification = document.querySelector('#notifyMail');
      notification.open();
      callGetAllMails();
      break;
    }
    case "received_ack": {
      let itemJson = signalwrapper.signal.arguments;
      let item = JSON.parse(itemJson).ReceivedAck;
      console.log("received_ack: " + JSON.stringify(item))
      const notification = document.querySelector('#notifyAck');
      notification.open();
      callGetAllMails();
      break;
    }
    case "received_file": {
      let itemJson = signalwrapper.signal.arguments;
      let item = JSON.parse(itemJson).ReceivedFile;
      console.log("received_file: " + JSON.stringify(item))
      const notification = document.querySelector('#notifyFile');
      notification.open();
      break;
    }
  }
}

// -- INIT -- //

/**
 *
 */
function initUi() {
  setState_ChangeHandleBar(true);
  initTitleBar();
  initMenuBar();
  initFileBox();
  initInMail();
  initOutMailArea();
  initActionBar();
  initUpload();
  // getMyAgentId(logResult)
  initNotification();
  initDna();
  // -- init progress bar -- //
  const sendProgressBar = document.querySelector('#sendProgressBar');
  sendProgressBar.style.display = "none";
}

/**
 *
 */
function initUpload() {
  customElements.whenDefined('vaadin-upload').then(function() {
    const upload = document.querySelector('vaadin-upload');

    upload.addEventListener('file-reject', function(event) {
      window.alert(event.detail.file.name + ' error: ' + event.detail.error);
    });

    // upload.addEventListener('files-changed', function(event) {
    //   //console.log('files-changed event: ', JSON.stringify(event.detail));
    //   console.log('files-changed event: ');
    //   const detail = event.detail;
    //   console.log({detail});
    // });

    upload.addEventListener('upload-before', function(event) {
      //console.log('upload-before event: ', JSON.stringify(event.detail.file));
      const file = event.detail.file;
      const xhr = event.detail.xhr;
      console.log('upload-before event: ');
      // console.log({file});
      // console.log({xhr});

      event.preventDefault(); // Prevent the upload request

      var reader = new FileReader();
      reader.onload = function(e) {
        console.log('FileReader onload event: ');
        const content = arrayBufferToBase64(e.target.result); // reader.result
        if (!base64regex.test(content)) {
          const invalid_hash = sha256(content);
          console.error("File '" + file.name + "' is invalid base64. hash is: " + invalid_hash);
        }
        console.log({e});
        console.log('file: ' + file.name + ' ; size: ' + Math.ceil(content.length / 1024) + ' KiB ; type: ' + file.type);

        upload.set(['files', upload.files.indexOf(file), 'progress'], 100)
        upload.set(['files', upload.files.indexOf(file), 'complete'], true)
        upload.set(['files', upload.files.indexOf(file), 'content'], content)
      };
      reader.readAsArrayBuffer(event.detail.file);
    });

    // upload.addEventListener('upload-request', function(event) {
    //   //console.log('upload-request event: ', JSON.stringify(event.detail));
    //   const files = upload.files;
    //   console.log('upload-request event: ');
    //   console.log({event});
    //   //console.log({files});
    //   event.preventDefault();
    //   let xhr = event.detail.xhr;
    //   console.log({xhr});
    //   let file = event.detail.file;
    //   xhr.send(file);
    // });
  });
}


/**
 *
 */
function initNotification() {
  //  -- Mail
  let notification = document.querySelector('#notifyMail');
  notification.renderer = function(root) {
    // Check if there is a content generated with the previous renderer call not to recreate it.
    if (root.firstElementChild) {
      return;
    }
    const container = window.document.createElement('div');
    const boldText = window.document.createElement('b');
    boldText.textContent = 'New Mail Received';
    container.appendChild(boldText);
    root.appendChild(container);
  };
  // -- Ack
  notification = document.querySelector('#notifyAck');
  notification.renderer = function(root) {
    // Check if there is a content generated with the previous renderer call not to recreate it.
    if (root.firstElementChild) {
      return;
    }
    const container = window.document.createElement('div');
    const boldText = window.document.createElement('b');
    boldText.textContent = 'Notice: ';
    const plainText = window.document.createTextNode('Acknowledgement Received');
    container.appendChild(boldText);
    container.appendChild(plainText);
    root.appendChild(container);
  };
  // -- File
  notification = document.querySelector('#notifyFile');
  notification.renderer = function(root) {
    // Check if there is a content generated with the previous renderer call not to recreate it.
    if (root.firstElementChild) {
      return;
    }
    const container = window.document.createElement('div');
    const boldText = window.document.createElement('b');
    boldText.textContent = 'Notice: ';
    const plainText = window.document.createTextNode('File Received');
    container.appendChild(boldText);
    container.appendChild(plainText);
    root.appendChild(container);
  };
}


/**
 *
 */
function initDna() {
  console.log('initDna()');
  // -- App Bar -- //
  DNA.getMyHandle(showHandle, handleSignal);
  // -- FileBox -- //
  DNA.checkIncomingAck(logCallResult, handleSignal);
  DNA.checkIncomingMail(logCallResult, handleSignal);
  callGetAllMails();
  // -- ContactList -- //
  DNA.getAllHandles(handle_getAllHandles, handleSignal);
  // After
  const handleButton = document.getElementById('handleText');
  DNA.findAgent(handleButton.textContent, handle_findAgent, handleSignal);
}


/**
 *
 */
function initTitleBar() {
  // Title bar buttons
  customElements.whenDefined('vaadin-button').then(function() {
    let button = document.querySelector('#setMyHandleButton');
    button.addEventListener('click', () => {
      let input = document.getElementById('myNewHandleInput');
      console.log('new handle = ' + input.value);
      DNA.setHandle(input.value, console.log, handleSignal);
      showHandle({ Ok: input.value});
      input.value = '';
      setState_ChangeHandleBar(true);
    });
    button = document.querySelector('#handleDisplay');
    button.addEventListener('click', () => {
      setState_ChangeHandleBar(false)
    });
    button = document.querySelector('#cancelHandleButton');
    button.addEventListener('click', () =>{
      setState_ChangeHandleBar(true)
    });
  });
}

/**
 *
 * @returns {Promise<void>}
 */
async function resetRecepients() {
  const contactGrid = document.querySelector('#contactGrid');
  let items = [];
  for (let entry of g_username_map.entries()) {
    //g_username_map.set(entry[1], entry[0]);
    g_hasPingResult = false;
    g_isAgentOnline = false;
    DNA.pingAgent(entry[0], handle_pingAgent, handleSignal);
    while (!g_hasPingResult) {
      await sleep(10)
    }
    let item = { "username": entry[1], "agentId": entry[0], "recepientType": '',
      status: g_isAgentOnline? greenDot : redDot
    };
    items.push(item);
  }
  contactGrid.items = items;
  contactGrid.selectedItems = [];
  contactGrid.activeItem = null;
  contactGrid.render();
}

function initMenuBar() {
  // Menu -- vaadin-menu-bar
  const menu = document.querySelector('#MenuBar');
  menu.items =
    [ { text: 'Move', disabled: true }
    , { text: 'Reply', disabled: true, children: [{ text: 'One' }, { text: 'All' }, { text: 'Fwd' }] }
    , { text: 'Trash', disabled: true }
    , { text: 'Print', disabled: true }
    , { text: 'Find', disabled: true }
    , { text: 'Refresh' }
    ];

  menu.addEventListener('item-selected', function(e) {
    console.log(JSON.stringify(e.detail.value));
    if (e.detail.value.text === 'Trash') {
      DNA.deleteMail(g_currentMailItem.id, handle_deleteMail, handleSignal);
      setState_DeleteButton(true)
    }
    if (e.detail.value.text === 'Refresh') {
      console.log('Refresh called');
      DNA.checkIncomingAck(logCallResult, handleSignal);
      DNA.checkIncomingMail(logCallResult, handleSignal);
      callGetAllMails();
    }
  });
}


/**
 *
 */
function update_mailGrid(folder) {
  const grid = document.querySelector('#mailGrid');
  let folderItems = [];
  console.log('update_mailGrid: ' + folder);
  switch(folder) {
    case systemFolders.ALL:
      for (let mailItem of g_mail_map.values()) {
        //folderItems = Array.from(g_mail_map.values());
        folderItems.push(into_gridItem(g_username_map, mailItem));
      }
      break;
    case systemFolders.INBOX:
    case systemFolders.SENT:
      for (let mailItem of g_mail_map.values()) {
        //console.log('mailItem: ' + JSON.stringify(mailItem))
        let is_out = is_OutMail(mailItem);
        if (isMailDeleted(mailItem)) {
          continue;
        }
        if (is_out && folder == systemFolders.SENT) {
          folderItems.push(into_gridItem(g_username_map, mailItem));
          continue;
        }
        if (!is_out && folder == systemFolders.INBOX) {
          folderItems.push(into_gridItem(g_username_map, mailItem));
        }
      }
      break;
    case systemFolders.TRASH: {
      for (let mailItem of g_mail_map.values()) {
        if(isMailDeleted(mailItem)) {
          folderItems.push(into_gridItem(g_username_map, mailItem));
        }
      }
    }
      break;
    default:
      console.error('Unknown folder')
  }
  const span = document.querySelector('#messageCount');
  console.assert(span);
  span.textContent = folderItems.length;
  console.log('folderItems count: ' + folderItems.length);
  // console.log('folderItems: ' + JSON.stringify(folderItems))
  grid.items = folderItems;
  grid.render();
}


/**
 *
 */
function initFileBox() {
  // Combobox -- vaadin-combo-box
  const systemFoldersVec = [systemFolders.ALL, systemFolders.INBOX, systemFolders.SENT, systemFolders.TRASH];
  const folderBoxAll = document.querySelector('#fileboxFolder');
  folderBoxAll.items = systemFoldersVec;
  folderBoxAll.value = systemFoldersVec[1];
  g_currentFolder = folderBoxAll.value;
  const folderBox = document.querySelector('#fileboxFolder');
  // On value change
  folderBox.addEventListener('change', function(event) {
    update_mailGrid(event.target.value)
    g_currentFolder = event.target.value;
    setState_DeleteButton(true)
  });

  // Filebox -- vaadin-grid
  const mailGrid = document.querySelector('#mailGrid');
  mailGrid.items = [];
  mailGrid.multiSort = true;
  // Display bold if mail not acknowledged
  mailGrid.cellClassNameGenerator = function(column, rowData) {
    let classes = '';
    let mailItem = g_mail_map.get(rowData.item.id);
    console.assert(mailItem);
    classes += determineMailClass(mailItem);
    // let is_old = hasMailBeenOpened(mailItem);
    // //console.log('answer: ' + is_old);
    // if (!is_old) {
    //   classes += ' newmail';
    // }
    return classes;
  };

  // On item select: Display in inMailArea
  mailGrid.addEventListener('active-item-changed', function(event) {
    const item = event.detail.value;
    mailGrid.selectedItems = item ? [item] : [];
    if (item === null) {
      //getAllMails(handleMails, update_fileBox)
      return;
    }
    g_currentMailItem = item;
    console.log('mail grid item: ' + JSON.stringify(item));
    var span = document.getElementById('inMailArea');
    let mailItem = g_mail_map.get(item.id);
    console.log('mail item: ' + JSON.stringify(mailItem));
    span.value = into_mailText(g_username_map, mailItem);

    fillAttachmentGrid(mailItem.mail).then( function(missingCount) {
      if (missingCount > 0) {
        // TODO File
        // DNA.getMissingAttachments(mailItem.author, mailItem.address, handle_missingAttachments, handleSignal);
      }
      DNA.acknowledgeMail(item.id, handle_acknowledgeMail, handleSignal);
      // Allow delete button
      if (g_currentFolder !== systemFolders.TRASH) {
        setState_DeleteButton(false)
      }
    });
  });
}


/**
 *
 * @returns {Promise<number>}
 */
async function fillAttachmentGrid(mail) {
  let attachmentGrid = document.querySelector('#attachmentGrid');
  let items = [];
  const emoji = String.fromCodePoint(0x1F6D1);
  g_hasAttachment = 0;
  let missingCount = 0;
  for (let attachmentInfo of mail.attachments) {
    console.log({attachmentInfo});
    DNA.getManifest(attachmentInfo.manifest_address, handle_getManifest, handleSignal);
    while (g_hasAttachment === 0) {
      await sleep(10);
    }
    const hasAttachment = g_hasAttachment > 0;
    missingCount += 0 + !hasAttachment;
    let item = {
      "fileId": attachmentInfo.data_hash,
      "filename": attachmentInfo.filename,
      "filesize": Math.ceil(attachmentInfo.orig_filesize / 1024),
      "filetype": attachmentInfo.filetype,
      "status": hasAttachment? ' ' : emoji,
      "hasFile": hasAttachment,
    };
    items.push(item)
  }
  //console.log({items})
  attachmentGrid.items = items;
  attachmentGrid.selectedItems = [];
  attachmentGrid.activeItem = null;
  attachmentGrid.render();
  console.log({missingCount})
  return missingCount;
}

/**
 *
 */
function initInMail() {
  // inMailArea -- vaadin-text-item
  const inMailArea = document.querySelector('#inMailArea');
  inMailArea.value = '';
  initAttachmentGrid();
}

/**
 *
 */
function initAttachmentGrid() {
  /// attachmentGrid -- vaadin-grid
  const attachmentGrid = document.querySelector('#attachmentGrid');
  attachmentGrid.items = [];

  attachmentGrid.cellClassNameGenerator = function(column, rowData) {
    //console.log({rowData})
    let classes = '';
    if (!rowData.item.hasFile) {
      classes += ' pending';
    } else {
      //classes += ' newmail';
    }
    return classes;
  };

  /// On select, download attachment
  attachmentGrid.addEventListener('active-item-changed', function(event) {
    const item = event.detail.value;
    console.log({item})
    attachmentGrid.activeItem = null;
    attachmentGrid.selectedItems = [];

    if (!item || !item.hasFile) {
      return;
    }

    if (!attachmentGrid.selectedItems.includes(item)) {
      //attachmentGrid.selectedItems = [];
      item.status = String.fromCodePoint(0x23F3);
      attachmentGrid.selectedItems.push(item);
      item.disabled = true;
      attachmentGrid.render();
    }

    /// Get File on source chain
    // TODO File
    //  getFile(item.fileId).then(function(manifest) {
    //    console.log({ manifest })
    //    item.status = String.fromCodePoint(0x2714);
    //    //attachmentGrid.deselectItem(item);
    //    // DEBUG - check if content is valid base64
    //    if (!base64regex.test(manifest.content)) {
    //      const invalid_hash = sha256(manifest.content);
    //      console.error("File '" + manifest.filename + "' is invalid base64. hash is: " + invalid_hash);
    //    }
    //    let filetype = manifest.filetype;
    //    const fields = manifest.filetype.split(':');
    //    if (fields.length > 1) {
    //      const types = fields[1].split(';');
    //      filetype = types[0];
    //    }
    //    let byteArray = base64ToArrayBuffer(manifest.content)
    //    const blob = new Blob([byteArray], { type: filetype});
    //    const url = URL.createObjectURL(blob);
    //    const a = document.createElement('a');
    //    a.href = url;
    //    a.download = item.filename || 'download';
    //    a.addEventListener('click', {}, false);
    //    a.click();
    //    attachmentGrid.activeItem = null;
    //    attachmentGrid.selectedItems = [];
    //    attachmentGrid.render();
    //  });
  });
}

/**
 *
 *
async function getFile(fileId) {
  g_manifest = null;
  DNA.findManifest(fileId, handle_findManifest, handleSignal);
  while (g_manifest ==  null) {
    await sleep(10)
  }
  if (g_manifest.Ok === null) {
    return;
  }
  g_getChunks = [];
  let i = 0;
  for (let chunkAddress of g_manifest.chunks) {
    i++;
    DNA.getChunk(chunkAddress, handle_getChunk, handleSignal)
    while (g_getChunks.length !=  i) {
      await sleep(10)
    }
  }
  while (g_getChunks.length !=  g_manifest.chunks.length) {
    await sleep(10)
  }
  // concat chunks
  let content = '';
  for (let chunk of g_getChunks) {
    content += chunk;
  }
  // done
  g_manifest.content = content;
  return g_manifest;
}
*/

/**
 *
 */
function initOutMailArea() {
  // -- ContactsMenu -- vaadin-menu-bar
  const contactsMenu = document.querySelector('#ContactsMenu');
  contactsMenu.items = [{ text: 'Refresh' }];
  contactsMenu.addEventListener('item-selected', function(e) {
    console.log(JSON.stringify(e.detail.value));
    if (e.detail.value.text === 'Refresh') {
      contactsMenu.items[0].disabled = true;
      contactsMenu.render();
      DNA.getAllHandles(handle_getAllHandles, handleSignal);
    }
  });

  // -- contactGrid -- vaadin-grid
  const contactGrid = document.querySelector('#contactGrid');
  contactGrid.items = [];
  contactGrid.cellClassNameGenerator = function(column, rowData) {
    //console.log({rowData})
    let classes = rowData.item.status;
    if (column.path === 'status') {
      classes += ' statusColumn';
    }
    return classes;
  };
  // ON SELECT
  contactGrid.addEventListener('active-item-changed', function(event) {
    const item = event.detail.value;
    if (item && !contactGrid.selectedItems.includes(item)) {
      contactGrid.selectedItems.push(item);
    }
    setState_SendButton(contactGrid.selectedItems.length == 0);
  });
  // ON CLICK
  contactGrid.addEventListener('click', function(e) {
    const item = contactGrid.getEventContext(e).item;
    //contactGrid.selectedItems = item ? [item] : [];
    if (item) {
      // toggleRecepientType
      let nextType = '';
      switch(item.recepientType) {
        case '': nextType = 'to'; break;
        case 'to': nextType = 'cc'; break;
        case 'cc': nextType = 'bcc'; break;
        case 'bcc': nextType = ''; break;
        default: console.err('unknown recepientType');
      }
      item.recepientType = nextType;
      // --
      console.log('selectedItems size = ' + contactGrid.selectedItems.length);
      contactGrid.removeHeaderRow;
      contactGrid.render();
    }
  });
}

/**
 *
 */
function initActionBar() {
  // -- actionMenu -- vaadin-menu-bar
  const actionMenu = document.querySelector('#ActionBar');
  actionMenu.items = [
      { text: 'Clear' },
    //{ text: '+File', disabled: true },
      { text: 'Snap', disabled: true },
      { text: 'Send', disabled: true }
  ];
  // ON SELECT
  actionMenu.addEventListener('item-selected', function(e) {
    console.log('actionMenu: ' + JSON.stringify(e.detail.value.text))
    const outMailSubjectArea = document.querySelector('#outMailSubjectArea');
    const outMailContentArea = document.querySelector('#outMailContentArea');
    if (e.detail.value.text === 'Clear') {
      outMailSubjectArea.value = '';
      outMailContentArea.value = '';
      resetRecepients();
    }
    const sendProgressBar = document.querySelector('#sendProgressBar');
    sendProgressBar.style.display = "block";
    actionMenu.style.display = "none";
    const upload = document.querySelector('vaadin-upload');
    upload.style.display = "none";
    if (e.detail.value.text === 'Send') {
      sendAction().then(function() {
        sendProgressBar.style.display = "none";
        actionMenu.style.display = "block";
        upload.style.display = "block";
      });
    }
  });
}

/**
 * @returns {Promise<void>}
 */
async function sendAction() {
  // TODO file
  // /// Submit each attachment
  // const upload = document.querySelector('vaadin-upload');
  // const files = upload.files;
  // g_fileList = [];
  // for (let file of files) {
  //   if (!base64regex.test(file.content)) {
  //     const invalid_hash = sha256(file.content);
  //     console.error("File '" + file.name + "' is invalid base64. hash is: " + invalid_hash);
  //   }
  //   const parts = file.content.split(',');
  //   console.log("parts.length: " + parts.length)
  //   console.log({parts})
  //   const filetype = parts.length > 1? parts[0] : file.type;
  //   const splitObj = splitFile(parts[parts.length - 1]);
  //   g_chunkList = [];
  //   /// Submit each chunk
  //   for (var i = 0; i < splitObj.numChunks; ++i) {
  //     //console.log('chunk' + i + ': ' + fileChunks.chunks[i])
  //     DNA.writeChunk(splitObj.dataHash, i, splitObj.chunks[i], handle_writeChunk, handleSignal);
  //     while (g_chunkList.length !=  i + 1) {
  //       await sleep(10)
  //     }
  //   }
  //   while (g_chunkList.length < splitObj.numChunks) {
  //     await sleep(10);
  //   }
  //   DNA.writeManifest(splitObj.dataHash, file.name, filetype, file.size, g_chunkList, handle_writeManifest, handleSignal)
  // }
  // while (g_fileList.length < files.length) {
  //   await sleep(10);
  // }

  // Get contact Lists
  const contactGrid = document.querySelector('#contactGrid');
  const selection = contactGrid.selectedItems;
  console.log('selection: ' + JSON.stringify(selection));
  if (selection.length > 0) {
    let toList = [];
    let ccList = [];
    let bccList = [];
    // // Get recepients from contactGrid
    for (let contactItem of selection) {
      console.log('recepientType: ' + contactItem.recepientType);
      switch (contactItem.recepientType) {
        case '': break;
        case 'to': toList.push(contactItem.agentId); break;
        case 'cc': ccList.push(contactItem.agentId); break;
        case 'bcc': bccList.push(contactItem.agentId); break;
        default: console.err('unknown recepientType');
      }
    }
    // Create Mail
    const mail = {
      subject: outMailSubjectArea.value,
      payload: outMailContentArea.value,
      to: toList, cc: ccList, bcc: bccList,
      manifest_address_list: g_fileList
    };
    console.log('sending mail: ' + JSON.stringify(mail));
    // Send Mail
    DNA.sendMail(mail, logCallResult, handleSignal);
    // Update UI
    setState_SendButton(true);
    outMailSubjectArea.value = '';
    outMailContentArea.value = '';
    contactGrid.selectedItems = [];
    contactGrid.activeItem = null;
    resetRecepients();
    console.log('sendMail -> getAllMails');
    callGetAllMails();
    upload.files = [];
  } else {
    console.log('Send Mail Failed: No receipient selected')
  }
}


/**
 *
 */
function setState_ChangeHandleBar(hidden) {
  let handleButton = document.getElementById('handleDisplay');
  handleButton.hidden = !hidden;
  let handleInput = document.getElementById('myNewHandleInput');
  handleInput.hidden = hidden;
  let updateButton = document.getElementById('setMyHandleButton');
  updateButton.hidden = hidden;
  let cancelButton = document.getElementById('cancelHandleButton');
  cancelButton.hidden = hidden;
  if (!hidden && g_myHandle !== '<noname>') {
    handleInput.value = g_myHandle
  } else {
    handleInput.value = ''
  }
}

/**
 *
 */
function setState_SendButton(isDisabled) {
  let actionMenu = document.querySelector('#ActionBar');
  //actionMenu.items[1].disabled = isDisabled;
  actionMenu.items[2].disabled = isDisabled;
  actionMenu.render();
}

function setState_DeleteButton(isDisabled) {
  let menu = document.querySelector('#MenuBar');
  console.log('menu.items = ' + JSON.stringify(menu.items))
  menu.items[2].disabled = isDisabled;
  menu.render();
}

//---------------------------------------------------------------------------------------------------------------------
// Zome call Callbacks
//---------------------------------------------------------------------------------------------------------------------

/**
 * Generic callback: log response
 */
function logCallResult(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('Zome call failed:');
    console.error(err);
    return;
  }
  console.log('callResult = ' + JSON.stringify(callResult));
}

/**
 * Generic callback: Refresh my handle
 */
function showHandle(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('getMyHandle zome call failed');
    console.error(err);
    return;
  }
  var handleButton = document.getElementById('handleText');
  handleButton.textContent = '' + callResult.Ok;
  g_myHandle = callResult.Ok;
}


/**
 * On delete, refresh filebox
 */
function handle_deleteMail(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('deleteMail zome call failed');
    console.error(err);
    return;
  }
  // TODO check if call result succeeded
  callGetAllMails();
}


/**
 * Refresh g_mail_map and mailGrid
 */
function handle_getAllMails(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('getAllMails zome call failed');
    console.error(err);
    return;
  }
  let mailGrid = document.querySelector('#mailGrid');
  let mailList = callResult.Ok;
  let items = [];
  g_mail_map.clear();
  const folderBox = document.querySelector('#fileboxFolder');
  let selectedBox = folderBox.value;
  for (let mailItem of mailList) {
    g_mail_map.set(mailItem.address, mailItem);
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
    items.push(into_gridItem(g_username_map, mailItem));
  }

  console.log('mailCount = ' + items.length);
  mailGrid.items = items;
}
/**
 * Post callback for getAllMails()
 */
function update_fileBox() {
  const mailGrid = document.querySelector('#mailGrid');
  const activeItem = mailGrid.activeItem;
  console.log('update_fileBox ; activeItem = ' + JSON.stringify(activeItem))
  const folderBoxAll = document.querySelector('#fileboxFolder');
  update_mailGrid(folderBoxAll.value);

  if (activeItem) {
    let newActiveItem = null;
    for (let mailItem of mailGrid.items) {
      if(mailItem.id === activeItem.id) {
        newActiveItem = mailItem;
        break;
      }
    }
    mailGrid.selectItem(newActiveItem);
  }
  canGetAllMutex = true;
}


/**
 * Add chunk to chunkList
 */
function handle_writeChunk(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('writeChunk zome call failed');
    console.error(err);
    return;
  }
  let chunkAddress = callResult.Ok;
  g_chunkList.push(chunkAddress);
}

/**
 * Add manifest to fileList
 */
function handle_writeManifest(callResult) {
  //console.log('writeManifestResult: ' + JSON.stringify(callResult));
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('writeManifest zome call failed');
    console.error(err);
    return;
  }
  let manifestAddress = callResult.Ok;
  g_fileList.push(manifestAddress);
}


/**
 * Refresh g_username_map and recepients
 */
function handle_getAllHandles(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('getAllHandles zome call failed');
    console.error(err);
    return;
  }
  //const contactGrid = document.querySelector('#contactGrid');
  let handleList = callResult.Ok;
  g_username_map.clear();
  for (let handleItem of handleList) {
    // FIXME: exclude self from list
    g_username_map.set(handleItem[1], handleItem[0])
  }
  resetRecepients().then(function() {
    const contactsMenu = document.querySelector('#ContactsMenu');
    contactsMenu.items[0].disabled = false;
    contactsMenu.render();
  });
}

/**
 *
 */
function handle_pingAgent(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('pingAgent zome call failed');
    console.error(err);
    return;
  }
  g_isAgentOnline = callResult.Ok;
  g_hasPingResult = true;
}

/**
 *
 */
function handle_findAgent(callResult) {
  let button = document.querySelector('#handleDisplay');
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('findAgent dna call failed');
    console.error(err);
    button.title = "";
    return;
  }
  button.title = callResult.Ok[0];
}

/**
 *
 */
function handle_getManifest(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('GetManifest zome call failed');
    console.error(err);
    g_hasAttachment = -1;
    return;
  }
  g_hasAttachment = 1;
}

/**
 *
 */
function handle_missingAttachments(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('MissingAttachments zome call failed');
    console.error(err);
    return;
  }
  let attachmentGrid = document.querySelector('#attachmentGrid');
  attachmentGrid.render();
}

/**
 *
 */
function handle_acknowledgeMail(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('AcknowledgeMail zome call failed');
    console.error(err);
    return;
  }
  callGetAllMails();
}

/**
 *
 */
function handle_getChunk(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('GetChunk zome call failed');
    console.error(err);
    return;
  }
  let chunk = callResult.Ok;
  console.log({chunk});
  g_getChunks.push(chunk);
}

/**
 *
 */
function handle_findManifest(callResult) {
  if (callResult.Ok === undefined) {
    const err = callResult.Err;
    console.error('FindManifest zome call failed');
    console.error(err);
    return;
  }
  let maybeManifest = callResult.Ok;
  console.log({maybeManifest});
  g_manifest = maybeManifest;
}
