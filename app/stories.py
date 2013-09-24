from pymongo import MongoClient
from fetchers
import json
from bson import ObjectId


def article_mapper(article):
    return {
        'id'        : str(article['_id']),
        'title'     : article['t'],
        'source'    : article['w'],
        'link'      : article['u'],
        'kik_count' : article['k'],
        'images'    : article['i'],
    }

def latest(categories=None, offset=0, num_articles=30, sort=1):
    client = get_mongo_client()
    db     = client.get_default_database()
    article_collection = db['articles']

    query = {}
    if categories:
        query['c'] = {'$in': categories}

    articles =  article_collection \
                            .find(query) \
                            .sort('_id', sort)\
                            .skip(offset)\
                            .limit(num_articles)

    article_dicts = []
    for article in articles:
        article_dicts.append(article_mapper(article))

    close_mongo_client(client)
    return article_dicts

def since(since_id, categories=None, num_articles=10, sort=1):
    client = get_mongo_client()
    db     = client.get_default_database()
    article_collection = db['articles']

    query = { '_id': {'$gt': ObjectId(since_id) } }
    if categories:
        query['c'] = {'$in': categories}

    articles =  article_collection \
                            .find(query) \
                            .sort('_id', sort) \
                            .limit(num_articles) 

    article_dicts = []
    for article in articles:
        article_dicts.append(article_mapper(article))

    close_mongo_client(client)
    return article_dicts

def before(before_id, categories=None, num_articles=10, sort=-1):
    client = get_mongo_client()
    
    # load data from mongo, default 10 articles at a time
    db = client.get_default_database()
    article_collection = db['articles']

    query = { '_id': {'$lt': ObjectId(before_id) } }
    if categories:
        query['c'] = {'$in': categories}

    articles =  article_collection \
                            .find(query) \
                            .sort('_id', sort) \
                            .limit(num_articles) 

    article_dicts = []
    for article in articles:
        article_dicts.append(article_mapper(article))

    close_mongo_client(client)
    return article_dicts    

def kik(article_id):
    success = True

    try:
        client = get_mongo_client()
        db = client.get_default_database()
        article_collection = db['articles']

        article_collection.update(
            { '_id'  : ObjectId(article_id) },
            { '$inc' : { 'k' : 1 }}
        )

        close_mongo_client(client)
    except Exception as e:
        success = False

    return success
