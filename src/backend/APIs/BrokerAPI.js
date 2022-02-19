const config  =  require('../Config/config');
const utils =  require('../Utils/utils');

const https = require('https')
let { SmartAPI, WebSocket } = require("smartapi-javascript");


const BrokerAPI = class BrokerAPI extends SmartAPI{
  constructor(cb, tickReceiver){
    super({ api_key: config.API_KEY})
    this.tickReceiver = tickReceiver
    this.initSmartAPI(cb)
    this.connected = false
    this.list = []
  }

  initSmartAPI = (cb)=>{
    this.generateSession(config.CLIENT_ID, config.PASSWORD)
      .then((res)=>{
        this.config = {
          feedToken: res["data"]["feedToken"],
          jwtToken: res["data"]["jwtToken"],
          refreshToken: res["data"]["refreshToken"]
        }
        // this.initWebSocket()
        // this.getDetails()
        // this.getPositions(p=>console.log(p))
        cb(true)
      }).catch(ex => {
        console.log("catch ::generateSession::",ex);
        cb(false)
      })
  }

  getInstruments(){
    https.get(config.INSTRUMENTS_URL,(res) => {
      let body = "";
      res.on("data", (chunk) => {
          body += chunk;
      });
      res.on("end", () => {
          try {
              utils.downloadFile(JSON.parse(body))
          } catch (error) {
              console.error(error.message);
          };
      });
  }).on("error", (error) => {
      console.error(error.message);
  });
  }

  getLTPData(params, cb){
    // console.log(params);
    this.getLTP(params).then(d=>{
      if (d.status && cb) {
        cb(d.data)
      }
    }).catch(ex => console.log("catch ::getLTPData::",ex))
  }

  initWebSocket(){
    this.ws = new WebSocket({
      client_code: config.CLIENT_ID,    
      feed_token: this.config.feedToken,
    })
    this.ws.on('close', (close)=>{
      this.connected && this.connectWebSocket(this.list, (connected)=>{}, true)
    })
    this.ws.on('tick', (tick)=>{
      let output = {}
      // console.log(tick);
      tick.forEach((t)=>{
        if (t.ltt && (t.e === 'nse_fo' ? t.ltt !== 'NA': t.e === 'nse_cm') && t.name==='sf' && t.tk){
          output[t.tk] = t
        }
      })
      Object.keys(output).length>0 && this.tickReceiver(output)
    })
  }  

  resetWebSocket(list, cb){
    this.closeWebsocket()
    this.connectWebSocket(list, cb)
  }

  connectWebSocket(list, cb, force=false){
    if(!this.connected || force){
      this.connected = true
      this.list = list
      this.ws.connect()
        .then((res)=>{
          // console.log("WS connected");
          this.ws.runScript(utils.createScript(list), 'mw');
          cb && cb(true)
      }).catch(err => {
        console.log("catch ::connectWebSocket::",err)
        this.connected = false
        cb && cb(false)
      })
    }
  }

  closeWebsocket(){
    if(this.connected){
      this.ws.close()
      this.connected = false
    }
  }

  getDetails(){
    this.getProfile().then(d=>{
      console.log("getProfile:")
      console.log(d.data)
    })
    this.getOrderBook().then(d=>{
      console.log("getOrderBook:")
      console.log(d)
    })
    this.getTradeBook().then(d=>{
      console.log("getTradeBook:")
      console.log(d)
    })
    this.getHolding().then(d=>{
      console.log("getHolding:")
      console.log(d)
    })
    this.getRMS().then(d=>{
      console.log("getRMS:")
      console.log(d)
    })
  }
  getProfileDetails(cb){
    this.getProfile().then(d=>{
      console.log("getProfile:")
      console.log(d.data)
      cb && cb(d.data)
    })
  }
  getPositions(cb){ // return [] of positions
    this.getPosition().then(d=>{
      if( d.status && d.data ){
        // console.log(d.data);
        cb && cb(d.data
          .filter(p => p.instrumenttype === config.INSTRUMENT_TYPE)
          .map(p => utils.positionObject(p)
          ))
      }else {
        cb && cb(false)
      }
    })
  }

  getFundsDetails(cb){ // return {} of RMS
    this.getRMS().then(d => {
      if (d.status && d.data){
        cb && cb(utils.rmsObject(d.data))
      }else{
        cb && cb(false)
      }
    })
  }
  
  getHistoricalData(params, callback){
    let dt = new Date()
    let toDate = dt.getFullYear()+"-"+(dt.getMonth()+1)+"-"+dt.getDate()+" "+dt.toTimeString().slice(0,5)
    dt = new Date(dt.setDate(dt.getDate()-3))
    let fromDate = dt.getFullYear()+"-"+(dt.getMonth()+1)+"-"+dt.getDate()+" "+dt.toTimeString().slice(0,5)
    console.log("todate:",toDate," fromdate: ",fromDate);
    this.getCandleData({
      "exchange": params.exch_seg,//"NSE",
      "symboltoken": params.token,
      "interval": "ONE_DAY",
      "fromdate": fromDate,//"2021-02-10 09:00",
      "todate": toDate,//"2021-02-10 09:20"
    }).then((data)=>{
      callback(data)
    })
  }
}

module.exports = {BrokerAPI} 