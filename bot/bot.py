from uuid import uuid4
from websocket import WebSocketClient
import socket


class Bot:

    def __init__(self, url, port):
        self.id = uuid4()
        self.client = WebSocketClient()
        self.url = url
        self.port = port

    def connect(self, url):
        self.client.connect(url=url)

    def _on_connection_success(self, msg):
        super(self, msg)
        print(msg)

    def send_to_server(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((self.url, self.port))
        sock.sendall(b'Hello World!')
