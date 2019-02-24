import { Component } from 'react'
import Button from '@material-ui/core/Button'
import Input from '@material-ui/core/Input'
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core'
import PropTypes from 'prop-types'
import log from 'loglevel'

const styles = {
  input: {
    width: '85%'
  }
}

export default class FundField extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: undefined,
      alertOpen: false
    }
  }

  handleChange = event => {
    const prevValue = this.state.value
    this.setState({
      value: event.target.value
    }, () => {
      if (!this.props.offer || parseFloat(this.state.value) <= parseFloat(this.props.max)) {
        if (this.props.handler) {
          this.props.handler(this.state.value)
        }
        return
      } else {
        log.info('Unable to offer more than your estimated balance')
        this.setState({
          value: prevValue,
          alertOpen: true
        })
      }
    })
  }

  closeAlert = () => {
    this.setState({ alertOpen: false })
  }

  render () {
    return (
      <div>
        <TextField
          value={this.state.value || 0}
          type='number'
          max={parseFloat(this.props.max)}
          label='Amount to offer'
          style={styles.input}
          prefix={this.props.currency}
          inputProps={{
            startAdornment: <InputAdornment position='start'>{this.props.currency}</InputAdornment>
          }}
          onChange={this.handleChange}
        />
        <AlertDialog
          open={this.state.alertOpen}
          onClose={this.closeAlert}
        />
      </div>
    )
  }
}

FundField.propTypes = {
  max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  currency: PropTypes.string.isRequired,
  handler: PropTypes.func.isRequired
}

class AlertDialog extends Component {

  render () {
    if (this.props.open) {
      return (
        <div>
          <Dialog
          open={this.props.open}
          >
            <DialogTitle>Invalid Offer Amount</DialogTitle>
            <DialogContent>
              <DialogContentText>
                You cannot offer more than your estimated balance
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.props.onClose} color="primary">
                Okay
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      )
    } else {
      return null
    }
  }
}