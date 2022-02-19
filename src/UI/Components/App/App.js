import React from 'react'
import './App.css';
import BrokerAPI from '../../APIs/BrokerAPI'
import { ERRORS } from '../../Constants/Constants';
import { connect } from 'react-redux';
import { setBrokerAPI, setIsApiReady, setIsWebsocketStarted } from '../../Redux/slices/api.slice';
import AppHeader from '../AppHeader/AppHeader';
import AppBody from '../AppBody/AppBody';
import { setTick } from '../../Redux/slices/market.slice';
import * as util from '../../Utils/utils'
import { setInstruments } from '../../Redux/slices/instruments.slice';
import { SEGMENTS } from '../../Config/config';

class App extends React.Component {
  constructor(props){
    super(props)
  }

  connectBrokerAPI(){
    const broker_api = new BrokerAPI((success)=>{
      if (success){
        this.props.setIsApiReady(true)
        util.loadInstruments(
          this.props.broker_api, 
          this.props.filterParams, 
          this.props.dispatch)
      }else{
        alert(ERRORS.API_FAILED)
      }
    },(tick) => this.props.setTick(tick))
    this.props.setBrokerAPI(broker_api);
  }

  componentDidMount(){
    this.connectBrokerAPI()
  }

  componentDidUpdate(pre){
    if (this.props.broker_api && 
      (pre.indexs.length !== this.props.indexs.length)){
      this.props.broker_api.resetWebSocket(Object.keys(this.props.indexs).map(i=>this.props.indexs[i])
        ,(connected)=>{
          setIsWebsocketStarted(connected)
      })
    }
    if((this.props.all.length !== pre.all.length) && Object.keys(this.props.ltp).length){
      util.filterTokenOnNameChange({
        ltp: this.props.ltp,
        filtered: this.props.all,
        filterParams: {...this.props.filterParams, name: SEGMENTS[0]}
      },(newState) => {
        this.props.setInstruments(newState)
      })
    }
  }
  render(){
    return (
      <div className="App">
        <div className="root">
          <AppHeader/>
          <AppBody />
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state) =>{
  const {indexs, filterParams, all } = state.instruments
  return ({
    broker_api: state.api.broker_api,
    ltp: state.market.ltp,
    indexs,
    filterParams,
    all
  })
}
const mapDispatchToProps = (dispatch) =>({
  dispatch: dispatch,
  setInstruments: (payload) => dispatch(setInstruments(payload)),
  setTick: (payload) => dispatch(setTick(payload)),
  setBrokerAPI: (payload)=>dispatch(setBrokerAPI(payload)),
  setIsApiReady: (payload)=>dispatch(setIsApiReady(payload)),
  setIsWebsocketStarted: (payload)=>dispatch(setIsWebsocketStarted(payload)),
})

export default connect(mapStateToProps, mapDispatchToProps)(App);
