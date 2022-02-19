import React, {useEffect} from "react"
import './AppHeader.css'
import {useDispatch, useSelector} from 'react-redux';
import {
  setAllInstruments,
  setExchSeg,
  setExpiry,
  setIndexs,
  setInstruments,
  setName,
  setStrike,
} from "../../Redux/slices/instruments.slice";
import * as config from '../../Config/config'
import * as util from '../../Utils/utils'
import { setProfile } from "../../Redux/slices/api.slice";
import { LABELS } from "../../Constants/Constants";
import { setLtp } from "../../Redux/slices/market.slice";

const AppHeader = () =>{
  const dispatch = useDispatch()
  const api = useSelector(state => state.api);
  const { 
    filterParams, 
    indexs, 
    strikes,  
    expiries,
    all,
    filtered
  } = useSelector(state => state.instruments)
  const { ltp, tick} = useSelector(state => state.market)
  
  return (
    <div className="AppHeader">
      <div className="profile">
      {
      api.profile && 
      <div>
        <i className="bi bi-person-check-fill"></i> 
        <span className="name">{api.profile.name}({api.profile.clientcode})</span>
      </div>
      }
      </div>
        <div className="actions">
          {api.is_api_ready && (
              <button className="btn btn-primary" onClick={()=>api.broker_api && api.broker_api.getInstruments()}>{LABELS.UPDATE_INSTRUMENTS}</button>
          )}
          <button className="btn btn-primary" onClick={()=>loadInstruments(api.broker_api, filterParams, dispatch)}>{LABELS.LOAD_INSTRUMENTS}</button>
        </div>
        <div className="indexes">
        {
          Object.keys(indexs).length && 
          Object.keys(ltp).length && 
          <table className="table">
            <tbody>{config.SEGMENTS.map(i=>{
              // const tick = this.state.tick
              // const indexs = this.state.indexs
              // const data = Object.keys(tick).length && Object.keys(indexs).length && tick[indexs[i].token]
              const index = indexs[i]
              const data = tick[index.token]? tick[index.token]: ltp[index.symbol] 
              return (<tr key={i}>
                <td>
                  <i className="bi bi-caret-right-fill"></i>
                  {i}
                </td>
                {data ? (
                  <td className="text-right">{ (
                    <span>
                      <span className="ltp">{data.ltp} </span>
                      <span className={data.cng>0?"profit":"loss"}>{Number(data.cng).toFixed(2)}({Number(data.nc).toFixed(2)}%)</span>
                    </span>
                    )}
                  </td>
                ) : null}
              </tr>)})}
            </tbody>
          </table>
        }
        </div>
        <div className="selectors">
        <select className="btn btn-outline-dark btn-sm" disabled key="exch_seg"
          value={filterParams.exch_seg} onChange={(e)=>{
            dispatch(setExchSeg(e.target.value.toUpperCase()))
          }}>
            {config.EXCHANGES.map(ex=>(
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
          <select className="btn btn-outline-primary btn-sm" key="name" value={filterParams.name} 
          onChange={(e)=>{
            const name = e.target.value.toUpperCase()
            util.filterTokenOnNameChange({
              ltp: ltp,
              filtered: all,
              filterParams: {...filterParams, name: name}
            },(newState) => dispatch(setInstruments(newState)))
          }}>
            {config.SEGMENTS.map(ex=>(
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
          <select className="btn btn-outline-primary btn-sm" key="expiry" value={filterParams.expiry} 
          onChange={(e)=>{
            const expiry = e.target.value.toUpperCase()
            util.filterTokenOnExpiryChange({
              ltp: ltp,
              filtered: all,
              filterParams: {...filterParams, expiry: expiry}
            },(newState) => dispatch(setInstruments(newState)))
          }}>
          {expiries.map(ex=>(
            <option key={ex} value={ex}>{ex}</option>
          ))}
          </select>
          <select className="btn btn-outline-primary btn-sm" key="strike" value={filterParams.strike} 
          onChange={(e)=>{
            const strike = e.target.value.toUpperCase()
            util.filterTokenOnStrikeChange({
              ltp: ltp,
              filtered: all,
              filterParams: {...filterParams, strike: strike}
            },(newState) => dispatch(setInstruments(newState)))
          }}>
            {strikes.map(ex=>(
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>
        <div className="filtered">
          <ol>
          {filtered.map(i=>(
            <li key={i.symbol}>
              <button className="btn btn-outline-success btn-sm filtered">
                {i.name} {i.expiry} {Number(i.strike/100).toFixed()} {i.symbol.slice(-2)}
                </button>
            </li>
          ))}
          </ol>
        </div>
    </div>
  )
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
      obj[d.symboltoken] = d
      dispatch(setLtp(obj))
      ++counter;
      (counter === config.SEGMENTS.length) && cb && cb();
    })
  })
}
const loadInstruments = (broker_api, filterParams, dispatch) =>{
  let filteredList = require('../../Config/instruments.json')
  let tempIndexs = {}
  let tempProfile = {}
  config.SEGMENTS.forEach(index => {
    const tempIndex = filteredList.filter(l => l.symbol === index)[0]
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
      filteredList = util.filterOnParams({
        // ltp: ltp,
        filteredList, 
        filterParams:{
          exch_seg: filterParams.exch_seg,
          instrumenttype: filterParams.instrumenttype
      }})
      dispatch(setIndexs(tempIndexs))
      dispatch(setProfile(tempProfile))
      dispatch(setAllInstruments(filteredList))
    })
  })
}

export default AppHeader