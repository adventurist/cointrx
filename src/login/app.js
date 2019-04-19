/* React */
import { Fragment, Component } from 'react'

/* Material UI */
import Switch from '@material-ui/core/Switch'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import TrxIcon from '../utils/component/TrxIcon'
import Typography from '@material-ui/core/Typography'
import { Dialog, Card, CardContent, CardActions, CardActionArea, CardMedia, Paper, withStyles, Grid, TextField, Button, FormControlLabel, Checkbox } from '@material-ui/core'

import { Email,Face, Fingerprint } from '@material-ui/icons'

/* Request */
import { request, handleResponse } from '../utils/index'
/* Logging*/
import log from 'loglevel'

import '@babel/polyfill'

const styles = {
  welcomeMessage: {
    display: 'flex',
    textAlign: 'center'
  },
  welcomeLogo: {
    width: 'auto',
    height: '64px',
    backgroundSize: 'contain'
  },
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

const LoginIcon = () => {
  return (
    <TrxIcon path='M10,17V14H3V10H10V7L15,12L10,17M10,2H19A2,2 0 0,1 21,4V20A2,2 0 0,1 19,22H10A2,2 0 0,1 8,20V18H10V20H19V4H10V6H8V4A2,2 0 0,1 10,2Z' />
  )
}

const RegisterIcon = () => {
  return (
    <TrxIcon path='M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M6,10V7H4V10H1V12H4V15H6V12H9V10M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12Z'/>
  )
}

const CoinTrxWelcome = () => {
  return (
    <Card style={{textAlign: 'center'}} raised={true}>
          <CardMedia className='trx-logo' style={styles.welcomeLogo}
              image='/static/images/logo.png'>
          </CardMedia>
          <Typography className='welcome-text' variant='h4'>Welcome to CoinTRX</Typography>
    </Card>
  )
}

const RegisterButton = () => {
  function registerRedirect () {
    window.location = '/register'
  }
  return (
    <Button className='register-button' style={{textTransform: 'none'}} variant='raised' color='secondary' onClick={registerRedirect}><RegisterIcon />Register</Button>
  )
}

export default class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      name: undefined,
      email: undefined,
      password: undefined,
      loggedIn: false,
      dialogShow: false,
      dialogMessage: ''
    }
  }

  componentDidMount () {
    if (trxMessages && Array.isArray(trxMessages)) {
      trxMessages.forEach(message => {
        let dialogMessage
        switch (message) {
          case 'password':
            this.dialogOpen('You entered an invalid password')
            break
          case 'user':
            this.dialogOpen('The user entered does not exist')
            break
        }
      })
    }
  }

  notificationMessage = message => {
    if (this.props.notificationHandler) {
      this.props.notificationHandler(message)
    }
  }

  dialogOpen = message => {
    this.setState({ dialogMessage: message, dialogShow: true })
  }

  dialogClose = () => {
    this.setState({ dialogShow: false, dialogMessage: '' })
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

  login = async () => {
    const name = this.state.name
    const password = this.state.password

    const response = await request({
      url: '/login',
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: {
        name,
        password
      }
    })

    const result = handleResponse(response)

    if (!result.error) {
      this.log('Login successful')
      window.location = result.body.url
    } else {
      this.log('Login failed')
      this.dialogOpen()
    }
  }

  /**
     * Render the component
     */
    render() {
      return (

    <div id="main-wrap">
    <CoinTrxWelcome />
    <Paper className={classes.padding}>
      <div className={classes.margin}>
        <form method="post" id="login-form" accept-charset="UTF-8">
          <Grid container spacing={8} alignItems="flex-end">
            <Grid item md={true} sm={true} xs={true}>
              <TextField name='name' id="name" label="Username" type="text" onChange={this.handleName} fullWidth autoFocus />
            </Grid>
          </Grid>
          <Grid container spacing={8} alignItems="flex-end">
            <Grid item md={true} sm={true} xs={true}>
                <TextField id="password" name="password" label="Password" type="password" onChange={this.handlePass} fullWidth required />
            </Grid>
          </Grid>
          <Grid container alignItems="center" justify="space-between">
            <Grid style={{padding: '12px'}} item>
              <FormControlLabel control={
                <Checkbox
                    color="primary"
                />
              } className='checkbox-label' label="Remember me" />
            </Grid>
            <Grid item>
              <Button disableFocusRipple disableRipple style={{ textTransform: "none", color: "#fff" }} className='forgot-btn' variant="text">Forgot password ?</Button>
            </Grid>
          </Grid>
          <Grid container justify="center" style={{ marginTop: '10px' }}>
            <Button className='login-btn' type='submit' variant="raised" color="primary" style={{ textTransform: "none" }}><LoginIcon />Login</Button>
          </Grid>
        </form>
      </div>
    </Paper>
    <Paper style={{display: 'flex', justifyContent: 'center'}}>
    <Typography style={{padding: '4px', marginRight: '4px', fontStyle: 'italic'}} variant='h5'>
      Don't have an account?
    </Typography>
      <RegisterButton />
    </Paper>
    <Dialog
      title="Invalid Login"
      maxWidth='lg'
      open={this.state.dialogShow}>
      <Paper className='error-container'draggable={true}>
        <Card className='login-error'>
          <TrxIcon style={{padding: '6px', marginTop: '4px'}} color='#f4511e' size='lg' path='M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z'></TrxIcon>
          <Typography component='h3' variant='h5'>Authentication Error</Typography>
          <CardActionArea>
            <CardContent>
              <Typography component='h4' variant='h6'>{this.state.dialogMessage}</Typography>
            </CardContent>
          </CardActionArea>
          <CardActions className='error-close-action'>
            <Button size='large' color='primary' label='Close' onClick={this.dialogClose}>Close</Button>
          </CardActions>
        </Card>
      </Paper>
    </Dialog>
  </div>
  )}
}
