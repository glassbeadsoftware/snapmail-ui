var holochain_connection = holochainclient.connect();

const call_dna = (functionName, params = {}) => {
  return new Promise((succ, err)=>{
    //connect(process.env.NODE_ENV==="development"?{ url: "ws://localhost:8888"}:undefined)
    holochain_connection.then(async ({callZome, close}) => {
      let response = await callZome('test-instance', 'snapmail', functionName)(params)
      console.log('dna call: ' + functionName + '(' + JSON.stringify(params) + ')')
      console.log(response)
      //succ(response)
      succ(JSON.parse(response))
    }).catch(error=>{
      err(error)
    })
  })
}

function getMyHandle(callback) {
  call_dna('get_my_handle', {}).then(result => callback(result));
}

function getHandle(myAgentId, callback) {
  call_dna('get_handle', {agentId: myAgentId}).then(result => callback(result));
}

function setHandle(username, callback) {
  call_dna('set_handle', {name: username}).then(result => callback(result));
}