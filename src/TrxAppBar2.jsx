import React, {PropTypes} from 'react'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Drawer from '@material-ui/core/Drawer'

import Link from 'react-toolbox/lib/link'
import Avatar from '@material-ui/core/Avatar'
import IconMenu from 'material-ui/IconMenu'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import IconButton from '@material-ui/core/IconButton'
import MoreVertIcon from '@material-ui/icons/MoreVert'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'

import InboxIcon from '@material-ui/icons/Inbox'
import MailIcon from '@material-ui/icons/Mail'
import MenuIcon from '@material-ui/icons/Menu'
import BasicIcon from '@material-ui/core/Icon'
import SvgIcon from '@material-ui/core/SvgIcon'

const classes = {
    menuButton: 'menu-button',
    menuIcon: 'menu-icon',
    logoIcon: 'trx-logo-icon',
    logoButton: 'trx-logo-button'

}

const styles = {
    userMenu: {
        marginLeft: 'auto'
    },
    bell: {
        marginLeft: 'auto',
        backgroundColor: '#00ccf5'
    }
}

const TRXLogo = () => {
    return (
    <div>
        <img id="trx-logo-img" height='64px' src="/static/images/logo.png"/>
    </div>)
}

const BellIcon = () => {
    return (<SvgIcon className='bell'>
        <svg style={{width:'24px', height: '24px'}} viewBox="0 0 24 24">
            <path fill="#000000" d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21" />
        </svg>
    </SvgIcon>
)}


const EmptyBellIcon = () => {
    return (<SvgIcon className='bell'>
        <svg style={{width:'24px', height: '24px'}} viewBox="0 0 24 24">
            <path fill="#000000" d="M16,17H7V10.5C7,8 9,6 11.5,6C14,6 16,8 16,10.5M18,16V10.5C18,7.43 15.86,4.86 13,4.18V3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5V4.18C7.13,4.86 5,7.43 5,10.5V16L3,18V19H20V18M11.5,22A2,2 0 0,0 13.5,20H9.5A2,2 0 0,0 11.5,22Z" />
        </svg>
    </SvgIcon>
)}

const menuItems = [
{
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

const userMenuItems = [
    {   label: 'Logout',
        url: '/logout'  }
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

export default class TrxNav extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            userMenuOpen: false,
            notification: true,
            notificationMenuOpen: false,
            messages: [{label: 'Important', url: '/nowhere'}]
        };
    }

    componentWillReceiveProps (props) {
        if (props.drawerHandler) {
            this.drawerHandler = props.drawerHandler
        }
        if (props.messages) {
            this.setState({ messages: { ... this.state.messages, ... props.message } })
        }
    }

    handleUserMenuClick = () => {
        this.setState({ userMenuOpen: !this.state.userMenuOpen })
    }

    handleUserMenuClose = () => {
        this.setState({ userMenuOpen: false })
    }

    handleNotificationMenuClick = () => {
        this.setState({ notificationMenuOpen: !this.state.notificationMenuOpen })
    }

    render() {
        return (
<div>
<AppBar
    position="sticky"
    className='appbar'
    position='static'>
    <Toolbar disableGutters={!this.state.open} className='toolbar' title='Coin TRX'>
        <IconButton className={classes.menuBotton} onClick={this.props.drawerHandler}>
            <MenuIcon className={classes.menuIcon} />
        </IconButton>
        <IconButton className={classes.logoButton}>
            <TRXLogo className={classes.logoIcon}/>
        </IconButton>
        <div style={styles.userMenu}>
            {
                this.state.notification ?
                    <BellIcon onClick={this.handleNotificationMenuClick} className='bell' style={styles.bell}> <NotificationMenu messages={this.state.messages} open={this.state.notificationMenuOpen} /> </BellIcon> :
                    <EmptyBellIcon onClick={this.handleNotificationMenuClick} className='bell' style={styles.bell}> <NotificationMenu messages={this.state.messages} open={this.state.notificationMenuOpen} /></EmptyBellIcon>
            }
            <IconButton className="user-menu-iconbutton" onClick={this.handleUserMenuClick}>
                        <MoreVertIcon />
            </IconButton>

            <Menu open={this.state.userMenuOpen} onClose={this.handleUserMenuClose} PaperProps={{
            style: {
                maxHeight: 48 * 4.5,
                width: 200
            }}}
            className="user-menu" anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                targetOrigin={{horizontal: 'right', vertical: 'top'}} getContentAnchorEl={null}>
                {userMenuItems.map(option => (
                    <MenuItem key={option.label} selected={option === 'logout'} onClick={this.handleClose}>
                        <Link href={option.url}>{option.label}</Link>
                    </MenuItem>
                ))}
            </Menu>
        </div>
    </Toolbar>
</AppBar>
</div>
        )
    }
}

const logoIcon = () => {
    return (
        <BasicIcon className={classes.logoIcon} hidden={false}>
            <TRXLogo />
        </BasicIcon>
    )
}


class NotificationMenu extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            open: props.open || false,
            messages: props.messages || []
        }
    }

    handleClose = () => {
        this.setState({ open: false })
    }

    render () {
        return (
            <Menu open={this.state.open} onClose={this.handleClose} PaperProps={{
                style: {
                    maxHeight: 48 * 4.5,
                    width: 200
                }}}>
                {this.state.messages.map(option => (
                    <MenuItem key={option.label} onClick={this.handleClose}>
                        <Link href={option.url}>{option.label}</Link>
                    </MenuItem>
                ))}
            </Menu>
        )
    }
}