import React, {PropTypes} from 'react';
import {AppBar} from 'react-toolbox/lib/app_bar';
import {Layout, NavDrawer, Panel} from 'react-toolbox/lib/layout';
import Link from 'react-toolbox/lib/link';
import theme from '../static/css/nav.css'

class App extends React.Component {
    state = {
        drawerActive: false,
        drawerPinned: false,
        sidebarPinned: false
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
            <Layout>
                <NavDrawer active={this.state.drawerActive} pinned={this.state.drawerPinned} permanentAt='xxxl' onOverlayClick={this.toggleDrawerActive}>
                    <p>
                        <Link href='https://app.cointrx.com/regtest/all-users' label='TX Test Interface' icon='bug_report' />
                        <Link href='https://app.cointrx.com/prices/graph' active label='D3 Graphs' icon='trending_up' />
                    </p>
                </NavDrawer>
                <Panel>

                    <AppBar styleName="theme.AppBar" theme={theme} leftIcon='menu' onLeftIconClick={this.toggleDrawerActive}>
                    </AppBar>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.8rem' }}>
                        <p>Welcome to Coin TRX</p>
                    </div>
                </Panel>
            </Layout>
        );
    }
}

export default App;
