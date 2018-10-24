import React, {PropTypes} from 'react';
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Drawer from '@material-ui/core/Drawer'

import Link from 'react-toolbox/lib/link';
import Avatar from '@material-ui/core/Avatar';
import IconMenu from 'material-ui/IconMenu';
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'

import InboxIcon from '@material-ui/icons/Inbox'
import MailIcon from '@material-ui/icons/Mail'

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

/**
 *
 * @param {Array} menuItems An Array of menu item objects
 * @param {String} menuItems.url The URL for the menu item
 * @param {String} menuItems.label The Label for the menu item
 * @param {String} menuItems.icon The Icon for the menu item
 *
 */
const buildSideMenuItems = (menuItems) => {
    const children = []
    for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i]
        children.push(
            <ListItem button key={i}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label}/>
                <Link href={item.url} />
            </ListItem>
        )
    }
}

// const sideList = (
//     <div className='side-list-example'>
//       <List>
//         {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
//           <ListItem button key={text}>
//             <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
//             <ListItemText primary={text} />
//           </ListItem>
//         ))}
//       </List>
//       <Divider />
//       <List>
//         {['All mail', 'Trash', 'Spam'].map((text, index) => (
//           <ListItem button key={text}>
//             <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
//             <ListItemText primary={text} />
//           </ListItem>
//         ))}
//       </List>
//     </div>
//   )

  class TRXDrawer extends React.Component {

    constructor (props) {
        super(props)
        this.state = { open: false }
    }

    toggleOpen = () => {
        this.setState({ open: !this.state.open })
    }

    render () {
        return (<div>
            <h1>I'M RIGHT FUCKING HERE</h1>
            <Drawer open={this.state.open} onClose={this.toggleOpen}>
                <div tabIndex={0} role="button" onClick={this.toggleOpen} onKeyDown={this.toggleOpen}>
                    <List>
                        {buildSideMenuItems(menuItems)}
                    </List>
                </div>
            </Drawer>
            </div>
        )
    }
}
// const drawer = (
//     <div>
//       <div className={classes.toolbar} />
//       <Divider />
//       <List>
//         {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
//           <ListItem button key={text}>
//             <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
//             <ListItemText primary={text} />
//           </ListItem>
//         ))}
//       </List>
//       <Divider />
//       <List>
//         {['All mail', 'Trash', 'Spam'].map((text, index) => (
//           <ListItem button key={text}>
//             <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
//             <ListItemText primary={text} />
//           </ListItem>
//         ))}
//       </List>
//     </div>
//   );

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

    toggleMenu = () => {
        this.setState({
            open: !this.state.open,
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
<div>
<AppBar
    position="sticky"
    className='appbar'>
    <Toolbar disableGutters={!this.state.open} className='toolbar'>
    <Avatar src="https://vignette.wikia.nocookie.net/fictspedia/images/2/23/Killer_frog.jpg"/>
    <div className='trx-appbar-nav' style={{backgroundColor: '#333333'}}>
        <div className="app-bar-icons">
            <Link className="app-bar-icon app-bar-trade"
                    href='/transaction/tx-gui' label='' icon='inbox'/>
            <Link className="app-bar-icon app-bar-user"
                    href='/user' active label=''>
                <Avatar
                    src="sites/default/files/2017-09/X58Q4cA.jpg"/>
            </Link>
            <Menu open={this.state.open} onClick={this.toggleMenu} className="app-bar-icon app-bar-user-menu" href="#">
                <div className="user-menu">
                    <Link className="user-logout" href="/logout">
                        <MenuItem>Log Out</MenuItem>
                    </Link>
                </div>
            </Menu>
        </div>
    </div>
    </Toolbar>
</AppBar>
</div>
        )
    }
}
