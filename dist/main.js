var holochain_connection = holochainclient.connect();
function getMyHandle() {
  holochain_connection.then(({callZome, close}) => {
    callZome(
      'test-instance',
      'snapmail',
      'get_my_handle',
    )({args: {}}).then(result => console.log(result));
  });
}
