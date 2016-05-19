/* =============================================================================
   DD EXPAND/COLLAPSE - A jQuery plugin to dynamically hide and show content
   ========================================================================== */

/* http://fed.donlineclients.com/demo/modules/plugins/expandcollapse.html */
;(function($, window, document, undefined) {

	'use strict';

	var	_groups = {},
		_addContainerToGroup,
		_updateOptionsFromDOM,
		_init;

	/**
	 * Adds an expand/collapse container to an array of other containers
	 * that container the same group id. Used by $.ddExpandCollapse
	 *
	 * @memberof $.ddExpandCollapse
	 * @param {Object} $container The jQuery element to group
	 * @param {String} group The unique id for the group
	 * @private
	 * */
	_addContainerToGroup = function($container, group) {
		if (!group) {
			// isn't in a group - can either be undefined or false
			return;
		}

		// if the group doesn't already exist create one
		if (!_groups.hasOwnProperty(group)) {
			_groups[group] = [];
		}

		// add the container to the required group
		_groups[group].push($container);
	};

	/**
	 * Look at the container to see if there are any DOM attributes that
	 * can override base options
	 *
	 * @memberof $.ddExpandCollapse
	 * @param {Object} $container The jQuery element to group
	 * @param {Object} options The options passed to the plugin
	 * @private
	 * */
	_updateOptionsFromDOM = function($container, options) {
		var updatedOptions = $.extend(true, {}, options);

		updatedOptions.group = $container.attr(options.attrs.group) || options.group;
		updatedOptions.scroll = $container.attr(options.attrs.scroll) || options.scroll;
		updatedOptions.at = $container.attr(options.attrs.at) || options.at;

		return updatedOptions;
	};

	/**
	 * The initaliser for the module
	 *
	 * @memberof $.ddExpandCollapse
	 * @param {Object} $container The jQuery element to group
	 * @param {Object} options The options passed to the plugin
	 * @private
	 * */
	_init = function(container, options) {
		var $container = $(container),
			id = $container.attr('id'),
			$links = $('.' + options.classes.links + '[href="#' + id + '"]'),
			_isExpanded = $container.hasClass(options.classes.isExpanded),
			_isDisabled = false,
			_isAnimating = false,
			_aria,
			_updateLinks,
			_onExpand,
			_onCollapse,
			_onToggle,
			_onAttach,
			_onDetach,
			_onDestroy;

		// don't run more than once
		if (typeof ($container.data('ddExpandCollapse-isInit')) === 'boolean' && $container.data('ddExpandCollapse-isInit') === true) {
			return;
		}

		// update the ec item options based on the DOM
		options = _updateOptionsFromDOM($container, options);

		// add the ec item to a group if required
		if (options.group) {
			_addContainerToGroup($container, options.group);
		}

		// aria actions
		_aria = {
			// add the aria attributes when needed
			add: function() {
				$container.attr({
					role: 'region',
					tabindex: '-1'
				});

				$links.attr({
					'aria-controls': id,
					'aria-expanded': _isExpanded
				});
			},
			// remove the aria attributes when not needed
			remove: function() {
				$container.removeAttr('role')
					.removeAttr('tabindex');

				$links.removeAttr('aria-controls')
					.removeAttr('aria-expanded');
			},
			// update the status of the aria-expanded attribute
			update: function() {
				if (!_isDisabled) {
					$links.attr('aria-expanded', _isExpanded);
				}
			}
		};

		// add the aria tags by default
		_aria.add();

		// link actions - applies to all links tied to the container
		_updateLinks = {
			// on init of the links apply the appropriate function and set to expanded if needed
			init: function() {
				options.initLinks($links, options);

				if (_isExpanded) {
					_updateLinks.toExpand();
				}
			},
			// set the link to show the expanded state
			toExpand: function() {
				$links.addClass(options.classes.isExpanded);
				$links.find('.' + options.classes.linkState).text(options.labels.expanded);
				_aria.update();
			},
			// set the link to show the collapsed state
			toCollapse: function() {
				$links.removeClass(options.classes.isExpanded);
				$links.find('.' + options.classes.linkState).text(options.labels.collapsed);
				_aria.update();
			}
		};

		// update the links on init
		_updateLinks.init();

		// check if it should be closed by default
		if (!_isExpanded && options.isAnimated) {
			options.animations.collapseOnInit($container);
		}

		// on expand
		_onExpand = function(event) {
			if (event && event.stopPropagation) {
				event.stopPropagation();
			}

			var expand;

			expand = function(callback) {
				// after expand has completed
				var afterExpand = function() {
					$container.addClass(options.classes.isExpanded);

					if (!_isDisabled) {
						$container.trigger('expanded.ddExpandCollapse');

						if (options.scroll) {
							options.animations.scrollPage($container, options);
						}
					}

					_isAnimating = false;

					if (typeof callback === 'function') {
						callback();
					}
				};

				if (_isDisabled) {
					_isExpanded = true;

					_updateLinks.toExpand();

					afterExpand();

					return;
				}

				if (!_isExpanded) {
					_isExpanded = true;

					_updateLinks.toExpand();

					if (!options.isAnimated) {
						afterExpand();
						return;
					}

					options.animations.expand($container, options, afterExpand);
				}
			};

			// check if there is a group applied
			if (options.group !== false) {
				// check if the group exists, and if there is more than one item in the group
				if (_groups.hasOwnProperty(options.group) && _groups[options.group].length > 1) {
					var groupContainers = _groups[options.group];

					// check all the containers in the group
					for (var i = 0, len = groupContainers.length; i < len; i += 1) {
						var $otherContainer = groupContainers[i];

						// if there is another item in the group that is on the page, and is currently expanded
						if ($otherContainer.length > 0 && $otherContainer.hasClass(options.classes.isExpanded)) {
							// close the container, and on callback it will open the new container
							$otherContainer.trigger('collapse.ddExpandCollapse');
						}
					}
				}
			}

			expand();
		};

		// on collapse
		_onCollapse = function(event, callback) {
			if (event && event.stopPropagation) {
				event.stopPropagation();
			}

			// after collapse has completed
			var afterCollapse = function() {
				$container.removeClass(options.classes.isExpanded);

				if (!_isDisabled) {
					$container.trigger('collapsed.ddExpandCollapse');
				}

				_isAnimating = false;

				if (typeof callback === 'function') {
					callback();
				}
			};

			if (_isDisabled) {
				_isExpanded = false;

				_updateLinks.toCollapse();

				afterCollapse();

				return;
			}

			if (_isExpanded) {
				_isExpanded = false;

				_updateLinks.toCollapse();

				if (!options.isAnimated) {
					afterCollapse();
					return;
				}

				options.animations.collapse($container, options, afterCollapse);
			}
		};

		// on toggle of the container
		_onToggle = function(event) {
			event.preventDefault();

			if (_isDisabled || _isAnimating) {
				return;
			}

			_isAnimating = true;

			if (_isExpanded) {
				$container.trigger('collapse.ddExpandCollapse');
			} else {
				$container.trigger('expand.ddExpandCollapse');
			}
		};

		_onAttach = function() {
			_isDisabled = false;

			if (!_isExpanded) {
				options.animations.collapseOnInit($container);
			}

			$container.removeClass(options.classes.isDisabled);
			$links.removeClass(options.classes.isDisabled);

			_aria.add();
		};

		_onDetach = function() {
			_isDisabled = true;

			options.animations.reset($container);

			$container.addClass(options.classes.isDisabled);
			$links.addClass(options.classes.isDisabled);

			_aria.remove();
		};

		_onDestroy = function() {
			_isDisabled = true;

			options.animations.reset($container);

			$container.off('.ddExpandCollapse');
			$links.off('.ddExpandCollapse');

			$links.find('.' + options.classes.linkState).remove();

			_aria.remove();
		};

		// unbind events to prevent multiple binds, then bind events
		$container.off('.ddExpandCollapse')
			.on('expand.ddExpandCollapse', _onExpand)
			.on('collapse.ddExpandCollapse', _onCollapse)
			.on('toggle.ddExpandCollapse', _onToggle)
			.on('destroy.ddExpandCollapse', _onDestroy);

		// unbind then bind click event to the links
		$links.off('.ddExpandCollapse').on('click.ddExpandCollapse', _onToggle);

		if (typeof (options.at) === 'string') {
			DD.bpAttach.at(options.at, _onAttach, _onDetach);
		}

		$container.data('ddExpandCollapse-isInit', true);
	};

	$.extend({
		ddExpandCollapse: {
			defaults: {
				isAnimated: true,
				scroll: true,
				scrollOffset: -50,
				group: false,
				at: false,
				addLinkState: false,
				labels: {
					expanded: 'Click to collapse',
					collapsed: 'Click to expand'
				},
				attrs: {
					group: 'data-ec-group',
					scroll: 'data-ec-scroll',
					at: 'data-ec-at'
				},
				durations: {
					expand: [250, 200],
					collapse: [100, 250],
					scroll: 400
				},
				classes: {
					links: 'js-ec-link',
					linkState: 'ec-link-state',
					linkIcon: 'ec',
					isExpanded: 'is-expanded',
					isDisabled: 'is-disabled'
				},
				animations: {
					reset: function($container) {
						$container.removeAttr('style');
					},
					collapseOnInit: function($container) {
						$container.css({
							opacity: 0
						});
					},
					collapse: function($container, options, callback) {
						// fade out, then slide in
						$container.velocity('stop').velocity({
							opacity: 0
						}, {
							duration: options.durations.collapse[0],
							complete: function() {
								$container.velocity('slideUp', {
									duration: options.durations.collapse[1],
									easing: 'ease-out',
									complete: callback
								});
							}
						});
					},
					expand: function($container, options, callback) {
						// slide down, then fade in
						$container.velocity('stop').velocity('slideDown', {
							duration: options.durations.expand[0],
							easing: 'ease-out',
							complete: function() {
								$container.velocity({
									opacity: 1
								}, {
									duration: options.durations.expand[1],
									easing: 'ease-out',
									complete: callback
								});
							}
						});
					},
					scrollPage: function($container, options, callback) {
						var pageTop = $(document).scrollTop(),
							pageBottom = pageTop + $(window).height(),
							offset;

						// display the container to get the position
						$container.css({
							display: 'block'
						});

						offset = $container.offset().top + options.scrollOffset;

						// rehide the container
						$container.css({
							display: ''
						});

						if (options.scroll === false || offset > pageTop && offset < pageBottom) {
							if (typeof (callback) === 'function') {
								callback();
							}

							// is currently in the page so don't scroll
							return;
						}

						// scroll the page
						$('html').velocity('stop').velocity('scroll', {
							offset: offset,
							duration: options.durations.scroll,
							complete: callback
						});
					}
				},
				initLinks: function($links, options) {
					var $linkIcon,
						$linkState;

					$linkIcon = $('<div />', {
						class: options.classes.linkIcon
					});

					$links.append($linkIcon);

					// add link state if needed
					if (options.addLinkState) {
						$linkState = $('<div />', {
							class: 'vh ' + options.classes.linkState,
							text: options.labels.collapsed
						});

						$links.append($linkState);
					}
				}
			}
		}
	}).fn.extend({
		ddExpandCollapse: function(options) {
			options = $.extend(true, {}, $.ddExpandCollapse.defaults, options);

			return $(this).each(function(i, el) {
				_init(el, options);
			});
		}
	});
})(jQuery, window, document);
