from tornado_smtpclient.client import SMTPAsync, SMTPAsyncException

from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import COMMASPACE, formatdate
from email import encoders as Encoders

from types import SimpleNamespace

mailconfig = SimpleNamespace()
mailconfig.mailhost_url = "mail.cointrx.com"
mailconfig.cointrx_admin = "Eman <adventurist@gmail.com>"
mailconfig.welcome_subject = "Welcome to CoinTRX"


class Sender:
    s = SMTPAsync()

    def __init__(self):
        self.s = SMTPAsync()

    def connect(self, user, password):
        yield self.s.connect(mailconfig.mailhost_url, 25)

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

    def send_message(self, to, fro, subject, text, files=[], server="localhost"):
        self.s.connect()
        assert type(to) == list
        assert type(files) == list
        msg = MIMEMultipart()
        msg['From'] = fro
        msg['To'] = COMMASPACE.join(to)
        msg['Date'] = formatdate(localtime=True)
        msg['Subject'] = subject
        msg.attach(MIMEText(text))
        self.connect()
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
        self.send_message([recipient], mailconfig.cointrx_admin, mailconfig.welcome_subject,
                            [Sender.create_message()], [])
