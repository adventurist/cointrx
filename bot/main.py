import tornado.ioloop
from tornado.websocket import WebSocketHandler, WebSocketError, StreamClosedError
from tornado.web import Application, RequestHandler
from tornado.log import enable_pretty_logging

from wsclient import Bot

from types import SimpleNamespace
import logging
import os

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


class BotApplication(Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/start", StartHandler)
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


def setup_logger(name, level):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    log_handler = logging.FileHandler('bot.log')
    logger_formatter = logging.Formatter('%(name)s - %(levelname)s - %(message)s')
    log_handler.setFormatter(logger_formatter)

    logger.addHandler(log_handler)
    logger.info('Setup logger for ' + name)

    return logger


def bot_config():
    config = SimpleNamespace()
    config.url = 'ws://localhost:9977/'
    config.timeout = 2000

    return config


def make_bots():
    config = bot_config()
    bots = []

    try:
        for i in range(5):
            new_bot = Bot(config, setup_logger('Bot ' + str(i), logging.DEBUG))
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
    application.listen(9977)
    tornado.ioloop.IOLoop.current().start()
