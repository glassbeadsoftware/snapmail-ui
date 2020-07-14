import '@vaadin/vaadin-button';
import '@vaadin/vaadin-grid';
import '@vaadin/vaadin-item';
//import '@vaadin/vaadin-upload';
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

window.addEventListener('load', () => {
  initUi();
});

//var myVar = setInterval(onLoop, 1000);
// function onLoop() {
//   getAllHandles(handleHandleList)
//   getAllMails(handleMails, update_fileBox)
// }


function initUi() {

  document.getElementById('file-input')
    .addEventListener('change', readSingleFile, false);

  setChangeHandleHidden(true)
  initDebugBar()
  initMenuBar()
  initApp()
  initFileBox()
  initInMail()
  initOutMail()
  initActionBar()
  //initUpload()
  // getMyAgentId(logResult)
  initNotification()
}

//
function initUpload() {
  customElements.whenDefined('vaadin-upload').then(function() {
    const upload = document.querySelector('vaadin-upload');

    upload.addEventListener('file-reject', function(event) {
      window.alert(event.detail.file.name + ' error: ' + event.detail.error);
    });

    upload.addEventListener('files-changed', function(event) {
      console.log('files-changed event: ', JSON.stringify(event.detail));
    });

    upload.addEventListener('upload-before', function(event) {
      console.log('upload-before event: ', JSON.stringify(event.detail.file));

      // Prevent the upload request:
      // event.preventDefault();

      // var file = event.detail.file;
      //
      // // Custom upload request url for file
      // file.uploadTarget = upload.target + '/' + file.name;
      //
      // // Custom name in the Content-Disposition header
      // file.formDataName = 'attachment';
    });

    upload.addEventListener('upload-request', function(event) {
      console.log('upload-request event: ', JSON.stringify(event.detail));
      //event.preventDefault();
      console.log('upload-request files: ', JSON.stringify(upload.files));
    });
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
}

function initApp() {
  // -- App Bar -- //
  getMyHandle(showHandle, handleSignal)

  // -- FileBox -- //
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
      getAllMails(handleMails, update_fileBox, handleSignal)
    }
  });
}

function update_mailGrid(folder) {
  const grid = document.querySelector('#mailGrid');
  let folderItems = [];
  console.log('update_mailGrid: ' + folder);
  switch(folder) {
    case 'All':
      for (mailItem of mail_map.values()) {
        //folderItems = Array.from(mail_map.values());
        folderItems.push(into_gridItem(mailItem));
      }
      break;
    case 'Inbox':
    case 'Sent':
      for (mailItem of mail_map.values()) {
        //console.log('mailItem: ' + JSON.stringify(mailItem))
        let is_out = is_OutMail(mailItem);
        if (isMailDeleted(mailItem)) {
          continue;
        }
        if (is_out && folder == 'Sent') {
          folderItems.push(into_gridItem(mailItem));
          continue;
        }
        if (!is_out && folder == 'Inbox') {
          folderItems.push(into_gridItem(mailItem));
        }
      }
      break;
    case 'Trash': {
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
  const systemFolders = ['All', 'Inbox', 'Sent', 'Trash'];
  const folderBoxAll = document.querySelector('#fileboxFolder');
  folderBoxAll.items = systemFolders;
  folderBoxAll.value = systemFolders[1];
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
    console.log('mail grid item: ' + JSON.stringify(item))
    var span = document.getElementById('inMailArea');
    let mail = mail_map.get(item.id);
    console.log('mail item: ' + JSON.stringify(mail))
    span.value = into_mailText(mail);
    acknowledgeMail(item.id, regenerate_mailGrid, handleSignal);
    // Allow delete button
    if (g_currentFolder !== 'Trash') {
      set_DeleteButtonState(false)
    }
  });
}

function regenerate_mailGrid(callResult) {
  getAllMails(handleMails, update_fileBox, handleSignal)
}

function initInMail() {
  // inMailArea -- vaadin-text-item
  const inMailArea = document.querySelector('#inMailArea');
  inMailArea.value = '';
}

function initOutMail() {
  // ContactList -- vaadin-grid
  const contactGrid = document.querySelector('#contactGrid');
  contactGrid.items = [];
  contactGrid.addEventListener('active-item-changed', function(event) {
    const item = event.detail.value;
    if (item && !contactGrid.selectedItems.includes(item)) {
      contactGrid.selectedItems.push(item);
    }
    set_SendButtonState(contactGrid.selectedItems.length == 0)
  });
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
    { text: '+File', disabled: true },
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
    if (e.detail.value.text === '+File') {

    }
    if (e.detail.value.text === 'Send') {
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
          subject: outMailSubjectArea.value, payload: outMailContentArea.value, to: toList, cc: ccList, bcc: bccList
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
      } else {
        console.log('Send Mail Failed: No receipient selected')
      }
    }
    });
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
  actionMenu.items[1].disabled = isDisabled;
  actionMenu.items[3].disabled = isDisabled;
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
