/* -----------------------------------------------------------------

	Script: 
		A start menu extension for Espresso Desktop

		@script		Espresso.StartMenu
		@version	0.1
		@author		Benjamin Hutchins
		@date		May 10th, 2008

	Copyright:
		Copyright (c) 2008, Benjamin Hutchins <http://www.xvolter.com/>

	License:
		MIT license

   ----------------------------------------------------------------- */

if (typeof Espresso == "undefined") { var Espresso = {}; }

Espresso = $extend(Espresso, {
		ieSupport:	'excanvas',
		hasStartMenu:	false
	});

if (typeof Espresso.Active == "undefined") { Espresso.Active = {} }
Espresso.Active = $extend(Espresso.Active, {
		StartMenu:	null
	});

Espresso.StartMenu = new Class({
	Implements: Options,

	options: {
		'class':		'startmenu',
		'zIndex':		90, // less than context menus, if you wanted a context menu on an item
		'title':		'Start Menu',
		'anchorTitle':		'Click here to begin',

		'onSelect':		$empty,
		'onShow':		$empty,

		headerHeight:		25,			// Height of window titlebar
		footerHeight:		26,			// Height of window footer
		'cornerRadius':		9,
		'shadowWidth':		3,

		headerStartColor:	[250, 250, 250],	// Header gradient start
		headerStopColor:	[228, 228, 228]		// Header gradient end
	},

	initialize: function(items, options) {
		this.setOptions(options);
		this.isVisibile	= false;

		this.EspressoDock = Espresso.hasDock ? Espresso.Active.Dock.getDock() : null;
		this.EspressoDesktop = Espresso.hasDesktop ? Espresso.Active.Desktop.getDesktop() : null;

		/**
		 * Make sure dock and desktop exist.
		 **/
		if (!$(this.EspressoDock) || !$(this.EspressoDesktop)) {
			alert('Start Menu requires a dock and a desktop.');
			return false;
		}

		this.elements = {};

		/**
		 * Create container
		 **/
		this.elements.container = new Element('div', {
			'class': this.options['class'],
			'style': 'display:none;'
		})
			.addEvent('contextmenu',
				function(e){
					new Event(e).stop();
					return false;
				}
			)
			.injectInside(this.EspressoDesktop);

		// Create canvas
		this.elements.canvas = new Element('canvas', {
			'class': this.options['class'] + '_canvas',
			'width': 1,
			'height': 1
		}).injectInside(this.elements.container);
		
		// Dynamically initialize canvas using excanvas. This is only required by IE
		if (Browser.Engine.trident && Espresso.ieSupport == 'excanvas') {
			G_vmlCanvasManager.initElement(this.elements.canvas);
			this.elements.canvas = this.elements.container.getElement('.' + this.options['class'] + '_canvas');
		}

		/**
		 * Create menu header
		 **/
		this.elements.header = new Element('h2')
			.setText(this.options.title)
			.addClass(this.options['class'] + '_header')
			.injectInside(this.elements.container);

		/*this.HeaderFooterShadow = this.options.headerHeight + this.options.footerHeight;
		var EspressoHeight = this.elements.container.getStyle('height').toInt() + this.HeaderFooterShadow;
		var EspressoWidth = this.elements.container.getStyle('width').toInt();

		this.elements.canvas.height = Browser.Engine.webkit ? 4000 : EspressoHeight;
		this.elements.canvas.width = Browser.Engine.webkit ? 2000 : EspressoWidth;

		/*var ctx = this.elements.canvas.getContext('2d');
		var dimensions = document.getCoordinates();
		ctx.clearRect(0, 0, dimensions.width, dimensions.height);
		//this.topRoundedRect(ctx, 3, 2,  EspressoWidth, this.options.headerHeight, this.options.cornerRadius);

		/**
		 * Create menu container
		 **/
		this.elements.menuContainer = new Element('div')
			.addClass(this.options['class'] + '_container')
			.injectInside(this.elements.container);

		/**
		 * Create menu list
		 **/
		this.elements.menu = new Element('ul')
			.addEvent('contextmenu',
				function(e){
					new Event(e).stop();
					return false;
				}
			)
			.addClass(this.options['class'] + '_menu')
			.injectInside(this.elements.menuContainer);

		/**
		 * Create menu button
		 **/
		this.elements.button = new Element('a', {
				'class': this.options['class'] + '_button',
				'title': this.options.anchorTitle
			})
			.setHTML('Start')
			.addEvent('mouseover', function() {
				this.addClass('hover');
			})
			.addEvent('mouseout', function() {
				this.removeClass('hover');
			})
			.addEvent('click',
				function(e) {
					e = new Event(e);
					e.stop();
					if (this.isVisibile) {
						this.hide(e);
					} else {
						this.show(e);
					}
				}.bind(this)
			)
			.injectTop(this.EspressoDock);

		if (items != null)
			this.addItems(items);

		/**
		 * Make document.onclick hide menu
		 **/
		document.addEvent('click', function(event) {
			event = new Event(event);
			if (	this.isVisibile &&
				event.target != this.elements.button &&
				event.target != this.elements.menu &&
				event.target != this.elements.menuContainer &&
				event.target != this.elements.header &&
				event.target != this.elements.container
			) {
				setTimeout(this.hide.bind(this), 100);
			}
		}.bind(this));

		Espresso.hasStartMenu = true;
		Espresso.Active.StartMenu = this;
		return this;
	},

	setTitle: function(title) {
		this.elements.header.setText(title);
		return this;
	},

	getTitle: function() {
		return this.elements.header.getText(title);
	},

	show: function(e) {
		this.isVisibile = true;
		this.options.onShow(e);
		this.elements.button.addClass('isShowing');
		this.elements.container.setStyle('display', 'block');
		var elOff = {
			left: (0) + 'px',
			top: (Window.getHeight() - this.elements.container.getHeight() - this.EspressoDock.getHeight()) + 'px'
		};
		this.elements.container.setStyles(elOff).setStyle('zIndex', this.options.zIndex);
		this.event = e;
	},

	hide: function(e) {
		this.isVisibile = false;
		this.elements.container.setStyle('display', 'none');
		this.elements.button.removeClass('isShowing');
	},

	addItems: function(items, parentNode) {
		parentNode = $(parentNode) || this.elements.menu;
		items.each(function(item){
			this.addItem(item, parentNode);
		}.bind(this));
	},

	addItem: function(item, parentNode) {
		parentNode = $(parentNode) || this.elements.menu;

		item = $extend({
			'name':		'',
			'title':	'',
			'separator':	false,
			'external':	false,
			'disabled':	false,
			'callback':	$empty,
			'class':	'',
			'url':		null,
			'hasSubmenu':	false,
			'submenu':	null
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
			.injectInside(parentNode);

		if (!item.separator) {
			if(item.url != null) item.external = true;
			if(item.submenu != null) item.hasSubmenu = true;
			var anchor = $extend(
				new Element('a', {
					'href': item.external ? item.url : '#',
					'title': item['title'],
					'class': item['class'] + (item.disabled ? " disabled" : "") + (item.hasSubmenu ? " submenu" : "")
				}), {
					_callback: item.callback,
					_external: item.external,
					_submenu: item.submenu
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
							if (typeof this.options.onSelect == 'function')
								this.options.onSelect(e);
							if (this._submenu == null) {
								this.elements.container.setStyle('display', 'none');
							} else {
								// show sub menu
							}
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

			if (item.submenu != null) {
				this.addItems(item.submenu, listElement);
			}
		}
	},


	// Window header with gradient background
	topRoundedRect: function(ctx, x, y, width, height, radius){

		// Create gradient
		if (Browser.Engine.presto != null ){
			var lingrad = ctx.createLinearGradient(0, 0, 0, this.options.headerHeight + 2);
		}
		else {
			var lingrad = ctx.createLinearGradient(0, 0, 0, this.options.headerHeight);
		}

		lingrad.addColorStop(0, 'rgba(' + this.options.headerStartColor.join(',') + ', 100)');
		lingrad.addColorStop(1, 'rgba(' + this.options.headerStopColor.join(',') + ', 100)');
		ctx.fillStyle = lingrad;

		// Draw header
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x, y + height);
		ctx.lineTo(x + width, y + height);
		ctx.lineTo(x + width, y + radius);
		ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
		ctx.lineTo(x + radius, y);
		ctx.quadraticCurveTo(x, y, x, y + radius);
		ctx.fill(); 
	}
});
