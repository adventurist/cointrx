from utils.btcd_utils import get_env_variables


def env_variables():
    return get_env_variables


def get_urls(trx_env):
    return {
        'tx_app': 'https://app.cointrx.com/transaction',
        'tx_request': 'https://app.cointrx.com/transaction/request'
    } if trx_env == 'SNOWFLAKE' else {
        'tx_app': 'http://localhost:3000/transaction',
        'tx_request': 'http://localhost:3000/transaction/request'
    }
