$(document).ready(function() {
  var FeedView = Backbone.View.extend({
    pollInterval: 30000,
    feedCategories: [],
    initialize: function(args) {
      this.stories     = args.initialStories;
      this.storieViews = [];
      this.latestStoryID = null;
      this.setElement(args.el);
      this.startTimeout();
    },
    events: {

    },          
    render: function() {
      _.each(this.stories, _.bind(function(storyData) {
        this.storieViews.push(
          this.appendStory({
            story: storyData
          })
        );
      }, this));
    },
    startTimeout: function() {
      this.pollTimeoutID = setTimeout(
        this.checkForNewStories, 
        this.pollInterval
      );
    },
    checkForNewStories: function() {
      var onComplete = function(data) {
        var prependStory = this.prependStory;
        _.each(data.stories, function() {
          prependStory(story);
        });
        if(data.stories.length > 0) {
          this.latestStoryID = data.stories[data.stories.length - 1].id;
        }
        this.startTimeout
      }

      var onFailure = function() {
        this.startTimeout();
      }

      $.ajax({
        dataType: 'json',
        url: '/api/latest',
        data: { since: this.latestStoryID, feed: this.feedType },
        success: _.bind(onComplete, this),
        error: _.bind(this.startTimeout, this)
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

  var HomeFeedView     = FeedView.extend({ feedCategories: ['sports', 'politics'] });
  var SportsFeedView   = FeedView.extend({ feedCategories: ['sports'] });
  var PoliticsFeedView = FeedView.extend({ feedCategories: ['politics'] });        

  var StoryView = Backbone.View.extend({
    tpl: _.template($('#story-template').html()),
    initialize: function(args) {
      this.story = args.story;
    },
    events: {

    }, 
    render: function() {
      $(this.el).html(this.tpl(this.story));
      return this;
    },
    postKikIt: function() {

    }
  });

  App.populator('home', function (page) {
    new HomeFeedView({
      el: $(page).find('.feed'),
      initialStories: [{
          images: ['http://1.bp.blogspot.com/-EzRKNTvRy0c/UceFSqUCGQI/AAAAAAAAGVc/5yD-qiGwWVk/s1600/Graz,+Austria.+Ermahgerd.jpg'],
          title: 'Yankees’ Pettitte Is Set to Announce His Retirement',
          kik_count: 20
        }, {
          images: ['http://media-cache-ak0.pinimg.com/736x/9a/c1/12/9ac112dc760449a9546f90a0339878d8.jpg'],
          title: 'Yankees’ Pettitte Is Set to Announce His Retirement',
          kik_count: 20
        }]
    }).render();
  });

  App.populator('sports', function (page) {
    new SportsFeedView({
      el: $(page).find('.feed'),
      initialStories: [{
          images: ['http://graphics8.nytimes.com/images/2013/09/21/sports/21kepner/21kepner-popup.jpg'],
          title: 'Yankees’ Pettitte Is Set to Announce His Retirement',
          kik_count: 20
        }]
    }).render();
  });

  App.populator('politics', function (page) {
    new PoliticsFeedView({
      el: $(page).find('#feed'),
      initialStories: [{
          images: ['http://graphics8.nytimes.com/images/2013/09/21/sports/21kepner/21kepner-popup.jpg'],
          title: 'Yankees’ Pettitte Is Set to Announce His Retirement',
          kik_count: 20
        }]
    }).render();
  });                

  App.load('home');
});