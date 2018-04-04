from tornado.ioloop import IOLoop, PeriodicCallback
from tornado import gen
from tornado.websocket import websocket_connect
from uuid import uuid4
from utils.cointrx_client import Client as http_client
import json


class Client(object):
    def __init__(self, id, timeout=20000):
        self.id = id
        self.timeout = timeout
        self.ioloop = IOLoop.instance()
        self.ws = None
        PeriodicCallback(self.keep_alive, timeout).start()

    @staticmethod
    def receive_message(self, msg):
        print('Message received:' + msg)

    @gen.coroutine
    def connect(self, url):
        print("trying to connect")
        try:
            self.ws = yield websocket_connect(url, on_message_callback=receive_message)
        except Exception as e:
            print("connection error")
        else:
            print("connected")
            self.run()

    def write_message(self, msg):
        if self.ws is None:
            yield self.connect()
        self.ws.write_message(msg)

    @gen.coroutine
    def run(self):
        while True:
            msg = yield self.ws.read_message()
            if msg is None:
                print("connection closed")
                self.ws = None
                break

    def keep_alive(self):
        if self.ws is None:
            self.connect()
        else:
            self.ws.write_message("Keep alive with id: " + str(self.id))


class Bot(object):
    def __init__(self, config, logger):
        self.id = uuid4()
        self.client = Client(id=self.id, timeout=config.timeout)
        self.http_client = http_client()
        self.logger = logger
        self.number = config.number
        self.credentials = None
        self.session = None

    def set_credentials(self, credentials):
        self.credentials = credentials

    def dump_self(self):
        self.logger.debug(str(self.__dict__))

    def write_message(self):
        self.client.write_message('Sending message from: ' + str(self.id))

    def connect(self):
        yield self.client.connect(url='ws://localhost:9977/')

    def identify(self):
        return "Bot Number " + str(self.number) + " and my ID is " + str(self.id)

    async def retrieve_price_history(self):
        price_url = 'http://localhost:6969/api/prices/regtest/btc/cad/minmax/json'
        price_result = await self.http_client.get(url=price_url)
        print(str(price_result.body))
        return 'Jigga'

        # self.logger.debug(price_history)

    async def login(self):
        print('login')
        login_url = 'http://localhost:6969/login'

        login_result = await self.http_client.connect(
            url=login_url,
            body=json.dumps(self.credentials),
            headers={'Content-Type': 'application/json'}
        )

        if login_result:
            login_response = json.loads(login_result.body.decode('utf-8'))
            if 'token' in login_response and 'trx_cookie' in login_response:
                session_data = {'token': login_response['token'], 'trx_cookie': login_response['trx_cookie']}
                self.session = session_data

            else:
                self.logger.info('Unable to login')
                self.logger.debug('Session data was ' + str(login_response))
                return

            self.logger.info('Bot ' + str(self.number) + ' successfully logged into TRX')


def receive_message(msg):
    m = parse_message(msg)
    print(str(m))


def parse_message(msg):
    return_msg = {}
    if isinstance(msg, dict) and 'result' in dict:
        return_msg['result'] = msg['result']

    return_msg['all'] = msg

    return return_msg
