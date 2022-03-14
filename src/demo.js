const demo = (api) => {
  
  api.getHistoricalData({exch_seg:'NSE', token:'3045'}, (data) => {
    console.log(data);
  })

}

exports.demo = demo;
