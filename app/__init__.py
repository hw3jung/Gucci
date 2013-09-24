from flask import Flask
from flask import render_template
from flask import request
from bson import ObjectId
import json
import stories

app = Flask(__name__)
app.config['DEBUG'] = True

@app.route('/')
def feed():
    most_kiked        =  stories.most_kiked(sort=-1, num_articles=20)    
    home_stories      =  stories.latest(sort=-1, num_articles=50)
    sports_stories    =  stories.latest(categories=['sports'],             sort=-1, num_articles=20)
    celebrity_stories =  stories.latest(categories=['celebrity', 'life'] , sort=-1, num_articles=20)
    tech_stories      =  stories.latest(categories=['tech', 'technology'], sort=-1, num_articles=20)    
    world_stories     =  stories.latest(categories=['world']             , sort=-1, num_articles=20)   
    business_stories  =  stories.latest(categories=['business', 'money'] , sort=-1, num_articles=20)                              
                           
    return  render_template(
                'feed.html', 
                home_stories      = home_stories,
                sports_stories    = sports_stories,
                celebrity_stories = celebrity_stories,
                tech_stories      = tech_stories,
                business_stories  = business_stories,
                world_stories     = world_stories,
                most_kiked        = most_kiked
            )

@app.route('/api/stories/since', methods=['POST'])
def get_lastest_stories():
    since      = request.form.get('since')
    categories = request.form.getlist('categories[]')
    return json.dumps({ 'stories': stories.since(since, categories=categories) })

@app.route('/api/stories/before', methods=['POST'])
def get_older_stories():
    before     = request.form.get('before')
    categories = request.form.getlist('categories[]')
    return json.dumps({ 'stories': stories.before(before, categories=categories) })

@app.route('/api/stories/most-kiked', methods=['POST'])
def get_most_kiked_stories():
    offset  = request.form.get('offset')
    _stories = stories.most_kiked(offset=int(offset), sort=-1, num_articles=20)
    return json.dumps({ 'stories': _stories })

@app.route('/api/story/kik', methods=['POST'])
def kik_story():
	story_id = request.form.get('story_id')
	return json.dumps({ 'success': stories.kik(story_id) })

if __name__ == '__main__' and app.config['DEBUG'] and False:
    app.run()