/**
 * @param callResult
 */
function show_output(callResult) {
  var span = document.getElementById('output');
  span.textContent = ' ' + callResult.Ok;
}

function setMyHandle() {
  let input = document.getElementById('myNewHandleInput');
  console.log('input = ' + input.value);
  setHandle(input.value, console.log);
  input.value = '';
}