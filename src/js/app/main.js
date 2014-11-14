define(
  [ "jquery"
  , "smoothScroll"
  , "odometer"
  , "app/trial-form"
  , "app/scrollspy"
  , "fancybox"
  , "sticky"
  , "fastclick"
  , "googleAnalytics"
  ]
  , function ($, SmoothScroll, Odometer, trialForm, scrollSpy, fancybox, sticky, FastClick) {
    var app = {
      init: function() {
        new FastClick(document.body);
        $('input, textarea').placeholder();

        //initialize sticky nav bar
        $('#main-navigation').fixedsticky();
        var sidenav = $('#side-navigation');
        sidenav.fixedsticky();

        //Initialize smooth-scroll plugin
        SmoothScroll.init({
          speed: 300,
          offset: 105,
          callbackBefore: function(toggle, anchor) {
            scrollSpy.stop();
            scrollSpy.select(anchor);
          },
          callbackAfter: function(toggle, anchor) {
            setTimeout(scrollSpy.restart, 0);
          }
        });

        this.initializeOdometers();

        // Initialize lightbox
        var clone = $('#trial').clone();

        clone
          .attr('id', 'trial-lightbox')
          .removeClass('trial-inline')
          .addClass('trial-lightbox')
          .appendTo($('body'));

        // Initialize index page trial form
        trialForm.init($('#trial'));
        trialForm.init(clone);

        scrollSpy.init($('#side-navigation a'));

        if (window.console && window.console.log) {
          window.console.log('Hi there! Interested in code?\n\nSharetribe is an open-source marketplace platform. See our Github profile https://github.com/sharetribe/ for more information about the open-source project.');
        }

        $("#sharetribe-video")
          .fancybox({
            width       : '100%',
            height      : '100%',
            type        : 'iframe',
            scrolling   : 'no',
            preload     : 'true',

            // This prevents jumping when the lightbox is closed
            helpers: {
              overlay: {
                locked: false
              }
            }
          });

        $(".get-started")
          .fancybox({
            type: 'inline',
            autoSize: false,
            width: 1000,

            // This prevents jumping when the lightbox is closed
            helpers: {
              overlay: {
                locked: false
              }
            }
          });
        }

      , initializeOdometers: function() {
        //TODO magic numbers
        this.initializeOdometer($('.starter.price-container'), 39, 49);
        this.initializeOdometer($('.pro.price-container'), 19, 49);
        this.initializeOdometer($('.growth.price-container'), 59, 99);
        this.initializeOdometer($('.scale.price-container'), 39, 99);
      }

      , initializeOdometer: function($priceContainer, reducedPrice, monthlyPrice) {
        var $pricingTable = $priceContainer.parents('.pricing-table');
        var $deal = $pricingTable.find('.odometer');

        if($deal.length > 0) {

          var odometer = new Odometer(
            { el: $deal[0]
            , value: reducedPrice
            }
          );

          $pricingTable.find('.switch-price').on('click', function(e) {
            var switchPrice = $(e.currentTarget);

            var currentPrice = $deal.text().replace(/\s/g, "");
            if(currentPrice == reducedPrice) {
              $deal.text(monthlyPrice);
              switchPrice
                .removeClass('switch-monthly')
                .addClass('switch-biannually')
                .text('› Switch to semiannual billing and save up to 20%');

              $pricingTable.find('.billing-cycle').text('Billed monthly');

            } else {
              $deal.text(reducedPrice);
              switchPrice
                .removeClass('switch-biannually')
                .addClass('switch-monthly')
                .text('› Switch to monthly billing');

              $pricingTable.find('.billing-cycle').text('Billed every 6 months');
            }
          });
        }
      }
    }
    app.init();
    return app;
});
