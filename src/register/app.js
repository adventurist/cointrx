/* React */
import { Fragment, Component } from 'react'

/* Material UI */
import Switch from '@material-ui/core/Switch'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import Typography from '@material-ui/core/Typography'
import { Paper, withStyles, Grid, TextField, Button, FormControlLabel, Checkbox } from '@material-ui/core'

import { Email,Face, Fingerprint } from '@material-ui/icons'

/* Request */
import { request, handleResponse } from '../utils/index'
/* Logging*/
import log from 'loglevel'

import '@babel/polyfill'

const styles = {
  center: {
    textAlign: 'center'
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '0px'
    // justifyContent: 'space-around'
  },
  gridChild: {
    padding: '0px',
    backgroundColor: '#021c21'
  },
  gridItem: {
    paddingTop: '12px'
  },
  trxTool: {
    padding: '4px!important'
  },
  expand: {
    minHeight: '24px!important',
    maxHeight: '24px!important',
    margin: 0
  }
}

const classes = {
  expand: 'panel'
}


const ids = {
  tradeLeft: 'trade-left',
  tradeRight: 'trade-right',
  tradeDialog: 'trade-dialog'
}


export default class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      name: undefined,
      email: undefined,
      password: undefined,
      loggedIn: false
    }
  }

  componentDidMount () {

  }

  notificationMessage = message => {
    if (this.props.notificationHandler) {
      this.props.notificationHandler(message)
    }
  }

  dialogHandler = () => {
    this.setState({ tradeDialogOpen: true })
  }

  tradeDialogCloseHandler = () => {
    this.setState({ tradeDialogOpen: false })
  }

  handleName = e => {
    this.setState({ name: e.target.value })
  }

  handleEmail = e => {
    this.setState({ email: e.target.value })
  }

  handlePass = e => {
    this.setState({ password: e.target.value })
  }

  messageHandler = (message) => {
    this.log(message)
  }

  log = (message) => {
    log.info(message)
    this.setState({ lastMessage: message })
  }

  /**
     * Render the component
     */
    render() {
      return (

    <div id="main-wrap" >
    <Paper className={classes.padding}>
                <div className={classes.margin}>
                <form method="post" id="login-form" accept-charset="UTF-8">
                <Grid container spacing={8} alignItems="flex-end">
                        <Grid item>
                            <Face />
                        </Grid>
                        <Grid item md={true} sm={true} xs={true}>
                            <TextField name='name' id="name" label="Username" type="text" onChange={this.handleName} fullWidth autoFocus required />
                        </Grid>
                    </Grid>
                    <Grid container spacing={8} alignItems="flex-end">
                        <Grid item>
                            <Email />
                        </Grid>
                        <Grid item md={true} sm={true} xs={true}>
                            <TextField name="email" id="email" label="Email" type="text" onChange={this.handleEmail} fullWidth autoFocus required />
                        </Grid>
                    </Grid>
                    <Grid container spacing={8} alignItems="flex-end">
                        <Grid item>
                            <Fingerprint />
                        </Grid>
                        <Grid item md={true} sm={true} xs={true}>
                            <TextField id="password" name="password" label="Password" type="password" onChange={this.handlePass} fullWidth required />
                        </Grid>
                    </Grid>
                    <Grid container alignItems="center" justify="space-between">
                        <Grid item>
                            <FormControlLabel control={
                                <Checkbox
                                    color="primary"
                                />
                            } label="Remember me" />
                        </Grid>
                        <Grid item>
                            <Button disableFocusRipple disableRipple style={{ textTransform: "none" }} variant="text" color="primary">Forgot password ?</Button>
                        </Grid>
                    </Grid>
                    <Grid container justify="center" style={{ marginTop: '10px' }}>
                        <Button type='submit' variant="outlined" color="primary" style={{ textTransform: "none" }}>Login</Button>
                    </Grid>
                    </form>
                </div>
            </Paper>
    </div>
      )
  }
}
