import { Component } from 'react'

import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core'
import IconButton from '@material-ui/core/IconButton'

import DoneIcon from '@material-ui/icons/Done'
import CancelIcon from '@material-ui/icons/Cancel'

import TradeTable from '../components/TradeTable'

const classes = {
  table: {
    root: 'table-main',
    tableWrapper: 'table-wrap',
    table: 'table',
    highlight: 'highlight',
    title: 'table-title',
    actions: 'table-actions',
    spacer: 'table-spacer'
  }
}

const styles = {
  maxWidth: '100%'
}
export default class TradeDialog extends Component {

  constructor(props) {
    super(props)
    console.log(props)
    this.state = {
      open: true,
      bids: props.bids,
      selectedTrades: undefined
    }

    window.addEventListener('keyup', e => {
      if (e.keyCode === 27) {
        this.handleClose()
      }
    })
  }

  handleClose = () => {
    this.setState({ open: false })
  }

  handleTrade = () => {
    console.log(this.state.selectedTrades)
    this.props.tradeHandler(this.state.selectedTrades)
  }



  selectedTradesHandler = trades => {
    const selectedTrades = []
    trades.forEach(trade => selectedTrades.push(this.state.bids.find(bid => bid.id === trade)))
    console.log(selectedTrades)
    this.setState({ selectedTrades })
  }

  renderBid = () => {
    return (
      <div>
        <div>ID: {this.state.bid.id}</div>
        <div>Amount: {this.state.bid.amount}</div>
        <div>Rate: {this.state.bid.rate}</div>
        <div>Valid: {new Date(this.state.bid.end_date).toTimeString()}</div>
      </div>
    )
  }
  render () {
    return (
        <Dialog
          open={this.state.open}
          title='Trade Dialog'
          fullWidth={true}
          maxWidth={false}
          >
          <DialogTitle>Trade</DialogTitle>
            <DialogContent>
              <DialogContentText>
              </DialogContentText>
              <DialogContentText>
                <h3>Do you accept?</h3>
              </DialogContentText>
            </DialogContent>
            <DialogContent>
              <TradeTable classes={classes.table} bids={this.state.bids} selectedTradesHandler={this.selectedTradesHandler} />
            </DialogContent>
            <DialogActions>
              <IconButton color='primary'
              onClick={this.handleTrade}>
                Trade
                <DoneIcon />
              </IconButton>
            </DialogActions>
            <DialogActions>
              <IconButton color='secondary'
              onClick={this.handleClose}
            >
              Close
              <CancelIcon />
            </IconButton>
            </DialogActions>
          </Dialog>
    )
  }
}