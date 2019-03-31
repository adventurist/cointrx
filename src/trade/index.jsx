import { Component } from 'react'
import { render } from 'react-dom'
import App from './app'
import TrxNavigation from '../TrxNavigation.jsx'
import { MuiThemeProvider } from '@material-ui/core/styles'
import trxTheme from '../theme'

const styles = {
  main: {
    flexGrow: 1
  }
}

// const theme = createMuiTheme({
//   palette: {
//     type: 'dark',
//     primary: {
//       light: '#757ce8',
//       main: '#3f50b5',
//       dark: '#64dd17',
//       contrastText: '#fff',
//     }
//   }
// })

class MainApplication extends Component {
  constructor (props) {
    super(props)
   this.state = {
     user: undefined,
     lastMessage: undefined
   }
  }

  notificationMessageHandler = message => {
    this.setState({ lastMessage: message })
  }
  userHandler = user => { this.setState({ user: user }) }

  render () {
    return (
      <div id='container' style={styles.main}>
        <TrxNavigation notificationMessage={this.state.lastMessage} user={this.state.user}/>
        <App notificationHandler={this.notificationMessageHandler} userHandler={this.userHandler} />
    </div>
    )
  }
}

render (
  <MuiThemeProvider theme={trxTheme()}>
      <MainApplication></MainApplication>
  </MuiThemeProvider>
  , document.getElementById('root')
)
