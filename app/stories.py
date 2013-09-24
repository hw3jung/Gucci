from pymongo import MongoClient
from fetchers import get_mongo_client, close_mongo_client
import json
from bson import ObjectId


article_mapper = \
    lambda article: {
        'id'        : str(article['_id']),
        'title'     : article['t'],
        'source'    : article['w'],
        'link'      : article['u'],
        'kik_count' : article['k'],
        'images'    : article['i'],
     }

def latest(categories=None, offset=0, num_articles=30, sort=1):
    client     = get_mongo_client()
    db         = client.get_default_database()
    collection = db['articles']
    query      = { '$in': categories } if categories else {}

    articles =  collection \
                .find(query) \
                .sort('_id', sort)\
                .skip(offset)\
                .limit(num_articles)

    close_mongo_client(client)
    return map(article_mapper, articles)

def since(since_id, categories=None, num_articles=10, sort=1):
    client     = get_mongo_client()
    db         = client.get_default_database()
    collection = db['articles']
    query      = { '_id': {'$gt': ObjectId(since_id) } }

    if categories:
        query['c'] = {'$in': categories}

    articles =  collection \
                .find(query) \
                .sort('_id', sort) \
                .limit(num_articles) 

    close_mongo_client(client)
    return map(article_mapper, articles)

def before(before_id, categories=None, num_articles=10, sort=-1):
    client     = get_mongo_client()
    db         = client.get_default_database()
    collection = db['articles']
    query      = { '_id': {'$lt': ObjectId(before_id)} }

    if categories:
        query['c'] = {'$in': categories}

    articles =  collection \
                .find(query) \
                .sort('_id', sort) \
                .limit(num_articles) 

    close_mongo_client(client)
    return map(article_mapper, articles)

def kik(article_id):
    success = True

    try:
        client     = get_mongo_client()
        db         = client.get_default_database()
        collection = db['articles']

        collection.update(
            { '_id'  : ObjectId(article_id) },
            { '$inc' : { 'k' : 1 } }
        )

        close_mongo_client(client)
    except Exception as e:
        success = False

    return success
