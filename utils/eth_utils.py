from config.config import eth_by_currency
from db import db
from utils import cointrx_client
import json

async def update_eth_prices():
    response = await cointrx_client.Client().get(eth_by_currency('cad'))
    eth_data = json.loads(response.body.decode('utf-8'))
    errors = find_error(eth_data)
    if errors:
        print(errors)
    data_handling_result = await db.handle_eth_update_data(eth_data['result']['XETHZCAD']['c'])
    return data_handling_result


def find_error(d):
    if 'error' in d and len(d['error']) > 0:
        return d['error']
    else:
        return False