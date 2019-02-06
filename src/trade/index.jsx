import { render } from 'react-dom'
import App from './app'
import TrxNavigation from '../TrxNavigation.jsx'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

const styles = {
  main: {
    flexGrow: 1
  }
}

const theme = createMuiTheme({
  palette: {
    type: 'dark',
  }
})



render (
  <MuiThemeProvider theme={theme}>
    <div id='container' style={styles.main}>
      <TrxNavigation />
      <App />
    </div>
  </MuiThemeProvider>
  , document.getElementById('root')
)
