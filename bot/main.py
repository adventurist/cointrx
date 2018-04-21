from tornado.websocket import WebSocketHandler, WebSocketError, StreamClosedError
from tornado.web import Application, RequestHandler
from tornado.log import enable_pretty_logging
from utils.wsclient import Bot
from pythonjsonlogger import jsonlogger
from types import SimpleNamespace

from lightning import Lightning

import tornado.ioloop
import logging
import os
import json

from bokeh.layouts import gridplot
from bokeh.plotting import figure, show, output_file, ColumnDataSource
from bokeh.models import HoverTool

import numpy as np

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

    def get(self, *args, **kwargs):
        application.set_bots(make_bots())
        application.logger.info('Bots received')


class BotAllHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        if len(application.bots) > 0:
            for bot in application.bots:
                application.logger.debug(bot.identify())


class BotLoginHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        if len(application.bots) > 0:
            for bot in application.bots:
                login_attempt = await bot.login()
                if login_attempt:
                    print('Good stuff')


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
        if len(application.bots) > 0:
            for bot in application.bots:
                price_history = await bot.retrieve_price_history()
                await bot.digest_price_history(price_history.body)


class BotTrcAnalysisHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        if len(application.bots) > 0:
            bot = application.bots[0]
            application.logger.info(
                'Bot {0} (id {1} performing technical analysis of market data'.format(str(bot.number), str(bot.id)))
            bot.analyze_price_history()
            price_data = await bot.post_data_as_json()

            entry_dates = [x[1] for x in price_data[0]]
            peak_dates = [x[1] for x in price_data[1]]
            base_dates = [x[1] for x in price_data[2]]

            entry_prices = [x[0] for x in price_data[0]]
            peak_prices = [x[0] for x in price_data[1]]
            base_prices = [x[0] for x in price_data[2]]

            source = ColumnDataSource({'date': datetime(entry_dates), 'price': entry_prices})

            p1 = figure(x_axis_type="datetime", title="BTC Market Analysis")
            p1.grid.grid_line_alpha = 0.3
            p1.xaxis.axis_label = 'Date'
            p1.yaxis.axis_label = 'Price'

            line = p1.line(x='date', y='price', source=source, color='#33ff00', legend='BTC', line_cap='round', line_width=4)

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
            p1.square(datetime([price_data[3][0]]), [price_data[3][1]], color='#2700ff', legend="First Low", line_width=6)
            p1.triangle(datetime([price_data[4][0]]), [price_data[4][1]], color='#f00000', legend="First High", line_width=6)
            p1.square(datetime([price_data[5][0]]), [price_data[5][1]], color='#2700ff', legend="Last Low", line_width=6)
            p1.triangle(datetime([price_data[6][0]]), [price_data[6][1]], color='#f00000', legend="Last High", line_width=6)

            p1.legend.location = "bottom_right"
            output_file("static/analysis/analysis" + str(bot.number) + ".html", title="analysis" + str(bot.number) + ".py BTC Price Analysis")

            show(gridplot([[p1]], plot_width=1600, plot_height=960)) # open browser


def datetime(x):
    return np.array(x, dtype=np.datetime64)


class BotApplication(Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/start", StartHandler),
            (r"/bots/all", BotAllHandler),
            (r"/bots/dump", BotDumpHandler),
            (r"/bots/login", BotLoginHandler),
            (r"/bots/trc/prices", BotTrcPriceHandler),
            (r"/bots/trc/analyze", BotTrcAnalysisHandler)
        ]
        settings = {
            "debug": True,
            "log_path": os.path.join(os.path.dirname(__file__), "log")
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


def make_bots():
    config = bot_config()
    bots = []
    users = user_data()
    try:
        for i in range(len(users)):
            config.number = i + 1
            new_bot = Bot(config, setup_logger('Bot ' + str(i + 1), logging.DEBUG, json_logging=True))
            new_bot.set_credentials(users[i])
            new_bot.connect()
            bots.append(new_bot)

    except WebSocketError as e:
        handle_error(e, 'WebSocketErr')
    except StreamClosedError as e:
        handle_error(e, 'StreamClosed')
    except Exception as e:
        handle_error(e, 'General')

    return bots


def handle_error(err, name):
    print(err)
    application.logger.debug(name + ' error: ', str(err))


if __name__ == "__main__":
    application = BotApplication()
    log = application.logger
    application.listen(9977)
    tornado.ioloop.IOLoop.current().start()
