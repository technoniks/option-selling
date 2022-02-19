import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import api from '../slices/api.slice';
import instruments from '../slices/instruments.slice';
import market from '../slices/market.slice'

export default configureStore({
  reducer: combineReducers({
    api,
    instruments,
    market,
  }),
  middleware: getDefaultMiddleware => getDefaultMiddleware({
    serializableCheck: false
  })
})