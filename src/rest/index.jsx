import { render } from 'react-dom'
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import { RestGui } from './gui.jsx'

render(
  <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>

    <RestGui>
    </RestGui>

  </MuiThemeProvider>
  , document.getElementById('root')
)