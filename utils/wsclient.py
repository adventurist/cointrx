from tornado.ioloop import IOLoop, PeriodicCallback
from tornado import gen
from tornado.websocket import websocket_connect, WebSocketError
from uuid import uuid4
from utils.cointrx_client import Client as http_client
from datetime import datetime
from decimal import Decimal
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
        except WebSocketError as e:
            print(str(e))
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
                return True
            else:
                return {'error': 'Unable to digest price history'}

    def is_first_low(self, r, idx):
        """ Check to see if row occurs within first historical period """
        if is_first_period(as_unixtime(r['date']), date_metrics(as_unixtime(self.trc_struct.entries[0]['date']),
                                                                as_unixtime(self.trc_struct.entries[len(
                                                                        self.trc_struct.entries) - 1]['date']))[0]):
            # Only replace with more recent if value is more than 10% lower
            if more_than_3_percent_lower(r['high'], self.trc_struct.f_low['value'], self.trc_struct.max_offset):
                self.trc_struct.f_low['value'] = Decimal(r['high'])
                self.trc_struct.f_low['idx'] = idx
                return True

    def is_first_high(self, r, idx):
        if is_first_period(as_unixtime(r['date']), date_metrics(as_unixtime(self.trc_struct.entries[0]['date']),
                                                                as_unixtime(self.trc_struct.entries[len(
                                                                        self.trc_struct.entries) - 1]['date']))[0]):
            # Only avoid replacing with more recent if previous value is more than 10% higher
            if (is_higher(r['high'], self.trc_struct.f_low['value'])) and (
                is_higher(r['high'], self.trc_struct.f_high['value']) or is_within_3_percent_under(r['high'],
                                                                                                   self.trc_struct.f_high[
                                                                                                       'value'],
                                                                                                   self.trc_struct.max_offset)):
                self.trc_struct.f_high['value'] = Decimal(r['high'])
                self.trc_struct.f_high['idx'] = idx
                return True

    def is_last_low(self, r, idx):
        if is_last_period(as_unixtime(r['date']), date_metrics(as_unixtime(self.trc_struct.entries[0]['date']), as_unixtime(self.trc_struct.entries[len(self.trc_struct.entries) - 1]['date']))[1]):
            if not (more_than_3_percent_higher(r['high'], self.trc_struct.f_high['value'], self.trc_struct.max_offset)):
                    self.trc_struct.l_low['value'] = Decimal(r['high'])
                    self.trc_struct.l_low['idx'] = idx
                    return True

    def is_last_high(self, r, idx):
        if is_last_period(as_unixtime(r['date']), date_metrics(as_unixtime(self.trc_struct.entries[0]['date']), as_unixtime(self.trc_struct.entries[len(self.trc_struct.entries) - 1]['date']))[1]):
            if not (more_than_3_percent_lower(r['high'], self.trc_struct.f_high['value'], self.trc_struct.max_offset)):
                self.trc_struct.l_high['value'] = Decimal(r['high'])
                self.trc_struct.l_high['idx'] = idx
                return True

    def offset_f_low(self, r):
        row_value = Decimal(r['high'])
        if self.trc_struct.f_low['value'] > row_value:
            return 1, row_value / Decimal(self.trc_struct.f_low['value'])
        else:
            return 2, self.trc_struct.f_low['value'] / row_value

    def offset_f_high(self, r):
        row_value = Decimal(r['high'])
        if self.trc_struct.f_high['value'] > row_value:
            return 1, row_value / Decimal(self.trc_struct.f_high['value'])
        else:
            return 2, self.trc_struct.f_high['value'] / row_value

    def offset_l_low(self, r):
        row_value = Decimal(r['high'])
        if self.trc_struct.l_low['value'] > row_value:
            return 1, row_value / Decimal(self.trc_struct.l_low['value'])
        else:
            return 2, self.trc_struct.l_low['value'] / row_value

    def offset_l_high(self, r):
        row_value = Decimal(r['high'])
        if self.trc_struct.l_high['value'] > row_value:
            return 1, row_value / Decimal(self.trc_struct.l_high['value'])
        else:
            return 2, self.trc_struct.l_high['value'] / row_value

    def analyze_price_history(self):
        # Make sure entries are populated
        if self.trc_struct and hasattr(self.trc_struct, 'entries') and len(self.trc_struct.entries) > 0:
            # Sort entries to determine Max, Min and Range between
            sort_by_price = sorted(self.trc_struct.entries, key=lambda x: Decimal(x['high']))
            self.trc_struct.min = sort_by_price[0]
            self.trc_struct.max = sort_by_price[len(sort_by_price) - 1]
            self.trc_struct.max_offset = Decimal(1) - Decimal(self.trc_struct.min['high']) / Decimal(
                self.trc_struct.max['high'])

            # Set initial values to first/last low/high
            self.trc_struct.f_high['value'] = self.trc_struct.f_low['value'] = self.trc_struct.l_high['value'] = \
                self.trc_struct.l_low['value'] = Decimal(self.trc_struct.entries[0]['high'])

            for i, row in enumerate(self.trc_struct.entries):
                # Add to Peak and Base if value is similar, proximate and has not yet been added
                if close_to_max(row, self.trc_struct.max, self.trc_struct.max_offset) and len(
                        [x for x in self.trc_struct.peak if x['idx'] == i]) == 0:
                    self.trc_struct.peak.append({'value': row['high'], 'idx': i, 'date': row['date']})

                elif close_to_min(row, self.trc_struct.min, self.trc_struct.max_offset)and len(
                        [x for x in self.trc_struct.base if x['idx'] == i]) == 0:
                    self.trc_struct.base.append({'value': row['high'], 'idx': i, 'date': row['date']})

                if self.is_first_low(row, i):
                    continue
                if self.is_first_high(row, i):
                    continue
                if self.is_last_low(row, i):
                    continue
                if self.is_last_high(row, i):
                    continue

            self.logger.info('Finished sorting Trc Structure\n')
            self.logger.debug(str(self.trc_struct))

    async def post_data_as_json(self):
        entries = [(x['high'], x['date']) for x in self.trc_struct.entries]
        peaks = [(x['value'], x['date']) for x in self.trc_struct.peak]
        bases = [(x['value'], x['date']) for x in self.trc_struct.base]
        f_low = (self.trc_struct.entries[self.trc_struct.f_low['idx']]['date'], self.trc_struct.f_low['value'])
        f_high = (self.trc_struct.entries[self.trc_struct.f_high['idx']]['date'], self.trc_struct.f_high['value'])
        l_low = (self.trc_struct.entries[self.trc_struct.l_low['idx']]['date'], self.trc_struct.l_low['value'])
        l_high = (self.trc_struct.entries[self.trc_struct.l_high['idx']]['date'], self.trc_struct.l_high['value'])

        return entries, peaks, bases, f_low, f_high, l_low, l_high

    def update_max_offset(self, offset):
        if self.trc_struct.max_offset < offset:
            self.trc_struct.max_offset = offset

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
                self.logger.info('Bot ' + str(self.number) + ' successfully logged into TRX')
            else:
                self.logger.info('Unable to login')
                self.logger.debug('Session data was ' + str(login_response))
                self.session = False
                self.logger.info('Bot ' + str(self.number) + ' unable to login')

            return self.is_logged_in()

    def is_logged_in(self):
        return self.has_session()

    def has_session(self):
        return True if (self.session is not None) and (self.session is not False) and (isinstance(self.session, dict) and ('token' in self.session)) else False


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
    cursor = 0 if a[1] > b[1] else 1
    if cursor == 0:
        cursor = 0 if a[1] > c[1] else 2
        if cursor == 0:
            cursor = 0 if a[1] > d[1] else 3
    else:
        cursor = 1 if b[1] > c[1] else 2
        if cursor == 1:
            cursor = 1 if a[1] > d[1] else 3

    return cursor


def as_unixtime(r):
    return datetime.strptime(r, '%Y-%m-%d %H:%M:%S').strftime('%s')


def date_metrics(a, b):
    a, b = int(a), int(b)
    duration = b - a
    mid_point = b - (duration * 0.5)
    f_period = a + (duration * 0.1)
    l_period = b - (duration * 0.1)

    return (f_period, l_period) if l_period > mid_point else (f_period, mid_point)


def is_first_period(a, b):
    return Decimal(a) < Decimal(b)


def is_last_period(a, b):
    return Decimal(a) > Decimal(b)


def is_higher(a, b):
    return Decimal(a) > Decimal(b)


def is_within_3_percent_over(a, b, max_offset):
    margin_of_offset = max_offset * Decimal(0.03)
    return Decimal(b) < Decimal(a) < Decimal(b) * (Decimal(1) + margin_of_offset)


def is_within_3_percent_under(a, b, max_offset):
    margin_of_offset = max_offset * Decimal(0.03)
    return Decimal(b) > Decimal(a) > Decimal(b) * (Decimal(1) - margin_of_offset)


def more_than_3_percent_higher(a, b, max_offset):
    margin_of_offset = max_offset * Decimal(0.03)
    return Decimal(a) > Decimal(b) and Decimal(a) > Decimal(b) * (Decimal(1) + margin_of_offset)


def more_than_3_percent_lower(a, b, max_offset):
    margin_of_offset = max_offset * Decimal(0.03)
    return Decimal(a) < Decimal(b) and Decimal(a) < Decimal(b) * (Decimal(1) - margin_of_offset)


def close_to_max(row, max, max_offset):
    # Determination of proximity to max/min is based on calculating 2.5 % of the maximum variation of value within a
    # period
    margin_of_offset = max_offset * Decimal(0.025)
    return Decimal(row['high']) > Decimal(max['high']) * (Decimal(1) - margin_of_offset)


def close_to_min(row, min, max_offset):
    # Determination of proximity to max/min is based on calculating 2.5 % of the maximum variation of value within a
    # period
    margin_of_offset = max_offset * Decimal(0.025)
    return Decimal(row['high']) < Decimal(min['high']) * (Decimal(1) + margin_of_offset)


class TxStruct(object):
    def __init__(self):
        self.f_low = {'value': None, 'idx': 0}
        self.f_high = {'value': None, 'idx': 0}
        self.l_low = {'value': None, 'idx': 0}
        self.l_high = {'value': None, 'idx': 0}
        self.max_offset = Decimal(0)
        self.peak = []
        self.base = []
        self.max = None
        self.min = None
        self.entries = []

    def serialize(self):
        return {
            'f_low': str(self.f_low),
            'f_high': str(self.f_high),
            'l_low': str(self.l_low),
            'l_high': str(self.l_high),
            'offset': str(self.max_offset),
            'max': str(self.max),
            'min': str(self.min),
            'peak': str(self.peak),
            'base': str(self.base)
        }

    def serialize_entries(self):
        return self.entries
