import os
from flask import Flask
from flask import render_template, url_for

app = Flask(__name__)

@app.route('/')
def feed(name=None):
    return render_template('feed.html')
