import { Component} from 'react'

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
