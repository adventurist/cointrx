import React, {PropTypes} from 'react';
import {AppBar} from 'react-toolbox/lib/app_bar';
import {Layout, NavDrawer, Panel} from 'react-toolbox/lib/layout';
import Navigation from 'react-toolbox/lib/navigation';
import * as theme from '../static/css/nav.css'
import Link from 'react-toolbox/lib/link';
import Avatar from 'material-ui/Avatar';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';


export class TrxNav extends React.Component {
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
    }

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
            <Layout className="trx-mui-layout">
                <NavDrawer active={this.state.drawerActive} pinned={this.state.drawerPinned} permanentAt='xxxl'
                           onOverlayClick={this.toggleDrawerActive}>
                    <p>
                        <Link href='https://app.cointrx.com/regtest/all-users' label='TX Test Interface'
                              icon='bug_report'/>
                        <Link href='https://app.cointrx.com/prices/graph' active label='D3 Graphs' icon='trending_up'/>
                    </p>
                </NavDrawer>
                <Panel>
                    <AppBar className="TrxAppBar"
                            title="Coin TRX"
                            styleName="theme.AppBar"
                            theme={theme}
                            leftIcon='menu'
                            onLeftIconClick={this.toggleDrawerActive}>

                        <Navigation className='trx-appbar-nav' type='horizontal'>
                            <div className="app-bar-icons">
                                <Link className="app-bar-icon app-bar-trade"
                                      href='/transaction/tx-gui' label='' icon='inbox'/>
                                <Link className="app-bar-icon app-bar-user"
                                      href='/user' active label=''>
                                    <Avatar
                                        src="https://cointrx.com/sites/default/files/2017-09/X58Q4cA.jpg"
                                        size={30}/>
                                </Link>
                                <Link className="app-bar-icon app-bar-user-menu"
                                      href="#">
                                    <IconMenu className="user-menu"
                                              iconButtonElement={<IconButton className="user-menu-iconbutton">
                                                  <MoreVertIcon />
                                              </IconButton>}
                                              anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                                              targetOrigin={{horizontal: 'right', vertical: 'top'}}>
                                        <Link className="user-logout"
                                              href="/logout"><MenuItem primaryText="Log Out"/></Link>
                                    </IconMenu>
                                </Link>
                            </div>
                        </Navigation>
                    </AppBar>
                </Panel>
            </Layout>
        )
    }
}
