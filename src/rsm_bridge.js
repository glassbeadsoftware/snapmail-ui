
import { AdminWebsocket, AppWebsocket } from '@holochain/conductor-api';

const TIMEOUT = 6000

const ADMIN_PORT = 1234
//const APP_PORT = 8888
//let APP_URL = process.env.APP_URL? process.env.APP_URL : `ws://localhost:${APP_PORT}`
let ADMIN_URL = process.env.CONDUCTOR_URL? process.env.CONDUCTOR_URL : `ws://localhost:${ADMIN_PORT}`

const HREF_PORT = window.location.port
const APP_PORT = parseInt(window.location.port) + 800
let APP_URL =`ws://localhost:${APP_PORT}`


var g_adminWs = undefined
var g_cellId = undefined
var g_appClient = undefined
var g_appId = undefined
var g_newKey = undefined
var g_cellNick = undefined

// AppSignal {
//   cellId: [Uint8Array(39), Uint8Array(39)],
//     payload: any,
//     type: "Signal"
// }
var receiveSignal = (signal/*: AppSignal*/) => {
  // impl...
  console.log('Received signal:')
  console.log({signal})
  //resolve()
}

// -- CONNECT TO ADMIN -- //

/**
 *
 * @returns {Promise<void>}
 */
export async function rsmConnect(signalCallback) {
  //  g_adminWs = await AdminWebsocket.connect(ADMIN_URL, TIMEOUT)
  // console.log('*** Connected to RSM Admin: ' + JSON.stringify(g_adminWs))
  // // g_adminWs.generateAgentPubKey().then((newKey) => {
  // //     g_newKey = newKey
  // //     console.log({newKey})
  // //     printAdmin()
  // // })

  // -- CONNECT TO APP -- //
  let env = window.location
  console.log(env)
  console.log('*** Connected to Snapmail app at : ' + APP_URL)
  g_appClient = await AppWebsocket.connect(APP_URL, signalCallback);
  console.log('*** Connected to Snapmail app: ' + JSON.stringify(g_appClient))
  const appInfo = await g_appClient.appInfo({ installed_app_id: 'test-app' }, 1000)
  console.log({appInfo})
  g_cellId = appInfo.cell_data[0][0];
  console.log({g_cellId})
  await dumpState(g_cellId)

  return g_cellId[1];
}

/**
 *
 */
const printAdmin = () => {
  console.log("printAdmin:")
  g_adminWs.listDnas().then((dnaList) => {
    console.log({dnaList})
  })
  g_adminWs.listCellIds().then((cellList) => {
    console.log({cellList})
  })
  g_adminWs.listActiveApps().then((appList) => {
    console.log({appList})
  })
}

/**
 *
 */
const dumpState = async (cellId) => {
  if (g_adminWs === undefined) {
    console.log('dumpState() Error: g_adminWs undefined')
    //resolve()
    return
  }
  const stateDump = await g_adminWs.dumpState({cell_id: cellId})
  console.log('stateDump of cell:')
  console.log({stateDump})
}


/**
 *
 * @returns {Promise<any>}
 */
export async function callDna (functionName, payload) {
    if (g_appClient === undefined) {
      console.error("App Client Websocket not connected!")
      return Promise.Reject("App Client Websocket not connected!")
    }
    //console.log("*** callDna() => " + functionName + '()')
    let result = await g_appClient.callZome({
      cap: null,
      cell_id: g_cellId,
      zome_name: "snapmail",
      fn_name: functionName,
      provenance: g_cellId[1],
      payload: payload,
    }, 30000) // default timeout set here (30000) will overwrite the defaultTimeout(12000) set above
  console.log("*** callDna() => " + functionName + '() result:')
  console.log({result})
  return result;
}

// -- Handle -- //

export function getMyHandle(callback) {
  callDna('get_my_handle', null).then(result => callback(result));
}

export function getHandle(myAgentId, callback) {
  callDna('get_handle', {agentId: myAgentId}).then(result => callback(result));
}

export function setHandle(username, callback) {
  callDna('set_handle', username).then(result => callback(result));
}

export function getAllHandles(callback) {
  callDna('get_all_handles', null).then(result => callback(result));
}

export function findAgent(handle, callback) {
  callDna('find_agent', handle).then(result => callback(result));
}

export function pingAgent(agentId, callback) {
  console.log('*** pingAgent() called!')
  callDna('ping_agent', agentId).then(result => callback(result));
}

// -- Mail -- //

export function sendMail(mail, callback) {
  callDna('send_mail', {subject: mail.subject, payload: mail.payload, to: mail.to, cc: mail.cc, bcc: mail.bcc, manifest_address_list: mail.manifest_address_list}).then(result => callback(result));
}

export function getMail(otherAgentId, callback) {
  callDna('get_mail', otherAgentId).then(result => callback(result));
}

export function deleteMail(mailAddress, callback) {
  callDna('delete_mail', mailAddress).then(result => callback(result));
}

export function getAllArrivedMail(callback) {
  callDna('get_all_arrived_mail', undefined).then(result => callback(result));
}

export function getAllMails(callback, afterCallback) {
  callDna('get_all_mails', undefined).then(result => {callback(result); afterCallback();});
}

export function checkIncomingMail(callback) {
  callDna('check_incoming_mail', undefined).then(result => callback(result));
}

export function checkIncomingAck(callback) {
  callDna('check_incoming_ack', undefined).then(result => callback(result));
}

export function acknowledgeMail(mailAddress, callback) {
  callDna('acknowledge_mail', mailAddress).then(result => callback(result));
}

export function hasMailBeenReceived(mailAddress, callback) {
  callDna('has_mail_been_received', mailAddress).then(result => callback(result));
}

export function hasAckBeenReceived(mailAddress, callback) {
  callDna('has_ack_been_received', mailAddress).then(result => callback(result));
}
