/**
 * @file
 * A JavaScript file for the theme.
 */

(function ($) {

  'use strict';

  // Add a js class to the html-tag when JavsScript is active.
  $('html').addClass('js');

  // Activate the mobil menu for small screens.
  if (window.matchMedia) {
    var mq = window.matchMedia('(max-width: 666px)');
    if (mq.matches) {
      // Show mobile menu.
      $('.mobile-nav-wrapper').removeClass('hidden');

      // Populate the mobile nav sheet.
      $('.main-menu').addClass('hidden').clone().removeClass('main-menu layout__navigation layout__full hidden hidden').addClass('js-main-menu').appendTo('.mobile-nav-sheet').find('.navbar').removeClass('navbar').addClass('js-navbar');
      $('.header__region').addClass('hidden').clone().removeClass('header__region region hidden').addClass('js-region').appendTo('.mobile-nav-sheet');

      // Toggle the mobile nav sheet.
      $('.mobile-nav-cover, .mobile-nav-toggle').on('click toushstart', function (e) {
        e.preventDefault();
        $('.mobile-nav-wrapper').toggleClass('js-nav-open');
      });

    }
  }

  // Display CSS grid layout warning to old browsers.
  if (!window.CSS || !window.CSS.supports || !window.CSS.supports('display', 'grid')) {
    $('.header').after('<div class="layout__grid-notice" role="complementary">Your browsers does not support modern grid layout so this page will not look or behave as it should. Resent versions of Chrome, Firefox and Safari all works so please update. Support is coming in Microsoft Edge as well, until then use another browser. <a href="https://www.whatbrowser.org/">What Browser?</a></div>');
  }

})(jQuery);
