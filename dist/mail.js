// Functions for manipulating mailItems

/**
 * Return True if mail is an OutMail
 */
function is_OutMail(mailItem) {
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

/**
 * Return True if mail has been acknoweldged by this agent
 */
function has_been_opened(mailItem) {
  console.log('has_been_opened()? ' + JSON.stringify(mailItem.state));
  let state = mailItem.state;

  if (state.hasOwnProperty('Out')) {
    return true;
  }
  if (state.hasOwnProperty('In')) {
    return state.In === 'Acknowledged' || state.In === 'AckReceived';
  }
  console.error('Invalid mailItem object')
  return false;
}



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

function into_gridItem(mailItem) {
  let username = username_map.get(mailItem.author)
  let dateStr = customDateString(mailItem.date)
  let item = {
    "id": mailItem.address, "username": username, "subject": mailItem.mail.subject, "date": dateStr,
  };
  return item;
}

function into_mailText(mailItem) {
  let intext = 'Subject: ' + mailItem.mail.subject + '\n\n'
    + mailItem.mail.payload + '\n\n'
    + 'Mail from: ' + username_map.get(mailItem.author) + ' at ' + customDateString(mailItem.date);
  let to_line = '';
  for (item of mailItem.mail.to) {
    to_line += ' ' + username_map.get(item);
  }
  let cc_line = '';
  let can_cc = false;
  for (item of mailItem.mail.cc) {
    cc_line += ' ' + username_map.get(item);
    can_cc = true;
  }
  let bcc_line = '';
  let can_bcc = false;
  for (item of mailItem.bcc) {
    bcc_line += ' ' + username_map.get(item);
    can_bcc = true;
  }
  intext += '\nTO: ' + to_line;
  if (can_cc) {
    intext += '\nCC: ' + cc_line;
  }
  if (can_bcc) {
    intext += '\nBCC: ' + bcc_line;
  }
  // Debug info
  intext += '\n\nDEBUG INFO';
  intext += '\nState: ' + JSON.stringify(mailItem.state);
  intext += '\nAddress: ' + mailItem.address;
  return intext;
}