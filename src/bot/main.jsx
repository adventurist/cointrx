import * as React from 'react'
import { render }from 'react-dom'
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { TrxNav } from '../TrxAppBar.jsx'
import { Layout, Panel } from 'react-toolbox'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import {orange500, blue500} from 'material-ui/styles/colors';
import NumericInput from 'react-numeric-input';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import { Provider } from 'react-redux'
// import trx from '../redux'

// const trxInstance = trx()

const styles = {
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
    }
}
/* padding: 0;
 margin: 0;
 list-style: none;

 display: -webkit-box;
 display: -moz-box;
 display: -ms-flexbox;
 display: -webkit-flex;
 display: flex;

 -webkit-flex-flow: row wrap;
 justify-content: space-around;*/

const NumberButton = (props) => {
    return <FlatButton label={props.label} style={styles.numberButton} onClick={props.onClick}/>
}

const buildBotMenuItems = (length) => {
    const items = [];
    items.push(<MenuItem value={'All'} key={-1} primaryText={`All`} />);
    for (let i = 0; i < length; i++ ) {
        items.push(<MenuItem value={i} key={i} primaryText={`Bot ${i}`} />);
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
            botMenuItems: buildBotMenuItems(this.state.botNum)
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
        // this.updateState('sidebarPinned', !this.state.sidebarPinned)
        this.setState({
            sidebarPinned: !this.state.sidebarPinned
        });
    };

    botNumberChange = (event, value) => {
        const newItems = buildBotMenuItems(value)
        this.setState({botNum: value, botMenuItems: newItems})
    }

    render() {
        return (
            <div id="main-wrap">
            <TrxNav id="trx-nav" />
                <Layout id="main-layout" style={styles.mainLayout}>
                    <Panel id="bot-panel" className="trx-panel" style={styles.trxPanel}>
                        <Card>
                            <CardTitle title="Bot Setup" />
                            <CardText>
                                Configure and create bots
                            </CardText>
                            <div id="number-container" style={{maxWidth: '5em'}}>
                                <CardActions className="number-control"  style={styles.numberControl}>
                                    <NumericInput min={0} max={100} value={this.state.botNum} onChange={this.botNumberChange} />
                                </CardActions>
                            </div>
                        </Card>
                    </Panel>
                    <Panel id="analysis-panel" className="trx-panel" style={styles.trxPanel}>
                        <Card>
                            <CardTitle title="Analysis" />
                            <CardText>
                                Examine and trade
                            </CardText>
                            <DropDownMenu maxHeight={300} value={this.state.selectedBot} onChange={this.handleBotSelect}>
                                {this.state.botMenuItems}
                            </DropDownMenu>

                        </Card>
                    </Panel>
                </Layout>
            </div>
        )
    }

    handleBotSelect = (value) => {
        this.setState({selectedBot: value})
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
