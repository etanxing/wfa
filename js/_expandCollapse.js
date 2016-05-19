// ==========================================================================
// EXPAND COLLAPSE
// ==========================================================================

(function(NAMESPACE, $) {

	'use strict';

	NAMESPACE.expandCollapse = (function() {
		var reset,
			init;

		reset = function($container, newIdSuffix) {
			var changeId = (typeof (newIdSuffix) === 'string');

			$container.find('.js-ec').trigger('destroy.ddExpandCollapse');

			if (changeId) {
				$container.find('.js-ec').each(function(i, el) {
					$(el).attr('id', $(el).attr('id') + newIdSuffix);
				});

				$container.find('.js-ec-link').each(function(i, el) {
					var href = $(el).attr('href');
					href = href.substring(href.indexOf('#'));

					$(el).attr('href', href + newIdSuffix);
				});
			}

			init($container);
		};

		init = function(scope) {
			var $ecScope = (scope) ? $('.js-ec', scope) : $('.js-ec');
			$ecScope.ddExpandCollapse();

			// grouped in JS
			var $ecScopeGrouped = (scope) ? $('.js-ec-grouped', scope) : $('.js-ec-grouped');
			$ecScopeGrouped.ddExpandCollapse({
				group: 'group-2'
			});

			// always scroll - even if on screen
			var $ecScopeScroll = (scope) ? $('.js-ec-scroll', scope) : $('.js-ec-scroll');
			$ecScopeScroll.ddExpandCollapse({
				durations: {
					scroll: 1000
				},
				animations: {
					scrollPage: function($container, options, callback) {
						var offset;

						// display the container to get the position
						$container.css({
							display: 'block'
						});

						offset = $container.offset().top + options.scrollOffset;

						// rehide the container
						$container.css({
							display: ''
						});

						// scroll the page
						$('html').velocity('stop').velocity('scroll', {
							offset: offset,
							duration: options.durations.scroll,
							complete: callback
						});
					}
				}
			});
		};

		return {
			reset: reset,
			init: init
		};
	}());

}(DDIGITAL, jQuery));
