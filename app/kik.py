from pymongo import MongoClient
from fetch_stories import get_mongo_client, close_mongo_client
from bson import ObjectId

def increment_kik_count(article_id):
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
