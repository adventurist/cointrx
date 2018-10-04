/* React */
import { Component } from 'react'

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

import { Grid } from '@material-ui/core'


/* utils */
import { request, handleResponse, requestWs, isJson, SOCKET_OPEN } from '../utils/'
import Bot from '../utils/bot'
import log from 'loglevel'

import trx from '../redux'

const trxState = trx()
// console.log(trxState)
// The urls provided by the back end
log.setLevel('debug')

// All stylesheet values
const classes = {
  main: 'main',
  userControl: 'user-control',
  accountPanel: 'account-panel'
}
const styles = {
    mainLayout: {
        padding: 0,
        margin: 0,
        listStyle: 'none',
        justifyContent: 'space-around',
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        backgroundColor: 'black'
    },
    accountPanel: {

    },
    userControlPanel: {
    }
}

const items = [{id: 'kjHLJHluiHHOuiHGkhvgGig&*y7ohj', balance: 300}, {id: 'ijuhy)*(YgugighityigfhkFKGFT', balance: 70}, {id: 'sdkjahsd89YUioysoda8yuij', balance: 600}]

export default class AccountLayout extends Component {

    /**
     * @constructor
     * @param {*} props
     */
    constructor(props) {
        super(props);
        this.state = {
            open: false,
        }
    }

    state = {
        drawerActive: false,
        drawerPinned: false,
        sidebarPinned: false
    };

    async componentDidMount() {
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
     * Render the component
     */
    render() {
        return (
<div id="main-wrap">

  <Grid container className={classes.main} spacing={16}>
        <Grid item xs={2}>
          <Panel id="user-control" className={classes.userControl} style={styles.userControlPanel}>
            <MasterButtons />
          </Panel>

          <Panel id="account-panel" className={classes.accountPanel} style={styles.accountPanel}>
            <div>
              <AccountList accounts={items}/>
            </div>
          </Panel>
        </Grid>
      </Grid>
</div>
        )
    }
}


class AccountList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedAccount: undefined,
      accountMenuItems: this.getMenuItems()
    }
  }

  getMenuItems () {
    const items = [<MenuItem value={undefined} key={undefined} primaryText={`Select Account`} />]

    for (let i = 0; i < this.props.accounts.length; i++) {
      items.push(<MenuItem
        value={i} key={i} primaryText={i + 1 + ': ' + this.props.accounts[i].id + '\n' + this.props.accounts[i].balance}
      />)
    }
    return items
  }

  accountSelectChange = (event, value) => {
    this.setState({selectedAccount: value})
  }

  render () {
    return (
      <DropDownMenu id="account-select" maxHeight={300} value={this.state.selectedAccount} onChange={this.accountSelectChange}>
  {this.state.accountMenuItems}
      </DropDownMenu>
    )
  }
}

export class MasterButtons extends React.Component {
  constructor(props) {
      super(props)
      this.state = {

      }
  }

  render () {
      return (
          <div id="start-button">
              <FlatButton
                  label="Refresh"
                  labelPosition="before"

                  primary={false}
                  icon={<PowerSettingsNew/>}
              />
              <FlatButton
                  label="Delete"
                  labelPosition="before"

                  primary={false}
                  icon={<BotsOff />}
              />
          </div>
      )
  }
}