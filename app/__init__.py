from flask import Flask
from flask import render_template, url_for
from flask import request
from bson import ObjectId
from load_stories import get_latest_stories
import json

app = Flask(__name__)

@app.route('/')
def feed(name=None):
    return render_template('feed.html')

@app.route('/api/latest', methods=['POST'])
def get_lastest_stories():
	category = request.form['category']
	offset 	 = request.form['offset']
	limit 	 = request.form['limit']

	articles = get_latest_stories(category, offset, limit)

    return json.dumps(articles)