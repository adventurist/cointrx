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
      open: props.open,
      trades: props.trades,
      selectedTrades: undefined,
      noConflictTrades: []
    }

    window.addEventListener('keyup', e => {
      if (e.keyCode === 27) {
        this.handleClose()
      }
    })
  }

  componentWillReceiveProps(props) {
    // If the available trades have changed, we need to remove selections
    if (props.trades) {
      this.setState({
        trades: props.trades,
        selectedTrades: props.trades.length === this.state.trades.length ? this.state.selectedTrades : []
      })
    }
    if (props.open) {
      this.setState({ open: props.open })
    }
  }

  handleClose = () => {
    this.props.closeHandler()
    this.setState({ open: false })
  }

  handleTrade = () => {
    console.log(this.state.selectedTrades)
    this.props.tradeHandler(this.state.selectedTrades)
  }

  selectedTradesHandler = tradeItems => {
    const selectedTrades = []
    let conflict = false
    tradeItems.forEach(tradeItem => {
      if (conflict) {
        return
      }
      // If we have have selected some trades, then we need to make sure these additional selections are considered `noConflict` trades
      if (this.state.noConflictTrades && this.state.noConflictTrades.length > 0) {
        if (!this.state.noConflictTrades.find(noConflictTrade => {
          if (noConflictTrade.bid.id === tradeItem.bid.id && noConflictTrade.offer.id === tradeItem.offer.id) {
            return true
          } else {
            return false
          }
        })) {
          alert('Selecting this trade would create a conflict with your other selections')
          conflict = true
          return
        }
      }

      selectedTrades.push(this.state.trades.find(trade => {
        return parseInt(tradeItem.bid.id) === parseInt(trade.bid.id) && parseInt(tradeItem.offer.id) === parseInt(trade.offer.id)
      }))
    })
    if (!conflict) {
      this.setState({ selectedTrades }, () => {
        this.setState({ noConflictTrades: this.props.selectionUpdateHandler(this.state.selectedTrades)})
      })
      return true
    } else {
      return false
    }
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
          <DialogTitle>Available Trades</DialogTitle>
            <DialogContent>
              <DialogContentText>
              </DialogContentText>
              <DialogContentText>
                <h3>Select trades to be accepted</h3>
              </DialogContentText>
            </DialogContent>
            <DialogContent>
              <TradeTable classes={classes.table} trades={this.state.trades} selected={this.state.selectedTrades} selectedTradesHandler={this.selectedTradesHandler} />
            </DialogContent>
            <DialogActions>
              <IconButton color='primary'
              onClick={this.handleTrade}>
                Accept
                <DoneIcon />
              </IconButton>
              <IconButton color='secondary'
                onClick={this.handleClose}>
                Close
                <CancelIcon />
              </IconButton>
            </DialogActions>
          </Dialog>
    )
  }
}

