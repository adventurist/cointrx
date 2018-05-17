import * as React from 'react'
import { render }from 'react-dom'
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import { TrxNav } from '../TrxAppBar.jsx'
import { Layout, Panel } from 'react-toolbox'
import {Card, CardActions, CardTitle, CardText} from 'material-ui/Card'
import TextField from 'material-ui/TextField'
import {orange500, red500} from 'material-ui/styles/colors'
import NumericInput from 'react-numeric-input'
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'
import Avatar from 'material-ui/Avatar'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import TrendingUp from 'material-ui/svg-icons/action/trending-up'
import CompareArrows from 'material-ui/svg-icons/action/compare-arrows'
import AutoRenew from 'material-ui/svg-icons/action/autorenew'
import PowerSettingsNew from 'material-ui/svg-icons/action/power-settings-new'
import CallEnd from 'material-ui/svg-icons/communication/call-end'
import PlayCircle from 'material-ui/svg-icons/av/play-circle-filled'
import Sync from 'material-ui/svg-icons/notification/sync'
import FlatButton from 'material-ui/FlatButton/FlatButton'
import RaisedButton from 'material-ui/RaisedButton/RaisedButton'
import Chip from 'material-ui/Chip'
import DoneIcon from 'material-ui/svg-icons/action/done'
import { request, handleResponse, requestWs, isJson, SOCKET_OPEN } from '../utils/'
import log from 'loglevel'
// import trx from '../redux'

// const trxInstance = trx()

const urls = JSON.parse(botUrls.replace(/'/g, '"'))

const styles = {
    chip: {
        float: 'right',
        marginRight: '1em',
        transform: 'translateY(-2.5em)',
        justifyContent: 'center',
        flexWrap: 'wrap',
        width: '4%',
        height: '13px'
    },
    console: {
        position: 'static',
        width: '100%',
        minHeight: '20em'
    },
    layout: {
        padding: 4,
        backgroundColor: 'red'
    },
    numberControl: {
      display: 'block',
      maxWidth: '2em',
      padding: 4
    },
    numberButton: {
        width: '100%',
        padding: 4,
    },
    numberValue: {
        color: orange500
    },
    mainLayout: {
        padding: 0,
        margin: 0,
        listStyle: 'none',
        justifyContent: 'space-around',
        display: 'inline-block'
    },
    trxPanel: {
        width: '50%',
        position: 'static',
        display: 'inline-block',
        height: '10em',
        float: 'left'
    },
    block: {
        maxWidth: 250,
    },
    radioButton: {
        marginBottom: 16,
    },
    botSelect: {
        width: '2em'
    }
}

const botConnections = []

const container = {}

const buildBotMenuItems = (length) => {
    const items = [];
    items.push(<MenuItem value={undefined} key={undefined} primaryText={`Select bot`} />)
    for (let i = 0; i < length; i++ ) {
        items.push(<MenuItem value={i} key={i} primaryText={`Bot ${i + 1}`} />)
    }
    items.push(<MenuItem value={-1} key={-1} primaryText={`All`} />)
    return items
}

const buildFileMenuItems = (files) => {
    const items = []
    items.push(<MenuItem value={undefined} key={undefined} primaryText={`Select file`} />)
    for ( let i = 0; i < files.length; i++) {
        items.push(<MenuItem value={i} key={i} primaryText={`File ${i + 1}`}>{files[i].url}</MenuItem>)
    }
    return items
}

export class TrxLayout extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: false,
            botNum: 1,
            files: [],
            selectedBot: undefined,
            botMenuItems: buildBotMenuItems(0),
            fileMenuItems: buildFileMenuItems(0),
            consoleText: '',
            market: undefined,
            timePeriod: '60',
            selectedFile: undefined,
            dataReady: false
        }
    }

    state = {
        drawerActive: false,
        drawerPinned: false,
        sidebarPinned: false
    };

    async componentDidMount() {
        let botMenuItems = buildBotMenuItems(0)
        let fileMenuItems = buildFileMenuItems(0)
        this.setState({botMenuItems: botMenuItems, fileMenuItems: fileMenuItems})
        await this.init()
    }

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

    consoleOut (incomingText) {
        const time = Date.now().toString().slice(0, -3)

        const textArr = this.state.consoleText.split('\n')
        if (textArr.length > 11) {
            textArr.splice(0, 1)
        }
        this.setState({consoleText: `${textArr.join('\n')}\n${time} - ${incomingText}`})
    }

    botNumberChange = (event, value) => {
        // TODO this can't be right
        this.setState({botNum: value})
        this.consoleOut(`Number of bots to be built: ${value}`)
    }

    onBotsCreate = (num) => {
        const newItems = buildBotMenuItems(num)
        this.setState({botMenuItems: newItems})
        this.consoleOut(`${num} bots currently connected`)
    }


    handleConsoleChange = (event, index, value) => {
        this.setState({consoleText: value})
    }

    init = async () => {
        container.conn = await requestWs({
            url: urls.wsStart,
            params: {
                data: JSON.stringify({timestamp: Date.now()})
            },
            timeout: 0
        }, this.msgHandler)
        if (container.conn) {
            container.conn.onopen = async () => {
                log.info('Primary channel open')
                log.info('Fetching bots')
                const response = await this.sendWsRequest('fetchBots')
                if (response) {
                    container.bots = botConnections
                    this.onBotsCreate(container.bots.length)
                }
            }
        }
        window.trx = container
    }

    sendWsRequest = async (request) => {
        switch (request) {
            case 'fetchBots':
                if (container && 'conn' in container && container.conn) {
                    try {
                        await this.fetchAvailableBots(container.conn)
                        return true
                    } catch (err) {
                        log.error(err)
                        return false
                    }
                }
        }
    }

    /**
     * @param {WebSocket} conn
     * @returns {Promise.<void>}
     */
    fetchAvailableBots = async (conn) => {
        conn.send(JSON.stringify({type: 'bots:all', data: 'init'}))
    }

    startBots = async () => {
        const data = await request({
            url: urls.start,
            method: 'GET',
            params: {number: this.state.botNum},
            credentials: 'include'
        })

        const response = handleResponse(data)
        if (!response.error) {
            this.consoleOut(`${this.state.botNum} bots created`)
        }
        log.info(response)
        if ('body' in response && 'data' in response.body) {
            let previousBotNumber = botConnections.length
            if (Array.isArray(data.body.data)) {
                data.body.data.map(bot => {
                    log.info(bot.message)
                    const ws = requestWsForBot(this.msgHandler)
                    if (ws) {
                        botConnections.push({id: bot.id, ws: ws, number: bot.number, dataReady: false})
                    }
                })
                let currentBotNumber = botConnections.length
                let numDiff = currentBotNumber - previousBotNumber
                let createResult = Math.abs(numDiff) === data.body.data.length

                if (!createResult) {
                    log.info('Problem creating the requested number of bots')
                }
                this.onBotsCreate(currentBotNumber)
            }

        }
    }

    loadMarketData = async (event, index, value) => {
        const selectedBot = botConnections[this.state.selectedBot]
        log.info(event)
        const data = await request({
            url: urls.trc.prices,
            headers: {'Content-Type': 'application/json'},
            params: {bot_id: selectedBot.id, time: this.state.timePeriod},
            credentials: 'include'
        })

        const response = handleResponse(data)
        log.info(response)
        if (!response.error) {
            const bot = botConnections[this.state.selectedBot]
            botConnections[this.state.selectedBot].dataReady = true
            this.setState({dataReady: true})
            this.consoleOut(`${selectedBot} has loaded market data`)
        }
    }

    analyzeMarketData = async (value) => {
        const selectedBot = botConnections[this.state.selectedBot]

        const data = {
            url: urls.trc.analyze,
            data: {
                bot_id: selectedBot.id, time: this.state.timePeriod
            },
            type: 'request'
        }

        if (!'ws' in selectedBot) {
            selectedBot.ws = requestWsForBot(this.msgHandler)
            selectedBot.ws.onopen(selectedBot.ws.send(JSON.stringify(data)))
        } else {
            selectedBot.ws.send(JSON.stringify(data))
        }

        this.consoleOut(`Bot ${selectedBot.number} (${selectedBot.id}) has analyzed market data`)
    }

    /**
     *
     * @param message
     */
    msgHandler = ({...message}) => {
        if ('type' in message) {
            log.info(`WS Data Event Type`, message.type)
        }
        if ('action' in message) {
            const action = message.action
            switch (action) {
                case 'updatebots':
                    const bots = message.payload
                    if (Array.isArray(bots) && bots.length > 0) {
                        bots.map( bot => botConnections.push({id: bot.id, ws: requestWsForBot(this.msgHandler), number: bot.number, dataReady: false}) )
                        this.onBotsCreate(botConnections.length)
                        log.info('Bot connections updated')
                    }
                    log.info('No bots available')
                    break
                case 'addfile':
                    const data = message.payload
                    if ('filename' in data) {
                        this.updateFileList(data.filename)
                        log.info('Updating file list')
                        delete data.filename
                    }
                    break
            }
        }
        if ('error' in message) {
            const error = message.error
            log.info(error)
        }
        log.info(`Remaining data to be handled`, message)
    }

    updateFileList (filename) {
        const file = {
            url: `/static/analysis/${filename}`,
            filename: filename
        }
        this.state.files.push(file)
        const fileMenuItems = buildFileMenuItems(this.state.files)
        this.setState({fileMenuItems: fileMenuItems})
        if (this.state.selectedFile) {
            this.setState({selectedFile: 0})
        }
    }

    handleFileSelect = (event, index, value) => {
        if (value) {
            const file = this.state.files[value]
            log.info('File Selection:', file)
            this.setState({selectedFile: value})
            this.consoleOut(`Opening ${file.filename}`)
            window.open(`${window.location.origin + file.url}`, '_blank')
        }
    }

    render() {
        return (
<div id="main-wrap">
<TrxNav id="trx-nav" />
    <Layout id="main-layout" style={styles.mainLayout}>
        <Panel id="console" className="console" style={styles.console}>
            <TextField
                multiLine={true}
                rows={12}
                rowsMax={12}
                hintText='Console'
                value={this.state.consoleText}
                onChange={this.handleConsoleChange}
            />
        </Panel>
        <Panel id="bot-panel" className="trx-panel" style={styles.trxPanel}>
            <Card>
                <CardTitle title="Bot Setup" />
                <CardText>
                    Configure and create bots
                </CardText>
                <div id="number-container">
                    <CardActions className="number-control"  style={styles.numberControl}>
                        <NumericInput min={0} max={100} value={this.state.botNum} onChange={this.botNumberChange} />
                    </CardActions>
                </div>
                <div id="market-select">
                    <RadioButtonGroup name="market-select" defaultSelected="trx" onChange={this.handleMarketSelect}>
                        <RadioButton
                            value="TRX"
                            label="TRX"
                            checkedIcon={<TrendingUp style={{color: '#F44336'}} />}
                            uncheckedIcon={<TrendingUp style={{color: '#777777'}}/>}
                            style={styles.radioButton}
                        />
                        <RadioButton
                            value="TRC"
                            label="TRC"
                            checkedIcon={<TrendingUp style={{color: '#F44336'}} />}
                            uncheckedIcon={<TrendingUp style={{color: '#777777'}}/>}
                            style={styles.radioButton}
                        />
                        <RadioButton
                            value="Exchange"
                            label="Exchange TRX/TRC"
                            checkedIcon={<CompareArrows style={{color: '#F44336'}} />}
                            uncheckedIcon={<CompareArrows style={{color: '#777777'}}/>}
                            style={styles.radioButton}
                        />
                    </RadioButtonGroup>
                </div>
                <div id="start-button">
                    <FlatButton
                        label="Start Bots"
                        labelPosition="before"
                        onClick={this.startBots}
                        primary={false}
                        icon={<PowerSettingsNew/>}
                    />
                </div>
            </Card>
        </Panel>
        <Panel id="analysis-panel" className="trx-panel" style={styles.trxPanel}>
            <Card>
                <CardTitle title="Analysis" />
                <CardText>
                    Examine and trade
                </CardText>
                <DropDownMenu id="bot-select" style={styles.botSelect} maxHeight={300} value={this.state.selectedBot} onChange={this.handleBotSelect}>
                    {this.state.botMenuItems}
                </DropDownMenu>
                <FlatButton
                    label="Load Data"
                    labelPosition="before"
                    onClick={this.loadMarketData}
                    primary={false}
                    icon={<AutoRenew />}
                />
                <RaisedButton
                    label="Analyze"
                    labelPosition="before"
                    onClick={this.analyzeMarketData}
                    primary={false}
                    icon={<PlayCircle />}
                />
                <div id="visualizations" style={{padding: '16px'}}><h3>Visualizations</h3>
                <DropDownMenu id="file-select" style={styles.botSelect} maxHeight={300} value={this.state.selectedFile} onChange={this.handleFileSelect}>
                    {this.state.fileMenuItems}
                </DropDownMenu>
                </div>
            </Card>
            <Card>
                <CardTitle title="Bot Detail" subtitle={botConnections[this.state.selectedBot] !== void 0 && 'id' in botConnections[this.state.selectedBot] ?
                    botConnections[this.state.selectedBot].id : 'None selected'}/>
                <CardText>
                    Bot Controls
                </CardText>
                <Chip
                    id="data-ready"
                    class={this.state.dataReady ? "data-ready-show" : "data-ready-hidden"}
                    backgroundColor={red500}
                    style={styles.chip}
                    deleteIconStyle={{ width: 5, height: 5, fontSize: 5 }}>
                    <Avatar size={2} color={red500} backgroundColor={red500} style={{fontSize: '12px', fontWeight: 700}}>
                        Data ready
                    </Avatar>
                </Chip>
                <FlatButton
                    label="Close"
                    labelPosition="before"
                    onClick={this.closeBotConnection}
                    primary={false}
                    icon={<CallEnd />} />
                <FlatButton
                    label="Reconnect"
                    labelPosition="before"
                    onClick={this.reconnectBot}
                    primary={false}
                    icon={<Sync />} />
                <RaisedButton
                    label="Trade"
                    labelPosition="before"
                    onClick={this.performTrade}
                    primary={false}
                    checkedIcon={<TrendingUp style={{color: '#F44336'}} />}
                />
            </Card>
        </Panel>
    </Layout>
</div>
        )
    }

    handleBotSelect = (event, index, value) => {
        const dataReady = value !== -1 ? botConnections[value].dataReady : allDataReady()
        this.setState({selectedBot: value})
        this.setState({dataReady: dataReady})
        this.consoleOut(`Bot ${value + 1} selected`)
    }

    handleMarketSelect = (event, value) => {
        this.setState({market: value})
        this.consoleOut(`Market set to ${value}`)
    }

    updateState = (key, value) => {
        this.setState({
            key: value
        })
    }
}

render(
    <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
        <TrxLayout id="container">
            <h1> TEST THIS BITCH </h1>
        </TrxLayout>

    </MuiThemeProvider>
    , document.getElementById('root')
)

export function requestWsForBot (handler, data = 'test') {
    return requestWs({
        url: urls.wsStart,
        params: {data: data},
        timeout: 0
    }, handler)
}

function allDataReady() {
    return botConnections.filter(bot => bot.dataReady).length === botConnections.length
}