import asyncio
import argparse
import sys
import logging
import warnings

from iox.loop_handler import IOHandler

from tornado import escape
from tornado import gen

from tornado.ioloop import IOLoop
from tornado.web import Application, RequestHandler
from tornado.options import define, options, parse_command_line

from utils.mail_helper import Sender as mail_sender
from utils.cointrx_client import Client

import db

parser = argparse.ArgumentParser('debugging asyncio')
parser.add_argument(
    '-v',
    dest='verbose',
    default=False,
    action='store_true',
)
args = parser.parse_args()

logging.basicConfig(
    level=logging.DEBUG,
    format='%(levelname)7s: %(message)s',
    stream=sys.stderr,
)

LOG = logging.getLogger('')

io_handler = IOHandler()
http_client = Client()

define("port", default=6969, help="Default port for the WebServer")


class MainHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        self.write("Hi Jigga, Welcome to Tornado Web Framework.")


class WunderHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        response = {'jigga1': 'always jigga'}
        self.write(response)


class LoginHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def post(self) -> object:
        if self.request.headers.get("Content-Type") == 'application/json':
            request_data = {k: ''.join(v) for k, v in escape.json_decode(self.request.body).items()}
            email = request_data.get('email')
            password = request_data.get('password')
            name = request_data.get('name')

            if email is None or password is None or name is None:
                self.write("You must supply more arguments")
                self.write_error(401)
            else:
                # hashed_pw = db.User.generate_hash(password)
                new_user = db.check_authentication(name, password, email)
                print(str(new_user))


class SendMailHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def post(self):
        sender = mail_sender()
        if self.request.headers.get("Content-Type") == 'application/json':
            sender.send_mail("adventurist@gmail.com")


class FakeNewsHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        response = {'News': 'VERY fake news'}
        self.write(response)


class UpdatePriceHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    @gen.coroutine
    def get(self):
        http_client.get_prices()

        self.write('Sent request')


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    looper = asyncio.get_event_loop()
    looper.set_debug(True)
    looper.slow_callback_duration = 0.001

    warnings.simplefilter('always')

    application = Application([
        (r"/", MainHandler),
        (r"/jigga", WunderHandler),
        (r"/login", LoginHandler),
        (r"/sendmail", SendMailHandler),
        (r"/fakenews", FakeNewsHandler),
        (r"/updateprices", UpdatePriceHandler)
    ])
    application.listen(6969)
    db.Base.metadata.create_all(bind=db.engine)

    IOLoop.instance().start()
