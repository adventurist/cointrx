import { Component} from 'react'
import PropTypes from 'prop-types'
import { MuiPickersUtilsProvider, DatePicker } from 'material-ui-pickers'
import ReactDataGrid from 'react-data-grid'
import DateFnsUtils from '@date-io/date-fns'
import { Button, Dialog, Fab, TextField, Tooltip } from '@material-ui/core'
import EditIcon from '@material-ui/icons/Edit'
const keyBtnStyles = {
    float: 'right',
    right: '3em',
    bottom: '4em',
    left: 'auto',
    position: 'fixed',
    zIndex: '5555'
}

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
        //     <Button
        //         label="Save"
        //         primary={true}
        //         keyboardFocused={true}
        //         onClick={this.saveKey.bind(this)}
        //     />,
        //     <Button
        //         label="Delete"
        //         secondary={true}
        //         keyboardFocused={true}
        //         onClick={this.disableKey(this.props.keyId)}
        //     />,
        //     <Button
        //         label="Cancel"
        //         primary={true}
        //         keyboardFocused={true}
        //         onClick={this.handleClose()}
        //     />,
        // ];

        return (
            <div>
                <Dialog
                    title="Dialog With Date Picker"
                    // actions={actions}
                    modal={false}
                    open={this.props.show}
                    onRequestClose={this.handleClose}
                >
                    <div className="datepicker">
                    <DatePicker
                            margin="normal"
                            label='Expiry Date'
                    />
                        <Button label="Set" />
                    </div>
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
                {key: 'id', name: 'ID'},
                {key: 'lbl', name: 'Label'},
                {key: 'adr', name: 'Address'},
                {key: 'bal', name: 'Balance'},
                {key: 'btn', name: 'Modify'}
            ],
            _rows: this.createRows(props.keys),
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
        // const actions = [
        //     <Button
        //         label="Save"
        //         primary={true}
        //         keyboardFocused={true}
        //         onClick={this.saveKey.bind(this)}
        //     />,
        //     <Button
        //         label="Delete"
        //         secondary={true}
        //         keyboardFocused={true}
        //         onClick={this.disableKey.bind(this)}
        //     />,
        //     <Button
        //         label="Okay"
        //         primary={true}
        //         keyboardFocused={true}
        //         onClick={this.handleClose}
        //     />
        // ];
        return (
            <div id="key-container" className='key-grid'>
            <Tooltip
                title='Dicks'>
                <ReactDataGrid
                    columns={this.state._columns}
                    rowGetter={this.rowGetter}
                    rowsCount={this.state._rows.length}
                    rowHeight={48}
                    minHeight={500}
                    enableCellSelect={false}
                    />
            </Tooltip>
                <div style={keyBtnStyles} id="fab-container">
                <Fab title='Create Key'
                onClick={this.requestBtcKey}
                >Create Key</Fab>
                </div>
                <Dialog
                    title="Key Editor"
                    // actions={actions}
                    modal={false}
                    open={this.state.dialogOpen}
                    onRequestClose={this.handleClose}
                >
                    <TextField
                        value={this.state.dialogText}
                        className='keylabel'
                        label='Key Label'
                        onChange={this.dialogTextChange}
                    />
                    <br />
                    Set a date to automatically disable this key <br/>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <DatePicker
                            margin="normal"
                            label='Expiry Date'
                            // className={this.state.offerDate ? classes.filledDatePicker : classes.datePicker}
                            // value={this.state.offerDate}
                            // onChange={this.handleDateChange
                        />
                        <Button label="Set" secondary={true} keyboardFocused={true} onClick={this.setKeyFutureDisable}/>
                    </MuiPickersUtilsProvider>
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
                    ><EditIcon /> Edit </Button>
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
        const currentKey = this.props.keys.find(key => key.id == this.state.dialogCursor)
        if (isKeyObject(currentKey)) {
            return currentKey.label
        }
        return false
    }

    getKeyLabel = (id) => {
        const key = this.props.keys.find(key => key.id == id)
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
        for (let i = 0; i < this.props.keys.length; i++) {
            if (this.props.keys[i].id === id) {
                this.props.keys[i].label = label
                keyChanged = true
            }
        }

        if (keyChanged) {
            this.state._rows = this.createRows(this.props.keys)
            this.setState({_rows: this.addBtnRows(this.state._rows)})
        }

    }

    async setKeyFutureDisable () {
        console.log(`BTC Key Future Disable requested: ${id}`)
        const csrf = getCsrfToken()
        // const keyDeleteResult = await deleteKey('temp', csrf)
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
