$(document).ready(function() {
  Function.prototype.bindTo = function(obj) {
    return _.bind(this, obj);
  };

  var FeedView = Backbone.View.extend({
    tagName: 'ul',
    pollInterval: 10000,
    feedCategories: [],
    initialize: function(args) {
      this.stories       = args.initialStories;
      this.storieViews   = [];
      if(this.stories.length > 0) {
        this.latestStoryID = this.stories[0].id;
        this.oldestStoryID = this.stories[this.stories.length - 1].id;
      } else {
        this.latestStoryID = null;
        this.oldestStoryID = null;
      }
      this.setElement(args.el);
      this.startTimeout();
    },
    events: {

    },          
    render: function() {
      _.each(this.stories, _.bind(function(storyData) {
        if(storyData.images.length > 0) {
          this.storieViews.push(
            this.appendStory({
              story: storyData
            })
          );
        }
      }, this));
    },
    startTimeout: function() {
      this.pollTimeoutID = setTimeout(
        this.checkForNewStories.bindTo(this), 
        this.pollInterval
      );
    },
    checkForNewStories: function() {
      var onComplete = function(data) {
        var prependStory = this.prependStory;
        _.each(data.stories, function(story) {
          if(story.images.length > 0) {
            prependStory(story);
          }
        });
        if(data.stories.length > 0) {
          this.latestStoryID = data.stories[
            data.stories.length - 1
          ].id;
        }
        this.startTimeout();
      }.bindTo(this);

      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: '/api/stories/since',
        data: { 'since': this.oldestStoryID, 'categories[]': this.feedCategories },
        success: onComplete,
        error: this.startTimeout.bindTo(this)
      });
    },
    loadOlderStories: function () {
      var onComplete = function(data) {
        var appendStory = this.appendStory;
        _.each(data.stories, function() {
          appendStory(story);
        });
        if(data.stories.length > 0) {
          this.oldestStoryID = data.stories[
            data.stories.length - 1
          ].id;
        }
        this.startTimeout();
      }.bindTo(this);

      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: '/api/stories/before',
        data: { 'since': this.oldestStoryID, 'categories': this.feedCategories },
        success: onComplete,
        error: this.startTimeout.bindTo(this)
      });      
    },
    appendStory: function(storyData) {  
      var view = new StoryView(storyData);
      $(this.el).append(view.render().el);
      return view;
    },
    prependStory: function(storyData) {  
      var view = new StoryView(storyData);
      $(this.el).prepend(view.render().el);
      return view;
    }          
  });

  var HomeFeedView      = FeedView.extend({ feedCategories: ['sports', 'politics', 'celebrity'] });
  var SportsFeedView    = FeedView.extend({ feedCategories: ['sports'] });
  var PoliticsFeedView  = FeedView.extend({ feedCategories: ['politics'] });
  var CelebrityFeedView = FeedView.extend({ feedCategories: ['celebrity'] });        

  var StoryView = Backbone.View.extend({
    tagName: 'li',
    tpl: _.template($('#story-template').html()),
    SOURCE_LOGOS: {
      'tmz': 'http://upload.wikimedia.org/wikipedia/commons/5/54/TMZLogo.svg',
      'nyt': 'http://graphics8.nytimes.com/images/misc/nytlogo152x23.gif',
      'bbc': 'https://2.gravatar.com/avatar/e06c65f9e89d28025c47b6046f701c13?d=https%3A%2F%2Fidenticons.github.com%2F1b38f1ee5d9820f661140aeecbae649a.png&s=400',
      'espn': 'http://static-p-a.comcast.net/api/assets/cimed-20120712/espn.png'
    },
    initialize: function(args) {
      this.story = args.story;
    },
    events: {
      'tap .image'  : 'goToLink',
      'tap .title'  : 'goToLink',
      'tap .kik-it' : 'kikIt',
    }, 
    goToLink: function () {
      window.location = this.story.link;
    },
    render: function() {
      var sourceLogo = '';
      if(this.SOURCE_LOGOS[this.story.source]) {
        sourceLogo = this.SOURCE_LOGOS[this.story.source];
      }
      $(this.el).html(this.tpl({
        story: this.story,
        sourceLogo: sourceLogo
      }));

      return this;
    },
    kikIt: function() {

    }
  });

  App.populator('home', function (page) {
    new HomeFeedView({
      el: $(page).find('.feed'),
      initialStories: window.PAGE_PARAMS.homeStories
    }).render();
  });

  App.populator('sports', function (page) {
    new SportsFeedView({
      el: $(page).find('.feed'),
      initialStories: []
    }).render();
  });

  App.populator('politics', function (page) {
    new PoliticsFeedView({
      el: $(page).find('.feed'),
      initialStories: []
    }).render();
  });                

  App.populator('celebrity', function (page) {
    new CelebrityFeedView({
      el: $(page).find('.feed'),
      initialStories: []
    }).render();
  });  

  App.load('home');
});