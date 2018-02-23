import argparse
import asyncio
import logging
import sys
import uuid

import base64
import json
import os
import random
import warnings
from tornado import escape
from tornado import gen
from tornado.ioloop import IOLoop
from tornado.options import define
from tornado.websocket import WebSocketHandler
from tornado.web import Application, RequestHandler, StaticFileHandler

from config import config as TRXConfig
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

def check_attribute(obj, att):
    return getattr(obj, att, None) is not None


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
                user_verified = db.check_auth_by_name(name, password)
                if user_verified is not None and user_verified is not -1:
                    drupal_login = await drupal_utils.attempt_login(
                        escape.json_encode({'name': name, 'pass': password}))
                    if drupal_login is not None:
                        drupal_user_data = escape.json_decode(escape.to_basestring(drupal_login.body))
                        csrf = user_verified.generate_auth_token(expiration=1200)
                        application.create_session(user={'name': name, 'pass': password, 'id': user_verified.id},
                                                   csrf=csrf, dcsrf=drupal_user_data['csrf_token'])
                        self.set_secure_cookie("dcsrf", application.session.drupal_token())
                        self.set_secure_cookie(name="trx_cookie", value=session.Session.generate_cookie())
                    else:
                        csrf = user_verified.generate_auth_token(expiration=1200)
                        application.create_session(user={'name': name, 'pass': password, 'id': user_verified.id},
                                                   csrf=csrf)
                        self.set_secure_cookie(name="trx_cookie", value=session.Session.generate_cookie())
                        self.set_cookie(name='csrf', value=csrf)
                        if self.get_secure_cookie('redirect_target') is not None:
                            redirect_target = self.get_secure_cookie('redirect_target')
                            self.clear_cookie('redirect_target')
                            return self.redirect(redirect_target)
                        self.write(user_verified.name)

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

    async def get(self):
        result = db.latest_prices()
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

    def post(self, *args, **kwargs):
        if self.request.headers.get("Content-Type") == 'application/x-www-form-urlencoded':
            name, password, email = self.get_body_argument('name'), self.get_body_argument(
                'pass'), self.get_body_argument('email')

            if email is None or password is None or name is None:
                self.write("You must supply more arguments")
                self.write_error(401)
            else:
                user_verify = db.check_authentication(name, password, email)
                if user_verify is -1 or None:
                    user_verify = db.create_user(name, password, email)

                csrf = user_verify.generate_auth_token(expiration=1200)
                application.create_session(
                    user={'name': name, 'pass': password, 'id': user_verify.id, 'csrf': csrf})
                print(str(user_verify))
                if application.session is not None and isinstance(application.session, session.Session):
                    self.set_secure_cookie(name="trx_cookie", value=session.Session.generate_cookie())
                    return self.write(escape.json_encode({'token': str(application.session.user['csrf'], 'utf-8'),
                                                          'cookie': str(self.get_secure_cookie('trx_cookie'))}))


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

    # TODO - Sort this shit out
    async def on_message(self, message):
        print(message)
        user = application.session.drupal_user()
        decoded_user = application.session.drupal_user()
        credString = user['name'] + ':' + user['pass']
        encodedCreds = base64.b64encode(credString.encode())
        # encodedCreds = base64.b64encode(str(user['name'] + ':' + user['pass']).encode())

        post_attempt = await drupal_utils.post_status_message(
            escape.json_encode({'message': message, 'name': user['name'], 'pass': user['pass']}),
            headers={'X-CSRF-TOKEN': application.session.drupal_token()}, user=user)

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

    async def get(self, *args, **kwargs):
        found_cookie = self.get_secure_cookie("trx_cookie")
        trx_urls = TRXConfig.get_urls(application.settings['env']['TRX_ENV'])
        tx_url = trx_urls['tx_request']
        blockgen_url = trx_urls['blockgen_url']
        userbalance_url = trx_urls['userbalance_url']

        if check_attribute(application.session, 'user'):
            user_data = await db.regtest_user_data(application.session.user['id'])
            prices = await db.latest_prices_async()

            if found_cookie is not None:
                self.render("templates/tx.html", title="TRX TX Interface", tx_url=tx_url, blockgen_url=blockgen_url,
                            userbalance_url=userbalance_url, user_data=user_data, trx_prices=prices)

        else:
            self.set_secure_cookie('redirect_target', '/transaction/tx-gui')
            self.redirect('/login')

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
                 'amount': int(round(tx_request_data['amount']))})
            print(transaction_result)
            self.write(escape.json_encode({'response': 200} if transaction_result is not None else {'response': 500}))


class RegTestAddressAllHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        blockcypher_data = await db.regtest_make_user_addresses()
        self.write(escape.json_encode(blockcypher_data))


class RegTestAllUsers(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        trx_urls = TRXConfig.get_urls(application.settings['env']['TRX_ENV'])
        tx_url = trx_urls['tx_request']
        blockgen_url = trx_urls['blockgen_url']
        userbalance_url = trx_urls['userbalance_url']
        user_data = await db.regtest_all_user_data()
        blockchain_info = await db.regtest_block_info()
        currencies = db.latest_prices_async()
        self.render("templates/tx-test.html", title="Test TX Interface", data=user_data,
                    blockchain_info=blockchain_info, tx_url=tx_url, blockgen_url=blockgen_url,
                    userbalance_url=userbalance_url)


class RegTestTxHistory(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        from utils.btcd_utils import RegTest

        tx_history = await RegTest.get_tx_history()


class TrxRollbackHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        result = db.rollback_transaction()

        if result:
            self.write('Successfully rolled back')


class RegTestBlockGenerateHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        from utils.btcd_utils import RegTest
        self.write(RegTest.create_new_block())


class RegTestUserBalanceHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        sid = self.get_argument('sid')
        rid = self.get_argument('rid')
        sender_balance = await db.regtest_user_balance(uid=sid)
        recipient_balance = await db.regtest_user_balance(uid=rid)
        self.write(escape.json_encode({'users': {sid: sender_balance, rid: recipient_balance},
                                       'response': 200} if sender_balance is not None and isinstance(sender_balance,
                                                                                                     int) else {
            'response': 404}))


class RegTestPayUserHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        uid = self.get_argument('uid')
        amount = self.get_argument('amount')

        if uid and amount is not None:
            user_pay_result = await db.regtest_pay_user(uid, amount)
            self.write(str(user_pay_result))


class UiReactHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        self.render("templates/ui-main.html", title="TRX UI MAIN")


class UserProfileHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        cookie = self.get_secure_cookie("trx_cookie")
        if check_attribute(application.session, 'user'):
            user_data, prices = await retrieve_user_data()
            tx_url, blockgen_url, userbalance_url, btckeygen_url = retrieve_user_urls()
            self.set_secure_cookie(name="trx_cookie", value=session.Session.generate_cookie())
            self.render("templates/user.html", title="TRX USER PROFILE", keygen_url=btckeygen_url, tx_url=tx_url, blockgen_url=blockgen_url,
                        userbalance_url=userbalance_url, user_data=user_data, trx_prices=prices)
        else:
            self.set_secure_cookie('redirect_target', '/user')
            self.redirect('/login')


async def retrieve_user_data():
    user_data = await db.regtest_user_data(application.session.user['id'])
    prices = await db.latest_prices_async()
    return user_data, prices


def retrieve_user_urls():
    trx_urls = TRXConfig.get_urls(application.settings['env']['TRX_ENV'])
    tx_url = trx_urls['tx_request']
    blockgen_url = trx_urls['blockgen_url']
    userbalance_url = trx_urls['userbalance_url']
    btckeygen_url = trx_urls['key_gen_url']

    return tx_url, blockgen_url, userbalance_url, btckeygen_url


class KeyWTPHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        wif = self.get_argument('wif')
        if wif is not None:
            response = await http_client.connect(TRXConfig.get_urls(application.settings['env']['TRX_ENV'])['wif_to_private_url'], escape.json.dumps({'wif': wif}))
            if response:
                print(response)
                data = escape.json_decode(response.body.decode())
                self.write(data)


class RegTestUserKeyGenerateHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        found_cookie = self.get_secure_cookie("trx_cookie")

        if found_cookie is not None and application.session.user is not None:
            new_address = await db.regtest_make_user_address(application.session.user['id'])
            user_data = await db.regtest_user_data(application.session.user['id'])
            self.write(escape.json_encode(user_data))

    async def post(self, *args, **kwargs):
        content_type = self.request.headers.get('Content-Type')
        if content_type == 'application/json':
            csrf = self.request.headers.get('csrf-token')
            if db.User.verify_auth_token(csrf):
                new_address = await db.regtest_make_user_address(application.session.user['id'])
                user_data = await db.regtest_user_data(application.session.user['id'])
                self.write(escape.json_encode(user_data))



class TRXApplication(Application):
    def __init__(self):
        self.session = None
        handlers = [
            # Home
            (r"/", MainHandler),

            # User GUI

            # - Profile
            (r"/user", UserProfileHandler),
            # - Primary
            (r"/login", LoginHandler),
            (r"/register", RegisterHandler),
            (r"/transaction/tx-gui", TxGuiHandler),
            (r"/heartbeat/feed", HeartbeatHandler),

            # - Dev/Testing
            (r"/react/test", ReactTestHandler),
            (r"/ui/main", UiReactHandler),

            # Regression Testing
            (r"/regtest/all-users", RegTestAllUsers),
            (r"/regtest/user/pay", RegTestPayUserHandler),
            (r"/regtest/user-balance", RegTestUserBalanceHandler),
            (r"/regtest/tx-history", RegTestTxHistory),
            (r"/regtest/generate/block", RegTestBlockGenerateHandler),
            (r"/regtest/address/provision-all", RegTestAddressAllHandler),
            (r"/keys/btc/regtest/generate", RegTestUserKeyGenerateHandler),

            # CRON Processes
            (r"/updateprices", UpdatePriceHandler),

            # REST API

            # - Transactions
            (r"/transaction/request", TxRequestHandler),
            (r"/transaction/test", TestTransactionHandler),
            (r"/transaction/sendraw", SendTrawTransactionHandler),
            (r"/transaction/secret/rollback", TrxRollbackHandler),

            # KEYS

            (r"/key/convert/wiftoprivate", KeyWTPHandler),

            # - Prices
            # -- Graph
            (r"/prices/graph", GraphHandler),
            (r"/prices/graph/currency", CurrencyRevisionHandler),

            # -- JSON
            (r"/prices/graph/json", GraphJsonHandler),
            (r"/prices/latest", LatestPriceHandler),
            (r"/prices/currency", CurrencyHandler),

            # -- Heartbeat / Social Media
            (r"/heartbeat/create", HeartbeatCreateHandler),
            (r"/heartbeat/share/new", HeartbeatShareHandler),
            (r"/heartbeat/share/socket-new", HeartbeatSocketShareHandler),

            # Private Utilities
            (r"/users/all", UserListHandler),

            # CRUFT
            (r"/jigga", WunderHandler),
            (r"/password", PasswordHandler),
            (r"/sendmail", SendMailHandler),
            (r"/fakenews", FakeNewsHandler),

            # Static
            (r"/static/(.*)", StaticFileHandler, {"path": "/static"}),
            (r"/sites/(.*)", StaticFileHandler, {'path': os.path.join(os.path.dirname(__file__), "sites")}),
            (r"/themes/(.*)", StaticFileHandler, {'path': os.path.join(os.path.dirname(__file__), "themes")})
        ]

        settings = {
            "debug": True,
            "static_path": os.path.join(os.path.dirname(__file__), "static"),
            "template_path": os.path.join(os.path.dirname(__file__)),
            "cookie_secret": "8a573v89h7jociauroj435897j34",
            "env": None
        }

        Application.__init__(self, handlers, **settings)

    def create_session(self, user, csrf=0, dcsrf=0):
        self.session = session.Session(user=user, csrf=csrf, dcsrf=dcsrf)
        self.session.redirect_login = False


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    looper = asyncio.get_event_loop()
    looper.set_debug(True)
    looper.slow_callback_duration = 0.001

    warnings.simplefilter('always')
    application = TRXApplication()
    application.listen(6969)

    application.settings['env'] = TRXConfig.get_env_variables()

    db.Base.metadata.create_all(bind=db.engine)

    IOLoop.instance().start()
