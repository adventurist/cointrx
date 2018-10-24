import "@babel/polyfill"
/* React */
import { Fragment, Component } from 'react'

/**
* Material Libraries
*
* Theme and Layout
*/
// import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
// import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
// import getMuiTheme from 'material-ui/styles/getMuiTheme'
// import { Layout, Panel } from 'react-toolbox'
import { TrxNav } from '../TrxAppBar2.jsx'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'
import Collapse from '@material-ui/core/Collapse'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardMedia from '@material-ui/core/CardMedia'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import IconButton from '@material-ui/core/IconButton'
import Snackbar from '../snackbar'
import ReactScrollbar from 'react-scrollbar'
import TrxDrawer2 from '../TrxDrawer'

/* Colour and Icon */
// import TrendingUp from 'material-ui/svg-icons/action/trending-up'
// import AccountBalance from 'material-ui/svg-icons/action/account-balance'
// import CompareArrows from 'material-ui/svg-icons/action/compare-arrows'
// import AutoRenew from 'material-ui/svg-icons/action/autorenew'
import PowerSettingsNew from 'material-ui/svg-icons/action/power-settings-new'
// import CallEnd from 'material-ui/svg-icons/communication/call-end'
// import PlayCircle from 'material-ui/svg-icons/av/play-circle-filled'
// import Sync from 'material-ui/svg-icons/notification/sync'
import BotsOff from 'material-ui/svg-icons/file/cloud-off'
// import Patterns from 'material-ui/svg-icons/image/blur-linear'
// import { orange500, red500 } from 'material-ui/styles/colors'

/* Lists & Menus */
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import AccountIcon from '@material-ui/icons/AccountBalance'
import AddIcon from '@material-ui/icons/Add'
import DeleteIcon from '@material-ui/icons/Delete'
import RemoveIcon from '@material-ui/icons/Remove'
import SaveIcon from '@material-ui/icons/Save'
import WalletIcon from '@material-ui/icons/AccountBalanceWallet'
import ListItemText from '@material-ui/core/ListItemText'

/* Inputs */
import TextField from '@material-ui/core/TextField'
// import NumericInput from 'react-numeric-input'

/* Buttons, Avatars */
// import { Card, CardActions, CardTitle, CardText } from 'material-ui/Card'
import Avatar from '@material-ui/core/Avatar'
// import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import FlatButton from 'material-ui/FlatButton/FlatButton'
import Button from '@material-ui/core/Button'
// import RaisedButton from 'material-ui/RaisedButton/RaisedButton'
// import Chip from 'material-ui/Chip'
import FavoriteIcon from '@material-ui/icons/Favorite'
import ShareIcon from '@material-ui/icons/Share'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import MoreVertIcon from '@material-ui/icons/MoreVert'

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
  paper: 'paper',
  userControl: 'user-control',
  accountPanel: 'account-panel',
  appBar: 'app-bar',
  toolBar: 'toolbar',
  button: 'details-button',
  accountList: 'account-list',
  accountItem: 'account-item',
  accountDetails: 'account-details',
  accountDetailsAction: 'account-details-action',
  accountDetailsExpand: 'account-details-expand',
  accountScroll: 'account-list-scroll',
  detailsCard: 'account-details-card',
  detailsLabel: 'account-details-label',
  listLabel: 'account-list-label'
}
const styles = {
    mainLayout: {
        marginTop: '64px',
        padding: 0,
        margin: 0,
        listStyle: 'none',
        justifyContent: 'space-around',
        display: 'flex',
        flexDirection: 'row',
        flexGrow: 1,
        backgroundColor: 'black'
    },
    accountPanel: {

    },
    userControlPanel: {
    },
    appBar: {position: 'sticky'},
    toolBar: {},
    accountMenuItem: {
      ':hover': {
        backgroundColor: 'grey',
        opacity: 0.7
      }
    },
    expandOpen: {
      transform: 'rotate(180deg)',
    },
    listItemText: {
      fontSize: '0.35em',
    },
    enableButton: {
      backgroundColor: 'pink',
    },
    disableButton: {
      backgroundColor: 'grey'
    },
    saveButton: {
      backgroundColor: 'green'
    },
    deleteButton: {
      backgroundColor: 'red'
    }

}

const items = [{id: 'kjHLJHluiHHOuiHGkhvgGig&*y7ohj', balance: 300}, {id: 'ijuhy)*(YgugighityigfhkFKGFT', balance: 70}, {id: 'sdkjahsd89YUioysoda8yuij', balance: 600}]

const urls = JSON.parse(accountUrls.replace(/'/g, '"'))

export default class AccountLayout extends Component {

    /**
     * @constructor
     * @param {*} props
     */
    constructor(props) {
        super(props)
        this.state = {
            open: false,
            accounts: undefined,
            selectedAccount: undefined,
            accountDetails: undefined,
            account: undefined,
            snackbarMessage: 'Test',
            snackbarOpen: false
        }

        this.accountSelectHandler = this.accountSelectHandler.bind(this)
    }

    state = {
        drawerActive: false,
        drawerPinned: false,
        sidebarPinned: false
    };

    async componentDidMount() {
      await this.init()
    }

    handleClick = () => {
        this.setState({
            open: true,
        })
    }

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

    accountSelectHandler (e) {
      this.setState({
        selectedAccount: e.currentTarget.value,
        account: this.state.accounts[e.currentTarget.value]
       })
    }

    accountUpdateHandler = (accountData) => {
      this.setState({
        accounts: this.state.accounts.map( account => {
          if (account.id === accountData.id) {
            return accountData
          }
          return account
        }),
        account: accountData
      })
    }

    async init () {
      const data = await request({
        url: urls.account_list,
        params: {
          active: true
        }
      })
      console.log('account data:', data)
      if ('body' in data) {
        this.setState({ accounts: data.body.accounts })
      }
    }

    showSnackbar = (message) => {
      this.setState({
        snackbarMessage: message,
        snackbarOpen: true
      })
    }

    /**
     * Render the component
     */
    render() {
        return (
    <Fragment>
      <div id="main-wrap">
        <TrxNav />
        <TrxDrawer2/>

        <Grid container spacing={24}>
          <Grid item xs={8} sm={4}>
              <Paper className={classes.paper} elevation={1}>
                  <Typography variant="headline" component="h3">
                    Accounts
                  </Typography>
                </Paper>
                <Paper className={classes.paper} elevation={1}>
                  <ReactScrollbar className={classes.accountScroll}>
                    <AccountList className={classes.accountList} accounts={this.state.accounts} accountSelectHandler={this.accountSelectHandler} />
                  </ReactScrollbar>
                </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper className={classes.accountDetails}>
              <AccountDetails
                account={this.state.account}
                selectedAccount={this.state.selectedAccount}
                snackbarHandler={this.showSnackbar}
                accountUpdateHandler={this.accountUpdateHandler}
              />
            </Paper>
          </Grid>
        </Grid>
      </div>
      <Snackbar message={this.state.snackbarMessage} open={this.state.snackbarOpen} />
    </Fragment>
        )
    }
}


class AccountList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedAccount: undefined,
      accountMenuItems: this.getMenuItems(),
      open: false,
      expandOpen: false
    }
  }

  componentDidMount () {
    this.setState({accountMenuItems: this.getMenuItems()})
  }

  componentWillReceiveProps (props) {
    this.setState({accountMenuItems: this.getMenuItems(props.accounts)})
  }

  getMenuItems (accounts) {
    if (accounts) {
      const items = []

      for (let i = 0; i < accounts.length; i++) {
        items.push(
        <ListItem onClick={this.props.accountSelectHandler} className={classes.accountItem} value={i} key={i}>
          <ListItemText key={i} style={styles.listItemText} primary={
            accounts[i].id + ': ' + accounts[i].label || ''
          }/>
        </ListItem> )
      }
      return items
    }
  }

  accountClick = (e) => {
    this.setState({selectedAccount: e.currentTarget.value})
  }

  toggleCollapse = () => this.setState({open: !this.state.open})

  render () {
    return (
      <List id="account-select" value={this.state.selectedAccount}>
      <ListItem className={classes.accountItem} value={undefined} key={undefined}>
        <AccountIcon />
        <ListItemText primary='Select' onClick={this.toggleCollapse}/>
      </ListItem>
        <Collapse in={this.state.open}>
          {this.state.accountMenuItems}
        </Collapse>
      </List>
    )
  }
}

class AccountDetails extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      expanded: false,
      selectedAccount: undefined,
      account: undefined
    }
  }

  componentWillReceiveProps (props) {
    console.log('AccountDetails receiving props', props)
    this.setState({ selectedAccount: props.selectedAccount })
    this.setState({ account: props.account })
  }

  handleExpandClick = () => {
    this.setState({ expanded: !this.state.expanded })
  }

  render () {
        return (
<Card className={classes.accountDetails}>
<CardHeader
  avatar={
    <Avatar aria-label="Account Details" className={classes.accountAvatar}>
      {this.state.selectedAccount}
    </Avatar>
  }
  action={
    <IconButton>
      <MoreVertIcon />
    </IconButton>
  }
  title="Account Details"
  subheader={this.state.selectedAccount}
/>
<CardMedia
  className={classes.accountMedia}
  image="/static/images/logo.png"
  title="TRX"
/>
<CardContent>
  <Typography component="div">
    {this.state.account ? this.state.account.label : ''}
  </Typography>
</CardContent>
<CardActions className={classes.accountDetailsActions} disableActionSpacing>
  <IconButton aria-label="Add to favorites">
    <FavoriteIcon />
  </IconButton>
  <IconButton aria-label="Share">
    <ShareIcon />
  </IconButton>
  <IconButton
    className={classes.accountDetailsExpand}
    style={styles.expandOpen}
    onClick={this.handleExpandClick}
    aria-expanded={this.state.expanded}
    aria-label="Show more"
  >
    <ExpandMoreIcon />
  </IconButton>
</CardActions>
<Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
  <CardContent className={classes.detailsCard}>
    <Typography component="div">
      <RenderedDetails
        snackbarHandler={this.props.snackbarHandler}
        account={this.state.account}
        accountUpdateHandler={this.props.accountUpdateHandler}
      />
    </Typography>
  </CardContent>
</Collapse>
</Card>
)
  }

  // TODO: use it or lose it
  currentAccount = () => {
    return this.props.accounts[this.state.selectedAccount]
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

export class RenderedDetails extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  componentWillReceiveProps (props) {
    if (props.account) {
      this.setState({
        label: props.account.label,
        id: props.account.id,
        status: props.account.status,
        balance: props.account.balance,
        multi: props.account.multi,
        userName: props.account.user.name,
        email: props.account.user.email,
        level: props.account.user.level,
        created: props.account.user.created
      })
    }
    if (props.snackbarHandler) {
      this.showSnackbar = props.snackbarHandler
    }
    if (props.accountUpdateHandler) {
      this.accountUpdateHandler = props.accountUpdateHandler
    }
  }

  updateLabel = (e) => {
    const text = e.target.value
    this.setState({ label: text })
  }

  toggleStatus = () => {
    this.setState({ status: !this.state.status })
  }

  enableKey = async () => {
    console.log('Enable key')
    const response = await request({
      url: urls.activate_key,
      method: 'GET',
      params: {
        key_id: this.state.id
      }
    })

    if (response.error) {
      console.log('Error', handleResponse(response))
    } else {
      console.log('Key enabled', response)
      if (!this.state.status) {
        this.toggleStatus()
      }
    }
  }

  disableKey = async () => {
    console.log('Disable key')
    const response = await request({
      url: urls.deactivate_key,
      method: 'GET',
      params: {
        key_id: this.state.id
      }
    })

    if (response.error) {
      console.log('Error', handleResponse(response))
    } else {
      console.log('Key disabled', response)
      if (this.state.status) {
        this.toggleStatus()
      }
    }
  }

  saveChanges = async () => {
    console.log('Save changes to key')
    const response = await request({
      url: urls.update_key.replace('0000', formatKey(this.state.id)),
      method: 'POST',
      body: {
        label: this.state.label
      },
      headers: {
        'Content-Type': 'application/json',
        'csrf-token': getCSRFToken()
      }
    })

    if (response.error) {
      console.log('Error', handleResponse(response))
    } else {
      console.log('Key changes saved', response)

      this.accountUpdateHandler({
        label: this.state.label,
        id: this.state.id,
        status: this.state.status,
        balance: this.state.balance,
        multi: this.state.multi,
        user: {
          name: this.state.userName,
          email: this.state.email,
          level: this.state.level,
          created: this.state.created
        }
      })
    }
  }

  deleteKey = () => {
    console.log('Delete key')
    this.showSnackbar('Can\'t delete key yet!!!')
  }

  render () {
    if (this.props.account) {
      const account = this.props.account
      const user = account.user
      return (
                <div>
                  <h4>Account Info</h4>
                  <span className={classes.detailsLabel}>ID:</span> {account.id} <span className={classes.detailsLabel}>Status<button className={this.state.status ? 'status-active' : 'status-deactive'}></button></span> <br />
                  <span className={classes.detailsLabel}>Balance:</span> {account.balance} <br />
                  <span className={classes.detailsLabel}>Multisig:</span> {account.multi ? 'Yes' : 'No'} <br />
                  <TextField
                    id='key-label'
                    label='Label: '
                    className={classes.detailsLabelText}
                    placeholder='Key label'
                    value={this.state.label}
                    onChange={(e) => this.updateLabel(e)}
                    margin="normal"
                  />
                  <h4>Owner</h4>
                  <span className={classes.detailsLabel}>Name:</span> {user.name} <br />
                  <span className={classes.detailsLabel}>Email:</span> {user.email} <br />
                  <span className={classes.detailsLabel}>Level:</span> {user.level} <br />
                  <span className={classes.detailsLabel}>Joined:</span> {user.created} <br />

                  <div className='buttons-div'>
                    <Button variant="fab" aria-label="Enable" style={styles.enableButton} className={classes.button} onClick={this.enableKey}>
                      <AddIcon />
                    </Button>
                    <Button variant="fab" aria-label="Disable" style={styles.disableButton} className={classes.button} onClick={this.disableKey}>
                      <RemoveIcon />
                    </Button>
                    <Button variant="fab" aria-label="Save" style={styles.saveButton} className={classes.button} onClick={this.saveChanges}>
                      <SaveIcon />
                    </Button>
                    <Button variant="fab" aria-label="Delete" style={styles.deleteButton} className={classes.button} onClick={this.deleteKey}>
                      <DeleteIcon />
                    </Button>
                  </div>
                </div>)
    } else {
      return (
        <div>
          <h4>Please select an account</h4>
        </div>
      )
    }
  }
}

function getCSRFToken() {
  const cookie = document.cookie.split(';').filter(cookie => cookie.trim().substr(0, 4) === 'csrf')
  if (cookie && cookie.length > 0) {
      return cookie[0].trim().substr(5)
  }
}

function formatKey (key) {
  let urlString = typeof key === 'string' ? key : key.toString()
  while (urlString.length < 4) {
    urlString = '0' + urlString
  }
  return urlString
}