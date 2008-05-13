/* -----------------------------------------------------------------

	Script: 
		A web based desktop.

		@script		Espresso.Desktop
		@version	0.1
		@author		Benjamin Hutchins
		@date		May 10th, 2008

	Copyright:
		Copyright (c) 2008 Benjamin Huthcins, <http://www.xvolter.com/>

	License:
		MIT license

   ----------------------------------------------------------------- */

if (typeof Espresso == "undefined") { var Espresso = {} }
Espresso = $extend(Espresso, {
		hasDesktop:	false
	});

if (typeof Espresso.Active == "undefined") { Espresso.Active = {} }
Espresso.Active = $extend(Espresso.Active, {
		Desktop:	null
	});

/**
 * Create window class
 **/
Espresso.Desktop = new Class({

	Implements: Options,

	options: {
		'id':			'espressoDesktop',// ID for Desktop
		'class':		'desktop',	// Class to apply to desktop

		// Desktop background
		'bgColor':		'#fff',		// Background of desktop
		'bgImage':		null,		// Background image of desktop
		'bgImageStyle':		'stretch'	// Method for image. Can be 'center', 'stretch' or 'tile'
	},

	initialize: function(options) {
		this.setOptions(options);

		if ($(this.options.id)) {
			alert('Desktop already exists.');
			return false;
		}

		this.elements = {};

		this.desktop = new Element('div', {
			'id': this.options.id,
			'class': this.options['class']
		}).injectInside(document.body);

		this.setBackground(this.options.bgColor, this.options.bgImage, this.options.bgImageStyle);
		this.resize();

		Espresso.hasDesktop = true;
		Espresso.Active.Desktop = this;
		return this;
	},

	removeBackground: function() {
		if ($(this.elements.backgroundImage)) {
			this.elements.backgroundImage.destory();
		}
		this.desktop.setStyle('background', 'transparent');
		return this;
	},

	setBackground: function(color, image, style) {
		this.removeBackground();
		this.desktop.setStyle('background-color', color);
		this.setBackgroundImage(image, style);
		return this;
	},

	setBackgroundImage: function(image, style) {
		if (image==null) return this;
		if (style==null) style = this.options.bgImageStyle;
		switch (style.toLowerCase()) {
			case 'tile':
				this.desktop.setStyle('background-image', 'url(' + image + ')');
				this.desktop.setStyle('background-repeat', 'repeat');
				this.desktop.setStyle('background-position', 'top left'); // set this in case we're going from center to repeat
				break;

			case 'center':
				this.desktop.setStyle('background-image', 'url(' + image + ')');
				this.desktop.setStyle('background-repeat', 'no-repeat');
				this.desktop.setStyle('background-position', 'center center');
				break;

			case 'stretch':
			default:
				if ($(this.elements.backgroundImage)) {
					this.elements.backgroundImage.setStyle('background-image', 'url(' + image + ')');
				} else {
					this.elements.backgroundImage = new Element('div', {
						'style': 'background:inherit;background-repeat:no-repeat;background-position:center center;position:absolute;left:0px;top:0px;display:block;width:100%;height:100%;'
					}).setStyle('background-image', 'url(' + image + ')').injectInside(this.desktop);
				}
				break;
		}
		return this;
	},

	getDesktop: function() {
		return $(this.desktop);
	},

	addContext: function(menu, options) {
		if (typeof Espresso.Context == 'undefined') return null;
		this.context = new Espresso.Context($(this.desktop), menu, options);
		return this.context;
	},

	resize: function() {
		if (Espresso.hasDock)
			this.desktop.setStyle('height', (Window.getHeight().toInt() - Espresso.Active.Dock.getDock().getHeight().toInt()) + 'px');
	}
});
