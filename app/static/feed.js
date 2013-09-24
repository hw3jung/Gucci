$(document).ready(function() {

  var ua = navigator.userAgent.toLowerCase();
  if(ua.indexOf('android') > -1) {
    $('.app-topbar .kik-it').css('padding-top', '9px');
  }  

  Function.prototype.bindTo = function(obj) {
    return _.bind(this, obj);
  };

  var FeedView = Backbone.View.extend({
    tagName: 'ul',
    stories: [],
    POLL_INTERVAL: 10000,
    feedCategories: [],
    loadingNewStories:   false,
    loadingOlderStories: false,
    noMoreOlderStories:  false,
    timerKilled:         false,
    paginationEndpoint: '/api/stories/before',
    loadingLi: $('<li></li>').css('text-align', 'center')
                             .css('padding-bottom', '40px'),
    initialize: function(args) {
      this.storieViews   = [];
      if(this.stories.length > 0) {
        this.stories.sort(this.sorter);        
        this.latestStoryID = this.stories[0].id;
        this.oldestStoryID = this.stories[this.stories.length - 1].id;
        this.startTimeout();
      } else {
        this.latestStoryID = '000000000000000000000000';
        this.oldestStoryID = '000000000000000000000000';
        this.setNoMoreStoriesView();
        this.checkForNewStories();
      }
      this.setElement(args.el);
    },
    events: {

    },       
    sorter: function (s1, s2) {
      value1     = s1.id;
      value2     = s2.id;
      return value1 > value2 ? -1: value1 < value2 ? 1 : 0;
    },   
    render: function() {
      _.each(this.stories, function(storyData, i) {
        if(storyData.images.length > 0) {
          this.storieViews.push(
            this.appendStory(storyData)
          );            
        }
      }.bindTo(this));
      return this;
    },
    startTimeout: function(override) {
      if(!this.timerKilled || override) {
        this.pollTimeoutID = setTimeout(
          this.checkForNewStories.bindTo(this), 
          this.POLL_INTERVAL
        );
        this.timerKilled = false;
      }
    },
    checkForNewStories: function(cb) {
      if(this.loadingNewStories || this.timerKilled) return;

      this.loadingNewStories = true;
      var onComplete = function(data) {
        if(data.stories.length > 0) {
          this.latestStoryID = data.stories[
            data.stories.length - 1
          ].id;
        };
        _.each(data.stories, function(story) {
          if(story.images.length > 0) {
            this.stories.push(story);
            this.prependStory(story);
          }
          setTimeout(function () {
            this.$('.animated')
                .removeClass('animated bounceInDown');
          }.bindTo(this), 700);
        }.bindTo(this));
        this.loadingLi.detach();
        this.loadingNewStories = false;
        this.startTimeout();
      }.bindTo(this);

      var onError = function() {
        this.loadingLi.detach();
        this.loadingNewStories = false;
        this.startTimeout();
      }.bindTo(this);
      console.log(this.feedCategories);
      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: '/api/stories/since',
        data: { 'since': this.latestStoryID, 'categories': this.feedCategories },
        success: onComplete,
        error: onError
      });
    },
    loadOlderStories: function () {
      if(this.loadingOlderStories || this.noMoreOlderStories) return;
      this.showBottomSpinner();
      this.loadingOlderStories = true;
      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: this.paginationEndpoint,
        data: { 'before': this.oldestStoryID, 'categories': this.feedCategories },
        success: this.didLoadOlderStories.bindTo(this),
        error: this.didNotLoadOlderStories.bindTo(this)
      });      
    },
    didLoadOlderStories: function(data) {
      this.loadingLi.detach();
      if(data.stories.length > 0) {
        this.oldestStoryID = data.stories[
          data.stories.length - 1
        ].id;
      } else {
        this.noMoreOlderStories = true;
        this.setNoMoreStoriesView();
      }
      //data.stories.shuffle();
      _.each(data.stories, function(story) {
        if(story.images.length > 0) {
          this.appendStory(story);
        }
      }.bindTo(this));
      this.loadingOlderStories = false;
    },
    didNotLoadOlderStories: function(argument) {
      this.loadingLi.detach();
      this.loadingOlderStories = false;
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
      console.log('killing timer');
      this.timerKilled = true;
      if(this.pollTimeoutID)
        clearTimeout(this.pollTimeoutID);
    },
    setNoMoreStoriesView: function (argument) {
      if(this.stories.length == 0)
        this.loadingLi.text('Sorry, there are no stories here');
      else
        this.loadingLi.text('Sorry, there are no more stories');
      $(this.el).append(this.loadingLi);
    },      
    showBottomSpinner: function (argument) {
      this.loadingLi.text('Loading More Stories');
      $(this.el).append(this.loadingLi);
    },
    feedDidAppear: function () {
      // feed came back into view
      this.startTimeout(true);
    },
    feedDidDisappear: function () {
      // feed left view
      this.killPollTimeout();
    }
  });

  var StoryPageView = Backbone.View.extend({
    tagName: 'div',
    loadingLi: $('<li></li>').css('text-align', 'center'),
    initialize: function(args) {
      this.story       = args.story;
      this.setElement(args.el);
    },
    events: {
      'click .kik-it': 'kikIt',
    },          
    render: function() {
      this.$('iframe').attr('src', this.story.link);
      this.delegateEvents();
      //this.$('.app-title').text(this.story.title);
      return this;
    },
    feedDidAppear: function () {
      // feed came back into view
    },
    feedDidDisappear: function () {
      // feed left view
    },
    kikIt: function() {
      this.story.kik_count++;
      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: '/api/story/kik',
        data: { 'story_id':  this.story.id }
      });         
      if (cards.kik) {
        var link = '';
        if (this.story.link.href) {
          link = this.story.link.href;
        } else {
          link = this.story.link;
        }

        // send a message
        cards.kik.send({
            title     : this.story.title       ,
            text      : 'Check this out!'      ,
            pic       : this.story.images[0]   , // optional
            big       : true                   , // optional
            noForward : false                  , // optional
            data      : { 'link' : link, 'story_id' : this.story.id } // optional
        });
      }
    }      
  });

  var HomeFeedView             = FeedView.extend({ stories: window.PAGE_PARAMS.homeStories,      feedCategories: [] });
  var SportsFeedView           = FeedView.extend({ stories: window.PAGE_PARAMS.sportsStories,    feedCategories: ['sports'] });
  var CelebrityFeedView        = FeedView.extend({ stories: window.PAGE_PARAMS.celebrityStories, feedCategories: ['celebrity', 'life'] });
  var TechFeedView             = FeedView.extend({ stories: window.PAGE_PARAMS.techStories,      feedCategories: ['tech'] });
  var BusinessAndMoneyFeedView = FeedView.extend({ stories: window.PAGE_PARAMS.businessAndMoneyStories, feedCategories: ['business', 'money'] });
  var WorldFeedView            = FeedView.extend({ stories: window.PAGE_PARAMS.worldStories,     feedCategories: ['world'] });
  var MostKikedFeedView = FeedView.extend({ 
    stories: window.PAGE_PARAMS.mostKikedStories, 
    timerKilled: true, 
    paginationEndpoint: '/api/stories/most-kiked',
    sorter: function (s1, s2) {
      value1 = s1.kik_count;
      value2 = s2.kik_count;
      return value1 > value2 ? -1: value1 < value2 ? 1 : 0;
    },       
    loadOlderStories: function () {
      if(this.loadingOlderStories || this.noMoreOlderStories) return;
      this.showBottomSpinner();
      this.loadingOlderStories = true;
      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: this.paginationEndpoint,
        data: { 'offset': this.stories.length },
        success: this.didLoadOlderStories.bindTo(this),
        error: this.didNotLoadOlderStories.bindTo(this)
      });      
    },
    feedDidAppear: function () {}        
  });

  var StoryView = Backbone.View.extend({
    tagName: 'li',
    tpl: _.template($('#story-template').html()),
    SLIDE_SHOW_INTERVAL: 20000,
    SOURCE_LOGOS: {
      'tmz' : 'http://upload.wikimedia.org/wikipedia/commons/5/54/TMZLogo.svg',
      'nyt' : 'http://upload.wikimedia.org/wikipedia/commons/7/77/The_New_York_Times_logo.png',
      'bbc' : 'https://2.gravatar.com/avatar/e06c65f9e89d28025c47b6046f701c13?d=https%3A%2F%2Fidenticons.github.com%2F1b38f1ee5d9820f661140aeecbae649a.png&s=400',
      'espn': 'http://images3.wikia.nocookie.net/__cb20090419231813/disney/images/8/8f/ESPN_wordmark.png',
      'usa' : 'http://citizensclimatelobby.org/wp-content/uploads/2013/08/USAToday-Logo-trans.gif',
      'guardian' : 'http://www.userlogos.org/files/logos/Mafia_Penguin/guardian.png'
    },
    initialize: function(args) {
      this.story               = args.story;
      this.slideShowIntervalID = null;
      this.isPrepended         = args.isPrepended;
    },
    events: {
      'click .image'  : 'goToLink',
      'click .title'  : 'goToLink',
      'click .kik-it' : 'kikIt',
    }, 
    goToLink: function () {
      App.load('story', this.story);
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
      this.story.kik_count++;
      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: '/api/story/kik',
        data: { 'story_id':  this.story.id }
      });      
      if(this.story.kik_count == 0) {
        var html = '<div class="kik-count left"><span>1</span> Kik</div>';
        this.$('.kik-stats').prepend(html);
      } else {
        this.$('.kik-count span').text(this.story.kik_count);
      }
      if (cards.kik) {
        var link = '';
        if (this.story.link.href) {
          link = this.story.link.href;
        } else {
          link = this.story.link;
        }

        // send a message
        cards.kik.send({
            title     : this.story.title       ,
            text      : 'Check this out!'      ,
            pic       : this.story.images[0]   , // optional
            big       : true                   , // optional
            noForward : false                  , // optional
            data      : this.story
        });
      }
    }
  });


  var SetPageEventHandlers = function (page) {
    $(page).find('.app-title, .menu-toggle-btn').on('touchstart', function() {
      var el = $(page).find('.dropdown-container');
      if(el.is(':visible')) {
        el.hide();  
      } else {
        el.show();
      }
    });

    $(page).on('appShow', (function (view) {
        return function() {
          $(page).find('.dropdown-container').hide();  
          view.feedDidAppear();
        }
    })(window.CurrentFeedView)); 

    $(page).on('appHide', (function (view) {
        return function() {
          view.feedDidDisappear();
        }
    })(window.CurrentFeedView)); 

    $(page).find('.page-link').on('touchstart', function() {
      App.load($(this).data('page'));
    });

    var appContent = $(page).find('.app-content');
    appContent.scroll(function() {
      if($(page).find('.feed').height() - 100 <= $(appContent).scrollTop() + $(appContent).height()) {
        if(window.CurrentFeedView) {
          window.CurrentFeedView.loadOlderStories();
        }
      }
    });  
  };

  App.populator('home', function (page) {
    window.CurrentFeedView = new HomeFeedView({
      el: $(page).find('.feed'),
    }).render();     
    SetPageEventHandlers(page);  
  });

  App.populator('sports', function (page) {
    window.CurrentFeedView = new SportsFeedView({
      el: $(page).find('.feed'),
    }).render(true);
    SetPageEventHandlers(page);
  });         

  App.populator('celebrity', function (page) {
    window.CurrentFeedView = new CelebrityFeedView({
      el: $(page).find('.feed'),
    }).render(true);
    SetPageEventHandlers(page);
  });

  App.populator('tech', function (page) {
    window.CurrentFeedView = new TechFeedView({
      el: $(page).find('.feed'),
    }).render(true);
    SetPageEventHandlers(page);
  });

  App.populator('bm', function (page) {
    window.CurrentFeedView = new BusinessAndMoneyFeedView({
      el: $(page).find('.feed'),
    }).render(true);
    SetPageEventHandlers(page);
  });

  App.populator('world', function (page) {
    window.CurrentFeedView = new WorldFeedView({
      el: $(page).find('.feed')
    }).render(true);
    SetPageEventHandlers(page);
  });

  App.populator('mostkiked', function (page) {
    window.CurrentFeedView = new MostKikedFeedView({
      el: $(page).find('.feed')
    }).render(true);
    SetPageEventHandlers(page);
  });

  App.populator('story', function (page, args) {
    new StoryPageView({
      el: page,
      story: args
    }).render();
    SetPageEventHandlers(page);
  });

  App.load('home');

  // receive a message
  if (cards.kik && cards.kik.message) {
      App.load('story', cards.kik.message);
  }
});