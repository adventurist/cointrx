import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TablePagination from '@material-ui/core/TablePagination'
import TableRow from '@material-ui/core/TableRow'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'
import Checkbox from '@material-ui/core/Checkbox'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import DeleteIcon from '@material-ui/icons/Delete'
import FilterListIcon from '@material-ui/icons/FilterList'
import { lighten } from '@material-ui/core/styles/colorManipulator'
import { TradeType } from '../../utils/trade'

import { formatTimestamp } from '../../utils'

function desc(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }
  return 0
}

function stableSort(array, cmp) {
  const stabilizedThis = array.map((el, index) => [el, index])
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0])
    if (order !== 0) return order
    return a[1] - b[1]
  })
  return stabilizedThis.map(el => el[0])
}

function getSorting(order, orderBy) {
  return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy)
}

const rows = [
  { id: 'rate', numeric: true, disablePadding: true, label: 'Price per BTC' },
  { id: 'amount', numeric: true, disablePadding: false, label: '# of BTC' },
  { id: 'currency', numeric: false, disablePadding: false, label: 'Currency' },
  { id: 'end_date', numeric: false, disablePadding: false, label: 'Valid until' },
  { id: 'uid', numeric: true, disablePadding: false, label: 'User ID' },
  { id: 'type', numeric: false, disablePadding: false, label: 'Offer or Bid' },
]

class EnhancedTableHead extends React.Component {
  createSortHandler = property => event => {
    this.props.onRequestSort(event, property)
  }

  render() {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount } = this.props

    return (
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={numSelected === rowCount}
              onChange={onSelectAllClick}
            />
          </TableCell>
          {rows.map(
            row => (
              <TableCell
                key={row.idx}
                align={row.numeric ? 'right' : 'left'}
                padding={row.disablePadding ? 'none' : 'default'}
                sortDirection={orderBy === row.idx ? order : false}
              >
                <Tooltip
                  title="Sort"
                  placement={row.numeric ? 'bottom-end' : 'bottom-start'}
                  enterDelay={300}
                >
                  <TableSortLabel
                    active={orderBy === row.idx}
                    direction={order}
                    onClick={this.createSortHandler(row.idx)}
                  >
                    {row.label}
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
            ),
            this,
          )}
        </TableRow>
      </TableHead>
    )
  }
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
}

const toolbarStyles = theme => ({
  root: {
    paddingRight: theme.spacing.unit,
  },
  // highlight:
  //   theme.palette.type === 'light'
  //     ? {
  //         color: theme.palette.secondary.main,
  //         backgroundColor: lighten(theme.palette.secondary.light, 0.85),
  //       }
  //     : {
  //         color: theme.palette.text.primary,
  //         backgroundColor: theme.palette.secondary.dark,
  //       },
  // spacer: {
  //   flex: '1 1 100%',
  // },
  // actions: {
  //   color: theme.palette.text.secondary,
  // },
  // title: {
  //   flex: '0 0 auto',
  // },
})

let EnhancedTableToolbar = props => {
  const { numSelected, classes } = props

  return (
    <Toolbar
      className={classNames(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
    >
      <div className={classes.title}>
        {numSelected > 0 ? (
          <Typography color="inherit" variant="subtitle1">
            {numSelected} selected
          </Typography>
        ) : (
          <Typography variant="headline" id="tableTitle">
            Trades
          </Typography>
        )}
      </div>
      <div className={classes.spacer} />
      <div className={classes.actions}>
        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton aria-label="Delete">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Filter list">
            <IconButton aria-label="Filter list">
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </Toolbar>
  )
}

EnhancedTableToolbar.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
}

EnhancedTableToolbar = withStyles(toolbarStyles)(EnhancedTableToolbar)

const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
  },
  table: {
    minWidth: 1020,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
})

function prepareData (data) {
  return data.map((e, idx) => {
    return { ...e, idx: idx, key: idx }
  })
}

class EnhancedTable extends React.Component {
  state = {
    order: 'asc',
    orderBy: 'rate',
    selected: [],
    data: prepareData(this.props.trades) || [],
    page: 0,
    rowsPerPage: 5,
  }

  componentWillReceiveProps (props) {
    if (props.trades && this.state.data.length !== props.trades.length) {
      this.setState({ data: prepareData(props.trades), selected: [] })
    }
  }

  handleRequestSort = (event, property) => {
    const orderBy = property
    let order = 'desc'

    if (this.state.orderBy === property && this.state.order === 'desc') {
      order = 'asc'
    }

    this.setState({ order, orderBy })
  }

  handleSelectAllClick = event => {
    if (event.target.checked) {
      this.setState(state => ({ selected: state.data.map(n => n.id) }))
      return
    }
    this.setState({ selected: [] })
  }

  handleClick = (event, id) => {
    const { selected } = this.state
    const selectedIndex = selected.indexOf(id)
    let newSelected = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      )
    }

    if (this.props.selectedTradesHandler) {
      if (!this.props.selectedTradesHandler(newSelected.map(idx => this.state.data.find(trade => trade.idx === idx)))) {
        return
      }
    }
    this.setState({ selected: newSelected })
  }

  handleChangePage = (event, page) => {
    this.setState({ page })
  }

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value })
  }

  isSelected = id => this.state.selected.indexOf(id) !== -1

  render() {
    const classes = {
      root: 'trade-table-root',
      tableWrapper: 'table-wrap',

    }
    const { data, order, orderBy, selected, rowsPerPage, page } = this.state
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage)

    return (
      <Paper className={classes.root}>
        <EnhancedTableToolbar numSelected={selected.length} />
        <div style={{width: '70%'}} className={classes.tableWrapper}>
          <Table className={classes.table} aria-labelledby="tableTitle">
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={this.handleSelectAllClick}
              onRequestSort={this.handleRequestSort}
              rowCount={data.length}
            />
            <TableBody>
              {stableSort(data, getSorting(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(n => this.tradeRow(n))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 49 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          backIconButtonProps={{
            'aria-label': 'Previous Page',
          }}
          nextIconButtonProps={{
            'aria-label': 'Next Page',
          }}
          onChangePage={this.handleChangePage}
          onChangeRowsPerPage={this.handleChangeRowsPerPage}
        />
      </Paper>
    )
  }

  tradeRow = (trade) => {
    const isSelected = this.isSelected(trade.idx)
    if (trade.type === TradeType.BID) {
      return (
        <TableRow
          hover
          onClick={event => this.handleClick(event, trade.idx)}
          role="checkbox"
          aria-checked={isSelected}
          tabIndex={-1}
          key={trade.idx}
          selected={isSelected}
        >
          <TableCell padding="checkbox">
            <Checkbox checked={isSelected} />
          </TableCell>
          <TableCell component="th" scope="row" padding="none">
            {trade.offer.rate}
          </TableCell>
          <TableCell align="right">{trade.offer.amount}</TableCell>
          <TableCell align="right">{trade.offer.currency}</TableCell>
          <TableCell align="right">{formatTimestamp(trade.offer.end_date)} UTC</TableCell>
          <TableCell align="right">{trade.offer.uid}</TableCell>
          <TableCell align="right">{trade.offer.type}</TableCell>
        </TableRow>)
    } else if (trade.type === TradeType.OFFER) {
      return (
        <TableRow
          hover
          onClick={event => this.handleClick(event, trade.idx)}
          role="checkbox"
          aria-checked={isSelected}
          tabIndex={-1}
          key={trade.idx}
          selected={isSelected}
        >
          <TableCell padding="checkbox">
            <Checkbox checked={isSelected} />
          </TableCell>
          <TableCell component="th" scope="row" padding="none">
            {trade.bid.rate}
          </TableCell>
          <TableCell align="right">{trade.bid.amount}</TableCell>
          <TableCell align="right">{trade.bid.currency}</TableCell>
          <TableCell align="right">{formatTimestamp(trade.bid.end_date)} UTC</TableCell>
          <TableCell align="right">{trade.bid.uid}</TableCell>
          <TableCell align="right">{trade.bid.type}</TableCell>
        </TableRow>)
    }
  }
}

EnhancedTable.propTypes = {
  classes: PropTypes.object.isRequired,
  bids: PropTypes.array.isRequired
}

export default withStyles(styles)(EnhancedTable)

