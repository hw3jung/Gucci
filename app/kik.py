from pymongo import MongoClient
from fetch_stories import get_mongo_client, close_mongo_client

def increment_kik_count(article_id):
    success = True

    try:
        client = get_mongo_client()
        # load data from mongo, default 30 articles at a time
        db = client.get_default_database()
        article_collection = db['articles']

        article_collection.update(
            { '_id'  : article_id },
            { '$inc' : { 'k' : 1 }}
        )

        close_mongo_client(client)
    except Exception as e:
        success = False

    return success
