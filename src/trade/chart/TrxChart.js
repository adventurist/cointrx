/* React */
import { Component } from 'react'
/* React Stockchart */
import Chart from './Chart'
/* Parsing utilities */
import { getJson } from './utils/Utils'

export default class TrxChart extends Component {

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    getJson().then(data => {
        this.setState({ data })
    })
  }

  render() {
    if (this.state == null) {
        return <div>Loading, please wait...</div>
    }
    return (
        <Chart type="hybrid" data={this.state.data} />
    )
  }
}
