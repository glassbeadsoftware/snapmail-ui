/**
 * Functions for manipulating mailItems
 */

import {htos} from './utils'

/**
 * All Folders for fileBox
 * @type {{ALL: string, TRASH: string, SENT: string, INBOX: string}}
 */
export const systemFolders = {
  ALL: String.fromCodePoint(0x1F4C1) + ' All',
  INBOX: String.fromCodePoint(0x1F4E5) + ' Inbox',
  SENT: String.fromCodePoint(0x1F4E4) + ' Sent',
  TRASH: String.fromCodePoint(0x1F5D1) + ' Trash'
};

/**
 * Return True if mail has been deleted
 */
export function isMailDeleted(mailItem) {
  let state = mailItem.state;
  if (state.hasOwnProperty('In')) {
    return state.In.hasOwnProperty('Deleted');
  }
  if (state.hasOwnProperty('Out')) {
    return state.Out.hasOwnProperty('Deleted');
  }
  console.error('Invalid mailItem object')
  return false;
}

/**
 * Return True if mail is an OutMail
 */
export function is_OutMail(mailItem) {
  let state = mailItem.state;

  if (state.hasOwnProperty('In')) {
    return false;
  }
  if (state.hasOwnProperty('Out')) {
    return true;
  }
  console.error('Invalid mailItem object')
  return false;
}

// /**
//  * Return True if mail has been acknoweldged by this agent
//  */
// function hasMailBeenOpened(mailItem) {
//   //console.log('hasMailBeenOpened()? ' + JSON.stringify(mailItem.state));
//   let state = mailItem.state;
//
//   if (state.hasOwnProperty('Out')) {
//     return true;
//   }
//   if (state.hasOwnProperty('In')) {
//     return state.In === 'Acknowledged' || state.In === 'AckReceived' || state.In === 'Deleted';
//   }
//   console.error('Invalid mailItem object')
//   return false;
// }


/**
 *
 * Return mailItem class
 */
export function determineMailClass(mailItem) {

  //console.log('determineMailClass()? ' + JSON.stringify(mailItem.state));
  let state = mailItem.state;

  if (state.hasOwnProperty('Out')) {
    if (state.Out.hasOwnProperty('Pending')) return 'pending';
    if (state.Out.hasOwnProperty('PartiallyArrived_NoAcknowledgement')) return 'partially';
    if (state.Out.hasOwnProperty('PartiallyArrived_PartiallyAcknowledged')) return 'partially';
    if (state.Out.hasOwnProperty('Arrived_NoAcknowledgement')) return 'arrived';
    if (state.Out.hasOwnProperty('Arrived_PartiallyAcknowledged')) return 'arrived';
    if (state.Out.hasOwnProperty('Received')) return 'received';
    if (state.Out.hasOwnProperty('Deleted')) return 'deleted';
  }
  if (state.hasOwnProperty('In')) {
    if (state.In.hasOwnProperty('Acknowledged')) return 'received';
    if (state.In.hasOwnProperty('AckReceived')) return 'received';
    if (state.In.hasOwnProperty('Arrived')) return 'newmail';
    if (state.In.hasOwnProperty('Deleted')) return 'deleted';
  }
  console.error('Invalid mailItem object');
  return '';
}


/**
 *
 * @returns {string}
 */
function customDateString(dateItem) {
  let date = new Date(dateItem);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  if (hours < 10) {
    hours = '0' + hours
  }
  const dday = date.toDateString() + ', ' + hours + ':' + minutes
  return dday
}


/**
 *
 * @returns {{date: string, subject: Certificate, id: string | (() => AddressInfo) | (() => (AddressInfo | string)) | (() => (AddressInfo | string | null)) | app.address, username: string, status: string}}
 */
export function into_gridItem(usernameMap, mailItem) {
  let authorId = htos(mailItem.author);
  let username = usernameMap.get(authorId)
  console.log('into_gridItem: ' + authorId + ' -> ' + username)
  let dateStr = customDateString(mailItem.date)
  if (mailItem.state.hasOwnProperty('Out')) {
    if (mailItem.mail.hasOwnProperty('to')) {
      const recepient = htos(mailItem.mail.to[0])
      username = 'To: ' + usernameMap.get(recepient)
    } else if (mailItem.mail.hasOwnProperty('cc')) {
      const recepient = htos(mailItem.mail.cc[0])
      username = 'To: ' + usernameMap.get(recepient)
    } else if (mailItem.mail.hasOwnProperty('bcc')) {
      const recepient = htos(mailItem.mail.bcc[0])
      username = 'To: ' + usernameMap.get(recepient)
    }
  }
  let status = mailItem.mail.attachments.length > 0? String.fromCodePoint(0x1F4CE) : '';
  //let status = '';
  let item = {
    "id": mailItem.address, "username": username, "subject": mailItem.mail.subject, "date": dateStr, "status": status
  };
  return item;
}


/**
 *
 * @returns {string}
 */
export function into_mailText(usernameMap, mailItem) {
  let intext = 'Subject: ' + mailItem.mail.subject + '\n\n'
    + mailItem.mail.payload + '\n\n'
    + 'Mail from: ' + usernameMap.get(htos(mailItem.author)) + ' at ' + customDateString(mailItem.date);
  let to_line = '';
  for (let item of mailItem.mail.to) {
    to_line += ' ' + usernameMap.get(htos(item));
  }
  let cc_line = '';
  let can_cc = false;
  for (let item of mailItem.mail.cc) {
    cc_line += ' ' + usernameMap.get(htos(item));
    can_cc = true;
  }
  let bcc_line = '';
  let can_bcc = false;
  for (let item of mailItem.bcc) {
    bcc_line += ' ' + usernameMap.get(htos(item));
    can_bcc = true;
  }
  intext += '\nTo: ' + to_line;
  if (can_cc) {
    intext += '\nCC: ' + cc_line;
  }
  if (can_bcc) {
    intext += '\nBCC: ' + bcc_line;
  }

  // Debug info
  if (process.env.NODE_ENV === 'dev') {
    intext += '\n\nDEBUG INFO';
    intext += '\nState: ' + JSON.stringify(mailItem.state);
    intext += '\nAddress: ' + htos(mailItem.address);
    intext += '\nFiles: ' + mailItem.mail.attachments.length;
  }

  return intext;
}
