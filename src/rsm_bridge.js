
// ConductorApi.AppWebsocket.connect('ws://localhost:8888').then(
//   async appWebsocket => {
//     const appInfo = await appWebsocket.appInfo({
//       installed_app_id: 'test-app',
//     });
//     const cellId = appInfo.cell_data[0][0];
//     const context = document.getElementById('provider');
//     context.appWebsocket = appWebsocket;
//     context.cellId = cellId;
//   }
// )

/**
 *
 */
const callDna = (functionName, payload, signalCallback) => {
  return new Promise((succ, err) => {
    if (g_appClient === undefined) {
      console.error("App Client Websocket not connected!")
    }
    return g_appClient.callZome({
      cap: null,
      cell_id: g_cellId,
      zome_name: "snapmail",
      fn_name: functionName,
      provenance: g_newKey,
      payload: payload,
    }, 30000) // default timeout set here (30000) will overwrite the defaultTimeout(12000) set above
  })
}
module.exports.callDna = callDna;

// -- Handle -- //

function getMyHandle(callback, signalCallback) {
  callDna('get_my_handle', undefined, signalCallback).then(result => callback(result));
}
module.exports.getMyHandle = getMyHandle;

function getHandle(myAgentId, callback, signalCallback) {
  callDna('get_handle', {agentId: myAgentId}, signalCallback).then(result => callback(result));
}
module.exports.getHandle = getHandle;

function setHandle(username, callback, signalCallback) {
  callDna('set_handle', username, signalCallback).then(result => callback(result));
}
module.exports.setHandle = setHandle;

function getAllHandles(callback, signalCallback) {
  callDna('get_all_handles', undefined, signalCallback).then(result => callback(result));
}
module.exports.getAllHandles = getAllHandles;

function findAgent(handle, callback, signalCallback) {
  callDna('find_agent', handle, signalCallback).then(result => callback(result));
}
module.exports.findAgent = findAgent;

function pingAgent(agentId, callback, signalCallback) {
  callDna('ping_agent', agentId, signalCallback).then(result => callback(result));
}
module.exports.pingAgent = pingAgent;

// -- Mail -- //

function sendMail(mail, callback, signalCallback) {
  callDna('send_mail', {subject: mail.subject, payload: mail.payload, to: mail.to, cc: mail.cc, bcc: mail.bcc, manifest_address_list: mail.manifest_address_list}, signalCallback).then(result => callback(result));
}
module.exports.sendMail = sendMail;

function getMail(otherAgentId, callback, signalCallback) {
  callDna('get_mail', otherAgentId, signalCallback).then(result => callback(result));
}
module.exports.getMail = getMail;

function deleteMail(mailAddress, callback, signalCallback) {
  callDna('delete_mail', mailAddress, signalCallback).then(result => callback(result));
}
module.exports.deleteMail = deleteMail;

function getAllArrivedMail(callback, signalCallback) {
  callDna('get_all_arrived_mail', undefined, signalCallback).then(result => callback(result));
}
module.exports.getAllArrivedMail = getAllArrivedMail;

function getAllMails(callback, afterCallback, signalCallback) {
  callDna('get_all_mails', undefined, signalCallback).then(result => {callback(result); afterCallback();});
}
module.exports.getAllMails = getAllMails;

function checkIncomingMail(callback, signalCallback) {
  callDna('check_incoming_mail', undefined, signalCallback).then(result => callback(result));
}
module.exports.checkIncomingMail = checkIncomingMail;

function checkIncomingAck(callback, signalCallback) {
  callDna('check_incoming_ack', undefined, signalCallback).then(result => callback(result));
}
module.exports.checkIncomingAck = checkIncomingAck;

function acknowledgeMail(address, callback, signalCallback) {
  callDna('acknowledge_mail', address, signalCallback).then(result => callback(result));
}
module.exports.acknowledgeMail = acknowledgeMail;

function hasMailBeenReceived(address, callback, signalCallback) {
  callDna('has_mail_been_received', address, signalCallback).then(result => callback(result));
}
module.exports.hasMailBeenReceived = hasMailBeenReceived;

function hasAckBeenReceived(address, callback, signalCallback) {
  callDna('has_ack_been_received', address, signalCallback).then(result => callback(result));
}
module.exports.hasAckBeenReceived = hasAckBeenReceived;
