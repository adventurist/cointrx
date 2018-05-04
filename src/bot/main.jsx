import * as React from 'react'
import { render }from 'react-dom'
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { TrxNav } from '../TrxAppBar.jsx'
import { Layout, Panel } from 'react-toolbox'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import TextField from 'material-ui/TextField';
import {orange500} from 'material-ui/styles/colors';
import NumericInput from 'react-numeric-input';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import TrendingUp from 'material-ui/svg-icons/action/trending-up';
import CompareArrows from 'material-ui/svg-icons/action/compare-arrows';
import AutoRenew from 'material-ui/svg-icons/action/autorenew'
import PowerSettingsNew from 'material-ui/svg-icons/action/power-settings-new'
import PlayCircle from 'material-ui/svg-icons/av/play-circle-filled'
import FlatButton from 'material-ui/FlatButton/FlatButton'
import RaisedButton from 'material-ui/RaisedButton/RaisedButton'
import { request, handleResponse, requestWs, isJson } from '../utils/'
// import trx from '../redux'

// const trxInstance = trx()

// const urls = {
//     botStart: 'http://localhost:6969/bot/start',
//     botTrcPrices: 'http://localhost:6969/bot/trc/prices/all',
//     botTrcAnalyze: 'http://localhost:6969/bot/trc/prices/analyze',
//     wsStart: 'ws://localhost:6969/bot/ws-test'
// }
const urls = JSON.parse(botUrls.replace(/'/g, '"'))

const styles = {
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

const buildBotMenuItems = (length) => {
    const items = [];
    items.push(<MenuItem value={'All'} key={-1} primaryText={`All`} />);
    for (let i = 0; i < length; i++ ) {
        items.push(<MenuItem value={i} key={i} primaryText={`Bot ${i + 1}`} />);
    }
    return items
}

export class TrxLayout extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: false,
            botNum: 1,
            selectedBot: -1,
            botMenuItems: buildBotMenuItems(this.state.botNum),
            consoleText: '',
            market: undefined,
            timePeriod: '60'
        };
    }

    state = {
        drawerActive: false,
        drawerPinned: false,
        sidebarPinned: false
    };

    componentDidMount() {
        let menuItems = buildBotMenuItems(this.state.botNum)
        this.setState({botMenuItems: menuItems})
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
        const newItems = buildBotMenuItems(value)
        this.setState({botNum: value, botMenuItems: newItems})
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
        console.log(response)
        if ('body' in response && 'data' in response.body) {
            let previousBotNumber = botConnections.length
            if (Array.isArray(data.body.data)) {
                data.body.data.map(bot => {
                    console.log(bot.message)
                    const ws = requestWs({
                        url: urls.wsStart,
                        params: {data: 'test'}
                    })

                    if (ws) {
                        botConnections.push({id: bot.id, ws: ws, number: bot.number})
                    }
                })
                let currentBotNumber = botConnections.length
                let numDiff = currentBotNumber - previousBotNumber
                let createResult = Math.abs(numDiff) === data.body.data.length

                if (!createResult) {
                    console.log('Problem creating the requested number of bots')
                }
                this.onBotsCreate(currentBotNumber)
            }

        }
    }

    loadMarketData = async (event, index, value) => {
        const selectedBot = botConnections[this.state.selectedBot]
        console.log(event)
        const data = await request({
            url: urls.trc.prices,
            headers: {'Content-Type': 'application/json'},
            params: {bot_id: selectedBot.id, time: this.state.timePeriod},
            credentials: 'include'
        })

        const response = handleResponse(data)
        console.log(response)
        if (!response.error) {
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

        selectedBot.ws.send(JSON.stringify(data))
        this.consoleOut(`Bot ${selectedBot.number} (${selectedBot.id}) has analyzed market data`)
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
                        </Card>
                    </Panel>
                </Layout>
            </div>
        )
    }

    handleBotSelect = (event, index, value) => {
        this.setState({selectedBot: value})
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
