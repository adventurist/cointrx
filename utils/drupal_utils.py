from utils.cointrx_client import Client
from requests.auth import HTTPBasicAuth

client = Client()

async def attempt_login(json_body):
    # csrf_token = await client.get('http://trxdrup.dev/session/token')
    # if csrf_token is not None:
    login_attempt = await client.connect('http://trxdrup.dev/user/login?_format=json', body=json_body)
    return login_attempt

async def post_status_message(json_body, user=None, headers=None):
    if json_body is not None:
        # post_attempt = await client.connect('http://trxdrup.dev/statusmessage/post?_format=json', body=json_body, headers=headers)
        # return post_attempt
        post_attempt = await client.auth_connect('http://trxdrup.dev/statusmessage/post?_format=json', body=json_body, headers=headers, auth_username=user['name'], auth_password=user['pass'])
        return post_attempt

def make_headers(name, password, session):
    basic_auth = HTTPBasicAuth(name, password)
    return {'X-CSRF-Token': session.drupal_token(), 'Authorization': basic_auth
     }