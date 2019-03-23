// React
import { Component } from 'react'

// Material UI
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import Tooltip from '@material-ui/core/Tooltip'

// Form Components
import Button from '@material-ui/core/IconButton'
import TextField from '@material-ui/core/TextField'

// Icons
import PowerSettingsNew from '@material-ui/icons/PowerSettingsNew'
import BotsOff from '@material-ui/icons/CloudOff'

const classes = {
  textField: 'textField',
  filledTextField: 'filledTextField',
  datePicker: 'datePicker',
  filledDatePicker: 'filledDatePicker',
  submitButton: 'submitButton'
}

const BotButtons = () => {
  return (
    <div id="start-button">
                <Button
                    label="Start Bots"
                    labelPosition="before"
                    // onClick={this.props.start}
                    primary={false}> <PowerSettingsNew /> </Button>
                <Button
                    label="Kill Bots"
                    labelPosition="before"
                    // onClick={this.props.kill}
                    primary={false}> <BotsOff /> </Button>
            </div>
  )
}

export default class BotForm extends Component {
  constructor (props) {
    super(props)

    this.state = {

    }
  }

  render () {
    return (
            <Card>
              <Typography>Bot setup</Typography>
              <Typography>Configure and create bots</Typography>
              <div id="number-container">
                <CardActions className="number-control">
                  {/* <NumericInput  value={this.state.botNum} onChange={this.botNumberChange} /> */}
                  <TextField min={0} max={100}
                        className={this.state.offerPrice > 0 ? classes.filledTextField : classes.textField}
                        style={{ width: '85%' }}
                        type='number'
                        label='Rate per BTC'
                        value={this.state.offerPrice}
                        // onChange={this.handleChange('offerPrice')}
                    />
                </CardActions>
              </div>
            </Card>

    )
  }
}