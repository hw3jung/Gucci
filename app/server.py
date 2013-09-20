import os
from flask import Flask

app = Flask(__name__)

@app.route('/')
def feed():
    return render_template('feed.html')

