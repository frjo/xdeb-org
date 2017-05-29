/**
 * @file
 * A JavaScript file for lunr search.
 */



(function ($) {

  'use strict';

  var $resultsWrapper = $('.search-results-wrapper');
  var $results = $('.search-results');
  var searchData;
  var lunrIndex;
  var searchStore = [];

  // Init the search when search field get focus, this avoids loading index on every page.
  $('.search-text').one('focus', function () {
    searchData = $.getJSON('/searchindex.json');

    searchData.done(function () {
      buildIndex();
    });
  });

  // Do the search on keyup in the search field.
  $('.search-text').on('keyup', function () {
    $results.empty();

    // Only trigger a search when 2 chars. at least have been provided
    var query = $(this).val();
    if (query.length < 2) {
      $resultsWrapper.hide();
      return;
    }

    var results = lunrIndex.search(query + '*');

    renderResults(results);
  });

  // Clear when clicking the x in HTML5 search fields.
  $('.search-text').one('search', function () {
    $resultsWrapper.hide();
  });

  // Build the search index.
  function buildIndex() {
    lunrIndex = lunr(function () {
      this.ref('uri');
      this.field('title');
      this.field('tags');
      this.field('section');
      this.field('content');
      this.field('year');

      searchData.responseJSON.forEach(function (item) {
        this.add(item);
        searchStore[item.uri] = item.title;
      }, this);
    });
  }

  // Render the search result.
  function renderResults(results) {
    if (results.length > 0) {
      // Only show the x first results
      results.slice(0, 20).forEach(function (result) {
        var $result = $('<li>');
        $result.append($('<a>', {
          href: result.ref,
          text: searchStore[result.ref]
        }));
        $results.append($result);
      });
    }
    else {
      var $result = $('<li>No results found for this search.</li>');
      $results.append($result);
    }

    $resultsWrapper.show();
  }

})(jQuery);