import '@babel/polyfill'

import * as React from 'react';
import Checkbox from 'react-toolbox/lib/checkbox';
import { TrxAppBar } from '../App.jsx'
import 'react-virtualized/styles.css'
// Import React Table
import "react-table/react-table.css";
import ReactDataGrid from 'react-data-grid'
import TextField from '@material-ui/core/TextField'
import Input from '@material-ui/core/Input'
import InputAdornment from '@material-ui/core/InputAdornment'
import FundField from './components/FundField'
import MenuItem from '@material-ui/core/MenuItem'
import Button from '@material-ui/core/IconButton'

import AddIcon from '@material-ui/icons/Add'

import { request } from '../utils/index'

const rowData = JSON.parse(trxPrices.replace(/'/g, '"'))

const styles = {
    container: {
        flexGrow: 1,
        textAlign: 'center'
    },
    textField: {
        width: '100%'
    }
}

const classes = {
    textField: 'textField'
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
            bidDate: undefined,
            offerAmount: undefined,
            offerPrice: undefined,
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

    amountHandler = (amount) => {
        this.setState({ offerAmount: amount })
    }

    onSubmit = async e => {
        e.preventDefault()
        console.log(this.state)
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
    }

    render () {
        return (
            <div style={styles.container}>
                <h2>Trade Form</h2>
                <h3>Offer</h3>
                <form onSubmit={this.onSubmit}>
                    <TextField
                    className={classes.textField}
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
                        className={classes.textField}
                        max={this.props.balance}
                        currency={'BTC'}
                        handler={this.amountHandler}
                    />
                    {/* <TextField
                        value={this.state.offerAmount || 0}
                        type='number'
                        max={parseFloat(userDataObject.estimated)}
                        label='Amount to offer'
                        prefix={this.state.currency}
                        // startAdornment={<InputAdornment position='start'>{this.state.currency}</InputAdornment>}
                        onChange={this.handleChange('offerAmount')}
                    /> */}
                    <TextField
                        className={classes.textField}
                        type='number'
                        label='Rate per BTC'
                        value={this.state.offerPrice}
                        onChange={this.handleChange('offerPrice')}
                    />
                    <TextField
                        className={classes.textField}
                        type='date'
                        label='Offer end date'
                        value={this.state.offerDate}
                        onChange={this.handleChange('offerDate')}
                    />
                    <Button
                        label='Create Offer'
                        onClick={this.onSubmit}
                    >
                        <AddIcon />
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

    amountHandler = (amount) => {
        this.setState({ bidAmount: amount })
    }

    onSubmit = async e => {
        e.preventDefault()
        console.log(this.state)
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
    }

    render () {
        return (
            <div style={styles.container}>
                <h3>Bid</h3>
                <form onSubmit={this.onSubmit}>
                    <TextField
                    className={classes.textField}
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
                        className={classes.textField}
                        max={this.props.balance}
                        currency={'BTC'}
                        handler={this.amountHandler}
                    />
                    <TextField
                        className={classes.textField}
                        type='number'
                        label='Rate per BTC'
                        value={this.state.offerPrice}
                        onChange={this.handleChange('bidPrice')}
                    />
                    <TextField
                        className={classes.textField}
                        type='date'
                        label='Offer end date'
                        value={this.state.bidDate}
                        onChange={this.handleChange('bidDate')}
                    />
                    <Button
                        label='Create Bid'
                        onClick={this.onSubmit}
                    >
                        <AddIcon />
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
            'sell': price.sell,
            'buy': price.buy
        }

    }

    rowGetter = (i) => {
        return this._rows[i];
    };

    render() {
        return  (
            <ReactDataGrid
                columns={this._columns}
                rowGetter={this.rowGetter}
                rowsCount={this._rows.length}
                minHeight={500} />)
    }
}