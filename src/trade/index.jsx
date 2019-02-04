import { render } from 'react-dom'
import App from './app'
import TrxNavigation from '../TrxNavigation.jsx'

const styles = {
  main: {
    flexGrow: 1
  }
}


render (
  <div id='container' style={styles.main}>
    <TrxNavigation />
    <App />
  </div>
  , document.getElementById('root')
)
