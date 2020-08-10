// Bridge to the DNA
// Wrapper function for each zome function

var holochain_connection = holochainclient.connect();

var noop = function() { };

/**
 * Not working
 * Try:
 * info/instances
 * "admin/ui/list"
 * 'agent/keystore/list'
 * 'agent/keystore/get_public_key' src_id
 */
const callConductor = (functionName, params = {}) => {
  return new Promise((succ, err)=>{
    //connect(process.env.NODE_ENV==="development"?{ url: "ws://localhost:8888"}:undefined)
    holochain_connection.then(async ({call, close}) => {
      console.log('conductor call: ' + functionName + '(' + JSON.stringify(params) + ')')
      let response = await call(functionName)(params);
      console.log(response);
      succ(JSON.parse(response))
    }).catch(error=>{
      err(error)
    })
  })
}
module.exports.callConductor = callConductor;

const callDna = (functionName, params = {}, signalCallback) => {
  return new Promise((succ, err) => {
    //connect(process.env.NODE_ENV==="development"?{ url: "ws://localhost:8888"}:undefined)
    holochain_connection.then(async ({callZome, close, onSignal}) => {
      // handle onSignal
      onSignal((signal) => {
        console.log('Signal received during call to ' + functionName + '(): ' + JSON.stringify(signal));
        signalCallback(signal);
      })
      // do call
      let response = await callZome('test-instance', 'snapmail', functionName)(params);
      let paramsStr = JSON.stringify(params);
      if (paramsStr.length > 1024) {
        paramsStr =  paramsStr.substring(0, 1024) + ' ...';
      }
      console.log('dna call: ' + functionName + '(' + paramsStr + ')');
      console.log(response);
      succ(JSON.parse(response))
    }).catch(error=>{
      err(error)
    })
  })
}
module.exports.callDna = callDna;

// -- Conductor -- //

function getMyAgentId(callback, signalCallback) {
  callConductor('info/instances', {}, signalCallback).then(result => callback(result));
}
module.exports.getMyAgentId = getMyAgentId;

// -- Handle -- //

function getMyHandle(callback, signalCallback) {
  callDna('get_my_handle', {}, signalCallback).then(result => callback(result));
}
module.exports.getMyHandle = getMyHandle;

function getHandle(myAgentId, callback, signalCallback) {
  callDna('get_handle', {agentId: myAgentId}, signalCallback).then(result => callback(result));
}
module.exports.getHandle = getHandle;

function setHandle(username, callback, signalCallback) {
  callDna('set_handle', {name: username}, signalCallback).then(result => callback(result));
}
module.exports.setHandle = setHandle;

function getAllHandles(callback, signalCallback) {
  callDna('get_all_handles', {}, signalCallback).then(result => callback(result));
}
module.exports.getAllHandles = getAllHandles;

function findAgent(handle, callback, signalCallback) {
  callDna('find_agent', {handle}, signalCallback).then(result => callback(result));
}
module.exports.findAgent = findAgent;

function pingAgent(address, callback, signalCallback) {
  callDna('ping_agent', {agentId: address}, signalCallback).then(result => callback(result));
}
module.exports.pingAgent = pingAgent;

// -- Mail -- //

function sendMail(mail, callback, signalCallback) {
  callDna('send_mail', {subject: mail.subject, payload: mail.payload, to: mail.to, cc: mail.cc, bcc: mail.bcc, manifest_address_list: mail.manifest_address_list}, signalCallback).then(result => callback(result));
}
module.exports.sendMail = sendMail;

function getMail(otherAgentId, callback, signalCallback) {
  callDna('get_mail', {address: otherAgentId}, signalCallback).then(result => callback(result));
}
module.exports.getMail = getMail;

function deleteMail(mailAddress, callback, signalCallback) {
  callDna('delete_mail', {address: mailAddress}, signalCallback).then(result => callback(result));
}
module.exports.deleteMail = deleteMail;

function getAllArrivedMail(callback, signalCallback) {
  callDna('get_all_arrived_mail', {}, signalCallback).then(result => callback(result));
}
module.exports.getAllArrivedMail = getAllArrivedMail;

function getAllMails(callback, afterCallback, signalCallback) {
  callDna('get_all_mails', {}, signalCallback).then(result => {callback(result); afterCallback();});
}
module.exports.getAllMails = getAllMails;

function checkIncomingMail(callback, signalCallback) {
  callDna('check_incoming_mail', {}, signalCallback).then(result => callback(result));
}
module.exports.checkIncomingMail = checkIncomingMail;

function checkIncomingAck(callback, signalCallback) {
  callDna('check_incoming_ack', {}, signalCallback).then(result => callback(result));
}
module.exports.checkIncomingAck = checkIncomingAck;

function acknowledgeMail(address, callback, signalCallback) {
  callDna('acknowledge_mail', {inmail_address: address}, signalCallback).then(result => callback(result));
}
module.exports.acknowledgeMail = acknowledgeMail;

function hasMailBeenReceived(address, callback, signalCallback) {
  callDna('has_mail_been_received', {outmail_address: address}, signalCallback).then(result => callback(result));
}
module.exports.hasMailBeenReceived = hasMailBeenReceived;

function hasAckBeenReceived(address, callback, signalCallback) {
  callDna('has_ack_been_received', {inmail_address: address}, signalCallback).then(result => callback(result));
}
module.exports.hasAckBeenReceived = hasAckBeenReceived;

// -- File -- //

function writeManifest(dataHash, filename, filetype, orig_filesize, chunks, callback, signalCallback) {
  const params = {
    data_hash: dataHash,
    filename, filetype, orig_filesize,
    chunks
  }
  callDna('write_manifest', params, signalCallback).then(result => callback(result));
}
module.exports.writeManifest = writeManifest;

function writeChunk(dataHash, chunkIndex, chunk, callback, signalCallback) {
  const params = {
    data_hash: dataHash,
    chunk_index: chunkIndex,
    chunk
  }
  callDna('write_chunk', params, signalCallback).then(result => callback(result));
}
module.exports.writeChunk = writeChunk;

function getChunk(chunkAddress, callback, signalCallback) {
  callDna('get_chunk', {chunk_address: chunkAddress}, signalCallback).then(result => callback(result));
}
module.exports.getChunk = getChunk;

function getManifest(manifestAddress, callback, signalCallback) {
  callDna('get_manifest', {manifest_address: manifestAddress}, signalCallback).then(result => callback(result));
}
module.exports.getManifest = getManifest;

function findManifest(dataHash, callback, signalCallback) {
  callDna('find_manifest', {data_hash: dataHash}, signalCallback).then(result => callback(result));
}
module.exports.findManifest = findManifest;

function getAllManifests(callback, signalCallback) {
  callDna('get_all_manifests', {}, signalCallback).then(result => callback(result));
}
module.exports.getAllManifests = getAllManifests;

function getMissingAttachments(from, inMailAddress, callback, signalCallback) {
  callDna('get_missing_attachments', {from, inmail_address: inMailAddress}, signalCallback).then(result => callback(result));
}
module.exports.getMissingAttachments = getMissingAttachments;
