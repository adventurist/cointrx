import React from 'react'
import { render }from 'react-dom'
import Chart from './Chart';
import { getData } from "./Utils"
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { TrxGrid, TradeForm, TrxLayout } from './App.jsx';


class ChartComponent extends React.Component {
    componentDidMount() {
        getData().then(data => {
            this.setState({ data })
        })
    }
    render() {
        if (this.state == null) {
            return <div>Loading...</div>
        }
        return (
            <Chart type="hybrid" data={this.state.data} />
        )
    }
}

render(
    <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
        <div id="container">
            <TrxLayout />
            <div id="trade-left">
                <TrxGrid />
                <TradeForm/>
            </div>
            <div id="trade-right">
                <ChartComponent />
            </div>
        </div>
    </MuiThemeProvider>
    , document.getElementById('root')
)
