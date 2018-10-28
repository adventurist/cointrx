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

const trxLogo = () => {
    return <div>
        <img id="trx-logo-img" height="64px" src="/static/images/logo.png"/>
    </div>
}

const menuItems =
// trx_env === 'LOCAL_DEVELOPMENT' ?
[{
    url: '/user',
    label: 'User Profile',
    icon: 'person'
},
{
    url: '/user/all',
    label: 'Users: All',
    icon: ''
},
{
    url: '/login',
    label: 'Login',
    icon: ''
},
{
    url: '/register',
    label: 'Register',
    icon: ''
},
{
    url: '/heartbeat/feed',
    label: 'Social Feed',
    icon: ''
},
{
    url: '/transaction/tx-gui',
    label: 'Transaction GUI',
    icon: ''
},
{
    url: '/regtest/all-users',
    label: 'Transaction GUI - All users',
    icon: ''
},
{
    url: '/admin/bot',
    label: 'Bot Interface',
    icon: ''
},
{
    url: '/prices/graph',
    label: 'BTC Price Graph',
    icon: 'trending_up'
}
]

// :

// [

// ]

/**
 *
 * @param {Array} menuItems An Array of menu item objects
 * @param {String} menuItems.url The URL for the menu item
 * @param {String} menuItems.label The Label for the menu item
 * @param {String} menuItems.icon The Icon for the menu item
 *
 */
const buildSideMenuItems = (menuItems) => {
    return menuItems.map( (item) => {
        return <Link href={item.url} label={item.label} icon={item.icon} />
    })
}

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
                <NavDrawer className='trx-side-nav' active={this.state.drawerActive} pinned={this.state.drawerPinned} permanentAt='xxxl'
                           onOverlayClick={this.toggleDrawerActive}>
                    <p id='trx-nav-paragraph'>
                        {buildSideMenuItems(menuItems)}
                    </p>
                </NavDrawer>
                <Panel>
                    <AppBar className="TrxAppBar"
                            id="trx-app-bar"
                            title={trxLogo()}
                            styleName="theme.AppBar"
                            theme={theme}
                            style={{backgroundColor: '#333333'}}
                            leftIcon="menu"
                            onLeftIconClick={this.toggleDrawerActive}>

                        <Navigation className='trx-appbar-nav' type='horizontal' style={{backgroundColor: '#333333'}}>
                            <div className="app-bar-icons">
                                <Link className="app-bar-icon app-bar-trade"
                                      href='/transaction/tx-gui' label='' icon='inbox'/>
                                <Link className="app-bar-icon app-bar-user"
                                      href='/user' active label=''>
                                    <Avatar
                                        src="sites/default/files/2017-09/X58Q4cA.jpg"/>
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
