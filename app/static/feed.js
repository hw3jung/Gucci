$(document).ready(function() {
  Function.prototype.bindTo = function(obj) {
    return _.bind(this, obj);
  };

  Array.prototype.shuffle = function () {
    var array = this;
    var currentIndex = array.length,
        temporaryValue,
        randomIndex;
       
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
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
    pollInterval: 5000,
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
      this.stories.shuffle();
      _.each(this.stories, function(storyData) {
        if(storyData.images.length > 0) {
          this.storieViews.push(
            this.appendStory(storyData)
          );
        }
      }.bindTo(this));
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
        if(data.stories.length > 0) {
          this.latestStoryID = data.stories[
            data.stories.length - 1
          ].id;
        };
        data.stories.shuffle();
        _.each(data.stories, function(story) {
          if(story.images.length > 0) {
            this.prependStory(story);
          }
        }.bindTo(this));
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
        if(data.stories.length > 0) {
          this.oldestStoryID = data.stories[
            data.stories.length - 1
          ].id;
        } else {
          this.noMoreOlderStories = true;
        }        
        data.stories.shuffle();
        _.each(data.stories, function(story) {
          if(story.images.length > 0) {
            this.appendStory(story);
          }          
        }.bindTo(this));
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
      var view  = new StoryView({ 
                    story: storyData, 
                    isPrepended: true 
                  });
      $(this.el).prepend(view.render().el);
      $(view.el).show();
      return view;
    },
    killPollTimeout: function () {
      clearTimeout(this.pollTimeoutID);
    }         
  });

  var HomeFeedView      = FeedView.extend({ feedCategories: [] });
  var SportsFeedView    = FeedView.extend({ feedCategories: ['sports'] });
  var PoliticsFeedView  = FeedView.extend({ feedCategories: ['politics'] });
  var CelebrityFeedView = FeedView.extend({ feedCategories: ['celebrity'] });

  var StoryView = Backbone.View.extend({
    tagName: 'li',
    tpl: _.template($('#story-template').html()),
    SOURCE_LOGOS: {
      'tmz' : 'http://upload.wikimedia.org/wikipedia/commons/5/54/TMZLogo.svg',
      'nyt' : 'http://upload.wikimedia.org/wikipedia/commons/7/77/The_New_York_Times_logo.png',
      'bbc' : 'https://2.gravatar.com/avatar/e06c65f9e89d28025c47b6046f701c13?d=https%3A%2F%2Fidenticons.github.com%2F1b38f1ee5d9820f661140aeecbae649a.png&s=400',
      'espn': 'http://images3.wikia.nocookie.net/__cb20090419231813/disney/images/8/8f/ESPN_wordmark.png'
    },
    initialize: function(args) {
      this.story              = args.story;
      this.slideShowTimeoutID = null;
      this.isPrepended        = args.isPrepended;
    },
    events: {
      'click .image'  : 'goToLink',
      'click .title'  : 'goToLink',
      'click .kik-it' : 'kikIt',
    }, 
    goToLink: function () {
      if (this.story.link.href) {
        cards.open(this.story.link.href); 
      } else {
        cards.open(this.story.link);
      }
    },
    render: function() {
      if(this.isPrepended) {
        $(this.el).css('display', 'none')
                  .addClass('animated bounceInDown');
      }
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
      if (cards.kik) {
        var link = "";
        if (this.story.link.href) {
          link = this.story.link.href;
        } else {
          link = this.story.link;
        }

        // send a message
        cards.kik.send({
            title     : this.story.title       ,
            text      : 'Hey, here is an interesting article',
            pic       : this.story.images[0]   , // optional
            big       : true                   , // optional
            noForward : false                  , // optional
            data      : { 'link' : link, 'story_id' : this.story.id } // optional
        });
      }
    },
    initImageSlideShow: function() {
      var swapImage = function () {
        
      }.bindTo(this);
      this.slideShowTimeoutID = setTimeout(func, delay)
    },
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

  // receive a message
  if (cards.kik && cards.kik.message) {
      // your card was launched from a message
      // cards.kik.message is exactly what was provided in kik.send
      // redirect user to news link

      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: '/api/story/kik',
        data: { 'story_id':  cards.kik.message.story_id }
      });

      cards.open(cards.kik.message.link);
  }
});