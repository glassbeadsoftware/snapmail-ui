import '@vaadin/vaadin-button';
import '@vaadin/vaadin-grid';
import '@vaadin/vaadin-text-field';

window.addEventListener('load', () => {
  initUI();
});

function initUI() {
  const firstNameField = document.querySelector('#firstName');
  const addButton = document.querySelector('#addButton');

  addButton.addEventListener('click', e => {
    firstNameField.value = 'initialized';
  });
}