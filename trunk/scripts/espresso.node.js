/* -----------------------------------------------------------------

	Script: 
		Simple node wrappers

		@script		Espresso.Node
		@version	0.2
		@author		Benjamin Hutchins
		@date		May 10th, 2008

	Copyright:
		Copyright (c) 2008, Benjamin Hutchins <http://www.xvolter.com/>

	License:
		MIT license

   ----------------------------------------------------------------- */

if (typeof Espresso == "undefined") { var Espresso = {}; }

Espresso.Node = {};

Espresso.Node.Basic = new Class({
	Implements: Options,

	options: {
		'element':	'span',
		'innerHTML':	null,
		'properties'	{}
	},

	rendered: false,

	initialize:function(options) {
		this.setOptions(options);
		return this;
	},

	render: function() {
		this.element = new Element(this.options.element);

		if (this.options.innerHTML != null)
			this.element.appendText(this.options.innerHTML);

		for (var prop in this.options.properties) {
			this.element.setProperty(prop.toLowerCase(), this.options.properties[prop]);
		}

		this.rendered = true;
		return this.element;
	},
    
	import: function(el) {
		this.options.innerHTML = $(el).getHTML();
		return this;
	}
});

Espresso.Node.Text = Espresso.Node.Basic.extend({
	initialize: function(innerHTML) {
		return this.parent({'innerHTML': innerHTML, 'element': 'span'});
	}
});

Espresso.Node.Anchor = Espresso.Node.Basic.extend({
	initialize: function(innerHTML, href) {
		return this.parent({'innerHTML': innerHTML, 'element': 'a', 'properties': {'href': href}});
	},

	import: function(el) {
		el = $(el);
		this.parent(el);
		if (el.getProperty("href") != "")
			this.options.properties.href = el.getProperty("href");
		return this;
	},

	setLink: function(href) {
		if (this.rendered)
			this.element.setProperty('href', href);
		else
			this.options.properties.href = href;
		return this;
	}
});

Espresso.Node.Link = Espresso.Node.Anchor;

Espresso.Node.Input = Espresso.Node.Basic({
	initialize:function(value, type) {
		return this.parent({'element': 'input', 'properties': {'type': (type || 'text'), 'value': value}});
	},

	setValue: function(value) {
		if (!this.rendered) this.render();
		this.element.setProperty('value', value);
		this.element.fireEvent("change");
		return this;
	},

	getValue: function() {
		if (this.rendered)
			return this.element.getProperty('value');
		else
			return this.options.properties.value;
	}
});
