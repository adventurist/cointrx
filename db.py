from types import SimpleNamespace

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.engine.url import URL
from sqlalchemy.ext.declarative import declarative_base
from passlib.apps import custom_app_context as pwd_context
from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)

import db_config

coinapp = SimpleNamespace()
coinapp.config = {'SECRET_KEY': "jigga does as jigga does"}

Base = declarative_base()


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


def db_connect():
    return create_engine(URL(**db_config.DATABASE))


def create_all():
    Base.metadata.create_all(db_connect())
