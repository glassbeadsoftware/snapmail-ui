const CHUNK_MAX_SIZE = 200 * 1024;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function sha256(message) {
  //console.log('message: ' + message)
  const myBitArray = sjcl.hash.sha256.hash(message)
  //console.log('myBitArray: ' + JSON.stringify(myBitArray))
  const hashHex = sjcl.codec.hex.fromBits(myBitArray)
  //console.log('hashHex: ' + hashHex)
  return hashHex;
}

function chunkSubstr(str, size) {
  var numChunks = Math.ceil(str.length / size);
  var chunks = new Array(numChunks);

  for(var i = 0, o = 0; i < numChunks; ++i, o += size) {
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