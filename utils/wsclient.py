from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.websocket import websocket_connect, WebSocketError
from utils.cointrx_client import Client as HttpClient
from uuid import uuid4
from datetime import datetime
from decimal import Decimal
from copy import deepcopy
import json


class Client(object):
    def __init__(self, id, timeout=20000):
        self.id = id
        self.timeout = timeout
        self.ioloop = IOLoop.instance()
        self.ws = None
        self.bot = None
        PeriodicCallback(self.keep_alive, timeout).start()

    @staticmethod
    def receive_message(self, msg):
        print('Message received:' + msg)

    async def connect(self, url):
        print("trying to connect")
        if self.ws is None:
            try:
                self.ws = await websocket_connect(url, on_message_callback=receive_message)
                if self.ws is not None:
                    # await self.run()
                    return self.ws
            except WebSocketError as e:
                print(str(e))
                print("connection error")
        else:
            print("connected")
            await self.run()

        return self.ws

    async def write_message(self, msg):
        if self.ws is None:
            await self.connect('http://localhost:9977/')
        await self.ws.write_message(msg)

    async def run(self):
        while True:
            msg = await self.ws.read_message()
            if msg is None:
                print("connection closed")
                self.ws = None
                break

    async def keep_alive(self):
        if self.ws is None:
            self.ws.write_message("Keep alive with id: " + str(self.id))
            #     await self.connect('http://localhost:9977/')
            # else:

    def close_connection(self):
        if self.ws is not None:
            self.ws.close()


class Bot(object):
    def __init__(self, config, logger):
        self.id = uuid4()  # Unique identifier
        self.client = Client(id=self.id, timeout=config.timeout)  # WebSocket client
        self.http_client = HttpClient()  # HTTP Client
        self.logger = logger
        self.number = config.number
        self.credentials = None  # User credentials for authentication
        self.session = None
        self.trc_price_history = None
        self.trc_struct = TxStruct()  # Struct object is our market valuation history dataset

    async def find_all_patterns(self) -> dict:
        # TODO choose one return type
        """
        :return:list of patterns or pattern search results
        """
        patterns = {}
        finder = PatternFinder(self.trc_struct, self.logger)
        # Search for cup and handle
        patterns['cup_and_handle'] = finder.cup()

        return patterns

    def set_credentials(self, credentials):
        self.credentials = credentials

    def dump_self(self):
        self.logger.debug(str(self.__dict__))

    async def write_message(self):
        await self.client.write_message('Sending message from: ' + str(self.id))

    async def relay_message(self, msg):
        await self.client.write_message(str(self.id) + ': ' + msg)

    async def connect(self):
        await self.client.connect(url='ws://localhost:9977/')

    def close_connection(self):
        self.client.close_connection()

    def identify(self):
        return "Bot Number " + str(self.number) + " and my ID is " + str(self.id)

    async def retrieve_price_history(self, time):
        price_url = 'http://localhost:6969/api/prices/regtest/btc/cad/minmax/json?time=%s' % time
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

    def analyze_price_history(self):
        # Make sure entries are populated
        if self.entries_ready():
            # Clear analysis data, except for original price history entries
            self.reset_analysis_data()
            # Make a copy of the data to work with, instead of modifying and corrupting the data
            entries = deepcopy(self.trc_struct.entries)
            # Sort entries to determine Max, Min and Range between
            sort_by_price = sorted(entries, key=lambda x: Decimal(x['high']))
            self.trc_struct.min = sort_by_price[0]
            self.trc_struct.max = sort_by_price[len(sort_by_price) - 1]
            self.trc_struct.max_offset = Decimal(1) - Decimal(self.trc_struct.min['high']) / Decimal(
                self.trc_struct.max['high'])

            # Set initial values to first/last low/high
            self.trc_struct.f_high['value'] = self.trc_struct.f_low['value'] = self.trc_struct.l_high['value'] = \
                self.trc_struct.l_low['value'] = Decimal(entries[0]['high'])

            for i, row in enumerate(entries):
                # Add to Peak and Base if value is similar, proximate and has not yet been added
                self.logger.debug('Iterating over %s' % row['date'])
                # If point is close to max, add to peaks
                if close_to_max(row, self.trc_struct.max, self.trc_struct.max_offset) and self.peak_not_added(i):
                    self.add_entry_to_peak(row, i)
                # If point is close to min, add to bases
                elif close_to_min(row, self.trc_struct.min, self.trc_struct.max_offset) and self.base_not_added(i):
                    self.add_entry_to_base(row, i)
                # Check to see if the data point is the first low/high or last low/high in the dataset
                # Add entries to base/peak if they haven't been already
                if self.is_first_low(row, i):
                    if self.base_not_added(i):
                        self.add_entry_to_base(row, i)
                    continue
                # TODO - Find out why is_first_high isn't among peaks
                if self.is_first_high(row, i):
                    if self.peak_not_added(i):
                        self.add_entry_to_peak(row, i)
                    continue
                if self.is_last_low(row, i):
                    if self.base_not_added(i):
                        self.add_entry_to_base(row, i)
                    continue
                if self.is_last_high(row, i):
                    if self.peak_not_added(i):
                        self.add_entry_to_peak(row, i)
                    continue
            # Create our maps for easy future analysis
            for peak in self.trc_struct.peak:
                self.trc_struct.peak_map[peak['idx']] = peak['value']

            for base in self.trc_struct.base:
                self.trc_struct.base_map[base['idx']] = base['value']

            for i, entry in enumerate(entries):
                self.trc_struct.map[i] = entry['high']

            self.logger.info('Finished sorting Trc Structure\n')

    def is_first_low(self, r, idx):
        """ Check to see if row occurs within first historical period """
        if is_first_period(as_unixtime(r['date']), date_metrics(as_unixtime(self.trc_struct.entries[0]['date']),
                                                                as_unixtime(self.trc_struct.entries[len(
                                                                    self.trc_struct.entries) - 1]['date']))[0]):
            # Only replace with more recent if value is more than 10% lower
            if more_than_5_percent_lower(r['high'], self.trc_struct.f_low['value'], self.trc_struct.max_offset):
                self.trc_struct.f_low['value'] = Decimal(r['high'])
                self.trc_struct.f_low['idx'] = idx
                return True

    def is_first_high(self, r, idx):
        if is_first_period(as_unixtime(r['date']), date_metrics(as_unixtime(self.trc_struct.entries[0]['date']),
                                                                as_unixtime(self.trc_struct.entries[len(
                                                                    self.trc_struct.entries) - 1]['date']))[0]):
            # Only avoid replacing with more recent if previous value is more than 10% higher
            if (is_higher(r['high'], self.trc_struct.f_low['value'])) and (
                        is_higher(r['high'], self.trc_struct.f_high['value']) or is_within_5_percent_under(r['high'],
                                                                                                           self.trc_struct.f_high[
                                                                                                               'value'],
                                                                                                           self.trc_struct.max_offset)):
                self.trc_struct.f_high['value'] = Decimal(r['high'])
                self.trc_struct.f_high['idx'] = idx
                return True

    def is_last_low(self, r, idx):
        if is_last_period(as_unixtime(r['date']), date_metrics(as_unixtime(self.trc_struct.entries[0]['date']),
                                                               as_unixtime(self.trc_struct.entries[len(
                                                                   self.trc_struct.entries) - 1]['date']))[1]):
            if not (more_than_5_percent_higher(r['high'], self.trc_struct.f_high['value'], self.trc_struct.max_offset)):
                self.trc_struct.l_low['value'] = Decimal(r['high'])
                self.trc_struct.l_low['idx'] = idx
                return True

    def is_last_high(self, r, idx):
        if is_last_period(as_unixtime(r['date']), date_metrics(as_unixtime(self.trc_struct.entries[0]['date']),
                                                               as_unixtime(self.trc_struct.entries[len(
                                                                   self.trc_struct.entries) - 1]['date']))[1]):
            if not (more_than_5_percent_lower(r['high'], self.trc_struct.f_high['value'], self.trc_struct.max_offset)):
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

    def add_entry_to_peak(self, entry, idx):
        self.trc_struct.peak.append({'value': entry['high'], 'idx': idx, 'date': entry['date']})

    def add_entry_to_base(self, entry, idx):
        self.trc_struct.base.append({'value': entry['high'], 'idx': idx, 'date': entry['date']})

    def peak_not_added(self, i):
        return len([x for x in self.trc_struct.peak if x['idx'] == i]) == 0

    def base_not_added(self, i):
        return len([x for x in self.trc_struct.base if x['idx'] == i]) == 0

    def entries_ready(self):
        return self.trc_struct and hasattr(self.trc_struct, 'entries') and len(self.trc_struct.entries) > 0

    def reset_analysis_data(self):
        self.trc_struct.peak = []
        self.trc_struct.base = []
        self.trc_struct.map = {}
        self.trc_struct.peak_map = {}
        self.trc_struct.base_map = {}
        self.trc_struct.min = None
        self.trc_struct.max = None
        self.trc_struct.max_offset = Decimal(0)

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
        return True if (self.session is not None) and (self.session is not False) and (
            isinstance(self.session, dict) and ('token' in self.session)) else False


def receive_message(msg):
    m = parse_message(msg)
    print(str(m))


def parse_message(msg):
    return_msg = {}
    if isinstance(msg, dict) and 'result' in msg:
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


def is_within_5_percent_over(a, b, max_offset):
    margin_of_offset = max_offset * Decimal(0.05)
    return Decimal(b) < Decimal(a) < Decimal(b) * (Decimal(1) + margin_of_offset)


def is_within_5_percent_under(a, b, max_offset):
    margin_of_offset = max_offset * Decimal(0.05)
    return Decimal(b) > Decimal(a) > Decimal(b) * (Decimal(1) - margin_of_offset)


def more_than_5_percent_higher(a, b, max_offset):
    margin_of_offset = max_offset * Decimal(0.05)
    return Decimal(a) > Decimal(b) and Decimal(a) > Decimal(b) * (Decimal(1) + margin_of_offset)


def more_than_5_percent_lower(a, b, max_offset):
    margin_of_offset = max_offset * Decimal(0.05)
    return Decimal(a) < Decimal(b) and Decimal(a) < Decimal(b) * (Decimal(1) - margin_of_offset)


def close_to_max(row, max, max_offset):
    # Determination of proximity to max/min is based on calculating 2.5 % of the maximum variation of value within a
    # period
    margin_of_offset = max_offset * Decimal(0.35)
    return Decimal(row['high']) > Decimal(max['high']) * (Decimal(1) - margin_of_offset)


def close_to_min(row, min, max_offset):
    # Determination of proximity to max/min is based on calculating 2.5 % of the maximum variation of value within a
    # period
    margin_of_offset = max_offset * Decimal(0.35)
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
        self.peak_map = {}
        self.base_map = {}
        self.map = {}

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


class PatternFinder(object):
    def __init__(self, struct, logger):
        self.patterns = []
        self.value_structure = struct
        self.logger = logger

    def cup_and_handle(self):

        v_struct = self.value_structure
        peaks = v_struct.peak
        bases = v_struct.base
        peaks_map = v_struct.peak_map
        bases_map = v_struct.base_map
        trc_map = v_struct.map

        findings = []
        analysis_complete = False
        counter = -1
        # while not analysis_complete and len(peaks) > 1:

        for i, peak in enumerate(peaks):
            # Create fresh dictionary to store the results of each investigation. The dataset will be investigated for boundaries and evidence of a specific behaviour between those boundaries.
            cup_result = {
                'first_peak': None, 'second_peak': None, 'cup_bottom': None, 'handle_bottom': None, 'cup': None,
                'handle': None, 'handle_breakout': None,
                'downward_trend': [], 'handle_downward_trend': [], 'end_of_downward_trend': None,
                'handle_upward_trend': []
            }
            # check for gaps between peaks5
            if i < len(peaks) - 1 and peaks[i + 1]['idx'] != peak['idx'] + 1:
                # Find any bases which occur between this gap
                for j, base in enumerate(bases):
                    if peak['idx'] < base['idx'] < peaks[i + 1]['idx']:
                        cup_result['downward_trend'].append(base)
                # TODO find out how many bases are the minimum required to assert that we've found a cup
                if len(cup_result['downward_trend']) > 0:
                    # If a downward trend was observed, save the boundaries and the lowest point within them, to mark the basic expression of the cup
                    cup_result['first_peak'] = peaks[i]
                    cup_result['second_peak'] = peaks[i + 1]
                    cup_result['cup_bottom'] = sorted(cup_result['downward_trend'], key=lambda x: Decimal(x['value']))[
                        0]
                    cup_result['cup'] = True
                    # Add our finding to the array
                    findings.append(cup_result)

                del cup_result
            # For any finding, we must search for its corresponding handle
        if len(findings) > 0 and len([x for x in findings if x['cup']]) > 0:
            for pattern_index, cup_result in enumerate(findings):
                remaining_entries = {k: v for (k, v) in trc_map.items() if
                                     k > int(cup_result['downward_trend'][-1]['idx'])}
                up_trend = 0
                remaining_keys = list(remaining_entries.keys())
                bottom_peak_ratio = ratio_a_over_b(cup_result['cup_bottom']['value'],
                                                   trc_map[cup_result['first_peak']['idx']])
                # Check and see if the first element of the remaining_entries is part of an upward_trend
                # num = v_struct['entries'][remaining_entries[remaining_keys[0]]]['high']

                if str_num_a_above_b(remaining_entries[remaining_keys[0]],
                                     cup_result['downward_trend'][len(cup_result['downward_trend']) - 1]['value']):
                    # add to our cup_result and attempt to continue analyzing a potential upward trend
                    cup_result['handle_upward_trend'].append(
                        {'idx': remaining_keys[0], 'value': remaining_entries[remaining_keys[0]]})
                    up_trend += 1
                    for i, idx in enumerate(remaining_keys):
                        # Skip the first value, since we've already recorded it
                        if i == 0:
                            continue
                        value_peak_ratio = ratio_a_over_b(remaining_entries[idx],
                                                          trc_map[cup_result['first_peak']['idx']])
                        # Check each entry against the previous entry, to ensure it is an upward trend
                        if non_regressive_trend(bottom_peak_ratio, value_peak_ratio, remaining_entries[idx],
                                                remaining_entries[remaining_keys[i - 1]]):
                            cup_result['handle_upward_trend'].append(
                                {'idx': idx, 'value': remaining_entries[remaining_keys[i - 1]]})
                            up_trend += 1
                        # Break once the upward trend is complete
                        else:
                            # Mark this peak
                            break

                if up_trend > 1:
                    cup_result['handle'] = True
                    # Second last implementation
                    # for k, v in remaining_entries.items():
                    #     if k in remaining_entries and k - 1 in remaining_entries and v > remaining_entries[k - 1]:
                    #         print('jigga')
                    #
                    # findings['end_of_downward_trend'] = v_struct.entries[int(findings['downward_trend'][-1]['idx']):]
                    #
                    # # Oldest implementation
                    # for i, idx in enumerate(remaining_keys):
                    #     if gap_exists(idx, remaining_entries[i + 1]):
                    #
                    #         for j, base in enumerate(bases):
                    #             if between_peaks(peak['idx'], peaks[i + 1]['idx'], base['idx']):
                    #                 findings['handle_downward_trend'].append(base)
                    #                 # delete the base so we don't have to iterate it ever again
                    #                 del (bases[j])
                    #         if len(findings['handle_downward_trend']) > 0:
                    #             findings['handle_breakout'] = peaks[i + i]
                    #             findings['handle_bottom'] = \
                    #             sorted(findings['handle_downward_trend'], key=lambda x: Decimal(x['value']))[
                    #                 0]
                    #             findings['handle'] = True

        return findings

    def cup(self):

        v_struct = self.value_structure
        peaks = v_struct.peak
        bases = v_struct.base
        peaks_map = v_struct.peak_map
        bases_map = v_struct.base_map
        trc_map = v_struct.map

        findings = []
        analysis_complete = False
        counter = -1
        # while not analysis_complete and len(peaks) > 1:

        for i, peak in enumerate(peaks):
            # Create fresh dictionary to store the results of each investigation. The dataset will be investigated for boundaries and evidence of a specific behaviour between those boundaries.
            cup_result = {
                'first_peak': None, 'second_peak': None, 'cup_bottom': None, 'cup': None,
                'downward_trend': [], 'end_of_downward_trend': None
            }
            real_closing_peak = None
            # check for gaps between peaks
            if real_closing_peak is None and i < len(peaks) - 1 and peaks[i + 1]['idx'] != peak['idx'] + 1:
                # Search cup completion prior to peaks[i + 1]
                for k, v in trc_map.items():
                    # TODO find a better comparison for v['value']
                    # Ensure that the index of the iterated datapoint occurs between two peaks
                    # AND that its value satisfies two constraints:
                    #   1. Its value is higher than that of the first peak
                    #   2. Its existence contributes to the continuation of an upward trend
                    if int(k) > int(peaks[i]['idx']) and int(k) < int(peaks[i + 1]['idx']) and Decimal(v) > Decimal(peaks[i]['value']):
                        for n in range(int(k), int(peaks[i + 1]['idx'])):
                            if trc_map[n] < trc_map[n - 1]:
                                real_closing_peak = trc_map[n - 1]
                                self.logger.info('Cup closed at %s' % str(n - 1))
                                break
                    if real_closing_peak is not None:
                        break

                # Find any bases which occur between this gap
                for j, base in enumerate(bases):
                    if peak['idx'] < base['idx'] < peaks[i + 1]['idx']:
                        cup_result['downward_trend'].append(base)
                # TODO find out how many bases are the minimum required to assert that we've found a cup
                if len(cup_result['downward_trend']) > 0:
                    # If a downward trend was observed, save the boundaries and the lowest point within them, to mark the basic expression of the cup
                    cup_result['first_peak'] = peaks[i]
                    cup_result['second_peak'] = peaks[i + 1]
                    cup_result['cup_bottom'] = sorted(cup_result['downward_trend'], key=lambda x: Decimal(x['value']))[
                        0]
                    cup_result['cup'] = True
                    # Add our finding to the array
                    findings.append(cup_result)
                del cup_result

        return findings


def gap_exists(idx1, idx2):
    return int(idx2) == int(idx1) + 1


def between_peaks(peak1, peak2, base):
    return peak1 < base < peak2


def str_num_a_above_b(a, b):
    return Decimal(a) > Decimal(b)


def ratio_a_over_b(a, b):
    return Decimal(a) / Decimal(b)


def non_regressive_trend(bottom_ratio, current_ratio, current_value, previous_value):
    a = Decimal(current_value) if current_value > previous_value else Decimal(previous_value)
    b = Decimal(previous_value) if a == Decimal(current_value) else Decimal(current_value)
    prev_diff = (1 - Decimal(bottom_ratio)) / 2
    curr_diff = 1 - Decimal(current_ratio)
    val_diff = Decimal(b / a)
    ratio_comparison = abs(1 - Decimal(current_ratio)) < (1 - Decimal(bottom_ratio)) / Decimal(2)
    value_comparison = Decimal(b / a) > Decimal(0.98)
    return ratio_comparison and value_comparison
