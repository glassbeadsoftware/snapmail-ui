/**
 * @param callResult
 */
function show_output(callResult) {
  console.log(callResult);
  var span = document.getElementById('output');
  var output = JSON.parse(callResult);
  span.textContent = ' ' + output.Ok;
}

function setMyHandle() {
  let input = document.getElementById('myHandleInput');
  console.log('input = ' + input.value);
  setHandle(input.value, console.log)
}