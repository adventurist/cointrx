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
import CloseIcon from '@material-ui/icons/Close'
import MenuIcon from '@material-ui/icons/Menu'
import BasicIcon from '@material-ui/core/Icon'
import SvgIcon from '@material-ui/core/SvgIcon'

import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'

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
        maxHeight: '64px!important'
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
            notification: false,
            notificationMenuOpen: false,
            messages: [],
            userData: props.user || {},
            notifcationAnchor: undefined
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
        <IconButton className={classes.menuBotton} onClick={this.props.drawerHandler}>
            <MenuIcon className={classes.menuIcon} />
        </IconButton>
        <IconButton className={classes.logoButton}>
            <TRXLogo className={classes.logoIcon}/>
        </IconButton>
        <div style={styles.userMenu}>
        <UserInfo style={styles.userInfo} user={this.state.userData} ></UserInfo>
        <NotificationMenu className='notification-menu' anchor={this.state.notificationAnchor} messages={this.state.messages} open={this.state.notificationMenuOpen} closeHandler={this.handleNotificationMenuClose} notifyAllMessagesRead={this.handleAllNotificationsRead} />
            <IconButton className='bell' onClick={this.handleNotificationMenuClick}> {
                this.state.notification ?
                <EmptyBellIcon onClick={this.handleNotificationMenuClick} className='bell' style={styles.bell}></EmptyBellIcon> :
                    <BellIcon onClick={this.handleNotificationMenuClick} className='bell' style={styles.bell}></BellIcon>
            }
            </IconButton>
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
            open: props.open,
            messages: props.messages.map(message => new NotificationMessage(message)) || [{label: 'test', url: 'test'}.map(message => new NotificationMessage(message))],
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
        console.log('NOTIFICATIONMENU', props)
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
            width: '85%',
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
        console.log('UserInfo props', props)
    }

    render () {
        const style = {
            fontSize: '9pt'
        }
        return (
            <div>
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