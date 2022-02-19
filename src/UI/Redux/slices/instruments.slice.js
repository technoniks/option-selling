import {createSlice} from '@reduxjs/toolkit'
import * as config from '../../Config/config'

const instruments = createSlice({
  name: 'instruments',
  initialState: {
    filterParams:{
      exch_seg: config.EXCHANGES[2],
      name: config.SEGMENTS[0],
      instrumenttype: config.INSTRUMENT_TYPE[0],
      symbol:"",
      expiry:"",
      token:"",
      strike: 0,
    },
    all: [],
    filtered: [],
    expiries:[],
    strikes:[],
    indexs: [],
  },
  reducers: {
    setInstruments: (state, action) => {
      Object.assign(action.payload.filterParams, {
        ...state.filterParams, 
        ...action.payload.filterParams
      })
      Object.assign(state, action.payload)
    },
    setAllInstruments: (state, action) => {
      state.all = action.payload
    },
    setFilteredInstruments: (state, action) => {
      state.filtered = action.payload
    },
    setExpiries: (state, action) => {
      state.expiries = action.payload
    },
    setStrikes: (state, action) => {
      state.strikes = action.payload
    },
    setIndexs: (state, action) =>{
      state.indexs = action.payload
    },
    setFilterParams: (state, action) => {
      state.filterParams = action.payload
    },
    setExchSeg: (state, action)=> {
      state.filterParams.exch_seg = action.payload
    },
    setName: (state, action) => {
      state.filterParams.name = action.payload
    },
    setInstrumentType: (state, action) => {
      state.filterParams.instrumenttype = action.payload
    },
    setSymbol: (state, action) => {
      state.filterParams.symbol = action.payload
    },
    setExpiry: (state, action) => {
      state.filterParams.expiry = action.payload
    },
    setStrike: (state, action) => {
      state.filterParams.strike = action.payload
    },
    setToken: (state, action) => {
      state.filterParams.token = action.payload
    },
    setInstrumentType: (state, action) => {
      state.filterParams.instrumenttype = action.payload
    }
  }
})

export const {
  setInstruments,
  setAllInstruments,
  setFilteredInstruments,
  setExpiries,
  setStrikes,
  setFilterParams,
  setIndexs,
  setExchSeg,
  setExpiry,
  setInstrumentType,
  setName,
  setSymbol,
  setStrike,
  setToken,
} = instruments.actions
export default instruments.reducer