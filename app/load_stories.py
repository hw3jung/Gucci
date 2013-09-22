from pymongo import MongoClient
from fetch_stories import get_mongo_client, close_mongo_client
import json
from bson import ObjectId

def article_mapper(article):
    return {
        'id'        : str(article['_id']),
        'title'     : article['t'],
        'source'    : article['w'],
        'link'      : article['u'],
        'kik_count' : article['k'],
        'images'    : article['i']
    }

def get_latest_stories(categories, offset, num_articles=30, sort=1):
    client = get_mongo_client()
    # load data from mongo, default 30 articles at a time
    db = client.get_default_database()
    article_collection = db['articles']

    articles =  article_collection.find({
                    'c': {'$in': categories}
                }).sort('_id', sort).skip(offset).limit(num_articles)

    article_dicts = []
    for article in articles:
        article_dicts.append(article_mapper(article))

    close_mongo_client(client)
    return article_dicts

def get_stories_since(since_id, categories, num_articles=10, sort=1):
    client = get_mongo_client()
    
    # load data from mongo, default 10 articles at a time
    db = client.get_default_database()
    article_collection = db['articles']

    articles =  article_collection.find({
                    '_id': {'$gt': ObjectId(since_id) }
                }).sort('_id', sort).limit(num_articles)

    article_dicts = []
    for article in articles:
        article_dicts.append(article_mapper(article))

    close_mongo_client(client)
    return article_dicts

def get_stories_before(before_id, categories, num_articles=10, sort=-1):
    client = get_mongo_client()
    
    # load data from mongo, default 10 articles at a time
    db = client.get_default_database()
    article_collection = db['articles']

    articles =  article_collection.find({
                    '_id': {'$lt': ObjectId(before_id) }
                }).sort('_id', sort).limit(num_articles)

    article_dicts = []
    for article in articles:
        article_dicts.append(article_mapper(article))

    close_mongo_client(client)
    return article_dicts    