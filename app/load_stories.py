from pymongo import MongoClient
from fetch_stories import get_mongo_client, close_mongo_client
import json

def get_latest_stories(category, offset, num_articles=10):
	client = get_mongo_client()
	
	# load data from mongo, default 10 articles at a time
	db = client.get_default_database()
    article_collection = db['articles']

   	articles = article_collection.find({'c': category}) \
   		.sort('d', -1) \
   		.skip(offset) \
   		.limit(num_articles)

   	article_dicts = []
   	for article in articles:
   		article_dicts.append({
   			'title'  	: article['t'],
   			'source' 	: article['w'],
   			'link'   	: article['u'],
   			'kik_count' : article['k'],
   			'images'    : article['i']
		})

	close_mongo_client(client)
   	return article_dicts