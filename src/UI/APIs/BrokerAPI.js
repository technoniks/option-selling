import { 
  API_KEY,
  CLIENT_ID,
  INSTRUMENTS_URL, 
  INSTRUMENT_FILE_NAME, 
  PASSWORD,
} from '../Config/config';
import * as utils from '../Utils/utils';

const https = require('https')
let { SmartAPI, WebSocket } = require("smartapi-javascript");


export default class BrokerAPI extends SmartAPI{
  constructor(cb, tickReceiver){
    super({ api_key: API_KEY})
    this.initSmartAPI(cb, tickReceiver)
    this.connected = false
    this.list = []
  }

  initSmartAPI = (cb, tickReceiver)=>{
    this.generateSession(CLIENT_ID, PASSWORD)
      .then((res)=>{
        this.config = {
          feedToken: res["data"]["feedToken"],
          jwtToken: res["data"]["jwtToken"],
          refreshToken: res["data"]["refreshToken"]
        }
        this.initWebSocket(tickReceiver)
        this.getDetails()
        cb(true)
      }).catch(ex => {
        console.log(ex);
        cb(false)
      })
  }
  getFeedToken = () => this.config.feedToken
  getJwtToken = () => this.config.jwtToken
  getRefreshToken = () => this.config.refreshToken

  getInstruments(){
    https.get(INSTRUMENTS_URL,(res) => {
      let body = "";
      res.on("data", (chunk) => {
          body += chunk;
      });
      res.on("end", () => {
          try {
              utils.downloadFile(body,INSTRUMENT_FILE_NAME,"text/json")
          } catch (error) {
              console.error(error.message);
          };
      });
  
  }).on("error", (error) => {
      console.error(error.message);
  });
  }
  getLTPData(params, callback){
    this.getLTP(params).then(d=>{
      d.status && callback(d.data)
    })
  }
  initWebSocket(tickReceiver){
    this.ws = new WebSocket({
      client_code: CLIENT_ID,    
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
      Object.keys(output).length>0 && tickReceiver(output)
    })
  }  
  resetWebSocket(list, cb){
    this.closeWebsocket()
    this.connectWebSocket(list, cb)
  }
  connectWebSocket(list,cb,force=false){
    if(!this.connected || force){
      this.connected = true
      this.list = list
      this.ws.connect()
        .then((res)=>{
          // console.log("WS connected");
          this.ws.runScript(utils.createScript(list), 'mw');
          cb && cb(true)
      }).catch(err => {
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
  }
  getExistingPosition(cb){
    this.getPosition().then(d=>{
      if( d.status && d.data ){
        cb && cb(d.data.map(d=>{
          console.log("position: ",d.data);
           return {
            symboltoken: d.symboltoken,
            symbolname: d.symbolname,
            netqty: d.netqty,
            pnl: d.pnl
           }
        }))
      }else {
        cb && cb(false)
      }
    })
  }
  /**
     * Description
     * @method getHistoricalData
     * @param {object} params
     * @param {string} exch_seg
     * @param {string} token
     */
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
