/* React */
import { Fragment, Component } from 'react'

/* Material UI */
import { Grid } from '@material-ui/core'
import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'

/* Chart */
import TrxChart from './chart/TrxChart'

/* Form */
import { OfferForm, BidForm, TrxGrid, TradeGrid } from './TradeForm'

/* TradeDialog component */
import TradeDialog from './components/TradeDialog'
/* TradeManager */
import TradeManager, { TradeType } from '../utils/trade'
/* Request */
import { request, handleResponse } from '../utils/index'
/* Logging*/
import log from 'loglevel'
import Console from '../utils/component/Console'

const styles = {
  center: {
    textAlign: 'center'
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '0px'
    // justifyContent: 'space-around'
  },
  gridChild: {
    padding: '0px',
    backgroundColor: '#021c21'
  },
  gridItem: {
    paddingTop: '12px'
  },
  trxTool: {
    padding: '4px!important'
  }
}


const ids = {
  tradeLeft: 'trade-left',
  tradeRight: 'trade-right',
  tradeDialog: 'trade-dialog'
}

const userDataObject = JSON.parse(userData.replace(/'/g, '"'))
const bids = JSON.parse(activeBids.replace(/'/g, '"')).map(bid => {
  return {
    ...bid,
    end_date: new Date(bid.end_date).getTime()
  }
})
const offers = JSON.parse(activeOffers.replace(/'/g, '"')).map(offer => {
  return {
    ...offer,
    end_date: new Date(offer.end_date).getTime()
  }
})

const tradeManager = new TradeManager(userDataObject, { bids, offers })
tradeManager.start()
async function requestTrades (trades) {
  return new Promise( resolve => {
    const result = { completed: [], failed: [] }
    trades.forEach( async (trade, idx) => {
      const tradeInfo = { type: trade.type, id: trade.type === TradeType.BID ? trade.bid.id : trade.offer.id }
      if (await requestTrade(trade)) {
        result.completed.push(tradeInfo)
      } else {
        result.failed.push(tradeInfo)
        log.info('Requested trade failed: ', trade);
      }
      if (trades.length === idx + 1) {
        resolve(result)
      }
    })
  })
}
export default class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      trades: tradeManager.getMatchedTrades(),
      lastMessage: 'Initialized'
    }
  }

  componentDidMount () {
    const tradeNum = tradeManager.numOfAvailableTrades()
    if (tradeNum) {
      this.log(`${tradeNum} potential trades have been matched`)
    } else {
      this.log('No matched trades have been found')
    }
  }

  tradeHandler = async trades => {
    this.log('Attempting trades')
    requestTrades(trades).then(async result => {
      console.log()
      this.log(`${result.completed.length} trades completed..\n${result.failed.length} trades failed.`)
      // TODO: choose either one of removeTrades or replacing the trades outright
      tradeManager.removeTrades(result.completed)
      // Get fresh data and update the state
      const bids = await requestTradeParts('bid')
      const offers = await requestTradeParts('offer')
      tradeManager.clear()
      tradeManager.setPending({ bids, offers })
      tradeManager.start()
      this.setState({ trades: tradeManager.getMatchedTrades() })
    })
  }

  tradeManyHandler = () => {
    trades = tradeManager.getMatched()
    while (userDataObject.balance > 0 && tradeManager.numOfAvailableTrades()) {
      const trade = trades.shift()
      if (!requestTrade(trade)) {
        break
      }
    }
  }

  messageHandler = (message) => {
    this.log(message)
  }

  log = (message) => {
    log.info(message)
    this.setState({ lastMessage: message })
  }
  /**
     * Render the component
     */
    render() {
      return (

    <div id="main-wrap" >
    <Console message={this.state.lastMessage}/>
      <TradeDialog tradeManyHandler={this.tradeManyHandler} tradeHandler={this.tradeHandler} trades={this.state.trades} bids={tradeManager.getMatched()}/>
      <Grid container spacing={8} style={styles.root}>
        <Grid style={styles.gridChild} item xs={8} sm={4}>
          <div className="trxToolWrap">
            <TrxGrid style={styles.trxTool}/>
          </div>
          <div className="trxToolWrap"><TradeGrid style={styles.trxTool}/></div>
          <div className="trxToolWrap"><OfferForm balance={userDataObject.balance} msgHandler={this.messageHandler} uid={userDataObject.id} style={styles.trxTool}/> </div>
          <div className="trxToolWrap"><BidForm balance={userDataObject.balance} msgHandler={this.messageHandler} uid={userDataObject.id} style={styles.trxTool}/></div>
        </Grid>
        <Grid style={styles.gridChild}  item xs={12} sm={8} id={ids.tradeRight}>
          <TrxChart style={styles.trxTool}/>
        </Grid>
      </Grid>
    </div>
      )
  }
}

async function requestTrade(trade) {
  const response = await request({
    method: 'POST',
    url: '/api/trade/request',
    body: {
      trade: trade,
      uid: userDataObject.id
    }
  })
  const result = handleResponse(response)
  if (result.error) {
    log.error(result.error)
    return false
  } else {
    log.info('Trade completed', result)
    if (tradeManager.removeTrade({type: trade.type, id: trade.id})) {
      log.info('Trade removed from trade manager')
      userDataObject.balance = userDataObject.balance = trade.type === 'offer' ? userDataObject.balance + trade.amount : userDataObject - trade.amount
    }
  }
  return true
}

async function requestTradeParts(part) {
  if (part && TradeType[part.toUpperCase()]) {
    const url = '/' + part
    const response = await request({
      method: 'GET',
      url,
    })
    const result = handleResponse(response)
    if (result.error) {
      log.error(result.error)
    }
    if (result.body) {
      return result.body
    }
  } else {
    log.error('Unrecognized trade part requested')
    return false
  }
}
