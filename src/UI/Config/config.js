export const API_KEY      = process.env.REACT_APP_API_KEY
export const CLIENT_ID    = process.env.REACT_APP_CLIENT_ID
export const PASSWORD     = process.env.REACT_APP_PASSWORD

export const IS_PAPER_TRADING = true

export const PREMIUM_HEALTH_RATIO   =2 // CE !> 2PE or PE !> 2CE otherwise Exit position
export const PROFIT_TARGET          =20
export const STOP_LOSS              =10

export const START_TIME         ={ hour:10, minute:0}
export const ENTRY_LIMIT_TIME   ={ hour:15, minute:30}//{ hour:14, minute:30}
export const EXIT_TIME          ={ hour:15, minute:30}//{ hour:15, minute:0}

export const ALGO_CHECK_TIME    =5000
export const LTP_TIME_LAP       =2000 //in millies
export const TRADE_QTY          ={'NIFTY':50, 'BANKNIFTY':25}
export const STRIKE_DIFF        ={'NIFTY':50, 'BANKNIFTY':100}
export const DEFAULT_EXPIRY     =1

export const INSTRUMENTS_URL      ="https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
export const INSTRUMENT_FILE_NAME ="instruments.json"
export const EXCHANGES            =['NSE', 'BSE', 'NFO', 'CDS', 'MCX', 'NCDEX']
export const SEGMENTS             =['NIFTY', 'BANKNIFTY']
export const INSTRUMENT_TYPE      =["OPTIDX"]