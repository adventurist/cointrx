from tornado import httpclient as tornado_client
from tornado.simple_httpclient import HTTPStreamClosedError
from tornado.httpclient import HTTPRequest
from tornado.httpclient import HTTPClientError
from utils.loop_handler import IOHandler
import aiohttp
from utils import logging
from types import SimpleNamespace

config = SimpleNamespace()
config.blockchain_url = "https://blockchain.info/ticker"

http_client = tornado_client.AsyncHTTPClient()
io_handler = IOHandler()

logger = logging.setup_logger('HTTP_CLIENT', 'DEBUG')


class Client:
    @staticmethod
    def handle_response(response):
        print(response.body)
        if response.error:
            print("Error: %s" % response.error)
        else:
            print(response.body)
            return response.body

    async def connect(self, url, body=None, headers=None):
        try:
            request = HTTPRequest(url=url, body=body, method='POST', headers=headers)
            # response = await http_client.fetch(url=url, method='POST', body=body, headers=headers)
            response = await http_client.fetch(request)
            return response
        except ConnectionRefusedError as e:
            logger.debug('POST Request failed with the following: {}'.format(e.strerror))
            return e
        except HTTPClientError as e:
            details = message_from_body(e.response.body.decode())
            logger.debug('HTTP Client failed with {code} code and the following message: {message}\n Details: {details}'.format(code=e.code, message=e.message, details=details))
            return e.response

    async def get(self, url):
        try:
            request = HTTPRequest(url=url, method='GET')
            response = await http_client.fetch(request)
            return response
        except tornado_client.HTTPError as e:
            logger.debug('GET Request failed', e.message)

    async def auth_connect(self, url, body, headers, auth_username, auth_password):
        try:
            request = tornado_client.HTTPRequest(url=url, body=body, method='POST', headers=headers,
                                                 auth_username=auth_username, auth_password=auth_password,
                                                 auth_mode='basic')
            response = await http_client.fetch(request)
            return response

        except tornado_client.HTTPError as e:
            logger.debug('Authentication Request failed: {}'.format(e.message))

    async def get_prices(self):
        try:
            response = await http_client.fetch(config.blockchain_url)
            price_handle_result = await io_handler.handle_price(response)
            return price_handle_result

        except HTTPStreamClosedError as e:
            print(e)
        except aiohttp.client_exceptions.ClientError as e:
            logger.debug('Could not get prices. Request failed.', e.message)


async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()


def message_from_body(body):
    start = body.index('<pre>') + 5
    end = body.index('<br>')
    return body[start:end]
