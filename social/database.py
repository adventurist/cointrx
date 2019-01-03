# Tornado
from tornado.log import enable_pretty_logging
# SQL Alchemy
from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, MetaData, DateTime
from sqlalchemy import ForeignKey, CheckConstraint
from sqlalchemy import create_engine, exc
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import sessionmaker, relationship, backref
from sqlalchemy.ext.declarative import declarative_base, as_declarative, declared_attr
# DB Models
from db.models import Post, Share, Link, File, User
# Configuration
from db import db_config
# Logging
import logging
from social.app import setup_logger

log = setup_logger('SOCIAL_DB', logging.INFO)
enable_pretty_logging()
Base = declarative_base()
engine = create_engine(URL(**db_config.DATABASE))
Session = sessionmaker(bind=engine)

session = Session()


async def create_post(user: User, content: dict) -> Post:
    # This simple example does not handle files
    # Date does not have to be set, as the database sets it to a default value of now()
    session.rollback()
    session.flush()
    new_post = Post(uid=user.id, title=content['title'], body=content['body'])
    session.add(new_post)

    # Handle links
    if 'links' in content:
        for link in content['links']:
            new_link = Link(pid=new_post.id, title=link['title'], url=link['url'])
            session.add(new_link)
    try:
        session.commit()
        session.flush()

        return new_post

    except exc.SQLAlchemyError as err:
        log.info('Error committing data to database')
        log.error(str(err))
