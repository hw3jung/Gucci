from pymongo import MongoClient
import threading
import time
import urllib2
import json
import sys
import time
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import signal
import sys

MONGODB_URI = 'mongodb://heroku:f6a7beb1d678f34e3bbef2d5a6e62cbd@paulo.mongohq.com:10025/app18218091'


def get_mongo_client():
    return MongoClient(MONGODB_URI)


def close_mongo_client(client):
    client.close()


class StoryFetcher(threading.Thread):
    MAX_CALLS_PER_DAY = 9900

    @property
    def poll_interval(self):
        return max(((24 * 60 * 60) / self.MAX_CALLS_PER_DAY), 30)

    def __init__(self, *args, **kwargs):
        threading.Thread.__init__(self)

    def fetch_stories(self):
        raise NotImplementedError()

    def log(self, msg):
        print '%s: %s' % (self.__class__.__name__, msg,)

    def run(self):
        while True:
            try:
                self.log('fetching stories')
                self.fetch_stories()
            except Exception as e:
                self.log(str(e))

            time.sleep(self.poll_interval)

'''
    NYT Most Popular API Docs:
    http://developer.nytimes.com/docs/most_popular_api/
'''
class NYTStoryFetcher(StoryFetcher):
    MAX_CALLS_PER_DAY = 9900
    BASE_URI = 'http://api.nytimes.com/svc/mostpopular/v2/mostviewed/' \
        'all-sections/1.json?api-key='
    BASE_API_KEY = 'ac09cbf9b6e9b29b16e0645e502f2008:7:68161152'

    # poll interval override; only for nyt
    # This is calculated assuming there are at most 1500 articles in
    # the results to iterate through at each fetch interval
    # 1300 seconds ~ 21 minutes
    @property
    def poll_interval(self):
        return 1300;
    
    def store_stories(self, articles):
        client = get_mongo_client()
        db = client.get_default_database()
        article_collection = db['articles']

        self.log('%d potentially new articles' % (len(articles)))
        new_articles = []
        for article in articles:
            if article_collection.find({'u': article['url']}).count() > 0:
                continue

            media_contents = article['media']
            images = []

            for content in media_contents:
                if content['type'] == "image" and content['subtype'] == "photo":
                    largest = None

                    for metadata in content['media-metadata']:
                        if largest is None:
                            largest = metadata
                        else:
                            if metadata['width'] > largest['width']:
                                largest = metadata

                    if largest and largest['width'] >= 200:
                        images.append(largest['url'])

            published_date = datetime.fromtimestamp(
                time.mktime(time.strptime(article['published_date'], '%Y-%m-%d')))

            params = {
                'u': article['url'],
                'c': article['section'],
                'a': article['byline'],
                't': article['title'],
                's': article['abstract'],
                'd': published_date,
                'w': 'nyt',
                'i': images,
                'k': 0
            }
            if len(params['i']) == 0: continue
            new_articles.append(params)

        if len(new_articles) > 0:
            article_collection.insert(new_articles)
        else:
            self.log('no new articles to insert')

        close_mongo_client(client)

    def fetch_stories(self):
        api_uri = self.BASE_URI + self.BASE_API_KEY

        max_offset = sys.maxsize
        offset = 0
        while offset <= max_offset:
            next_api_uri = api_uri + '&offset=' + str(offset)

            req = urllib2.Request(next_api_uri)
            response = urllib2.urlopen(req)

            result = json.loads(response.read())
            response.close()

            articles = result['results']

            # push data into mongo
            self.store_stories(articles)

            # update real max offset
            if max_offset == sys.maxsize:
                total = result['num_results']
                max_offset = total - (total % 20)

            offset += 20


class BBCStoryFetcher(StoryFetcher):
    MAX_CALLS_PER_DAY = 10000
    BASE_URI = 'http://api.bbcnews.appengine.co.uk/stories/'
    TOPICS = ['headlines', 'world']

    def store_stories(self, articles):
        client = get_mongo_client()
        db = client.get_default_database()
        article_collection = db['articles']
        self.log('%d potentially new articles' % (len(articles)))
        new_articles = []
        for article in articles:
            if article_collection.find({'u': article['link']}).count() > 0:
                continue

            images = [
                article['thumbnail']
            ]

            params = {
                'u': article['link'],
                'c': 'headlines',
                't': article['title'],
                's': article['description'],
                'd': datetime.fromtimestamp(article['published']),
                'w': 'bbc',
                'i': images,
                'k': 0
            }
            if len(params['i']) == 0: continue
            new_articles.append(params)

        if len(new_articles) > 0:
            article_collection.insert(new_articles)
        else:
            self.log('no new articles to insert')

        close_mongo_client(client)

    def fetch_stories(self):
        client = get_mongo_client()

        for topic in self.TOPICS:
            api_uri = self.BASE_URI + topic

            req = urllib2.Request(api_uri)
            response = urllib2.urlopen(req)

            result = json.loads(response.read())
            response.close()

            articles = result['stories']

            # push data into mongo
            self.store_stories(articles)


class TMZStoryFetcher(StoryFetcher):
    MAX_CALLS_PER_DAY = 24
    BASE_URI = 'http://www.tmz.com/'

    def store_stories(self, articles):
        client = get_mongo_client()
        db = client.get_default_database()
        article_collection = db['articles']
        self.log('%d potentially new articles' % (len(articles)))
        new_articles = []
        for article in articles:
            if article_collection.find({'u': article['link']}).count() > 0:
                continue

            images = [
                article['img_url']
            ]

            params = {
                'u': article['link'],
                'c': 'celebrity',
                't': article['title'],
                'd': datetime.now(),
                'w': 'tmz',
                'i': images,
                'k': 0
            }
            if len(params['i']) == 0: continue
            new_articles.append(params)

        if len(new_articles) > 0:
            article_collection.insert(new_articles)
        else:
            self.log('no new articles to insert')

        close_mongo_client(client)

    def fetch_stories(self):
        client = get_mongo_client()
        req = urllib2.Request(self.BASE_URI)
        response = urllib2.urlopen(req)
        soup = BeautifulSoup(response.read(), 'lxml')
        articles = soup.find_all('article', class_='post')

        try:
            article_dicts = []

            for article in articles:
                title = str(article.find_all('h1')[0].string) + ': ' + \
                    str(article.find_all('h2')[0].string)
                img_url = article.find_all('img')[0].get('src')
                link = article.find_all('a')[0].get('href')

                article_dicts.append({
                    'title': title,
                    'img_url': img_url,
                    'link': link
                })

            # push data into mongo
            self.store_stories(article_dicts)
        except Exception as e:
            pass


class ESPNStoryFetcher(StoryFetcher):
    MAX_CALLS_PER_DAY = 7400
    API_KEY = 'dwk3nu6pd75r5ewrhp6kggsv'
    API_SECRET = 'A9ctQPd8xsBdgzkWjw45nrrs'
    BASE_URI = 'http://api.espn.com/v1'
    METHODS = ('/sports/news/headlines', '/sports/news/headlines/top',)
    current_method = 0

    def store_stories(self, articles):
        client = get_mongo_client()
        db = client.get_default_database()
        article_collection = db['articles']
        self.log('%d potentially new articles' % (len(articles)))
        new_articles = []
        for article in articles:
            if article_collection.find({'u': article['link']['href']}).count() > 0:
                continue

            published_date = article['published'][:10]
            published_date = datetime.fromtimestamp(
                time.mktime(time.strptime(published_date, '%Y-%m-%d')))

            params = {
                'u': article['link']['href'],
                'c': 'sports',
                't': article['title'],
                's': article['description'],
                'd': published_date,
                'w': 'espn',
                'i': article['images'],
                'k': 0
            }
            if len(params['i']) == 0: continue
            new_articles.append(params)

        if len(new_articles) > 0:
            article_collection.insert(new_articles)
        else:
            self.log('no new articles to insert')

        close_mongo_client(client)

    def fetch_stories(self):
        uri = '%s%s?apikey=%s' % \
              (self.BASE_URI, self.METHODS[self.current_method], self.API_KEY)
        req = urllib2.Request(uri)
        response = urllib2.urlopen(req)
        response = json.loads(response.read())
        headlines = response['headlines']

        article_dicts = []
        for headline in headlines:
            try:
                title = headline['headline']
                link = headline['links']['mobile']
                description = headline['description']
                byline = headline[
                    'byline'] if 'byline' in headline else ""
                images = map(lambda _: _['url']['href'] if 'href' in _['url'] \
                    else _['url'], headline['images'])
                published = headline['published']

                article_dicts.append({
                    'title': title,
                    'link': link,
                    'description': description,
                    'byline': byline,
                    'images': images,
                    'published': published
                })
            except Exception as e:
                raise e

        # push data into mongo
        self.store_stories(article_dicts)

        # alternate between methods calls
        self.current_method = int(not self.current_method)


class USATodayStoryFetcher(StoryFetcher):
    MAX_CALLS_PER_DAY = 450
    API_KEYS_DICT = {
        'articles': '75n2e9rcmkz73c2td5mrs5pa',
        'breaking': 'ft3nuxmpwx53caz3buptba66'
    }

    BASE_URI = 'http://api.usatoday.com/open/articles/mobile/topnews'
    TOPICS = ['tech', 'life']
    MAX_ARTICLES = 50

    def store_stories(self, articles, topic):
        client = get_mongo_client()
        db = client.get_default_database()
        article_collection = db['articles']
        self.log('%d potentially new articles' % (len(articles)))
        new_articles = []
        for article in articles:
            # notice here that we are checking duplicates by title;
            # USA Today api generates random data and appends it to the feed url
            # so we can't use it as a unique key
            if article_collection.find({'t': article['title']}).count() > 0:
                continue

            images = []

            try:
                # retrieve image from news link
                req = urllib2.Request(article['link'])
                response = urllib2.urlopen(req)
                soup = BeautifulSoup(response.read(), 'lxml')
                medias = soup.find_all('aside', itemprop='associatedMedia', class_='single-photo')

                if len(medias) == 0:
                    continue

                for media in medias:
                    images.append(media.find_all('img')[0].get('src'))

            except Exception as e:
                pass

            published_date = article['pubDate']
            published_date = datetime.fromtimestamp(
                time.mktime(time.strptime(published_date, '%a, %d %b %Y %I:%M:%S %Z')))

            params = {
                'u': article['link'],
                'c': topic,
                't': article['title'],
                's': article['description'],
                'd': published_date,
                'w': 'usa',
                'i': images,
                'k': 0
            }
            if len(params['i']) == 0: continue
            new_articles.append(params)

        if len(new_articles) > 0:
            article_collection.insert(new_articles)
        else:
            self.log('no new articles to insert')

        close_mongo_client(client)

    def fetch_stories(self):
        client = get_mongo_client()

        for topic in self.TOPICS:
            api_uri = '%s/%s?api_key=%s&encoding=json&days=2&count=%s' % \
                (self.BASE_URI, topic, self.API_KEYS_DICT['articles'], self.MAX_ARTICLES)

            req = urllib2.Request(api_uri)
            response = urllib2.urlopen(req)

            result = json.loads(response.read())
            response.close()

            articles = result['stories']

            # push data into mongo
            self.store_stories(articles, topic)


class TheGuardianStoryFetcher(StoryFetcher):
    MAX_CALLS_PER_DAY = 1000
    API_KEY = 'gjdvz5ntp66s4rbc2ecnk4tc'

    BASE_URI = 'http://content.guardianapis.com/search'
    TOPICS = ['technology', 'business', 'money', 'world']
    MAX_ARTICLES = 50

    def store_stories(self, articles, topic):
        client = get_mongo_client()
        db = client.get_default_database()
        article_collection = db['articles']
        self.log('%d potentially new articles' % (len(articles)))
        new_articles = []
        for article in articles:
            if article_collection.find({'u': article['webUrl']}).count() > 0:
                continue

            images = []

            try:
                # retrieve image from news link
                req = urllib2.Request(article['webUrl'])
                response = urllib2.urlopen(req)
                soup = BeautifulSoup(response.read(), 'lxml')
                medias = soup.find_all('div', id='main-content-picture', itemprop='image')

                if len(medias) == 0:
                    continue

                for media in medias:
                    images.append(media.find_all('img')[0].get('src'))

            except Exception as e:
                pass
            
            published_date = article['webPublicationDate'][:10]
            published_date = datetime.fromtimestamp(
                time.mktime(time.strptime(published_date, '%Y-%m-%d')))

            params = {
                'u': article['webUrl'],
                'c': topic,
                't': article['webTitle'],
                'd': published_date,
                'w': 'guardian',
                'i': images,
                'k': 0
            }
            if len(params['i']) == 0: continue
            new_articles.append(params)

        if len(new_articles) > 0:
            article_collection.insert(new_articles)
        else:
            self.log('no new articles to insert')

        close_mongo_client(client)

    def fetch_stories(self):
        client = get_mongo_client()

        two_days_ago = datetime.utcnow() - timedelta(days=2)
        two_days_ago = time.strftime('%Y-%m-%d', two_days_ago.timetuple())
        
        for topic in self.TOPICS:
            api_uri = '%s?section=%s&api-key=%s&format=json&from-date=%s&page-size=%s' % \
                (self.BASE_URI, topic, self.API_KEY, two_days_ago, self.MAX_ARTICLES)

            req = urllib2.Request(api_uri)
            response = urllib2.urlopen(req)

            result = json.loads(response.read())
            response.close()

            articles = result['response']['results']

            if topic == 'technology':
                topic = 'tech'

            # push data into mongo
            self.store_stories(articles, topic)


def main():
    # deprecated
    # bbc = BBCStoryFetcher() # bad image quality

    nyt      = NYTStoryFetcher()
    tmz      = TMZStoryFetcher()
    espn     = ESPNStoryFetcher()
    usa      = USATodayStoryFetcher()
    guardian = TheGuardianStoryFetcher()

    nyt.start()
    tmz.start()
    espn.start()
    usa.start()
    guardian.start()

if __name__ == '__main__':
    main()
