import * as React from 'react';
import {AppBar} from 'react-toolbox/lib/app_bar';
import {Layout, NavDrawer, Panel} from 'react-toolbox/lib/layout';
import Navigation from 'react-toolbox/lib/navigation';
import * as theme from '../../static/css/nav.css'
import Checkbox from 'react-toolbox/lib/checkbox';
import { TrxAppBar } from '../App.jsx'
import 'react-virtualized/styles.css'
// Import React Table
import "react-table/react-table.css";
import ReactDataGrid from 'react-data-grid'
import { TextField, RaisedButton } from 'material-ui'
import { TrxNav } from '../TrxAppBar.jsx'

const styles = {
    container: {
        textAlign: 'center',
        paddingTop: 16
    }
}


export class TradeForm extends React.Component {
    constructor (props, context) {
        super(props, context)

        // Default text
        this.state = {
            text: 'I love U',
            check1: true,
            check2: false
        }
    }

    handleChange = (field, value) => {
        this.setState({...this.state, [field]: value});
    };

    onSubmit = e => {
        // No real submit
        e.preventDefault()

        // Get input value
        const text = this.refs.cool_text.input.value

        // Set state
        this.setState({
            text
        })

        // Do something with text
        alert(`You said : ${text}`)
    }

    render () {
        return (
                <div style={styles.container}>
                    <h2>Trx Order</h2>
                    <Checkbox
                        checked={this.state.check1}
                        label="Very Gay"
                        onChange={this.handleChange.bind(this, 'check1')}
                    />
                    <Checkbox
                        checked={this.state.check2}
                        label="Really Very Gay"
                        onChange={this.handleChange.bind(this, 'check2')}
                    />

                    <form onSubmit={this.onSubmit}>
                        <TextField
                            ref='cool_text'
                            floatingLabelText='Say something cool!'
                            defaultValue={this.state.text}
                        />
                        <br />
                        <RaisedButton type='submit' label='Submit' primary />
                    </form>
                </div>
        )
    }
}

const rowData = JSON.parse(trxPrices.replace(/'/g, '"'))
export class TrxGrid extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.createRows();
        this._columns = [
            { key: 'cur', name: 'Currency' },
            { key: 'sell', name: 'Sell' },
            { key: 'buy', name: 'Buy' } ];

        this.state = null;
    }

    createRows = () => {
        let rows = rowData.map(x => TrxGrid.buildRows(x))

        console.dir(rows)

        this._rows = rows;
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
                minHeight={500} />);
    }
}

export class TrxLayout extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
    }

    state = {
        drawerActive: false,
        drawerPinned: false,
        sidebarPinned: false
    };

    handleClick = () => {
        this.setState({
            open: true,
        });
    };

    handleRequestClose = () => {
        this.setState({
            open: false,
        });
    };

    toggleDrawerActive = () => {
        this.setState({
            drawerActive: !this.state.drawerActive
        });
    };

    toggleDrawerPinned = () => {
        this.setState({
            drawerPinned: !this.state.drawerPinned
        });
    }

    toggleSidebar = () => {
        this.setState({
            sidebarPinned: !this.state.sidebarPinned
        });
    };

    render() {
        return (
                <TrxNav />
        )
    }
}