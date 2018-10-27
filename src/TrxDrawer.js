import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import PersonIcon from '@material-ui/icons/Person';
import PeopleIcon from '@material-ui/icons/People';
import SvgIcon from '@material-ui/core/SvgIcon';

export const LoginIcon = () => {
  return (
    <SvgIcon>
      <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24">
        <path fill="#000000" d="M10,17.25V14H3V10H10V6.75L15.25,12L10,17.25M8,2H17A2,2 0 0,1 19,4V20A2,2 0 0,1 17,22H8A2,2 0 0,1 6,20V16H8V20H17V4H8V8H6V4A2,2 0 0,1 8,2Z" />
      </svg>
    </SvgIcon>

  )
}

export const RegisterIcon = () => {
  return (
    <SvgIcon>
      <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24">
        <path fill="#000000" d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M6,10V7H4V10H1V12H4V15H6V12H9V10M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12Z" />
      </svg>
    </SvgIcon>
  )
}

export const TimelineIcon = () => {
  return (
    <SvgIcon>
      <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24">
        <path fill="#000000" d="M5,2V8H3V2H5M3,22H5V16H3V22M6,12A2,2 0 0,0 4,10A2,2 0 0,0 2,12A2,2 0 0,0 4,14A2,2 0 0,0 6,12M22,7V17A2,2 0 0,1 20,19H11A2,2 0 0,1 9,17V14L7,12L9,10V7A2,2 0 0,1 11,5H20A2,2 0 0,1 22,7Z" />
      </svg>
    </SvgIcon>
  )
}

export const TimelineIcon2 = () => {
  return (
    <SvgIcon>
      <svg style={{width:'24px',height:'24px'}} viewBox="0 0 24 24">
    <path fill="#000000" d="M15,14V11H18V9L22,12.5L18,16V14H15M14,7.7V9H2V7.7L8,4L14,7.7M7,10H9V15H7V10M3,10H5V15H3V10M13,10V12.5L11,14.3V10H13M9.1,16L8.5,16.5L10.2,18H2V16H9.1M17,15V18H14V20L10,16.5L14,13V15H17Z" />
</svg>
    </SvgIcon>
  )
}

export const BotIcon = () => {
  return(
    <SvgIcon>
      <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24">
        <path fill="#000000" d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z" />
      </svg>
    </SvgIcon>
  )
}

export const TransactionIcon = () => {
  return(
    <SvgIcon>
      <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24">
        <path fill="#000000" d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z" />
      </svg>
    </SvgIcon>
  )
}

export const TrendsIcon = () => {
  return(
    <SvgIcon>
      <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24">
        <path fill="#000000" d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z" />
      </svg>
    </SvgIcon>
  )
}

export const UserListIcon = () => {
  return(
    <SvgIcon>
      <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24">
        <path fill="#000000" d="M16,13C15.71,13 15.38,13 15.03,13.05C16.19,13.89 17,15 17,16.5V19H23V16.5C23,14.17 18.33,13 16,13M8,13C5.67,13 1,14.17 1,16.5V19H15V16.5C15,14.17 10.33,13 8,13M8,11A3,3 0 0,0 11,8A3,3 0 0,0 8,5A3,3 0 0,0 5,8A3,3 0 0,0 8,11M16,11A3,3 0 0,0 19,8A3,3 0 0,0 16,5A3,3 0 0,0 13,8A3,3 0 0,0 16,11Z" />
      </svg>
    </SvgIcon>
  )
}

const styles = {
  list: {
    width: 250,
  },
  fullList: {
    width: 'auto',
  },
};

const menuItems =
// trx_env === 'LOCAL_DEVELOPMENT' ?
[{
    url: '/user',
    label: 'User Profile',
    icon: <PersonIcon />
},
{
    url: '/user/all',
    label: 'Users: All',
    icon: <PeopleIcon />
},
{
    url: '/login',
    label: 'Login',
    icon: <LoginIcon/>
},
{
    url: '/register',
    label: 'Register',
    icon: <RegisterIcon/>
},
{
    url: '/heartbeat/feed',
    label: 'Social Feed',
    icon: <TimelineIcon/>
},
{
    url: '/transaction/tx-gui',
    label: 'Transaction GUI',
    icon: <TransactionIcon/>
},
{
    url: '/regtest/all-users',
    label: 'Transaction GUI - All users',
    icon: <UserListIcon/>
},
{
    url: '/admin/bot',
    label: 'Bot Interface',
    icon: <BotIcon/>
},
{
    url: '/prices/graph',
    label: 'BTC Price Graph',
    icon: <TrendsIcon/>
}
]

const buildSideMenuItems = (menuItems) => {
  const children = []
  for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i]
      children.push(
          <ListItem button key={i}>
            <a href={item.url}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label}/>
            </a>
          </ListItem>
      )
  }
  return children
}

class TemporaryDrawer extends React.Component {
  state = {
    top: false,
    left: false,
    bottom: false,
    right: false,
  };

  toggleDrawer = (side, open) => () => {
    this.setState({
      [side]: open,
    });

    if (this.drawerStateHandler) {
      this.drawerStateHandler(open)
    }
  };

  handleOpenDrawer = () => {
    this.setState({
      left: true
    })
  }

  handleCloseDrawer = () => {
    this.setState({
      left: false
    })
  }

  componentWillReceiveProps (props) {
    this.setState({left: props.open})

    if (props.drawerStateHandler) {
      this.drawerStateHandler = props.drawerStateHandler
    }
  }

  render() {
    const { classes } = this.props;

    const sideList = (
      <div className='sidelist'>
        <List>
          {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {['All mail', 'Trash', 'Spam'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </div>
    );

    const fullList = (
      <div className='fulllist'>
        <List>
          {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {['All mail', 'Trash', 'Spam'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </div>
    );

    return (
      <div>
        <Drawer open={this.state.left} onClose={this.toggleDrawer('left', false)}>
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer('left', false)}
            onKeyDown={this.toggleDrawer('left', false)}
          >
            {buildSideMenuItems(menuItems)}
          </div>
        </Drawer>
        <Drawer anchor="top" open={this.state.top} onClose={this.toggleDrawer('top', false)}>
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer('top', false)}
            onKeyDown={this.toggleDrawer('top', false)}
          >
            {fullList}
          </div>
        </Drawer>
        <Drawer
          anchor="bottom"
          open={this.state.bottom}
          onClose={this.toggleDrawer('bottom', false)}
        >
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer('bottom', false)}
            onKeyDown={this.toggleDrawer('bottom', false)}
          >
            {fullList}
          </div>
        </Drawer>
        <Drawer anchor="right" open={this.state.right} onClose={this.toggleDrawer('right', false)}>
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer('right', false)}
            onKeyDown={this.toggleDrawer('right', false)}
          >
            {buildSideMenuItems(menuItems)}
          </div>
        </Drawer>
      </div>
    );
  }
}

export default withStyles(styles)(TemporaryDrawer);
