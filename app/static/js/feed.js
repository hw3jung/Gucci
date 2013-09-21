$(document).ready(function() {
  var FeedView = Backbone.View.extend({
    initialize: function(args) {
      this.stories     = args.initialStories;
      this.storieViews = [];
      this.setElement(args.el);
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
    appendStory: function(storyData) {  
      var view = new StoryView(storyData);
      $(this.el).append(view.render().el);
      return view;
    }
  });

  var SportsFeedView   = FeedView.extend({});
  var PoliticsFeedView = FeedView.extend({});        

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
    }
  });

  App.populator('home', function (page) {
    new SportsFeedView({
      el: $(page).find('.feed'),
      initialStories: [{
          images: ['http://graphics8.nytimes.com/images/2013/09/21/sports/21kepner/21kepner-popup.jpg'],
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

  /* initialize function */
  (function() {
    App.load('home');
  })();
});      
