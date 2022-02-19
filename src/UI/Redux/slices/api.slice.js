import {createSlice} from '@reduxjs/toolkit'

const api = createSlice({
  name: 'api',
  initialState: {
    is_api_ready: false,
    is_websocket_started: false,
    broker_api: false,
    profile: {},
  },
  reducers: {
    setBrokerAPI: (state, action) =>{
      state.broker_api = action.payload
    },

    setIsApiReady: (state, action) => {
      state.is_api_ready = action.payload
    },

    setIsWebsocketStarted: (state, action) => {
      state.is_websocket_started = action.payload
    },
    setProfile: (state, action) =>{
      state.profile = action.payload
    }
  }
})
export const {
  setBrokerAPI, 
  setIsApiReady, 
  setIsWebsocketStarted,
  setProfile
} = api.actions
export default api.reducer