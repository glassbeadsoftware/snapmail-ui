
const CHUNK_MAX_SIZE = 200 * 1024;

import * as base64 from "byte-base64";


export var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;


/** Convert hash (Uint8Array) to/from base64 string */
export function htos(u8array) {
  if (!u8array) {
    console.error("htos() argument is undefined")
  }
  return base64.bytesToBase64(u8array)
}
export function stoh(str) {
  if (!str) {
    console.error("stoh() argument is undefined")
  }
  return base64.base64ToBytes(str)
}


/** */
export function cellIdToStr(cell) {
  let res = '('
  res += htos(cell.cellId[0])
  res += ', '
  res += htos(cell.cellId[1])
  res += ')'
  return res
}


/** Sleep via timeout promise */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * @returns {string}
 */
export function arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode( bytes[ i ] );
  }
  return window.btoa( binary );
}


/**
 * @returns {ArrayBufferLike}
 */
export function base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}


/**
 * @returns {*}
 */
export function sha256(message) {
  //console.log('message: ' + message)
  const myBitArray = sjcl.hash.sha256.hash(message)
  //console.log('myBitArray: ' + JSON.stringify(myBitArray))
  const hashHex = sjcl.codec.hex.fromBits(myBitArray)
  //console.log('hashHex: ' + hashHex)
  return hashHex;
}


/**
 * @returns {any[]}
 */
function chunkSubstr(str, size) {
  var numChunks = Math.ceil(str.length / size);
  var chunks = new Array(numChunks);
  for (var i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }
  return chunks;
}


/**
 * @returns {{numChunks: number, dataHash: *, chunks: any[]}}
 */
export function splitFile(full_data_string) {
  const hash = sha256(full_data_string);
  console.log('file hash: ' + hash)
  const chunks = chunkSubstr(full_data_string, CHUNK_MAX_SIZE);
  return {
    dataHash: hash,
    numChunks: chunks.length,
    chunks: chunks,
  }
}
