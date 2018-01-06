import argparse
import asyncio
import logging
import sys
import uuid

import base64
import os
import random
import warnings
from tornado import escape
from tornado import gen
from tornado.ioloop import IOLoop
from tornado.options import define
from tornado.websocket import WebSocketHandler
from tornado.web import Application, RequestHandler, StaticFileHandler

from db import db
from iox.loop_handler import IOHandler
from tx import trx__tx_out
from utils import drupal_utils, session
from utils.cointrx_client import Client
from utils.mail_helper import Sender as mail_sender

from requests.auth import HTTPBasicAuth

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

    async def post(self) -> str:
        cookie_data = self.get_secure_cookie('trx_cookie')
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
                user_verify = db.check_authentication(name, password, email)
                if user_verify is not -1:
                    csrf = user_verify.generate_auth_token(expiration=1200)
                    application.create_session(
                        user={'name': name, 'pass': password, 'id': user_verify.id, 'csrf': csrf})
                    if application.session is not None and isinstance(application.session, session.Session):
                        self.set_secure_cookie(name="trx_cookie", value=session.Session.generate_cookie())
                        return self.write(escape.json_encode({'token': str(application.session.user['csrf'], 'utf-8'),
                                                              'cookie': str(self.get_secure_cookie('trx_cookie'))}))

                    print(str(user_verify))
        elif self.request.headers.get("Content-Type") == 'text/html':
            name = self.get_argument('name')
            print(name)

        elif current_header == 'application/x-www-form-urlencoded':

            name, password = self.get_body_argument('name'), self.get_body_argument('pass')

            if name is not None and password is not None and len(name) > 0:
                user_verified = db.check_authentication(name, password, 'jigga@riffic.com')
                if user_verified is not None:
                    drupal_login = await drupal_utils.attempt_login(
                        escape.json_encode({'name': name, 'pass': password}))
                    if drupal_login is not None:
                        drupal_user_data = escape.json_decode(escape.to_basestring(drupal_login.body))
                        csrf = user_verified.generate_auth_token(expiration=1200)
                        application.create_session(user={'name': name, 'pass': password, 'id': user_verified.id},
                                                   csrf=csrf, dcsrf=drupal_user_data['csrf_token'])
                        self.set_secure_cookie("dcsrf", application.session.drupal_token())
                        self.set_secure_cookie(name="trx_cookie", value=session.Session.generate_cookie())
                        reflect = self

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

        message = random.choice(["Be Cool", "Don't be a Bitch", "Try not to be a Cunt", "Don't be a fat ass slut",
                                 "Respect yourself, bitch", "Try not to be such a Cuck, at least some of the time",
                                 "Find out if you can learn to be less of a Faggot Sonofabitchnogoodlowlife",
                                 "If you can not be a bitch for 10 seconds, it will be a magnificent achievement"])
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
        self.write(escape.json_encode({'TRX': result}))


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
        message = random.choice(["Be Cool", "Don't be a Bitch", "Try not to be a Cunt", "Don't be a fat ass slut",
                                 "Respect yourself, bitch", "Try not to be such a Cuck, at least some of the time",
                                 "Find out if you can learn to be less of a Faggot Sonofabitchnogoodlowlife",
                                 "If you can not be a bitch for 10 seconds, it will be a magnificent achievement"])
        self.render("templates/register.html", title="Jiggas Register Handler", message=message)


class PasswordHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        message = random.choice(
            ["We gonna DOX you, slut", "A hackathon on yo ass, bitch", "You never gonna be able to log into SHIT",
             "Now we have all your informations", "We sell your passwords to Nigeria"])
        self.render("templates/password.html", title="Jiggas Password Handler", message=message)


class GraphHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self):
        result = await db.latest_prices_async()

        if result:
            print(result)
            self.render("templates/graph.html", title="Price Trends", data=result)


class GraphJsonHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self):
        result = await db.latest_prices_async()

        if result:
            print(result)
            self.write(escape.json_encode(result))


class GraphFilterHandler(RequestHandler):
    def data_received(self, chunk):
        pass


class TestTransactionHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self):
        transaction = trx__tx_out.Transaction(application.session)
        # attempt = transaction.run()
        # attempt = transaction.regtest_run()
        # attempt = transaction.pytool_run()
        attempt = await transaction.testnet_run()

        return self.write({'Try': attempt})


class ReactTestHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        self.render("templates/test.html", title="React Test")


# addr = "address"
# html = ("""<html>
#
#   <head>
#     <script language=\"javascript\">
#       var ws = new WebSocket(""" + addr +""");
#       ws.onopen = function() {
#          ws.send(\"Hello\");
#       };
#       ws.onmessage = function (evt) {
#          alert(evt.data);
#       };
#     </script>
#   </head>
#
#   <body>
#     <p>sample websocket with Tornado</p>
#   </body>
#
# </html>
# """)


class SendTrawTransactionHandler(RequestHandler):
    def data_received(self, chunk):
        pass

        # def get(self, *args, **kwargs):
        # if 'txid_out' in self.request.arguments:
        #     txid_out = self.get_argument('txid_out')
        #     if len(txid_out) > 0:


class HeartbeatHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        found_cookie = self.get_secure_cookie("trx_cookie")
        if found_cookie is not None:
            result = looper.run_until_complete(db.heartbeat_get_all())

            self.render("templates/heartbeat.html", title="Heartbeat", heartbeats=result)


class HeartbeatCreateHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        db.create_all_heartbeat()

        self.write('Good boy')


class HeartbeatShareHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def post(self, *args, **kwargs):
        self_cookie = self.get_secure_cookie("dcsrf")
        client_cookie = self.get_argument("dcsrf")
        client_cookies = self.request.cookies
        compare = self_cookie == client_cookie


class HeartbeatSocketShareHandler(WebSocketHandler):
    def data_received(self, chunk):
        pass

    async def on_message(self, message):
        print(message)
        user = application.session.drupal_user()
        decoded_user = application.session.drupal_user()
        credString = user['name'] + ':' + user['pass']
        encodedCreds = base64.b64encode(credString.encode())
        # encodedCreds = base64.b64encode(str(user['name'] + ':' + user['pass']).encode())

        post_attempt = await drupal_utils.post_status_message(
            escape.json_encode({'message': message, 'name': user['name'], 'pass': user['pass']}),
            headers={'X-CSRF-Token': application.session.drupal_token()}, user=user)

        # post_attempt = await drupal_utils.post_status_message(
        #     escape.json_encode({'message': message, 'name': user['name'], 'pass': user['pass']}),
        #     headers=drupal_utils.make_headers(user['name'], user['pass'], application.session))
        # {'X-CSRF-Token': application.session.drupal_token(), 'Authorization': 'Basic ' + str(
        #     base64.b64encode(str(user['name'] + ':' + user['pass']).encode())),
        #          })
        done = 'done'

    def open(self):
        dcsrf = self.request.cookies
        dcsrf_decoded = self.get_secure_cookie('dcsrf')
        print(str(dcsrf))
        cookies = application.session.drupal_token()
        if cookies.encode() == dcsrf_decoded:
            status_message = self.get
        else:
            self.close(403, 'You should know not to, punk')


class TxGuiHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        found_cookie = self.get_secure_cookie("trx_cookie")
        if found_cookie is not None:
            self.render("templates/tx.html", title="TRX TX Interface")
        else:
            self.write("you need to LOGIN")

    def post(self, *args, **kwargs):
        pass


class TxRequestHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def post(self, *args, **kwargs):
        tx_request_data = escape.json_decode(self.request.body)

        if 'sender' in tx_request_data and 'recipient' in tx_request_data and 'amount' in tx_request_data:
            transaction_result = await trx__tx_out.Transaction.request_transaction(
                {'sender': tx_request_data['sender'], 'recipient': tx_request_data['recipient'],
                 'amount': tx_request_data['amount']})


class BCypherInfoHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        blockcypher_data = trx__tx_out.Transaction.bcypher_new_address()


class BCypherAddressAllHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        blockcypher_data = await db.bcypher_make_user_addresses()
        self.write(escape.json_encode(blockcypher_data))


class SubProcessHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        from utils import btcd_utils

        result = btcd_utils.make_dir_in_home()
        self.write(result)


class TRXApplication(Application):
    def __init__(self):
        self.session = None
        settings = {
            "debug": True,
            "static_path": os.path.join(os.path.dirname(__file__), "static"),
            "template_path": os.path.join(os.path.dirname(__file__)),
            "cookie_secret": "8a573v89h7jociauroj435897j34"
        }
        handlers = [
            (r"/", MainHandler),
            (r"/sites/(.*)", StaticFileHandler, {'path': os.path.join(os.path.dirname(__file__), "sites")}),
            (r"/themes/(.*)", StaticFileHandler, {'path': os.path.join(os.path.dirname(__file__), "themes")}),
            (r"/jigga", WunderHandler),
            (r"/login", LoginHandler),
            (r"/register", RegisterHandler),
            (r"/password", PasswordHandler),
            (r"/sendmail", SendMailHandler),
            (r"/fakenews", FakeNewsHandler),
            (r"/updateprices", UpdatePriceHandler),
            (r"/bcypher/info", BCypherInfoHandler),
            (r"/bcypher/address/provision-all", BCypherAddressAllHandler),
            (r"/prices/latest", LatestPriceHandler),
            (r"/prices/currency", CurrencyHandler),
            (r"/prices/graph", GraphHandler),
            (r"/prices/graph/json", GraphJsonHandler),
            (r"/prices/graph/currency", CurrencyRevisionHandler),
            (r"/transaction/request", TxRequestHandler),
            (r"/transaction/test", TestTransactionHandler),
            (r"/transaction/sendraw", SendTrawTransactionHandler),
            (r"/transaction/tx-gui", TxGuiHandler),
            (r"/react/test", ReactTestHandler),
            (r"/heartbeat/feed", HeartbeatHandler),
            (r"/heartbeat/create", HeartbeatCreateHandler),
            (r"/heartbeat/share/new", HeartbeatShareHandler),
            (r"/heartbeat/share/socket-new", HeartbeatSocketShareHandler),
            (r"/users/all", UserListHandler),
            (r"/subprocess/test", SubProcessHandler),
            (r"/static/(.*)", StaticFileHandler, {
                "path": "/static"})
        ]

        Application.__init__(self, handlers, **settings)

    def create_session(self, user, csrf=0, dcsrf=0):
        self.session = session.Session(user=user, csrf=csrf, dcsrf=dcsrf)


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

'''
Set-Cookie: dcsrf="2|1:0|10:1511755712|5:dcsrf|60:MUxHTG51aGxkZENydjFFOWZRVjZITVVmUEw1QkhQeXc0SGlFUmIyMjhrWQ==|a54c835c228a53880392c224b0683ec664067673dea9d5acd7bcc1dda8bf48cd"

'1LGLnuhlddCrv1E9fQV6HMUfPL5BHPyw4HiERb228kY'

'''
