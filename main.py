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

# from graphql.error import GraphQLError
# from graphql.error import format_error as format_graphql_error

from time import time
from functools import wraps
from utils.btcd_utils import RegTest

from tornado import escape, httpserver
from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.options import define
from tornado.websocket import WebSocketHandler
from tornado.web import Application, RequestHandler, StaticFileHandler, HTTPError

from config import config as TRXConfig
from db import db
from utils.loop_handler import IOHandler
from utils.tx import trx__tx_out
from utils.tx.queue import Queue, TRXTransaction
from utils import drupal_utils, session, trc_utils, eth_utils
from utils.cointrx_client import Client
from utils.mail_helper import Sender as mail_sender

from bitcoin.core import COIN

from utils.login_helpers import retrieve_api_request_headers, retrieve_json_login_headers, \
    retrieve_json_login_credentials, create_user_session_data, retrieve_login_credentials

io_handler = IOHandler()
http_client = Client()

define("port", default=6969, help="Default port for the WebServer")

TransactionError = TRXConfig.TransactionError


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

def valid_json(data):
    try:
        json.loads(data)
        return True
    except:
        return False


# def error_response(func):
#     @wraps(func)
#     def wrapper(self, *args, **kwargs):
#         try:
#             result = func(self, *args, **kwargs)
#         except Exception as ex:
#             if not isinstance(ex, (HTTPError, ExecutionError, GraphQLError)):
#                 tb = ''.join(traceback.format_exception(*sys.exc_info()))
#                 logging.error('Error: {0} {1}'.format(ex, tb))
#             self.set_status(error_status(ex))
#             error_json = escape.json_encode({'errors': error_format(ex)})
#             logging.debug('error_json: %s', error_json)
#             self.write(error_json)
#         else:
#             return result
#
#     return wrapper


class ExecutionError(Exception):
    def __init__(self, status_code=400, errors=None):
        self.status_code = status_code
        if errors is None:
            self.errors = []
        else:
            self.errors = [str(e) for e in errors]
        self.message = '\n'.join(self.errors)


# def error_status(exception):
#     if isinstance(exception, HTTPError):
#         return exception.status_code
#     elif isinstance(exception, (ExecutionError, GraphQLError)):
#         return 400
#     else:
#         return 500
#
#
# def error_format(exception):
#     if isinstance(exception, ExecutionError):
#         return [{'message': e} for e in exception.errors]
#     elif isinstance(exception, GraphQLError):
#         return [format_graphql_error(exception)]
#     elif isinstance(exception, HTTPError):
#         return [{'message': exception.log_message,
#                  'reason': exception.reason}]
#     else:
#         return [{'message': 'Unknown server error'}]


def check_attribute(obj, att):
    return getattr(obj, att, None) is not None


class TrxRequestHandler(RequestHandler):
    def data_received(self, chunk):
        pass


class MainHandler(TrxRequestHandler):
    def get(self):
        self.write("Hi Jigga, Welcome to Tornado Web Framework.")


class WunderHandler(TrxRequestHandler):
    def get(self):
        response = {'jigga1': 'always jigga'}
        self.write(response)


class LoginHandler(TrxRequestHandler):
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
                    trx_cookie = session.Session.generate_cookie()
                    self.set_secure_cookie(name="trx_cookie", value=trx_cookie)

                    return self.write(escape.json_encode(
                        {'statuscode': 200, 'token': str(application.session.user['csrf'], 'utf-8'),
                         'trx_cookie': trx_cookie.decode('utf-8'), 'uid': user_verify.id,
                         'refresh': user_verify.generate_refresh_token().decode('utf-8'),
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
                    self.set_cookie(name='refresh', value=user_verified.generate_refresh_token())
                    self.set_cookie(name='username', value=user_verified.name)
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


class SendMailHandler(TrxRequestHandler):
    def post(self):
        sender = mail_sender()
        if self.request.headers.get("Content-Type") == 'application/json':
            sender.send_mail("adventurist@gmail.com")


class FakeNewsHandler(TrxRequestHandler):
    def get(self):
        response = {'News': 'VERY fake news'}
        self.write(response)


class UpdatePriceHandler(TrxRequestHandler):
    # async def get(self):
    #     await http_client.get_prices()
    #
    #     self.write('Sent request')
    # @gen.coroutine
    async def get(self):
        price_update_result = await http_client.get_prices()

        self.write('Sent request')


class ETHPriceUpdateHandler(TrxRequestHandler):
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


class LatestPriceHandler(TrxRequestHandler):
    async def get(self):
        result = db.latest_prices()
        self.write(escape.json_encode({'TRX': result}))


class UserListHandler(TrxRequestHandler):
    def get(self):
        result = (db.get_users())
        data = {}
        for r in result:
            if isinstance(r, db.User):
                data[r.id] = r.serialize()
        self.write(escape.json_encode({'USERS': [data]}))


class CurrencyHandler(TrxRequestHandler):
    def get(self):
        # for k,v in arguments.items():
        if 'currency' in self.request.arguments:
            currency = self.get_argument('currency')
            print(currency)
            price = db.latest_price_async(currency)
            print(price)

        else:
            print('Whatchoo think this is, jigga!?')


class CurrencyRevisionHandler(TrxRequestHandler):
    def get(self):
        if 'currency' in self.request.arguments:
            currency = self.get_argument('currency')

            result = looper.run_until_complete(db.latest_price_history_async(currency))

            if result:
                return self.write({currency: result})

        else:
            print('Whatchoo think this is, jigga!?')


class RegisterHandler(TrxRequestHandler):
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


class PasswordHandler(TrxRequestHandler):
    def get(self):
        message = random.choice(
            ["We gonna DOX you, slut", "A hackathon on yo ass, bitch", "You never gonna be able to log into SHIT",
             "Now we have all your informations", "We sell your passwords to Nigeria"])
        self.render("templates/password.html", title="Jiggas Password Handler", message=message)


class GraphHandler(TrxRequestHandler):
    async def get(self):
        result = await db.latest_prices_async()

        if result:
            print(result)
            self.render("templates/graph.html", title="Price Trends", data=result)


class GraphJsonHandler(TrxRequestHandler):
    async def get(self):
        result = await db.latest_prices_async()

        if result:
            print(result)
            self.write(escape.json_encode(result))


class TestTransactionHandler(TrxRequestHandler):
    async def get(self):
        transaction = trx__tx_out.Transaction(application.session)
        # attempt = transaction.run()
        # attempt = transaction.regtest_run()
        # attempt = transaction.pytool_run()
        attempt = await transaction.testnet_run()

        return self.write({'Try': attempt})


class ReactTestHandler(TrxRequestHandler):
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

class HeartbeatHandler(TrxRequestHandler):
    def get(self, *args, **kwargs):
        found_cookie = self.get_secure_cookie("trx_cookie")
        if found_cookie is not None:
            result = looper.run_until_complete(db.heartbeat_get_all())

            self.render("templates/heartbeat.html", title="Heartbeat", heartbeats=result)


class HeartbeatCreateHandler(TrxRequestHandler):
    def get(self, *args, **kwargs):
        db.create_all_heartbeat()

        self.write('Good boy')


class HeartbeatShareHandler(TrxRequestHandler):
    def post(self, *args, **kwargs):
        self_cookie = self.get_secure_cookie("dcsrf")
        client_cookie = self.get_argument("dcsrf")
        client_cookies = self.request.cookies
        compare = self_cookie == client_cookie


class HeartbeatSocketShareHandler(WebSocketHandler):
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


class TxGuiHandler(TrxRequestHandler):
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


class TxRequestHandler(TrxRequestHandler):
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


class RegTestAddressAllHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        new_address_confirmations = await db.regtest_make_user_addresses()
        self.write(escape.json_encode(new_address_confirmations))


class RegTestAllUsers(TrxRequestHandler):
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


class RegTestTxHistory(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        pass


class TrxRollbackHandler(TrxRequestHandler):
    def get(self, *args, **kwargs):
        result = db.rollback_transaction()

        if result:
            self.write('Successfully rolled back')


class RegTestBlockGenerateHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        self.write(RegTest.create_new_block())


class RegTestUserTotalBalanceHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        sid = self.get_argument('sid')
        rid = self.get_argument('rid')
        sender_balance = await db.regtest_user_balance(uid=sid)
        recipient_balance = await db.regtest_user_balance(uid=rid)
        self.write(escape.json_encode({'users': {sid: sender_balance, rid: recipient_balance},
                                       'response': 200} if sender_balance is not None and isinstance(sender_balance,
                                                                                                     int) else {
            'response': 404}))


class TransactionTestHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        sid = self.get_argument('sid')
        rid = self.get_argument('rid')
        amount = self.get_argument('amount')
        sender = await db.get_user(sid)
        recipient = await db.get_user(rid)
        if db.sender_recipient_ready(sender, recipient):
            logger.info(
                'Attempting transaction between ' + str(sid) + ' and ' + str(rid) + ' in the amount of ' + str(
                    amount))
            if await TransactionTestHandler.handle_transaction(sender, recipient, amount):
                self.write('Success')
            else:
                application.queue.enqueue(TRXTransaction(sid, rid, amount))
                self.set_status(202)
                self.write(json.dumps({'code': 202, 'result': 'Queued',
                                       'message': 'The request was accepted, but has been queued for processing at a later time.'}))

    @staticmethod
    async def handle_transaction(sender, recipient, amount):
        if await TransactionTestHandler.create_transaction(sender, recipient, amount):
            await db.trx_block_pending()
            return True
        return False

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

            return await trx__tx_out.Transaction.request_transaction(
                {'sender': data['sender'], 'recipient': data['recipient'],
                 'amount': int(round(int(data['amount'])))})


class RegTestPayUserHandler(TrxRequestHandler):

    async def get(self, *args, **kwargs):
        uid = self.get_argument('uid')
        amount = self.get_argument('amount')

        if uid and amount is not None:
            user_pay_result = await db.regtest_pay_user(uid, amount)
            self.write(str(user_pay_result))


class RegTestPayAllUserHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        amount = self.get_argument('amount')
        user_pay_result = await db.regtest_pay_users(amount)
        self.write(str(user_pay_result))


class RegTestPayKeyHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        wif = self.get_argument('wif')
        amount = self.get_argument('amount')

        if wif and amount is not None:
            key_pay_result = await db.regtest_pay_key(wif, amount)
            self.write(str(key_pay_result))


class UiReactHandler(TrxRequestHandler):
    def get(self, *args, **kwargs):
        self.render("templates/ui-main.html", title="TRX UI MAIN")


class UserProfileHandler(TrxRequestHandler):
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


class KeyWTPHandler(TrxRequestHandler):
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


class RegTestUserKeyGenerateHandler(TrxRequestHandler):
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


class RegTestKillKeyHandler(TrxRequestHandler):
    async def post(self, *args, **kwargs):
        if check_content_types(self) == 'application/json':
            csrf = self.request.headers.get('csrf-token')
            if db.User.verify_auth_token(csrf):
                key_id = self.request.headers.get('key')  # TODO make this work


class LogoutHandler(TrxRequestHandler):
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


class TestKeyHandler(TrxRequestHandler):
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
                            self.write(escape.json_encode([{'Update': 'Successful', 'code': 200}]))
                        else:
                            self.set_status(404)
                            self.write(escape.json_encode([{'error': 'Key not found', 'code': 404}]))
                    else:
                        self.set_status(400)
                        self.write(escape.json_encode([{'error': 'Bad request', 'code': 400}]))
                else:
                    self.set_status(401)
                    self.write(escape.json_encode([{'error': 'Not authorized', 'code': 401}]))
            else:
                login_redirect(self)


class UserUpdateHandler(TrxRequestHandler):
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
                            self.set_status(204)
                        else:
                            self.write(escape.json_encode([{'error': 'Key not found', 'code': 404}]))
                            self.set_status(404)
                    else:
                        self.write(escape.json_encode([{'error': 'Bad request', 'code': 400}]))
                        self.set_status(400)
                else:
                    self.write(escape.json_encode([{'error': 'Not authorized', 'code': 401}]))
                    self.set_status(401)
            else:
                login_redirect(self)


class RegTestPayAllKeyHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        keys_paid = await db.regtest_pay_keys('10')
        self.write(json.dumps({'response': 200, 'error': False,
                               'message': 'Successfully paid 10 btc to %s addresses' % str(
                                   keys_paid)} if keys_paid > 0 else {'response': 400, 'error': True,
                                                                      'message': 'Unable to pay any keys'}))


class BtcMinMaxHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        time = self.get_argument('time', '60')
        days = self.get_argument('days', '3')
        minmax_data = await db.regtest_graph_data(time, days)
        self.write(minmax_data)


# class GraphQLHandler(TrxRequestHandler):
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


class TRCPriceUpdateHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        current_trx_prices = await db.btc_hour_minmax_price()
        latest_trc_price = await db.trc_latest_price()
        for price in current_trx_prices:
            if price[0] > latest_trc_price.time:
                trc_price = trc_utils.create_mock_price(price.min, price.max)
                trc_insert_result = db.trc_insert_price(price.date, trc_price)
                logger.debug('Insert result is: ' + str(trc_insert_result))


class BotGuiHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        if check_attribute(application.session, 'user'):
            bot_gui_data = {}
            bot_gui_urls = TRXConfig.trx_urls(application.settings['env']['TRX_ENV'])['bot']
            bot_urls_json = json.dumps({'urls': bot_gui_urls})

            self.set_secure_cookie(name="trx_cookie", value=session.Session.generate_cookie())
            self.set_secure_cookie(name="bot_urls", value=bot_urls_json)
            self.render("templates/bot.html", title="TRX BOT GUI", bot_gui_urls=bot_gui_urls, bot_gui_data=bot_gui_data,
                        trx_env=application.settings['env']['TRX_ENV'])
        else:
            self.set_secure_cookie('redirect_target', self.request.path)
            self.redirect('/login')


class BotStartHandler(TrxRequestHandler):
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


class BotTrcPriceRetrieveHandler(TrxRequestHandler):
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


class UserHandler(TrxRequestHandler):
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


class RestGuiHandler(TrxRequestHandler):
    def get(self, *args, **kwargs):
        routes = application.get_routes()
        self.render("templates/rest-test-gui.html", title="REST Test GUI", routes=routes)


class UserBalanceHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        uid = self.get_argument('uid')
        balance = await db.regtest_user_balance(uid=uid)
        response_code = 200 if balance is not None else 400
        response_body = {'response': response_code, 'uid': uid, 'balance': balance} if response_code == 200 else {
            'response': response_code, 'error': 'Unable to retrieve user balance'}
        self.write(json.dumps(response_body))


class RegTestClearKeysHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        self.write(json.dumps(await db.regtest_users_clear_keys()))


class RegTestTotalBalanceHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        self.write(json.dumps({'balance': await(db.regtest_total_balance())}))


class RegTestBalanceByUserHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        self.write(json.dumps({'users': await db.regtest_balance_by_user()}))


class RegTestActiveBalanceByUserHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        self.write(json.dumps({'users': await db.regtest_active_balance_by_user(), 'code': 200}))


class RegtestUserBalanceHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        match_pattern = escape.url_unescape(self.request.path.split('/api/user/')[1]).split('/balance/regtest')[0]
        self.write(json.dumps({'users': await db.regtest_user_balance_by_key(match_pattern)}))


class TrxRouteAllHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        routes = application.get_routes()
        self.write(json.dumps(routes))


def coinmaster():
    return 16


class TRXAccountHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        self.write(json.dumps({
            'accounts': await db.regtest_balance_by_account(
                self.get_argument('active', False) == 'true'
            ),
            'code': 200
        }))


class TRXPayUser(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        amount = self.get_argument('amount')
        name = self.request.path.split('/api/pay/user/')[1]
        user = await db.get_user_by_name(name)

        if user is not None and amount is not None:
            user_pay_result = await db.trx_pay_user(user.id, amount)
            if not user_pay_result:
                self.application.queue.enqueue(TRXTransaction(coinmaster(), user.id, amount))
            self.write(str(user_pay_result))


class TRXPayAllUsers(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        amount = self.get_argument('amount')
        pay_all_result = await db.trx_pay_users(amount)
        if pay_all_result and len(pay_all_result) > 0:
            for recipient in pay_all_result:
                application.queue.enqueue(TRXTransaction(coinmaster(), recipient, amount))


class AccountGuiHandler(TrxRequestHandler):
    def get(self, *args, **kwargs):

        if check_attribute(application.session, 'user'):
            set_trx_cookie(self)
            account_urls = TRXConfig.account_urls(application.get_env()['TRX_ENV'])
            self.render("templates/account.html", title="TRX Accounts", account_urls=account_urls)
        else:
            login_redirect(self)


class TRXQueueHandler(TrxRequestHandler):
    def get(self, *args, **kwargs):
        self.write(json.dumps(application.get_queue()))


class TRXKeyActivateHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        key_id = self.get_argument('key_id', None)
        if key_id:
            self.write(json.dumps({
                'code': 200 if await db.enable_key(key_id) else 400,
                'kid': key_id
            }))
        else:
            self.write(json.dumps({'code': 400, 'message': 'No key ID given'}))


class TRXKeyDeactivateHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        key_id = self.get_argument('key_id', None)
        if key_id:
            self.write(json.dumps({
                'code': 200 if await db.disable_key(key_id) else 400,
                'kid': key_id
            }))
        else:
            self.write(json.dumps({'code': 400, 'message': 'No key ID given'}))


class TRXBotHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        self.write(json.dumps({
            'accounts': await db.regtest_balance_by_account(
                self.get_argument('active', False) == 'true'
            ),
            'code': 200
        }))


class TRUserNewPassHandler(TrxRequestHandler):
    async def post(self, *args, **kwargs):
        csrf, content_type = retrieve_api_request_headers(self.request.headers)
        error = None
        if db.User.verify_auth_token(csrf):
            data = json.loads(self.request.body.decode('utf-8'))
            password = data['password']
            uid = data['uid']
            if password:
                if await db.password_override(uid, password):
                    code = 200
                    error = 'false'
                else:
                    code = 401
                    error = 'true'
            else:
                code = 400
                error = 'true'
        else:
            code = 401
        self.set_status(code)
        self.write(json.dumps({'code': code, 'error': error}))


class WSHandler(WebSocketHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request, **kwargs)
        self.connections = []

    def open(self):
        self.connections.append(self)
        logger.info('connection added')

    def on_close(self):
        print('superfluous information')
        self.connections.remove(self)
        logger.info('connection removed')


class TRXSubscriptionHandler(WSHandler):
    async def on_message(self, message):
        from utils.ws_request_handler import handle_ws_request
        logger.debug('Message received: %s' % str(message))
        if valid_json(message):
            message_data = json.loads(message)
            if 'type' in message_data:
                result = await handle_ws_request(message_data['type'], message_data['data'])
                self.write_message(json.dumps(result))
            elif 'init' in message_data:
                self.write_message(json.dumps({'action': 'subscription:continue'}))
        else:
            self.write_message(json.dumps({'message': 'Message received at %s' % str(time()), 'keepAlive': 1}))


class TRXTokenVerifyHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        token = self.get_argument('access_token', None)
        if token:
            if db.User.verify_auth_token(token):
                response = 200
                result = 'valid'
            else:
                response = 401
                result = 'unauthorized'
            self.write(json.dumps({'response': response, 'result': result}))
        else:
            self.set_status(400)


class TradeGuiHandler(TrxRequestHandler):
    async def get(self, *args, **kwargs):
        if check_attribute(application.session, 'user'):
            user_data, prices = await retrieve_user_data()
            bids, offers = await db.get_bids(), await db.get_offers()
            self.render("templates/trade.html", title="TRX Trade Control", trx_prices=prices, user_data=user_data,
                        bids=bids, offers=offers)
        else:
            login_redirect(self)


class BidHandler(TrxRequestHandler):

    async def get(self, *args, **kwargs):
        self.write(json.dumps(await db.get_bids()))

    async def post(self, *args, **kwargs):
        body = json.loads(self.request.body.decode('utf-8'))
        uid, rate, amount, date, currency = body['uid'], body['rate'], body['amount'], body['date'], body['currency']
        if uid is not None and rate is not None and amount is not None and date is not None and currency is not None:
            result = await db.create_bid(uid, rate, amount, date, currency)
            self.write(json.dumps(result))


class OfferHandler(TrxRequestHandler):

    async def get(self, *args, **kwargs):
        self.write(json.dumps(await db.get_offers()))

    async def post(self, *args, **kwargs):
        body = json.loads(self.request.body.decode('utf-8'))
        uid, rate, amount, date, currency = body['uid'], body['rate'], body['amount'], body['date'], body['currency']
        if uid is not None and rate is not None and amount is not None and date is not None and currency is not None:
            result = await db.create_offer(uid, rate, amount, date, currency)
            self.write(json.dumps(result))


class TradeRequestHandler(TrxRequestHandler):
    """
    Handles all trades originating from bids or offers
    """
    async def post(self, *args, **kwargs):
        body = json.loads(self.request.body.decode('utf-8'))
        trade, trade_type, acceptor = body['trade'], body['trade']['type'], body['uid']
        trade_response, trade_object = None, None
        if trade and trade_type and acceptor:
            if trade_type == 'offer':
                trade_object = await db.get_offer(trade['id'])
                trade_response = await request_trade(acceptor, trade_object.uid, trade_object.amount, trade_object.rate, trade_object.currency)
            elif trade_type == 'bid':
                trade_object = await db.get_bid(trade['id'])
                trade_response = await request_trade(trade_object.uid, acceptor, trade_object.amount, trade_object.rate, trade_object.currency)
            else:
                self.set_status(400)
                self.write(json.dumps({'code': 400, 'message': 'Invalid trade type'}))
            trade_response['completed'] = await db.trade_finish(trade_object)
            self.write(json.dumps(trade_response))


async def request_trade(sid, rid, amount, rate, currency):
    sender = await db.get_user(sid)
    recipient = await db.get_user(rid)
    if db.sender_recipient_ready(sender, recipient):
        logger.info(
            'Attempting trade between ' + str(sid) + ' and ' + str(rid) + ' in the amount of ' + str(
                amount) + ' at a rate of ' + str(rate) + 'rate ' + str(currency) + ' for a total of: ' + str(
                rate * amount))
        try:
            if await TransactionTestHandler.handle_transaction(sender, recipient, COIN * amount):
                #  Transfer funds
                return {'result': True, 'transaction': True, 'code': 200}
            else:
                application.queue.enqueue(TRXTransaction(sid, rid, COIN * amount))
                await db.trx_block_pending()
                return {'result': True, 'transaction': False, 'code': 202,
                        'message': 'The request was accepted, but has been queued for processing at a later time.'}
        except Exception as e:
            return {'result': False, 'transaction': False, 'code': 400, 'message': str(e)}


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
            (r"/trade", TradeGuiHandler),
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

            # Regression CoinTRX Subscription

            (r"/services/subscribe/ws", TRXSubscriptionHandler),
            (r"/api/pay/user/(.*)", TRXPayUser),
            (r"/api/user/pay-all", TRXPayAllUsers),
            (r"/api/account", TRXAccountHandler),
            (r"/api/bot", TRXBotHandler),
            (r"/api/user/(.*)/newpassword", TRUserNewPassHandler),

            # Regression CoinTRX GW: Keys
            (r"/api/key/activate", TRXKeyActivateHandler),
            (r"/api/key/deactivate", TRXKeyDeactivateHandler),

            # Regression CoinTRX GW: Transactions
            (r"/api/trade/request", TradeRequestHandler),

            # Regression CoinTRX GW: Tokens
            (r"/api/token/verify", TRXTokenVerifyHandler),
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

            # BIDS & OFFERS

            (r"/bid", BidHandler),
            (r"/offer", OfferHandler),

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
            (r"/api/queue", TRXQueueHandler),

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

    def get_env(self):
        return self.settings['env']

    def get_trx_env(self):
        return self.get_env()['TRX_ENV']

    def get_queue(self):
        return self.queue.get_all_nodes()


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


def login_redirect(handler: RequestHandler):
    handler.set_secure_cookie('redirect_target', handler.request.path)
    handler.redirect('/login')


async def request_transaction(sid, rid, amount):
    return await TransactionTestHandler.create_transaction(await db.get_user(sid), await db.get_user(rid), amount)


async def handle_failed_transaction(result: dict):
    message, code = result['error'], result['code']
    logger.info('Transaction failed with {} code.\n Message: \n{}'.format(message, code))
    if int(code) == TransactionError.INSUFFICIENT_FUNDS:
        logger.debug('Must inform user of insufficient funds')
        return {'result': 'handling complete'}



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
                    if 'error' in result:
                        await handle_failed_transaction(result)
                    intra_user_pending = False
            if not result:
                application.queue.enqueue(transaction)
                if transaction.sender == coinmaster():
                    coinmaster_available = False
            if application.queue.is_empty():
                break
            elif transaction == application.queue.tail.data and not intra_user_pending and not coinmaster_available:
                paused = True
        else:
            break


async def manage_blockchain():
    if db.trx_block_is_pending():
        if RegTest.create_new_block():
            logger.info('New block added to blockchain')
            db.trx_block_not_pending()
            await handle_transaction_queue()


def set_trx_cookie(handler: RequestHandler):
    handler.set_secure_cookie(name="trx_cookie", value=session.Session.generate_cookie())


async def connect_to_database():
    await db.connect_to_db()


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
    logger.debug('Environment set')
    logger.debug(json.dumps(application.settings['env']))

    looper.run_until_complete(connect_to_database())

    loop_instance = IOLoop.instance()

    PeriodicCallback(manage_blockchain, 30000).start()
    loop_instance.start()
