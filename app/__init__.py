from flask import Flask
from flask import render_template, url_for
from flask import request
from bson import ObjectId
from load_stories import get_latest_stories, get_stories_since, get_stories_before
import json

app = Flask(__name__)
app.config['DEBUG'] = True

@app.route('/')
def feed():
    home_stories =  get_latest_stories(
                        sort=-1,
                        num_articles=20
                    )
    return render_template('feed.html', home_stories=home_stories)

@app.route('/api/stories/since', methods=['POST'])
def get_lastest_stories():
    since      = request.form.get('since')
    categories = request.form.getlist('categories[]')
    return json.dumps({'stories': get_stories_since(since, categories=categories)})

@app.route('/api/stories/before', methods=['POST'])
def get_older_stories():
    before     = request.form.get('before')
    categories = request.form.getlist('categories[]')
    return json.dumps({'stories': get_stories_before(before, categories=categories)})

if __name__ == '__main__' and app.config['DEBUG'] and False:
    app.run()