from types import SimpleNamespace

from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer)
from passlib.apps import custom_app_context as pwd_context
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.engine.url import URL
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import scoped_session, sessionmaker

import datetime
import db_config

Base = declarative_base()
engine = create_engine(URL(**db_config.DATABASE))
Session = sessionmaker(bind=engine)

session = Session()

coinapp = SimpleNamespace()
coinapp.config = {'SECRET_KEY': "jigga does as jigga does"}


# DBSession = scoped_session(sessionmaker())


# DBSession.bind = create_engine(URL(**db_config.DATABASE))


# class BaseMixin(object):
#     query = DBSession.query_property()
#     id = Column(Integer, primary_key=True)
#     @declared_attr
#     def __tablename__(cls):
#         return cls.__name__.lower()

# Base = declarative_base(cls=BaseMixin)

# TODO rename this to "users"

class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    name = Column(String(64))
    hash = Column(String(256))
    email = Column(String(64))
    created = Column(Integer)
    status = Column(Integer)

    def hash_password(self, password):
        self.password_hash = pwd_context.encrypt(password)

    def verify_password(self, password):
        return pwd_context.verify(password, self.password_hash)

    def generate_auth_token(self, expiration=600):
        s = Serializer(coinapp.config['SECRET_KEY'], expires_in=expiration)
        return s.dumps({'id': self.id})

    @staticmethod
    def generate_hash(password):
        return pwd_context.encrypt(password)

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created': self.created,
            'status': self.status
        }


def db_connect():
    return create_engine(URL(**db_config.DATABASE))


def create_all():
    Base.metadata.create_all(db_connect())


def create_user():
    print("Stuff here")


def check_authentication(user, pass_hash):

    query_user = session.query(User).filter(User.name == user).first()
    if query_user is not None:
        return query_user.serialize()
    else:
        new_user = User(name=user, hash=pass_hash, email="jigga@theplace.com", created=datetime.datetime.now(), status=1)
        return new_user

