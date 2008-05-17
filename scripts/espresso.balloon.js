/* -----------------------------------------------------------------

	Script: 
		Create popup alerts on the desktop module.

		@script		Espresso.Balloon
		@version	0.1
		@author		Benjamin Hutchins
		@date		May 16th, 2008

	Copyright:
		Copyright (c) 2008, Benjamin Hutchins <http://www.xvolter.com/>

	License:
		MIT license

	Special thanks to Harald Kirschner for his Roar Notifications
	<http://digitarald.de/project/roar/>

   ----------------------------------------------------------------- */

if (typeof Espresso == "undefined") { var Espresso = {}; }

Espresso.Balloon = new Class({

	Implements: [Options, Events, Chain],

	options: {
		duration: 3000,
		position: 'upperLeft',
		container: null,
		bodyFx: null,
		itemFx: null,
		margin: {x: 10, y: 10},
		offset: 10,
		className: 'balloon',
		onShow: $empty,
		onHide: $empty,
		onRender: $empty,
		title: null,
		message: null,
		inject: true
	},

	initialize: function(options) {
		this.setOptions(options);
		this.items = [];
		this.elements = {};
		this.container = $(this.options.container) || document;

		if (this.options.title)
			this.items.push(new Element('h3', {'html': this.options.title}));
		if (this.options.message)
			this.items.push(new Element('p', {'html': this.options.message}));

		return ($chk(this.options.inject) ? this.inject() : this);
	},

	inject: function() {
		if (!this.body) this.render();

		var offset = [-this.options.offset, 0];
		var last = this.items.getLast();
		if (last) {
			offset[0] = last.retrieve('balloon:offset');
			offset[1] = offset[0] + last.offsetHeight + this.options.offset;
		}
		var to = {'opacity': 1};
		to[this.align.y] = offset;

		var item = new Element('div', {
			'class': this.options.className,
			'opacity': 0
		}).adopt(
			new Element('div', {
				'class': this.options.className + '-bg',
				'opacity': 0.7
			}),
			this.items
		);

		item.setStyle(this.align.x, 0).store('balloon:offset', offset[1]).set('morph', $merge({
			unit: 'px',
			link: 'cancel',
			onStart: Chain.prototype.clearChain,
			transition: Fx.Transitions.Back.easeOut
		}, this.options.itemFx));

		var remove = this.remove.create({
			bind: this,
			arguments: [item],
			delay: 10
		});
		this.items.push(item.addEvent('click', remove));

		if (this.options.duration) {
			var over = false;
			var trigger = (function() {
				trigger = null;
				if (!over) remove();
			}).delay(this.options.duration);
			item.addEvents({
				mouseover: function() {
					over = true;
				},
				mouseout: function() {
					over = false;
					if (!trigger) remove();
				}
			});
		}
		item.inject(this.body).morph(to);
		return this.fireEvent('onShow', [item, this.items.length]);
	},

	remove: function(item) {
		var index = this.items.indexOf(item);
		if (index == -1) return this;
		this.items.splice(index, 1);
		item.removeEvents();
		var to = {opacity: 0};
		to[this.align.y] = item.getStyle(this.align.y).toInt() - item.offsetHeight - this.options.offset;
		item.morph(to).get('morph').chain(item.destroy.bind(item));
		return this.fireEvent('onHide', [item, this.items.length]).callChain(item);
	},

	empty: function() {
		while (this.items.length) this.remove(this.items[0]);
		return this;
	},

	render: function() {
		this.position = this.options.position;
		if ($type(this.position) == 'string') {
			var position = {x: 'center', y: 'center'};
			this.align = {x: 'left', y: 'top'};
			if ((/left|west/i).test(this.position)) position.x = 'left';
			else if ((/right|east/i).test(this.position)) this.align.x = position.x = 'right';
			if ((/upper|top|north/i).test(this.position)) position.y = 'top';
			else if ((/bottom|lower|south/i).test(this.position)) this.align.y = position.y = 'bottom';
			this.position = position;
		}
		this.body = new Element('div', {'class': this.options.className + '-body'}).inject(document.body);
		if (Browser.Engine.trident4) this.body.addClass(this.options.className + '-body-ugly');
		this.moveTo = this.body.setStyles.bind(this.body);
		this.reposition();
		if (this.options.bodyFx) {
			var morph = new Fx.Morph(this.body, $merge({
				unit: 'px',
				chain: 'cancel',
				transition: Fx.Transitions.Circ.easeOut
			}, this.options.bodyFx));
			this.moveTo = morph.start.bind(morph);
		}
		var repos = this.reposition.bind(this);
		window.addEvents({
			scroll: repos,
			resize: repos
		});
		this.fireEvent('onRender', this.body);
	},

	reposition: function() {
		var max = document.getCoordinates(), scroll = document.getScroll(), margin = this.options.margin;
		max.left += scroll.x;
		max.right += scroll.x;
		max.top += scroll.y;
		max.bottom += scroll.y;
		var rel = ($type(this.container) == 'element') ? this.container.getCoordinates() : max;
		this.moveTo({
			left: (this.position.x == 'right')
				? (Math.min(rel.right, max.right) - margin.x)
				: (Math.max(rel.left, max.left) + margin.x),
			top: (this.position.y == 'bottom')
				? (Math.min(rel.bottom, max.bottom) - margin.y)
				: (Math.max(rel.top, max.top) + margin.y)
		});
	}

});
