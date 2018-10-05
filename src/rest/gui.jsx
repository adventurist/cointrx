/* React */
import * as React from 'react'
import { Panel } from 'react-toolbox'

/* Menu */
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'

const routeMap = JSON.parse(routes.replace(/'/g, '"'))
console.log(routeMap)
const styles = {
  rest: {
    width: '100%'
  }
}


/**
 * Helper method for building the File Menu
 * @param {Array} files
 */
const buildPathItems = (paths) => {
  const items = []
  items.push(<MenuItem value={undefined} key={undefined} primaryText={`Select Path`} />)
  for ( let i = 0; i < paths.length; i++) {
      items.push(<MenuItem value={i} key={i} primaryText={`${i + 1}`}>{paths[i].path}</MenuItem>)
  }
  return items
}

export class RestGui extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedPath: undefined,
      pathMenuItems: buildPathItems(routeMap)
    }
  }

  handlePathSelect (event, index, value) {
    this.setState({selectedPath: value})
    console.log('Selected path changed to ' + value)
  }

  render () {
    return (
      <div id='container'>
        <h1>I love InYoung!</h1>
        <Panel id="rest-panel" className="rest-panel">
        <DropDownMenu id="path-select" maxHeight={300} value={this.state.selectedPath} onChange={this.handlePathSelect}>
                    {this.state.pathMenuItems}
        </DropDownMenu>
      </div>
    )
  }
}
