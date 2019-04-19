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
import Person from '@material-ui/icons/Person'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'

import InboxIcon from '@material-ui/icons/Inbox'
import MailIcon from '@material-ui/icons/Mail'
import CloseIcon from '@material-ui/icons/Close'
import MenuIcon from '@material-ui/icons/Menu'
import Notifications from '@material-ui/icons/Notifications'
import TradeIcon from '@material-ui/icons/StoreTwoTone'
import NotificationsActive from '@material-ui/icons/NotificationsActive'
import BasicIcon from '@material-ui/core/Icon'
import SvgIcon from '@material-ui/core/SvgIcon'

import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import Tooltip from '@material-ui/core/Tooltip'

const classes = {
    menuButton: 'menu-button',
    menuIcon: 'menu-icon',
    logoIcon: 'trx-logo-icon',
    logoButton: 'trx-logo-button'

}

const styles = {
    userMenu: {
        marginLeft: 'auto',
        display: 'flex'
    },
    bell: {
        marginLeft: 'auto',
        backgroundColor: '#00ccf5',
        flex: 1,
        marginTop: '10%',
        marginLeft: '24px'
    },
    userInfo: {
        flex: 1,
        minWidth: '80px',
        maxHeight: '64px!important',
        marginRight: '17px'
    }
}

const TRXLogo = () => {
    return (
    <div>
        <img id="trx-logo-img" height='64px' src="/static/images/logo.png"/>
    </div>)
}

const BellIcon = () => {
    return (<NotificationsActive className='bell' />)
}

const EmptyBellIcon = () => {
    return (<Notifications className='bell' />)
}


const menuItems = [
{
    url: '/',
    label: 'Trade',
    icon: 'tradeicon'
},
{
    url: '/user',
    label: 'Account settings',
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
    {   label: 'Account settings',
        url: '/user'  },
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
            notification: false,
            notificationMenuOpen: false,
            messages: [],
            userData: props.user || {},
            notificationAnchor: undefined
        };
    }

    componentWillReceiveProps (props) {
        if (props.drawerHandler) {
            this.drawerHandler = props.drawerHandler
        }
        if (props.messages) {
            this.setState({ messages: { ... this.state.messages, ... props.message } })
        }
        if (props.user) {
            this.setState({ userData: props.user })
        }
        if (props.notificationMessage) {
            this.setState({ messages: [ ... this.state.messages, props.notificationMessage ], notification: true })
        }
    }

    handleUserMenuClick = () => {
        this.setState({ userMenuOpen: !this.state.userMenuOpen })
    }

    handleUserMenuClose = () => {
        this.setState({ userMenuOpen: false })
    }

    handleNotificationMenuClick = e => {
        this.setState({ notificationAnchor: e.currentTarget, notificationMenuOpen: !this.state.notificationMenuOpen })
    }

    handleNotificationMenuClose = () => {
        this.setState({ notificationMenuOpen: false})
    }

    handleAllNotificationsRead = () => {
        this.setState({ notification: false })
    }

    render() {
        return (
<div>
<AppBar
    position="sticky"
    className='appbar'
    position='static'>
    <Toolbar disableGutters={!this.state.open} className='toolbar' title='Coin TRX'>
        <Tooltip title='Click to open the navigation drawer'><IconButton className={classes.menuBotton} onClick={this.props.drawerHandler}>
            <MenuIcon className={classes.menuIcon} />
        </IconButton>
        </Tooltip>
        <IconButton className={classes.logoButton} onClick={() => { window.location = '/' }}>
        <Link href='/'>
            <TRXLogo className={classes.logoIcon}/>
        </Link>
        </IconButton>
        <div style={styles.userMenu}>
        <UserInfo style={styles.userInfo} user={this.state.userData} />
        <NotificationMenu className='notification-menu' anchor={this.state.notificationAnchor} messages={this.state.messages} open={this.state.notificationMenuOpen} closeHandler={this.handleNotificationMenuClose} notifyAllMessagesRead={this.handleAllNotificationsRead} />
            <Tooltip title={this.state.notification ? 'You have unread notification messages' : 'You have no unread messages'} >
            <IconButton className='bell' onClick={this.handleNotificationMenuClick}> {
                this.state.notification ?
                    <BellIcon className='bell' style={styles.bell}></BellIcon> :
                <EmptyBellIcon className='bell' style={styles.bell}></EmptyBellIcon>
            }
            </IconButton>
            </Tooltip>
            <Tooltip title='User menu'>
            <IconButton className="user-menu-iconbutton" onClick={this.handleUserMenuClick}>
                        <Person />
            </IconButton>
            </Tooltip>

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
            open: props.open,
            messages: props.messages.map(message => new NotificationMessage(message)) || [{ label: 'No messages' }.map(message => new NotificationMessage(message))],
            anchorEl: props.anchor || undefined
        }
    }

    handleClose = () => {
        this.props.closeHandler()
        this.setState({ open: false })
    }

    handleNotificationClick = i => {
        const message = this.state.messages[i]
        message.read = true
        if (message.handler) {
            message.handler()
            this.handleClose()
        }
        this.setState({ messages: [ ...this.state.messages, message ]}, () => {
            if (!this.state.messages.find(message => !message.read)) {
                this.notifyAllMessagesRead()
            }
        })
    }

    notifyAllMessagesRead = () => {
        this.props.notifyAllMessagesRead()
    }

    componentWillReceiveProps (props) {
        if (props.open) {
            this.setState({ open: props.open })
        }
        if (props.messages) {
            this.setState({ messages: props.messages })
        }
        if (props.anchor) {
            this.setState( { anchorEl: props.anchor })
        }
    }

    render () {
        return (
    <Menu anchorEl={this.state.anchorEl}  anchorOrigin={{horizontal: 'right', vertical: 'top'}} open={this.state.open} onClose={this.handleClose}PaperProps={{
        style: {
            top: '16px',
            width: '50%',
            height: '80%'
        }}}
        >
        <Button onClick={this.handleClose} style={{float: 'right'}}size='small'>
            <CloseIcon />
        </Button>
                {this.state.messages.map((message, i) => (
                    <MenuItem className='notification-item-wrap' key={i} onClick={() => this.handleNotificationClick(i)}>
                    <Card className='notification-item'>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {message.text}
                            </Typography>
                        </CardContent>
                    </Card>
                     </MenuItem>
                ))}
            </Menu>
        )
    }
}

class UserInfo extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            user: props.user && props.user.user ? props.user.user : { balance: 0 } || { balance: 2}
        }
    }

    componentWillReceiveProps (props) {
        if (props.user) {
            this.setState({ user: props.user })
        }
    }

    render () {
        const style = {
            fontSize: '9pt',
            color: '#FFF'
        }
        return (
            <div>
            <Tooltip title='Balance summary'>
                <Card style={{maxHeight: '64px'}}>
                    <CardContent>
                        <Typography style={style} color="textSecondary" >
                            Welcome, {this.state.user.name}
                        </Typography>
                        <Typography style={style} color="textSecondary" >
                            {this.state.user.balance} BTC / {this.state.user.estimated} {this.state.user.currency}
                        </Typography>
                    </CardContent>
                </Card>
            </Tooltip>
            </div>
        )
    }
}

// class NotificationMessage extends React.Component {
//     render () {
//         return (
//             <Card>
//                 <CardContent>
//                     <Typography>
//                         {this.props.message}
//                     </Typography>
//                 </CardContent>
//             </Card>
//         )
//     }
// }

export class NotificationMessage {
    constructor (data) {
        this.text = data.text || ''
        this.handler = data.handler || undefined
        this.read = false
        this.url = data.url || undefined
    }
}