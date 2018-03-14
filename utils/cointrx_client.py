from tornado import gen
from tornado import httpclient as tornado_client
from utils.loop_handler import IOHandler

from types import SimpleNamespace

config = SimpleNamespace()
config.blockchain_url = "http://blockchain.info/ticker"

http_client = tornado_client.AsyncHTTPClient()
io_handler = IOHandler()


class Client:
    @staticmethod
    def handle_response(response):
        print(response.body)
        if response.error:
            print("Error: %s" % response.error)
        else:
            print(response.body)
            return response.body


    async def get_prices(self):
        print('test')

        try:
            response = await http_client.fetch(config.blockchain_url)
            await io_handler.handle_price(response)
            return True

        except tornado_client.HTTPError as e:
            print(e.message)

    @staticmethod
    async def connect(url, body=None, headers=None):
        try:
            response = await http_client.fetch(url, method='POST', body=body, headers=headers)
            return response
        except tornado_client.HTTPError as e:
            print(e.message)

    @staticmethod
    async def get(url):
        try:
            response = await http_client.fetch(url)
            return response
        except tornado_client.HTTPError as e:
            print(e.message)

    async def auth_connect(self, url, body, headers, auth_username, auth_password):
        try:
            request = tornado_client.HTTPRequest(url=url, body=body, method='POST', headers=headers, auth_username=auth_username, auth_password=auth_password, auth_mode='basic')
            response = await http_client.fetch(request)
            return response

        except tornado_client.HTTPError as e:
            print(e.message)

