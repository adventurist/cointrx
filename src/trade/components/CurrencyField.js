import { Component } from 'react'
import { MenuItem, TextField } from '@material-ui/core'

const currencies = [
  {
      value: 'CAD',
      label: '$'
  }, {
      value: 'EUR',
      label: 'EUR'
  }
]


export class CurrencyField extends Component {
  constructor (props) {
    super(props)
    this.state = {
      currency: props.currency
    }
  }

  handleChange = e => {
    if (this.props.enabled) {
      this.setState({ currency: e.target.value })
      if (this.props.handler) {
        this.props.handler(e.target.value)
      }
    }
  }

  render () {

    const style = this.props.styles ? this.props.styles : {
      width: this.props.full ? '100%' : '85%'
    }
    return (
      <TextField
                    id="select-currency"
                    style={style}
                    select
                    label="Currency"
                    value={this.state.currency}
                    onChange={this.handleChange}
                    >
                        {currencies.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.value}
                            </MenuItem>
                        ))}
                    </TextField>
    )
  }
}
