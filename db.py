from types import SimpleNamespace

from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from passlib.apps import custom_app_context as pwd_context
from sqlalchemy import create_engine, Column, Integer, String, exc
from sqlalchemy.engine.url import URL
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import scoped_session, sessionmaker

import time
import datetime
import db_config

Base = declarative_base()
engine = create_engine(URL(**db_config.DATABASE))
Session = sessionmaker(bind=engine)

session = Session()

trxapp = SimpleNamespace()
trxapp.config = {'SECRET_KEY': "jigga does as jigga does"}


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
    __tablename__ = 'users'
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
        s = Serializer(trxapp.config['SECRET_KEY'], expires_in=expiration)
        return s.dumps({'id': self.id})

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created': self.created,
            'status': self.status
        }

    @staticmethod
    def generate_hash(password):
        return pwd_context.encrypt(password)


    @staticmethod
    def verify_auth_token(token):
        s = Serializer(trxapp.config['SECRET_KEY'])
        try:
            data = s.loads(token)
        except SignatureExpired:
            return None  # valid token, but expired
        except BadSignature:
            return None  # invalid token
        user = User.query.get(data['id'])
        if user is None:
            return
        return user


def db_connect():
    return create_engine(URL(**db_config.DATABASE))


def create_all():
    Base.metadata.create_all(db_connect())


def create_user():
    print("Stuff here")


def check_authentication(user, pass_hash, email):
    query_user = session.query(User).filter(User.name == user).first()
    if query_user is not None:
        return query_user.serialize()
    else:

        new_user = User(name=user, hash=pass_hash, email=email, created=int(time.mktime(datetime.datetime.now().timetuple())), status=1)

        try:

            session.add(new_user)
            session.commit()
            return new_user.serialize()

        except exc.SQLAlchemyError as error:
            return error

