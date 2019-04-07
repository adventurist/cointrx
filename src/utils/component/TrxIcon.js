import SvgIcon from '@material-ui/core/SvgIcon'
import { Component } from 'react';

export default class TrxIcon extends Component {
  render () {
    let fontSize
    switch (this.props.size) {
      case undefined && 'sm':
        fontSize = '24px'
        break
      case 'md':
        fontSize = '32px'
        break
      case 'lg':
        fontSize = '48px'
        break
      default:
        fontSize = '24px'
    }

    return (
      <SvgIcon style={{fontSize: fontSize}}>
        <svg style={{width: '24px', height: '24px'}} viewBox='0 0 24 24'>
          <path fill={this.props.color || "#000000"} d={this.props.path} />
        </svg>
      </SvgIcon>
    )
  }
}
