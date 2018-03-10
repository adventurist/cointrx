import React from 'react'
import { render }from 'react-dom'
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { UserForm, UserKeys } from './App.jsx';
import { TrxNav } from '../TrxAppBar.jsx'
import { Provider } from 'react-redux'
// import trx from '../redux'

// const trxInstance = trx()



render(
    <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
        <div id="container">
            <TrxNav />
            <UserForm />
            <UserKeys className="user-key-grid" tooltip="Create new Bitcoin Key" />
        </div>

    </MuiThemeProvider>
    , document.getElementById('root')
)
