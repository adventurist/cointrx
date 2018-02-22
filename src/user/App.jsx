import * as React from 'react';
import 'react-virtualized/styles.css'
// Import React Table
import "react-table/react-table.css";
import ReactDataGrid from 'react-data-grid'
import { TextField, RaisedButton } from 'material-ui'
import {Card, CardActions, CardHeader, CardMedia, CardTitle} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

const userProfileData = JSON.parse(userData.replace(/'/g, '"'))
const keyData = [...JSON.parse(userData.replace(/'/g, '"'))['keys']]

const UserCard = () => (
    <Card>
        <CardHeader
            title={userProfileData.name}
            subtitle={userProfileData.email}
            actAsExpander={true}
            showExpandableButton={true}
        />
        <CardActions>
            <FlatButton label="Change me" />
            <FlatButton label="Change you" />
        </CardActions>
        <CardMedia
            expandable={true}
            overlay={<CardTitle title="This ugly bitch" subtitle="So ugly" />}
        >
            <img
                src="https://cointrx.com/sites/default/files/2017-09/X58Q4cA.jpg" alt="User photo"
                className="user-photo"
            />
        </CardMedia>
    </Card>
);

const styles = {
    container: {
        textAlign: 'center',
        paddingTop: 16
    }
}


export class UserForm extends React.Component {
    constructor (props, context) {
        super(props, context)

        this.initData()

        this.state = {
            editing: false,
            files: null,
            username: userProfileData.name,
            email: userProfileData.email
        }
    }

    initData = () => {
        // const userProfileData = JSON.parse(userData.replace(/'/g, '"'))
        console.dir(userData)
    }

    handleChange = (field, value) => {
        this.setState({...this.state, [field]: value});
    }

    fileChange = (e) => {
        this.setState({ files: e.target.files })
    }

    imageClick = () => {
        const clickResult = this.refs.userimagefile.click()
    }

    onSubmit = e => {
        e.preventDefault()

        const username = this.refs.username.input.value
        const language = this.refs.language.input.value
        const email = this.refs.email.input

        this.setState({
            username,
            language,
            email,
        })
    }

    render () {
        return (
                <div style={styles.container}>
                    <h2>Account</h2>

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
                        <TextField
                            ref='username'
                            className='userform'
                            floatingLabelText='Your username'
                            defaultValue={this.state.username}
                        />
                        <br />
                        <TextField
                            ref='email'
                            className='userform'
                            floatingLabelText='Your email'
                            defaultValue={this.state.email}
                        />
                        <br />
                        <TextField
                            ref='language'
                            className='userform'
                            floatingLabelText='Your language'
                            defaultValue={this.state.language}
                        />
                        <br />
                        <RaisedButton type='submit' label='Submit' primary />
                    </form>
                </div>
        )
    }
}

export class UserKeys extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.createRows();
        this._columns = [
            { key: 'id', name: 'ID' },
            { key: 'hex', name: 'Hex' },
            { key: 'bal', name: 'Balance' },
            {key: 'btn', name: 'Modify'}];
        this.state = null;
    }

    createRows = () => {
        let rows = keyData.map(x => UserKeys.buildRows(x))
        this._rows = rows;
    };

    static buildRows(key) {
        return {
            'id': key.id,
            'hex': key.value,
            'bal': key.balance,
            'btn': <RaisedButton label="Edit" secondary={true} id={key.id} />
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

// export class TrxLayout extends React.Component {
//
//     constructor(props) {
//         super(props);
//         this.state = {
//             open: false,
//         };
//     }
//
//     state = {
//         drawerActive: false,
//         drawerPinned: false,
//         sidebarPinned: false
//     };
//
//     handleClick = () => {
//         this.setState({
//             open: true,
//         });
//     };
//
//     handleRequestClose = () => {
//         this.setState({
//             open: false,
//         });
//     };
//
//     toggleDrawerActive = () => {
//         this.setState({
//             drawerActive: !this.state.drawerActive
//         });
//     };
//
//     toggleDrawerPinned = () => {
//         this.setState({
//             drawerPinned: !this.state.drawerPinned
//         });
//     }
//
//     toggleSidebar = () => {
//         this.setState({
//             sidebarPinned: !this.state.sidebarPinned
//         });
//     };
//
//     render() {
//         return (
//             <TrxNav />
//         )
//     }
// }