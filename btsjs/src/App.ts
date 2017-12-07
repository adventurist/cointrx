import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as routerSrc from './routes';

let consolidate = require('consolidate');


let router: express.Router = routerSrc.routes;

// Creates and configures an ExpressJS web server.
class App {

  // ref to Express instance
  public express: express.Application;

  //Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
  }

  // Configure Express middleware.
  private middleware(): void {
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
  private routes(): void {
    /* This is just to get up and running, and to make sure what we've got is
     * working so far. This function will change when we start to add more
     * API endpoints */

    this.express.use('/', router);
    this.express.use('/transaction', router);
  }

}

export default new App().express;
