import '@babel/polyfill'

import * as React from 'react';
import Checkbox from 'react-toolbox/lib/checkbox';
import { TrxAppBar } from '../App.jsx'
import 'react-virtualized/styles.css'
// Import React Table
import "react-table/react-table.css";
import ReactDataGrid from 'react-data-grid'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import Input from '@material-ui/core/Input'
import InputAdornment from '@material-ui/core/InputAdornment'
import FundField from './components/FundField'
import MenuItem from '@material-ui/core/MenuItem'
import Button from '@material-ui/core/IconButton'
import { MuiPickersUtilsProvider, DatePicker } from 'material-ui-pickers'
import DateFnsUtils from '@date-io/date-fns'
import AddIcon from '@material-ui/icons/Add'
import CloudUploadIcon from '@material-ui/icons/CloudUpload'
import { request, formatTimestamp, handleResponse } from '../utils/index'

const rowData = JSON.parse(trxPrices.replace(/'/g, '"'))
const tradeData = JSON.parse(trxTrades.replace(/'/g, '"'))

const styles = {
    container: {
        flexGrow: 1,
        textAlign: 'center',
        backgroundColor: '#131313',
        fontFamily: 'Roboto'
    },
    textField: {
        width: '100%'
    },
    trxForm: {
        outline: '1px solid #e7eaec',
        paddingTop: '4px',
        backgroundColor: '#4a4a4a'
    },
    cleanHeader: {
        marginBlockStart: 0,
        marginBlckEnd: 0
    },
    gridTitle: {
        height: '48px',
        lineHeight: 2.75,
        textAlign: 'center',
        backgroundColor: '#131313',
        margin: 0,
        color: '#FFF'
    },
    input: {
        width: '85%'
    },
    submitButton: {
        padding: '16px',
        backgroundColor: '#64dd17',
        marginLeft: '60%',
        minWidth: '112px!important',
        marginBottom: '8px'
    }
}

const classes = {
    textField: 'textField',
    filledTextField: 'filledTextField',
    datePicker: 'datePicker',
    filledDatePicker: 'filledDatePicker',
    submitButton: 'submitButton'
}

const currencies = [
    {
        value: 'CAD',
        label: '$'
    }, {
        value: 'EUR',
        label: 'EUR'
    }
]

function getCurrency(currency) {
    return currencies.find(cur => cur.label = currency).value
}

export class OfferForm extends React.Component {
    constructor (props, context) {
        super(props, context)

        this.state = {
            offerDate: undefined,
            offerAmount: undefined,
            offerPrice: undefined,
            currency: '$'
        }
    }

    handleChange = name => event => {
        this.setState({
            [name]: event.target.value
        })
    }

    handleDateChange = date => {
        this.setState({ offerDate: date })
    }

    amountHandler = (amount) => {
        this.setState({ offerAmount: amount })
    }

    onSubmit = async e => {
        e.preventDefault()
        if (this.props.msgHandler) {
            this.props.msgHandler('Sending request for offer')
        }
        const response = await request({
            url: '/offer',
            method: 'POST',
            body: {
                uid: this.props.uid,
                rate: this.state.offerPrice,
                amount: this.state.offerAmount,
                date: this.state.offerDate,
                currency: getCurrency(this.state.currency)
            }
        })
        const result = handleResponse(response)
        if (!result.error) {
            this.setState({
                offerDate: undefined,
                offerAmount: undefined,
                offerPrice: undefined
            })
            this.props.msgHandler('Offer accepted')
        } else {
            this.props.msgHandler(result.body ? result.body : 'Unable to process offer at this time')
        }
    }

    render () {
        return (
            <div style={styles.container}>
                <h3 style={{...styles.cleanHeader, ...styles.gridTitle}}>Offer</h3>
                <form style={styles.trxForm} onSubmit={this.onSubmit}>
                    <TextField
                    className={classes.textField}
                    id="select-currency"
                    style={styles.input}
                    select
                    label="Currency"
                    value={this.state.currency}
                    onChange={this.handleChange('currency')}
                    >
                        {currencies.map(option => (
                            <MenuItem key={option.label} value={option.label}>
                                {option.value}
                            </MenuItem>
                        ))}
                    </TextField>
                    <FundField
                        className={parseFloat(this.state.offerAmount) > 0 ? classes.filledTextField : classes.textField}
                        max={this.props.balance}
                        currency={'BTC'}
                        offer={true}
                        handler={this.amountHandler}
                    />
                    <TextField
                        className={this.state.offerPrice > 0 ? classes.filledTextField : classes.textField}
                        style={styles.input}
                        type='number'
                        label='Rate per BTC'
                        value={this.state.offerPrice}
                        onChange={this.handleChange('offerPrice')}
                    />

                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <Grid container className='date-grid' justify="space-around">
                        <DatePicker
                            margin="normal"
                            style={styles.input}
                            label='Offer end date'
                            className={this.state.offerDate ? classes.filledDatePicker : classes.datePicker}
                            value={this.state.offerDate}
                            onChange={this.handleDateChange}
                        />
                        </Grid>
                    </MuiPickersUtilsProvider>
                    <Button
                        label='Create Offer'
                        onClick={this.onSubmit}
                        style={styles.submitButton}
                        className={classes.submitButton}
                        variant="contained" color="default"
                    >
                        Offer
                        <CloudUploadIcon />
                    </Button>
                </form>
            </div>
        )
    }
}

export class BidForm extends React.Component {
    constructor (props, context) {
        super(props, context)

        this.state = {
            bidDate: undefined,
            bidAmount: undefined,
            bidPrice: undefined,
            currency: '$'
        }
    }

    handleChange = name => event => {
        this.setState({
            [name]: event.target.value
        })
    }

    handleDateChange = date => {
        this.setState({ bidDate: date })
    }

    amountHandler = (amount) => {
        this.setState({ bidAmount: amount })
    }

    onSubmit = async e => {
        e.preventDefault()
        this.props.msgHandler(`Requesting bid for ${this.state.bidAmount} BTC at a rate of ${this.state.bidPrice} ${getCurrency(this.state.currency)} with an expiry of ${formatTimestamp(this.state.bidDate)}`)
        const response = await request({
            url: '/bid',
            method: 'POST',
            body: {
                uid: this.props.uid,
                rate: this.state.bidPrice,
                amount: this.state.bidAmount,
                date: this.state.bidDate,
                currency: getCurrency(this.state.currency)
            }
        })
        const result = handleResponse(response)
        if (!result.error) {
            this.setState({
                bidDate: undefined,
                bidAmount: undefined,
                bidPrice: undefined
            })
            this.props.msgHandler('Bid accepted')
        } else {
            this.props.msgHandler(result.body ? result.body : 'Unable to process bid at this time')
        }
    }

    render () {
        return (
            <div style={styles.container}>
                <h3 style={{...styles.cleanHeader, ...styles.gridTitle}}>Bid</h3>
                <form style={styles.trxForm} onSubmit={this.onSubmit}>
                    <TextField
                    className={classes.textField}
                    style={styles.input}
                    id="select-currency"
                    select
                    label="Currency"
                    value={this.state.currency}
                    onChange={this.handleChange('currency')}
                    >
                        {currencies.map(option => (
                            <MenuItem key={option.label} value={option.label}>
                                {option.value}
                            </MenuItem>
                        ))}
                    </TextField>
                    <FundField
                        className={parseFloat(this.state.bidAmount) > 0 ? classes.filledTextField : classes.textField}
                        max={this.props.balance}
                        currency={'BTC'}
                        offer={false}
                        handler={this.amountHandler}
                    />
                    <TextField
                        className={this.state.bidPrice > 0 ? classes.filledTextField : classes.textField}
                        style={styles.input}
                        type='number'
                        label='Rate per BTC'
                        value={this.state.offerPrice}
                        onChange={this.handleChange('bidPrice')}
                    />
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <Grid container className='date-grid' justify="space-around">
                        <DatePicker
                            margin="normal"
                            style={styles.input}
                            label='Bid end date'
                            className={this.state.bidDate ? classes.filledDatePicker : classes.datePicker}
                            value={this.state.bidDate}
                            onChange={this.handleDateChange}
                        />
                        </Grid>
                    </MuiPickersUtilsProvider>
                    <Button
                        label='Create Bid'
                        onClick={this.onSubmit}
                        className={classes.submitButton}
                        style={styles.submitButton}
                        variant="contained" color="default"
                    >
                        Bid
                        <CloudUploadIcon />
                    </Button>
                </form>
            </div>
        )
    }
}

export class TrxGrid extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.createRows()
        this._columns = [
            { key: 'cur', name: 'Currency' },
            { key: 'sym', name: 'Symbol' },
            { key: 'time', name: 'Time' },
            { key: 'sell', name: 'Sell' },
            { key: 'buy', name: 'Buy' } ]

        this.state = null
    }

    createRows = () => {
        this._rows = rowData.map(x => TrxGrid.buildRows(x))
    };

    static buildRows(price) {
        return {
            'cur': price.currency,
            'sym': price.symbol,
            'time': formatTimestamp(price.modified, true),
            'sell': price.symbol + price.sell,
            'buy': price.symbol + price.buy
        }

    }

    rowGetter = (i) => {
        return this._rows[i];
    };

    render() {
        return  (
            <div>
                <div style={styles.gridTitle}>
                    <h3>Market</h3>
                </div>
                <ReactDataGrid
                    columns={this._columns}
                    rowGetter={this.rowGetter}
                    rowsCount={this._rows.length}
                    minHeight={135}/>
            </div>)
    }
}

export class TradeGrid extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.createRows()
        this._columns = [
            { key: 'cur', name: 'Currency' },
            { key: 'sym', name: 'Symbol' },
            { key: 'time', name: 'Time' },
            { key: 'amt', name: 'Amount' },
            { key: 'rate', name: 'Rate' },
            { key: 'prc', name: 'Price' } ]

        this.state = null
    }

    createRows = () => {
        this._rows = tradeData.map(x => TradeGrid.buildRows(x))
    };

    static buildRows(trade) {
        const symbol = rowData[0].symbol
        console.log(trade.time)
        return {
            'cur': trade.currency,
            'sym': symbol,
            'time': formatTimestamp(trade.time, true),
            'amt': trade.offer.amount / 100000000 + ' BTC',
            'rate': symbol + trade.offer.rate + '/BTC',
            'prc': `${symbol}${parseFloat(trade.offer.amount * trade.offer.rate / 100000000).toFixed(2)}`
        }

    }

    rowGetter = (i) => {
        return this._rows[i];
    };

    render() {
        return  (
            <div>
                <div style={styles.gridTitle}>
                    <h3 >TRX Trades</h3>
                </div>
                <ReactDataGrid
                    columns={this._columns}
                    rowGetter={this.rowGetter}
                    rowsCount={this._rows.length}
                    minHeight={135}/>
            </div>)
    }
}