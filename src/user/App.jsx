import * as React from 'react'
import 'react-virtualized/styles.css'
import 'react-table/react-table.css'
import PropTypes from 'prop-types'
import ReactDataGrid from 'react-data-grid'
import {TextField, RaisedButton} from 'material-ui'
import {Card, CardActions, CardHeader, CardMedia, CardTitle} from 'material-ui/Card'
import FlatButton from 'material-ui/FlatButton'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import Tooltip from 'material-ui/internal/Tooltip'
import Dialog from 'material-ui/Dialog'
import DatePicker from 'material-ui/DatePicker'
import TimezonePicker from 'react-timezone';
import Snackbar from 'material-ui/Snackbar';
import { some } from 'lodash'


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
                src="/static/images/default/avatar.jpg" alt="User photo"
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
            snackbarMsg: '',
            snackbarOpen: false,
            username: userProfileData.name,
            email: userProfileData.email,
            estimatedValue: userProfileData.estimated,
            timezone: 'Asia/Yerevan'
        }
    }

    initData = () => {
        console.dir(userData)
    }

    updateTimezone = (value) => {
        this.setState({timezone: value})
    }

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

    onSubmit = e => {
        e.preventDefault()
        this.requestUserUpdate(userProfileData.id, {name: this.refs.username.input.value, email: this.refs.email.input.value}).then((result) => this.snackbarMsg('User Information has been Updated'))
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
                    <div id="timezone-container">
                        <TimezonePicker
                            defaultValue={this.state.timezone}
                            onChange={this.updateTimezone}
                            inputProps={{
                                placeholder: 'Select Timezone...',
                                name: 'timezone',
                            }}
                        />
                    </div>

                    <RaisedButton type='submit' label='Save' primary/>

                    <hr className="userform-separator" />

                    <div className="estimated-container">
                        <TextField
                            id="estimated-value"
                            ref='estimated'
                            className='estimated-value'
                            defaultValue={"$" + Number(this.state.estimatedValue) + " estimated value"}
                        />
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

    saveUser () {

        if (isUserInfoChanged(userProfileData, this.state)) {
            this.requestUserUpdate(userProfileData.id, this.state)
        }
    }

    requestUserUpdate = async (id, payload) => {
        const csrf = getCsrfToken()
        if (csrf && csrf.length > 0) {
            const result = await fetchUserUpdate(id, payload, csrf)
            if (!result.error) {
                if (this.updateUser(id, payload)) {
                    console.debug('User Updated')
                    return true
                }
            }
        }
        return false
    }

    updateUser(id, payload) {
        if (payload !== void 0) {
            let userChanged = false
            payload.name = payload.name !== void 0 ? payload.name : this.state.username
            payload.email = payload.email !== void 0 ? payload.email : this.state.email
            if (payload.name !== void 0 || payload.email !== void 0) {
                userChanged = payload.name !== this.state.username || payload.email !== this.state.email ? !userChanged : userChanged
            }
            if (userChanged) {
                this.setState({username: payload.name, email: payload.email})
            } else {
                console.debug('User not changed')
            }
            return true
        }
        console.debug('updateUser called with bogus payload')
        return false
    }
}

function isUserInfoChanged(userData, state) {
    if ('email' in state && 'username' in state) {
        const changed = userData.find(d => d.email !== state.email || d.name !== state.username)
        if (changed && changed.length > 0) {
            return true
        }
    }
    return false
}

export class UserKeys extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            btnHovered: false,
            _columns: [
                {key: 'id', name: 'ID'},
                {key: 'lbl', name: 'Label'},
                {key: 'adr', name: 'Address'},
                {key: 'bal', name: 'Balance'},
                {key: 'btn', name: 'Modify'}
            ],
            _rows: this.createRows(keyData),
            dialogOpen: false,
            dialogCursor: 0,
            dialogText: ''

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
        mini: PropTypes.bool,
        tooltipPosition: PropTypes.oneOf(['bottom-center', 'top-center', 'bottom-right', 'top-right', 'bottom-left', 'top-left']),
        onClick: PropTypes.func
    };

    static defaultProps = {
        mini: false,
        tooltipPosition: 'top-center'
    };

    render() {
        const {mini, tooltipPosition} = this.props;
        const tooltipPos = tooltipPosition.split('-');
        const tooltip = 'Create new Bitcoin Address'
        const actions = [
            <FlatButton
                label="Save"
                primary={true}
                keyboardFocused={true}
                onClick={this.saveKey.bind(this)}
            />,
            <FlatButton
                label="Delete"
                secondary={true}
                keyboardFocused={true}
                onClick={this.disableKey.bind(this)}
            />,
            <FlatButton
                label="Okay"
                primary={true}
                keyboardFocused={true}
                onClick={this.handleClose}
            />
        ];
        return (
            <div id="key-container">
                <ReactDataGrid
                    columns={this.state._columns}
                    rowGetter={this.rowGetter}
                    rowsCount={this.state._rows.length}
                    rowHeight={48}
                    minHeight={500}/>
                <div style={keyBtnStyles} id="fab-container">
                    <FloatingActionButton id="btc-key-btn"
                                          mini={mini}
                                          onClick={this.requestBtcKey}
                                          onMouseEnter={() => this.setState({btnHovered: true})}
                                          onMouseLeave={() => this.setState({btnHovered: false})}>

                        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                            <path fill="#000000"
    d="M4.5,5H8V2H10V5H11.5V2H13.5V5C19,5 19,11 16,11.25C20,11 21,19 13.5,19V22H11.5V19H10V22H8V19H4.5L5,17H6A1,1 0 0,0 7,16V8A1,1 0 0,0 6,7H4.5V5M10,7V11C10,11 14.5,11.25 14.5,9C14.5,6.75 10,7 10,7M10,12.5V17C10,17 15.5,17 15.5,14.75C15.5,12.5 10,12.5 10,12.5Z"
                            />
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
                    <TextField
                        value={this.state.dialogText}
                        ref='keylabel'
                        className='keylabel'
                        floatingLabelText='Key Label'
                        onChange={this.dialogTextChange}
                    />
                    <br />
                    Set a date to automatically disable this key <br/>
                    <div className="datepicker">
                        <DatePicker hintText="Date Picker" />
                        <FlatButton label="Set" secondary={true} keyboardFocused={true} onClick={this.setKeyFutureDisable}/>
                    </div>
                </Dialog>

            </div>
        )
    }

    buildBtns (row) {
        return ({
            'id': row.id,
            'lbl': row.lbl,
            'adr': row.adr,
            'bal': row.bal,
            'btn':
                <div>
                    <RaisedButton label="Edit" secondary={true}
                                  id={row.id} value={row.id}
                                  onClick={this.openEditKeyDialog.bind(this, row.id)}
                    />
                    {this.state.dialogOpen && isObjectEquivalent(this.props.row, this.state.dialogCursor) ?
                        (<KeyDialog show={this.state.dialogOpen}/>)
                        : null}
                </div>
        })
    }

    buildRows(key) {
        return {
            'id': key.id,
            'lbl': key.label,
            'adr': key.address,
            'bal': key.balance,
            'btn': ''

        }
    }

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
        this.updateDialogState(id)
    }

    updateDialogState(id) {
        this.setState({dialogOpen: true, dialogCursor: id, dialogText: this.getKeyLabel(id)})
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

    rowGetter = (i) => {
        return this.state._rows[i];
    };

    keyLabelAtCursor = () => {
        const currentKey = keyData.find(key => key.id == this.state.dialogCursor)
        if (isKeyObject(currentKey)) {
            return currentKey.label
        }
        return false
    }

    getKeyLabel = (id) => {
        const key = keyData.find(key => key.id == id)
        if (isKeyObject(key)) {
            return key.label
        }
    }
    dialogTextChange = (event, value) => {
        this.setState({dialogText: value})
    }

    saveKey () {

        if (isKeyLabelChanged(this.state.dialogText, this.state.dialogCursor)) {
            this.requestBtcKeyUpdate(this.state.dialogCursor, this.state.dialogText)
        }
    }


    requestBtcKeyUpdate = async(id, label) => {
        const csrf = getCsrfToken()
        if (csrf && csrf.length > 0) {
            const keyUpdateResult = await fetchKeyUpdate(id, label, csrf)
            if (!keyUpdateResult.error) {
               this.updateKeys(id, label)
            }

        } else {
            window.location.replace('/login')
        }
    }

    updateKeys(id, label) {
        let keyChanged = false
        for (let i = 0; i < keyData.length; i++) {
            if (keyData[i].id === id) {
                keyData[i].label = label
                keyChanged = true
            }
        }

        if (keyChanged) {
            this.state._rows = this.createRows(keyData)
            this.setState({_rows: this.addBtnRows(this.state._rows)})
        }

    }

    async setKeyFutureDisable () {
        console.log(`BTC Key Future Disable requested: ${id}`)
        const csrf = getCsrfToken()
        // const keyDeleteResult = await deleteKey('temp', csrf)
    }
}

const BTCSVG = () => (
    <svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path fill="#000000"
              d="M4.5,5H8V2H10V5H11.5V2H13.5V5C19,5 19,11 16,11.25C20,11 21,19 13.5,19V22H11.5V19H10V22H8V19H4.5L5,17H6A1,1 0 0,0 7,16V8A1,1 0 0,0 6,7H4.5V5M10,7V11C10,11 14.5,11.25 14.5,9C14.5,6.75 10,7 10,7M10,12.5V17C10,17 15.5,17 15.5,14.75C15.5,12.5 10,12.5 10,12.5Z"/>
    </svg>)

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

function fetchUserUpdate(id, data, csrf) {
    return new Promise((resolve, reject) => {
        const uid = String('0000' + id).slice(-4)
        let url = `/api/user/${uid}/update`
        let headers = new Headers({'Content-Type': 'application/json', 'csrf-token': csrf})
        let options = {
            method: 'POST',
            headers: new Headers({'Content-Type': 'application/json', 'csrf-token': csrf})
        }

        if (csrf !== void 0 && data!== void 0) {
            const payload = {}
            if (data.name !== void 0)
                payload.name = data.name
            // Object.defineProperty(payload, 'name', {value: data.name, enumerable: true})
            if (data.email!== void 0)
                payload.email = data.email
                // Object.defineProperty(payload, 'email', {value: data.email, enumerable: true})

            if (Object.keys(payload).length > 0) {
                options.body = JSON.stringify(payload)
            }

            fetch(url, options).then(res =>
                res.json()
                    .catch(error => console.error('Error:', error)
                    ))
                .then(response => {
                    const handledResponse = handleResponse(response)
                    if (handledResponse) {
                        return resolve(handledResponse)
                    } else {
                        reject(handledResponse)
                    }
                })
        }
    })
}

function fetchKeyUpdate(id, label, csrf) {
    return new Promise((resolve, reject) => {
        const keyId = String('0000' + id).slice(-4)
        let url = `/api/key/${keyId}/update`
        let options = {
            method: 'POST',
            headers: new Headers({'Content-Type': 'application/json', 'csrf-token': csrf})
        }

        if (options.method === 'POST' && csrf !== void 0) {
            options.body = JSON.stringify({id: id, label: label})
        }

        fetch(url, options).then(res =>
            res.json()
                .catch(error =>
                    console.error('Error:', error)
                ))
            .then(response => {
                const handledResponse = handleResponse(response)
                if (handledResponse) {
                    return resolve(handledResponse)
                } else {
                    reject(handledResponse)
                }
            })
    })
}

function getCsrfToken() {
    return getToken('csrf')
}

function getTrxCookie() {
    return getToken('trx_cookie')
}

function getToken(name) {
    const cookie = document.cookie.split(';').filter(cookie => cookie.trim().substr(0, name.length) === name)
    if (cookie && cookie.length > 0) {
        return cookie[0].trim().substr(5)
    }
}

function handleResponse(response) {
    if (Array.isArray(response) && response.length === 1) {
        response = response[0]
    } else {
        console.error(response)
    }
    if ('error' in response) {
        switch (response.code) {
            case 400:
                console.log(response.error)
                break
            case 401:
                window.location.href = '/login'
                break
            case 403:
                console.log(response.error)
                break
            case 404:
                console.log(response.error)
                break
            case 406:
                console.log(response.error)
                console.log('You must must set acceptable return type in header')
                break
        }
        console.log(response)

    }
    return response
}


// class KeyDialog extends React.Component {
//     constructor(props, context) {
//         super(props, context)
//         this.props = {
//             keyId: 0,
//             show: false
//         }
//         this.state = {open: true}
//     }
//
//     state = {}
//
//     handleOpen = () => {
//         this.setState({open: true});
//     };
//
//     handleClose = () => {
//         this.setState({open: false});
//     };
//
//     requestBtcKeyDelete = async(id) => {
//         console.log(`BTC Key deletion requested: ${id}`)
//         const csrf = getCsrfToken()
//         //   const keyDeleteResult = await deleteKey('temp', csrf)
//     }
//
//     disableKey() {
//         this.requestBtcKeyDelete(this.props.keyId).then(
//             alert('Eat some clams')
//         )
//     }
//
//     saveKey() {
//         console.log(this)
//     }
//
//     render() {
//         const actions = [
//             <FlatButton
//                 label="Save"
//                 primary={true}
//                 keyboardFocused={true}
//                 onClick={this.saveKey.bind(this)}
//             />,
//             <FlatButton
//                 label="Delete"
//                 secondary={true}
//                 keyboardFocused={true}
//                 onClick={this.disableKey(this.props.keyId)}
//             />,
//             <FlatButton
//                 label="Cancel"
//                 primary={true}
//                 keyboardFocused={true}
//                 onClick={this.handleClose()}
//             />,
//         ];
//
//         return (
//             <div>
//                 <Dialog
//                     title="Dialog With Date Picker"
//                     actions={actions}
//                     modal={false}
//                     open={this.props.show}
//                     onRequestClose={this.handleClose}
//                 >
//                     <div className="datepicker">
//                         <DatePicker hintText="Date Picker" />
//                         <FlatButton label="Set" secondary={true} keyboardFocused={true} onClick=""/>
//                     </div>
//                 </Dialog>
//             </div>
//         );
//     }
// }

const legitArray = (arg) => typeof arg !== 'undefined' && Array.isArray(arg) && arg.length > 0
const isKeyObject = (key) => typeof key !== 'undefined' && 'id' in key

const isObjectEquivalent = (a, b) => {
    if (a !== null && typeof a !== 'undefined') {
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
}

const isKeyLabelChanged = (label, cursor) => {
    return label !== keyData.find(key => key.id == cursor).label
}