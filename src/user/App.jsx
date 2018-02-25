import * as React from 'react';
import 'react-virtualized/styles.css'
import "react-table/react-table.css"
import PropTypes from 'prop-types';
import ReactDataGrid from 'react-data-grid'
import {TextField, RaisedButton} from 'material-ui'
import {Card, CardActions, CardHeader, CardMedia, CardTitle} from 'material-ui/Card'
import FlatButton from 'material-ui/FlatButton'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import Tooltip from 'material-ui/internal/Tooltip'
import Dialog from 'material-ui/Dialog';
import DatePicker from 'material-ui/DatePicker';

function parseKeyDataJson(userData) {
    return [...JSON.parse(userData.replace(/'/g, '"'))['keys']]
}
function parseProfileDataJson(userData) {
    return JSON.parse(userData.replace(/'/g, '"'))
}

const userProfileData = parseProfileDataJson(userData)
const keyData = parseKeyDataJson(userData)
const rowData = JSON.parse(trxPrices.replace(/'/g, '"'))

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
        paddingTop: 16
    }
}

const UserCard = () => (
    <Card>
        <CardHeader
            title={userProfileData.name}
            subtitle={userProfileData.email}
            actAsExpander={true}
            showExpandableButton={true}
        />
        <CardActions>
            <FlatButton label="Settings"/>
            <FlatButton label="Security"/>
        </CardActions>
        <CardMedia
            expandable={true}
            overlay={<CardTitle title="This ugly bitch" subtitle="So ugly"/>}
        >
            <img
                src="https://cointrx.com/sites/default/files/2017-09/X58Q4cA.jpg" alt="User photo"
                className="user-photo"
            />
        </CardMedia>
    </Card>
);


export class UserForm extends React.Component {
    constructor(props, context) {
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
        console.dir(userData)
    }

    handleChange = (field, value) => {
        this.setState({...this.state, [field]: value});
    }

    fileChange = (e) => {
        this.setState({files: e.target.files})
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

    render() {
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
                    <RaisedButton type='submit' label='Submit' primary/>
                </form>
            </div>
        )
    }
}

export class UserKeys extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            btnHovered: false,
            _columns: [
                {key: 'id', name: 'ID'},
                {key: 'adr', name: 'Address'},
                {key: 'bal', name: 'Balance'},
                {key: 'btn', name: 'Modify'}
            ],
            _rows: this.createRows(keyData),
            dialogOpen: false,
            dialogCursor: 0,
        }
        this._rows = null
        this.rowsCount = null
    }

    componentDidMount() {
        this.setState({_rows: this.addBtnRows(this.state._rows)})
        this._rows = this.state._rows
        this.rowsCount = this.state._rows.length
    }

    static propTypes = {
        // className: PropTypes.string,
        // icon: PropTypes.string.isRequired, // fontawesome
        mini: PropTypes.bool,
        tooltipPosition: PropTypes.oneOf(['bottom-center', 'top-center', 'bottom-right', 'top-right', 'bottom-left', 'top-left']),
        onClick: PropTypes.func
    };

    static defaultProps = {
        mini: false,
        tooltipPosition: 'top-center'
    };

    requestBtcKey = async() => {
        console.log('New BTC Key requested')
        const cookies = (document.cookie.split(';'))
        const cookie = cookies.filter(cookie => cookie.trim().substr(0, 4) === 'csrf')
        if (cookie && cookie.length > 0) {
            const csrf = cookie[0].trim().substr(5)
            const newUserData = await fetchKey(keygenUrl, csrf)
            if (newUserData && Array.isArray(newUserData) && newUserData.length > 0) {
                const keys = Object.keys(newUserData[0])
                if (!keys.includes('error')) {
                    console.log('Updating user data')
                    const _newRows = newUserData[0].keys
                    this.updateState(_newRows)
                } else {
                    console.log('Token no longer valid. Please log back in')
                    window.location.replace('/login')
                }
            }
        }
    }

    requestBtcKeyDelete = async(id) => {
        console.log(`BTC Key deletion requested: ${id}`)
        const csrf = getCsrfToken()
        const keyDeleteResult = await deleteKey('temp', csrf)
    }

    disableKey() {
        this.requestBtcKeyDelete(this.state.dialogCursor).then(
            alert('Eat some clams')
        )
    }

    openEditKeyDialog(id) {
        this.setState({dialogOpen: true, dialogCursor: id})
    }

    handleOpen = () => {
        this.setState({dialogOpen: true});
    };

    handleClose = () => {
        this.setState({dialogOpen: false});
    };

    updateState(rows) {
        this.setState({btnHovered: false, _rows: this.createRows(rows)})
    }

    getRows() {
        return this.state._rows
    }

    createRows = (keyData) => keyData.map(x => this.buildRows(x))
    addBtnRows = (rows) => rows.map(x => this.buildBtns(x))

    buildRows(key) {
        return {
            'id': key.id,
            'adr': key.address,
            'bal': key.balance,
            'btn': ''

        }
    }

    buildBtns (row) {
        return ({
            'id': row.id,
            'adr': row.address,
            'bal': row.balance,
            'btn': <div><RaisedButton label="Edit" secondary={true} id={row.id}
                                      onClick={this.openEditKeyDialog.bind(this)}/>
                {this.state.dialogOpen && UserKeys.isObjectEquivalent(this.props.row, this.state.dialogCursor) ? (
                        <KeyDialog show={this.state.dialogOpen}/>) : null}
            </div>
        })
    }

    static isObjectEquivalent(a, b) {
        const aProps = Object.getOwnPropertyNames(a);
        const bProps = Object.getOwnPropertyNames(b);

        if (aProps.length != bProps.length) {
            return false;
        }

        for (let i = 0; i < aProps.length; i++) {
            const propName = aProps[i];
            if (a[propName] !== b[propName]) {
                return false;
            }
        }
        return true
    }

    rowGetter = (i) => {
        return this.state._rows[i];
    };

    render() {
        const {mini, tooltipPosition} = this.props;
        const tooltipPos = tooltipPosition.split('-');
        const tooltip = 'Create new Bitcoin Address'
        const actions = [
            <FlatButton
                label="Delete"
                secondary={true}
                keyboardFocused={true}
                onClick={this.disableKey}
            />,
        ];
        return (
            <div id="key-container">
                <ReactDataGrid
                    columns={this.state._columns}
                    rowGetter={this.rowGetter}
                    rowsCount={this.state._rows.length}
                    minHeight={500}/>
                <div style={keyBtnStyles} id="fab-container">
                    <FloatingActionButton id="btc-key-btn"
                                          mini={mini}
                                          onClick={this.requestBtcKey}
                                          onMouseEnter={() => this.setState({btnHovered: true})}
                                          onMouseLeave={() => this.setState({btnHovered: false})}>

                        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                            <path fill="#000000"
                                  d="M4.5,5H8V2H10V5H11.5V2H13.5V5C19,5 19,11 16,11.25C20,11 21,19 13.5,19V22H11.5V19H10V22H8V19H4.5L5,17H6A1,1 0 0,0 7,16V8A1,1 0 0,0 6,7H4.5V5M10,7V11C10,11 14.5,11.25 14.5,9C14.5,6.75 10,7 10,7M10,12.5V17C10,17 15.5,17 15.5,14.75C15.5,12.5 10,12.5 10,12.5Z"/>
                        </svg>

                    </FloatingActionButton>
                    {tooltip &&
                    <Tooltip
                        show={this.state.btnHovered}
                        label={tooltip}
                        style={{fontSize: '9pt'}}
                        horizontalPosition={tooltipPos[1]}
                        verticalPosition={tooltipPos[0]}/>
                    }
                </div>
                <Dialog
                    title="Key Editor"
                    actions={actions}
                    modal={false}
                    open={this.state.dialogOpen}
                    onRequestClose={this.handleClose}
                >
                    Open a Date Picker dialog from within a dialog.
                    <DatePicker hintText="Date to disable"/>
                </Dialog>
            </div>
        )
    }
}


export class TrxGrid extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.createRows()
        this._columns = [
            {key: 'cur', name: 'Currency'},
            {key: 'sell', name: 'Sell'},
            {key: 'buy', name: 'Buy'}]

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
    }

    render() {
        return (
            <ReactDataGrid
                columns={this._columns}
                rowGetter={this.rowGetter}
                rowsCount={this._rows.length}
                minHeight={500}/>
        );
    }
}

function fetchKey(url, csrf) {
    return new Promise((resolve) => {
        console.log('fetchKey called')
        let options = {
            method: 'POST',
            headers: new Headers({'Content-Type': 'application/json', 'csrf-token': csrf})
        }

        if (options.method === 'POST' && csrf !== void 0) {
            options.body = JSON.stringify({csrf: csrf})
        }

        fetch(url, options).then(res =>
            res.json()
                .catch(error =>
                    console.error('Error:', error)
                ))
            .then(response => {
                console.log('Success')
                console.dir(response)
                return resolve(response)
            })
    })
}

function getCsrfToken() {
    const cookie = cookies.filter(cookie => cookie.trim().substr(0, 4) === 'csrf')
    if (cookie && cookie.length > 0) {
        return cookie[0].trim().substr(5)

    }
}


class KeyDialog extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.props = {
            keyId: 0,
            show: false
        }
        this.state = {open: true}
    }

    state = {}

    handleOpen = () => {
        this.setState({open: true});
    };

    handleClose = () => {
        this.setState({open: false});
    };

    render() {
        const actions = [
            <FlatButton
                label="Delete"
                secondary={true}
                keyboardFocused={true}
                onClick={this.disableKey(this.props.keyid)}
            />,
            <FlatButton
                label="OK"
                primary={true}
                keyboardFocused={true}
                onClick={this.handleClose()}
            />,
        ];

        return (
            <div>
                <Dialog
                    title="Dialog With Date Picker"
                    actions={actions}
                    modal={false}
                    open={this.props.show}
                    onRequestClose={this.handleClose}
                >
                    <div className="datepicker">
                        <DatePicker hintText="Date Picker" />
                        <FlatButton label="Set" secondary={true} keyboardFocused={true} onClick=""/>
                    </div>
                </Dialog>
            </div>
        );
    }
}