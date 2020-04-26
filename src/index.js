import '@vaadin/vaadin-button';
import '@vaadin/vaadin-grid';
import '@vaadin/vaadin-item';
import '@vaadin/vaadin-text-field';
import '@vaadin/vaadin-ordered-layout';
import '@vaadin/vaadin-menu-bar';
import '@vaadin/vaadin-list-box';
import '@vaadin/vaadin-split-layout';

window.addEventListener('load', () => {
  initUI();
});


function initUI() {

  // const firstNameField = document.querySelector('#firstName');
  // const addButton = document.querySelector('#addButton');

  // -- Filebox Grid -- //

  let fileboxItems = [
    {
      "username": "toto",
      "subject": "hello mail",
      "date": "42",
    }]

  document.querySelector('vaadin-grid').items = fileboxItems;




    // -- Menu -- //

    const menu = document.querySelector('#MenuBar');
    menu.addEventListener('item-selected', function(e) {
      document.querySelector('i').textContent = JSON.stringify(e.detail.value);
    });
    menu.items = [
      {
        text: 'Project',
        children: [
          {text: 'Users',
            children: [{text: 'List'}, {text: 'Add'}]
          },
          {text: 'Billing',
            children: [{text: 'Invoices'}, {text: 'Balance Events'}]
          },
        ]
      },
      {
        text: 'Account',
        children: [
          {text: 'Edit Profile'},
          {text: 'Privacy Settings'}
        ]
      },
      {text: 'Sign Out'}
    ];


    // -- Action Bar --//

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