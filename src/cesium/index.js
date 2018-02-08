const path = require('path');
//noinspection JSUnresolvedVariable
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import HellowWorldApp from './js/test/render.js';
import CesiumApp from './js/cesium.js';

const activate = () => { console.log('activated'); }

function component() {
    let element = document.createElement('div');
    element.innerHTML = _.join(['Hello', 'webpack'], ' ');

    return element;
}

document.body.appendChild(component());

ReactDOM.render(<HellowWorldApp/>, document.getElementById('container'));
ReactDOM.render(<CesiumApp/>, document.getElementById('container'));
