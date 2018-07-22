/* React */
import * as React from 'react'

const styles = {
  rest: {
    width: '100%'
  }
}

class RestGui extends React.Component {
  constructor (props) {
    super(props)
    this.state = {

    }
  }

  render () {
    return (
      <div id='container' style={styles.rest} >
        <h1>I love InYoung!</h1>
      </div>
    )
  }
}
