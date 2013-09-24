from pymongo  import MongoClient
from fetchers import get_mongo_client, close_mongo_client
from bson     import ObjectId
import json


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
    collection = client.get_default_database()['articles']
    query      = { 'c': { '$in': categories } } if categories else {}
    articles   =  collection \
                    .find(query) \
                    .sort('_id', sort)\
                    .skip(offset)\
                    .limit(num_articles)

    close_mongo_client(client)
    return map(article_mapper, articles)

def since(since_id, categories=None, num_articles=10, sort=1):
    client     = get_mongo_client()
    collection = client.get_default_database()['articles']
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
    collection = client.get_default_database()['articles']
    query      = { '_id': {'$lt': ObjectId(before_id)} }

    if categories:
        query['c'] = {'$in': categories}

    articles =  collection \
                .find(query) \
                .sort('_id', sort) \
                .limit(num_articles) 

    close_mongo_client(client)
    return map(article_mapper, articles)

def most_kiked(offset=0, num_articles=10, sort=-1):
    client     = get_mongo_client()
    collection = client.get_default_database()['articles']
    query      = { 'k': {'$gt': 0} }
    articles   =  collection \
                    .find(query) \
                    .sort('k', sort) \
                    .skip(offset) \
                    .limit(num_articles) 

    close_mongo_client(client)
    return map(article_mapper, articles)    

def kik(article_id):
    success = True
    try:
        client     = get_mongo_client()
        collection = client.get_default_database()['articles']
        collection.update(
            { '_id'  : ObjectId(article_id) },
            { '$inc' : { 'k' : 1 } }
        )
        close_mongo_client(client)
    except Exception as e:
        success = False

    return success
