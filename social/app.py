from __future__ import absolute_import
# Tornado
from tornado.websocket import WebSocketHandler, WebSocketError, StreamClosedError
from tornado.web import Application, RequestHandler, HTTPError
from tornado.log import enable_pretty_logging
import tornado.ioloop
# DB Operations for Coin TRX
from db.db import get_user_by_name
# DB Operations for Social Media
from social import database
# Misc
from types import SimpleNamespace
import re
import os
import json
import logging

enable_pretty_logging()


class MediaRequestHandler(RequestHandler):
    def data_received(self, chunk):
        pass


# This is an example class
class PostHandler(MediaRequestHandler):
    async def get(self, *args, **kwargs):
        # get all posts
        posts = await database.get_posts()
        if posts is not None:
            self.write(json.dumps([x.serialize() for x in posts]))

    async def post(self, *args, **kwargs):
        # create a test post
        user = await get_user_by_name('Nexus')
        if user:
            content = make_sample_content()
            post = await database.create_post(user, content)
            if post:
                self.write('Post created successfully')


class MediaApplication(Application):
    def __init__(self):
        handlers = [
            (r"/test/post", PostHandler),
        ]
        settings = {
            "debug": True,
            "log_path": os.path.join(os.path.dirname(__file__), "log"),
            "cookie_secret": "98eurtiohfjshfjklsd",
        }
        self.logger = setup_logger('MEDIA_APPLICATION', logging.DEBUG)
        Application.__init__(self, handlers, **settings)


def setup_logger(name, level, json_logging=False):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    log_handler = logging.FileHandler('social.log')
    logger_formatter = logging.Formatter('%(name)s - %(levelname)s - %(message)s')
    log_handler.setFormatter(logger_formatter)
    logger.addHandler(log_handler)
    logger.info('Setup logger for ' + name)

    return logger


def make_sample_content():
    return {
        'title': 'This is a great title',
        'body': 'This body is so amazing. Wow check out this body OMG',
        'links': [
            {
                'title': 'The best link title ever',
                'url': 'https://cointrx.com'
            }
        ]
    }


if __name__ == "__main__":
    application = MediaApplication()
    log = application.logger
    application.listen(9696)
    tornado.ioloop.IOLoop.current().start()
