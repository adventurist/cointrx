import { Component } from 'react'
import TextField from '@material-ui/core/TextField'

const styles = {
	console: {
		backgroundColor: '#000',
		width: '100%'
	}
}
export default class Console extends Component {

	constructor(props) {
		super(props)
		this.state = {
			consoleText: ''
		}
		if (props.message) {
			this.consoleOut(props.message)
		}
	}

	componentWillReceiveProps (props) {
		if (props.message) {
			this.consoleOut(props.message)
		}
	}

	/**
	 * Exposed method for printing to the console visible to the
	 * user in their GUI
	 *
	 * @param {String} incomingText
	 */
	consoleOut (incomingText) {
		const time = Date.now().toString().slice(0, -3)

		const textArr = this.state.consoleText.split('\n')
		if (textArr.length > 11) {
				textArr.splice(0, 1)
		}
		this.setState({consoleText: `${textArr.join('\n')}\n${time} - ${incomingText}`})
	}

	/**
     * Helper function to make printing to the console possible
     */
    handleConsoleChange = (event, index, value) => {
			this.setState({consoleText: value})
	}

	render () {
		return (
		<div>
			<TextField
					multiLine={true}
					className='console-out'
					rows={12}
					rowsMax={	12}
					style={styles.console}
					hintText='Console'
					value={this.state.consoleText}
					onChange={this.handleConsoleChange}
						/>
			</div>
		)
	}
}

