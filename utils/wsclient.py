from tornado.ioloop import IOLoop, PeriodicCallback
from tornado import gen
from tornado.websocket import websocket_connect
from uuid import uuid4
from utils.cointrx_client import Client as http_client
from datetime import datetime
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
        self.trc_price_history = None
        self.trc_struct = TxStruct()

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
        return price_result

    async def digest_price_history(self, data):
        if self.trc_struct is not None:
            history_data = json.loads(str(data, 'utf-8'))
            if history_data is not None:
                self.trc_struct.entries = history_data

    def is_first_low(self, r):
        if self.trc_struct.f_low is not None:
            r_date = datetime.strptime(r['date'])
            f_date = datetime.strptime(self.trc_struct.f_low['date'])
            date_comparison = r_date < f_date
            value_comparison = r['high'] < self.trc_struct.f_low['value']

            return date_comparison and value_comparison

    def is_first_high(self, r):
        if self.trc_struct.f_high is not None:
            r_date = datetime.strptime(r['date'])
            f_date = datetime.strptime(self.trc_struct.f_high['date'])
            date_comparison = r_date < f_date
            value_comparison = r['high'] > self.trc_struct.f_high['value']

            return date_comparison and value_comparison

    def is_last_low(self, r):
        if self.trc_struct.l_low is not None:
            r_date = datetime.strptime(r['date'])
            f_date = datetime.strptime(self.trc_struct.l_low['date'])
            date_comparison = r_date > f_date
            value_comparison = r['high'] < self.trc_struct.l_low['value']

            return date_comparison and value_comparison

    def is_last_high(self, r):
        if self.trc_struct.l_high is not None:
            r_date = datetime.strptime(r['date'])
            f_date = datetime.strptime(self.trc_struct.l_high['date'])
            date_comparison = r_date > f_date
            value_comparison = r['high'] > self.trc_struct.l_high['value']

            return date_comparison and value_comparison

    def offset_f_low(self, r):
        numerator, denominator = r['value'] / self.trc_struct.f_low['value'], None if r['high'] > self.trc_struct.f_low[
            'value'] else None, self.trc_struct.f_low['value'] / r['value']

        if numerator:
            return (1, numerator)
        else:
            return (2, denominator)

    def offset_f_high(self, r):
        numerator, denominator = r['value'] / self.trc_struct.f_high['value'], None if r['high'] > \
                                                                                       self.trc_struct.f_high[
                                                                                           'value'] else None, \
                                 self.trc_struct.f_high['value'] / r['value']

        if numerator:
            return (1, numerator)
        else:
            return (2, denominator)

    def offset_l_low(self, r):
        numerator, denominator = r['value'] / self.trc_struct.l_low['value'], None if r['high'] > self.trc_struct.l_low[
            'value'] else None, self.trc_struct.l_low['value'] / r['value']

        if numerator:
            return (1, numerator)
        else:
            return (2, denominator)

    def offset_l_high(self, r):
        numerator, denominator = r['value'] / self.trc_struct.l_high['value'], None if r['high'] > \
                                                                                       self.trc_struct.l_high[
                                                                                           'value'] else None, \
                                 self.trc_struct.l_high['value'] / r['value']

        if numerator:
            return (1, numerator)
        else:
            return (2, denominator)

    def analyze_price_history(self):
        if self.trc_struct and hasattr(self.trc_struct, 'entries') and len(self.trc_struct.entries) > 0:
            for i, row in self.trc_struct.entries:

                offset_l_low = self.offset_l_low(row)
                offset_l_high = self.offset_l_high(row)
                offset_f_low = self.offset_f_low(row)
                offset_f_high = self.offset_f_high(row)

                max_offset = highest_offset(offset_l_high, offset_l_low, offset_f_high, offset_f_low)

                if self.is_first_low(row) is not False:
                    self.trc_struct.f_low = {'idx': i, 'value': row['high'], 'date': row['date']}
                    continue

                if self.is_first_high(row) is not False:
                    self.trc_struct.f_high = {'idx': i, 'value': row['high'], 'date': row['date']}
                    continue

                if self.is_last_low(row) is not False:
                    self.trc_struct.l_low = {'idx': i, 'value': row['high'], 'date': row['date']}
                    continue

                if self.is_last_high(row) is not False:
                    self.trc_struct.l_high = {'idx': i, 'value': row['high'], 'date': row['date']}
                    continue

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


def highest_offset(a, b, c, d):
    cursor = 0 if a > b else 1
    if cursor == 0:
        cursor = 0 if a > c else 2
        if cursor == 0:
            cursor = 0 if a > d else 3
    elif cursor == 1:
        cursor = 1 if b > c else 2
        if cursor == 1:
            cursor = 1 if a > d else 3
    return cursor


class TxStruct(object):
    def __init__(self):
        self.f_low = None
        self.f_high = None
        self.l_low = None
        self.l_high = None
        self.peak = []
        self.base = []
        self.entries = []
