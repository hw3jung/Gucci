$(document).ready(function() {

  // initialize tap event for mobile
  $.event.tap = {
    // Abort tap if touch moves further than 10 pixels in any direction
    distanceThreshold: 10,
    // Abort tap if touch lasts longer than half a second
    timeThreshold: 500,
    setup: function() {
      var self = this,
        $self = $(self);

      // Bind touch start
      $self.on('touchstart', function(startEvent) {
        // Save the target element of the start event
        var target = startEvent.target,
          touchStart = startEvent.originalEvent.touches[0],
          startX = touchStart.pageX,
          startY = touchStart.pageY,
          threshold = $.event.special.tap.distanceThreshold,
          timeout;

        function removeTapHandler() {
          clearTimeout(timeout);
          $self.off('touchmove', moveHandler).off('touchend', tapHandler);
        };

        function tapHandler(endEvent) {
          removeTapHandler();

          // When the touch end event fires, check if the target of the
          // touch end is the same as the target of the start, and if
          // so, fire a click.
          if (target == endEvent.target) {
            $.event.simulate('tap', self, endEvent);
          }
        };

        // Remove tap and move handlers if the touch moves too far
        function moveHandler(moveEvent) {
          var touchMove = moveEvent.originalEvent.touches[0],
            moveX = touchMove.pageX,
            moveY = touchMove.pageY;

          if (Math.abs(moveX - startX) > threshold ||
              Math.abs(moveY - startY) > threshold) {
            removeTapHandler();
          }
        };

        // Remove the tap and move handlers if the timeout expires
        timeout = setTimeout(removeTapHandler,
                                    $.event.special.tap.timeThreshold);

        // When a touch starts, bind a touch end and touch move handler
        $self.on('touchmove', moveHandler).on('touchend', tapHandler);
      });
    }
  };

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
      'tap .image' : 'goToLink',
      'tap .title' : 'goToLink'
    }, 
    goToLink: function () {
      window.location = this.story.link;
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
      el: $(page).find('#feed'),
      initialStories: []
    }).render();
  });                

  App.load('home');
});