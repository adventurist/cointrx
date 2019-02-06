import { Component } from 'react'

import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core'
import IconButton from '@material-ui/core/IconButton'

import DoneIcon from '@material-ui/icons/Done'
import CancelIcon from '@material-ui/icons/Cancel'

export default class TradeDialog extends Component {

  constructor(props) {
    super(props)
    console.log(props)
    this.state = {
      open: true,
      bid: props.bid
    }
  }

  handleClose = () => {
    this.setState({ open: false })
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
      <div>
        <Dialog
          open={this.state.open}
          title='Trade Dialog'
          fullWidth={true}
          >
          <DialogTitle>Trade</DialogTitle>
            <DialogContent>
              <DialogContentText>
              {this.renderBid()}
              </DialogContentText>
              <DialogContentText>
                <h3>Do you accept?</h3>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <IconButton color='primary'
              onClick={this.handleClose}>
                Yes
                <DoneIcon />
              </IconButton>
            </DialogActions>
            <DialogActions>
              <IconButton color='secondary'
            >
              No
              <CancelIcon />
            </IconButton>
            </DialogActions>
          </Dialog>
      </div>
    )
  }
}