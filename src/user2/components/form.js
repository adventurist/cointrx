import '@babel/polyfill'
import { Fragment, Component } from 'react'
// import 'react-virtualized/styles.css'
// import 'react-table/react-table.css'
import PropTypes from 'prop-types'
import ReactDataGrid from 'react-data-grid'
import { TextField } from '@material-ui/core'
import SaveIcon from '@material-ui/icons/Save'
import { Typography, Card, CardActions, CardHeader, CardMedia, CardTitle } from '@material-ui/core'
import { NumberField } from '../../trade/components/FundField'
import Button from '@material-ui/core/Button'
import { CurrencyField } from '../../trade/components/CurrencyField'
import TimezonePicker from 'react-timezone';
import Snackbar from '../../snackbar';
import { some } from 'lodash'
import { request, handleResponse } from '../../utils'
import { userUpdateRequest, fetchTimezoneRequest } from '../requests';
import Accounting from 'accounting'

function formatMoney(value, symbol = 'CAD') {
    return Accounting.formatMoney(value, symbol)
}

const keyBtnStyles = {
    float: 'right',
    right: '3em',
    bottom: '4em',
    left: 'auto',
    position: 'fixed',
    zIndex: '5555'
}

const styles = {
    container: {
        textAlign: 'center',
    }
}

export class UserCard extends Component {
    constructor (props) {
        super(props)
    }

    render () {
        return (
        <Card style={{margin: '16px'}}>
            <CardMedia
                style={{marginBottom: '8px', height: '180px', width: 'auto', backgroundSize: 'contain'}}
                image='/static/images/avatar.jpg'
            >
            </CardMedia>
        </Card>
        )
    }
}


export class UserForm extends Component {
    constructor (props) {
        super(props)

        this.state = {
            editing: false,
            files: null,
            snackbarMsg: '',
            snackbarOpen: false,
            name: props.user.name,
            email: props.user.email,
            // account: props.user.account,
            // btcBalance: props.user.balance,
            // estimatedValue: props.user.estimated,
            timezone: undefined,
            tzOffset: undefined,
            currency: props.user.currency,
            language: 'English'
        }
    }

    updateTimezone = (value) => {
        this.setState({
            timezone: value,
            snackbarMsg: `Timezone offset changed to ${value}`,
            snackbarOpen: true
        })
    }

    handleCurrency = currency => this.setState({ currency })

    handleChange = (field, value) => {
        this.setState({...this.state, [field]: value});
    }

    snackbarMsg = (msg) => {
        this.setState({snackbarMsg: msg, snackbarOpen: true})
    }

    snackbarClose = () => {
        this.setState({snackbarOpen: false});
    };

    fileChange = (e) => {
        this.setState({files: e.target.files})
    }

    imageClick = () => {
        const clickResult = this.refs.userimagefile.click()
    }

    updateUser = async () => {
        const result = await userUpdateRequest({
            ...this.props.user,
            name: this.state.name,
            email: this.state.email,
            utc_offset: this.state.tzOffset,
            currency: this.state.currency
        }, { csrf: getCSRFToken() })
        let message
        if (!result.error) {
            message = `Successfully updated ${this.props.user.name}`
        } else {
            message = `Unable to update ${this.props.user.name}`
        }
        this.snackbarMsg(message)
    }

    onSubmit = async e => {
        e.preventDefault()

        const timezoneOffset = await fetchTzOffset(this.state.timezone)
        this.setState({ tzOffset: timezoneOffset }, async () => {
            await this.updateUser()
        })
    }

    render() {
        return (
            <div style={styles.container}>
                <Typography style={{color: '#E1E1E1'}} variant='h5'>Account Settings</Typography>

                <UserCard />

                <input
                    type="file"
                    ref="userimagefile"
                    className="userimage-file"
                    onChange={this.fileChange}
                />

                <form
                    className="user-form"
                    onSubmit={this.onSubmit}>
                    <div className='user-column-1'>
                        <div className='text-container'>
                            <TextField
                                ref='name'
                                className='userform'
                                label='Your user name'
                                value={this.state.name}
                            />
                        </div>
                        <br />
                        <div className='text-container'>
                            <TextField
                                ref='email'
                                className='userform'
                                label='Your email'
                                value={this.state.email}
                            />
                        </div>
                        <br />
                        <div className='text-container'>
                            <TextField
                                ref='language'
                                className='userform'
                                label='Your language'
                                value={this.state.language}
                            />
                        </div>
                        <br />
                        <div id="timezone-container" style={{display: 'flex'}}>
                            <TimezonePicker
                                value={this.state.timezone}
                                onChange={this.updateTimezone}
                                inputProps={{
                                    placeholder: 'Select Timezone...',
                                    name: 'timezone',
                                }}
                            />
                            <NumberField
                                value={Math.abs(this.state.tzOffset)}
                                max={24}
                                label='Offset'
                                prefix={this.state.tzOffset < 0 ? '-' : ''}
                                classes={{filledTextField: 'timezoneNumFilled', textField: 'timezoneNum' }}
                                width='15%'
                            />
                        </div>

                    </div>
                    {/* <hr className="userform-separator" /> */}

                    <div className='user-column-2'>

                        <CurrencyField full={true} currency={this.state.currency} handler={this.handleCurrency} >
                        </CurrencyField>

                        <div className="text-container balance-container">
                            <TextField
                                id="btc-balance"
                                className='btc-balance'
                                label='BTC Balance'
                                value={"₿ " + formatMoney(Number(this.props.user.balance), '')}
                            />
                        </div>

                        <div className="text-container estimated-container">
                            <TextField
                                id="estimated-value"
                                className='estimated-value'
                                label='Estimated value of BTC'
                                value={formatMoney(Number(this.props.user.estimated, this.props.user.currency))}
                            />
                        </div>

                        <div className="text-container account-container">
                            <TextField
                                id="account-balance"
                                className='account-balance'
                                label='Account balance'
                                value={formatMoney(Number(this.props.user.account), this.props.user.currency)}
                            />
                        </div>
                    </div>

                    <Button type='submit' color='primary' variant="contained" size="medium" className="user-save-btn">
                        <SaveIcon />
                            Save
                    </Button>
                </form>
                <Snackbar
                    className="user-snackbar"
                    open={this.state.snackbarOpen}
                    message={this.state.snackbarMsg}
                    autoHideDuration={4000}
                    onRequestClose={this.snackbarClose}
                />
            </div>
        )
    }
}

function isUserInfoChanged(userData, state) {
    if ('email' in state && 'name' in state) {
        const changed = userData.find(d => d.email !== state.email || d.name !== state.name)
        if (changed && changed.length > 0) {
            return true
        }
    }
    return false
}

function calculate_utc_offset (timezone) {
    return null
}

async function fetchTzOffset (zone) {
    const result = await fetchTimezoneRequest(zone)

    if (!result.error) {
        return result.body.gmtOffset / 3600
    } else {
        return result.error
    }
}

function getCSRFToken() {
    const cookie = document.cookie.split(';').filter(cookie => cookie.trim().substr(0, 4) === 'csrf')
    if (cookie && cookie.length > 0) {
        return cookie[0].trim().substr(5)
    }
  }