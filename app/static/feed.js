$(document).ready(function() {

  var FeedView = Backbone.View.extend({
    pollInterval: 30000,
    feedCategories: [],
    initialize: function(args) {
      this.stories     = args.initialStories;
      this.storieViews = [];
      this.latestStoryID = null;
      this.oldestStoryID = null;
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
          this.latestStoryID = data.stories[
            data.stories.length - 1
          ].id;
        }
        this.startTimeout
      }

      $.ajax({
        dataType: 'json',
        url: '/api/stories/since',
        data: { since: this.latestStoryID, categories: this.feedCategories },
        success: _.bind(onComplete, this),
        error: _.bind(this.startTimeout, this)
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
      }

      $.ajax({
        dataType: 'json',
        url: '/api/stories/before',
        data: { since: this.oldestStoryID, categories: this.feedCategories },
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

  var HomeFeedView      = FeedView.extend({ feedCategories: ['sports', 'politics', 'celebrity'] });
  var SportsFeedView    = FeedView.extend({ feedCategories: ['sports'] });
  var PoliticsFeedView  = FeedView.extend({ feedCategories: ['politics'] });
  var CelebrityFeedView = FeedView.extend({ feedCategories: ['celebrity'] });        

  var StoryView = Backbone.View.extend({
    tpl: _.template($('#story-template').html()),
    SOURCE_LOGOS: {
      'tmz': 'http://upload.wikimedia.org/wikipedia/commons/5/54/TMZLogo.svg',
      'nyt': 'http://graphics8.nytimes.com/images/misc/nytlogo152x23.gif',
      'bbc': 'https://2.gravatar.com/avatar/e06c65f9e89d28025c47b6046f701c13?d=https%3A%2F%2Fidenticons.github.com%2F1b38f1ee5d9820f661140aeecbae649a.png&s=400'
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
      $(this.el).html(this.tpl(this.story));
      return this;
    },
    kikIt: function() {

    }
  });

  App.populator('home', function (page) {
    new HomeFeedView({
      el: $(page).find('.feed'),
      initialStories: [{
          images: ['http://1.bp.blogspot.com/-EzRKNTvRy0c/UceFSqUCGQI/AAAAAAAAGVc/5yD-qiGwWVk/s1600/Graz,+Austria.+Ermahgerd.jpg'],
          title: 'Yankees’ Pettitte Is Set to Announce His Retirement',
          kik_count: 20,
          source: 'New York Times',
          link: 'http://www.nytimes.com/2013/09/22/nyregion/green-cabs-appear-as-bloomberg-prepares-to-depart.html?hp'
        }, {
          images: ['http://graphics8.nytimes.com/images/2013/09/21/us/CALIFORNIA/CALIFORNIA-popup.jpg'],
          title: 'California Gives Expanded Rights to Noncitizens',
          kik_count: 8,
          source: 'New York Times',
          link: 'http://www.nytimes.com/2013/09/22/nyregion/green-cabs-appear-as-bloomberg-prepares-to-depart.html?hp'
        },
        {
          images: ['http://graphics8.nytimes.com/images/2013/09/22/nyregion/22BIGCITY1_SPAN/22BIGCITY1-articleLarge.jpg'],
          title: 'Green Cabs Appear as Bloomberg Prepares to Depart',
          kik_count: 50,
          source: 'New York Times',
          link: 'http://www.nytimes.com/2013/09/22/nyregion/green-cabs-appear-as-bloomberg-prepares-to-depart.html?hp'
        },
        {
          images: ['http://graphics8.nytimes.com/images/2013/09/20/business/19bits-ios7/19bits-ios7-tmagArticle.jpg'],
          title: 'Despite Early Criticism, Apple’s iOS 7 Quickly Gains Traction',
          kik_count: 100,
          source: 'New York Times',
          link: 'http://www.nytimes.com/2013/09/22/nyregion/green-cabs-appear-as-bloomberg-prepares-to-depart.html?hp'
        }        ]
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
  $('.app-content').pull_to_refresh({

  });
});