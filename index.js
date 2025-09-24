
require('dotenv').config();

const functions = require('./lib/functions.js');
const tls = require('tls')
const fs = require('fs');
const { adsb2cot } = require('./lib/functions.js');
const objects = require('./lib/objectcache.js')

const url = process.env.REMOTE_SERVER_URL
const sslCert = process.env.REMOTE_SSL_USER_CERTIFICATE
const sslKey = process.env.REMOTE_SSL_USER_KEY
const apiKey = process.env.API_KEY

if (!functions.checkFile(sslCert)) process.exit();
if (!functions.checkFile(sslKey)) process.exit();

const logCot = (typeof process.env.LOGCOT !== 'undefined') ? (process.env.LOGCOT == "true") : false;
const intervallSecs = (typeof process.env.UPDATE_RATE !== 'undefined') ? process.env.UPDATE_RATE : 5;
const heartbeatIntervall = 30 * 1000;

process.env.TZ = 'UTC';

const run = () => {

  require('./lib/wssClient.js')

  const cotURL = url.match(/^ssl:\/\/(.+):([0-9]+)/)
  if (!cotURL) return

  const options = {
    host: cotURL[1],
    port: cotURL[2],
    cert: fs.readFileSync(sslCert),
    key: fs.readFileSync(sslKey),
    rejectUnauthorized: false
  }

  const client = tls.connect(options, () => {
    if (client.authorized) {
      console.log("Connection authorized by a Certificate Authority.")
    } else {
      console.log("Connection not authorized: " + client.authorizationError + " - ignoring")
    }
    heartbeat();
  })

  client.on('data', (data) => {
    if (logCot === true) {
      //console.log(data.toString());
    }
  })

  client.on('error', (err) => {
    console.error(`Could not connect to SSL host ${url}`);
    console.error(err);
    process.exit();
  })

  client.on('close', () => {
    console.info(`Connection to SSL host ${url} closed`)
    process.exit();
  })

  function heartbeat() {
    client.write(functions.heartbeatcot(intervallSecs));
    if (logCot === true) {
      console.log(functions.heartbeatcot(intervallSecs));
      console.log('----------------------------------------')
    }
  }

  function dumpObjects() {
    heartbeat();
    objectCache = objects.getCache();
    list = objectCache.keys();
    cache = objectCache.mget(list);
    for (const [uid, cot] of Object.entries(cache)) {
      let stale = 10 * 60 * 60 // 10 minutes
      let cotevent = functions.ais2cot(cot,stale);
      if (typeof (cotevent) !== 'undefined') {
        if (logCot === true) {
          console.log(cotevent);
        }
        client.write(cotevent);
      }
    }
    //console.log('----------------------------------------')
    setTimeout(dumpObjects, (intervallSecs * 1000));
  }

  dumpObjects();

};

if (url && sslCert && sslKey && apiKey) {
  run();
}
