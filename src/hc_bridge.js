// Bridge to the DNA
// Wrapper function for each zome function

var holochain_connection = holochainclient.connect();

/**
 * Not working
 * Try:
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

const call_dna = (functionName, params = {}, signalCallback) => {
  return new Promise((succ, err) => {
    //connect(process.env.NODE_ENV==="development"?{ url: "ws://localhost:8888"}:undefined)
    holochain_connection.then(async ({callZome, close, onSignal}) => {
      // handle onSignal
      onSignal((signal) => {
        console.log('Signal received: ' + JSON.stringify(signal))
        signalCallback(signal)
      })
      // do call
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

function getMyAgentId(callback, signalCallback) {
  call_conductor('info/instances', {}, signalCallback).then(result => callback(result));
}


// -- Handle -- //

function getMyHandle(callback, signalCallback) {
  call_dna('get_my_handle', {}, signalCallback).then(result => callback(result));
}

function getHandle(myAgentId, callback, signalCallback) {
  call_dna('get_handle', {agentId: myAgentId}, signalCallback).then(result => callback(result));
}

function setHandle(username, callback, signalCallback) {
  call_dna('set_handle', {name: username}, signalCallback).then(result => callback(result));
}

function getAllHandles(callback, signalCallback) {
  call_dna('get_all_handles', {}, signalCallback).then(result => callback(result));
}

function findAgent(address, callback, signalCallback) {
  call_dna('find_agent', {agentId: address}, signalCallback).then(result => callback(result));
}

function pingAgent(address, callback, signalCallback) {
  call_dna('ping_agent', {agentId: address}, signalCallback).then(result => callback(result));
}


// -- Mail -- //

function sendMail(mail, callback, signalCallback) {
  call_dna('send_mail', {subject: mail.subject, payload: mail.payload, to: mail.to, cc: mail.cc, bcc: mail.bcc}, signalCallback).then(result => callback(result));
}

function getMail(otherAgentId, callback, signalCallback) {
  call_dna('get_mail', {address: otherAgentId}, signalCallback).then(result => callback(result));
}

function deleteMail(mailAddress, callback, signalCallback) {
  call_dna('delete_mail', {address: mailAddress}, signalCallback).then(result => callback(result));
}

function getAllArrivedMail(callback, signalCallback) {
  call_dna('get_all_arrived_mail', {}, signalCallback).then(result => callback(result));
}

function getAllMails(callback, afterCallback, signalCallback) {
  call_dna('get_all_mails', {}, signalCallback).then(result => {callback(result); afterCallback();});
}

function checkIncomingMail(callback, signalCallback) {
  call_dna('check_incoming_mail', {}, signalCallback).then(result => callback(result));
}

function checkIncomingAck(callback, signalCallback) {
  call_dna('check_incoming_ack', {}, signalCallback).then(result => callback(result));
}

function acknowledgeMail(address, callback, signalCallback) {
  call_dna('acknowledge_mail', {inmail_address: address}, signalCallback).then(result => callback(result));
}

function hasMailBeenReceived(address, callback, signalCallback) {
  call_dna('has_mail_been_received', {outmail_address: address}, signalCallback).then(result => callback(result));
}

function hasAckBeenReceived(address, callback, signalCallback) {
  call_dna('has_ack_been_received', {inmail_address: address}, signalCallback).then(result => callback(result));
}
