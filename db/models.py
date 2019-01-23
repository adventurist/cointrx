from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from passlib.apps import custom_app_context as pwd_context
from sqlalchemy import ForeignKey, CheckConstraint
from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, MetaData, DateTime
from sqlalchemy.engine.url import URL
from sqlalchemy.sql.expression import true
from sqlalchemy.orm import sessionmaker, relationship, backref
from sqlalchemy.sql import func
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.declarative import declarative_base, as_declarative, declared_attr

from types import SimpleNamespace
from db import db_config

import re
import json

Base = declarative_base()
metadata = MetaData()
engine = create_engine(URL(**db_config.DATABASE))
Session = sessionmaker(bind=engine)

session = Session()

# social_engine = create_engine(URL(**db_config.SOCIAL))
# social_Session = sessionmaker(bind=social_engine)
# social_session = social_Session()

trxapp = SimpleNamespace()
trxapp.config = {'SECRET_KEY': "jigga does as jigga does"}

from sqlalchemy.ext.declarative import declared_attr


class Post(Base):
    __tablename__ = 'post'
    id = Column(Integer, primary_key=True, autoincrement=True)
    uid = Column(Integer, ForeignKey('users.id'))
    date = Column(DateTime, server_default=func.now())
    status = Column(Integer, server_default=true())
    title = Column(String(128))
    body = Column(Text)
    link = relationship("Link", backref="post", uselist=True, order_by="Link.id")
    file = relationship("File", backref='post', uselist=True, order_by='File.id')

    def serialize(self):
        return {
            'id': str(self.id),
            'uid': str(self.uid),
            'date': '{}-{}-{} {}:{}:{}'.format(self.date.year, self.date.month, self.date.day, self.date.hour, self.date.minute, self.date.second),
            'status': str(self.status),
            'title': self.title,
            'body': self.body,
            'links': [{'url': x.url, 'title': x.title} for x in self.link if len(self.link) > 0],
            'files': [x.uri for x in self.file if len(self.file) > 0]
        }


class Link(Base):
    __tablename__ = "link"
    id = Column(Integer, primary_key=True, autoincrement=True)
    url = Column(String(256))
    title = Column(String(128))
    pid = Column(Integer, ForeignKey('post.id'))


class File(Base):
    __tablename__ = "file"
    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(128))
    uri = Column(String(256))
    mime = Column(String(64))
    uid = Column(Integer, ForeignKey('users.id'))
    pid = Column(Integer, ForeignKey('post.id'))
    status = Column(Integer, server_default=true())


class Share(Base):
    __tablename__ = "share"
    id = Column(Integer, primary_key=True, autoincrement=True)
    uid = Column(Integer, ForeignKey('users.id'))
    cid = Column(Integer, ForeignKey('users.id'))
    pid = Column(Integer, ForeignKey('post.id'))
    status = Column(Integer, server_default=true())
    date = Column(DateTime, server_default=func.now())


class TrxKey(Base):
    __tablename__ = 'trxkey'
    id = Column(Integer, primary_key=True)
    uid = Column(Integer, ForeignKey('users.id'))
    # label = relationship("KeyLabel", backref='keylabel', uselist=False)
    # user = relationship("HeartbeatUser", backref='pic', uselist=False)
    label = relationship("KeyLabel", uselist=False, back_populates="trxkey")
    value = Column(String)
    multi = Column(Boolean)
    status = Column(Boolean)

    def serialize(self):
        return {
            'id': self.id,
            'status': self.status,
            'uid': self.uid,
            'value': self.value,
        }


class TRX(Base):
    __tablename__ = 'trx'
    pending = Column(Boolean, default=False, primary_key=True)


class TxQueue(Base):
    __tablename__ = 'tx_queue'
    id = Column(Integer, primary_key=True, autoincrement=True)
    sender = Column(Integer, ForeignKey('users.id'))
    recipient = Column(Integer, ForeignKey('users.id'))
    amount = Column(DECIMAL(12, 2))
    complete = Column(Boolean, server_default='false')


class SKey(Base):
    __tablename__ = 'skey'
    id = Column(Integer, primary_key=True)
    uid = Column(Integer, ForeignKey('users.id'))
    kid = Column(Integer, ForeignKey('trxkey.id'))
    value = Column(String)


class MKey(Base):
    __tablename__ = 'mkey'
    id = Column(Integer, primary_key=True)
    uid = Column(Integer, ForeignKey('users.id'))
    kid = Column(Integer, ForeignKey('trxkey.id'))
    pub = Column(String)


class KeySchedule(Base):
    __tablename__ = 'keyschedule'
    id = Column(Integer, primary_key=True)
    kid = Column(Integer, ForeignKey('trxkey.id'))
    end_date = Column(DateTime(timezone=True))


class KeyLabel(Base):
    __tablename__ = 'keylabel'
    id = Column(Integer, primary_key=True)
    text = Column(String, server_default="Unnamed")
    kid = Column(Integer, ForeignKey('trxkey.id'))
    trxkey = relationship("TrxKey", back_populates='label')


class TRCHistory(Base):
    __tablename__ = 'trc_history'
    id = Column(Integer, primary_key=True)
    time = Column(DateTime(timezone=True))
    value = Column(DECIMAL(12, 2))


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String(64))
    hash = Column(String(256))
    email = Column(String(64))
    created = Column(Integer)
    status = Column(Integer)
    trxkey = relationship("TrxKey", backref='user', uselist=True, order_by='TrxKey.status')
    utc_offset = Column(Integer)
    level = Column(Integer, nullable=False, server_default='0')
    balance = Column(DECIMAL(12, 2), server_default='0.00')
    CheckConstraint('level BETWEEN 0 and 4')

    # TODO
    def hash_password(self, password):
        self.hash = pwd_context.hash(password)

    @staticmethod
    def see_hash(password):
        print(str(pwd_context.hash(password)))

    def compare_hash(self, password):
        print(str(pwd_context.verify(password, self.hash)))
        User.see_hash(password)
        print(str(self.hash))
        return pwd_context.verify(password, self.hash)

    def generate_auth_token(self, expiration=600):
        s = Serializer(trxapp.config['SECRET_KEY'], expires_in=expiration)
        return s.dumps({'id': self.id})

    def generate_refresh_token(self):
        s = Serializer(trxapp.config['SECRET_KEY'], expires_in=99999999)
        return s.dumps({'id': self.id})

    def serialize(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'level': self.level,
            'email': self.email,
            'created': self.created,
            'status': self.status,
            'keys': [x.serialize() for x in self.trxkey if x is not None]
        }

    @staticmethod
    def verify_password(email_or_token, password) -> bool:
        user = User.verify_auth_token(email_or_token)
        if not user:
            user = session.query(User).filter(User.email == email_or_token).first()
            if user is None or not user.compare_hash(password):
                return False
        return True

    @staticmethod
    def verify_password_by_name(name, password) -> bool:
        user = User.verify_auth_token(name)
        if not user:
            user = session.query(User).filter(User.name == name).first()
            if user is None or not user.compare_hash(password):
                return False
        return True

    @staticmethod
    def generate_hash(password):
        return pwd_context.hash(password)

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

        if user is None:
            return
        return user


class ETHPrice(Base):
    __tablename__ = 'eth_price'
    id = Column(Integer, primary_key=True)
    currency = Column(String(4))
    last = Column(DECIMAL(12, 2))
    modified = Column(DateTime(timezone=False))
    revisions = relationship("ETHPriceRevision", back_populates="eth_price", lazy="select")


class CXPrice(Base):
    __tablename__ = 'cx_price'
    id = Column(Integer, primary_key=True)
    currency = Column(String(4))
    last = Column(DECIMAL(12, 2))
    buy = Column(DECIMAL(12, 2))
    sell = Column(DECIMAL(12, 2))
    modified = Column(Integer)
    revisions = relationship("CXPriceRevision", back_populates="cx_price", lazy="select")

    def serialize(self) -> dict:
        return {
            'id': self.id,
            'currency': self.currency,
            'last': re.sub("[^0-9^.]", "", str(self.last)),
            'buy': re.sub("[^0-9^.]", "", str(self.buy)),
            'sell': re.sub("[^0-9^.]", "", str(self.sell)),
            'modified': self.modified
        }


class ETHPriceRevision(Base):
    __tablename__ = "eth_price_revision"
    id = Column(Integer, primary_key=True)
    rid = Column(Integer)
    currency = Column(String(4))
    last = Column(DECIMAL(12, 2))
    date = Column(DateTime(timezone=False))
    currency_id = Column(Integer, ForeignKey('eth_price.id'))
    eth_price = relationship("ETHPrice", back_populates="revisions")


class CXPriceRevision(Base):
    __tablename__ = 'cx_price_revision'
    id = Column(Integer, primary_key=True)
    rid = Column(Integer)
    currency = Column(String(4))
    last = Column(DECIMAL(12, 2))
    buy = Column(DECIMAL(12, 2))
    sell = Column(DECIMAL(12, 2))
    modified = Column(Integer)
    currency_id = Column(Integer, ForeignKey('cx_price.id'))
    cx_price = relationship("CXPrice", back_populates="revisions")

    def serialize(self):
        return {
            'id': self.id,
            'rid': self.rid,
            'currency': self.currency,
            'last': re.sub("[^0-9^.]", "", str(self.last)),
            'buy': re.sub("[^0-9^.]", "", str(self.buy)),
            'sell': re.sub("[^0-9^.]", "", str(self.sell)),
            'modified': self.modified,
            'currency_id': self.currency_id
        }


class CADCur(Base):
    __tablename__ = 'cad_cur'
    id = Column(Integer, primary_key=True)
    currency = Column(String(4))
    last = Column(DECIMAL(12, 3))
    buy = Column(DECIMAL(12, 3))
    sell = Column(DECIMAL(12, 3))
    volume = Column(DECIMAL(12, 3))
    modified = Column(Integer)


class CADCurRevision(Base):
    __tablename__ = 'cad_cur_revision'
    id = Column(Integer, primary_key=True)
    rid = Column(Integer)
    currency = Column(String(4))
    last = Column(DECIMAL(12, 3))
    buy = Column(DECIMAL(12, 3))
    sell = Column(DECIMAL(12, 3))
    volume = Column(DECIMAL(12, 3))
    modified = Column(Integer)


@as_declarative()
class HeartbeatCommentBase(object):
    """Base class which provides automated table name
    and surrogate primary key column.

    """

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    cid = Column(Integer, primary_key=True)


class CommentAssociation(Base, HeartbeatCommentBase):
    """Associates a collection of Comment objects
    with a particular parent.

    """
    __tablename__ = "comment_association"

    entity_type = Column(String)
    """Refers to the type of parent."""

    __mapper_args__ = {"polymorphic_on": entity_type}


class HasComments(object):
    """HasAddresses mixin, creates a relationship to
    the address_association table for each parent.

    """

    @declared_attr
    def comment_association_id(cls):
        return Column(Integer, ForeignKey("comment_association.cid"))

    @declared_attr
    def comment_association(cls):
        name = cls.__name__
        entity_type = name.lower()

        assoc_cls = type(
            "%sCommentAssociation" % name,
            (CommentAssociation,),
            dict(
                __tablename__=None,
                __mapper_args__={
                    "polymorphic_identity": entity_type
                }
            )
        )

        cls.comments = association_proxy(
            "comment_association", "comments",
            creator=lambda comments: assoc_cls(comments=comments)
        )
        return relationship(assoc_cls,
                            backref=backref("parent", uselist=False))


class Heartbeat(Base):
    __tablename__ = 'heartbeat_field_data'
    id = Column(Integer, primary_key=True)
    type = Column(String(32))
    uid = Column(Integer, ForeignKey('users_field_data.uid'))
    nid = Column(Integer)
    name = Column(String(128))
    message = Column(Text)
    created = Column(Integer)
    status = Column(Boolean)
    comments = relationship("HeartbeatComment", backref="heartbeat_field_data", uselist=True)

    def serialize(self) -> dict:
        return {
            'id': self.id,
            'type': self.type,
            'uid': self.uid,
            'nid': self.nid,
            'name': re.sub("[^0-9^.]", "", str(self.name)),
            'message': re.sub("[^0-9^.]", "", str(self.message)),
            'created': self.created
        }


class HeartbeatUser(Base):
    __tablename__ = 'users_field_data'
    uid = Column(Integer, primary_key=True)
    name = Column(String(128))
    heartbeats = relationship("Heartbeat", backref='user', uselist=True)

    def serialize(self) -> dict:
        return {
            'uid': self.uid,
            'name': re.sub("[^0-9^.]", "", str(self.name)),
        }


class HeartbeatUserPicture(Base):
    __tablename__ = 'user__user_picture'
    entity_id = Column(Integer, ForeignKey('users_field_data.uid'), primary_key=True)
    user_picture_target_id = Column(Integer, ForeignKey('file_managed.fid'))
    image = relationship("FileManaged", backref='file_managed', uselist=False)
    user = relationship("HeartbeatUser", backref='pic', uselist=False)


class FileManaged(Base):
    __tablename__ = 'file_managed'
    fid = Column(Integer, primary_key=True)
    uid = Column(Integer)
    uri = Column(String)


class HeartbeatComment(Base):
    __tablename__ = 'comment_field_data'
    cid = Column(Integer, primary_key=True)
    created = Column(Integer)
    entity_type = Column(String)
    uid = Column(Integer, ForeignKey('users_field_data.uid'))
    body = relationship("HeartbeatCommentBody", backref="comment_field_data", uselist=False)
    entity_id = Column(Integer, ForeignKey(Heartbeat.id))


class HeartbeatFlag(object):
    pass


class HeartbeatFlagCount(object):
    pass


class HeartbeatCommentBody(Base):
    __tablename__ = 'comment__comment_body'
    entity_id = Column(Integer, ForeignKey('comment_field_data.cid'), primary_key=True)
    comment_body_value = Column(Text)

    def serialize(self) -> dict:
        return {
            'body': re.sub("[^0-9^.]", "", str(self.comment_body_value)),
        }
