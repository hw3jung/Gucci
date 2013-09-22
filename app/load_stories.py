from pymongo import MongoClient
from fetch_stories import get_mongo_client, close_mongo_client
import json
from bson import ObjectId

def get_latest_stories(categories, offset, num_articles=30):
    client = get_mongo_client()
    # load data from mongo, default 30 articles at a time
    db = client.get_default_database()
    article_collection = db['articles']

    articles =  article_collection.find({
                    'c': {'$in': categories}
                }).sort('_id', -1).skip(offset).limit(num_articles)

    article_dicts = []
    for article in articles:
        article_dicts.append({
            'id'        : str(article['_id']),
            'title'     : article['t'],
            'source'    : article['w'],
            'link'      : article['u'],
            'kik_count' : article['k'],
            'images'    : article['i']
        })

    close_mongo_client(client)
    return article_dicts

def get_stories_since(since_id, categories, num_articles=10):
    client = get_mongo_client()
    
    # load data from mongo, default 10 articles at a time
    db = client.get_default_database()
    article_collection = db['articles']

    articles =  article_collection.find({
                    '_id': {'$gt': ObjectId(since_id) },
                    'c'  : {'$in': categories}
                }).sort('_id', -1).limit(num_articles)

    article_dicts = []
    for article in articles:
        article_dicts.append({
            'title'     : article['t'],
            'source'    : article['w'],
            'link'      : article['u'],
            'kik_count' : article['k'],
            'images'    : article['i']
        })

    close_mongo_client(client)
    return article_dicts