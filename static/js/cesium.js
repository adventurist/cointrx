import React from 'react';
// import Cesium from 'webpack-cesium';
if (Cesium !== null && Cesium !== undefined) {
    console.log(Cesium.VERSION);

    let viewer = new Cesium.Viewer('cesium-try', {
        animation : true,
        homeButton : true,
        vrButton : true,
        infoBox : true,
        geocoder : true,
        sceneModePicker: true,
        selectionIndicator: true,
        timeline : true,
        navigationHelpButton : true,
        navigationInstructionsInitiallyVisible: true,
        scene3DOnly : false,
        shadows : true,
        terrainShadows : true,
        baseLayerPicker : true
    });
} else {
    console.log('No cesium today');
}

Cesium.BingMapsApi.defaultKey = 'najPDMYfT47b3d1rcxoc~QQwcVeDsynz7ZWgiQsesnw~AlOIbK5lRuyiN-oJ_BJz590qF7Pjuuhj4d6XF1ATm1_IuFrJ6zmFe4joEtgoI9D5';

let createClass = require('create-react-class');


let CesiumApp = createClass({
    render: function() {
        return (
            <div id="cesium-main" className="cesium-ui">

                <div className="nav-ui-wrap" id="nav-ui-wrap">
                    <div id="zoom">
                        <button id="zoom-in" className="map-button">+
                        </button>
                        <button id="zoom-out" className="map-button">-
                        </button>
                    </div>

                    <div id="nav-arrows">
                        <button id="nav-up" className="map-button">↑
                        </button>
                        <button id="nav-left" className="map-button">←
                        </button>
                        <button id="nav-down" className="map-button">↓
                        </button>
                        <button id="nav-right" className="map-button">→
                        </button>
                    </div>

                    <button id="nav-reset" className="map-button">
                    </button>
                    <button id="map-search" className="map-button"></button>
                    <button id="layer-toggle"></button>
                    <button className="map-button" id="open-legend">?</button>
                </div>

                <div id ="legend" className="map-legend">
                    <div className="map-legend-info">
                        <div className="legend-title">Legend</div>
                        <div className="closelegend">
                            <button className="closemenu" title="Close legend">
                                <span className="smallcaps">Close</span>
                                <img className="icon" src="/sites/quartierdix30/modules/custom/qd30map/gfx/icon_menuclose-greydk.svg" alt=""/>
                            </button>
                        </div>

                        <div className="legend-row">
                            <img className="icon" src="/sites/quartierdix30/modules/custom/qd30map/gfx/icon_mappointer-b.svg" alt="Icon of a map pointer"/>
                            <div>Selected</div>
                        </div>
                        <div className="legend-row">
                            <img className="icon" src="/sites/quartierdix30/modules/custom/qd30map/gfx/icon_mappointer-w_outlined.svg" alt="Icon of a map pointer"/>
                            <div>Highlighted (e.g. search results)</div>
                        </div>
                        <div className="legend-row">
                            <img className="icon" src="/sites/quartierdix30/modules/custom/qd30map/gfx/icon_grill.svg" alt="Icon of a square with a diagonal grill pattern"/>
                            <div>Has a current event</div>
                        </div>

                        <div className="legend-controls">
                            <img className="legend-control-icon" src="/sites/quartierdix30/modules/custom/qd30map/gfx/map-zoom.svg" alt="Icon of plus/minus buttons"/>
                            <div>Zoom</div>
                            <img className="legend-control-icon" src="/sites/quartierdix30/modules/custom/qd30map/gfx/map-navigate.svg" alt="Icon of arrow keys"/>
                            <div>Navigate</div>
                        </div>
                    </div>
                </div>
                <div id="loading-placeholder"><h1>ALWAYS QD30!!</h1></div>
            </div>
        );
    }
});

module.exports = CesiumApp;
