/* -----------------------------------------------------------------

	Script: 
		A dock extension for your Espresso Desktop.

		@script		Espresso.Dock
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
		hasDock:	false
	});

if (typeof Espresso.Active == "undefined") { Espresso.Active = {} }
Espresso.Active = $extend(Espresso.Active, {
		Dock:		null
	});

/**
 * Create window class
 **/
Espresso.Dock = new Class({

	Implements: Options,

	options: {
		'id':			'espressoDock',	// ID for Desktop
		'class':		'dock',		// Class to apply to dock
		'alwaysShow':		true		// Always show windows?
	},

	initialize: function(options) {
		this.setOptions(options);

		if ($(this.options.id)) {
			alert('Dock already exists.');
			return false;
		}

		if (typeof Espresso.Active.Desktop == 'undefined' || Espresso.Active.Desktop == null) {
			alert('Must have a Desktop.');
			return false;
		}

		this.dock = new Element('div', {
			'id': this.options.id,
			'class': this.options['class']
		})
			.injectInside(document.body);//(Espresso.Active.Desktop.getDesktop());

		if (Browser.Engine.trident) {
			this.dock.setStyle('height', '20px');
		}

		Espresso.hasDock = true;
		Espresso.Active.Dock = this;
		return this;
	},

	getDock: function() {
		return $(this.dock);
	}
});
