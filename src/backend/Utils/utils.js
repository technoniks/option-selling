const moment = require("moment")
const config = require("../Config/config")
const fs = require("fs")
const { MESSAGES, LOG_MESSAGES, ACTION } = require("./constants")
// const { setLtp } = require("../Redux/slices/market.slice")
// const { setAllInstruments, setIndexs } = require("../Redux/slices/instruments.slice")
// const { setProfile } = require("../Redux/slices/api.slice")

function filterSortExpiries(list){
  return Array.from(new Set(list.map(i=>i.expiry)))
  .sort((a,b) => {
    if(new Date(a)<new Date(b)){return -1}
    if(new Date(a)>new Date(b)){return 1}
    return 0
  })
}

function filterSortStrikes(list){
  return Array.from(new Set(list.map(i=>Number(i.strike/100))))
  .sort((a,b) => {
    if(a<b){return -1}
    if(a>b){return 1}
    return 0
  })
}

const filterOnParams = d => {
  return d.filtered.filter(i=>(
    // (!params.exch_seg || (i.exch_seg===params.exch_seg)) && 
    (!d.filterParams.name || (i.name===d.filterParams.name)) && 
    (!d.filterParams.instrumenttype || (i.instrumenttype===d.filterParams.instrumenttype)) && 
    (!d.filterParams.expiry || (i.expiry===d.filterParams.expiry))&&
    (!d.filterParams.symbol || (i.symbol===d.filterParams.symbol))&&
    (!d.filterParams.strike || (Number(i.strike)===d.filterParams.strike*100))
  ))
}
const filterOnParamsStrangle = d => (
  d.filtered.filter(i => {
    return(
    i.name===d.filterParams.name && 
    // i.instrumenttype===d.filterParams.instrumenttype && 
    (
      (Number(i.strike/100)===d.filterParams.ce && i.symbol.slice(-2)==="CE") || 
      (Number(i.strike/100)===d.filterParams.pe && i.symbol.slice(-2)==="PE")
    ) &&
    i.expiry===d.filterParams.expiry
  )})
)

const filterTokenOnNameChange = (d, cb) => {
  let tempParam = {...d.filterParams}
  d.filtered = filterOnParams({...d, filterParams:{...d.filterParams,expiry:"",strike:""}})
  d.expiries = filterSortExpiries(d.filtered)
  d.filterParams.expiry = 
    d.expiries.includes(tempParam.expiry)?tempParam.expiry:d.expiries[config.EXPIRY]
  filterTokenOnExpiryChange(d, cb)
}

const filterTokenOnExpiryChange = (d, cb) => {
  const tempParam = {...d.filterParams}
  d.filtered = filterOnParams({...d, filterParams:{...d.filterParams,strike:""}})
  d.strikes = filterSortStrikes(d.filtered)
  d.filterParams.strike = 
    d.strikes.includes(Number(tempParam.strike))?tempParam.strike:findNearValue(d.strikes, d.ltp[d.filterParams.name])
  filterTokenOnStrikeChange(d, cb)
}

const filterTokenOnStrikeChange = (d, cb) => {
  d.filtered = filterOnParams(d)
  cb(delete d.ltp && d)
}

const downloadFile = (content, cb)=> {
  const index = filterOnParams({ // it return list
    filtered: content,
    filterParams:{
      symbol: config.SEGMENT,
    }
  })[0]
  content = filterOnParams({
    filtered: content,
    filterParams:{
      instrumenttype: config.INSTRUMENT_TYPE,
      name: config.SEGMENT,
    }
  })
  content.unshift(index)
  writeJsonFile(config.INSTRUMENT_FILE, content, (done) => cb(done))
}
const writeJsonFile = (filePath, content, cb) => {
  fs.writeFile(filePath, JSON.stringify(content), (err)=>{
    if(err){
      console.log("writeJson::",err)
      cb && cb(false)
     }else{
      console.log("WriteFile::Success in ",filePath);
      cb && cb(true)
     } 
  })
}

const getPositions = (broker_api, cb)=> {
  fs.readFile(config.POSITIONS_PATH, 'utf8', (err, data)=>{
    if (err) return console.log("readFile::",err)
    if (data==='' || data==='{}') return cb(false)
    data = JSON.parse(data)
    getLTPs(broker_api,data.map(p=>({
      exch_seg: p.exchange,
      symbol: p.symbolname,
      token: p.symboltoken
    })), ltps =>{
      cb && cb(data.map(i =>{
        i.ltp = ltps[i.symbolname]
        i.pnl = Number(i.sellqty) * (Number(i.sellavgprice) - Number(ltps[i.symbolname]))
        i.unrealised = Number(i.sellqty) * ((i.sellavgprice) - Number(ltps[i.symbolname]))
        return i
      }))
    })
  })
}

const findNearValue = (ltp)=>{
  const diff = config.INDEX.strike_diff
  const extra = (ltp.ltp % diff)
  const isUpper = extra > (diff/2)
  const strike = isUpper ? ((ltp.ltp-extra) + diff) : (ltp.ltp-extra)
  console.log("index:",ltp.ltp,"|new strike: ",strike);
  return strike
}
//entry conditions
const isTheRightTimeForEntry = () => 
  (moment().hour(config.START_TIME.hour).minute(config.START_TIME.minute) < moment().valueOf()) &&
  (config.TRADE_TYPE === config.TRADE_TYPES[0]
    ? (moment().hour(config.ENTRY_LIMIT_TIME.hour).minute(config.ENTRY_LIMIT_TIME.minute) > moment().valueOf())
    : true)

//exit conditions
const isScriptsHealthy = (pnl, highestPnl, [pe, ce]) => 
  (pnl > calculateSL(highestPnl) && pnl < config.PROFIT_TARGET) && 
  (pe < (config.PREMIUM_HEALTH_RATIO*ce) && ce < (config.PREMIUM_HEALTH_RATIO * pe)) &&
  (config.TRADE_TYPE === config.TRADE_TYPES[0] 
  ? (moment().hour(config.EXIT_TIME.hour).minute(config.EXIT_TIME.minute) > moment().valueOf())
  : true)
  
  
const recordPNL = (pnl=0, profits=[], losses=[]) =>{
  if(pnl < 0){
    if(losses.length){
      losses[losses.length-1] > pnl && losses.push(pnl) 
    }else{
      losses.push(pnl) 
    }
  }else{
    if(profits.length){
      profits[profits.length-1] < pnl && profits.push(pnl) 
    }else{
      profits.push(pnl) 
    }
  }
}

const createScript = list =>{
  let script = ""
  list.forEach(l=>{
    l.exch_seg === 'NFO' && (script+='nse_fo|'+l.token+"&")
    l.exch_seg === 'NSE' && (script+='nse_cm|'+l.token+"&")
  })
  return script.slice(0,-1)
}

const getLTPIndex=(index, broker_api, cb)=>{
  // broker_api && broker_api.getLTPData({
  //   exchange: index.exch_seg,
  //   tradingsymbol: index.symbol,
  //   symboltoken: index.token
  // },(d)=> cb && cb(d))
}
const getLTPs = (broker_api, list, cb) => {
  let counter = 0
  let obj = {}
  list.forEach(i => {
    broker_api && broker_api.getLTPData({
      exchange: i.exch_seg,
      tradingsymbol: i.symbol,
      symboltoken: i.token
    },(d)=>{
      obj[d.tradingsymbol] = d.ltp
      ++counter;
      (counter === list.length) && cb && cb(obj);
    })
  })
}

const loadInstruments = (cb) =>{
  fs.readFile(config.INSTRUMENT_FILE,'utf8', (err, data)=>{
    if (err) console.log(err);
    else {
      let filtered = JSON.parse(data);
      cb && cb(filtered.filter(l => l.name === config.SEGMENT))
    }
  })
}

const getStrangleStrikes = (strike, {strike_diff, ce, pe}) => {
  const extra = strike % strike_diff
  strike = strike - extra + (extra > (strike_diff/2) ? strike_diff : 0)
  return ({
    ce: Number(Number(strike) + (strike_diff * ce)),
    pe: Number(Number(strike) - (strike_diff * pe))
})
}

const getExpiry = (list) => {
  return filterSortExpiries(list.slice(1))[config.EXPIRY]
}
const checkConnectivity = (cb) => {
  require('dns').resolve('www.google.com', function(err) {
    err ? cb(false) : cb(true)
  });
}
const positionObject = (p) => ({
  exchange: p.exchange,//NSE
  symboltoken: p.symboltoken,//45578
  symbolname: p.symbolname,//NIFTY03FEB2217500CE
  strikeprice: p.strikeprice,//38800
  expirydate: p.expirydate,
  producttype: p.producttype,//DELIVERY
  instrumenttype: p.instrumenttype,//OPTIDX
  optiontype: p.optiontype,//CE | PE
  lotsize: p.lotsize,//50

  ltp: p.ltp, //ltp
  buyavgprice: p.buyavgprice,
  sellavgprice: p.sellavgprice,//"2235.80"
  totalbuyavgprice: p.totalbuyavgprice,
  totalsellavgprice: p.totalsellavgprice,

  buyqty: p.buyqty,
  sellqty: p.sellqty,
  netqty: p.netqty,//-50

  pnl: p.pnl,//0
  realised: p.realised,//0
  unrealised: p.unrealised,//0
})

const orderObject = (o) => ({
  orderid: o.orderid, // primary key
  producttype: o.producttype, // INTRADAY | 
  price: o.price, // premium value
  quantity: o.quantity,
  tradingsymbol: o.tradingsymbol,
  transactiontype: o.transactiontype, // BUY | SELL
  exchange: o.exchange, // NFO
  symboltoken: o.symboltoken,
  instrumenttype: o.instrumenttype,// OPTIDX
  strikeprice: o.strikeprice,
  optiontype: o.optiontype, // PE | CE
  expirydate: o.expirydate,
  lotsize: o.lotsize,
  text: o.text, // error message
  status: o.status,// rejected | open | complete
  orderstatus: o.orderstatus,// rejected | open | complete
  updatetime: o.updatetime,
})

const rmsObject = (r) => ({
  net: r.net,
  availablecash: r.availablecash,
  m2munrealized: r.m2munrealized, // while in trade
  m2mrealized: r.m2mrealized, // after exit
  utiliseddebits: r.utiliseddebits,// used margin
})

const progressLog = (msg) => {
  process.stdout.clearScreenDown();
  process.stdout.cursorTo(0);
  process.stdout.write(msg)
}

const logFormat = (text) => moment().format("DD-MMM-YY HH:mm:ss") + " " + text

const appLog = (text) => console.log(logFormat(text));

const needToWait = (sl, action) => {
  const { SL_HIT, PROFIT_BOOKED } = ACTION
  return moment.duration(moment().diff(sl))
  .as('minutes') > (
    action === SL_HIT ? config.WAIT_AFTER_SL : config.WAIT_AFTER_BOOKED
  )
}

const marketTime = () => 
  moment().hour(config.MARKET_TIME.start.hour)
    .minute(config.MARKET_TIME.start.minute) < moment().valueOf() &&
  moment().hour(config.MARKET_TIME.end.hour)
    .minute(config.MARKET_TIME.end.minute) > moment().valueOf()

const wsMessage = (positions, msg) => JSON.stringify(
  positions ? {
    pnl: positions.pnl &&Number(positions.pnl).toFixed(0),
    cls: positions.closed && positions.closed.length,
    opn: positions.opened.map(p => p.sellavgprice+"|"+p.ltp),
    msg: msg
  } : {
    msg: msg
  }
)
const formatPositions = (p) => p ? p.reduce((acc, curr) => {
  if (curr.netqty === "0" || curr.netqty === 0) {
    acc.closed.push(curr)
  }else{
    acc.opened.push(curr)
    acc.pnl += Number(curr.pnl)
  }
  return acc
},{ opened: [], closed: [], pnl:0 }) : { opened: [], closed: [], pnl:0 };

const createPositionsObject = (filtered, ltps) => 
  filtered.map((i) => {
    const ltp = ltps[i.symbol]
      return positionObject({
        exchange: config.EXCHANGE,
        symboltoken: i.token,
        symbolname: i.symbol,
        producttype: config.TRADE_TYPE,
        instrumenttype: config.INSTRUMENT_TYPE,
        optiontype: i.symbol.slice(-2),
        buyavgprice: "0",
        sellavgprice: ltp,
        buyqty: "0",
        sellqty: config.NO_OF_LOTS * config.INDEX.lot_size,
        netqty: config.INDEX.lot_size,
        pnl: "0",
        realised: "0",
        unrealised: "0",//0
        ltp: ltp, //ltp
        lotsize: config.INDEX.lot_size,//50
      })
  });

  const appendLog = (text, positions) => {
    // LOG_MESSAGES.forEach(msg => {
    //   if (msg === text) {
        fs.appendFile(config.LOG_PATH, logFormat(text + JSON.stringify(wsMessage(positions)) + '\n'), err =>{
          if (err) return appLog("ERROR:",err)
        })
      // }})
    }

  const calculateSL = (highestPnl = config.MIN_BOOKED_SL) => 
    highestPnl < (config.MIN_BOOKED_SL - config.MIN_STOP_LOSS)
    ? (-1 * config.MIN_STOP_LOSS)
    : (
        highestPnl < config.MIN_BOOKED_SL 
        ? (config.MIN_BOOKED_SL - config.MIN_STOP_LOSS)
        : (highestPnl - (highestPnl % config.MIN_STOP_LOSS))
      )

module.exports = {
  filterOnParamsStrangle,
  filterOnParams,
  filterTokenOnNameChange,
  filterTokenOnExpiryChange,
  filterTokenOnStrikeChange,
  downloadFile,
  getPositions,
  findNearValue,
  isTheRightTimeForEntry,
  isScriptsHealthy,
  createScript,
  getLTPIndex,
  loadInstruments,
  getStrangleStrikes,
  checkConnectivity,
  positionObject,
  orderObject,
  rmsObject,
  getExpiry,
  getLTPs,
  writeJsonFile,
  progressLog,
  logFormat,
  appLog,
  needToWait,
  marketTime,
  wsMessage,
  formatPositions,
  createPositionsObject,
  appendLog,
  calculateSL
}
