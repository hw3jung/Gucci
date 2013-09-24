from pymongo import MongoClient
from fetch_stories import get_mongo_client, close_mongo_client
from bson import ObjectId
from datetime import datetime, timedelta

def remove_old_stories():
    client = get_mongo_client()
    db     = client.get_default_database()
    article_collection = db['articles']

    two_days_ago = datetime.utcnow() - timedelta(days=2)
    two_days_ago = ObjectId.from_datetime(two_days_ago)

    query = {
        '_id' : { '$lt' : two_days_ago}
    }
    
    article_collection.remove(query)
    close_mongo_client(client)

def main():
    remove_old_stories()

if __name__ == '__main__':
    main()
