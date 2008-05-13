/* -----------------------------------------------------------------

	Script: 
		Add css-based scrollbars to elements.

		@script		Espresso.Scrollbar
		@version	0.1
		@author		Benjamin Hutchins
		@date		May 10th, 2008

	Copyright:
		Copyright (c) 2008, Benjamin Hutchins <http://www.xvolter.com/>

	License:
		MIT license

	Special thanks to Bas Wenneker for his Scrollbar script.
	<http://solutoire.com/2008/03/10/mootools-css-styled-scrollbar/>

   ----------------------------------------------------------------- */

if (typeof Espresso == "undefined") { var Espresso = {} }
Espresso.Scrollbar = new Class({
	Implements: Options,

	options: {
		'horizontal':	true,
		'vertical':	true,
		'scrollWheel':	true
	},

	initialize: function(content, options) {
		this.setOptions(options);
		this.content = $(content);
		if (!$(this.content)) {
			alert('Cannot locate content div.');
			return;
		}

		var ContentMoused = (this.options.vertical && this.options.scrollWheel);
		if (this.options.horizontal) {
			this.hor_scrollbar = new Element('div').addClass('scrollbar-hor').injectAfter(this.content);
			this.hor_handle = new Element('div').addClass('handle-hor').setStyle('position', 'relative').injectInside(this.hor_scrollbar);
			new Element('div', {'class': 'clear', 'style':'clear:left;'}).injectBefore(this.hor_scrollbar);
			new Element('div', {'class': 'clear', 'style':'clear:left;'}).injectAfter(this.hor_scrollbar);
			this.hor_handle.setStyle('left', '0px');

			this.hor_slider = new Slider(this.hor_scrollbar, this.hor_handle, {	
				steps: (this.content.getScrollSize().x - this.content.getSize().x),
				mode: 'horizontal',
				onChange: function(step){
					this.content.scrollTo(step, 0);
				}.bind(this)
			}).set(0);

			if (this.options.scrollWheel) {
				if (!ContentMoused) {
					$$(this.content, this.hor_scrollbar).addEvent('mousewheel',
						function(event) {
							event = new Event(event).stop();
							this.hor_slider.set(this.hor_slider.step - event.wheel * 30);
						}.bind(this)
					);
				} else {
					$(this.hor_scrollbar).addEvent('mousewheel',
						function(event) {
							event = new Event(event).stop();
							this.hor_slider.set(this.hor_slider.step - event.wheel * 30);
						}.bind(this)
					);
				}
			}
		}

		if (this.options.vertical) {
			this.vert_scrollbar = new Element('div').addClass('scrollbar-vert').injectAfter(this.content);
			this.vert_handle = new Element('div').addClass('handle-vert').setStyle('position', 'relative').injectInside(this.vert_scrollbar);
			new Element('div', {'class': 'clear', 'style':'clear:left;'}).injectAfter(this.vert_scrollbar);
			this.vert_handle.setStyle('top', '0px');

			this.vert_slider = new Slider(this.vert_scrollbar, this.vert_handle, {	
				steps: (this.content.getScrollSize().y - this.content.getSize().y),
				mode: 'vertical',
				onChange: function(step){
					this.content.scrollTo(0, step);
				}.bind(this)
			}).set(0);

			if (this.options.scrollWheel) {
				ContentMoused = true;
				$$(this.content, this.vert_scrollbar).addEvent('mousewheel',
					function(event) {
						event = new Event(event).stop();
						this.vert_slider.set(this.vert_slider.step - event.wheel * 30);
					}.bind(this)
				);
			}
		}

		$(document.body).addEvent('mouseleave',
			function() {
				if (this.options.vertical)
					this.vert_slider.drag.stop();

				if (this.options.horizontal)
					this.hor_slider.drag.stop();
			}.bind(this)
		);
	}
});

Element.implement({
	addScrollbar: function(options) {
		if(this._cssScrollbar) return this._cssScrollbar;
		this._cssScrollbar = new Espresso.Scrollbar(this, options);
		return this._cssScrollbar;
	},

	getScrollbar: function() {
		return typeof this._cssScrollbar == 'undefined' ? false : this._cssScrollbar;
	}
});
