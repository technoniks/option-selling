const moment = require('moment')

require('dotenv').config({path:'.env.local'})

//------------Configuration-----------------
const PREMIUM_HEALTH_RATIO  = 2.5 // CE !> 2PE or PE !> 2CE otherwise Exit position
const EXPIRY                = 1 //0 == currentExpiry and 1 == next visa versa
const NO_OF_LOTS            = 1 //ex. 1 of nifty == 1*50 qty..
const PROFIT_TARGET         = 1500
const STOP_LOSS             = 500 * NO_OF_LOTS
const MIN_BOOKED_SL         = 1600 * NO_OF_LOTS//1600 then minBookedSl=1600 & sl=500 then minProfit=minBookedSl-sl which is 1100
const WAIT_AFTER_SL         = 20 //in minutes
const WAIT_AFTER_BOOKED     = 10 //in minutes

const SEGMENTS              = ['NIFTY', 'BANKNIFTY']
const SEGMENT               = SEGMENTS[1] //need to set

const TRADE_TYPES           = ["INTRADAY", "CARRYFORWARD"]
const TRADE_TYPE            = TRADE_TYPES[0] //need to set

const OPTION_TYPES          = ["CE", "PE"]

const START_TIME            = { hour:9, minute:50}
const ENTRY_LIMIT_TIME      = { hour:14, minute:30}//{ hour:14, minute:30}
const EXIT_TIME             = { hour:15, minute:00}//{ hour:15, minute:0}
const MARKET_TIME           = { 
                                 start: { hour:9, minute:15 },
                                 end  : { hour:15, minute:30} 
                               }

const ALGO_CHECK_TIME      = 5000 //in millies
const LTP_TIME_LAP         = 5000 //in millies
//------------------------------------------
const API_KEY              = process.env.API_KEY
const CLIENT_ID            = process.env.CLIENT_ID
const PASSWORD             = process.env.PASSWORD

const IS_PAPER_TRADING     = true
const POSITIONS_PATH       = "src/backend/DB/positions.json"

const INSTRUMENTS_URL      = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
const INSTRUMENT_FILE      = "src/backend/Config/instruments.json"
const EXCHANGES            = ['NSE', 'BSE', 'NFO', 'CDS', 'MCX', 'NCDEX']
const EXCHANGE             = EXCHANGES[2]
const INDEXS               = {
                              NIFTY: {
                                lot_size: 50,
                                strike_diff: 50,
                                ce: 6,
                                pe: 6,
                              },
                              BANKNIFTY: {
                                lot_size: 25,
                                strike_diff: 100,
                                ce: 8,
                                pe: 8,
                              }
                            }
const INDEX               = INDEXS[SEGMENT]

const INSTRUMENT_TYPES     = ["OPTIDX"]
const INSTRUMENT_TYPE      = INSTRUMENT_TYPES[0]

const ORDER_STATUS         = ["rejected", "open", "complete"]

const LOG_PATH             = `logs/${moment().format('DD-MMM-YYYY')}.log`
module.exports = {
  API_KEY,
  CLIENT_ID,
  PASSWORD,
  IS_PAPER_TRADING,
  POSITIONS_PATH,
  TRADE_TYPE,
  TRADE_TYPES,
  OPTION_TYPES,
  PREMIUM_HEALTH_RATIO,
  PROFIT_TARGET,
  STOP_LOSS,
  MIN_BOOKED_SL,
  WAIT_AFTER_SL,
  WAIT_AFTER_BOOKED,
  START_TIME,
  ENTRY_LIMIT_TIME,
  EXIT_TIME,
  MARKET_TIME,
  ALGO_CHECK_TIME,
  LTP_TIME_LAP,
  EXPIRY,
  NO_OF_LOTS,
  INSTRUMENTS_URL,
  INSTRUMENT_FILE,
  EXCHANGE,
  SEGMENT,
  INDEX,
  INSTRUMENT_TYPE,
  LOG_PATH,
}