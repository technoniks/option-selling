const MESSAGES = {
  EXIT_POSITIONS:"Exit Positions",//
  JUST_WAIT_AND_WATCH: "Just Wait and Watch",
  ENTRY_TAKEN: "Entry Taken",//
  NEED_TO_WAIT_FOR_ENTRY: "Need to wait for Entry",
  NOT_A_RIGHT_TIME_ENTRY: "Not a right time for Entry",
  CHECK_NETWORK_CONNECTION: "Check network connection",
  WRITE_FILE_SUCCESS: "Write file :: Success",
  NOT_MARKET_TIME: "Not Market time"
}
const ACTION = {
  SL_HIT: "SL hit",
  PROFIT_BOOKED: "Profit Booked",
  MARKET_CLOSED: "Market closed",
  MARKET_OPENED: "Market Opened",
}

module.exports = {
  MESSAGES,
  LOG_MESSAGES: [
    MESSAGES.EXIT_POSITIONS,
    MESSAGES.ENTRY_TAKEN
  ],
  ACTION,
}