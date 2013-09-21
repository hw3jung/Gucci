from pymongo import MongoClient
import threading
import time
import urllib2
import json

def get_mongo_client():
    pass

def close_mongo_client():
    pass

class StoryFetcher(threading.Thread):
    MAX_CALLS_PER_DAY = 9900
    POLL_INTERVAL     = max(((24 * 60 * 60) / MAX_CALLS_PER_DAY), 20)

    def __init__(self, *args, **kwargs):
        threading.Thread.__init__(self)

    def fetch_stories(self):
        raise NotImplementedError()

    def run(self):
        while True:
            try:
                self.fetch_stories()
            except Exception, e:
                pass
            time.sleep(self.POLL_INTERVAL)

class NYTStoryFetcher(StoryFetcher):
    MAX_CALLS_PER_DAY = 9900
    BASE_URI = ''
    def fetch_stories(self):
        req = urllib2.Request(BASE_URI)
        response = urllib2.urlopen(req)
        response = json.loads(response.read())
        client   = get_mongo_client()
        #push data into mongo
        close_mongo_client()

class BBCStoryFetcher(StoryFetcher):
    MAX_CALLS_PER_DAY = 10000
    BASE_URI = 'http://api.bbcnews.appengine.co.uk/stories/'
    topics   = ['uk']
    def fetch_stories(self):
        client   = get_mongo_client()
        for topic in self.topics:
            req = urllib2.Request(self.BASE_URI + topic)
            response = urllib2.urlopen(req)
            response = json.loads(response.read())
            #push data into mongo
        close_mongo_client()    

class FeedZillaStoryFetcher(StoryFetcher):
    MAX_CALLS_PER_DAY = 10000
    BASE_URI = 'http://api.feedzilla.com/v1'
    def fetch_stories(self):
        client   = get_mongo_client()
        for topic in self.topics:
            req = urllib2.Request(self.BASE_URI + topic)
            response = urllib2.urlopen(req)
            response = json.loads(response.read())
            #push data into mongo
        close_mongo_client() 

def main():
    NYTStoryFetcher().start()
    BBCStoryFetcher().start()
    FeedZillaStoryFetcher().start()

if __name__ == '__main__':
    main()