var holochain_connection = holochainclient.connect();

function getMyHandle(callback) {
  holochain_connection.then(({callZome, close}) => {
    callZome(
      'test-instance',
      'snapmail',
      'get_my_handle',
    )({}).then(result => callback(result));
  });
}

function getHandle(myAgentId, callback) {
  holochain_connection.then(({callZome, close}) => {
    callZome(
      'test-instance',
      'snapmail',
      'get_handle',
    )({agentId: myAgentId}).then(result => callback(result));
  });
}

function setHandle(username, callback) {
  holochain_connection.then(({callZome, close}) => {
    callZome(
      'test-instance',
      'snapmail',
      'set_handle',
    )({name: username}).then(result => callback(result));
  });
}