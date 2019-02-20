import { Component } from 'react'

import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core'
import IconButton from '@material-ui/core/IconButton'
import SvgIcon from '@material-ui/core/SvgIcon'

import DoneIcon from '@material-ui/icons/Done'
import CancelIcon from '@material-ui/icons/Cancel'

import TradeTable from '../components/TradeTable'

import { TradeType } from '../../utils/trade'

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

const TestIcon = () => {
  return (<SvgIcon>
  <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24">
    <path fill='<svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="#000000" d="M7,2V4H8V18A4,4 0 0,0 12,22A4,4 0 0,0 16,18V4H17V2H7M11,16C10.4,16 10,15.6 10,15C10,14.4 10.4,14 11,14C11.6,14 12,14.4 12,15C12,15.6 11.6,16 11,16M13,12C12.4,12 12,11.6 12,11C12,10.4 12.4,10 13,10C13.6,10 14,10.4 14,11C14,11.6 13.6,12 13,12M14,7H10V4H14V7Z" />
      </svg>' />
    </svg>
</SvgIcon>)
}

export default class TradeDialog extends Component {

  constructor(props) {
    super(props)
    console.log(props)
    this.state = {
      open: true,
      bids: props.bids,
      trades: props.trades,
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

  selectedTradesHandler = tradeItems => {
    const selectedTrades = []
    tradeItems.forEach(tradeItem => selectedTrades.push(this.state.trades.find(trade => {
      return parseInt(tradeItem.bid.id) === parseInt(trade.bid.id) && parseInt(tradeItem.offer.id) === parseInt(trade.offer.id)
    })))
    console.log(selectedTrades)
    this.setState({ selectedTrades })
  }

  addMany = () => {
    if (this.props.addManyHandler) {
      this.props.addManyHandler()
    }
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
              <TradeTable classes={classes.table} trades={this.state.trades} bids={this.state.bids} selectedTradesHandler={this.selectedTradesHandler} />
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
                onClick={this.handleClose}>
                Close
                <CancelIcon />
              </IconButton>
            </DialogActions>
            <DialogActions>
              <IconButton color='primary'
                onClick={this.addMany}>
                  Shazam
                  <TestIcon />
              </IconButton>
            </DialogActions>
          </Dialog>
    )
  }
}

