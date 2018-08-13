import React, {PropTypes} from 'react';
import {AppBar} from 'react-toolbox/lib/app_bar';
import {Layout, NavDrawer, Panel} from 'react-toolbox/lib/layout';
import Navigation from 'react-toolbox/lib/navigation';
import { Button } from 'react-toolbox';
import Link from 'react-toolbox/lib/link';
import Snackbar from 'material-ui/Snackbar';
import RaisedButton from 'material-ui/RaisedButton';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import theme from '../static/css/nav.css'

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
    }

    state = {
        drawerActive: false,
        drawerPinned: false,
        sidebarPinned: false
    };

    handleClick = () => {
        this.setState({
            open: true,
        });
    };

    handleRequestClose = () => {
        this.setState({
            open: false,
        });
    };

    toggleDrawerActive = () => {
        this.setState({
            drawerActive: !this.state.drawerActive
        });
    };

    toggleDrawerPinned = () => {
        this.setState({
            drawerPinned: !this.state.drawerPinned
        });
    }

    toggleSidebar = () => {
        this.setState({
            sidebarPinned: !this.state.sidebarPinned
        });
    };

    render() {
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                <Layout className="trx-mui-layout">
                    <NavDrawer active={this.state.drawerActive} pinned={this.state.drawerPinned} permanentAt='xxxl' onOverlayClick={this.toggleDrawerActive}>
                        <p>
                            buildSideMenuItems(menuItems)
                        </p>
                    </NavDrawer>
                    <Panel>

                        <AppBar styleName="theme.AppBar" theme={theme} leftIcon='menu' onLeftIconClick={this.toggleDrawerActive}>
                            <Navigation type='horizontal'>
                                <Link href='https://cointrx.com' label='Main' icon='inbox' />
                                <Link href='https://app.cointrx.com/prices/graph/json' active label='' icon='person' />
                            </Navigation>
                        </AppBar>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.8rem' }}>
                        </div>
                    </Panel>
                    <RaisedButton
                        onClick={this.handleClick}
                        label="Click for Snackbar"
                        className="raised-button"
                    />
                    <Snackbar
                        open={this.state.open}
                        message="Snack on this, bitch"
                        autoHideDuration={4000}
                        onRequestClose={this.handleRequestClose}
                    />
                </Layout>
            </MuiThemeProvider>)
    }
}

export default App
