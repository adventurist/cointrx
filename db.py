from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from passlib.apps import custom_app_context as pwd_context
from sqlalchemy import create_engine, Column, Integer, String, exc
from sqlalchemy.engine.url import URL
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import sessionmaker

import time
import datetime
import db_config

from types import SimpleNamespace

Base = declarative_base()
engine = create_engine(URL(**db_config.DATABASE))
Session = sessionmaker(bind=engine)

session = Session()

trxapp = SimpleNamespace()
trxapp.config = {'SECRET_KEY': "jigga does as jigga does"}


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String(64))
    hash = Column(String(256))
    email = Column(String(64))
    created = Column(Integer)
    status = Column(Integer)

    def hash_password(self, password):
        self.hash = pwd_context.encrypt(password)


    @staticmethod
    def see_hash(password):
        print(str(pwd_context.encrypt(password)))

    def compare_hash(self, password):
        print(str(pwd_context.verify(password, self.hash)))
        User.see_hash(password)
        print(str(self.hash))
        return pwd_context.verify(password, self.hash)

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
    def verify_password(email_or_token, password):
        user = User.verify_auth_token(email_or_token)
        print('78')
        # print(str(user))
        if not user:
            user = session.query(User).filter(User.email == email_or_token).first()
            print("82 checking " + str(user.serialize()))
            # print(str(user.compare_hash(password)))
            # print(str(User.see_hash(password)))
            if user is None or not user.compare_hash(password):
                print('Returning false on 85')
                return False
        return True

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
        user = session.query(User).get(data['id'])
        # print(str(user))
        if user is None:
            return
        return user


def db_connect():
    return create_engine(URL(**db_config.DATABASE))


def create_all():
    Base.metadata.create_all(db_connect())


def create_user():
    print("Stuff here")


def check_authentication(user, password, email):
    query_user = session.query(User).filter(User.name == user).first()
    if query_user is not None:
        verify = User.verify_password(email, password)
        print("119 " + str(verify))
        if not User.verify_password(email, password):
            return "Login is no good"

        return query_user.serialize()
    else:
        pass_hash = User.generate_hash(password)
        new_user = User(name=user, hash=pass_hash, email=email,
                        created=int(time.mktime(datetime.datetime.now().timetuple())), status=1)

        try:

            session.add(new_user)
            session.commit()
            return new_user.serialize \
                ()

        except exc.SQLAlchemyError as error:
            return error
