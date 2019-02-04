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

const styles = {
  center: {
    textAlign: 'center'
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    // justifyContent: 'space-around'
  }
}

const ids = {
  tradeLeft: 'trade-left',
  tradeRight: 'trade-right'
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
console.log(bids)
console.log(offers)
console.log(userDataObject)

bids.forEach(bid => {
  if (parseInt(bid.uid) === parseInt(userDataObject.id)) {
    console.log('Iterating bid', bid)
    offers.forEach(offer => {
      console.log('Nested offer', offer)
      if (offer.rate <= bid.rate) {
        console.log('We have a matched offer to your bid', offer, bid)
      }
    })
  }
})

offers.forEach(offer => {
  if (parseInt(offer.uid) === parseInt(userDataObject.id)) {
    console.log('Iterating offer', offer)
    bids.forEach(bid => {
      console.log('Nested bid', bid)
      if (bid.rate >= offer.rate) {
        console.log('We have a matched bid to your offer', bid, offer)
      }
    })
  }
})

const date = Date.now()

console.log(date)



console.log(userDataObject)

export default class App extends Component {
  /**
     * Render the component
     */
    render() {
      return (

    <div id="main-wrap" >

      <Grid container spacing={8} style={styles.root}>
        <Grid item xs={8} sm={4}>
          <TrxGrid />
          <OfferForm balance={userDataObject.balance} uid={userDataObject.id} />
          <BidForm balance={userDataObject.balance} uid={userDataObject.id} />
        </Grid>
        <Grid item xs={12} sm={8} id={ids.tradeRight}>
          <TrxChart />
        </Grid>
      </Grid>
    </div>
      )
  }
}