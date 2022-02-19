import {createSlice} from '@reduxjs/toolkit'

const market = createSlice({
  name: 'market',
  initialState: {
    tick: {},
    ltp: {}, 
    position: {},

  },
  reducers: {
    setTick: (state, action) => {
      Object.assign(state.tick, action.payload)
    },
    setLtp: (state, action) => {
      Object.assign(state.ltp, action.payload)
    },
    setPosition: (state, action) => {
      Object.assign(state.position, action.payload)
    }
  }
})
export const {
  setTick,
  setLtp,
  setPosition
} = market.actions
export default market.reducer