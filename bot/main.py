from tornado.websocket import WebSocketHandler, WebSocketError, StreamClosedError
from tornado.web import Application, RequestHandler
from tornado.log import enable_pretty_logging
from utils.wsclient import Bot
from pythonjsonlogger import jsonlogger
from types import SimpleNamespace

import tornado.ioloop
import logging
import os
import json

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
                result = await bot.retrieve_price_history()
                if result:
                    print(result)


class BotApplication(Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/start", StartHandler),
            (r"/bots/all", BotAllHandler),
            (r"/bots/dump", BotDumpHandler),
            (r"/bots/login", BotLoginHandler),
            (r"/bots/trc/prices", BotTrcPriceHandler)
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
        '%(name)s - %(levelname)s - %(message)s') if json_logging is False else jsonlogger.JsonFormatter(json_indent=2)
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
