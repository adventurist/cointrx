import { Component, createRef } from 'react'
import TextField from '@material-ui/core/TextField'
import { formatTimestamp } from '../../utils'

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
		this.logArea = createRef()
	}

	componentDidMount () {
		if (this.props.message) {
			this.consoleOut(this.props.message)
		}
	}

	componentWillReceiveProps (props) {
		if (props.message) {
			this.consoleOut(props.message)
		}
	}

	componentDidUpdate() {
    this.logArea.current.scrollTop = this.logArea.current.scrollHeight;
	}

	/**
	 * Exposed method for printing to the console visible to the
	 * user in their GUI
	 *
	 * @param {String} incomingText
	 */
	consoleOut (incomingText) {
		const time = formatTimestamp(Date.now(), true)

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
					multiline={true}
					className='console-out'
					inputRef={this.logArea}
					rows={3}
					rowsMax={3}
					style={styles.console}
					hintText='Console'
					spellCheck={false}
					value={this.state.consoleText}
					onChange={this.handleConsoleChange}
						/>
			</div>
		)
	}
}

