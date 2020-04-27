import '@vaadin/vaadin-button';
import '@vaadin/vaadin-grid';
import '@vaadin/vaadin-item';
import '@vaadin/vaadin-text-field';
import '@vaadin/vaadin-ordered-layout';
import '@vaadin/vaadin-menu-bar';
import '@vaadin/vaadin-list-box';
import '@vaadin/vaadin-split-layout';
import '@vaadin/vaadin-combo-box';

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
  getAllMails(handle_all_mails)

  // -- ContactList -- //
  getAllHandles(handle_handles)
}

function initMenuBar() {
  // Menu -- vaadin-menu-bar
  const menu = document.querySelector('#MenuBar');
  menu.addEventListener('item-selected', function(e)
  {
    console.log(JSON.stringify(e.detail.value))
    if (e.detail.value.text === 'Get All Handles') {
      getAllHandles(handle_handles)
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
  }, { text: 'Get All Handles' }];
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

  document.querySelector('#mailGrid').items = fileboxItems;
}

function initInMail() {
}

function initOutMail() {
  // ContactList -- vaadin-grid
  const contactGrid = document.querySelector('#contactGrid');
  const handleList = [
    {username: 'Bob', agentId: 'HcB'},
    {username: 'Jacques', agentId: 'HcJ'},
  ];
  contactGrid.addEventListener('active-item-changed', function(event) {
    const item = event.detail.value;
    contactGrid.selectedItems = item ? [item] : [];
  });
  contactGrid.items = handleList;
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
      document.querySelector('i').textContent = JSON.stringify(e.detail.value);
    });

  // addButton.addEventListener('click', e => {
  //   firstNameField.value = 'initialized';
  // });
}