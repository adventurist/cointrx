import re
from bokeh.layouts import gridplot

from tornado.websocket import WebSocketHandler, WebSocketError, StreamClosedError
from tornado.web import Application, RequestHandler, HTTPError
from tornado.log import enable_pretty_logging
from utils.wsclient import Bot, as_unixtime
import pandas as pd
from types import SimpleNamespace
from utils.cointrx_client import Client

from utils.trc_utils import *
from utils.btcd_utils import get_env_variables

import tornado.ioloop
import logging
import os
import json
import math

from bokeh.plotting import figure, output_file, ColumnDataSource, save
from bokeh.models import HoverTool, Plot, DataRange1d, LinearAxis, Grid
from bokeh.models.glyphs import Bezier
from bokeh.io import curdoc

import numpy as np

http_client = Client()
enable_pretty_logging()
socket_handlers = []


class MainHandler(WebSocketHandler):
    def data_received(self, chunk):
        pass

    async def on_message(self, message):
        print(message)

    def open(self):
        socket_handlers.append(self)
        print('Websocket opened')
        self.write_message('Connection successful')


class StartHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        trx_cookie = self.get_argument('trx_cookie')
        self.set_secure_cookie('trx_cookie', trx_cookie)

        num_requested = self.get_argument('number')
        identities = []

        create_bot_result = application.set_bots(await make_bots(num_requested))
        if not has_error(create_bot_result):
            application.logger.info('Bots received')

            if len(application.bots) > 0:
                for bot in application.bots:
                    application.logger.debug(bot.identify())
                    identities.append({'message': bot.identify(), 'id': str(bot.id), 'number': bot.number})
                    # bot_conn = await bot.connect()
                    await bot.write_message()
                    await bot.relay_message('Jigga jigga WHAT?!?!?!')

            self.set_status(201, reason='Bot creation')
            self.write(json.dumps({'response': 201, 'resource': 'bot', 'num': num_requested,
                                   'response_text': 'Created %s bots successfully' % str(num_requested),
                                   'data': identities}))
        else:
            application.logger.info('Unable to create bots')
            self.write(json.dumps({'response': 500, 'resource': 'bot', 'num': num_requested, 'error': True,
                                   'response_text': 'Error when attempting to create bots.\nReason given: %s' %
                                                    create_bot_result['error']}))


class BotAllHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        if len(application.bots) > 0:
            for bot in application.bots:
                application.logger.debug(bot.identify())
                bot.connect()
                bot.write_message()
                bot.relay_message('Jigga jigga WHAT?!?!?!')


class BotLoginHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
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
        if len(application.bots) > 0:
            for bot in application.bots:
                bot.dump_self()


class BotTrcPriceHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        trx_cookie = self.get_argument('trx_cookie')
        self.initialize()
        bot_id = self.get_argument('bot_id')
        time = self.get_argument('time')
        if len(application.bots) > 0 and application.retrieve_bot_by_id(bot_id) is not None:
            application.logger.info('Retrieving prices for %s' % bot_id)
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
        bot_id = self.get_argument('bot_id')

        if len(application.bots) > 0 and application.retrieve_bot_by_id(bot_id) is not None:
            bot = application.retrieve_bot_by_id(bot_id)
            application.logger.info(
                'Bot {0} (id {1} performing technical analysis of market data'.format(str(bot.number), str(bot.id)))
            bot.analyze_price_history()
            price_data = await bot.post_data_as_json()

            filename = build_graph(price_data, bot.number)
            # filename = build_bezier()

            self.write(json.dumps({'response': 201, 'filename': '%s' % filename, 'bot_id': bot_id}))


def datetime(x):
    return np.array(x, dtype=np.datetime64)


class BotWsStartHandler(WebSocketHandler):
    def data_received(self, chunk):
        pass

    def check_origin(self, origin):
        vars = get_env_variables()
        env = vars['TRX_ENV']
        return bool(re.match(r'^.*?\.cointrx\.com', origin)) if application.settings['env'] == 'SNOWFLAKE' else True

    async def on_message(self, message):
        application.logger.debug('Message received: %s' % str(message))
        if valid_json(message):
            application.logger.debug('Valid JSON detected - Processing request')
            parsed = json.loads(message)
            result = await handle_ws_request(parsed['type'], parsed['data'])
            application.logger.debug('WS Request: %s' % str(result))
            response = json.dumps(result) if isinstance(result, dict) else str(result, 'utf-8')
            # TODO Handle this internally and send a TRX response
            self.write_message(response)

        return_message = {'keepAlive': 1, 'message': 'Back at you, punk', 'botConnections': len(self.application.bots)}
        self.write_message(json.dumps(return_message))

    def open(self):
        application.logger.debug('Connection opened: ' + str(self))
        self.write_message('Connection opened')


async def handle_ws_request(type, data):
    """
    Utility to handle requests sent through the websocket stream
    :param type:
    :param data:
    :return dict:
    """

    async def analyze_market(url, data):
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

    async def close_bot_connections(type, data):
        """
        Close all bot connections
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
                # bot.digest_price_history(price_history)
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
        'patterns:search': find_market_patterns,
    }
    func = switch.get(type, lambda: 'Invalid request type')
    result = await func(type, data)
    return result


class BotFetchHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        bots = [{'message': x.identify(), 'id': str(x.id), 'number': x.number} for x in application.bots]
        self.write(json.dumps(bots))


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
    logger_formatter = logging.Formatter(
        '%(name)s - %(levelname)s - %(message)s') \
        # if json_logging is False else jsonlogger.JsonFormatter(json_indent=2)
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
                config.number = i + 1
                new_bot = Bot(config, setup_logger('Bot ' + str(i + 1), logging.DEBUG, json_logging=True))
                new_bot.set_credentials(users[i])
                await new_bot.connect()
                bots.append(new_bot)

        except WebSocketError as e:
            handle_error(e, 'WebSocketErr')
        except StreamClosedError as e:
            handle_error(e, 'StreamClosed')
        except Exception as e:
            handle_error(e, 'General')

        return bots
    else:
        return {'error': 'Requested number of bots exceeds available accounts'}


def build_bezier():
    x0 = math.floor(float(as_unixtime('2018-04-18 17:30:00')))
    xm = math.floor(float(as_unixtime('2018-04-18 18:00:00')))
    xm1 = math.floor(float(as_unixtime('2018-04-18 18:30:00')))
    x1 = math.floor(float(as_unixtime('2018-04-18 19:00:00')))
    N = 1
    x = np.linspace(x0, x1, N)
    y = x ** 2

    # bezier_source = ColumnDataSource({
    #             # 'x0': [pd.Timestamp('2018-04-18 17:30:00')],
    #             'x0': x,
    #             'xm': [xm],
    #             'x1': [x1],
    #             'y0': ['10351.10'],
    #             'ym': ['10333.33'],
    #             'y1': ['10403.79']
    # })
    bezier_source = ColumnDataSource({
        'x': [x0],
        # 'y':y,
        'y': 10351.10,
        'xp02': x1,
        'xp01': xm,
        'xm01': xm1,
        # 'yp01':y+0.2,
        'yp01': 10333.33,
        'ym01': 10403.79,
        # 'ym01':y-0.2
    })
    xdr = DataRange1d()
    ydr = DataRange1d()

    plot = Plot(
        title=None, x_range=xdr, y_range=ydr, plot_width=300, plot_height=300,
        h_symmetry=False, v_symmetry=False, min_border=0, toolbar_location=None)

    glyph = Bezier(x0="x", y0="y", x1="xp02", y1="y", cx0="xp01", cy0="yp01", cx1="xm01", cy1="ym01",
                   line_color="#d95f02", line_width=2)
    plot.add_glyph(bezier_source, glyph)

    xaxis = LinearAxis()
    plot.add_layout(xaxis, 'below')

    yaxis = LinearAxis()
    plot.add_layout(yaxis, 'left')

    plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
    plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

    # curdoc().add_root(plot)

    # glyph = Bezier(x0="x0", y0="y0", x1="x1", y1="y1", cx0="xm", cy0="ym", line_color="#d95f02", line_width=2)
    # glyph2 = Bezier(x0="x", y0="y", x1="xp02", y1="y", cx0="xp01", cy0="yp01", cx1="xm01", cy1="ym01", line_color="#d95f02", line_width=2)
    # p1 = figure(title="BTC Market Analysis", )
    # p1.x_range.end = 6
    # p1.grid.grid_line_alpha = 0.3
    # # p1.background_fill_color = '#333333'
    # p1.xaxis.axis_label = 'Date'
    # p1.yaxis.axis_label = 'Price'
    #
    # p1.add_glyph(bezier_source, glyph2)
    #
    # p1.legend.location = "bottom_right"
    filename = "analysis69.html"
    output_file('analysis/%s' % filename,
                title="analysis69.py BTC Price Analysis", mode="inline")

    save(gridplot([[plot]], plot_width=1600, plot_height=960))

    file_mv_result = expose_analysis_files()
    application.logger.debug('File move result: %s' % file_mv_result)

    return filename


def build_graph(price_data, bot_number, pattern=None):
    entry_dates = [x[1] for x in price_data[0]]
    peak_dates = [x[1] for x in price_data[1]]
    base_dates = [x[1] for x in price_data[2]]

    entry_prices = [x[0] for x in price_data[0]]
    peak_prices = [x[0] for x in price_data[1]]
    base_prices = [x[0] for x in price_data[2]]

    cup_line = None

    source = ColumnDataSource({'date': [pd.Timestamp(x) for x in entry_dates], 'price': entry_prices})

    p1 = figure(x_axis_type="datetime", title="BTC Market Analysis")

    p1.background_fill_color = "#333333"
    p1.grid.grid_line_alpha = 0.3
    p1.xaxis.axis_label = 'Date'
    p1.yaxis.axis_label = 'Price'

    line = p1.line(x='date', y='price', source=source, color='#33ff00', legend='BTC', line_cap='round',
                   line_width=2)

    if pattern is not None:
        x0, xm, x1, y0, ym, y1 = extract_bezier_points(pattern)
        cup_source = ColumnDataSource({
            'date': datetime([x0, xm, x1]),
            'price': [y0, ym, y1],
        })
        cup_line = p1.line(x='date', y='price', source=cup_source, color='#4e0080', legend='cup', line_cap='round',
                           line_width=2)

    if cup_line is None and line is not None:
        p1.add_tools(HoverTool(
            renderers=[line],
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
    filename = "analysis" + str(bot_number) + ".html"
    output_file('analysis/%s' % filename,
                title="analysis" + str(bot_number) + ".py BTC Price Analysis", mode="inline")
    if cup_line is not None:
        save(gridplot([[p1]], plot_width=1600, plot_height=960))
    else:
        save(gridplot([[p1]], plot_width=1600, plot_height=960))

    file_mv_result = expose_analysis_files()
    application.logger.debug('File move result: %s' % file_mv_result)

    return filename


def extract_bezier_points(data):
    date_start = data['first_peak']['date']
    date_end = data['second_peak']['date']
    # date_start = pd.Timestamp(data['first_peak']['date'])
    # date_end = pd.Timestamp(data['second_peak']['date'])
    # date_start = as_unixtime(data['first_peak']['date'])
    # date_end = as_unixtime(data['second_peak']['date'])
    # x0 = np.linspace(date_start, date_end, 1)
    # x0 = np.linspace(date_start.value, date_end.value, 1)
    x0 = date_start
    # x0 = datetime(data['first_peak']['date'])
    xm = data['cup_bottom']['date']
    x1 = data['second_peak']['date']
    # xm = pd.Timestamp(data['cup_bottom']['date'])
    # x1 = pd.Timestamp(data['second_peak']['date'])
    # xm = as_unixtime(data['cup_bottom']['date'])
    # x1 = as_unixtime(data['second_peak']['date'])
    y0 = data['first_peak']['value']
    ym = data['cup_bottom']['value']
    y1 = data['second_peak']['value']

    return x0, xm, x1, y0, ym, y1


def handle_error(err, name):
    print(err)
    application.logger.debug(name + ' error: ', str(err))


def has_error(d):
    return True if isinstance(d, dict) and 'error' in d else False


if __name__ == "__main__":
    application = BotApplication()
    log = application.logger
    application.listen(9977)
    tornado.ioloop.IOLoop.current().start()
