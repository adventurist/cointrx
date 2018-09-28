import argparse
import asyncio
import logging
import sys
import uuid
import traceback

import base64
import json
import os
import random
import warnings

from graphql.error import GraphQLError
from graphql.error import format_error as format_graphql_error

from functools import wraps
from utils.btcd_utils import RegTest

from tornado import escape, httpserver
from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.options import define
from tornado.websocket import WebSocketHandler
from tornado.web import Application, RequestHandler, StaticFileHandler, HTTPError, asynchronous

from config import config as TRXConfig
from db import db
from utils.loop_handler import IOHandler
from utils.tx import trx__tx_out
from utils.tx.queue import Queue, TRXTransaction
from utils import drupal_utils, session, trc_utils, eth_utils
from utils.cointrx_client import Client
from utils.mail_helper import Sender as mail_sender

from utils.login_helpers import retrieve_api_request_headers, retrieve_json_login_headers, \
    retrieve_json_login_credentials, create_user_session_data, retrieve_login_credentials

io_handler = IOHandler()
http_client = Client()

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

def error_response(func):
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        try:
            result = func(self, *args, **kwargs)
        except Exception as ex:
            if not isinstance(ex, (HTTPError, ExecutionError, GraphQLError)):
                tb = ''.join(traceback.format_exception(*sys.exc_info()))
                logging.error('Error: {0} {1}'.format(ex, tb))
            self.set_status(error_status(ex))
            error_json = escape.json_encode({'errors': error_format(ex)})
            logging.debug('error_json: %s', error_json)
            self.write(error_json)
        else:
            return result

    return wrapper


class ExecutionError(Exception):
    def __init__(self, status_code=400, errors=None):
        self.status_code = status_code
        if errors is None:
            self.errors = []
        else:
            self.errors = [str(e) for e in errors]
        self.message = '\n'.join(self.errors)


def error_status(exception):
    if isinstance(exception, HTTPError):
        return exception.status_code
    elif isinstance(exception, (ExecutionError, GraphQLError)):
        return 400
    else:
        return 500


def error_format(exception):
    if isinstance(exception, ExecutionError):
        return [{'message': e} for e in exception.errors]
    elif isinstance(exception, GraphQLError):
        return [format_graphql_error(exception)]
    elif isinstance(exception, HTTPError):
        return [{'message': exception.log_message,
                 'reason': exception.reason}]
    else:
        return [{'message': 'Unknown server error'}]


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
        print('Receiving data')

    async def post(self, *args, **kwargs) -> str:
        """

        .. http:post:: /login

        ---------------
        REQUEST EXAMPLE

        :POST: /login
        :Accept: application/json
        :Content-Type: application/json
        :Authorization: Basic aGVsaW9zOmphc2tqYTg5cjN5dW9yaWFzamY=
        :Body: {"name":"yourname", "password":"yourpassword", "email":"youremail"}

        |

        :HEADERS:

        |

        :Accept: application/json

        - Declare your expectation to receive a response in JSON format

        **Example** ``Accept: application/json``

        |

        :Authorization: Basic (Base64 encoding of name:password)

        - Basic Auth is expected in the header (with a key of `Authorization` and a value of `Basic base64encoded` where base64encoded is the base64 encoding of `name:password`

        **Example** ``Authorization: Basic aGVsaW9zOmphc2tqYTg5cjN5dW9yaWFzamY=``

        |

        :Content-Type: application/json

            - Requests must state that that Content-Type will be application/json

            **Example** ``Content-Type: application/json``

        |

        :**BODY**:
        :Body content {string}: JSON object containing `name`, `email` and `password` keys

        - POST Parameters should be provided as the request body in JSON format

        **Example** ``{"email":"johannes@composers.com", "name":"JSBach", "password":"k0wnTT||er}@{RER3point{@LGkillah"}``

        |

        :**RESPONSE CODES**:
        :200: No error
        :400: Malformed request
        :401: Unauthorized
        :404: User not found

        |

        :**RESPONSE DATA**:
        :return: Session data as JSON: ``{"csrf-token":"value", "trx-cookie":"value"}``

        *Use the returned session data for all subsequent authenticated requests*

        """

        basic_auth, content_type = retrieve_json_login_headers(self.request.headers)

        if content_type == 'application/json':
            # auth_name, auth_pass = check_basic_auth(basic_auth)
            decoded_body = escape.json_decode(self.request.body)
            iterables = decoded_body.items()
            email, name, password = retrieve_json_login_credentials(json.loads(str(self.request.body, 'utf-8')))

            if name is None or password is None:
                self.write("You must supply more arguments")
                self.set_status(400)
                self.write_error(400)

            user_verify = db.check_authentication_by_name(name, password)
            if user_verify is not None and user_verify is not -1:
                csrf = user_verify.generate_auth_token(expiration=1200)
                application.create_session(user=create_user_session_data(name, password, user_verify, csrf))
                if application.session is not None and isinstance(application.session, session.Session):
                    self.set_secure_cookie(name="trx_cookie", value=session.Session.generate_cookie())

                    return self.write(escape.json_encode(
                        {'statuscode': 200, 'token': str(application.session.user['csrf'], 'utf-8'),
                         'trx_cookie': str(self.get_secure_cookie('trx_cookie')), 'uid': user_verify.id,
                         'name': user_verify.name}))

            elif user_verify < -1:
                self.set_status(404)
                return self.write(escape.json_encode({'statuscode': 404}))
            else:
                self.set_status(401)
                return self.write(escape.json_encode({'statuscode': 401}))

        elif self.request.headers.get("Content-Type") == 'text/html':
            name = self.get_argument('name')
            print(name)

        elif content_type == 'application/x-www-form-urlencoded':

            name, password = retrieve_login_credentials(self)

            if name is not None and password is not None and len(name) > 0:
                user_verified = db.check_auth_by_name(name, password)
                if user_verified is not None and user_verified is not -1:
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
        cookie_secret = base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)
        current_header = self.request.headers.get("Content-Type")
        print(cookie_secret)
        print(self._headers)
        print(self.get_status())
        print(current_header)

        if self.request.headers.get("Content-Type") == 'text/html':
            name = self.get_argument('name')
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

    # async def get(self):
    #     await http_client.get_prices()
    #
    #     self.write('Sent request')
    # @gen.coroutine
    async def get(self):
        price_update_result = await http_client.get_prices()

        self.write('Sent request')


class ETHPriceUpdateHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self):
        """
        @api
        @internal
        Parse ETH ticker data, store revision data and update current pricing table
        :return: application/json response
        """

        eth_data = await eth_utils.update_eth_prices()
        if eth_data is not None:
            self.write(json.dumps({'response': 201, 'data': 'placeholder CHANGE THIS'}))


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
        name = password = email = None

        req_type = self.request.headers.get("Content-Type")
        if req_type == 'application/x-www-form-urlencoded':
            name, password, email = self.get_body_argument('name'), self.get_body_argument(
                'pass'), self.get_body_argument('email')
        elif req_type == 'application/json':
            body = json.loads(self.request.body.decode('utf-8'))
            name, password, email = body['name'], body['password'], body['email']

        if email is None or password is None or name is None:
            self.write("You must supply more arguments")
            self.write_error(401)
        else:
            user_verify = db.check_authentication(name, password, email)
            if isinstance(user_verify, int) and user_verify < 0:
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
            if transaction_result is not None:
                await db.trx_block_pending()
                self.write(escape.json_encode({'response': 200}))

            else:

                self.write(escape.json_encode({'response': 500}))


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

        self.render("templates/tx-test.html", title="Test TX Interface", data=user_data,
                    blockchain_info=blockchain_info, tx_url=tx_url, blockgen_url=blockgen_url,
                    userbalance_url=userbalance_url)


class RegTestTxHistory(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
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
        self.write(RegTest.create_new_block())


class RegTestUserTotalBalanceHandler(RequestHandler):
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


class TransactionTestHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        sid = self.get_argument('sid')
        rid = self.get_argument('rid')
        amount = self.get_argument('amount')
        sender = await db.get_user(sid)
        recipient = await db.get_user(rid)
        if sender and recipient:
            if hasattr(sender, 'trxkey') and hasattr(recipient, 'trxkey'):
                print(sender.trxkey)
                if await self.create_transaction(sender, recipient, amount):
                    await db.trx_block_pending()
                    self.write('Success')
                else:
                    application.queue.enqueue(TRXTransaction(sid, rid, amount))
                    self.set_status(400)

    @staticmethod
    async def create_transaction(sender, recipient, amount):
        from utils.btcd_utils import wif_to_address
        sender_keys = []
        for key in sender.trxkey:
            if key.status:
                sender_keys.append({'address': wif_to_address(key.value), 'key': key.value})

        if len(sender_keys) > 0:
            data = {
                'sender': {
                    'address': sender_keys[0]['address'],
                    'key': sender_keys[0]['key'],
                },
                'recipient': wif_to_address(recipient.trxkey[0].value),
                'amount': amount
            }

            transaction_result = await trx__tx_out.Transaction.request_transaction(
                {'sender': data['sender'], 'recipient': data['recipient'],
                 'amount': int(round(int(data['amount'])))})
            if transaction_result:
                return True
            else:
                return False


class RegTestPayUserHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        uid = self.get_argument('uid')
        amount = self.get_argument('amount')

        if uid and amount is not None:
            user_pay_result = await db.regtest_pay_user(uid, amount)
            self.write(str(user_pay_result))


class RegTestPayAllUserHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        amount = self.get_argument('amount')
        user_pay_result = await db.regtest_pay_users(amount)
        self.write(str(user_pay_result))


class RegTestPayKeyHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        wif = self.get_argument('wif')
        amount = self.get_argument('amount')

        if wif and amount is not None:
            key_pay_result = await db.regtest_pay_key(wif, amount)
            self.write(str(key_pay_result))


class UiReactHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        self.render("templates/ui-main.html", title="TRX UI MAIN")


class UserProfileHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        if check_attribute(application.session, 'user'):
            user_data, prices = await retrieve_user_data()
            tx_url, blockgen_url, userbalance_url, btckeygen_url = retrieve_user_urls()
            self.set_secure_cookie(name="trx_cookie", value=session.Session.generate_cookie())
            self.render("templates/user.html", title="TRX USER PROFILE", keygen_url=btckeygen_url, tx_url=tx_url,
                        blockgen_url=blockgen_url,
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
        """
        @API

        Convert a WIF secret to private key
        :param args:
        :param kwargs:
        :return:
        """
        from utils.btcd_utils import wif_to_address
        wif = self.get_argument('wif')
        if wif is not None:
            self.write(wif_to_address(wif))


class RegTestUserKeyGenerateHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        found_cookie = self.get_secure_cookie("trx_cookie")

        if found_cookie is not None and application.session.user is not None:
            await db.regtest_make_user_address(application.session.user['id'])
            user_data = await db.regtest_user_data(application.session.user['id'])
            self.write(escape.json_encode(user_data))

    async def post(self, *args, **kwargs):
        content_type = self.request.headers.get('Content-Type')
        if content_type == 'application/json':
            csrf = self.request.headers.get('csrf-token')
            if db.User.verify_auth_token(csrf):
                await db.regtest_make_user_address(application.session.user['id'])
                user_data = await db.regtest_user_data(application.session.user['id'])
                self.write(escape.json_encode(user_data))
            else:
                self.write(escape.json_encode([{'error': 'Token not valid', 'code': 401}]))


def check_content_types(handler: RequestHandler):
    return handler.request.headers.get('Content-Type')


def get_csrf(handler: RequestHandler):
    return handler.request.headers.get('csrf-token')


class RegTestKillKeyHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def post(self, *args, **kwargs):
        if check_content_types(self) == 'application/json':
            csrf = self.request.headers.get('csrf-token')
            if db.User.verify_auth_token(csrf):
                key_id = self.request.headers.get('key')  # TODO make this work


class LogoutHandler(RequestHandler):
    def data_received(self, chunk):
        print(chunk)

    def get(self, *args, **kwargs):
        self.clear_all_cookies()
        application.session = None
        self.write("Logout successful")
        self.redirect('/login')

    async def post(self, *args, **kwargs):
        uid = self.get_body_argument('uid')
        token = self.get_body_argument('token')

        if uid and token:
            user_verify = db.User.verify_auth_token(token)


class TestKeyHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        jigga = self.get_argument('jigga')
        print(jigga)
        key_id = self.request.path.split('/api/key/')[1].split('/update')[0]
        print(key_id)

    async def post(self, *args, **kwargs):
        csrf, content_type = retrieve_api_request_headers(self.request.headers)
        if content_type == 'application/json':
            # TODO Check this properly cookie = self.get_secure_cookie("trx_cookie")
            if check_attribute(application.session, 'user'):
                if db.User.verify_auth_token(csrf):
                    key_id = self.request.path.split('/api/key/')[1].split('/update')[0].lstrip('0')
                    key_data = json.loads(self.request.body.decode())
                    if 'label' in key_data:
                        if await db.update_key(key_id, key_data['label']):
                            self.write(escape.json_encode([{'Update': 'Successful', 'code': 204}]))
                        else:
                            self.write(escape.json_encode([{'error': 'Key not found', 'code': 404}]))
                    else:
                        self.write(escape.json_encode([{'error': 'Bad request', 'code': 400}]))
                else:
                    self.write(escape.json_encode([{'error': 'Not authorized', 'code': 401}]))
            else:
                login_redirect(self, self.request.path)


class UserUpdateHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        jigga = self.get_argument('jigga')
        print(jigga)
        key_id = self.request.path.split('/api/key/')[1].split('/update')[0]
        print(key_id)

    async def post(self, *args, **kwargs):
        csrf, content_type = retrieve_api_request_headers(self.request.headers)
        if content_type == 'application/json':
            # TODO Check this properly cookie = self.get_secure_cookie("trx_cookie")
            if check_attribute(application.session, 'user'):
                if db.User.verify_auth_token(csrf):
                    uid = self.request.path.split('/api/user/')[1].split('/update')[0].lstrip('0')
                    user_data = json.loads(self.request.body.decode())
                    if user_data is not None:
                        if await db.update_user(uid, user_data):
                            self.write(escape.json_encode([{'Update': 'Successful', 'code': 204}]))
                        else:
                            self.write(escape.json_encode([{'error': 'Key not found', 'code': 404}]))
                    else:
                        self.write(escape.json_encode([{'error': 'Bad request', 'code': 400}]))
                else:
                    self.write(escape.json_encode([{'error': 'Not authorized', 'code': 401}]))
            else:
                login_redirect(self, self.request.path)


class RegTestPayAllKeyHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        keys_paid = await db.regtest_pay_keys('10')
        self.write(json.dumps({'response': 200, 'error': False,
                               'message': 'Successfully paid 10 btc to %s addresses' % str(
                                   keys_paid)} if keys_paid > 0 else {'response': 400, 'error': True,
                                                                      'message': 'Unable to pay any keys'}))


class BtcMinMaxHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        time = self.get_argument('time')
        minmax_data = await db.regtest_graph_data(time)
        self.write(minmax_data)


# class GraphQLHandler(RequestHandler):
#     def data_received(self, chunk):
#         pass
#
#     def __init__(self, application, request, **kwargs):
#         super().__init__(application, request, **kwargs)
#         self.schema = graphql.schema
#
#     @error_response
#     def get(self, *args, **kwargs):
#         placeholder = 'placeholder'
#
#     def post(self):
#         return self.handle_graqhql()
#
#     def handle_graqhql(self):
#         result = self.execute_graphql()
#         logging.log('DEBUG', 'GraphQL result data: %s errors: %s invalid %s',
#                     result.data, result.errors, result.invalid)
#         if result and result.invalid:
#             ex = ExecutionError(errors=result.errors)
#             logging.warn('GraphQL Error: %s', ex)
#             raise ex
#
#         response = {'data': result.data}
#         self.write(escape.json_encode(response))
#
#     def execute_graphql(self):
#         graphql_req = self.graphql_request
#         return self.schema.execute(
#             graphql_req.get('query'),
#             variable_values=graphql_req.get('variables'),
#             operation_name=graphql_req.get('operationName'),
#             context_value=graphql_req.get('context'),
#             middleware=self.middleware
#         )
#
#     @property
#     def graphql_request(self):
#         return escape.json_decode(self.request.body)
#
#     @property
#     def content_type(self):
#         return self.request.headers.get('Content-Type', 'text/plain').split(';')[0]
#
#     @property
#     def schema(self):
#         raise NotImplementedError('schema must be provided')
#
#     @property
#     def middleware(self):
#         return []
#
#     @property
#     def context(self):
#         return None
#
#     @schema.setter
#     def schema(self, value):
#         self._schema = value


class TRCPriceUpdateHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        current_trx_prices = await db.btc_hour_minmax_price()
        latest_trc_price = await db.trc_latest_price()
        for price in current_trx_prices:
            if price[0] > latest_trc_price.time:
                trc_price = trc_utils.create_mock_price(price.min, price.max)
                trc_insert_result = db.trc_insert_price(price.date, trc_price)
                logger.debug('Insert result is: ' + str(trc_insert_result))


class BotGuiHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        if check_attribute(application.session, 'user'):
            bot_gui_data = {}
            bot_gui_urls = TRXConfig.trx_urls(application.settings['env']['TRX_ENV'])['bot']

            self.set_secure_cookie(name="trx_cookie", value=session.Session.generate_cookie())
            self.render("templates/bot.html", title="TRX BOT GUI", bot_gui_urls=bot_gui_urls, bot_gui_data=bot_gui_data,
                        trx_env=application.settings['env']['TRX_ENV'])
        else:
            self.set_secure_cookie('redirect_target', self.request.path)
            self.redirect('/login')


class BotStartHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        cookie = self.get_secure_cookie('trx_cookie')
        number = self.get_argument('number')
        urls = TRXConfig.trx_urls(application.settings['env']['TRX_ENV'])['bot']
        response = await http_client.get(
            'http://localhost:9977/start' + '?number=' + str(number) + '&trx_cookie=' + str(cookie))
        if response is not None and hasattr(response, 'body'):
            response_data = str(response.body, 'utf-8')
            self.set_status(200)
            self.write(response_data)
        else:
            self.set_status(500)
            self.write(json.dumps({'response': 500, 'text': 'Error starting bots'}))


class BotTrcPriceRetrieveHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        cookie = self.get_secure_cookie('trx_cookie')
        time_length = self.get_argument('time')
        bot_id = self.get_argument('bot_id')
        urls = TRXConfig.trx_urls(application.settings['env']['TRX_ENV'])['bot']
        response = await http_client.get(
            'http://localhost:9977/bots/trc/prices' + '?bot_id=' + str(bot_id) + '&time=' + str(
                time_length) + '&trx_cookie=' + str(cookie))
        response_data = str(response.body, 'utf-8')
        self.set_status(200)
        self.write(response_data)


class UserHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        match_pattern = escape.url_unescape(self.request.path.split('/api/user/')[1])
        user = await db.fetch_users_by_name(match_pattern)
        if user is not -1:
            self.write(json.dumps(user.serialize()))

    async def patch(self, *args, **kwargs):
        if self.request.headers.get("Content-Type") == 'application/json':
            match_pattern = escape.url_unescape(self.request.path.split('/api/user/')[1])
            body = json.loads(self.request.body.decode('utf-8'))
            update_result = await db.update_user_by_name(match_pattern, body)
            if update_result is not -1:
                self.write(json.dumps(update_result.serialize()))


class RestGuiHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    def get(self, *args, **kwargs):
        routes = application.get_routes()
        self.render("templates/rest-test-gui.html", title="REST Test GUI", routes=routes)


class UserBalanceHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        uid = self.get_argument('uid')
        balance = await db.regtest_user_balance(uid=uid)
        response_code = 200 if balance is not None else 400
        response_body = {'response': response_code, 'uid': uid, 'balance': balance} if response_code == 200 else {
            'response': response_code, 'error': 'Unable to retrieve user balance'}
        self.write(json.dumps(response_body))


class RegTestClearKeysHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        self.write(json.dumps(await db.regtest_users_clear_keys()))


class RegTestTotalBalanceHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        self.write(json.dumps({'balance': await(db.regtest_total_balance())}))


class RegTestBalanceByUserHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        self.write(json.dumps({'users': await db.regtest_balance_by_user()}))


class RegTestActiveBalanceByUserHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        self.write(json.dumps({'users': await db.regtest_active_balance_by_user()}))


class RegtestUserBalanceHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        match_pattern = escape.url_unescape(self.request.path.split('/api/user/')[1]).split('/balance/regtest')[0]
        self.write(json.dumps({'users': await db.regtest_user_balance_by_key(match_pattern)}))


class TrxRouteAllHandler(RequestHandler):
    def data_received(self, chunk):
        pass

    async def get(self, *args, **kwargs):
        routes = application.get_routes()
        self.write(json.dumps(routes))


def coinmaster():
    return 16


class TRXPayUser(RequestHandler):
    async def get(self, *args, **kwargs):
        amount = self.get_argument('amount')
        name = self.request.path.split('/api/pay/user/')[1]
        user = await db.get_user_by_name(name)

        if user is not None and amount is not None:
            user_pay_result = await db.trx_pay_user(user.id, amount)
            if not user_pay_result:
                self.application.queue.enqueue(TRXTransaction(coinmaster(), user.id, amount))
            self.write(str(user_pay_result))


class TRXPayAllUsers(RequestHandler):
    async def get(self, *args, **kwargs):
        amount = self.get_argument('amount')
        pay_all_result = await db.trx_pay_users(amount)
        if pay_all_result and len(pay_all_result) > 0:
            for recipient in pay_all_result:
                application.queue.enqueue(TRXTransaction(coinmaster(), recipient, amount))


class AccountGuiHandler(RequestHandler):
    pass

    def get(self, *args, **kwargs):
        # if self.request.headers.get("Content-Type") == 'text/html':
        self.render("templates/account.html", title="TRX Accounts")


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
            (r"/logout", LogoutHandler),
            (r"/register", RegisterHandler),
            (r"/transaction/tx-gui", TxGuiHandler),
            (r"/heartbeat/feed", HeartbeatHandler),

            # - Dev/Testing
            (r"/react/test", ReactTestHandler),
            (r"/ui/main", UiReactHandler),

            # Accounts
            (r"/admin/account", AccountGuiHandler),

            # Regression Testing

            # Pay
            (r"/regtest/all-users", RegTestAllUsers),
            (r"/regtest/user/pay", RegTestPayUserHandler),
            (r"/regtest/user/pay-all", RegTestPayAllUserHandler),
            [r"/regtest/key/pay-all", RegTestPayAllKeyHandler],
            (r"/regtest/key/pay", RegTestPayKeyHandler),
            (r"/regtest/key/clear-all", RegTestClearKeysHandler),
            (r"/regtest/key/retire", RegTestKillKeyHandler),
            (r"/regtest/user-balance", RegTestUserTotalBalanceHandler),
            (r"/regtest/tx-history", RegTestTxHistory),
            (r"/regtest/generate/block", RegTestBlockGenerateHandler),
            (r"/regtest/address/provision-all", RegTestAddressAllHandler),
            (r"/regtest/balance/total", RegTestTotalBalanceHandler),
            (r"/regtest/balance/user", RegTestBalanceByUserHandler),
            (r"/regtest/balance/user/active", RegTestActiveBalanceByUserHandler),
            (r"/keys/btc/regtest/generate", RegTestUserKeyGenerateHandler),

            # Regression CoinTRX GW
            (r"/api/pay/user/(.*)", TRXPayUser),
            (r"/api/user/pay-all", TRXPayAllUsers),

            # Regression Mock Chain
            (r"/trc/price/update", TRCPriceUpdateHandler),

            # CRON Processes
            (r"/updateprices", UpdatePriceHandler),
            (r"/eth/price/update", ETHPriceUpdateHandler),

            # Bot Utilities
            (r"/admin/bot", BotGuiHandler),
            (r"/analysis/analysis[0-9].html", StaticFileHandler),
            (r"/bot/start", BotStartHandler),
            (r"/bot/trc/prices/all", BotTrcPriceRetrieveHandler),

            # REST API

            # - Testing
            (r"/api/test/rest-gui", RestGuiHandler),
            (r"/api/route/all", TrxRouteAllHandler),

            # - Transactions
            (r"/transaction/request", TxRequestHandler),
            (r"/transaction/test", TransactionTestHandler),
            (r"/transaction/sendraw", SendTrawTransactionHandler),
            (r"/transaction/secret/rollback", TrxRollbackHandler),

            # USERS
            (r"/api/user/[0-9][0-9][0-9][0-9]", UserUpdateHandler),
            # (r"/api/user/^(?=.{8,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$", UserHandler),
            (r"/api/user/(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._@%]+(?<![_.])", UserHandler),
            (r"/api/user/(.*)/balance/regtest", RegtestUserBalanceHandler),
            (r"/api/account/balance", UserBalanceHandler),

            # KEYS

            (r"/key/convert/wiftoprivate", KeyWTPHandler),
            (r"/api/key/[0-9][0-9][0-9][0-9]/update", TestKeyHandler),

            # - Prices
            # -- Graph
            (r"/prices/graph", GraphHandler),
            (r"/prices/graph/currency", CurrencyRevisionHandler),

            # -- JSON
            (r"/prices/graph/json", GraphJsonHandler),
            (r"/prices/latest", LatestPriceHandler),
            (r"/prices/currency", CurrencyHandler),
            (r"/api/prices/regtest/btc/cad/minmax/json", BtcMinMaxHandler),
            (r"/api/prices/regtest-mock/btc/cad/minmax/json", BtcMinMaxHandler),

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

            # (r"/graphql", GraphQLHandler),

            # Static
            (r"/static/(.*)", StaticFileHandler, {"path": "/static"}),
            (r"/analysis/(.*)", StaticFileHandler, {"path": "/analysis"}),
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

        self.queue = Queue()

        Application.__init__(self, handlers, **settings)

    def create_session(self, user, csrf=0, dcsrf=0):
        self.session = session.Session(user=user, csrf=csrf, dcsrf=dcsrf)
        self.session.redirect_login = False

    def get_routes(self):
        return [{'path': x.matcher._path} for x in self.default_router.rules[0].target.rules if
                x.matcher._path is not None]


def env_setup():
    parser = argparse.ArgumentParser('debugging asyncio')
    parser.add_argument(
        '-v',
        dest='verbose',
        default=False,
        action='store_true',
    )

    logging.basicConfig(
        level=logging.DEBUG,
        format='%(levelname)7s: %(message)s',
        stream=sys.stderr,
    )

    os.path.join(os.path.dirname(__file__), "static")


def login_redirect(handler: RequestHandler, origin: str):
    handler.set_secure_cookie('redirect_target', origin)
    handler.redirect('/login')


async def request_transaction(sid, rid, amount):
    return await TransactionTestHandler.create_transaction(await db.get_user(sid), await db.get_user(rid), amount)


async def handle_transaction_queue():
    coinmaster_available = True
    intra_user_pending = None
    paused = False
    while not paused and not application.queue.is_empty():
        transaction = application.queue.dequeue()
        if transaction is not None:
            if transaction.sender == coinmaster() and coinmaster_available:
                result = await db.trx_pay_user(transaction.recipient, transaction.amount)
            elif not transaction.sender == coinmaster():
                intra_user_pending = True
                result = await request_transaction(transaction.sender, transaction.recipient, transaction.amount)
                if result:
                    intra_user_pending = False
            if not result:
                application.queue.enqueue(transaction)
                if transaction.sender == coinmaster():
                    coinmaster_available = False
        if transaction == application.queue.tail.data and not intra_user_pending and not coinmaster_available:
            paused = True


async def manage_blockchain():
    if db.trx_block_is_pending():
        if RegTest.create_new_block():
            logger.info('New block added to blockchain')
            db.trx_block_not_pending()
            await handle_transaction_queue()


if __name__ == "__main__":
    env_setup()
    logger = logging.getLogger('MAIN')
    logger.setLevel(logging.DEBUG)

    log_handler = logging.FileHandler('trx.log')
    logger_formatter = logging.Formatter('%(name)s - %(levelname)s - %(message)s')
    log_handler.setFormatter(logger_formatter)

    logger.addHandler(log_handler)
    logger.info('Logger configured')

    looper = asyncio.get_event_loop()
    looper.set_debug(True)
    looper.slow_callback_duration = 0.001

    warnings.simplefilter('always')
    application = TRXApplication()
    http_server = httpserver.HTTPServer(application)
    http_server.listen(6969)

    application.settings['env'] = TRXConfig.get_env_variables()

    db.Base.metadata.create_all(bind=db.engine)
    loop_instance = IOLoop.instance()
    PeriodicCallback(manage_blockchain, 30000).start()
    loop_instance.start()
