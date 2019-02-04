import "@babel/polyfill"
import React from 'react'
import { render }from 'react-dom'
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { TrxNav } from '../TrxAppBar.jsx'
import AccountLayout from './App.jsx'
// import trx from '../redux'

// const trxInstance = trx()


render(
    <div id="container">
        <AccountLayout />
    </div>
    , document.getElementById('root')
)
