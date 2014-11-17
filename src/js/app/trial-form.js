define([
  'jquery'
  , 'lodash'
  , 'move'
  , 'app/trial-form-validators'
  , 'modernizr'
  , 'xdomain'
  , 'chosen'
  , 'placeholder'
], function($, _, move, validator, Modernizr) {
  var CATCH_ST_URL = 'http://catch.sharetri.be/int_api';

  var create = function() {
    // cache elements
    var el = {};

    // save user input to this object right after validation
    var data = {};

    // Helper function to create submit handler
    var submitHandler = function(clbk) {
      return function(e) {
        clbk(e); // Run the handler

        // Don't submit the form
        e.preventDefault();
        return false;
      };
    };

    var init = function(root) {
      el = {
        root: root,
        animationContainer: root.find('#trial-animation-container'),

        emailSlide: root.find('#trial-email-slide'),
        emailInput: root.find('#trial-email-input'),
        emailForm: root.find('#trial-email-form'),
        emailNotSell: root.find('#trial-email-not-sell'),
        emailInvalid: root.find('#trial-email-invalid'),

        emailAvailabilitySlide: root.find('#trial-email-availability-slide'),

        emailCheckFailedSlide: root.find('#trial-email-check-failed'),

        existingAccountSlide: root.find('#trial-existing-account'),

        localizationSlide: root.find('#trial-localization'),
        localizationCountrySelect: root.find('#trial-localization-country-select'),
        localizationCountryDefault: root.find('#trial-localization-country-default'),
        localizationLanguageSelect: root.find('#trial-localization-language-select'),
        localizationLanguageDefault: root.find('#trial-localization-language-default'),
        localizationForm: root.find('#trial-localization-form'),
        localizationDidntFindLanguage: root.find('#trial-localization-didnt-find-language'),
        localizationCountryInvalid: root.find('#trial-localization-country-invalid'),
        localizationLanguageInvalid: root.find('#trial-localization-language-invalid'),

        nameSlide: root.find('#trial-name-slide'),
        nameFirstInput: root.find('#trial-name-first-input'),
        nameLastInput: root.find('#trial-name-last-input'),
        nameForm: root.find('#trial-name-form'),
        nameFirstInvalid: root.find('#trial-name-first-invalid'),
        nameLastInvalid: root.find('#trial-name-last-invalid'),

        passwordSlide: root.find('#trial-password-slide'),
        passwordForm: root.find('#trial-password-form'),
        passwordInput: root.find('#trial-password-input'),
        passwordConfirmationInput: root.find('#trial-password-confirmation-input'),
        passwordMissing: root.find('#trial-password-missing'),
        passwordConfirmationMissing: root.find('#trial-password-confirmation-missing'),
        passwordTooShort: root.find('#trial-password-too-short'),
        passwordConfirmationMismatch: root.find('#trial-password-confirmation-mismatch'),

        marketplaceSlide: root.find('#trial-marketplace-slide'),
        marketplaceForm: root.find('#trial-marketplace-form'),
        marketplaceTypeSelect: root.find('#trial-marketplace-type-select'),
        marketplaceTypeDefault: root.find('#trial-marketplace-type-default'),
        marketplaceNameInput: root.find('#trial-marketplace-name-input'),
        marketplaceTypeInvalid: root.find('#trial-marketplace-type-invalid'),
        marketplaceNameTooShort: root.find('#trial-marketplace-name-too-short'),

        createdSlide: root.find('#trial-created-slide'),
        createFailedSlide: root.find('#trial-create-failed-slide'),
        createSuccessSlide: root.find('#trial-create-success-slide'),

        gotoButton: root.find('#trial-goto-button')
      };

      if (!el.root.length) { return; } // Trial form is not present

      initEmail();
      initLocalization();
      initName();
      initPassword();
      initMarketplace();
    };

    var initEmail = function() {
      el.emailForm.submit(emailHandler);
    };

    var initLocalization = function() {
      initChosen(el.localizationForm, el.localizationCountrySelect, el.localizationCountryDefault);
      initChosen(el.localizationForm, el.localizationLanguageSelect, el.localizationLanguageDefault);

      el.localizationForm.submit(localizationHandler);
    };

    var initName = function() {
      el.nameForm.submit(nameHandler);
    };

    var initPassword = function() {
      el.passwordForm.submit(passwordHandler);
    };

    var initMarketplace = function() {
      initChosen(el.marketplaceForm, el.marketplaceTypeSelect, el.marketplaceTypeDefault);

      el.marketplaceForm.submit(marketplaceHandler);
    };

    var initChosen = function(form, select, defaultOption) {
      select.chosen({
        inherit_select_classes: true,
        width: '100%',
        disable_search_threshold: 4
      });

      // Chosen is disabled for iOS, Android, etc.
      // We need to add a default option in order to show a placeholder for those browsers
      var chosenActivated = form.find('.chosen-container').length > 0;

      if (!chosenActivated) {
        defaultOption.text(select.data('placeholder'));
      }
    };

    var hide = function(slide, clbk) {
      clbk = clbk || function() {};
      if (!Modernizr.csstransitions) {
        slide.hide('slow', clbk);
      } else {
        move(slide[0])
          .translate(-300)
          .set('opacity', 0.1)
          .end(function() {
            slide.css('display', 'none');
            slide.css('opacity', 1);

            _.defer(clbk);
          });
      }
    };

    var show = function(slide, clbk) {
      clbk = clbk || function() {};
      if (!Modernizr.csstransitions) {
        slide.show('slow', clbk);
      } else {
        var clone = slide.clone();

        el.animationContainer
          .show()
          .empty()
          .append(clone);

        move(clone[0])
          .set('display', 'block')
          .set('opacity', 0.1)
          .x(300)
          .duration(0)
          .end(function() {
            move(clone[0])
              .set('opacity', 1)
              .x(0)
              .end(function() {
                _.defer(function() {
                  slide.show();
                  el.animationContainer.empty().hide();
                  _.defer(clbk);
                });
              });
          });
      }
    };

    var focusFormInSlide = function(elSlide) {
      elSlide.find('form :input:first') // select first input
        .focus()                        // and focus it
        .trigger('chosen:activate');    // trigger event to activate chosen selects
    };

    var showAndFocus = function(elShow, clbk) {
      clbk = clbk || function() {};
      show(elShow, function() {
        focusFormInSlide(elShow);
        clbk();
      });
    };

    var hideAndShow = function(elHide, elShow, clbk) {
      clbk = clbk || function() {};
      hide(elHide, function() {
        showAndFocus(elShow, clbk);
      });
    };

    var checkEmailAvailability = function(email, success, fail) {
       ga('send','pageview','trial-email');
	  var request = $.ajax(
        {
          type: "GET"
          , url: CATCH_ST_URL + '/check_email_availability'
          , data: {email: email}
          , dataType: 'json'
        });

      request.done(function(response) {
        success(response.available);
      });
      request.fail(fail);
    };

    var emailHandler = submitHandler(function(e) {
      // Keep animation and email check state in memory
      var animationDone = false;
      var checkDone = false;
      var checkFailed = false;
      var emailAvailable;
      var email = el.emailInput.val();

      // Handle animation OR check ready.
      // This is a stupid piece of code that should be handled without mutable variables
      // by some library e.g. Bacon
      var animationOrCheckDone = function() {
        if(animationDone) {
          if (checkDone) {
            if (emailAvailable) {
              data.admin_email = email;
              hideAndShow(el.emailAvailabilitySlide, el.localizationSlide);
              ga('send','pageview','trial-localization');
            } else {
              hideAndShow(el.emailAvailabilitySlide, el.existingAccountSlide);
              ga('send','pageview','trial-email-err-already-exists');
            }
          }

          if (checkFailed) {
            hideAndShow(el.emailAvailabilitySlide, el.emailCheckFailedSlide);
          }
        }
      };

      if (validator.validEmail(email)){
        hideAndShow(el.emailSlide, el.emailAvailabilitySlide, function() {
          animationDone = true;
          animationOrCheckDone();
        });
        checkEmailAvailability(email, function(available) {
          checkDone = true;
          emailAvailable = available;
          animationOrCheckDone();
        }, function() {
          checkFailed = true;
          animationOrCheckDone();
        });
      } else {
        el.emailNotSell.hide();
        el.emailInvalid.show();
		ga('send','pageview','trial-email-err-invalid-email');
     }
    });

    var localizationHandler = submitHandler(function(e) {
      var country = el.localizationCountrySelect.val();
      var language = el.localizationLanguageSelect.val();

      if (!validator.validCountry(country)) {
        el.localizationDidntFindLanguage.hide();
        el.localizationLanguageInvalid.hide();
        el.localizationCountryInvalid.show();
		ga('send','pageview','trial-localization-err-missing-country');
      } else if (!validator.validLanguage(language)) {
        el.localizationDidntFindLanguage.hide();
        el.localizationCountryInvalid.hide();
        el.localizationLanguageInvalid.show();
		ga('send','pageview','trial-localization-err-missing-language');
      } else {
        data.marketplace_country = country;
        data.marketplace_language = language;
        hideAndShow(el.localizationSlide, el.nameSlide);
		ga('send','pageview','trial-name');
     }
    });

    var nameHandler = submitHandler(function(e) {
      var first = el.nameFirstInput.val();
      var last = el.nameLastInput.val();

      if (!validator.validFirstName(first)) {
        el.nameFirstInvalid.show();
        el.nameLastInvalid.hide();
		ga('send','pageview','trial-name-err-missing-first-name');
       } else if (!validator.validLastName(last)) {
        el.nameFirstInvalid.hide();
        el.nameLastInvalid.show();
		ga('send','pageview','trial-name-err-missing-last-name');
     } else {
        data.admin_first_name = first;
        data.admin_last_name = last;
        hideAndShow(el.nameSlide, el.passwordSlide);
		ga('send','pageview','trial-password');
     }
    });

    var passwordHandler = submitHandler(function(e) {
      var allMessages = [
        el.passwordMissing,
        el.passwordConfirmationMissing,
        el.passwordTooShort,
        el.passwordConfirmationMismatch
      ];

      var showMessage = function(activeMessage) {
        allMessages.forEach(function(message) {
          if (message === activeMessage) {
            message.show();
          } else {
            message.hide();
          }
        });
      };

      var password = el.passwordInput.val();
      var confirmation = el.passwordConfirmationInput.val();

      if (!password) {
        showMessage(el.passwordMissing);
		ga('send','pageview','trial-password-err-missing-password');
      } else if (!validator.validPassword(password)) {
        showMessage(el.passwordTooShort);
		ga('send','pageview','trial-password-err-too-short');
      } else if (!confirmation) {
        showMessage(el.passwordConfirmationMissing);
		ga('send','pageview','trial-password-err-confirmation-missing');
     } else if (password !== confirmation) {
        showMessage(el.passwordConfirmationMismatch);
		ga('send','pageview','trial-password-confirmation-mismatch');
     } else {
        data.admin_password = password;
        hideAndShow(el.passwordSlide, el.marketplaceSlide);
		ga('send','pageview','trial-marketplace');
     }
    });

    var marketplaceHandler = submitHandler(function(e) {
      var type = el.marketplaceTypeSelect.val();
      var name = el.marketplaceNameInput.val();

      if (!validator.validMarketplaceType(type)) {
        el.marketplaceTypeInvalid.show();
        el.marketplaceNameTooShort.hide();
		ga('send','pageview','trial-marketplace-err-type-missing');
     } else if (!validator.validMarketplaceName(name)) {
        el.marketplaceTypeInvalid.hide();
        el.marketplaceNameTooShort.show();
		ga('send','pageview','trial-marketplace-err-name-too-short');
     } else {
        data.marketplace_type = type;
        data.marketplace_name = name;
        hideAndShow(el.marketplaceSlide, el.createdSlide, function() {
          createMarketplace(data, function(marketplaceUrl) {
            el.gotoButton.attr('href', marketplaceUrl);
            hideAndShow(el.createdSlide, el.createSuccessSlide);
  			ga('send','pageview','trial-creation');
			ga('send','event','trial','creation');
        }, function() {
            hideAndShow(el.createdSlide, el.createFailedSlide);
 			ga('send','pageview','trial-creation-err-fail');
			ga('send','event','trial','creation', 'err-fail');
          });
        });
      }
    });
    var createMarketplace = function(data, success, error) {
      var request = $.ajax({
        type: "POST",
        url: CATCH_ST_URL + '/create_trial_marketplace',
        data: data,
        dataType: 'json'
      });

      request.done(function(response) {
        success(response.marketplace_url);
      });

      request.fail(error);
    };

    return {init: init};
  };

  return {
    init: function(root) {
      create().init(root);
    }
  };
});
