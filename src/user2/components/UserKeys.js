import { Component} from 'react'
import PropTypes from 'prop-types'
import { MuiPickersUtilsProvider, DatePicker } from 'material-ui-pickers'
import ReactDataGrid from 'react-data-grid'
import DateFnsUtils from '@date-io/date-fns'
import { Button, Dialog, Fab, Paper, TextField, Typography, Tooltip } from '@material-ui/core'
import SaveIcon from '@material-ui/icons/Save'
import CancelIcon from '@material-ui/icons/Cancel'
import EditIcon from '@material-ui/icons/Edit'
import CloseIcon from '@material-ui/icons/Close'
import DeleteIcon from '@material-ui/icons/Delete'

import { fetchKeyRequest, updateKeyRequest } from '../requests/'

const keyBtnStyles = {
    float: 'right',
    right: '3em',
    bottom: '4em',
    left: 'auto',
    position: 'fixed',
    zIndex: '5555',
}

const btcSvgPath = () => {return "M4.5,5H8V2H10V5H11.5V2H13.5V5C19,5 19,11 16,11.25C20,11 21,19 13.5,19V22H11.5V19H10V22H8V19H4.5L5,17H6A1,1 0 0,0 7,16V8A1,1 0 0,0 6,7H4.5V5M10,7V11C10,11 14.5,11.25 14.5,9C14.5,6.75 10,7 10,7M10,12.5V17C10,17 15.5,17 15.5,14.75C15.5,12.5 10,12.5 10,12.5Z"}

export class KeyDialog extends React.Component {
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

    requestBtcKeyDelete = async(id) => {
        console.log(`BTC Key deletion requested: ${id}`)
        const csrf = getCsrfToken()
        //   const keyDeleteResult = await deleteKey('temp', csrf)
    }

    handleDate = e => {
        const value = e.target.value
        console.log(value)
    }



    disableKey() {
        this.requestBtcKeyDelete(this.props.keyId).then(
            alert('Eat some clams')
        )
    }

    saveKey() {
        console.log(this)
    }

    render() {
        // const actions = [

        // ];

        return (
            <div>
                <Dialog
                    title="Dialog With Date Picker"
                    // actions={actions}
                    modal={false}
                    maxWidth='lg'
                    fullWidth={true}
                    open={this.props.show}
                    onRequestClose={this.handleClose}>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <DatePicker
                            onChange={this.handleDate}
                            margin="normal"
                            label='Expiry Date'/>
                    </MuiPickersUtilsProvider>
                    <Button
                        label="Save"
                        primary={true}
                        keyboardFocused={true}
                        onClick={this.saveKey}>Save</Button>
                    <Button
                        label="Delete"
                        secondary={true}
                        keyboardFocused={true}
                        onClick={this.disableKey}>Delete</Button>
                    <Button
                        label="Cancel"
                        primary={true}
                        keyboardFocused={true}
                        onClick={this.handleClose}>Cancel</Button>
                    <Button onClick={this.closeDialog} label="Close">Close</Button>
                </Dialog>
            </div>
        );
}
}

export class UserKeys extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            btnHovered: false,
            _columns: [
                {key: 'id', name: 'ID', resizable: true, width: 80, filterable: true, dragable: true},
                {key: 'lbl', name: 'Name', resizable: true, filterable: true, dragable: true},
                {key: 'adr', name: 'Address', resizable: true, filterable: true, dragable: true},
                {key: 'bal', name: 'Balance', resizable: true, filterable: true, dragable: true},
                {key: 'btn', name: 'Edit', resizable: true, width: 100, filterable: true, dragable: true}
            ],
            _rows: this.createRows(props.keys),
            dialogOpen: false,
            dialogCursor: 0,
            dialogText: '',
            keys: props.keys || []

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
        onClick: PropTypes.func
    }

    render() {
        return (
            <div id="key-container" className='key-grid'>
            <Tooltip
            title='Your bitcoin keys'>
                <ReactDataGrid
                    columns={this.state._columns}
                    rowGetter={this.rowGetter}
                    rowsCount={this.state._rows.length}
                    rowHeight={48}
                    minHeight={500}
                    enableAutoFocus={false}
                    enableDragAndDrop={true}
                    minColumnWidth={40}

                    />
            </Tooltip>
                <div id="fab-container">
                <Tooltip
                title='Create a new Bitcoin Address'>
                    <Fab style={keyBtnStyles} onClick={this.requestBtcKey}>
                        <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24">
                                <path fill="#000000" d={btcSvgPath()} />
                        </svg>
                    </Fab>
                </Tooltip>
                </div>
                <Dialog
                    title="Key Editor"
                    className='keydialog'
                    modal={false}
                    open={this.state.dialogOpen}
                    onRequestClose={this.handleClose}>
                    <Paper className='key-dialog-paper'>
                    <div style={{maxWidth: '1000px'}}>
                        <Typography>
                            Edit your key
                        </Typography>
                        <TextField
                            value={this.state.dialogText}
                            className='keylabel'
                            label='Key Name'
                            onChange={this.dialogTextChange}

                        />
                    </div>

                    <Typography>
                        Set a date to automatically disable this key
                    </Typography>

                    <div style={{display: 'flex', flexDirection: 'row', alignContent: 'center', justifyContent: 'center'}}>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <div style={{display: 'flex'}}>
                            <Tooltip
                            title='Set to schedule this key for expiration on the date chosen'>
                            <DatePicker
                                margin="normal"
                                label='Expiry Date'
                                onChange={this.handleDate}>
                                Expiry Date
                            </DatePicker>
                            </Tooltip>
                        </div>
                    </MuiPickersUtilsProvider>
                    </div>
                    <div className='btn-container'>
                        <Button
                            label="Save"
                            color="primary"
                            variant='contained'
                            className='keybtn'
                            keyboardFocused={true}
                            onClick={this.saveKey}><SaveIcon/>Save</Button>
                        <Button
                            label="Delete"
                            color="secondary"
                            variant='contained'
                            className='keybtn'
                            keyboardFocused={true}
                            onClick={this.requestBtcKeyDelete}><DeleteIcon/>Delete</Button>
                        <Button
                            label="Cancel"
                            variant='contained'
                            className='keybtn'
                            keyboardFocused={true}
                            onClick={this.handleClose}><CancelIcon/>Cancel</Button>
                        </div>
                        </Paper>
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
                    <Button label="Edit"
                                  className='key-edit' value={row.id}
                                  onClick={this.openEditKeyDialog.bind(this, row.id)}
                    ><EditIcon fontSize='small' /></Button>
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
            'bal': key.balance + ' Satoshis (' + key.balance / 100000000 + ' ₿)',
            'btn': ''

        }
    }

    handleDate = e => {
        const value = e.target.value
        console.log(value)
    }

    requestBtcKey = async() => {
        console.log('New BTC Key requested')
        const cookies = (document.cookie.split(';'))
        const cookie = cookies.filter(cookie => cookie.trim().substr(0, 4) === 'csrf')
        if (cookie && cookie.length > 0) {
            const csrf = cookie[0].trim().substr(5)
            const response = await fetchKeyRequest({csrf})
            if (!response.error) {
                const key = {
                    address: response.body.key.address,
                    ...response.body.key.meta
                    }
                const keys = [... this.state.keys, key ]
                this.setState({
                    _rows: this.addBtnRows(
                        this.createRows(keys)
                    ),
                    keys
                })
            } else {
                this.props.log('Could not create new key')
            }
        }
    }

    requestBtcKeyDelete = async e => {
        console.log(`BTC Key deletion requested: ${e.target.value}`)
    }

    disableKey() {
        this.requestBtcKeyDelete(this.state.dialogCursor).then(
            alert('Eat some clams')
        )
    }

    openEditKeyDialog = id => {
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
        const currentKey = this.state.keys.find(key => key.id == this.state.dialogCursor)
        if (isKeyObject(currentKey)) {
            return currentKey.label
        }
        return false
    }

    getKeyLabel = (id) => {
        const key = this.state.keys.find(key => key.id == id)
        if (isKeyObject(key)) {
            return key.label
        }
    }
    dialogTextChange = e => {
        this.setState({dialogText: e.target.value})
    }

    saveKey = async e => {
        const result = this.setKeyFutureDisable()
        const key = this.state.keys.find(key => key.id === this.state.dialogCursor)
        if (key && key.label !== this.state.dialogText ) {
            await this.requestBtcKeyUpdate(this.state.dialogCursor, this.state.dialogText)
        }
    }


    requestBtcKeyUpdate = async(id, label) => {
        const csrf = getCsrfToken()
        if (csrf && csrf.length > 0) {
            const result = await updateKeyRequest({id, label}, {csrf})
            if (!result.error) {
               this.updateKeys(id, label)
            } else {
                this.props.log('Unable to update key')

            }

        } else {
            window.location.replace('/login')
        }
    }

    updateKeys(id, label) {
        let keyChanged = false

        for (let i = 0; i < this.state.keys.length; i++) {
            if (this.state.keys[i].id === id) {
                this.state.keys[i].label = label
                keyChanged = true
            }
        }

        if (keyChanged) {
            this.state._rows = this.createRows(this.state.keys)
            this.setState({_rows: this.addBtnRows(this.state._rows)})
        }

    }

    async setKeyFutureDisable () {

    }
}

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

const isKeyObject = (key) => typeof key !== 'undefined' && 'id' in key

function getCsrfToken () {
    return document.cookie.split(';').find(cookie => cookie.trim().substr(0, 4) === 'csrf').trim().substr(5)
}
