import React, {PropTypes} from 'react';
import {AppBar} from 'react-toolbox/lib/app_bar';
import {Layout, NavDrawer, Panel} from 'react-toolbox/lib/layout';
import Navigation from 'react-toolbox/lib/navigation';
import { Button } from 'react-toolbox';
import Link from 'react-toolbox/lib/link';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import theme from '../../static/css/nav.css'
import Input from 'react-toolbox/lib/input';
import NumberPicker from 'semantic-ui-react-numberpicker';


class InputTest extends React.Component {


    state = { name: '', phone: '', email: '', hint: '', orderLimit: 0 , numberPickerValue: 0};

    handleChange = (name, value) => {
        this.setState({...this.state, [name]: value});
    };

    updateNumberPicker= (e) => {
    /*
     * The value is expected as string to avoid warnings
     * append an empty string to your possibly numberic value
     */
        this.setState({numberPickerValue: e.value + ''});
    }

    render () {
            return (
                <section>
                    <NumberPicker name="numberPicker" value={this.state.numberPickerValue} onChange={this.updateNumberPicker} />
                {/*<Input type='text' label='Name' name='name' value={this.state.name} onChange={this.handleChange.bind(this, 'name')} maxLength={16 } />*/}
                {/*<Input type='text' label='Disabled field' disabled />*/}
                {/*<input id="orderLimit" type="number" value="0" step="1" onChange={this.handleChange.bind(this, 'orderLimit')} />*/}
                {/*<Input type='tel' label='Phone' name='phone' icon='phone' value={this.state.phone} onChange={this.handleChange.bind(this, 'phone')} />*/}
                {/*<Input type='text' value={this.state.hint} label='Required Field' hint='With Hint' required onChange={this.handleChange.bind(this, 'hint')} icon={<span>J</span>} />*/}
            </section>
        );
    }
}



class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
    }

    state = {
        drawerActive: false,
        drawerPinned: false,
        sidebarPinned: false
    };

    handleClick = () => {
        this.setState({
            open: true,
        });
    };

    handleRequestClose = () => {
        this.setState({
            open: false,
        });
    };

    toggleDrawerActive = () => {
        this.setState({
            drawerActive: !this.state.drawerActive
        });
    };

    toggleDrawerPinned = () => {
        this.setState({
            drawerPinned: !this.state.drawerPinned
        });
    }

    toggleSidebar = () => {
        this.setState({
            sidebarPinned: !this.state.sidebarPinned
        });
    };

    render() {
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                <Layout className="trx-mui-layout">
                    {/*<NavDrawer active={this.state.drawerActive} pinned={this.state.drawerPinned} permanentAt='xxxl' onOverlayClick={this.toggleDrawerActive}>*/}
                        {/*<p>*/}
                            {/*<Link href='https://app.cointrx.com/regtest/all-users' label='TX Test Interface' icon='bug_report' />*/}
                            {/*<Link href='https://app.cointrx.com/prices/graph' active label='D3 Graphs' icon='trending_up' />*/}
                        {/*</p>*/}
                    {/*</NavDrawer>*/}
                    {/*<Panel>*/}
                        {/*<AppBar styleName="theme.AppBar" theme={theme} leftIcon='menu' onLeftIconClick={this.toggleDrawerActive}>*/}
                            {/*<Navigation type='horizontal'>*/}
                                {/*<Link href='https://cointrx.com' label='Main' icon='inbox' />*/}
                                {/*<Link href='https://app.cointrx.com/prices/graph/json' active label='' icon='person' />*/}
                            {/*</Navigation>*/}
                        {/*</AppBar>*/}
                        {/*<div style={{ flex: 1, overflowY: 'auto', padding: '1.8rem' }}>*/}
                        {/*</div>*/}
                    {/*</Panel>*/}

                    <InputTest />
                </Layout>
            </MuiThemeProvider>)
    }
}

export default App
