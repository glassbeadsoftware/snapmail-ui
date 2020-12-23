import * as ConductorApi from '@holochain/conductor-api';

const TIMEOUT = 6000

const ADMIN_PORT = 8000
const APP_PORT = 8080

var noop = function() { };

/**
 *
 */
const printAdmin = () => {
  g_adminWs.listDnas().then((dnaList) => {
    console.log({dnaList})
  })
  adminConnection.listCellIds().then((cellList) => {
    console.log({cellList})
  })
  adminConnection.listActiveApps().then((appList) => {
    console.log({appList})
  })
}
module.exports.printAdmin = printAdmin;

// -- CONNECT TO ADMIN -- //

var g_adminWs = undefined;
var g_newKey = undefined;
ConductorApi.AdminWebsocket.connect(`http://localhost:${ADMIN_PORT}`, TIMEOUT).then((adminWs) => {
  g_adminWs = adminWs
  adminConnection.generateAgentPubKey().then((newKey) => {
    g_newKey = newKey
    //printAdmin()
  })
})


// -- CONNECT TO APP -- //

const receiveSignal = (signal/*: AppSignal*/) => {
  // impl...
  console.log({signal})
  resolve()
}

var g_appId = undefined
var g_cellId = undefined
var g_cellNick = undefined
var g_appClient = undefined
ConductorApi.AppWebsocket.connect(`http://localhost:${APP_PORT}`, TIMEOUT, receiveSignal).then((appId, cellId, cellNick, appClient) => {
  g_appId = appId
  g_cellId = cellId
  g_cellNick = cellNick
  g_appClient = appClient
  console.log('*** Connected to Snapmail app: ' + g_appId)
  console.log({g_cellId})
  console.log({g_cellNick})
})

/**
 *
 */
const dumpState = (cellId) => {
  g_adminWs.dumpState(cellId).then((stateDump) => {
    console.log('stateDump of cell ' + cellId)
    console.log({stateDump})
  })
}
module.exports.dumpState = dumpState;

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
