from tornado.ioloop import IOLoop, PeriodicCallback
from tornado import gen
from tornado.websocket import websocket_connect

from uuid import uuid4


class Client(object):
    def __init__(self, id, url, timeout=20000):
        self.id = id
        self.url = url
        self.timeout = timeout
        self.ioloop = IOLoop.instance()
        self.ws = None
        PeriodicCallback(self.keep_alive, timeout).start()

    @staticmethod
    def receive_message(self, msg):
        print('Message received:' + msg)

    @gen.coroutine
    def connect(self):
        print("trying to connect")
        try:
            self.ws = yield websocket_connect(self.url, on_message_callback=receive_message)
        except Exception as e:
            print("connection error")
        else:
            print("connected")
            self.run()

    def write_message(self, msg):
        if self.ws is None:
            yield self.connect()
        self.ws.write_message(msg)

    @gen.coroutine
    def run(self):
        while True:
            msg = yield self.ws.read_message()
            if msg is None:
                print("connection closed")
                self.ws = None
                break

    def keep_alive(self):
        if self.ws is None:
            self.connect()
        else:
            self.ws.write_message("Keep alive with id: " + str(self.id))


class Bot(object):
    def __init__(self, config, logger):
        self.id = uuid4()
        self.client = Client(id=self.id, url=config.url, timeout=config.timeout)
        self.logger = logger

    def write_message(self):
        self.client.write_message('Sending message from: ' + str(self.id))

    def connect(self):
        yield self.client.connect()


def receive_message(msg):
    m = parse_message(msg)
    print(str(m))

def parse_message(msg):
    return_msg = {}
    if isinstance(msg, dict) and 'result' in dict:
        return_msg['result'] = msg['result']

    return_msg['all'] = msg

    return return_msg
