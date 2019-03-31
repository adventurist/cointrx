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
import { Edit } from '@material-ui/icons';

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
        <Card style={{backgroundColor: '#303030', padding: '12px', minWidth: '150px'}}>
            <CardMedia
                style={{minHeight: '100px', width: 'auto', backgroundSize: 'contain'}}
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
            timezone: undefined,
            tzOffset: props.user.utc_offset || 0,
            currency: props.user.currency,
            language: 'English'
        }
    }

    updateTimezone = (value) => {
        if (this.state.editing) {
            this.setState({
                timezone: value,
                snackbarMsg: `Timezone changed to ${value}`,
                snackbarOpen: true
            })
        } else {
            this.notifyCannotUpdate()
        }
    }

    handleCurrency = currency => {
        if (this.state.editing) {
            this.setState({ currency })
        } else {
            this.notifyCannotUpdate()
        }
    }

    handleChange = name => event => {
        if (this.state.editing) {
            this.setState({[name]: event.target.value})
        } else {
            this.notifyCannotUpdate()
        }
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

    toggleEditMode = e => {
        e.preventDefault()
        this.setState({ editing: !this.state.editing }, () => {
            this.snackbarMsg(this.state.editing ? 'Edit mode enabled' : 'Edit mode disabled')
        })
    }

    updateUser = async () => {
        if (this.state.editing) {
            const userData = {
                ...this.props.user,
                name: this.state.name,
                email: this.state.email,
                utc_offset: this.state.tzOffset,
                currency: this.state.currency
            }

            delete userData.account
            delete userData.balance
            delete userData.estimated

            const result = await userUpdateRequest(
                userData,
                { csrf: getCSRFToken() }
            )
            let message
            if (!result.error) {
                message = `Successfully updated ${this.props.user.name}`
            } else {
                message = `Unable to update ${this.props.user.name}`
            }
            this.globalMessage(message)
        } else {
            this.notifyCannotUpdate()
        }
    }

    notifyCannotUpdate = () => this.globalMessage('You cannot update user information unless you enable editing. Click the edit button')

    globalMessage = message => {
        this.snackbarMsg(message)
        this.props.log(message)
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
                <Typography style={{color: '#E1E1E1', paddingBottom: '12px'}} variant='headline'>Account Settings</Typography>
                <form
                    className="user-form"
                    onSubmit={this.onSubmit}>
                    <div>
                        <UserCard />
                        </div>
                    <div className='user-column-1'>
                        <div>
                            <div className='text-container'>
                                <TextField
                                    onChange={this.handleChange('name')}
                                    className={this.state.editing ? 'userform' : 'userform-disabled'}
                                    label='Your user name'
                                    value={this.state.name}
                                />
                            </div>
                            <br />
                            <div className='text-container'>
                                <TextField
                                    onChange={this.handleChange('email')}
                                    className={this.state.editing ? 'userform' : 'userform-disabled'}
                                    label='Your email'
                                    value={this.state.email}
                                />
                            </div>
                            <br />
                            <div className='text-container'>
                                <TextField
                                    className={this.state.editing ? 'userform' : 'userform-disabled'}
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
                                        placeholder: 'Change UTC Offset',
                                        name: 'timezone',
                                    }}
                                />
                                <NumberField
                                    value={Math.abs(this.state.tzOffset)}
                                    max={24}
                                    label='TZ Offset'
                                    prefix={this.state.tzOffset < 0 ? '-' : ''}
                                    classes={{filledTextField: 'timezoneNumFilled', textField: 'timezoneNum' }}
                                    width='15%'
                                />
                            </div>
                        </div>
                    </div>
                    {/* <hr className="userform-separator" /> */}

                    <div className='user-column-2'>

                        <CurrencyField full={true} enabled={this.state.editing} currency={this.state.currency} handler={this.handleCurrency} >
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
                    <div className='user-save-btn-wrap'>
                        <Button type='button' color='#FFF' variant="contained" size="medium" onClick={this.toggleEditMode} className="user-edit-btn">
                            <Edit fontSize='small' />
                                Edit
                        </Button>
                        <Button type='submit' color='primary' variant="contained" size="medium" className="user-save-btn">
                            <SaveIcon />
                                Save
                        </Button>
                    </div>
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