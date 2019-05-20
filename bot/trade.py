from utils.cointrx_client import Client
import json
import asyncio
import os
from types import SimpleNamespace

http_client = Client()

bots = []
transaction_parts = SimpleNamespace(
    offers=None,
    bids=None
)


def user_data():
    with open(os.path.join(os.path.dirname(__file__), 'users.json')) as d:
        return json.load(d)['users']


async def login(credentials):
    response = await http_client.connect('http://localhost:6969/login', json.dumps({
        'name': credentials[0],
        'password': credentials[1]
    }), {
        'Content-Type': 'application/json'
    })

    body = json.loads(response.body.decode())

    return body


async def get_token():
    return await login(('banana', 'banana'))


async def start_bots(token):
    users = user_data()
    response = await http_client.get('http://localhost:9977/start?trx_token=' + token + '&number=1')
    body = json.loads(response.body.decode())
    for i, bot in enumerate(body['data']):
        login_data = await login((users[i]['name'], users[i]['password']))
        bots.append({'id': bot['id'], 'token': login_data['token'], 'refresh': login_data['refresh'], 'uid': login_data['uid'], 'name': login_data['name'], 'session': login_data['session_info']})


async def get_offers():
    response = await http_client.get('http://localhost:6969/offer')
    body = json.loads(response.body.decode())
    print('offers')
    print(body)


async def get_bids():
    response = await http_client.get('http://localhost:6969/bid')
    body = json.loads(response.body.decode())
    print('bids')
    print(body)


async def get_transaction_parts():
    transaction_parts.offers = await get_offers()
    transaction_parts.bids = await get_bids()


def create_matches():
    for bot in bots:
        matched_parts = [x for x in transaction_parts.offers if x.uid == bot.uid] + [x for x in transaction_parts.offers if x.uid == bot.uid]
    if len(matched_parts) > 0:
        pass
    else:
        # Do random action
        pass


async def main():
    login_data = await get_token()
    await start_bots(login_data['token'])
    await get_transaction_parts()
    create_matches()


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
