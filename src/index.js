import '@vaadin/vaadin-button';
import '@vaadin/vaadin-grid';
//import '@vaadin/vaadin-grid-dynamic-columns-mixin.js';
import '@vaadin/vaadin-item';
import '@vaadin/vaadin-text-field';
import '@vaadin/vaadin-ordered-layout';
import '@vaadin/vaadin-menu-bar';
import '@vaadin/vaadin-list-box';
import '@vaadin/vaadin-split-layout';
import '@vaadin/vaadin-combo-box';
import '@vaadin/vaadin-checkbox';
//import '@polymer/polymer';

window.addEventListener('load', () => {
  initUi();
});


function initUi() {
  initApp()
  initFileBox()
  initInMail()
  initOutMail()
  initActionBar()
}

function initApp() {
  // const firstNameField = document.querySelector('#firstName');
  // const addButton = document.querySelector('#addButton');

  // -- App Bar -- //
  getMyHandle(show_handle)

  // -- FileBox -- //
  getAllMails(handle_mails)

  // -- ContactList -- //
  getAllHandles(handle_handles)
}

function initMenuBar() {
  // Menu -- vaadin-menu-bar
  const menu = document.querySelector('#MenuBar');
  menu.addEventListener('item-selected', function(e) {
    console.log(JSON.stringify(e.detail.value))
    if (e.detail.value.text === 'Get All Handles') {
      getAllHandles(handle_handles)
    }
    if (e.detail.value.text === 'Get Mails') {
      getAllMails(handle_mails)
    }
  });
  menu.items = [{
    text: 'Reply', children: [{
      text: 'Users', children: [{ text: 'List' }, { text: 'Add' }]
    }, {
      text: 'Billing', children: [{ text: 'Invoices' }, { text: 'Balance Events' }]
    },]
  }, {
    text: 'New', children: [{ text: 'Edit Profile' }, { text: 'Privacy Settings' }]
  }, { text: 'Get Mails' }, { text: 'Get All Handles' }];
}

function initFileBox() {
  // Combobox -- vaadin-combo-box
  const systemFolders = [
      {id: '1', name: 'Inbox'},
      {id: '2', name: 'Outbox'},
  ];
  const folderBoxAll = document.querySelectorAll('#fileboxFolder');
  folderBoxAll.forEach(function(combo) {
      combo.items = systemFolders;
      combo.itemValuePath = 'id';
      combo.itemLabelPath = 'name';
      combo.value = '1';
  });
  const folderBox = document.querySelector('#fileboxFolder');
  folderBox.addEventListener('change', function(event) {
    const grid = document.querySelector('#mailGrid');
    let folderItems = [{
      "username": event.target.value, "subject": "hello mail", "date": "42",
    }];
    grid.items = folderItems;
  });

  initMenuBar()

  // Filebox -- vaadin-grid
  let fileboxItems = [{
    "username": "toto", "subject": "hello mail", "date": "42",
  }]

  const mailGrid = document.querySelector('#mailGrid');
  mailGrid.items = [];
  mailGrid.addEventListener('active-item-changed', function(event) {
    const item = event.detail.value;
    contactGrid.selectedItems = item ? [item] : [];
    var span = document.getElementById('mailDisplay');
    let mail = mail_map.get(item.date)
    span.textContent = '' + JSON.stringify(mail);
  });
}

function initInMail() {
  const inMailArea = document.querySelector('#inMailArea');
  inMailArea.value = "chocochoc";
}

function initOutMail() {
  // ContactList -- vaadin-grid
  const contactGrid = document.querySelector('#contactGrid');
  contactGrid.items = [];
  contactGrid.addEventListener('active-item-changed', function(event) {
    const item = event.detail.value;
    contactGrid.selectedItems = item ? [item] : [];
  });
}


function initActionBar() {
  // Action -- vaadin-menu-bar
  const actionMenu = document.querySelector('#ActionBar');
  actionMenu.items = [
      {
        text: 'Clear',
      },
      {
        text: 'Snap', disabled: true,
      },
      {text: 'Send'}
    ];
  actionMenu.addEventListener('item-selected', function(e) {
    console.log(JSON.stringify(e.detail.value))
    const outMailArea = document.querySelector('#outMailArea');
    const contactList = document.querySelector('#contactGrid');
    if (e.detail.value.text === 'Clear') {
      outMailArea.value = '';
    }
    if (e.detail.value.text === 'Send') {
      const selection = contactGrid.selectedItems;
      const random_payload = 'Hello from' + selection[0].agentId;
      if (selection.length > 0) {
        const mail = {
          subject: outMailArea.value, payload: random_payload, to: [selection[0].agentId], cc: [], bcc:[]
        }
        console.log('sending mail: ' + JSON.stringify(mail))
        sendMail(mail, log_result)
      } else {
        console.log('Send Mail Failed: No receipient selected')
      }
    }
    });

  // addButton.addEventListener('click', e => {
  //   firstNameField.value = 'initialized';
  // });
}