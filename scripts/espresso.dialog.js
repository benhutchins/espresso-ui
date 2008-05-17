/* -----------------------------------------------------------------

	Script: 
		A dialog window generator

		@script		Espresso.Dialog
		@version	0.1.1
		@author		Benjamin Hutchins
		@date		May 10th, 2008

	Copyright:
		Copyright (c) 2008, Benjamin Hutchins <http://www.xvolter.com/>

	License:
		MIT license

   ----------------------------------------------------------------- */

if (typeof Espresso == "undefined") { var Espresso = {}; }

Espresso.Dialog = {
	opened: null,

	Basic: new Class({
		Implements: Options,

		options: {
			'id':			null,
			'ok':			'Ok',
			'cancel':		'Cancel',
			'ok_class':		'ok_button',
			'cancel_class':		'cancel_button',
			'message_class':	'message',
			'buttons_class':	'buttons',

			'useOverlay':		true,
			'overlay_class':	'overlay',

			'resizable':		false,
			'minimizable':		false,
			'maximizable':		false,
			'draggable':		false,
			'closable':		false,
			'detachable':		false,
			'scrollbars':		false,

			'width':		300,
			'height':		100,

			'onOk':			null,
			'onCancel':		null,

			'closeOnOk':		true,
			'closeOnCancel':	true,

			'overlayOpacity':	0.7,

			'useDesktop':		false,
			'useDock':		false,
			'dbClickMaximize':	false,

			'modal':		true
		},

		win: null,

		initialize: function(content, options) {
			this.setOptions(options);

			if (typeof Espresso.Window == 'undefined') {
				alert('Espresso.Dialog required Espresso.Window');
				return false;
			}

			if (this.options.id == null)
				this.options.id = "dialog_confirm_" + $time();

			this.elements = {};

			this.win = new Espresso.Window(this.options)
				.setDestroyOnClose(true)
				.setPosition({'center': true});
			this.setMessage(content);

			this.win.addEvent('onClose', function() {
				if($(this.overlay) && $type(this.overlay) == 'element') this.overlay.destroy();
			}.bind(this));

			this.win.addEvent('onFocus', function() {
				if (!this.options.useOverlay) return false;
				var zIndex = 9999;//this.win.getZIndex();
				this.createOverlay(zIndex);
				this.win.setZIndex(zIndex+1);
			}.bind(this));

			this.win.show(true);
			this.win.focus();

			window.addEvent('resize' ,function(){
				if(this.overlay.getStyle('opacity') == 0){
					return;
				};

				var scrollSize = $(window).getScrollSize().y;
				var scrollTop = $(window).getScroll().y;
				this.overlay.setStyles({ 'height':scrollSize+scrollTop,'top':-scrollTop });
			}.bindWithEvent(this));

			Espresso.Dialog.opened = this;
			return this;
		},

		getWindow: function() {
			return this.win;
		},

		close: function(onClose) {
			if (typeof onClose == 'function')
				this.win.addEvent('onClose', onClose);
			this.win.close();
			return this;
		},

		okCallback: function(event) {
			event = new Event(event);

			if (this.options.closeOnOk)
				return this.close(this.options.onOk);

			this.options.onOk();
		},

		cancelCallback: function(event) {
			event = new Event(event);

			if (this.options.closeOnCancel)
				return this.close(this.options.onCancel);

			this.options.onCancel();
		},

		createOverlay: function(zIndex) {
			this.overlay = new Element('div', {
				'id': this.options.id + '_overlay',
				'styles': {
					'opacity':'0',
					'visibility':'visible',
					'zIndex': zIndex,
					'top': -$(window).getScroll().y,
					'height':$(window).getScrollSize().y+$(window).getScroll().y
				},
				'class': this.options.overlay_class
			})
			.inject($(this.win.getDesktop()) || $(document.body))
			.tween('opacity', this.options.overlayOpacity);
		}
	})
};

Espresso.Dialog = $extend(Espresso.Dialog, {

	Confirm: new Class({
		Extends: Espresso.Dialog.Basic,
		setMessage: function(message) {
			this.elements = {};
			this.elements.container = new Element('div');
			this.elements.message = new Element('div', {'class': this.options.message_class}).setHTML(message).injectInside(this.elements.container);
			this.elements.buttons = new Element('div', {'class': this.options.buttons_class + " confirm"}).injectInside(this.elements.container);
			this.elements.okButton = new Element('input', {'type': 'button', 'value': this.options.ok, 'class': this.options.ok_class + " confirm"}).addEvent('click', this.okCallback.bindWithEvent(this)).injectInside(this.elements.buttons);
			this.elements.cancelButton = new Element('input', {'type': 'button', 'value': this.options.cancel, 'class': this.options.cancel_class + " confirm"}).addEvent('click', this.cancelCallback.bindWithEvent(this)).injectInside(this.elements.buttons);

			this.win.setContent(this.elements.container);
			return this;
		}
	}),

	Alert: new Class({
		Extends: Espresso.Dialog.Basic,
		setMessage: function(message) {
			this.elements = {};
			this.elements.container = new Element('div');
			this.elements.message = new Element('div', {'class': this.options.message_class}).setHTML(message).injectInside(this.elements.container);
			this.elements.buttons = new Element('div', {'class': this.options.buttons_class + " alert"}).injectInside(this.elements.container);
			this.elements.okButton = new Element('input', {'type': 'button', 'value': this.options.ok, 'class': this.options.ok_class + " alert"}).addEvent('click', this.okCallback.bindWithEvent(this)).injectInside(this.elements.buttons);

			this.win.setContent(this.elements.container);
			return this;
		}
	}),

	Info: new Class({
		Extends: Espresso.Dialog.Basic,
		setMessage: function(message) {
			this.elements = {};
			this.elements.container = new Element('div');
			this.elements.message = new Element('div', {'class': this.options.message_class}).setHTML(message).injectInside(this.elements.container);

			this.win.setContent(this.elements.container);
			return this;
		}
	}),

	close: function() {
		var opened = Espresso.Dialog.opened;
		try{opened.close();}catch(e){}
		return opened;
	}
});
