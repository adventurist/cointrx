/* React */
import { Fragment, Component } from 'react'

/* Material UI */
import { Grid } from '@material-ui/core'
import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'

/* Chart */
import TrxChart from './chart/TrxChart'

/* Form */
import { OfferForm, BidForm, TrxGrid } from './TradeForm'

/* TradeDialog component */
import TradeDialog from './components/TradeDialog'
/* TradeManager */
import TradeManager from '../utils/trade'
/* Request */
import { request } from '../utils/index'



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
    padding: '0px'
  },
  gridItem: {
    paddingTop: '12px'
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
console.log('Matched offers', tradeManager.getMatchedOffers())
console.log('Matched bids', tradeManager.getMatchedBids())

const date = Date.now()

console.log(date)



console.log(bids)

export default class App extends Component {

  tradeHandler = trades => {
    console.log(trades)
    trades.forEach( trade => {
      request({
        method: 'POST',
        url: '/api/trade/request',
        body: {
          trade: trade,
          uid: userDataObject.id
        }
      })
    })
  }
  /**
     * Render the component
     */
    render() {
      return (

    <div id="main-wrap" >
      <TradeDialog tradeHandler={this.tradeHandler} bids={tradeManager.getMatched()}/>
      <Grid container spacing={8} style={styles.root}>
        <Grid style={styles.gridChild} item xs={8} sm={4}>
          <TrxGrid />
          <OfferForm balance={userDataObject.balance} uid={userDataObject.id} />
          <BidForm balance={userDataObject.balance} uid={userDataObject.id} />
        </Grid>
        <Grid style={styles.gridChild}  item xs={12} sm={8} id={ids.tradeRight}>
          <TrxChart />
        </Grid>
      </Grid>
    </div>
      )
  }
}
