from __future__ import absolute_import
# Tornado
from tornado.websocket import WebSocketHandler, WebSocketError, StreamClosedError
from tornado.web import Application, RequestHandler, HTTPError
from tornado.log import enable_pretty_logging
import tornado.ioloop

# Data Science
import pandas as pd
import numpy as np

# Data Visualization
from bokeh.plotting import figure, output_file, ColumnDataSource, save
from bokeh.models import HoverTool
from bokeh.layouts import gridplot

# TRX Utilities
from utils.cointrx_client import Client
from utils.wsclient import Bot
from utils.trc_utils import *
from utils.btcd_utils import get_env_variables

# Misc
from types import SimpleNamespace
import re
import os
import json
import logging

socket_handlers = []
http_client = Client()
enable_pretty_logging()


class WSHandler(WebSocketHandler):

    def open(self):
        application.connections.append(self)
        log.info('connection added')

    def on_close(self):
        print('superfluous information')
        application.connections.remove(self)
        log.info('connection removed')


class MainHandler(WSHandler):
    def data_received(self, chunk):
        pass

    async def on_message(self, message):
        print(message)

    def open(self):
        socket_handlers.append(self)
        print('Websocket opened')
        self.write_message('Connection successful')

    def close(self, code=None, reason=None):
        log.debug('Closing connection')
        print(self)


class StartHandler(RequestHandler):
    """
    Class to instantiate bots and setup an internal message stream

    Arguments:
        RequestHandler {[type]} -- [description]
    """

    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        trx_cookie = self.get_argument('trx_cookie')
        self.set_secure_cookie('trx_cookie', trx_cookie)

        num_requested = self.get_argument('number')
        identities = []

        create_bot_result = application.set_bots(await make_bots(num_requested))
        if not has_error(create_bot_result):
            log.info('Bots received')

            if len(application.bots) > 0:
                for bot in application.bots:
                    log.debug(bot.identify())
                    identities.append({'message': bot.identify(), 'id': str(bot.id), 'number': bot.number})
                    await bot.write_message()
                    await bot.relay_message('Jigga jigga WHAT?!?!?!')

            self.set_status(201, reason='Bot creation')
            self.write(json.dumps({'response': 201, 'resource': 'bot', 'num': num_requested,
                                   'response_text': 'Created %s bots successfully' % str(num_requested),
                                   'data': identities}))
        else:
            log.info('Unable to create bots')
            self.write(json.dumps({'response': 500, 'resource': 'bot', 'num': num_requested, 'error': True,
                                   'response_text': 'Error when attempting to create bots.\nReason given: %s' %
                                                    create_bot_result['error']}))


class BotAllHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        if len(application.bots) > 0:
            for bot in application.bots:
                log.debug(bot.identify())
                bot.connect()
                bot.write_message()
                bot.relay_message('Jigga jigga WHAT?!?!?!')


class BotLoginHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        user = self.get_current_user()
        login_num_requested = self.get_argument('number')
        bot_num = len(application.bots)
        error = False
        logins = 0
        if bot_num > 0:
            for bot in application.bots:
                login_attempt = await bot.login()
                if login_attempt:
                    logins += 1
                else:
                    error = True
            if not logins > 0:
                response_code = 200 if not error else 207
            else:
                response_code = 500

            self.set_status(response_code,
                            reason='%s %s logged in' % str(logins) % 'bots' if (login_num_requested != 1) else 'bot')
            self.write(json.dumps({'response': response_code, 'resource': 'bot', 'action': 'login', 'num': logins,
                                   'response_text': '%s of %s requested logged in successfully' % str(
                                       logins) % 'bots' if login_num_requested != 1 else 'bot'}))


class BotDumpHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        """
        Requests all bots currently in the pool to dump their info
        """

        if len(application.bots) > 0:
            for bot in application.bots:
                bot.dump_self()


class BotTrcPriceHandler(RequestHandler):
    """
    Class to deal with the loading of TRC Price Data

    Arguments:
        RequestHandler {[type]} -- [description]
    """

    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        """
        Loads data into the specified bot for the specified period
        """

        trx_cookie = self.get_argument('trx_cookie')
        self.initialize()
        bot_id = self.get_argument('bot_id')
        time = self.get_argument('time')
        if len(application.bots) > 0 and application.retrieve_bot_by_id(bot_id) is not None:
            log.info('Retrieving prices for %s' % bot_id)
            bot = application.retrieve_bot_by_id(bot_id)
            price_history = await bot.retrieve_price_history(time)
            digest_price_result = await bot.digest_price_history(price_history.body)
            if not has_error(digest_price_result):
                self.set_status(200)
                self.write(json.dumps({'response': 200, 'resource': 'bot', 'action': 'login', 'num': 1,
                                       'response_text': 'Successfully loaded market data into bot %s' % bot_id}))
        else:
            self.set_status(500)
            self.write(json.dumps({
                'response': 500, 'resource': 'bot', 'action': 'load data', 'num': 1,
                'response_text': 'Bot number does not match an available bot'
            }))


class BotTrcAnalysisHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        """
        Method to perform general technical analysis on data already loaded into the
        bot specified

        Results are rendered in a graph using the Bokeh library
        """

        bot_id = self.get_argument('bot_id')

        if len(application.bots) > 0 and application.retrieve_bot_by_id(bot_id) is not None:
            bot = application.retrieve_bot_by_id(bot_id)
            log.info(
                'Bot {0} (id {1} performing technical analysis of market data'.format(str(bot.number), str(bot.id)))
            bot.analyze_price_history()
            price_data = await bot.post_data_as_json()

            filename = build_graph(price_data, bot.number)
            # filename = build_bezier()

            self.write(json.dumps({'response': 201, 'filename': '%s' % filename, 'bot_id': bot_id}))


def datetime(x):
    """[summary]
    Arguments:

        x {[list]} -- A list of datetime strings

    Returns:
        [np.array] -- Returns the dates as a numpy array of datetime64 objects
    """

    return np.array(x, dtype=np.datetime64)


class BotWsStartHandler(WSHandler):
    def data_received(self, chunk):
        pass

    def check_origin(self, origin):
        """[summary]

        Arguments:
            origin {string} -- Checks the origin value to ensure that live CORS requests
            valid, or permits them based on local development

        Returns:
            [bool] -- returns True or False, which decides whether the request is granted
        """
        return bool(re.match(r'^.*?\.cointrx\.com', origin)) if application.settings['env'] == 'SNOWFLAKE' else True

    async def on_message(self, message):
        """
        Overrides the on_message method for the server-side websocket implementation

        Arguments:
            message {String} -- A JSON string containing requests to be parsed and reacted
            to by the server. Requests are handled by the `handle_ws_request` method
        """

        log.debug('Message received: %s' % str(message))
        # If valid JSON, parse and ensure `type` and `date` keys are present
        if valid_json(message):
            log.debug('Valid JSON detected - Processing request')
            parsed = json.loads(message)
            # Send request to the handler
            result = await handle_ws_request(parsed['type'], parsed['data'])
            log.debug('WS Request: %s' % str(result))
            if result is not None:
                response = json.dumps(result) if isinstance(result, dict) else str(result, 'utf-8')
            else:
                response = json.dumps({'error': 'Error handling socket request'})
            # TODO Handle this internally and send a TRX response
            self.write_message(response)
        # Simply messages from a bot which don't contain any JSON should be responded to by
        # encouraging the bot to maintain a connection, and are thus responded to with
        # a keepAlive value
        return_message = {'keepAlive': 1, 'message': 'Back at you, punk', 'botConnections': len(self.application.bots)}
        self.write_message(json.dumps(return_message))

    def open(self):
        log.debug('Connection opened: ' + str(self))
        self.write_message('Connection opened')


async def handle_ws_request(type, data):
    """
    Utility to handle requests sent through the websocket stream
    :param type: Determines what type of request is being made
    :param data: Contains any data required to process the request
    :return dict: Returned dictionaries should contain an **action** and a **payload**
    """

    async def analyze_market(type: any, data: dict):
        """
        Request that bot with ID perform a technical analysis
        """
        request_result = await http_client.get('http://localhost:9977/bots/trc/analyze' + '?bot_id=%s' % data['bot_id'])
        if hasattr(request_result, 'body'):
            return {'action': 'addfile', 'payload': json.loads(str(request_result.body, 'utf-8'))}

    async def fetch_bots(type, data):
        """
        Retrieve info on all active bots
        """
        request_result = await http_client.get('http://localhost:9977/bots/fetch')
        if hasattr(request_result, 'body'):
            return {'action': 'updatebots', 'payload': json.loads(str(request_result.body, 'utf-8'))}

    async def transaction_create_test(type, data):
        recipient_uid = data['rid']
        sender_uid = data['uid']
        amount = data['amount']
        response = await http_client.get(
            'http://localhost:6969/transaction/test?sid=' + str(sender_uid) + '&rid=' + str(
                recipient_uid + '&amount=' + str(amount)))
        if response.body:
            result_obj = {'sender': sender_uid, 'recipient': recipient_uid, 'amount': amount, 'error': False,
                          'result': str(response.body, 'utf-8')}
            return_object = {'action': 'transaction:test:result', 'payload': result_obj}
        else:
            return_object = {'action': 'transaction:test:result',
                             'payload': {'error': True, 'message': 'Unable to perform transaction'}}

        return return_object

    async def login_bot(type: str, data: dict):
        bot = application.retrieve_bot_by_id(data['bot_id'])
        if bot:
            if not bot.is_logged_in():
                login_response = await bot.login(application.users_available)
                if hasattr(login_response, 'body'):
                    print(json.dumps(login_response.body))
            if bot.is_logged_in():
                uid = str(bot.session['uid'])
                name = str(bot.session['name'])
                application.user_sessions.append(uid)
                return {'action': 'bot:login:result', 'payload': {'uid': uid, 'name': name, 'bot_id': data['bot_id']}}

    async def fetch_user_balance(type, data):
        """

        :param type:
        :param data:
        :return:
        """
        bot_id = data['bot_id']
        bot = application.retrieve_bot_by_id(bot_id)
        print(bot)
        if not bot.is_logged_in():
            await bot.login(application.users_available)
        if bot.is_logged_in():
            uid = str(bot.session['uid'])
            application.user_sessions.append(uid)
            response = await http_client.get(
                'http://127.0.0.1:6969/api/account/balance?uid=' + uid + '&token=' + str(bot.session['token']))
            if hasattr(response, 'body'):
                body = json.loads(str(response.body, 'utf-8'))
                if 'balance' in body:
                    return {'action': 'account:balance:update',
                            'payload': {'balance': body['balance'], 'uid': uid, 'name': bot.session['name']}}
                else:
                    return {'action': 'account:balance:update', 'error': True, 'payload': 'Error fetching balance'}

    async def close_bot_connections(type, data):
        """
        Close all bot connections

        Arguments:
            type {String} -- Only required for consistency
            data {String} -- Only required for consistency

        Returns:
            [dict] -- The result of the request
        """

        try:
            application.close_bot_connections()
            return {'action': 'killbots', 'payload': {'request': 'close bot connections', 'result': 1}}
        except HTTPError as e:
            e.log_message = 'Unable to close bot connections'
            e.status_code = 500
            return {'action': 'noaction', 'payload': {'request': 'close bot connections', 'result': 0, 'error': e}}

    async def close_bot_connection(type, data):
        """
        Close connection for bot with ID
        """
        if 'id' in data:
            try:
                application.close_bot_connection(data['id'])
            except HTTPError as e:
                e.log_message = 'Unable to close bot connection for bot with id %s' % data['id']
                e.status_code = 500
                return {'action': 'noaction', 'payload': {'request': 'close bot connections', 'result': 0, 'error': e}}

    async def find_market_patterns(type, data):
        if 'bot_id' in data:
            try:
                bot = application.retrieve_bot_by_id(data['bot_id'])
                patterns = await bot.find_all_patterns()
                findings = patterns['cup_and_handle']
                price_history = await bot.retrieve_price_history(60)
                bot.analyze_price_history()
                price_data = await bot.post_data_as_json()
                filename = build_graph(price_data, bot.number, findings)
                return {'action': 'pattern:results:update',
                        'payload': {'patterns': patterns, 'filename': filename, 'result': 1}}
            except HTTPError as e:
                e.log_message = 'Unable to close bot connection for bot with id %s' % data['id']
                e.status_code = 500
                return {'action': 'noaction', 'payload': {'request': 'close bot connections', 'result': 0, 'error': e}}

    switch = {
        'request': analyze_market,
        'bots:all': fetch_bots,
        'bots:close': close_bot_connections,
        'bot:close': close_bot_connection,
        'bot:login': login_bot,
        'patterns:search': find_market_patterns,
        'fetch:balance': fetch_user_balance,
        'transaction:test:create': transaction_create_test
    }
    func = switch.get(type, lambda: 'Invalid request type')
    result = await func(type, data)
    return result


class BotFetchHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def set_default_headers(self):
        # Only allow real internal requests
        origin = self.request.headers.get('Origin')
        if origin in ['http://localhost:6969', 'https://app.cointrx.com', 'https:bot.cointrx.com']:
            self.set_header("access-control-allow-origin", origin)
            self.set_header("Access-Control-Allow-Headers", "x-requested-with")
            self.set_header('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
            # HEADERS!
            self.set_header("Access-Control-Allow-Headers", "access-control-allow-origin,authorization,content-type")


    async def get(self, *args, **kwargs):
        bots = [{
            'message': x.identify(),
            'id': str(x.id),
            'number': x.number,
            'is_logged_in': x.is_logged_in(),
            'session': x.session
        } for x in application.bots]
        if self.get_argument('public_api', None) is None:
            self.write(json.dumps(bots))
        else:
            self.write(json.dumps({'bots': bots, 'code': 200 if bots is not None and len(bots) > 0 else 400}))


class BotTrcPatternAnalysisHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def post(self, *args, **kwargs):
        data = json.loads(self.request.body)


class BotApplication(Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/start", StartHandler),
            (r"/bots/all", BotAllHandler),
            (r"/bots/dump", BotDumpHandler),
            (r"/bots/login", BotLoginHandler),
            (r"/bots/fetch", BotFetchHandler),
            (r"/ws/start", BotWsStartHandler),
            (r"/bots/trc/prices", BotTrcPriceHandler),
            (r"/bots/trc/analyze", BotTrcAnalysisHandler),
            (r"/bots/trc/analyze/pattern", BotTrcPatternAnalysisHandler)
        ]
        settings = {
            "debug": True,
            "log_path": os.path.join(os.path.dirname(__file__), "log"),
            "cookie_secret": "984378towhdufs8047ht",
            "env": get_env_variables()['TRX_ENV']
        }
        self.bots = []
        self.connections = []
        self.user_sessions = []
        self.logger = setup_logger('BOT_APPLICATION', logging.DEBUG)
        Application.__init__(self, handlers, **settings)

    def set_bots(self, bots):
        if isinstance(bots, list):
            for bot in bots:
                self.bots.append(bot)
        elif isinstance(bots, Bot):
            self.bots.append(bots)
        elif has_error(bots):
            return bots
        else:
            return {'error': 'Unknown error occurred while calling set_bots'}

    def retrieve_bot_by_id(self, bot_id):
        if isinstance(self.bots, list) and len(self.bots) > 0:
            search = list(filter(lambda x: str(x.id) == bot_id, self.bots))
            if search is not None and len(search) > 0:
                return search[0]

    # TODO: rename this to `get_bots`
    def fetch_bots(self):
        if isinstance(self.bots, list) and len(self.bots) > 0:
            return self.bots

    def close_bot_connections(self):
        if active_bots(self.bots):
            map(lambda x: x.close_connection, self.bots)
            del self.bots
            self.bots = []

    def close_bot_connection(self, bot_id):
        if active_bots(self.bots):
            bot = self.retrieve_bot_by_id(bot_id)
            if bot is not None:
                bot.close_connection()
                del bot


def active_bots(bots: list):
    return isinstance(bots, list) and len(bots) > 0


def setup_logger(name, level, json_logging=False):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    log_handler = logging.FileHandler('bot.log')
    logger_formatter = logging.Formatter('%(name)s - %(levelname)s - %(message)s')
    log_handler.setFormatter(logger_formatter)

    logger.addHandler(log_handler)
    logger.info('Setup logger for ' + name)

    return logger


def user_data():
    with open(os.path.join(os.path.dirname(__file__), 'users.json')) as d:
        users = json.load(d)
        if users is not None:
            log.info('users retrieved: ' + str(users))
    return users['users']


def bot_config():
    config = SimpleNamespace()
    config.timeout = 20000
    config.number = -1

    return config


async def make_bots(num):
    num = int(num)
    config = bot_config()
    bots = []
    users = user_data()
    if len(users) >= num:
        try:
            for i in range(num):
                user = next(iter(x for x in users if int(x['uid']) in application.users_available))
                if user is not None:
                    config.number = i + 1
                    new_bot = Bot(config, setup_logger('Bot ' + str(i + 1), logging.DEBUG, json_logging=True))
                    new_bot.set_credentials(user)
                    await new_bot.connect()
                    bots.append(new_bot)
                    application.users_available.remove(new_bot.credentials['uid'])

        except WebSocketError as e:
            handle_error(e, 'WebSocketErr')
        except StreamClosedError as e:
            handle_error(e, 'StreamClosed')
        except Exception as e:
            handle_error(e, 'General')

        return bots
    else:
        return {'error': 'Requested number of bots exceeds available accounts'}


def build_graph(price_data, bot_number, patterns=None):
    entry_dates = [x[1] for x in price_data[0]]
    peak_dates = [x[1] for x in price_data[1]]
    base_dates = [x[1] for x in price_data[2]]

    entry_prices = [x[0] for x in price_data[0]]
    peak_prices = [x[0] for x in price_data[1]]
    base_prices = [x[0] for x in price_data[2]]

    cup_line = None
    lines_to_render = []

    source = ColumnDataSource({'date': [pd.Timestamp(x) for x in entry_dates], 'price': entry_prices})

    p1 = figure(x_axis_type="datetime", title="BTC Market Analysis")

    p1.background_fill_color = "#333333"
    p1.grid.grid_line_alpha = 0.3
    p1.xaxis.axis_label = 'Date'
    p1.yaxis.axis_label = 'Price'

    line = p1.line(x='date', y='price', source=source, color='#33ff00', legend='BTC', line_cap='round',
                   line_width=2)
    lines_to_render.append(line)

    if patterns is not None:
        for i, pattern in enumerate(patterns):
            # TODO: pattern should never be None
            if pattern is not None:
                x0, xm, x1, y0, ym, y1 = extract_bezier_points(pattern)
                x = datetime([x0, xm, x1])
                y = [y0, ym, y1]

                cup_source = ColumnDataSource({
                    'date': x,
                    'price': y
                })
                cup_line = p1.line(x='date', y='price', source=cup_source, color="#b241ff", legend="cup%s" % str(i),
                                   line_cap='round', line_width=4)
                lines_to_render.append(cup_line)

    p1.add_tools(HoverTool(
        renderers=lines_to_render,
        tooltips=("""
                    <div style="padding: 12px; background: #5d5d5d;">
                        <span style="color: #3fe108; font-size: 20px;">Price: $@price CAD</span><br />
                        <span style="color: #3fe108; font-size: 16px;">(Date: @date{%D - %H:%m})</span>
                    </div>
                """),
        formatters={
            'date': 'datetime'
        }
    ))

    p1.circle(datetime(peak_dates), peak_prices, color='#ff00eb', legend='Peaks', line_width=6)
    p1.circle(datetime(base_dates), base_prices, color='#ff6a00', legend='Bases', line_width=6)
    p1.square(datetime([price_data[3][0]]), [price_data[3][1]], color='#2700ff', legend="First Low",
              line_width=6)
    p1.triangle(datetime([price_data[4][0]]), [price_data[4][1]], color='#f00000', legend="First High",
                line_width=6)
    p1.square(datetime([price_data[5][0]]), [price_data[5][1]], color='#2700ff', legend="Last Low",
              line_width=6)
    p1.triangle(datetime([price_data[6][0]]), [price_data[6][1]], color='#f00000', legend="Last High",
                line_width=6)

    p1.legend.location = "bottom_right"
    filetype = '%s' % 'general' if patterns is None else 'pattern'
    filename = "analysis" + str(bot_number) + "-%s.html" % filetype
    output_file('analysis/%s' % filename,
                title="analysis" + str(bot_number) + ".py BTC Price Analysis", mode="inline")
    if cup_line is not None:
        save(gridplot([[p1]], plot_width=1600, plot_height=960))
    else:
        save(gridplot([[p1]], plot_width=1600, plot_height=960))

    file_mv_result = expose_analysis_files()
    log.debug('File move result: %s' % file_mv_result)

    return filename


def extract_bezier_points(data):
    x0 = data['first_peak']['date']
    xm = data['cup_bottom']['date']
    x1 = data['second_peak']['date']
    y0 = data['first_peak']['value']
    ym = data['cup_bottom']['value']
    y1 = data['second_peak']['value']

    return x0, xm, x1, y0, ym, y1


def smooth(y, box_pts):
    y = [float(x) for x in y]
    box = np.ones(box_pts) / box_pts
    y_smooth = np.convolve(y, box, mode='same')
    return y_smooth


def handle_error(err, name):
    print(err)
    log.debug(name + ' error: ', str(err))


def has_error(d):
    return isinstance(d, dict) and 'error' in d


def smooth_column_datasource(x, y):
    return ColumnDataSource({
        'date': x,
        'price': y
    })


def cubic_column_datasource(x, y):
    from scipy.interpolate import CubicSpline
    spl = CubicSpline(x, y)
    return ColumnDataSource({'date': x.astype('datetime64'), 'price': spl(y)})


if __name__ == "__main__":
    application = BotApplication()
    log = application.logger
    application.users_available = [x['uid'] for x in user_data()]
    application.listen(9977)
    tornado.ioloop.IOLoop.current().start()
