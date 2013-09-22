$(document).ready(function() {
  Function.prototype.bindTo = function(obj) {
    return _.bind(this, obj);
  };
  $(window).scroll(function() {  
    if($(window).scrollTop() == $(document).height() - $(window).height()) { 
      if(window.CurrentFeedView) {
        window.CurrentFeedView.loadOlderStories();
      } 
    }  
  });  

  var FeedView = Backbone.View.extend({
    tagName: 'ul',
    pollInterval: 20000,
    feedCategories: [],
    loadingOlderStories: false,
    noMoreOlderStories: false,
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
            this.appendStory(storyData)
          );
        }
      }, this));
      return this;
    },
    startTimeout: function() {
      this.pollTimeoutID = setTimeout(
        this.checkForNewStories.bindTo(this), 
        this.pollInterval
      );
    },
    checkForNewStories: function() {
      var onComplete = function(data) {
        _.each(data.stories, function(story) {
          if(story.images.length > 0) {
            this.prependStory(story);
          }
        }.bindTo(this));
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
        data: { 'since': this.latestStoryID, 'categories[]': this.feedCategories },
        success: onComplete,
        error: this.startTimeout.bindTo(this)
      });
    },
    loadOlderStories: function () {
      if(this.loadingOlderStories || this.noMoreOlderStories) return;
      
      this.loadingOlderStories = true;
      var onComplete = function(data) {
        this.loadingOlderStories = false;
        _.each(data.stories, function(story) {
          if(story.images.length > 0) {
            this.appendStory(story);
          }          
        }.bindTo(this));
        if(data.stories.length > 0) {
          this.oldestStoryID = data.stories[
            data.stories.length - 1
          ].id;
        } else {
          this.noMoreOlderStories = true;
        }
        this.startTimeout();
      }.bindTo(this);

      var onError = function () {
        this.loadingOlderStories = false;
        this.startTimeout();
      }.bindTo(this);

      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: '/api/stories/before',
        data: { 'before': this.oldestStoryID, 'categories': this.feedCategories },
        success: onComplete,
        error: onError
      });      
    },
    appendStory: function(storyData) {  
      var view = new StoryView({ story: storyData });
      $(this.el).append(view.render().el);
      return view;
    },
    prependStory: function(storyData) {  
      var view = new StoryView({ story: storyData });
      $(this.el).prepend(view.render().el);
      return view;
    },
    killPollTimeout: function () {
      clearTimeout(this.pollTimeoutID);
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
      'click .image'  : 'goToLink',
      'click .title'  : 'goToLink',
      'click .kik-it' : 'kikIt',
    }, 
    goToLink: function () {
      window.location.href = this.story.link;
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
    window.CurrentFeedView = new HomeFeedView({
      el: $(page).find('.feed'),
      initialStories: window.PAGE_PARAMS.homeStories
    }).render();
  });

  App.populator('sports', function (page) {
    window.CurrentFeedView = new SportsFeedView({
      el: $(page).find('.feed'),
      initialStories: []
    }).render();
  });

  App.populator('politics', function (page) {
    window.CurrentFeedView = new PoliticsFeedView({
      el: $(page).find('.feed'),
      initialStories: []
    }).render();
  });                

  App.populator('celebrity', function (page) {
    window.CurrentFeedView = new CelebrityFeedView({
      el: $(page).find('.feed'),
      initialStories: []
    }).render();
  });  

  App.load('home');
});