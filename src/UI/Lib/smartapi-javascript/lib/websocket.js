
let atob = require('atob');
let pako = require('pako');

let triggers = {
  "connect": [],
  "tick": [],
  "close": [],
};

let AppWebSocket = function (params) {
  let self = this;

  let url = params.url || 
  'wss://omnefeeds.angelbroking.com/NestHtml5Mobile/socket/stream'
//   "wss://wsfeeds.angelbroking.com/NestHtml5Mobile/socket/stream";

  let ws = null;
  let client_code = params.client_code || null;
  let feed_token = params.feed_token || null;

  this.connect = function () {
       return new Promise((resolve, reject) => {
            if (client_code === null || feed_token === null) return "client_code or feed_token or task is missing";

            ws = new WebSocket(url);
            ws.onopen = function onOpen(evt) {
                 var _req = '{"task":"cn","channel":"","token":"' + feed_token + '","user": "' + client_code + '","acctid":"' + client_code + '"}';
                 ws.readyState && ws.send(_req);

                 this.intervalId = setInterval(function () {
                      var _hb_req = '{"task":"mw","channel":"","token":"' + feed_token + '","user": "' + client_code + '","acctid":"' + client_code + '"}';
                      ws.readyState && ws.send(_hb_req);
                 }, 60000);
                 resolve()
            };
            ws.onmessage = function (evt) {
                 let strData = atob(evt.data);

                 // Convert binary string to character-number array
                 var charData = strData.split('').map(function (x) { return x.charCodeAt(0); });

                 // Turn number array into byte-array
                 var binData = new Uint8Array(charData);

                 // Pako magic
                 var result = _atos(pako.inflate(binData));
                 trigger("tick", [JSON.parse(result)]);
            };
            ws.onerror = function (evt) {
               //   console.log("error::", evt)
                 self.connect();
                 reject(evt)
            };
            ws.onclose = function (evt) {
               clearInterval(this.intervalId)
               //   console.log("Socket closed in ")
                 trigger("close", [true])
            };
       })
  }

  this.runScript = function (script, task) {
       if (task === null) return "task is missing";
       if (task === "mw" || task === "sfi" || task === "dp") {
            var strwatchlistscrips = script;   //"nse_cm|2885&nse_cm|1594&nse_cm|11536";
            var _req = '{"task":"' + task + '","channel":"' + strwatchlistscrips + '","token":"' + feed_token + '","user": "' + client_code + '","acctid":"' + client_code + '"}';
            ws.send(_req);
       } else return "Invalid task provided";
  };

  this.on = function (e, callback) {
       if (triggers.hasOwnProperty(e)) {
            triggers[e].push(callback);
       }
  };


  this.close = function () {
       ws.close()
  }
}

function _atos(array) {
  var newarray = [];
  try {
       for (var i = 0; i < array.length; i++) {
            newarray.push(String.fromCharCode(array[i]));
       }
  } catch (e) { }

  return newarray.join('');
}

// trigger event callbacks
function trigger(e, args) {
  if (!triggers[e]) return
  for (var n = 0; n < triggers[e].length; n++) {
       triggers[e][n].apply(triggers[e][n], args ? args : []);
  }
}

module.exports = AppWebSocket;