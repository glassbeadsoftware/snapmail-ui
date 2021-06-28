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

import * as DNA from './rsm_bridge'
import {sha256, arrayBufferToBase64, base64ToArrayBuffer, splitFile, sleep, base64regex, htos, stoh} from './utils'
import {systemFolders, isMailDeleted, determineMailClass, into_gridItem, into_mailText, is_OutMail, customDateString} from './mail'

import {version} from '../package.json';
import { IS_ELECTRON, NETWORK_ID } from "./rsm_bridge";

//---------------------------------------------------------------------------------------------------------------------
// DEBUG MODE
//---------------------------------------------------------------------------------------------------------------------

if (process.env.NODE_ENV === 'prod') {
  console.log = () => {};
}

/**
 * Setup recurrent pull from DHT ever 10 seconds
 */
var myVar = setInterval(onLoop, 10 * 1000);
function onLoop() {
  console.log("**** onLoop CALLED ****");
  if (process.env.NODE_ENV === 'prod') {
    getAllFromDht();
  }
}


//---------------------------------------------------------------------------------------------------------------------
// Globals
//---------------------------------------------------------------------------------------------------------------------

const redDot   = String.fromCodePoint(0x1F534);
const greenDot = String.fromCodePoint(0x1F7E2);
const blueDot  = String.fromCodePoint(0x1F535);

var g_hasAttachment = 0;
var g_chunkList = [];
var g_fileList = [];

// Map of (agentId -> username)
// agentId is base64 string of a hash
var g_usernameMap = new Map();
// Map of (agentId -> timestamp of last ping)
var g_pingMap = new Map();
// Map of (agentId -> bool)
var g_responseMap = new Map();
// Map of (mailId -> mailItem)
var g_mailMap = new Map();

var g_myAgentHash = null;
var g_myAgentId = null;
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
  DNA.getAllHandles(handle_getAllHandles);
  DNA.getAllMails(handle_getAllMails, handle_post_getAllMails);
}

// -- Signal Structure -- //
// AppSignal {
//   data: {
//       cellId: [Uint8Array(39), Uint8Array(39)],
//       payload: any,
//     }
//     type: "Signal"
// }
//
function handleSignal(signalwrapper) {
  console.log('Received signal:')
  console.log({signalwrapper})
  if (signalwrapper.type !== undefined && signalwrapper.type !== "Signal") {
    return;
  }
  // FIXME
  // if (signalwrapper.signal.signal_type !== "User") {
  //   return;
  // }

  if (signalwrapper.data.payload.hasOwnProperty('ReceivedMail')) {
      let item = signalwrapper.data.payload.ReceivedMail;
      console.log("received_mail:");
      console.log({item});
      const notification = document.querySelector('#notifyMail');
      notification.open();
      callGetAllMails();
      return
  }
  if (signalwrapper.data.payload.hasOwnProperty('ReceivedAck')) {
      let item = signalwrapper.data.payload.ReceivedAck;
      console.log("received_ack:");
      console.log({item});
      const notification = document.querySelector('#notifyAck');
      notification.open();
      callGetAllMails();
      return
  }
  if (signalwrapper.data.payload.hasOwnProperty('ReceivedFile')) {
      let item = signalwrapper.data.payload.ReceivedFile;
      console.log("received_file:");
      console.log({item});
      const notification = document.querySelector('#notifyFile');
      notification.open();
      return
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
  //getMyAgentId(logResult)
  initNotification();
  // init DNA at the end because the callbacks will populate the UI
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

    // // DEBUG
    // upload.addEventListener('files-changed', function(event) {
    //   //console.log('files-changed event: ', JSON.stringify(event.detail));
    //   console.log('files-changed event: ');
    //   //const detail = event.detail;
    //   //console.log({detail});
    // });
    // upload.addEventListener('upload-success', function(event) {
    //   console.log('upload-success event');
    //   //console.log(event);
    // })

    upload.addEventListener('upload-before', function(event) {
      //console.log('upload-before event: ', JSON.stringify(event.detail.file));
      const file = event.detail.file;
      const xhr = event.detail.xhr;
      console.log('upload-before event: ');

      event.preventDefault(); // Prevent the upload request

      var reader = new FileReader();
      reader.onload = function(e) {
        console.log('FileReader onload event: ');
        const content = arrayBufferToBase64(e.target.result); // reader.result

        // Disabled regex test because it causes error on big files: "RangeError: Maximum call stack size exceeded"
        // if (!base64regex.test(content)) {
        //   const invalid_hash = sha256(content);
        //   console.error("File '" + file.name + "' is invalid base64. hash is: " + invalid_hash);
        // }

        console.log({e});
        console.log('file: ' + file.name + ' ; size: ' + Math.ceil(content.length / 1024) + ' KiB ; type: ' + file.type);

        upload.set(['files', upload.files.indexOf(file), 'progress'], 100)
        upload.set(['files', upload.files.indexOf(file), 'complete'], true)
        upload.set(['files', upload.files.indexOf(file), 'content'], content)
      };
      reader.readAsArrayBuffer(event.detail.file);
    });

    //  upload.addEventListener('upload-request', function(event) {
    //    console.log('upload-request event: ', JSON.stringify(event.detail));
    // //   const files = upload.files;
    // //   console.log('upload-request event: ');
    // //   console.log({event});
    // //   //console.log({files});
    // //   event.preventDefault();
    // //   let xhr = event.detail.xhr;
    // //   console.log({xhr});
    // //   let file = event.detail.file;
    // //   xhr.send(file);
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


function getAllFromDht() {
  DNA.getAllHandles(handle_getAllHandles);
  DNA.checkIncomingAck(logCallResult);
  DNA.checkIncomingMail(logCallResult);
  callGetAllMails();
}


/**
 *
 */
function initDna() {
  console.log('initDna()');
  DNA.rsmConnectApp(handleSignal).then( async (cellId) => {
    const dnaId = htos(cellId[0])
    g_myAgentHash = cellId[1]
    g_myAgentId = htos(g_myAgentHash)
    // let label = document.getElementById('agentIdDisplay');
    // label.textContent = g_myAgentId
    DNA.getMyHandle(showHandle);
    getAllFromDht()
    while (!canGetAllMutex) {
      await sleep(10)
    }
    // -- findAgent ? -- //
    //const handleButton = document.getElementById('handleText');
    //DNA.findAgent(handleButton.textContent, handle_findAgent);

    // -- Change title color in debug -- //
    const titleLayout = document.getElementById('titleLayout');
    if (process.env.NODE_ENV !== 'prod') {
      titleLayout.style.backgroundColor = "#ec8383d1";
    }
    if (DNA.IS_ELECTRON) {
      titleLayout.style.display = "none";
    }

    // -- Update Abbr -- //
    const handleAbbr = document.getElementById('handleAbbr');
    handleAbbr.title = g_myAgentId
    const titleAbbr = document.getElementById('titleAbbr');
    titleAbbr.title = dnaId
    // -- Loading Done -- //
    const loadingBar = document.querySelector('#loadingBar');
    loadingBar.style.display = "none";
    const mainPage = document.querySelector('#mainPage');
    mainPage.style.display = "flex";
  }).catch(error => {
    console.error(error)
    alert("Failed to connect to holochain. Holochain conductor service might not be up and running.");
  });
}


function setHandle() {
  let input = document.getElementById('myNewHandleInput');
  console.log('new handle = ' + input.value);
  DNA.setHandle(input.value, console.log);
  showHandle({ Ok: input.value});
  input.value = '';
  setState_ChangeHandleBar(true);
  DNA.getAllHandles(handle_getAllHandles);
}

/**
 *
 */
function initTitleBar() {
  // Title bar buttons
  customElements.whenDefined('vaadin-button').then(function() {
    let button = document.querySelector('#setMyHandleButton');
    button.addEventListener('click', () => {
      setHandle();
    });
    let handleInput = document.querySelector('#myNewHandleInput');
    handleInput.addEventListener("keyup", (event) => {
      if (event.keyCode == 13) {
        setHandle();
      }
    });
    button = document.querySelector('#handleDisplay');
    button.addEventListener('click', () => {
      setState_ChangeHandleBar(false);
    });
    button = document.querySelector('#cancelHandleButton');
    button.addEventListener('click', () =>{
      setState_ChangeHandleBar(true);
    });
  });
  const span = document.querySelector('#networkIdDisplay');
  console.assert(span);
  span.textContent = DNA.NETWORK_ID;

  const title = document.querySelector('#snapTitle');
  console.assert(title);
  title.textContent = "SnapMail v" + version + "  - ";

  const rootTitle = document.querySelector('#rootTitle');
  console.assert(rootTitle);
  rootTitle.textContent = "SnapMail v" + version + "  - " + DNA.NETWORK_ID;

}

/**
 *
 * @returns {Promise<void>}
 */
async function resetRecepients() {
  console.log('resetRecepients:')
  const contactGrid = document.querySelector('#contactGrid');
  // Get currently selected hashs
  let prevSelected = [];
  for (const item of contactGrid.selectedItems) {
    prevSelected.push(item.agentId);
  }
  let selected = [];
  let items = [];
  pingNextAgent();
  // Add each handle to the contactGrid
  for (const [agentId, username] of g_usernameMap.entries()) {
    console.log('' + agentId + '=> ' + username)
    const agentHash = stoh(agentId)
    const status = g_pingMap.get(agentId)? (g_responseMap.get(agentId)? greenDot : redDot) : blueDot;
    //const status = blueDot
    let item = {
      "username": username, "agentId": agentHash, "recepientType": '', status,
    };
    if (prevSelected.includes(agentHash)) {
      selected.push(item);
    }
    items.push(item);
  }
  contactGrid.items = items;
  contactGrid.selectedItems = selected;
  contactGrid.activeItem = null;
  contactGrid.render();
}

function initMenuBar() {
  // Menu -- vaadin-menu-bar
  const menu = document.querySelector('#MenuBar');
  let items =
    [ { text: 'Move', disabled: true }
    , { text: 'Reply', disabled: true, children: [{ text: 'Sender' }, { text: 'All' }, { text: 'Fwd' }] }
    , { text: 'Trash', disabled: true }
    , { text: 'Print', disabled: true }
    , { text: 'Find', disabled: true }
    ];
  if (process.env.NODE_ENV !== 'prod') {
    items.push({ text: 'Refresh' });
  }
  menu.items = items;

  // On button click
  menu.addEventListener('item-selected', function(e) {
    console.log(JSON.stringify(e.detail.value));
    // -- Handle 'Trash' -- //
    if (e.detail.value.text === 'Trash') {
      DNA.deleteMail(g_currentMailItem.id, handle_deleteMail);
      const mailGrid = document.querySelector('#mailGrid');
      mailGrid.selectedItems = [];
      mailGrid.activeItem = null;
      setState_DeleteButton(true)
      setState_ReplyButton(true)
    }
    // -- Handle 'Reply' -- //
    const outMailSubjectArea = document.querySelector('#outMailSubjectArea');
    const contactGrid = document.querySelector('#contactGrid');

    if (e.detail.value.text === 'Sender') {
      outMailSubjectArea.value = 'Re: ' + g_currentMailItem.subject;
      resetContactGrid(contactGrid);
      for (let contactItem of contactGrid.items) {
        if (contactItem.username === g_currentMailItem.username) {
          contactGrid.selectedItems = [contactItem];
          contactGrid.activeItem = contactItem;
          toggleContact(contactItem);
          contactGrid.render();
          break;
        }
      }
    }
    if (e.detail.value.text === 'All') {
      let mailItem = g_mailMap.get(htos(g_currentMailItem.id));
      if (mailItem) {
        outMailSubjectArea.value = 'Re: ' + g_currentMailItem.subject;
        resetContactGrid(contactGrid);
        // TO
        for(let agentId of mailItem.mail.to) {
          let to_username = g_usernameMap.get(htos(agentId));
          selectUsername(contactGrid, to_username, 1);
        }
        // CC
        for(let agentId of mailItem.mail.cc) {
          let cc_username = g_usernameMap.get(htos(agentId));
          selectUsername(contactGrid, cc_username, 2);
        }
        // BCC
        for(let agentId of mailItem.bcc) {
          let bcc_username = g_usernameMap.get(htos(agentId));
          selectUsername(contactGrid, bcc_username, 3);
        }
        // Done
        contactGrid.render();
      }
    }
    if (e.detail.value.text === 'Fwd') {
      outMailSubjectArea.value = 'Fwd: ' + g_currentMailItem.subject;
      resetContactGrid(contactGrid);
      const outMailContentArea = document.querySelector('#outMailContentArea');
      let mailItem = g_mailMap.get(htos(g_currentMailItem.id));
      let fwd = '\n\n';
      fwd += '> ' + 'Mail from: ' + g_usernameMap.get(htos(mailItem.author)) + ' at ' + customDateString(mailItem.date) + '\n';
      let arrayOfLines = mailItem.mail.payload.match(/[^\r\n]+/g);
      for (let line of arrayOfLines) {
        fwd += '> ' + line + '\n';
      }
      outMailContentArea.value = fwd;
    }
    // -- Handle 'Refresh' -- //
    if (e.detail.value.text === 'Refresh') {
      //console.log('Refresh called');
      getAllFromDht();
    }
  });
}


function selectUsername(contactGrid, candidat, count) {
  for(let contactItem of contactGrid.items) {
    if(contactItem.username === candidat) {
      for (let i = 0; i < count; i++) {
        toggleContact(contactItem);
      }
      contactGrid.selectedItems.push(contactItem);
      contactGrid.activeItem = contactItem;
      break;
    }
  }

}
/**
 *
 */
function update_mailGrid(folder) {
  const grid = document.querySelector('#mailGrid');
  let folderItems = [];
  const activeItem = mailGrid.activeItem;
  console.log('update_mailGrid: ' + folder);

  switch(folder) {
    case systemFolders.ALL:
      for (let mailItem of g_mailMap.values()) {
        //folderItems = Array.from(g_mail_map.values());
        folderItems.push(into_gridItem(g_usernameMap, mailItem));
      }
      break;
    case systemFolders.INBOX:
    case systemFolders.SENT:
      for (let mailItem of g_mailMap.values()) {
        //console.log('mailItem: ' + JSON.stringify(mailItem))
        let is_out = is_OutMail(mailItem);
        if (isMailDeleted(mailItem)) {
          continue;
        }
        if (is_out && folder == systemFolders.SENT) {
          folderItems.push(into_gridItem(g_usernameMap, mailItem));
          continue;
        }
        if (!is_out && folder == systemFolders.INBOX) {
          folderItems.push(into_gridItem(g_usernameMap, mailItem));
        }
      }
      break;
    case systemFolders.TRASH: {
      for (let mailItem of g_mailMap.values()) {
        if(isMailDeleted(mailItem)) {
          folderItems.push(into_gridItem(g_usernameMap, mailItem));
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
  if (activeItem !== undefined && activeItem !== null) {
    for(const item of Object.values(grid.items)) {
      //console.log('Item id = ' + item.id);
      if(activeItem.id === item.id) {
        //console.log('activeItem match found');
        grid.activeItem = item;
        grid.selectedItems = [item];
        break;
      }
    }
  }
  grid.render();
}


/**
 *
 */
function initFileBox() {
  const fileboxBar = document.querySelector('#fileboxBar');
  if (process.env.NODE_ENV !== 'prod') {
    fileboxBar.style.backgroundColor = "rgba(241,154,154,0.82)";
  }
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
    setState_ReplyButton(true)
  });

  // Filebox -- vaadin-grid
  const mailGrid = document.querySelector('#mailGrid');
  mailGrid.items = [];
  mailGrid.multiSort = true;
  // Display bold if mail not acknowledged
  mailGrid.cellClassNameGenerator = function(column, rowData) {
    let classes = '';
    let mailItem = g_mailMap.get(htos(rowData.item.id));
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
    console.log('mailgrid Event: active-item-changed');
    const item = event.detail.value;
    mailGrid.selectedItems = item ? [item] : [];
    if (item === null || item === undefined) {
      //getAllMails(handleMails, handle_getAllMails)
      return;
    }
    g_currentMailItem = item;
    //console.log('mail grid item: ' + JSON.stringify(item));
    var inMailArea = document.getElementById('inMailArea');
    let mailItem = g_mailMap.get(htos(item.id));
    //console.log('mail item: ' + JSON.stringify(mailItem));
    inMailArea.value = into_mailText(g_usernameMap, mailItem);

    fillAttachmentGrid(mailItem.mail).then( function(missingCount) {
      if (missingCount > 0) {
        DNA.getMissingAttachments(mailItem.author, mailItem.address, handle_missingAttachments);
      }
      DNA.acknowledgeMail(item.id, handle_acknowledgeMail);
      // Allow delete button
      if (g_currentFolder !== systemFolders.TRASH) {
        setState_DeleteButton(false)
        setState_ReplyButton(false)
      }
    });
  });
  var inMailArea = document.getElementById('inMailArea');
  inMailArea.style.backgroundColor = "#dfe7efd1";

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
    DNA.getManifest(attachmentInfo.manifest_eh, handle_getManifest);
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
  console.log({items})
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
     getFile(item.fileId).then(function(manifest) {
       console.log({ manifest })
       item.status = String.fromCodePoint(0x2714);
       //attachmentGrid.deselectItem(item);
       // DEBUG - check if content is valid base64
       // if (!base64regex.test(manifest.content)) {
       //   const invalid_hash = sha256(manifest.content);
       //   console.error("File '" + manifest.filename + "' is invalid base64. hash is: " + invalid_hash);
       // }
       let filetype = manifest.filetype;
       const fields = manifest.filetype.split(':');
       if (fields.length > 1) {
         const types = fields[1].split(';');
         filetype = types[0];
       }
       let byteArray = base64ToArrayBuffer(manifest.content)
       const blob = new Blob([byteArray], { type: filetype});
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = item.filename || 'download';
       a.addEventListener('click', {}, false);
       a.click();
       attachmentGrid.activeItem = null;
       attachmentGrid.selectedItems = [];
       attachmentGrid.render();
     });
  });
}

/**
 *
 */
async function getFile(fileId) {
  g_manifest = null;
  DNA.findManifest(fileId, handle_findManifest);
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
    DNA.getChunk(chunkAddress, handle_getChunk)
    while (g_getChunks.length !=  i) {
      await sleep(10)
    }
  }
  while (g_getChunks.length != g_manifest.chunks.length) {
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


/**
 *
 */
function initOutMailArea() {
  // -- ContactsMenu -- vaadin-menu-bar
  if (process.env.NODE_ENV !== 'prod') {
    const contactsMenu = document.querySelector('#ContactsMenu');
    contactsMenu.items = [{ text: 'Refresh' }];
    contactsMenu.addEventListener('item-selected', function(e) {
      console.log(JSON.stringify(e.detail.value));
      if(e.detail.value.text === 'Refresh') {
        contactsMenu.items[0].disabled = true;
        contactsMenu.render();
        DNA.getAllHandles(handle_getAllHandles);
      }
    });
  }
  // -- contactGrid -- vaadin-grid
  const contactGrid = document.querySelector('#contactGrid');
  contactGrid.items = [];
  contactGrid.cellClassNameGenerator = function(column, rowData) {
    //console.log(rowData)
    let classes = rowData.item.status;
    if (column.path === 'status') {
      classes += ' statusColumn';
    }
    if (rowData.item.recepientType !== '') { classes += ' newmail' }
    if (rowData.item.recepientType === 'cc') { classes += ' myCc' }
    if (rowData.item.recepientType === 'bcc') { classes += ' myBcc' }
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
    toggleContact(item);
    contactGrid.render();
  });
}


/**
 *
 */
function toggleContact(contactItem) {
  if (!contactItem) {
    return;
  }
  let nextType = '';
  switch(contactItem.recepientType) {
    case '': nextType = 'to'; break;
    case 'to': nextType = 'cc'; break;
    case 'cc': nextType = 'bcc'; break;
    case 'bcc': nextType = ''; break;
    default: console.err('unknown recepientType');
  }
  contactItem.recepientType = nextType;
}


/**
 *
 */
function resetContactGrid(contactGrid) {
  for (let contactItem of contactGrid.items) {
    contactItem.recepientType = '';
  }
  contactGrid.selectedItems = [];
  contactGrid.activeItem = null;
  contactGrid.render();
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
    const upload = document.querySelector('vaadin-upload');
    // Clear clicked
    if (e.detail.value.text === 'Clear') {
      outMailSubjectArea.value = '';
      outMailContentArea.value = '';
      /// clear each attachment
      upload.files = [];
      resetRecepients();
      return;
    }
    // Send clicked
    if (e.detail.value.text === 'Send') {
      const sendProgressBar = document.querySelector('#sendProgressBar');
      const sendingTitle = document.querySelector('#sendingTitle');
      sendProgressBar.style.display = "block";
      sendingTitle.style.display = "block";
      actionMenu.style.display = "none";
      //upload.style.display = "none";
      upload.maxFiles = 0;
      sendAction().then(function() {
        sendProgressBar.style.display = "none";
        sendingTitle.style.display = "none";
        actionMenu.style.display = "block";
        //upload.style.display = "block";
        upload.maxFiles = 42;
      });
    }
  });
}

/**
 * @returns {Promise<void>}
 */
async function sendAction() {
  /// Submit each attachment
  const upload = document.querySelector('vaadin-upload');
  const files = upload.files;
  console.log({files})
  g_fileList = [];
  for (let file of files) {
    // // Causes stack error on big files
    // if (!base64regex.test(file.content)) {
    //   const invalid_hash = sha256(file.content);
    //   console.error("File '" + file.name + "' is invalid base64. hash is: " + invalid_hash);
    // }
    const parts = file.content.split(',');
    console.log("parts.length: " + parts.length)
    console.log({parts})
    const filetype = parts.length > 1? parts[0] : file.type;
    const splitObj = splitFile(parts[parts.length - 1]);
    g_chunkList = [];
    /// Submit each chunk
    for (var i = 0; i < splitObj.numChunks; ++i) {
      //console.log('chunk' + i + ': ' + fileChunks.chunks[i])
      DNA.writeChunk(splitObj.dataHash, i, splitObj.chunks[i], handle_writeChunk);
      while (g_chunkList.length !=  i + 1) {
        await sleep(10)
      }
    }
    while (g_chunkList.length < splitObj.numChunks) {
      await sleep(10);
    }
    DNA.writeManifest(splitObj.dataHash, file.name, filetype, file.size, g_chunkList, handle_writeManifest)
  }
  while (g_fileList.length < files.length) {
    await sleep(10);
  }

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
    DNA.sendMail(mail, logCallResult);
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
  if (!hidden) {
    handleInput.focus();
  }
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
  //console.log('menu.items = ' + JSON.stringify(menu.items))
  menu.items[2].disabled = isDisabled;
  menu.render();
}

function setState_ReplyButton(isDisabled) {
  let menu = document.querySelector('#MenuBar');
  //console.log('menu.items = ' + JSON.stringify(menu.items))
  menu.items[1].disabled = isDisabled;
  menu.render();
}

//---------------------------------------------------------------------------------------------------------------------
// Zome call Callbacks
//---------------------------------------------------------------------------------------------------------------------

/**
 * Generic callback: log response
 */
function logCallResult(callResult) {
  if (callResult === undefined || callResult.Err !== undefined) {
    const err = callResult.Err;
    console.error('Zome call failed:');
    console.error(err);
    return;
  }
  // FIXME put back when debug finished
  // console.log('callResult = ' + JSON.stringify(callResult));
}

/**
 * Generic callback: Refresh my handle
 */
function showHandle(callResult) {
  if (callResult === undefined || callResult.Err !== undefined) {
    const err = callResult.Err;
    console.error('getMyHandle zome call failed');
    console.error(err);
    return;
  }
  //console.log('showHandle call result = ' + JSON.stringify(callResult))
  var handleButton = document.getElementById('handleText');

  if (callResult.Ok === undefined) {
    handleButton.textContent = '' + callResult
  } else {
    handleButton.textContent = '' + callResult.Ok;
  }
  g_myHandle = handleButton.textContent;
}


/**
 * On delete, refresh filebox
 */
function handle_deleteMail(callResult) {
  if (callResult === undefined || callResult.Err !== undefined) {
    const err = callResult.Err;
    console.error('deleteMail zome call failed');
    console.error(err);
    return;
  }
  // TODO check if call result succeeded
  callGetAllMails();
}


/**
 * Refresh mailGrid
 */
function handle_getAllMails(callResult) {
  if (callResult === undefined || callResult.Err !== undefined) {
    const err = callResult.Err;
    console.error('getAllMails zome call failed');
    console.error(err);
    return;
  }
  let mailGrid = document.querySelector('#mailGrid');
  let mailList = callResult;

  // Get currently selected hashs
  let prevSelected = [];
  for (const item of mailGrid.selectedItems) {
    prevSelected.push(htos(item.id));
  }

  let selected = [];
  let items = [];
  g_mailMap.clear();
  const folderBox = document.querySelector('#fileboxFolder');
  let selectedBox = folderBox.value;
  for (let mailItem of mailList) {
    g_mailMap.set(htos(mailItem.address), mailItem);
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
    //items.push(into_gridItem(g_usernameMap, mailItem));
    let gridItem = into_gridItem(g_usernameMap, mailItem);
    //console.log('gridItem.id = ' + gridItem.id);
    items.push(gridItem);
    if (prevSelected.includes(htos(gridItem.id))) {
      selected.push(gridItem);
    }
  }
  console.log('mailCount = ' + items.length + ' (' + selected.length + ')');
  mailGrid.items = items;
  mailGrid.selectedItems = selected;
  mailGrid.activeItem = selected[0];
}

/**
 * Post callback for getAllMails()
 */
function handle_post_getAllMails() {
   // Update mailGrid
  const folder = document.querySelector('#fileboxFolder');
  update_mailGrid(folder.value);
  // Update active Item
  const mailGrid = document.querySelector('#mailGrid');
  const activeItem = mailGrid.activeItem;
  console.log('handle_getAllMails ; activeItem = ' + JSON.stringify(activeItem))
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
 * Ping oldest pinged agent
 */
var pingedAgent = undefined;
function pingNextAgent() {
  console.log("pingNextAgent: " + JSON.stringify(g_pingMap));
  // Skip if already waiting for a pong or empty map
  if (pingedAgent !== undefined || g_pingMap.size === 0) {
    return;
  }
  // Sort g_pingMap by value
  const nextMap = new Map([...g_pingMap.entries()].sort((a, b) => a[1] - b[1]));
  // Ping first agent
  //console.log({nextMap})
  pingedAgent = stoh(nextMap.keys().next().value);
  console.log({pingedAgent});
  if (htos(pingedAgent) !== g_myAgentId) {
    DNA.pingAgent(pingedAgent, handle_pingNextAgent);
  } else {
    handle_pingNextAgent(true);
  }
}

function handle_pingNextAgent(callResult) {
  let agentB64 = htos(pingedAgent);
  if (callResult === undefined || callResult.Err !== undefined || callResult === false) {
    g_responseMap.set(agentB64, false);
  } else {
    g_responseMap.set(agentB64, true);
  }
  g_pingMap.set(agentB64, Date.now());
  pingedAgent = undefined;
}

/**
 * Refresh g_usernameMap and contactGrid
 */
function handle_getAllHandles(callResult) {
  if (callResult === undefined || callResult.Err !== undefined) {
    console.error('getAllHandles zome call failed');
  } else {
    //const contactGrid = document.querySelector('#contactGrid');
    let handleList = callResult;
    //console.log('handleList: ' + JSON.stringify(handleList))
    g_usernameMap.clear();
    for(let handleItem of handleList) {
      // TODO: exclude self from list when in prod?
      let agentId = htos(Object.values(handleItem.agentId));
      console.log('' + handleItem.name + ': ' + agentId);
      g_usernameMap.set(agentId, handleItem.name);
      if(g_pingMap.get(agentId) === undefined) {
        //console.log("ADDING TO g_pingMap: " + agentId);
        g_pingMap.set(agentId, 0);
        g_responseMap.set(agentId, false);
      }
    }
  }

  resetRecepients().then(() => {
    const contactsMenu = document.querySelector('#ContactsMenu');
    contactsMenu.items[0].disabled = false;
    contactsMenu.render();
  });
  // Allow button anyway
  const contactsMenu = document.querySelector('#ContactsMenu');
  contactsMenu.items[0].disabled = false;
  contactsMenu.render();

  // Update mailGrid
  const folder = document.querySelector('#fileboxFolder');
  update_mailGrid(folder.value);
}

/**
 *
 */
// function handle_findAgent(callResult) {
//   let button = document.querySelector('#handleDisplay');
//   if (callResult.Err !== undefined) {
//     const err = callResult.Err;
//     console.error('findAgent dna call failed');
//     console.error(err);
//     button.title = "";
//     return;
//   }
//   button.title = callResult[0];
// }


/**
 * Add chunk to chunkList
 */
function handle_writeChunk(callResult) {
  if (callResult === undefined || callResult.Err !== undefined) {
    const err = callResult.Err;
    console.error('writeChunk zome call failed');
    console.error(err);
    return;
  }
  let chunkAddress = callResult;
  g_chunkList.push(chunkAddress);
}

/**
 * Add manifest to fileList
 */
function handle_writeManifest(callResult) {
  //console.log('writeManifestResult: ' + JSON.stringify(callResult));
  if (callResult === undefined || callResult.Err !== undefined) {
    const err = callResult.Err;
    console.error('writeManifest zome call failed');
    console.error(err);
    return;
  }
  let manifestAddress = callResult;
  g_fileList.push(manifestAddress);
}

/**
 *
 */
function handle_getManifest(callResult) {
  if (callResult === undefined || callResult.Err !== undefined) {
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
  if (callResult === undefined || callResult.Err !== undefined) {
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
  if (callResult === undefined || callResult.Err !== undefined) {
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
  if (callResult === undefined || callResult.Err !== undefined) {
    const err = callResult.Err;
    console.error('GetChunk zome call failed');
    console.error(err);
    return;
  }
  let chunk = callResult;
  console.log({chunk});
  g_getChunks.push(chunk);
}

/**
 *
 */
function handle_findManifest(callResult) {
  if (callResult === undefined || callResult.Err !== undefined) {
    const err = callResult.Err;
    console.error('FindManifest zome call failed');
    console.error(err);
    return;
  }
  let maybeManifest = callResult;
  console.log({maybeManifest});
  g_manifest = maybeManifest;
}
