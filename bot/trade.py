from utils.cointrx_client import Client
import json
import asyncio
import os
http_client = Client()

bots = []


def user_data():
    with open(os.path.join(os.path.dirname(__file__), 'users.json')) as d:
        return json.load(d)['users']


def login_bots():
    pass


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


async def main():
    login_data = await get_token()
    await start_bots(login_data['token'])
    print(json.dumps(bots))


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
