
const CHUNK_MAX_SIZE = 200 * 1024;


var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
module.exports.base64regex = base64regex;

/**
 * Sleep via timeout promise
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
module.exports.sleep = sleep;

/**
 *
 * @param buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode( bytes[ i ] );
  }
  return window.btoa( binary );
}
module.exports.arrayBufferToBase64 = arrayBufferToBase64;

function base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
module.exports.base64ToArrayBuffer = base64ToArrayBuffer;

function sha256(message) {
  //console.log('message: ' + message)
  const myBitArray = sjcl.hash.sha256.hash(message)
  //console.log('myBitArray: ' + JSON.stringify(myBitArray))
  const hashHex = sjcl.codec.hex.fromBits(myBitArray)
  //console.log('hashHex: ' + hashHex)
  return hashHex;
}
module.exports.sha256 = sha256;

function chunkSubstr(str, size) {
  var numChunks = Math.ceil(str.length / size);
  var chunks = new Array(numChunks);

  for (var i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }

  return chunks;
}

function splitFile(full_data_string) {
  const hash = sha256(full_data_string);
  console.log('file hash: ' + hash)
  const chunks = chunkSubstr(full_data_string, CHUNK_MAX_SIZE);

  return {
    dataHash: hash,
    numChunks: chunks.length,
    chunks: chunks,
  }
}
module.exports.splitFile = splitFile;
