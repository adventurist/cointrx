import SvgIcon from '@material-ui/core/SvgIcon'
import { Component } from 'react';

export default class TrxIcon extends Component {
  render () {
    return (
      <SvgIcon>
        <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24">
          <path fill="#000000" d={this.props.path} />
        </svg>
      </SvgIcon>
    )
  }
}
