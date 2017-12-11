from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from passlib.apps import custom_app_context as pwd_context
from aiopg.sa import create_engine as async_engine
from sqlalchemy import ForeignKey
from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, exc, event, MetaData, select
from sqlalchemy import desc
from sqlalchemy import func
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import sessionmaker, relationship, backref
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.declarative import declarative_base, as_declarative, declared_attr
from db import db_config
from types import SimpleNamespace

from mypy import *

import asyncio
import timeago
import re
import time
import datetime

Base = declarative_base()
metadata = MetaData()
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

    def serialize(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created': self.created,
            'status': self.status
        }

    @staticmethod
    def verify_password(email_or_token, password) -> bool:
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
    def verify_password_by_name(name, password) -> bool:
        user = User.verify_auth_token(name)
        if not user:
            user = session.query(User).filter(User.name== name).first()
            if user is None or not user.compare_hash(password):
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

        if user is None:
            return
        return user


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


async def test_db():
    engine = await async_engine(user=db_config.DATABASE['username'], database=db_config.DATABASE['database'],
                                host=db_config.DATABASE['host'], password=db_config.DATABASE['password'])
    async with engine:
        async with engine.acquire() as conn:
            query = select([CXPrice])
            async for row in conn.execute(query):
                print(row)


def db_connect():
    return create_engine(URL(**db_config.DATABASE))


def heartbeat_connect():
    return create_engine(URL(**db_config.SOCIALBASE))


async def trx_db_engine():
    return async_engine(user=db_config.DATABASE['username'], database=db_config.DATABASE['database'],
                        host=db_config.DATABASE['host'], password=db_config.DATABASE['password'])


def create_all():
    Base.metadata.create_all(db_connect())


def create_all_heartbeat():
    HeartbeatCommentBase.metadata.create_all(heartbeat_connect())


def create_user():
    print("Stuff here")


def handle_db_data(response):
    for row in response:
        if isinstance(row, CXPriceRevision):
            print(row.serialize())


def update_prices(data):
    loop = asyncio.get_event_loop()
    loop.run_until_complete(parse_price_data(data))


def latest_prices():
    try:
        result = session.query(CXPrice).all()
        data = []
        for r in result:
            if isinstance(r, CXPrice):
                data.append(r.serialize())
        print(data)
        return data
    except exc.SQLAlchemyError as err:
        print(err.args)
        session.rollback()


async def latest_prices_async():
    try:
        result = session.query(CXPrice).all()
        data = []
        for r in result:
            if isinstance(r, CXPrice):
                data.append(r.serialize())
        print(data)
        return data
    except exc.SQLAlchemyError as err:
        print(err.args)
        session.rollback()


def latest_price(currency: str) -> str:
    result = session.query(CXPrice).filter(CXPrice.currency == currency).one_or_none()
    if result is not None:
        print(result.serialize())
        return 'jigga'


async def latest_price_async(currency: str) -> str:
    result = await session.query(CXPrice).filter(CXPrice.currency == currency).one_or_none()
    if result is not None:
        print(result.serialize())
        return 'jigga'


def latest_price_history(currency: str):
    result = session.query(CXPriceRevision).filter(CXPriceRevision.currency == currency).order_by(
        CXPriceRevision.rid.desc()).limit(15).all()
    if result is not None:
        for r in result:
            print(r.serialize())
    return result


async def latest_price_history_async(currency: str):
    result = session.query(CXPriceRevision).filter(CXPriceRevision.currency == currency).order_by(
        CXPriceRevision.rid.desc()).limit(15).all()
    data = []
    if result is not None:
        for r in result:
            data.append(r.serialize())
    return data


def get_users():
    result = session.query(User).all()
    data = {}
    for r in result:
        if isinstance(r, User):
            data.update(r.serialize())
    print(data)
    return result


async def parse_price_data(data):
    for k, v in data.items():
        engine = await async_engine(user=db_config.DATABASE['username'], database=db_config.DATABASE['database'],
                                    host=db_config.DATABASE['host'], password=db_config.DATABASE['password'])

        async with engine:
            async with engine.acquire() as conn:
                try:
                    query = select([CXPrice]).where(CXPrice.currency == k)
                    cur_time = time.time()
                    result = await conn.execute(query)

                    if result.rowcount < 1:
                        async with conn.begin():
                            await conn.execute(
                                CXPrice.__table__.insert().values(currency=k, sell=v['sell'],
                                                                  last=v['last'],
                                                                  buy=v['buy'],
                                                                  modified=cur_time))

                    else:
                        async with conn.begin():
                            await conn.execute(
                                CXPrice.__table__.update().where(CXPrice.currency == k).values(sell=v['sell'],
                                                                                               last=v['last'],
                                                                                               buy=v['buy'],
                                                                                               modified=cur_time))
                    query2 = select([CXPriceRevision]).where(CXPriceRevision.currency == k).group_by(
                        CXPriceRevision.id).order_by(desc(func.max(CXPriceRevision.rid)))
                    result2 = await conn.execute(query2)
                    rid = find_rid(result2)
                    rid = rid + 1 if rid is not None else 1

                    await conn.execute(
                        CXPriceRevision.__table__.insert().values(rid=rid, currency=k, sell=v['sell'],
                                                                  last=v['last'],
                                                                  buy=v['buy'],
                                                                  modified=cur_time))


                except exc.SQLAlchemyError as error:
                    print(error)

                finally:
                    conn.close()


def find_rid(data):
    for d in data:
        if d is not None and d.rid is not None:
            return d.rid
        else:
            return None


def check_authentication(user, password, email):
    query_user = session.query(User).filter(User.name == user).first()
    if query_user is not None:
        if not User.verify_password(email, password):
            return "Login is no good"

        return query_user
    else:
        pass_hash = User.generate_hash(password)
        new_user = User(name=user, hash=pass_hash, email=email,
                        created=int(time.mktime(datetime.datetime.now().timetuple())), status=1)

        try:

            session.add(new_user)
            session.commit()
            return new_user

        except exc.SQLAlchemyError as error:
            return error


def check_auth_by_name(user, password):
    query_user = session.query(User).filter(User.name == user).first()
    if query_user is not None:
        if not User.verify_password_by_name(user, password):
            return "Login is no good"

        return query_user
    else:
        pass_hash = User.generate_hash(password)
        new_user = User(name=user, hash=pass_hash, email='temp@jigga.com',
                        created=int(time.mktime(datetime.datetime.now().timetuple())), status=1)

        try:

            session.add(new_user)
            session.commit()
            return new_user

        except exc.SQLAlchemyError as error:
            return error


@event.listens_for(CXPrice, 'before_insert')
def cx_insert_listener(*args):
    for key in args:
        print(key)


@event.listens_for(CXPrice, 'after_update')
def cx_update_listener(*args):
    @event.listens_for(Session, "after_flush")
    def cx_after_flush(prev_session, context):
        for v in prev_session.dirty:
            if isinstance(v, CXPrice):
                last = session.query(CXPriceRevision).filter(CXPriceRevision.currency == v.currency).group_by(
                    CXPriceRevision.id).order_by(desc(func.max(CXPriceRevision.rid))).one_or_none()
                rid = 1 if last is None else last.rid + 1
                new_rev = CXPriceRevision(rid=rid, currency=v.currency, last=v.last, buy=v.buy, sell=v.sell,
                                          modified=v.modified)
                try:
                    session.add(new_rev)
                    session.commit()

                except exc.SQLAlchemyError as error:
                    session.rollback()


def build_sub_comments(comments, now, session):
    if comments is not None:
        return [{
                    'cid': x.cid,
                    'body': x.body,
                    'user': session.query(HeartbeatUser).filter(HeartbeatUser.uid == x.uid).one(),
                    'timeago': timeago.format(x.created, now),
                } for x in comments]


def build_comments(comments, now, session):
    if comments is not None:
        return [{
                    'cid': x.cid,
                    'body': x.body,
                    'user': session.query(HeartbeatUser).filter(HeartbeatUser.uid == x.uid).one(),
                    'timeago': timeago.format(x.created, now),
                    'subcomments': build_sub_comments(session.query(HeartbeatComment).filter(HeartbeatComment.entity_id==x.cid, HeartbeatComment.entity_type=='comment').all(), now, session)
                } for x in comments]


async def heartbeat_get_all():
    heartbeat_engine = create_engine(URL(**db_config.SOCIALBASE), echo=True)
    now = datetime.datetime.now() + datetime.timedelta(seconds=60 * 3.4)
    media_session = sessionmaker(bind=heartbeat_engine)()
    result = media_session.query(Heartbeat).outerjoin(HeartbeatComment,
                                                      HeartbeatComment.entity_type == 'heartbeat').filter(Heartbeat.status==1).limit(50).all()
    data = []
    if result is not None:
        for r in result:
            data.append(
                {
                    'id': r.id,
                    'message': r.message,
                    'timeago': timeago.format(r.created, now),
                    'user': {
                        'name': r.user.name, 'uid': r.user.uid,
                        'img': r.user.pic[0].image.uri.replace('public://', 'sites/default/files/styles/thumbnail/public/') if len(r.user.pic) > 0 else None
                    },
                    'comments': build_comments(r.comments, now, media_session),
                    'commentcount': len(r.comments)
                }
            )
    return data