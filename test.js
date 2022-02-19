const { countBy } = require("lodash");
const moment = require("moment")

const start = moment().valueOf()

setTimeout(()=>{
  console.log(Number(moment.duration(moment().diff(start)).as('minutes')).toFixed(0));
},5000)