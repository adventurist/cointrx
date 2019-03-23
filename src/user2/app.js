/* React */
import { Fragment, Component } from 'react'

/* Material UI */
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import Switch from '@material-ui/core/Switch'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import Typography from '@material-ui/core/Typography'

/* Form */
import { UserForm } from './components/form'
/* Request */
import { request, handleResponse } from '../utils/index'
/* Logging*/
import log from 'loglevel'
import Console from '../utils/component/Console'

const styles = {
  center: {
    textAlign: 'center'
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '0px'
  },
  gridChild: {
    padding: '0px',
    width: '95%',
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
}


export default class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      user: JSON.parse(userData.replace(/'/g, '"')) || {}
    }
  }

  componentDidMount () {
    if (this.props.userHandler) {
      this.props.userHandler(this.state.user)
    }
    this.log(`User profile for: ${this.state.user.name}`)
  }

  notificationMessage = message => {
    if (this.props.notificationHandler) {
      this.props.notificationHandler(message)
    }
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
    <Console message={this.state.lastMessage}/>
      <Grid container spacing={16} style={styles.root}>
        <Grid style={styles.gridChild} item xs={12}>
          <ExpansionPanel style={styles.expand} defaultExpanded={true}>
            <ExpansionPanelSummary className={classes.expand} expandIcon={<ExpandMoreIcon />}>
              <Typography>User Form</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <Paper className="trxToolWrap" elevation={4}>
                  <UserForm style={styles.trxTool} user={this.state.user} />
                </Paper>
            </ExpansionPanelDetails>
          </ExpansionPanel>
        </Grid>
      </Grid>
    </div>
      )
  }
}
