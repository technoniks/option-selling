import React, { useEffect, useState } from "react";
const axios = require('axios').default;
// const createURL = (index) => `https://www.nseindia.com/api/option-chain-indices?symbol=${index}`;

const useFetchData = (index) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);

    axios.get('https://www.nseindia.com/')
    .then(res => {
        return axios.get('https://www.nseindia.com/api/option-chain-indices?symbol=BANKNIFTY', {
            headers: {
                cookie: res.headers['set-cookie'] // cookie is returned as a header
            }
        })
    })
    .then(res => {
      setData(res)
    })
    .catch(res => setErr(res.response))
    .finally(() => setLoading(false))
  }, [index]);

  return {data, loading, err};
}

const OptionChain = () => {
  const {data, loading, err} = useFetchData('BANKNIFTY')

  return (
    loading ? <div>Loading...{JSON.stringify(err)}</div>
    : <div>{JSON.stringify(data)}</div>
  )
}

export default OptionChain;