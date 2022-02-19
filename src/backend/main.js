const config = require("./Config/config")
const {BrokerAPI} = require('./APIs/BrokerAPI')
const util = require("./Utils/utils")
const { AppWebsocket } = require("./WS/websocket")
const { MESSAGES, ACTION } = require('./Utils/constants')
const moment = require("moment")

class Main {
  constructor() {
    this.positions = { opened: [], closed: [], pnl:0 }
    this.wait_time = false
    this.last_exit_action = false
    this.app_ws = new AppWebsocket()
    this.broker_api = new BrokerAPI(
      connected => connected && this.start()
    )}

  start = () => {
    this.dayInterval = setInterval(() => {
      // util.marketTime() ?
        util.checkConnectivity(connected => { 
          if (connected) {
            this.getPositions((p) => {
              this.positions = util.formatPositions(p)
              this.highestPnl = this.highestPnl && 
                (this.positions.pnl > this.highestPnl) 
                ? this.positions.pnl : this.highestPnl;
                
              if (this.positions.opened.length) {
                if (!util.isScriptsHealthy(
                    Number(this.positions.pnl), 
                    this.highestPnl, 
                    this.positions.opened.map(p => p.ltp)
                  )) {
                  this.exitPositions() //=====>EXIT
                  this.sendToClient(this.positions, MESSAGES.EXIT_POSITIONS)
                }else {
                  this.sendToClient(this.positions, MESSAGES.JUST_WAIT_AND_WATCH)
                }
              }else if (this.positions.opened.length === 0) {
                if (util.isTheRightTimeForEntry()) {
                  if (this.wait_time) {
                    if (util.needToWait(this.wait_time, this.last_exit_action)) {
                      this.takeEntry() //=====>ENTRY
                      this.sendToClient(this.positions, MESSAGES.ENTRY_TAKEN)
                    }else {
                      this.sendToClient(false, MESSAGES.NEED_TO_WAIT_FOR_ENTRY)
                    }
                  }else {
                    this.takeEntry() //=====>ENTRY
                    this.sendToClient(this.positions, MESSAGES.ENTRY_TAKEN)
                  }
                }else {
                  this.sendToClient(false, MESSAGES.NOT_A_RIGHT_TIME_ENTRY)
                }
              }
            })
          }else {
            util.progressLog(util.logFormat(MESSAGES.CHECK_NETWORK_CONNECTION))
          }}) 
          // : this.closeForTheDay()
    }, config.LTP_TIME_LAP)
  }
  sendToClient(positions, msg) {
    util.progressLog(util.logFormat(msg, positions))
    this.app_ws.io && this.app_ws.io.emit("message",util.wsMessage(positions, msg))
  }
  getPositions(cb) {
    config.IS_PAPER_TRADING 
    ? util.getPositions(this.broker_api,(positions) => cb(positions)) 
    : this.broker_api.getPositions((positions) => cb(positions)) 
  } 

  takeEntry() {
    util.loadInstruments(data => {
    this.broker_api.getLTPData({
        exchange: data[0].exch_seg,
        tradingsymbol: data[0].symbol,
        symboltoken: data[0].token
      },ltp => {
        const indexDetails = config.INDEX
        const strangleStrikes = util.getStrangleStrikes(ltp.ltp, indexDetails)
        console.log(strangleStrikes);
        const filtered = util.filterOnParamsStrangle({
          filtered: data,
          filterParams : {
            ...strangleStrikes,
            name: config.SEGMENT,
            expiry: util.getExpiry(data)
          }
        })
        if (config.IS_PAPER_TRADING) {
          util.getLTPs(this.broker_api, filtered, (ltps) => {
            const objs = util.createPositionsObject(filtered, ltps)
            util.appendLog(MESSAGES.ENTRY_TAKEN, {opened:objs})
            this.positions.closed = this.positions.closed.concat(objs)
            util.writeJsonFile(config.POSITIONS_PATH, this.positions.closed, success => {
              console.log(success);
            })
          })
        }else {
          // Write Entry Code here..........
        }
        
      })
    });
  }
  exitPositions() {
    const { SL_HIT, PROFIT_BOOKED } = ACTION
    this.last_exit_action = this.positions.pnl > 0 ? PROFIT_BOOKED : SL_HIT
    util.appendLog(MESSAGES.EXIT_POSITIONS, this.positions)
    this.wait_time = moment().valueOf()
    console.log(JSON.stringify({
      pnl: Number(this.positions.pnl).toFixed(0),
      closed: this.positions.closed.length,
      opened: this.positions.opened.map(p => p.sellavgprice+"|"+p.ltp),
      existed: true
    }))
    
    console.log("EXIT ===> POSITIONS")
    if (config.IS_PAPER_TRADING) {
      this.positions.closed = this.positions.opened.map(p => {
        p.buyavgprice = p.ltp
        p.buyqty = p.sellqty
        p.netqty = 0
        p.realised = p.pnl
        return p
      })
      util.writeJsonFile(config.POSITIONS_PATH, this.positions.closed, success => {
        success && console.log(MESSAGES.WRITE_FILE_SUCCESS);
      })
    }else {
      //Write Exit code here.............
    }
  }
  closeForTheDay() {
    this.sendToClient(false, MESSAGES.NOT_MARKET_TIME)
    clearInterval(this.dayInterval)
    this.app_ws.io.close()
  }
}
//Game ON ...
const mainInterval = setInterval(() => {
  util.checkConnectivity(connected => {
    if (connected) {
      clearInterval(mainInterval)
      new Main()
    }
    else util.progressLog(MESSAGES.CHECK_NETWORK_CONNECTION);
  })
}, 1000)