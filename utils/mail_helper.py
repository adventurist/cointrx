from tornado_smtpclient.client import SMTPAsync, SMTPAsyncException

from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import COMMASPACE, formatdate
from email import encoders as Encoders

from types import SimpleNamespace

m_cfg = SimpleNamespace()
# m_cfg.mailhost_url = "mail.cointrx.com"
m_cfg.mailhost_url = "127.0.0.1"
m_cfg.mailhost_port = 25
m_cfg.cointrx_admin = "Eman <adventurist@gmail.com>"
m_cfg.welcome_subject = "Welcome to CoinTRX"


class Sender:
    s = SMTPAsync()

    def __init__(self):
        self.s = SMTPAsync()

    def connect(self):
        yield self.s.connect(m_cfg.mailhost_url, m_cfg.mailhost_port)

    @staticmethod
    def create_message():
        return """
        <html>
            <head></head>
            <body>
                <p>CoinTRX!<br>
                <h2>Coin's nutz</h2>
                In yo mouf.
                </p>
            </body>
        </html>
        """

    def send_message(self, to, fro, subject, text, files=[]):
        self.s.connect(m_cfg.mailhost_url, m_cfg.mailhost_port)
        # assert type(to) == list
        # assert type(files) == list
        msg = MIMEMultipart()
        msg['From'] = fro
        msg['To'] = COMMASPACE.join(to)
        # msg['To'] = to
        msg['Date'] = formatdate(localtime=True)
        msg['Subject'] = subject
        msg.attach(MIMEText(text, "html"))
        # self.connect()
        self.s.sendmail(fro, to, msg.as_string())

        # try:
        #     self.connect()
        #     self.s.sendmail(fro, to, msg.as_string())
        # except SMTPAsyncException as e:
        #     print(e)

        # for file in files:
        #     part = MIMEBase('application', "octet-stream")
        #     part.set_payload(open(file, "rb").read())
        #     Encoders.encode_base64(part)
        #     part.add_header('Content-Disposition', 'attachment; filename="%s"'
        #                     % os.path.basename(file))
        #     msg.attach(part)

    # Example:

    def send_mail(self, recipient):
        self.send_message(recipient, m_cfg.cointrx_admin, m_cfg.welcome_subject,
                            Sender.create_message(), [])
