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
    "id": mailItem.date, "username": username, "subject": mailItem.mail.subject, "date": dateStr,
  };
  return item;
}