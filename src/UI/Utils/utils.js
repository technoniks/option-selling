import moment from "moment"
import * as config from "../Config/config"
import { setLtp } from "../Redux/slices/market.slice"
import { setAllInstruments, setIndexs } from "../Redux/slices/instruments.slice"
import { setProfile } from "../Redux/slices/api.slice"

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
 /**
     * Description
     * @method filterOnParams
     * @param {object} d
     * @param {object} filterParams (NORMAL or STOPLOSS)
     * @param {list} filteredList (RELIANCE-EQ, INFY-EQ, SBIN-EQ)
  * */
export function filterOnParams(d){
  return d.filtered.filter(i=>(
    // (!params.exch_seg || (i.exch_seg===params.exch_seg)) && 
    (!d.filterParams.name || (i.name===d.filterParams.name)) && 
    (!d.filterParams.instrumenttype || (i.instrumenttype===d.filterParams.instrumenttype)) && 
    (!d.filterParams.expiry || (i.expiry===d.filterParams.expiry))&&
    (!d.filterParams.strike || (Number(i.strike)===d.filterParams.strike*100))
  ))
}
export function filterTokenOnNameChange(d, cb){
  let tempParam = {...d.filterParams}
  d.filtered = filterOnParams({...d, filterParams:{...d.filterParams,expiry:"",strike:""}})
  d.expiries = filterSortExpiries(d.filtered)
  d.filterParams.expiry = 
    d.expiries.includes(tempParam.expiry)?tempParam.expiry:d.expiries[config.DEFAULT_EXPIRY]
  filterTokenOnExpiryChange(d, cb)
}
export function filterTokenOnExpiryChange(d, cb){
  const tempParam = {...d.filterParams}
  d.filtered = filterOnParams({...d, filterParams:{...d.filterParams,strike:""}})
  d.strikes = filterSortStrikes(d.filtered)
  d.filterParams.strike = 
    d.strikes.includes(Number(tempParam.strike))?tempParam.strike:findNearValue(d.strikes, d.ltp[d.filterParams.name])
  filterTokenOnStrikeChange(d, cb)
}
export function filterTokenOnStrikeChange(d, cb){
  d.filtered = filterOnParams(d)
  cb(delete d.ltp && d)
}
export const downloadFile = (content, fileName, contentType)=> {
  var a = document.createElement("a");
  var file = new Blob([content], {type: contentType});
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}
export const loadJsonFile = (path)=> require(path)

export const findNearValue=(list, ltp)=>{
  const diff = config.STRIKE_DIFF[ltp.tradingsymbol]
  const extra = (ltp.ltp % diff)
  const isUpper = extra > (diff/2)
  const strike = isUpper ? ((ltp.ltp-extra) + diff) : (ltp.ltp-extra)
  console.log("index:",ltp.ltp,"|new strike: ",strike);
  return strike
}
export const isTheRigthTime = (alreadyEntered) => (moment().hour(config.START_TIME.hour).minute(config.START_TIME.minute) < moment().valueOf()) 
  && (moment().hour(alreadyEntered ? config.EXIT_TIME.hour : config.ENTRY_LIMIT_TIME.hour)
  .minute(alreadyEntered ? config.EXIT_TIME.minute : config.ENTRY_LIMIT_TIME.minute) > moment().valueOf())

export const isScriptsHealthy = (alreadyEntered, pnl, pe, ce) => {
  // console.log("start:",moment().hour(config.START_TIME.hour).minute(config.START_TIME.minute),"|current",moment().valueOf());
  // const wellstart = moment().hour(config.START_TIME.hour).minute(config.START_TIME.minute) < moment().valueOf()
  // const wellEnd = moment().hour(alreadyEntered ? config.EXIT_TIME.hour : config.ENTRY_LIMIT_TIME.hour)
  // .minute(alreadyEntered ? config.EXIT_TIME.minute : config.ENTRY_LIMIT_TIME.minute) > moment().valueOf()
  const wellMoney = (
    (pnl > -(config.STOP_LOSS) && pnl < config.PROFIT_TARGET) && 
    (pe < (config.PREMIUM_HEALTH_RATIO*ce) && ce < (config.PREMIUM_HEALTH_RATIO * pe))
  )
  return (alreadyEntered ?  wellMoney : true)}
  
export const recordPNL = (pnl=0, profits=[], losses=[]) =>{
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
export const createScript = list =>{
  let script = ""
  list.forEach(l=>{
    l.exch_seg === 'NFO' && (script+='nse_fo|'+l.token+"&")
    l.exch_seg === 'NSE' && (script+='nse_cm|'+l.token+"&")
  })
  return script.slice(0,-1)
}

const getLTPIndexs=(indexs, broker_api, dispatch, cb)=>{
  let counter = 0
  config.SEGMENTS.forEach(index => {
    broker_api && broker_api.getLTPData({
      exchange: indexs[index].exch_seg,
      tradingsymbol: indexs[index].symbol,
      symboltoken: indexs[index].token
    },(d)=>{
      let obj = {}
      obj[d.tradingsymbol] = d
      dispatch(setLtp(obj))
      ++counter;
      (counter === config.SEGMENTS.length) && cb && cb();
    })
  })
}
export const loadInstruments = (broker_api, filterParams, dispatch) =>{
  let filtered = require('../Config/instruments.json')
  let tempIndexs = {}
  let tempProfile = {}
  config.SEGMENTS.forEach(index => {
    const tempIndex = filtered.filter(l => l.symbol === index)[0]
    tempIndexs[index] = {
      name: tempIndex.name,
      symbol: tempIndex.symbol,
      token: tempIndex.token,
      exch_seg: tempIndex.exch_seg,
    }
  })
  getLTPIndexs(tempIndexs, broker_api, dispatch, ()=>{
    broker_api.getProfile().then(p=>{
      tempProfile = {
        name:p.data.name,
        clientcode: p.data.clientcode
      }
      filtered = filterOnParams({
        // ltp: ltp,
        filtered, 
        filterParams:{
          exch_seg: filterParams.exch_seg,
          instrumenttype: filterParams.instrumenttype
      }})
      dispatch(setIndexs(tempIndexs))
      dispatch(setProfile(tempProfile))
      dispatch(setAllInstruments(filtered))
    })
  })
}

