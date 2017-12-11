"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const routerSrc = require("./routes");
let consolidate = require('consolidate');
let router = routerSrc.routes;
// Creates and configures an ExpressJS web server.
class App {
    //Run configuration methods on the Express instance.
    constructor() {
        this.express = express();
        this.middleware();
        this.routes();
    }
    // Configure Express middleware.
    middleware() {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use(express.static('static'));
        // this.express.engine('html', require('ejs').renderFile);
        this.express.engine('html', consolidate.swig);
        this.express.set('view engine', 'html');
        console.log(__dirname);
        this.express.set('views', __dirname + '/../templates/');
    }
    // Configure API endpoints.
    routes() {
        /* This is just to get up and running, and to make sure what we've got is
         * working so far. This function will change when we start to add more
         * API endpoints */
        this.express.use('/', router);
        this.express.use('/transaction', router);
    }
}
exports.default = new App().express;
