import { Component } from 'react'
import TrxAppBar from './TrxAppBar2.jsx'
import TrxDrawer from './TrxDrawer'

export default class TrxNavigation extends Component {
  state = {
    open: false
  }

  drawerHandler = () => {
    this.setState({ open: !this.state.open })
  }

  render () {
    return (
      <div>
        <TrxAppBar user={this.props.user} drawerHandler={this.drawerHandler} />
        <TrxDrawer drawerHandler={this.drawerHandler} open={this.state.open} />
      </div>
    )
  }
}