from utils.btcd_utils import get_env_variables


def env_variables():
    return get_env_variables


def get_urls(trx_env):
    return {
        'base_url': 'https://app.cointrx.com',
        'tx_app': 'http://localhost:3000/transaction',
        'tx_request': 'https://app.cointrx.com/transaction/request',
        'blockgen_url': 'https://app.cointrx.com/regtest/generate/block',
        'userbalance_url': 'https://app.cointrx.com/regtest/user-balance',
    } if trx_env == 'SNOWFLAKE' else {
        'base_url': 'http://localhost',
        'tx_app': 'http://localhost:3000/transaction',
        'tx_request': 'http://localhost:6969/transaction/request',
        'blockgen_url': 'http://localhost:6969/regtest/generate/block',
        'userbalance_url': 'http://localhost:6969/regtest/user-balance',
    }
