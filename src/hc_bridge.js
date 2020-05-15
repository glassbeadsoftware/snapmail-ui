// Bridge to the DNA
// Wrapper function for each zome function

var holochain_connection = holochainclient.connect();

/**
 * Try
 * info/instances
 * "admin/ui/list"
 * 'agent/keystore/list'
 * 'agent/keystore/get_public_key' src_id
 */
const call_conductor = (functionName, params = {}) => {
  return new Promise((succ, err)=>{
    //connect(process.env.NODE_ENV==="development"?{ url: "ws://localhost:8888"}:undefined)
    holochain_connection.then(async ({call, close}) => {
      console.log('conductor call: ' + functionName + '(' + JSON.stringify(params) + ')')
      let response = await call(functionName)(params)
      console.log(response)
      succ(JSON.parse(response))
    }).catch(error=>{
      err(error)
    })
  })
}

const call_dna = (functionName, params = {}) => {
  return new Promise((succ, err)=>{
    //connect(process.env.NODE_ENV==="development"?{ url: "ws://localhost:8888"}:undefined)
    holochain_connection.then(async ({callZome, close, onSignal}) => {
      // FIXME handle onSignal
      let response = await callZome('test-instance', 'snapmail', functionName)(params)
      console.log('dna call: ' + functionName + '(' + JSON.stringify(params) + ')')
      console.log(response)
      succ(JSON.parse(response))
    }).catch(error=>{
      err(error)
    })
  })
}

// -- Conductor -- //

function getMyAgentId(callback) {
  call_conductor('info/instances', {}).then(result => callback(result));
}


// -- Handle -- //

function getMyHandle(callback) {
  call_dna('get_my_handle', {}).then(result => callback(result));
}

function getHandle(myAgentId, callback) {
  call_dna('get_handle', {agentId: myAgentId}).then(result => callback(result));
}

function setHandle(username, callback) {
  call_dna('set_handle', {name: username}).then(result => callback(result));
}

function getAllHandles(callback) {
  call_dna('get_all_handles', {}).then(result => callback(result));
}

function findAgent(address, callback) {
  call_dna('find_agent', {agentId: address}).then(result => callback(result));
}

function pingAgent(address, callback) {
  call_dna('ping_agent', {agentId: address}).then(result => callback(result));
}


// -- Mail -- //

function sendMail(mail, callback) {
  call_dna('send_mail', {subject: mail.subject, payload: mail.payload, to: mail.to, cc: mail.cc, bcc: mail.bcc}).then(result => callback(result));
}

function getMail(otherAgentId, callback) {
  call_dna('get_mail', {address: otherAgentId}).then(result => callback(result));
}

function deleteMail(mailAddress, callback) {
  call_dna('delete_mail', {address: mailAddress}).then(result => callback(result));
}

function getAllArrivedMail(callback) {
  call_dna('get_all_arrived_mail', {}).then(result => callback(result));
}

function getAllMails(callback, afterCallback) {
  call_dna('get_all_mails', {}).then(result => {callback(result); afterCallback();});
}

function checkIncomingMail(callback) {
  call_dna('check_incoming_mail', {}).then(result => callback(result));
}

function checkIncomingAck(callback) {
  call_dna('check_incoming_ack', {}).then(result => callback(result));
}

function acknowledgeMail(address, callback) {
  call_dna('acknowledge_mail', {inmail_address: address}).then(result => callback(result));
}

function hasMailBeenReceived(address, callback) {
  call_dna('has_mail_been_received', {outmail_address: address}).then(result => callback(result));
}

function hasAckBeenReceived(address, callback) {
  call_dna('has_ack_been_received', {inmail_address: address}).then(result => callback(result));
}
