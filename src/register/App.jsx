import React, {PropTypes} from 'react';
import {Layout, NavDrawer, Panel} from 'react-toolbox/lib/layout';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Slider from 'react-rangeslider'

// class Slider extends React.Component {
//     constructor(props) {
//         super(props)
//         this.state = {value: 0}
//         this.updateSlider = this.updateSlider.bind(this)
//     }
//
//     updateSlider = (e) => {
//         this.setState({value: e.value})
//     }
//
//     render () {
//         return (
//             <div className="slidecontainer">
//
//                 <input type="range" min="0" max="100" onChange={this.updateSlider} id="myRange" className="trx-slider"/>
//                 <input id="number" type="number" value={this.state.value} />
//
//
//             </div>
//             )
//     }
// }

class VolumeSlider extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.state = {
            volume: 0
        }
    }

    handleOnChange = (value) => {
        this.setState({
            volume: value
        })
    }

    render() {
        let { volume } = this.state
        return (
            <Slider
                value={volume}
                orientation="vertical"
                onChange={this.handleOnChange}
            />
        )
    }
}

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    state = {

    };


    render() {
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                <Layout className="trx-register-layout">
                    <VolumeSlider />
                </Layout>
            </MuiThemeProvider>)
    }
}

export default App
