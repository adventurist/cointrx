import asyncio
import argparse
import decimal
import json
import random
import os
import sys
import logging
import warnings

import base64
import uuid

import datetime

from iox.loop_handler import IOHandler

from tornado import escape
from tornado import gen

from tornado.ioloop import IOLoop
from tornado.web import Application, RequestHandler, StaticFileHandler
from tornado.options import define, options, parse_command_line

from utils.mail_helper import Sender as mail_sender
from utils.cointrx_client import Client
from tx import trx__tx_out

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

static_path = os.path.join(os.path.dirname(__file__), "static")

define("port", default=6969, help="Default port for the WebServer")


# class MJSONEncoder(json.JSONEncoder):
#     def default(self, obj):
#         if isinstance(obj, decimal.Decimal):
#             return str(obj)
#         return super(MJSONEncoder, self).default(obj)
#
#     def datetime(self, obj):
#         if isinstance(obj, datetime.datetime):
#             return str(obj)
#         return super(MJSONEncoder, self).default(obj)


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
        current_header = self.request.headers.get("Content-Type")
        print(current_header)
        if self.request.headers.get("Content-Type") == 'application/json':
            request_data = {k: ''.join(v) for k, v in escape.json_decode(self.request.body).items()}
            email = request_data.get('email')
            password = request_data.get('password')
            name = request_data.get('name')

            if email is None or password is None or name is None:
                self.write("You must supply more arguments")
                self.write_error(401)
            else:
                new_user = db.check_authentication(name, password, email)
                print(str(new_user))
        elif self.request.headers.get("Content-Type") == 'text/html':
            name = self.get_argument('name')
            print(name)

    def get(self, *args, **kwargs):
        print('get getting get')
        cookie_secret = base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)
        current_header = self.request.headers.get("Content-Type")
        print(cookie_secret)
        print(self._headers)
        print(self.get_status())
        # name = self.get_argument('name')
        # print(name)
        print(current_header)

        if self.request.headers.get("Content-Type") == 'text/html':
            name = self.get_argument('name')
            print('text/html, yo')
            print(name)

        message = random.choice(["Be Cool", "Don't be a Bitch", "Try not to be a Cunt", "Don't be a fat ass slut", "Respect yourself, bitch", "Try not to be such a Cuck, at least some of the time", "Find out if you can learn to be less of a Faggot Sonofabitchnogoodlowlife", "If you can not be a bitch for 10 seconds, it will be a magnificent achievement"])
        self.render("templates/login.html", title="Jiggas Login Handler", message=message)


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


class LatestPriceHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        result = (db.latest_prices())
        data = []
        i = 0
        for r in result:
            if isinstance(r, db.CXPrice):
                data.append(r.serialize())
                i += 1
        self.write(escape.json_encode({'TRX': data}))


class UserListHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        result = (db.get_users())
        data = {}
        for r in result:
            if isinstance(r, db.User):
                data[r.id] = r.serialize()
        self.write(escape.json_encode({'USERS': [data]}))


class CurrencyHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        # for k,v in arguments.items():
        if 'currency' in self.request.arguments:
            currency = self.get_argument('currency')
            print(currency)
            price = db.latest_price_async(currency)
            print(price)

        else:
            print('Whatchoo think this is, jigga!?')


class CurrencyRevisionHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        if 'currency' in self.request.arguments:
            currency = self.get_argument('currency')

            result = looper.run_until_complete(db.latest_price_history_async(currency))

            if result:
                return self.write({currency: result})

        else:
            print('Whatchoo think this is, jigga!?')


class RegisterHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        message = random.choice(["Be Cool", "Don't be a Bitch", "Try not to be a Cunt", "Don't be a fat ass slut", "Respect yourself, bitch", "Try not to be such a Cuck, at least some of the time", "Find out if you can learn to be less of a Faggot Sonofabitchnogoodlowlife", "If you can not be a bitch for 10 seconds, it will be a magnificent achievement"])
        self.render("templates/register.html", title="Jiggas Register Handler", message=message)


class PasswordHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        message = random.choice(["We gonna DOX you, slut", "A hackathon on yo ass, bitch", "You never gonna be able to log into SHIT", "Now we have all your informations", "We sell your passwords to Nigeria"])
        self.render("templates/password.html", title="Jiggas Password Handler", message=message)


class GraphHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        result = looper.run_until_complete(db.latest_prices_async())

        if result:
            print(result)
            self.render("templates/graph.html", title="Price Trends", data=result)


class GraphJsonHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        result = looper.run_until_complete(db.latest_prices_async())

        if result:
            print(result)
            self.write(escape.json_encode(result))


class GraphFilterHandler(RequestHandler):
    def data_received(self, chunk):
        pass


class TestTransactionHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):

        transaction = trx__tx_out.transaction()
        attempt = transaction.run()

        return self.write(attempt)

addr = "address"
html = ("""<html>

  <head>
    <script language=\"javascript\">
      var ws = new WebSocket(""" + addr +""");
      ws.onopen = function() {
         ws.send(\"Hello\");
      };
      ws.onmessage = function (evt) {
         alert(evt.data);
      };
    </script>
  </head>

  <body>
    <p>sample websocket with Tornado</p>
  </body>

</html>
""")


class TRXApplication(Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/jigga", WunderHandler),
            (r"/login", LoginHandler),
            (r"/register", RegisterHandler),
            (r"/password", PasswordHandler),
            (r"/sendmail", SendMailHandler),
            (r"/fakenews", FakeNewsHandler),
            (r"/updateprices", UpdatePriceHandler),
            (r"/prices/latest", LatestPriceHandler),
            (r"/prices/currency", CurrencyHandler),
            (r"/prices/graph", GraphHandler),
            (r"/prices/graph/json", GraphJsonHandler),
            (r"/prices/graph/currency", CurrencyRevisionHandler),
            (r"/transaction/test", TestTransactionHandler),
            (r"/users/all", UserListHandler),
            (r"/static/(.*)", StaticFileHandler, {
                "path": "/static"})
        ]
        settings = {
            "debug": True,
            "static_path": os.path.join(os.path.dirname(__file__), "static"),
            "template_path": os.path.join(os.path.dirname(__file__)),
        }
        Application.__init__(self, handlers, **settings)


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    looper = asyncio.get_event_loop()
    looper.set_debug(True)
    looper.slow_callback_duration = 0.001

    warnings.simplefilter('always')
    application = TRXApplication()
    application.listen(6969)
    db.Base.metadata.create_all(bind=db.engine)

    IOLoop.instance().start()
