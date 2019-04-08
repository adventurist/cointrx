import config.config as TRXConfig
from utils.cointrx_client import Client
from utils import btcd_utils
from tornado.escape import json_encode, json_decode
from utils import logging

COIN = 100000000

logger = logging.setup_logger('TRX_TX', 'DEBUG')


def set_trx_urls():
    environment_variables = TRXConfig.get_env_variables()
    if 'TRX_ENV' in environment_variables:
        urls = TRXConfig.get_urls(environment_variables['TRX_ENV'])
        logger.info('URLS to use', urls)
        return urls
    else:
        import json
        with open('../config/config.json') as c:
            url_config = json.load(c)
            logger.info('URLS to use', url_config)
            return url_config['LOCAL_DEVELOPMENT']


TRX_urls = set_trx_urls()


class TestTx:
    def __init__(self, r, v, s):
        self.recipient = r
        self.amount = int(v)
        self.sender = s


class Transaction:
    def __init__(self, session):
        self.session = session

    @staticmethod
    async def request_transaction(*kwargs):
        print(kwargs)
        if kwargs[0] is not None:
            new_tx = TestTx(r=kwargs[0]['recipient'], v=kwargs[0]['amount'], s=kwargs[0]['sender'])
            if new_tx:
                sender_addr = new_tx.sender['address']
                sender_private_key = new_tx.sender['key']
                tx_history = await btcd_utils.RegTest.get_tx_history(sender_addr)
                tx_input = []
                tx_input_amount = 0

                if isinstance(tx_history, list) and len(tx_history) > 0 and isinstance(tx_history[0], dict):
                    sender_balance = sum([v['value'] for v in tx_history])
                    if sender_balance > new_tx.amount:
                        for v in tx_history:
                            if tx_input_amount <= new_tx.amount:
                                tx_input.append({'output': v['txid'] + ':0', 'value': v['value'], 'idx': v['idx'],
                                                 'address': sender_addr, 'wif': sender_private_key})
                                tx_input_amount += v['value']
                            else:
                                break
                        # TODO what is DUST amount?
                        tx_input_total = sum(x['value'] for x in tx_input)
                        tx_remain_amount = tx_input_total - new_tx.amount
                        tx_output = [{'value': new_tx.amount, 'address': new_tx.recipient},
                                     {'value': tx_remain_amount - 1000, 'address': sender_addr}]
                        client = Client()
                        body = json_encode(
                            {'txIn': tx_input, 'txOut': tx_output, 'network': 'regtest'})
                        logger.debug('Calling Transaction app with body: {}'.format(json_decode(body)))
                        response = await client.connect(TRX_urls['tx_app'], json_encode(
                            {'txIn': tx_input, 'txOut': tx_output, 'network': 'regtest'}))
                        if response:
                            logger.debug('Response received: {}'.format(str(response)))
                            if is_iterable(response) and 'body' in response:
                                data = json_decode(response.body.decode())
                            else:
                                data = 'NO BODY'
                            logger.debug('Decoded body: {}'.format(str(data)))
                            if is_iterable(data) and hasattr(data, 'error'):
                                result = data.get('result', 'error')
                            else:
                                result = 'Unable to retrieve result'
                            if is_iterable(result) and result != 'error' and not isinstance(result, str):
                                send_tx_result = btcd_utils.send_tx(result['tx'], 'regtest')
                                logger.debug('Transaction result: {}'.format(send_tx_result))
                                return send_tx_result
                            else:
                                return 'Failed'
                        else:
                            logger.debug('No response received')
                    else:
                        logger.debug('Insufficient funds')
                        return {'error': 'Insufficient funds', 'code': TRXConfig.TransactionError.INSUFFICIENT_FUNDS}

def is_iterable(value):
    try:
        iter(value)
        return True
    except TypeError:
        return False