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

var g_hasAttachment = 0;

window.addEventListener('load', () => {
  initUi();
});

//var myVar = setInterval(onLoop, 1000);
// function onLoop() {
//   getAllHandles(handleHandleList)
//   getAllMails(handleMails, update_fileBox)
// }

function initUi() {

  // const splitObj = splitFile('ABCDF');
  // console.log({splitObj})

  setChangeHandleHidden(true)
  initDebugBar()
  initMenuBar()
  initApp()
  initFileBox()
  initInMail()
  initOutMail()
  initActionBar()
  initUpload()
  // getMyAgentId(logResult)
  initNotification()
  const sendProgressBar = document.querySelector('#sendProgressBar');
  sendProgressBar.style.display = "none";
}

//
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

function initApp() {
  // -- App Bar -- //
  getMyHandle(showHandle, handleSignal)

  // -- FileBox -- //
  checkIncomingAck(logResult, handleSignal)
  checkIncomingMail(logResult, handleSignal)
  getAllMails(handleMails, update_fileBox, handleSignal)

  // -- ContactList -- //
  getAllHandles(handleHandleList, handleSignal)
}
function initDebugBar() {
  // Menu -- vaadin-menu-bar
  const debug_menu = document.querySelector('#DebugBar');
  debug_menu.items = [{ text: 'Refresh' }];
  debug_menu.addEventListener('item-selected', function(e) {
    console.log(JSON.stringify(e.detail.value))
    if (e.detail.value.text === 'Refresh') {
      debug_menu.items[0].disabled = true;
      debug_menu.render();
      getAllHandles(handleHandleList, handleSignal)
    }
  });
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
    console.log(JSON.stringify(e.detail.value))
    if (e.detail.value.text === 'Trash') {
      deleteMail(g_currentMailItem.id, handleDelete, handleSignal)
      set_DeleteButtonState(true)
    }
    if (e.detail.value.text === 'Refresh') {
      checkIncomingAck(logResult, handleSignal)
      checkIncomingMail(logResult, handleSignal)
      getAllMails(handleMails, update_fileBox, handleSignal)
    }
  });
}

function update_mailGrid(folder) {
  const grid = document.querySelector('#mailGrid');
  let folderItems = [];
  console.log('update_mailGrid: ' + folder);
  switch(folder) {
    case systemFolders.ALL:
      for (mailItem of mail_map.values()) {
        //folderItems = Array.from(mail_map.values());
        folderItems.push(into_gridItem(mailItem));
      }
      break;
    case systemFolders.INBOX:
    case systemFolders.SENT:
      for (mailItem of mail_map.values()) {
        //console.log('mailItem: ' + JSON.stringify(mailItem))
        let is_out = is_OutMail(mailItem);
        if (isMailDeleted(mailItem)) {
          continue;
        }
        if (is_out && folder == systemFolders.SENT) {
          folderItems.push(into_gridItem(mailItem));
          continue;
        }
        if (!is_out && folder == systemFolders.INBOX) {
          folderItems.push(into_gridItem(mailItem));
        }
      }
      break;
    case systemFolders.TRASH: {
      for (mailItem of mail_map.values()) {
        if(isMailDeleted(mailItem)) {
          folderItems.push(into_gridItem(mailItem));
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
    set_DeleteButtonState(true)
  });

  // Filebox -- vaadin-grid
  const mailGrid = document.querySelector('#mailGrid');
  mailGrid.items = [];
  mailGrid.multiSort = true;
  // Display bold if mail not acknowledged
  mailGrid.cellClassNameGenerator = function(column, rowData) {
    let classes = '';
    let mailItem = mail_map.get(rowData.item.id);
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
    let mailItem = mail_map.get(item.id);
    console.log('mail item: ' + JSON.stringify(mailItem));
    span.value = into_mailText(mailItem);

    fillAttachmentGrid(mailItem.mail).then( function(missingCount) {
      if (missingCount > 0) {
        getMissingAttachments(mailItem.author, mailItem.address, missingAttachmentsResult, handleSignal);
      }
      acknowledgeMail(item.id, regenerate_mailGrid, handleSignal);
      // Allow delete button
      if (g_currentFolder !== systemFolders.TRASH) {
        set_DeleteButtonState(false)
      }
    });
  });
}

function manifestResult(callResult) {
  console.log('manifestResult:');
  console.log({callResult});
  if (callResult.Ok === undefined) {
    g_hasAttachment = -1;
    return;
  }
  g_hasAttachment = 1;
}

function missingAttachmentsResult(callResult) {
  console.log('missingAttachmentsResult')
  console.log({callResult});
  let attachmentGrid = document.querySelector('#attachmentGrid');
  attachmentGrid.render();
}

async function fillAttachmentGrid(mail) {
  let attachmentGrid = document.querySelector('#attachmentGrid');
  let items = [];
  const emoji = String.fromCodePoint(0x1F6D1);
  g_hasAttachment = 0;
  let missingCount = 0;
  for (let attachmentInfo of mail.attachments) {
    console.log({attachmentInfo});
    getManifest(attachmentInfo.manifest_address, manifestResult, handleSignal);
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

function regenerate_mailGrid(callResult) {
  getAllMails(handleMails, update_fileBox, handleSignal)
}

function initInMail() {
  // inMailArea -- vaadin-text-item
  const inMailArea = document.querySelector('#inMailArea');
  inMailArea.value = '';
  initAttachmentGrid();
}


function initAttachmentGrid() {
  // attachmentGrid -- vaadin-grid
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

  // On select, download attachment
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

    // Get File on source chain
     getFile(item.fileId).then(function(manifest) {
       console.log({ manifest })
       item.status = String.fromCodePoint(0x2714);
       //attachmentGrid.deselectItem(item);
       // DEBUG - check if content is valid base64
       if (!base64regex.test(manifest.content)) {
         const invalid_hash = sha256(manifest.content);
         console.error("File '" + manifest.filename + "' is invalid base64. hash is: " + invalid_hash);
       }
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

  // attachmentGrid.addEventListener('click', function(e) {
  //   const item = attachmentGrid.getEventContext(e).item;
  //   if (item) {
  //     console.log('selectedItems size = ' + attachmentGrid.selectedItems.length)
  //     // contactGrid.removeHeaderRow
  //     // contactGrid.render();
  //   }
  // });
}

async function getFile(fileId) {
  g_manifest = null;
  findManifest(fileId, findManifestResult, handleSignal);
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
    getChunk(chunkAddress, getChunkResult, handleSignal)
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

function getChunkResult(callResult) {
  let chunk = callResult.Ok;
  console.log({chunk})
  g_getChunks.push(chunk);
}

function findManifestResult(callResult) {
  let maybeManifest = callResult.Ok;
  console.log({maybeManifest})
  g_manifest = maybeManifest;
}

function initOutMail() {
  // ContactList -- vaadin-grid
  //customElements.whenDefined('#contactGrid').then(function() {
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
      set_SendButtonState(contactGrid.selectedItems.length == 0)
    });

    // ON CLICK
    contactGrid.addEventListener('click', function(e) {
      const item = contactGrid.getEventContext(e).item;
      //contactGrid.selectedItems = item ? [item] : [];
      if (item) {
        // contactGrid.selectedItems = [item];
        toggleRecepientType(item);
        console.log('selectedItems size = ' + contactGrid.selectedItems.length)
        contactGrid.removeHeaderRow
        contactGrid.render();
      }
    });
  //});
}

function toggleRecepientType(item) {
  let nextType = '';
  switch(item.recepientType) {
    case '': nextType = 'to'; break;
    case 'to': nextType = 'cc'; break;
    case 'cc': nextType = 'bcc'; break;
    case 'bcc': nextType = ''; break;
    default: console.err('unknown recepientType');
  }
  item.recepientType = nextType;
}

function initActionBar() {
  // Action -- vaadin-menu-bar
  const actionMenu = document.querySelector('#ActionBar');
  actionMenu.items = [
      { text: 'Clear' },
    //{ text: '+File', disabled: true },
      { text: 'Snap', disabled: true },
      { text: 'Send', disabled: true }
    ];
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

//
async function sendAction() {
  // Submit each attachment
  const upload = document.querySelector('vaadin-upload');
  const files = upload.files;
  g_fileList = [];
  for (let file of files) {
    if (!base64regex.test(file.content)) {
      const invalid_hash = sha256(file.content);
      console.error("File '" + file.name + "' is invalid base64. hash is: " + invalid_hash);
    }
    const parts = file.content.split(',');
    console.log("parts.length: " + parts.length)
    console.log({parts})
    const filetype = parts.length > 1? parts[0] : file.type;
    const splitObj = splitFile(parts[parts.length - 1]);
    g_chunkList = [];
    // Submit each chunk
    for (var i = 0; i < splitObj.numChunks; ++i) {
      //console.log('chunk' + i + ': ' + fileChunks.chunks[i])
      writeChunk(splitObj.dataHash, i, splitObj.chunks[i], chunkResult, handleSignal);
      while (g_chunkList.length !=  i + 1) {
        await sleep(10)
      }
    }
    while (g_chunkList.length < splitObj.numChunks) {
      await sleep(10);
    }
    writeManifest(splitObj.dataHash, file.name, filetype, file.size, g_chunkList, writeManifestResult, handleSignal)
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
    sendMail(mail, logResult, handleSignal);
    // Update UI
    set_SendButtonState(true);
    outMailSubjectArea.value = '';
    outMailContentArea.value = '';
    contactGrid.selectedItems = [];
    contactGrid.activeItem = null;
    resetRecepients();
    getAllMails(handleMails, update_fileBox, handleSignal);
    upload.files = [];
  } else {
    console.log('Send Mail Failed: No receipient selected')
  }
}

/**
 *
 */
function update_fileBox() {
  const mailGrid = document.querySelector('#mailGrid');
  const activeItem = mailGrid.activeItem;
  console.log('update_fileBox ; activeItem = ' + JSON.stringify(activeItem))
  const folderBoxAll = document.querySelector('#fileboxFolder');
  update_mailGrid(folderBoxAll.value)

  if (activeItem) {
    let newActiveItem = null;
    for(mailItem of mailGrid.items) {
      if(mailItem.id === activeItem.id) {
        newActiveItem = mailItem;
        break;
      }
    }
    mailGrid.selectItem(newActiveItem);
  }
}

function set_SendButtonState(isDisabled) {
  let actionMenu = document.querySelector('#ActionBar');
  //actionMenu.items[1].disabled = isDisabled;
  actionMenu.items[2].disabled = isDisabled;
  actionMenu.render();
}

function set_DeleteButtonState(isDisabled) {
  let menu = document.querySelector('#MenuBar');
  console.log('menu.items = ' + JSON.stringify(menu.items))
  menu.items[2].disabled = isDisabled;
  menu.render();
}

function handleDelete(_callResult) {
  // TODO check if call result succeeded
  getAllMails(handleMails, update_fileBox, handleSignal)
}
