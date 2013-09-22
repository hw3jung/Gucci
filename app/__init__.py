from flask import Flask
from flask import render_template, url_for
from flask import request
from bson import ObjectId
from load_stories import get_latest_stories, get_stories_since
import json

app = Flask(__name__)

@app.route('/')
def feed():
    home_stories = get_latest_stories(['sports', 'headlines', 'celebrity'], 0)
    return render_template('feed.html', home_stories=home_stories, num_articles=50)


