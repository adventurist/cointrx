import { Component } from 'react'

export default class Console extends Component {

	constructor(props) {
		super(props)
		this.state = {
			consoleText: ''
		}
	}

	render () {
		return (	
	<TextField
			multiLine={true}
			rows={12}
			rowsMax={12}
			hintText='Console'
			value={this.state.consoleText}
			onChange={this.handleConsoleChange}
		    />
		)
	}
}

