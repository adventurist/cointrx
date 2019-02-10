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
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'

import InboxIcon from '@material-ui/icons/Inbox'
import MailIcon from '@material-ui/icons/Mail'
import MenuIcon from '@material-ui/icons/Menu'
import BasicIcon from '@material-ui/core/Icon'

const TRXLogo = () => {
    return (
    <div>
        <img id="trx-logo-img" height='96px' src="/static/images/logo.png"/>
    </div>)
}

const classes = {
    menuButton: 'menu-button',
    menuIcon: 'menu-icon',
    logoIcon: 'trx-logo-icon',
    logoButton: 'trx-logo-button'

}

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
        };
    }

    componentWillReceiveProps (props) {
        if (props.drawerHandler) {
            this.drawerHandler = props.drawerHandler
        }
    }

    render() {
        return (
<div>
<AppBar
    position="sticky"
    className='appbar'
    position='static'>
    <Toolbar disableGutters={!this.state.open} className='toolbar' title={TRXLogo()}>
        <IconButton className={classes.menuBotton} onClick={this.props.drawerHandler}>
            <MenuIcon className={classes.menuIcon} />
        </IconButton>
        <IconButton className={classes.logoButton}>
            <TRXLogo className={classes.logoIcon}/>
        </IconButton>
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
