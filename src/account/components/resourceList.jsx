import {Component} from 'react'
import Collapse from '@material-ui/core/Collapse'
/* Lists & Menus */
import AccountIcon from '@material-ui/icons/AccountBalance'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'

const classes = {
  accountItem: 'account-item',
}

const styles = {
  listItemText: {
    fontSize: '0.35em',
  }
}

export default class ResourceList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedAccount: undefined,
      accountMenuItems: this.getMenuItems(),
      menuItems: this.getMenuItems(),
      open: false,
      expandOpen: false,
      type: undefined
    }
  }

  componentDidMount () {
    this.setState({menuItems: this.getMenuItems()})
  }

  componentWillReceiveProps (props) {
    // this.setState({accountMenuItems: this.getMenuItems(props.accounts)})
    this.setState({
      type: props.type,
      menuItems: this.getMenuItems(props.resources)
    })
  }

  buildAccountItem (account, i) {
    return (
      <ListItem onClick={this.props.resourceSelectHandler} className={classes.accountItem} value={i} key={i}>
          <ListItemText key={i} style={styles.listItemText} primary={
            account.id + ': ' + account.label || ''
          }/>
        </ListItem>
    )
  }

  buildBotItem (bot, i) {
    return (
      <ListItem onClick={this.props.resourceSelectHandler} className={classes.accountItem} value={i} key={i}>
          <ListItemText key={i} style={styles.listItemText} primary={
            bot.number + ': ' + bot.id.substr(0, 8) || ''
          }/>
        </ListItem>
    )
  }

  buildUserItem (user, i) {
    return (
      <ListItem onClick={this.props.resourceSelectHandler} className={classes.accountItem} value={i} key={i}>
          <ListItemText key={i} style={styles.listItemText} primary={
            user.id + ': ' + user.name || ''
          }/>
        </ListItem>
    )
  }

  getMenuItems (resources) {
    if (resources) {
      const items = []

      switch (this.state.type) {
        case 'accounts':
          for (let i = 0; i < resources.length; i++) {
            items.push(this.buildAccountItem(resources[i], i))
          }
          break

          case 'users':
          for (let i = 0; i < resources.length; i++) {
            items.push(this.buildUserItem(resources[i], i))
          }
          break

          case 'bots':
          for (let i = 0; i < resources.length; i++) {
            items.push(this.buildBotItem(resources[i], i))
          }
          break
      }
      return items
    }
  }

  accountClick = (e) => {
    this.setState({selectedAccount: e.currentTarget.value})
  }

  toggleCollapse = () => this.setState({open: !this.state.open})

  render () {
    return (
      <List id="account-select" value={this.state.selectedAccount}>
      <ListItem className={classes.accountItem} value={undefined} key={undefined}>
        <AccountIcon />
        <ListItemText primary='Select' onClick={this.toggleCollapse}/>
      </ListItem>
        <Collapse in={this.state.open}>
          {this.state.menuItems}
        </Collapse>
      </List>
    )
  }
}
