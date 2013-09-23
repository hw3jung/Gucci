$(document).ready(function() {

  var ua = navigator.userAgent.toLowerCase();
  if(ua.indexOf("android") > -1) {
    $('.app-topbar .kik-it').css('padding-top', '9px');
  }  

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
    POLL_INTERVAL: 10000,
    feedCategories: [],
    loadingOlderStories: false,
    noMoreOlderStories: false,
    loadingLi: $('<li></li>').css('text-align', 'center'),
    initialize: function(args) {
      this.stories       = args.initialStories;
      this.storieViews   = [];
      if(this.stories.length > 0) {
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
    render: function(animateIn) {
      animateIn = false;
      this.stories.shuffle();
      _.each(this.stories, function(storyData, i) {
        if(storyData.images.length > 0) {
          if(animateIn && i == storyData.images.length - 1) {
            //only animate last item
            this.storieViews.push(
              this.prependStory(storyData)
            ); 
          } else {
            this.storieViews.push(
              this.appendStory(storyData)
            );            
          }
        }
      }.bindTo(this));
      return this;
    },
    startTimeout: function() {
      this.pollTimeoutID = setTimeout(
        this.checkForNewStories.bindTo(this), 
        this.POLL_INTERVAL
      );
    },
    checkForNewStories: function(cb) {
      var onComplete = function(data) {
        if(data.stories.length > 0) {
          this.latestStoryID = data.stories[
            data.stories.length - 1
          ].id;
          this.loadingLi.detach();
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
      this.showBottomSpinner();
      this.loadingOlderStories = true;
      var onComplete = function(data) {
        this.loadingLi.detach();
        this.loadingOlderStories = false;
        if(data.stories.length > 0) {
          this.oldestStoryID = data.stories[
            data.stories.length - 1
          ].id;
        } else {
          this.noMoreOlderStories = true;
          this.setNoMoreStoriesView();
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
        this.loadingLi.detach();
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
      this.startTimeout();
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

  var HomeFeedView             = FeedView.extend({ feedCategories: [] });
  var SportsFeedView           = FeedView.extend({ feedCategories: ['sports'] });
  var PoliticsFeedView         = FeedView.extend({ feedCategories: ['politics', 'headline'] });
  var CelebrityFeedView        = FeedView.extend({ feedCategories: ['celebrity', 'life'] });
  var TechFeedView             = FeedView.extend({ feedCategories: ['tech'] });
  var BusinessAndMoneyFeedView = FeedView.extend({ feedCategories: ['business', 'money'] });
  var WorldFeedView            = FeedView.extend({ feedCategories: ['world'] });

  var StoryView = Backbone.View.extend({
    tagName: 'li',
    tpl: _.template($('#story-template').html()),
    SLIDE_SHOW_INTERVAL: 5000,
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
      console.log(this.story.kik_count);
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
      if(this.story.images.length > 1) {
        //this.initImageSlideShow();
      }
      return this;
    },
    kikIt: function() {
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
            data      : this.story
        });
      }
    },
    initImageSlideShow: function() {
      var init = function() {
        var index = 0,
            currentImage = this.$('.image'),
            images = this.story.images;;
        var swapImage = function () {
          if(index == images.length - 1) {
            index = 0;
          } else {
            index += 1;
          }
          $('<img />')
            .attr('src', images[index])
            .css('opacity', '0')
            .addClass('image animated fadeIn')
            .load(function() {
              var me = $(this);
              currentImage.addClass('animated fadeOut');
              setTimeout(function() {
                currentImage.replaceWith(me);
                me.show();
                currentImage = $(me);
              }, 500);
            });
        }.bindTo(this);
        this.slideShowIntervalID = setInterval(swapImage, this.SLIDE_SHOW_INTERVAL);
      }.bindTo(this);
      setTimeout(init, Math.random() * 2500);
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
  };

  App.populator('home', function (page) {
    window.CurrentFeedView = new HomeFeedView({
      el: $(page).find('.feed'),
      initialStories: window.PAGE_PARAMS.homeStories
    }).render();     
    SetPageEventHandlers(page);  
  });

  App.populator('sports', function (page) {
    window.CurrentFeedView = new SportsFeedView({
      el: $(page).find('.feed'),
      initialStories: window.PAGE_PARAMS.sportsStories
    }).render(true);
    SetPageEventHandlers(page);
  });

  App.populator('politics', function (page) {
    window.CurrentFeedView = new PoliticsFeedView({
      el: $(page).find('.feed'),
      initialStories: []
    }).render(true);
    SetPageEventHandlers(page);
  });                

  App.populator('celebrity', function (page) {
    window.CurrentFeedView = new CelebrityFeedView({
      el: $(page).find('.feed'),
      initialStories: window.PAGE_PARAMS.celebrityStories
    }).render(true);
    SetPageEventHandlers(page);
  });

  App.populator('tech', function (page) {
    window.CurrentFeedView = new TechFeedView({
      el: $(page).find('.feed'),
      initialStories: window.PAGE_PARAMS.techStories
    }).render(true);
    SetPageEventHandlers(page);
  });

  App.populator('bm', function (page) {
    window.CurrentFeedView = new BusinessAndMoneyFeedView({
      el: $(page).find('.feed'),
      initialStories: window.PAGE_PARAMS.businessAndMoneyStories
    }).render(true);
    SetPageEventHandlers(page);
  });

  App.populator('world', function (page) {
    window.CurrentFeedView = new WorldFeedView({
      el: $(page).find('.feed'),
      initialStories: []
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