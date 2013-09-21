from flask import Flask
from flask import render_template, url_for
from bson import ObjectId
import json

app = Flask(__name__)

@app.route('/')
def feed(name=None):
    return render_template('feed.html')


