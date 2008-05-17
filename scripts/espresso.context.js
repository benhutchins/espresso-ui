/* -----------------------------------------------------------------

	Script: 
		A context menu wrapper.

		@script		Espresso.Context
		@version	0.2.1
		@author		Benjamin Hutchins
		@date		May 10th, 2008

	Copyright:
		Copyright (c) 2008, Benjamin Hutchins <http://www.xvolter.com/>

	License:
		MIT license

   ----------------------------------------------------------------- */

if (typeof Espresso == "undefined") { var Espresso = {}; }

Espresso.Context = new Class({
	Implements: [Events, Options],

	options: {
		'class':	'contextmenu desktop',	// can be more than one class
		'pageOffset':	25,
		'opacity':	1,
		'zIndex':	100,
		'onHide':	null,			// Event, fired when menu is hidden
		'onShow':	null,			// Event, fired when menu is shown
		'onSelect':	null,			// Event, fired when a list element is clicked
		'children':	false			// Element children as well?
	},

	initialize: function(selector, items, options) {
		this.setOptions(options);
		this.isVisibile	= false;
		this.items	= items;

		/**
		 * Set events through options
		 **/
		if (typeof this.options.onHide == 'function')
			this.addEvent('onHide', this.options.onHide);
		if (typeof this.options.onShow == 'function')
			this.addEvent('onShow', this.options.onShow);
		if (typeof this.options.onSelect == 'function')
			this.addEvent('onSelect', this.options.onSelect);

		/**
		 * IE fix
		 **/
		if (Browser.Engine.trident) {
			this.shim = new Element('iframe', {
				style: 'position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);display:none',
				src: 'javascript:false;',
				frameborder: 0
			}).injectInside(document.body);
		}

		/**
		 * Create menu container
		 **/
		this.container = new Element('div', {
			'class': this.options['class'],
			'style': 'display:none'
		})
			.addClass('EspressoContextmenu')
			.addEvent('contextmenu',
				function(e){
					new Event(e).stop();
					return false;
				}
			)
			.setOpacity(this.options.opacity)
			.injectInside(document.body);

		/**
		 * Create menu list
		 **/
		this.contextMenu = new Element('ul')
			.addEvent('contextmenu',
				function(e){
					new Event(e).stop();
					return false;
				}
			)
			.injectInside(this.container);

		/**
		 * Create actual menu items
		 **/
		this.items.each(function(item){
			item = $extend({
				'name':		'',
				'title':	'',
				'separator':	false,
				'external':	false,
				'disabled':	false,
				'callback':	$empty,
				'class':	'',
				'url':		null
			}, item);

			if (item.title.length == 0)
				item.title = item.name;

			var listElement = new Element('li', {
				'class': item.separator ? 'separator' : ''
				})
				.addEvent('mouseover', function() {
					this.addClass('hover');
				})
				.addEvent('mouseout', function() {
					this.removeClass('hover');
				})
				.injectInside(this.contextMenu);
			
			if (!item.separator) {
				if(item.url != null) item.external = true;
				var anchor = $extend(
					new Element('a', {
						'href': item.external ? item.url : '#',
						'title': item['title'],
						'class': item['class'] + (item.disabled ? " disabled" : " enabled")
					}), {
						_callback: item.callback,
						_external: item.external
					})
					.addEvent('mouseover', function() {
						this.addClass('hover');
					})
					.addEvent('mouseout', function() {
						this.removeClass('hover');
					})
					.addEvent('click',
						function(e) {
							e = new Event(e);
							if (e.target._external) return;
							e.stop();
							if (e.target._callback && !e.target.hasClass('disabled')) {
								this.fireEvent('onSelect', e);
								if (Browser.Engine.trident) this.shim.setStyle('display' ,'none');
								this.container.setStyle('display', 'none');
								e.target._callback(this.event);
							}
							return;
						}.bind(this)
					)
					.addEvent('contextmenu',
						function(e) {
							new Event(e).stop();
							return false;
						}
					)
					.setText(item['name'])
					.injectInside(listElement);
			}
		}.bind(this));

		/**
		 * Make click on document hide context menu
		 **/
		document.addEvent('click', function(e) {
			e = new Event(e);
			if (
				(this.isVisibile && e.rightClick == false) ||
				(this.isVisibile && e.rightClick && !this.selected(e.target))
			) {
				this.fireEvent('onHide', e);
				if (Browser.Engine.trident) {
					this.shim.setStyle('display', 'none');
				}
				this.container.setStyle('display','none');
			}
		}.bind(this));

		/**
		 * Add right-click option to selectors
		 **/
		this.selector = selector;
		var htype = $type(selector);
		this.selectors = (htype == 'array' || htype == 'collection') ? $$(selector) : $(selector);

		var context = this;
		this.selectors.addEvent(Browser.Engine.presto ? 'click' : 'contextmenu',
			function(e){
				e = new Event(e);
				if (!context.options.children && !context.selected(e.target)) return;
				if (Browser.Engine.presto && !e.control) {
					return;
				}
				context.show(e, this);
			}
		);
		this.selectors.context = this;
	},
	
	selected: function(element) {
		var isSelector = false;
		var htype = $type(this.selector);
		if (htype == 'array' || htype == 'collection') {
			this.selectors.each(function(element){
				if (this == element) {
					isSelector = true;
				}
			}.bind(element));
		} else {
			return $(this.selectors) == $(element);
		}
		return canPass;
	},

	show: function(e, element) {
		e.stop();
		this.isVisibile = true;
		this.fireEvent('onShow', e);
		var x = e.page.x,
			y = e.page.y,
			//vpDim = $type(element) == 'element' ? element.getCoordinates() : Window.getCoordinates(),
			vpDim = Window.getCoordinates(),
			//vpOff = window.getScrollSize(),
			elDim = this.container.getCoordinates(),
			elOff = {
				left: ((x + elDim.width + this.options.pageOffset) > vpDim.width 
					? (vpDim.width - elDim.width - this.options.pageOffset) : x) + 'px',
				//top: ((y - vpOff.x + elDim.height) > vpDim.height// && (y - vpOff.x) > elDim.height 
				top: ((y + elDim.height + this.options.pageOffset) > vpDim.height // && (y - vpOff.x) > elDim.height 
					? (vpDim.height - elDim.height - this.options.pageOffset) : y) + 'px'
			};

		if (elOff.top < this.options.pageOffset)
			elOff.top = (this.options.pageOffset) + 'px';

		if (typeof Espresso.indexLevel != 'undefined' && Espresso.indexLevel > this.options.zIndex)
			this.options.zIndex = Espresso.indexLevel++;

		this.container.setStyles(elOff).setStyle('zIndex', this.options.zIndex);
		if (Browser.Engine.trident) {
			this.shim.setStyles($extend($extend(elDim, elOff), {zIndex: this.options.zIndex - 1})).setStyle('display', 'block');
		}

		$$('EspressoContextmenu').setStyle('display', 'none');
		this.container.setStyle('display', 'block');
		this.event = e;
	},

	setOpacity: function(opacity) {
		this.container.setOpacity(opacity);
		return this;
	}
});


/**
 * Add an element wrapper to easily add context menus via:
 * 	element.addContext(menu items, options)
 **/
Element.implement({
	addContext: function(items, options) {
		if(this._contextMenu) return this._contextMenu;
		this._contextMenu = new Espresso.Context(this, items, options);
		return this._contextMenu;
	},

	getContext: function() {
		return typeof this._contextMenu == 'undefined' ? false : this._contextMenu;
	},

	removeContext: function() {
		if (this._contextMenu) {
			this.removeEvent(Browser.Engine.presto ? 'click' : 'contextmenu');
			delete this._contextMenu;
		}
		return this;
	}
});
