/* React */
import * as React from 'react'
import { render }from 'react-dom'

/**
* Material Libraries
*
* Theme and Layout
*/
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import { Layout, Panel } from 'react-toolbox'
import { TrxNav } from '../TrxAppBar.jsx'

/* Colour and Icon */
import TrendingUp from 'material-ui/svg-icons/action/trending-up'
import AccountBalance from 'material-ui/svg-icons/action/account-balance'
import CompareArrows from 'material-ui/svg-icons/action/compare-arrows'
import AutoRenew from 'material-ui/svg-icons/action/autorenew'
import PowerSettingsNew from 'material-ui/svg-icons/action/power-settings-new'
import CallEnd from 'material-ui/svg-icons/communication/call-end'
import PlayCircle from 'material-ui/svg-icons/av/play-circle-filled'
import Sync from 'material-ui/svg-icons/notification/sync'
import BotsOff from 'material-ui/svg-icons/file/cloud-off'
import Patterns from 'material-ui/svg-icons/image/blur-linear'
import { orange500, red500 } from 'material-ui/styles/colors'

/* Menu */
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'

/* Inputs */
import TextField from 'material-ui/TextField'
import NumericInput from 'react-numeric-input'

/* Buttons, Avatars */
import { Card, CardActions, CardTitle, CardText } from 'material-ui/Card'
import Avatar from 'material-ui/Avatar'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import FlatButton from 'material-ui/FlatButton/FlatButton'
import RaisedButton from 'material-ui/RaisedButton/RaisedButton'
import Chip from 'material-ui/Chip'


/* utils */
import { request, handleResponse, requestWs, isJson, SOCKET_OPEN } from '../utils/'
import Bot from '../utils/bot'
import log from 'loglevel'

// import trx from '../redux'

// const trxState = trx()
// console.log(trxState)
// The urls provided by the back end
const urls = JSON.parse(botUrls.replace(/'/g, '"'))

// All stylesheet values
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
// The container to be attached to the window
const container = {}
// The sub-container for the bots
const botConnections = []
/**
 * Helper method for building the Bot Menu
 *
 * @param {Number} length
 */
const buildBotMenuItems = (length) => {
    const items = [];
    items.push(<MenuItem value={undefined} key={undefined} primaryText={`Select bot`} />)
    for (let i = 0; i < length; i++ ) {
        items.push(<MenuItem value={i} key={i} primaryText={`Bot ${i + 1}`} />)
    }
    items.push(<MenuItem value={-1} key={-1} primaryText={`All`} />)
    return items
}


/**
 * Helper method for building the File Menu
 * @param {Array} files
 */
const buildFileMenuItems = (files) => {
    const items = []
    items.push(<MenuItem value={undefined} key={undefined} primaryText={`Select file`} />)
    for ( let i = 0; i < files.length; i++) {
        items.push(<MenuItem value={i} key={i} primaryText={`File ${i + 1}`}>{files[i].url}</MenuItem>)
    }
    return items
}

export class BotButtons extends React.Component {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    render () {
        return (
            <div id="start-button">
                <FlatButton
                    label="Start Bots"
                    labelPosition="before"
                    onClick={this.props.start}
                    primary={false}
                    icon={<PowerSettingsNew/>}
                />
                <FlatButton
                    label="Kill Bots"
                    labelPosition="before"
                    onClick={this.props.kill}
                    primary={false}
                    icon={<BotsOff />}
                />
            </div>
        )
    }
}

export class TrxLayout extends React.Component {

    /**
     * @constructor
     * @param {*} props
     */
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

    /**
     * Exposed method for printing to the console visible to the
     * user in their GUI
     *
     * @param {String} incomingText
     */
    consoleOut (incomingText) {
        const time = Date.now().toString().slice(0, -3)

        const textArr = this.state.consoleText.split('\n')
        if (textArr.length > 11) {
            textArr.splice(0, 1)
        }
        this.setState({consoleText: `${textArr.join('\n')}\n${time} - ${incomingText}`})
    }

    /**
     * @STATE
     * @param {Object} event triggering the selection
     * @param {Number} value The number of bots chosen with the select list
     */
    botNumberChange = (event, value) => {
        // TODO this can't be right
        this.setState({botNum: value})
        this.consoleOut(`Number of bots to be built: ${value}`)
    }

    /**
     * Helper function to have the GUI build items to represent
     * the number of bots provided
     * @STATE
     *
     * @param {Number} num The number of bots to be represented in the menu
     */
    onBotsCreate = (num) => {
        const newItems = buildBotMenuItems(num)
        this.setState({botMenuItems: newItems})
        this.consoleOut(`${num} bots currently connected`)
    }

    /**
     * Helper function to make printing to the console possible
     */
    handleConsoleChange = (event, index, value) => {
        this.setState({consoleText: value})
    }

    /**
     * Initializing function which should be excuted after
     * component has mounted
     */
    init = async () => {
        container.ws = await requestWs({
            url: urls.wsStart,
            params: {
                data: JSON.stringify({timestamp: Date.now()})
            },
            timeout: 0
        }, this.msgHandler)
        if (container.ws) {
            container.ws.onopen = async () => {
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

    /**
     * @param {String} event triggering the selection
     */
    sendWsRequest = async (request) => {
        switch (request) {
            case 'fetchBots':
                if (container && 'ws' in container && container.ws) {
                    try {
                        await this.fetchAvailableBots(container.ws)
                        return true
                    } catch (err) {
                        log.error(err)
                        return false
                    }
                }
        }
    }

    /**
     * @WSREQUEST
     * Helper function for the internal bot API
     * Service will return ID and status of bots currently in the pool
     *
     * @param {WebSocket} conn
     * @returns {Promise.<void>}
     */
    fetchAvailableBots = async (conn) => {
        conn.send(JSON.stringify({type: 'bots:all', data: 'init'}))
    }

    /**
     * @to-be-deprecated
     *
     * Request and reserve bots
     * Implementation to request instantiation a quantity of bots equal to
     * the value set by the user. Each bot will have a WS channel opened to maintain
     * a message stream via PING/PONG
     *
     * Currently a POST request, but can be re-written as a request for the WS Channel
     */
    startBots = async () => {
        // Fetch from the server
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
                    // Open a message stream for each bot
                    const ws = requestWsForBot(this.msgHandler)
                    if (ws) {
                        const analysisBot = new Bot(ws, [])
                        // Place in the container where they will await instruction
                        botConnections.push({id: bot.id, ws: ws, analysisBot: analysisBot, number: bot.number, dataReady: false, users: []})
                    }
                })
                let currentBotNumber = botConnections.length
                let numDiff = currentBotNumber - previousBotNumber
                let createResult = Math.abs(numDiff) === data.body.data.length

                if (!createResult) {
                    log.info('Problem creating the requested number of bots')
                }
                // Update state
                this.onBotsCreate(currentBotNumber)
            }

        }
    }

    /**
     * @WSREQUEST
     *
     * Requests that bots are terminated on the server
     * Successful request results in a returned message via the websocket channel
     * instruction the application to close all bot connections
     */
    async killBots () {
        const data = {
            data: [],
            type: 'bots:close'
        }
        if (sendMessage(container, data)) {
            log.info('Close bot connections requested')
        }
    }

    /**
     * @to-be-deprecated
     *
     * Requests the selected bot to load fresh data into data structure and perform
     * prepare for analysis
     *
     * @param {Object} event triggering the selection
     * @param {Number} index of the menu position representing the selected bot
     * @param {Number} value position value of the selected bot, relevant to the container
     */
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
            // State needs to reflect that this bot is ready to analyze
            const bot = botConnections[this.state.selectedBot]
            botConnections[this.state.selectedBot].dataReady = true
            this.setState({dataReady: true})
            this.consoleOut(`${selectedBot} has loaded market data`)
        }
    }

    /**
     * @WSREQUEST
     *
     * Requests that the selected bot perform general analysis on the data it has loaded
     * Naming convention of `type` = 'request' is misleading. 'request' should be changed
     * to 'bot:analyze'
     */
    // TODO rename 'request' to 'bot:analyze'
    analyzeMarketData = async () => {
        const selectedBot = botConnections[this.state.selectedBot]

        const data = {
            url: urls.trc.analyze,
            data: {
                bot_id: selectedBot.id, time: this.state.timePeriod
            },
            type: 'request'
        }

        if (sendMessage(selectedBot, data)) {
            this.consoleOut(`Bot ${selectedBot.number} (${selectedBot.id}) has analyzed market data`)
        }
    }

    /**
     * @WSREQUEST
     *
     * Requests that the selected bot search for any possible market patterns
     * in the data it has previously loaded and analyzed
     */
    findPatterns = async () => {
        const selectedBot = botConnections[this.state.selectedBot]

        const data = {
            data: { bot_id: selectedBot.id },
            type: 'patterns:search'
        }

        if (sendMessage(container, data)) {
            const msg = `Bot ${selectedBot.number} (${selectedBot.id}) is conducting a pattern search`
            this.consoleOut(msg)
            log.info(msg)
        }
    }

    fetchBalance = async () => {
        const bot = getSelectedBot(this.state)
        const data = {
            data: {
                bot_id: bot.analysisBot.id,
                recipient: 'recipient',
            },
            type: 'fetch:balance'
        }
        if (sendMessage(bot, data)) {
            const msg = `Bot ${bot.number} (${bot.id}) is attempting to fetch balance`
            this.consoleOut(msg)
            log.info(msg, bot.analysisBot.recipient)
        }
    }

    performTrade = async () => {
        const bot = botConnections[this.state.selectedBot]
        if ('analysisBot' in bot && bot.analysisBot.isReady()) {
            const analysisResult = bot.analysisBot.decide()
            if (analysisResult) {
                const recipient = botConnections[findRandomBotIndex()]
                bot.analysisBot.trade(recipient, true)
            }
        }
    }

    loginBot = async () => {
        const bot = botConnections[this.state.selectedBot]
        const data = {
            data: { bot_id: bot.id},
            type: 'bot:login'
        }
        if (sendMessage(bot, data)) {
            const msg = `Bot ${selectedBot.number} (${selectedBot.id}) is attempting a login`
            this.consoleOut(msg)
            log.info(msg)
        }
    }

    /**
     * Message handler provided to our web socket object. Parses incoming messages
     * from a bot's socket stream for requested actions and reported errors from
     * the server
     *
     * @param message
     */
    msgHandler = ({...message}) => {
        console.log('Making the msgHandler visible')
        if ('type' in message) {
            log.info(`WS Data Event Type`, message.type)
        }
        if ('action' in message) {
            const action = message.action
            const data = message.payload
            log.info('ACTION', action)
            switch (action) {
                case 'updatebots':
                    const bots = data

                    if (Array.isArray(bots)) {
                        if (bots.length > 0) {
                            bots.map(bot => botConnections.push({
                                id: bot.id,
                                ws: requestWsForBot(this.msgHandler),
                                number: bot.number,
                                dataReady: false,
                                users: []
                            }))
                            this.onBotsCreate(botConnections.length)
                            log.info('Bot connections updated')
                        } else {
                            log.info('No bots available')
                            botConnections.map(bot => bot.ws.close())
                            botConnections.splice(0, botConnections.length)
                        }

                    }
                    break
                case 'killbots':
                // The server is sending back a successful response from the bots:close
                // request, thus all bot connections should be closed
                    botConnections.map(bot => bot.ws.close())
                    botConnections.splice(0, botConnections.length)
                    this.consoleOut('Bots killed (0 connections)')
                    break
                case 'addfile':
                // A new visualization file is ready to be used. Update the UI to make it accessible
                    if ('filename' in data) {
                        this.updateFileList(data.filename)
                        log.info('Updating file list')
                        delete data.filename
                    }
                    break
                case 'pattern:results:update':
                // Pattern search has been completed. Update the UI with the new results
                    log.info('Search results', data)
                    if ('filename' in data) {
                        this.updateFileList(data.filename)
                        delete data.filename
                        const bot = getSelectedBot(this.state)
                        const patternName = findPatternName(data)
                        // TODO: make analysis bot here?
                         bot.analysisBot = new Bot(bot.id, bot.ws, data.patterns[patternName])
                         log.debug('Analysis bot created', bot.analysisBot)
                    }
                    break
                case 'bot:login:result':
                    log.info('Bot login result', data)
                    break
                case 'account:balance:update':
                    log.info('Fetch balance result', data)
                    if ('balance' in data) {
                        if (this.updateBotUser(data)) {
                            log.info(`Updated user ${data.balance.uid} for bot ${getSelectedBot(this.state)}`)
                        }
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

    /**
     * Helper function to update the list of files in the GUI
     *
     * @param {String} filename
     */
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

    /**
     * Helper function to open the file selected by the user, and update the state
     */
    handleFileSelect = (event, index, value) => {
        console.log('File selection', event, index, value)
        if (value !== void 0) {
            const file = this.state.files[value]
            log.info('File Selection:', file)
            this.setState({selectedFile: value})
            this.consoleOut(`Opening ${file.filename}`)
            window.open(`${window.location.origin + file.url}`, '_blank')
        }
    }

    /**
     * updateBotUser
     *
     * Update user data for the selected bot
     * @param {Object} data
     */
    updateBotUser (data) {
        try {
            const bot = getSelectedBot(this.state)
            let update = false
            bot.users = bot.users.map( user => {
                if (user.uid === data.uid) {
                    update = true
                    return {...user, ...data}
                } else {
                    return user
                }
            })
            if (!update) {
                bot.users.push({...data})
            }
            return true
        } catch (err) {
            log.error('Error updating user for bot', err)
            return false
        }
    }

    /**
     * Render the component
     */
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
                <BotButtons start={this.startBots} kill={this.killBots} />
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
                    className={this.state.dataReady ? "data-ready-show" : "data-ready-hidden"}
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
                <FlatButton
                    label="Balance"
                    labelPosition="before"
                    onClick={this.fetchBalance}
                    primary={false}
                    icon={<AccountBalance style={{color: '#F44336'}} />} />
                <RaisedButton
                    label="Find Patterns"
                    labelPosition="before"
                    onClick={this.findPatterns}
                    primary={false}
                    icon={<Patterns style={{color: '#F44336'}} />} />
                <RaisedButton
                    label="Trade"
                    labelPosition="before"
                    onClick={this.performTrade}
                    primary={false}
                    icon={<TrendingUp style={{color: '#F44336'}} />}
                />
            </Card>
        </Panel>
    </Layout>
</div>
        )
    }

    /**
     * Helper function to update state after user selects a bot
     *
     * @param {Object} event triggering the selection
     * @param {Number} index of the menu position representing the selected bot
     * @param {Number} The position value of the selected bot, relevant to the container
     */
    handleBotSelect = (event, index, value) => {
        const dataReady = value !== -1 ? botConnections[value].dataReady : allDataReady()
        this.setState({selectedBot: value})
        this.setState({dataReady: dataReady})
        this.consoleOut(`Bot ${value + 1} selected`)
    }

    /**
     * Helper function to handle user's selection of a market
     * Implementation will be more relevant after TRC & TRX blockchains are available
     *
     * @param {Object} event triggering the selection
     * @param {Object} value the value of the selected market
     *
     */
    handleMarketSelect = (event, value) => {
        this.setState({market: value})
        this.consoleOut(`Market set to ${value}`)
    }

    /**
     * General purpose function which can be called to update state
     */
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

function sendMessage(bot, data) {
    try {
        if (!'ws' in bot) {
            bot.ws = requestWsForBot(this.msgHandler)
            bot.ws.onopen(bot.ws.send(JSON.stringify(data)))
        } else {
            bot.ws.send(JSON.stringify(data))
        }
        return true
    } catch (err) {
        log.debug(err)
        return false
    }
}

function allDataReady() {
    return botConnections.filter(bot => bot.dataReady).length === botConnections.length
}

const defaultConfig = () => {
    /* exported defaultConfig */
return {

    user: {},
    authentication: {
      subscription: {
        server: 'iot2-cim-auth-ottlab.genband.com'
      },
      websocket: {
        server: 'iot2-cim-auth-ottlab.genband.com'
      }
    },
    call: {
      serverProvidedTurnCredentials: true
    },
    logs: {
      logLevel: 'debug',
      logActions: {
        flattenActions: false,
        actionOnly: false
      },
      enableFcsLogs: true
    }
  }
}

function findPatternName (data) {
    if ('patterns' in data) {
        const keys = Object.keys(data.patterns)
        if (keys.length === 1) {
            return keys[0]
        } else {
            log.error('There is not one single pattern name found')
        }
    }
}

/**
 * findRandomBot
 *
 * Find the index for a random bot which is NOT currently selected
 *
 * @returns {Number} returns an Integer representing the index of a bot
 */
function findRandomBotIndex () {
    const num = botConnections.length
    let randomNumber = num
    while (randomNumber === num) {
        randomNumber = getRandomInt(num)
    }
    return randomNumber
}

/**
 * getRandomInt
 *
 * Provides a random integer
 *
 * @param {Number} num An integer
 * @returns {Number} returns a random integer between 0 and num
 */
function getRandomInt (num) {
    return Math.floor(Math.random() * Math.floor(num))
}

/**
 * getSelectedBot
 *
 * Provides the bot as selected by the UI
 *
 * @param {Object} state
 * @returns {Object} The currently selected bot
 */
function getSelectedBot (state) {
    return botConnections[state.selectedBot]
}