/* -----------------------------------------------------------------

	Script: 
		An object-oriented xwindows class.

		@script		Espresso.Window
		@version	0.2
		@author		Benjamin Hutchins
		@date		May 10th, 2008

	Copyright:
		Copyright (c) 2008, Benjamin Hutchins <http://www.xvolter.com/>

	License:
		MIT license

	Special thanks to Greg Houston for his Mocha UI.
	<http://greghoustondesign.com/demos/mocha/>

   ----------------------------------------------------------------- */

if (typeof Espresso == "undefined") { var Espresso = {} }
Espresso = $extend(Espresso, {
		ieSupport:		'excanvas',
		FocusedWindow:		null,
		FocusedWindowNumber:	null,
		LastFocused:		null,
		WindowCount:		0,
		WindowsByNumbers:	[],
		indexLevel:		0
	});

Espresso.Windows = {
	Windows: {},

	get: function(id) {
		return Espresso.Windows.Windows[id];
	},

	close: function(id) {
		return this.get(id).close();
	}
};

/**
 * Create window class
 **/
Espresso.Window = new Class({
	Implements: [Chain, Events, Options],

	options: {
		// ID to use through the created elements
		id:			null,

		// Window style
		'class':		'espresso',		// Class to apply to all window elements
		opacity:		1,			// Window opacity
		paddingVertical:	10,
		paddingHorizontal:	12,

		bgColor:		'#fff',			// Background of content portion
		headerStartColor:	[250, 250, 250],	// Header gradient start
		headerStopColor:	[228, 228, 228],	// Header gradient end
		footerBgColor:		[246, 246, 246],	// Background color of the main canvas shape
		minimizeColor:		[231, 231, 209],	// Minimize button color
		maximizeColor:		[217, 229, 217],	// Maximize button color
		closeColor:		[229, 217, 217],	// Close button color
		resizableColor:		[209, 209, 209],	// Resizable icon color

		// Corner Radius
		cornerRadius:		9,			// How round, can make anything from 0 to 16 (recommended)

		// Shadows
		shadowWidth:		3,			// Window shadow, set to 0 to disable shadows
		shadowOffset:		null,			// Leave null, calculated by script

		// Window Sizes
		headerHeight:		25,			// Height of window titlebar
		footerHeight:		26,			// Height of window footer
		width:			200,			// Height of window content
		height:			300,			// Width of window content
		minWidth:		100,			// Min. width of window on resizes
		minHeight:		150,			// Min. height of window on resizes
		maxWidth:		null,//300,		// Max. width of window on resizes
		maxHeight:		null,//500,		// Max. height of window on resizes

		// Window Title
		title:			"&nbsp;",		// Window title (can set with setTitle)
		dockTitle:		null,			// Window title to use in dock (if there is a dock)
		alwaysInDock:		null,			// Always show in dock (if there is a dock)

		// Window Options
		scrollbars:		true,			// Can window have scrollbars
		cssScrollbar:		false,			// Apply CSS scrollbars if plugin is available?
		cssScrollbarOptions:
			{
				'vertical':	true,			// Vertical Scrollbar?
				'horizontal':	true			// Horizontal Scrollbar?
			},
		resizable:		true,			// Is window resizable
		resizelimit:		true,			// Set a max/min to the window's resize capability
		closable:		true,			// Is window closable
		minimizable:		true,			// Is window minimizable
		maximizable:		true,			// Is window maximizable
		draggable:		true,			// Is window draggable
		destroyOnClose:		false,			// Destory window on close
		useDock:		true,			// Use dock, if there is one?
		useDesktop:		true,			// Use desktop, if there is one?

		modal:			false,			// ...
		dbClickMaximize:	true,			// If true, then when double-clicked on the title bar, window
								//  will be maximized if maximizable.

		// Parent element
		inject:			null,			// Element to inject window into

		// Inner content
		url:			null,			// URL to load content from
		data:			null,			// data to pass when requesting
		method:			"inline",		// Method in which to load content, options: get,post,xhr,iframe,frame,inline,html,text,plain
		content:		"&nbsp;",		// HTML/TEXT content to inject for content

		// Effects (not functional)
		effects:		true,			// use Effects? Must have Fx library to use

		// Position
		center:			true,			// Center window on screen
		'top':			null,			// Absolute position from TOP
		bottom:			null,			// Absolute position from BOTTOM
		left:			null,			// Absolute position from LEFT
		right:			null			// Absolute position from RIGHT
	},

	/**
	 * Start the creation of a new window
	 **/
	initialize: function(options) {
		this.setOptions(options);

		if (this.options.id == null)
			this.options.id = "espresso_win_" + Espresso.WindowCount;

		// make sure ID is not used yet
		if ($(this.options.id)) {
			alert("Element ID:\""+this.options.id+"\" already exists in DOM.");
			return false;
		}

		// Set defaults and some basic variables
		this.iframe		= false;
		this.isMinimized	= false;
		this.isMaximized	= false;
		this.isVisible		= false;
		this.isInjected		= false;
		this.isPositioned	= false;
		this.isMoved		= false;

		if (this.options.alwaysInDock == null) {
			if (Espresso.hasDock) {
				this.options.alwaysInDock = Espresso.Active.Dock.options.alwaysShow;
			} else {
				this.options.alwaysInDock = false;
			}
		}

		if (this.options.dockTitle == null) {
			var titleText = this.options.title;
			this.options.dockTitle = titleText.substring(0,13) + (titleText.length > 13 ? '...' : '');
		}

		this.options.shadowOffset = this.options.shadowWidth * 2
		this.HeaderFooterShadow = this.options.headerHeight + this.options.footerHeight + this.options.shadowOffset;

		// If we can't use effects, don't try to
		if (typeof Fx == 'undefined')
			this.options.effects = false;

		// If we don't have the scrollbar class, we can't use css scrollbars
		if (typeof Espresso.Scrollbar == 'undefined')
			this.options.cssScrollbar = false;

		// get parent
		if (!$(this.options.inject)) {
			if (this.options.useDesktop && Espresso.hasDesktop)
				this.options.inject = $(Espresso.Active.Desktop.getDesktop());
			else
				this.options.inject = document.body || $E("body");
		}

		// Get window's position to use
		if (this.options.center) {
			if (this.options.inject.tagName.toLowerCase() == "body") {
				this.options.top = (Window.getHeight()-this.options.height)/2;
				this.options.left = (Window.getWidth()-this.options.width)/2;
			} else {
				this.options.top = (this.options.inject.getHeight()-this.options.height)/2;
				this.options.left = (this.options.inject.getWidth()-this.options.width)/2;
			}
			if (this.options.top<0) this.options.top = 0;
			if (this.options.left<0) this.options.left = 0;
		} else {
			if (this.options.top == null && this.options.bottom == null)
				this.options.top = $random(0, this.options.inject.getHeight()-this.options.height);
			if (this.options.left == null && this.options.right == null)
				this.options.left = $random(0, this.options.inject.getWidth()-this.options.width);
		}

		// create window
		this.create();

		// Part of fix for scrollbar issues in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			this.container.setStyle("position", "fixed");	
		}
		
		// Set window title
		this.setTitle(this.options.title);

		// Set window content
		this.setContent({
			method: this.options.method,
			url: this.options.url,
			data: this.options.data,
			content: this.options.content
		});

		// Set scrollbars, always use 'hidden' for iframe windows
		this.elements.contentWrapper.setStyles({
			'overflow': this.options.scrollbars && !this.iframe && !this.options.cssScrollbar ? 'auto' : 'hidden',
			'background': this.options.bgColor
		});

		// Set content padding
		this.elements.content.setStyles({
			'padding-top': this.options.paddingVertical,
			'padding-bottom': this.options.paddingVertical,
			'padding-left': this.options.paddingHorizontal,
			'padding-right': this.options.paddingHorizontal
		});

		// Attach events
		this.attachEvents();

		// Add window to Global Windows
		this.windowNumber = Espresso.WindowCount;
		Espresso.WindowsByNumbers[this.windowNumber] = Espresso.Windows.Windows[this.options.id] = this;
		Espresso.WindowCount++;

		// Make a default zIndex
		this.zIndex = Espresso.indexLevel;

		// Add event to global window resize
		window.addEvent('resize', this.resize.bindWithEvent(this));

		return this;
	},

	/**
	 * Attach available events to elements
	 *
	 * Private Function
	 **/
	attachEvents: function() {
		this.attachResizable();

		if(this.elements.closeButton) {
			this.elements.closeButton.addEvent('click',
				function() {
					this.close();
				}.bindWithEvent(this)
			);
		}
		
		if (!this.options.modal) {
			this.elements.container.addEvent('click',
				function() {
					this.focus();
				}.bindWithEvent(this)
			);
		}
		
		if(this.elements.minimizeButton) {
			this.elements.minimizeButton.addEvent('click',
				function() {
					if (this.isMinimize) {
						this.restoreMinimized(true);
						this.elements.minimizeButton.setProperty('title', 'Minimize');
					} else {
						this.minimize();
						this.elements.minimizeButton.setProperty('title', 'Restore');
					}
				}.bindWithEvent(this)
			);
		}
		
		if(this.elements.maximizeButton) {
			this.elements.maximizeButton.addEvent('click',
				function() { 
					if(this.isMaximized) {
						this.restoreMaximize();
						this.elements.maximizeButton.setProperty('title', 'Maximize');
					} else {
						this.maximize(); 
						this.elements.maximizeButton.setProperty('title', 'Restore');
					}
				}.bindWithEvent(this)
			);
		}

		this.attachDraggable();

		return this;
	},

	/**
	 * Create window elements
	 *
	 * Private function
	 **/
	create: function() {
		this.elements = {};

		// Create window div
		this.elements.container = this.container = new Element('div', {
			'class': this.options['class'],
			'id':    this.options.id,
			'styles': {
				'width':   this.options.width,
				'height':  this.options.height,
				'display': 'block' // must be so!
			}
		});

		if (Browser.Engine.trident4){
			this.elements.zIndexFix = new Element('iframe', {
				'class': 'zIndexFix',
				'scrolling': 'no',
				'marginWidth': 0,
				'marginHeight': 0,
				'src': '',
				'id': this.options.id + '_zIndexFix'
			}).injectInside(this.container);
		}

		this.elements.overlay = new Element('div', {
			'class': this.options['class'] + 'Overlay',
			'id': this.options.id + '_overlay'
		}).injectInside(this.container);
		
		this.elements.titleBar = new Element('div', {
			'class': this.options['class'] + 'Titlebar',
			'id': this.options.id + '_titleBar',
			'styles': {
				'cursor': this.options.draggable ? 'move' : 'default'
			}
		}).injectTop(this.elements.overlay);

		if (this.options.dbClickMaximize && this.options.maximizable) {
			this.elements.titleBar.addEvent('dblclick', function(event) {
				if (this.isMaximized) {
					this.restoreMaximize();
				} else {
					this.maximize();
				}
			}.bindWithEvent(this))
		}

		this.elements.title = new Element('h3', {
			'class': this.options['class'] + 'Title',
			'id': this.options.id + '_title'
		}).injectInside(this.elements.titleBar);

		this.elements.contentBorder = new Element('div', {
			'class': this.options['class'] + 'ContentBorder',
			'id': this.options.id + '_contentBorder'
		}).injectInside(this.elements.overlay);			
		
		this.elements.contentWrapper = new Element('div', {
			'class': this.options['class'] + 'ContentWrapper',
			'id': this.options.id + '_contentWrapper',
			'styles': {
				'width': this.options.width + 'px',
				'height': this.options.height + 'px'
			}
		}).injectInside(this.elements.contentBorder);

		// Create content element
		this.elements.content = new Element('div', {
			'class': this.options['class'] + 'Content',
			'id': this.options.id + '_content'
		}).injectInside(this.elements.contentWrapper);

		// Apply CSS Scrollbars if we can
		if (this.options.cssScrollbar) {
			this.scrollbar = new Espresso.Scrollbar(this.elements.content, this.options.cssScrollbarOptions);
		}

		// Create canvas
		this.elements.canvas = new Element('canvas', {
			'class': this.options['class'] + 'Canvas',
			'width': 1,
			'height': 1,
			'id': this.options.id + '_canvas'
		}).injectInside(this.elements.container);
		
		// Dynamically initialize canvas using excanvas. This is only required by IE
		if (Browser.Engine.trident && Espresso.ieSupport == 'excanvas') {
			G_vmlCanvasManager.initElement(this.elements.canvas);
			this.elements.canvas = this.elements.container.getElement('.' + this.options['class'] + 'Canvas');
		}

		// Insert resize handles
		if (this.options.resizable){
			this.elements.resizeHandle = new Element('div', {
				'class': this.options['class'] + 'ResizeHandle',
				'id': this.options.id + '_resizeHandle'
			}).injectAfter(this.elements.overlay);

			if (Browser.Engine.trident)
				this.elements.resizeHandle.setStyle('zIndex', 2);
		}
		
		// Insert mochaTitlebar controls
		this.elements.controls = new Element('div', {
			'class': this.options['class'] + 'Controls',
			'id': this.options.id + '_controls'
		}).injectAfter(this.elements.overlay);
		
		//Insert close button
		if (this.options.closable){
			this.elements.closeButton = new Element('div', {
				'class': this.options['class'] + 'Close',
				'title': 'Close Window',
				'id': this.options.id + '_closeButton'
			}).injectInside(this.elements.controls);
		}				

		//Insert maximize button
		if (this.options.maximizable){
			this.elements.maximizeButton = new Element('div', {
				'class': this.options['class'] + 'MaximizeToggle',
				'title': 'Maximize',
				'id': this.options.id + '_maximizeButton'
			}).injectInside(this.elements.controls);
		}

		//Insert minimize button
		if (this.options.minimizable){
			this.elements.minimizeButton = new Element('div', {
				'class': this.options['class'] + 'MinimizeToggle',
				'title': 'Minimize',
				'id': this.options.id + '_minimizeButton'
			}).injectInside(this.elements.controls);
		}
		
		//Insert canvas
		this.elements.canvasIcon = new Element('canvas', {
			'class': this.options['class'] + 'LoadingIcon',
			'width': 18,
			'height': 18,
			'id': this.options.id + '_canvasIcon'
		}).injectBottom(this.elements.container);	

		// Dynamically initialize canvas using excanvas. This is only required by IE
		if (Browser.Engine.trident && Espresso.ieSupport == 'excanvas') {
			G_vmlCanvasManager.initElement(this.elements.canvasIcon);
			this.elements.canvasIcon = this.elements.container.getElement('.' + this.options['class'] + 'LoadingIcon');			
		}

		if (Browser.Engine.trident) {
			this.elements.controls.setStyle('zIndex', 2)
			this.elements.overlay.setStyle('zIndex', 2)
		}

		// For Mac Firefox 2 to help reduce scrollbar bugs in that browser
		if (Browser.Platform.mac && Browser.Engine.gecko)
			this.elements.overlay.setStyle('overflow', 'auto');

		this.setControlsWidth();

		// Create dock button if needed
		if (Espresso.hasDock && this.options.useDock) {
			this.elements.dockButton = new Element('li', {
				'id': this.options.id + '_dockButton',
				'class': this.options['class'] + 'DockButton',
				'title': this.options.dockTitle,
				'style': 'display:none;'
			})
				.setStyle('cursor', (Browser.Engine.trident ? 'hand' : 'pointer'))
				.addClass('dockButton')
				.adopt(
					new Element('span')
						.addEvent('selectstart', function(event){
							new Event(event).stop();
							return false;
						})
						.setHTML(this.options.dockTitle)
				)
				.addEvent('selectstart', function(event) {
					new Event(event).stop();
					return false;
				})
				.addEvent('click', function(event) {
					if (this.isMinimized) {
						this.restoreMinimized(true);
						this.focus();
					} else {
						if (Espresso.FocusedWindowNumber == this.windowNumber) {
							this.minimize();
						} else {
							this.focus();
						}
					}
				}.bindWithEvent(this))
				.injectInside(Espresso.Active.Dock.getDock());
		}
		return this;
	},

	/**
	 * Resize control container element
	 *
	 * Private function
	 **/
	setControlsWidth: function(){
		var controlWidth = 14;
		var marginWidth = 5;
		this.ControlsWidth = 0;

		if (this.options.minimizable) {
			this.ControlsWidth += (marginWidth + controlWidth);
		}

		if (this.options.maximizable) {
			this.ControlsWidth += (marginWidth + controlWidth);
			this.elements.maximizeButton.setStyle('margin-left', marginWidth);
		}

		if (this.options.closable) {
			this.ControlsWidth += (marginWidth + controlWidth);
			this.elements.closeButton.setStyle('margin-left', marginWidth);
		}

		this.elements.controls.setStyle('width', this.ControlsWidth);
	},

	/**
	 * Display loading icon while we're processing a
	 * XHR or iFrame request for content.
	 **/
	showLoadingIcon: function() {
		$(this.elements.canvasIcon).setStyles({
			'display': 'block'
		});		
		var t = 1;
		var iconAnimation = function(canvas){
			var ctx = $(this.elements.canvasIcon).getContext('2d');
			ctx.clearRect(0, 0, 18, 18); // Clear canvas
			ctx.save();
			ctx.translate(9, 9);
			ctx.rotate(t*(Math.PI / 8));	
			var color = 0;
			for (var i=0; i < 8; i++){ // Draw individual dots
				color = Math.floor(255 / 8 * i);
				ctx.fillStyle = "rgb(" + color + "," + color + "," + color + ")";
				ctx.rotate(-Math.PI / 4);
				ctx.beginPath();
				ctx.arc(0, 7, 2, 0, Math.PI*2, true);
				ctx.fill();
			}
    			ctx.restore();
			t++;
		}.bind(this);

		this.elements.canvasIcon.iconAnimation = iconAnimation.periodical(125, this);
	},

	/**
	 * Hide the loading icon
	 **/
	hideLoadingIcon: function() {
		$(this.elements.canvasIcon).setStyle('display', 'none');
		$clear(this.elements.canvasIcon.iconAnimation);
	},

	/**
	 * Set the window's opacity
	 **/
	setOpacity: function(opacity) {
		this.options.opacity = opacity;
		this.container.setOpacity(opacity);
		return this;
	},

	/**
	 * Get the window's main ID
	 **/
	getID: function() {
		return this.options.id;
	},

	/**
	 * Return windows zIndex
	 **/
	getZIndex: function() {
		return this.zIndex;
	},

	/**
	 * Set the windows zIndex
	 **/
	setZIndex: function(zIndex) {
		this.zIndex = zIndex;
		this.container.setStyle('zIndex', this.zIndex);
		return this;
	},

	/**
	 * Return the number in which the window was created.
	 * First DOM window will be 1, second 2, and so on...
	 *
	 * Use with Espresso.WindowsByNumbers[windowNumber]
	 **/
	getWindowNumber: function() {
		 return this.windowNumber;
	},

	/**
	 * Get the element this window was inject into.
	 **/
	getDesktop: function() {
		return $(this.options.inject);
	},

	/**
	 * Set the window's title
	 **/
	setTitle: function(title) {
		if (title == null) title = "&nbsp;"
		this.elements.title.setHTML(title);
		return this;
	},

	/**
	 * Retrieve the window's title
	 **/
	getTitle: function() {
		return this.elements.title.getHTML();
	},

	/**
	 * Retrieve an element within the window
	 **/
	getElement: function(element) {
		return this.elements[element];
	},

	/**
	 * Get the window's content
	 * @return (element) Content Element
	 *
	 * Example Methods:
	 * 	getContent().setHTML("<h1>Hello</h1><p>Hello world</p>");
	 **/
	getContent: function() {
		return (this.iframe ? $(this.elements.iframe) : $(this.elements.content));
	},

	/**
	 * Return the size(s) of the entire window
	 **/
	getSize: function() {
		return this.elements.container.getSize();
	},

		    
	/**
	 * Set the inner content of a window.
	 *
	 * Methods:
	 * 	Pass an element:
	 *		var el = new Element('div', {
	 *      		id: 'this_element'
	 * 		})
	 * 		setContent(el); // 'el' will be injected into content
	 *
	 * 	Pass plain text:
	 * 		setContent('hello world');
	 *
	 * 	Pass options:
	 * 		setContent({
	 * 			method: 'xhr',  // can also pass 'post' or 'get' to specify method, default: 'get'
	 * 			data: { // use data to pass POST or GET variables
	 * 				'username': get_cookie('username')
	 * 			},
	 * 			url: '/this/page.html'
	 * 		});
	 *
	 * 		setContent({
	 * 			method: 'iframe', // alias: frame
	 * 			url: 'http://www.google.com/'
	 * 		});
	 *
	 * 		setContent({
	 * 			method: 'inline', // alias: html
	 * 			content: '<h1>How is the world?</h1>'
	 * 		});
	 *
	 * 		setContent({
	 * 			method: 'text', // alias: plain
	 * 			content: 'Hello world'
	 * 		});
	 *
	 * @return 'this'
	 **/
	setContent: function(options) {
		// allow passing of a HTML element
		if($type(options) == 'element') {
			this.elements.content.empty().adopt(options);
			this.fireEvent('onContentLoaded');
			return this;
		}

		// allow passing of only TEXT/HTML
		if($type(options) == 'string') {
			this.elements.content.empty().setHTML(options);
			this.fireEvent('onContentLoaded');
			return this;
		}

		options = $extend({
			url:		null,
			data:		null,
			method:		'inline',
			content:	null,
			evalScripts:	true
		}, options);

		options.method = options.method.replace(/\./, '').toLowerCase();

		// Add content to window		
		switch(options.method) {
			case 'xhr':
			case 'get':
			case 'post':
				new Request({
					url: options.url,
					method: (options.method=='xhr'?'get':options.method),
					data: options.data,
					onRequest: function(){
						this.showLoadingIcon();
					}.bindWithEvent(this),
					onFailure: function(){
						this.elements.content.setHTML('<p><strong>Error Loading XMLHttpRequest</strong></p><p>Make sure all of your content is uploaded to your server, and that you are attempting to load a document from the same domain as this page. XMLHttpRequests will not work on your local machine.</p>');
						this.hideLoadingIcon.delay(150, this);
					}.bindWithEvent(this),
					onSuccess: function(responseText, responseXML) {						
						this.elements.content.setHTML(responseText);
						this.hideLoadingIcon.delay(150, this);
						this.fireEvent('onContentLoaded', arguments);
					}.bindWithEvent(this)
				}).get();
				break;

			case 'request':
			case 'requesthtml':
				new Request.HTML({
					url: options.url,
					method: (options.method=='xhr'?'get':options.method),
					data: options.data,
					onRequest: function(){
						this.showLoadingIcon();
					}.bindWithEvent(this),
					onFailure: function(){
						this.elements.content.setHTML('<p><strong>Error Loading XMLHttpRequest</strong></p><p>Make sure all of your content is uploaded to your server, and that you are attempting to load a document from the same domain as this page. XMLHttpRequests will not work on your local machine.</p>');
						this.hideLoadingIcon.delay(150, this);
					}.bindWithEvent(this),

					update: this.elements.content,
					evalScripts: options.evalScripts,
					onSuccess: function(tree, elements, html, javascript) {						
						//this.elements.content.setHTML(response);
						this.hideLoadingIcon.delay(150, this);
						this.fireEvent('onContentLoaded', arguments);
					}.bindWithEvent(this)
				}).get();
				break;

			case 'frame':
			case 'iframe':
				if (options.url == null) { break; }
				this.iframe = true;
				this.elements.iframe = new Element('iframe', {
					'id': this.options.id + '_iframe', 
					'class': this.options['class'] + 'Iframe',
					'src': options.url,
					'marginwidth':  0,
					'marginheight': 0,
					'frameBorder':  0,
					'scrolling':    'auto'
				}).injectInside(this.elements.content);

				// Add onload event to iframe so we can stop the loading icon and run onContentLoaded()
				this.elements.iframe.addEvent('load', function(e) {
					this.hideLoadingIcon.delay(150, this);
					this.fireEvent('onContentLoaded');
				}.bindWithEvent(this));

				this.showLoadingIcon();

				// Set window scrollbars, Iframes have their own scrollbars and padding.
				this.options.scrollbars = false;
				this.options.paddingVertical = 0;
				this.options.paddingHorizontal = 0;
				break;

			case 'text':
			case 'plain':
				this.elements.content.setText(options.content);
				this.fireEvent('onContentLoaded');
				break;

			case 'html':
			case 'inline':
			default:
				if ($type(options.content) == 'element') {
					this.elements.content.adopt(options.content);
				} else {
					this.elements.content.setHTML(options.content);
				}
				this.fireEvent('onContentLoaded');
				break;
		}

		return this;
	},

	/**
	 * Resize window elements
	 **/
	draw: function(shadows) {
		this.elements.contentBorder.setStyles({
			'width': this.elements.contentWrapper.offsetWidth
		});			

		// Resize iframe when window is resized
		if (this.elements.iframe) {
			this.elements.iframe.setStyles({
				'height': this.elements.contentWrapper.offsetHeight
			});
		}

		// Get height and width of window content
		var EspressoHeight = this.elements.contentWrapper.getStyle('height').toInt() + this.HeaderFooterShadow;
		var EspressoWidth = this.elements.contentWrapper.getStyle('width').toInt() + this.options.shadowOffset;
			
		this.elements.overlay.setStyle('height', EspressoHeight);
		this.container.setStyle('height', EspressoHeight);
		
		// If opera height and width must be set like this, when resizing:
		this.elements.canvas.height = Browser.Engine.webkit ? 4000 : EspressoHeight;
		this.elements.canvas.width = Browser.Engine.webkit ? 2000 : EspressoWidth;
		
		// Part of the fix for IE6 select z-index bug and FF on Mac scrollbar z-index bug
		if ( Browser.Engine.trident4 ){
			this.elements.zIndexFix.setStyles({
				'width': EspressoWidth,
				'height': EspressoHeight
			})
		}

		// Set width		
		this.container.setStyle('width', EspressoWidth);
		this.elements.overlay.setStyle('width', EspressoWidth); 
		this.elements.titleBar.setStyles({
			'width': EspressoWidth - this.options.shadowOffset,
			'height': this.options.headerHeight
		});	

		// Draw shapes
		var ctx = this.elements.canvas.getContext('2d');
		var dimensions = document.getCoordinates();
		ctx.clearRect(0, 0, dimensions.width, dimensions.height);
		
		// This is the drop shadow. It is created onion style with three layers
		if ( shadows != false ) {
			this.roundedRect(ctx, 0, 0, EspressoWidth, EspressoHeight, this.options.cornerRadius, [0, 0, 0], 0.06); 
			this.roundedRect(ctx, 1, 1, EspressoWidth - 2, EspressoHeight - 2, this.options.cornerRadius, [0, 0, 0], 0.08);
			this.roundedRect(ctx, 2, 2, EspressoWidth - 4, EspressoHeight - 4, this.options.cornerRadius, [0, 0, 0], 0.3); 
		}
		
		// Window body
		this.bodyRoundedRect(ctx, 3, 2, EspressoWidth - this.options.shadowOffset, EspressoHeight - this.options.shadowOffset);

		// Window header
		this.topRoundedRect(ctx, 3, 2,  EspressoWidth - this.options.shadowOffset, this.options.headerHeight, this.options.cornerRadius);

		// Calculate X position for controlbuttons
		this.closebuttonX = EspressoWidth - (this.options.closable ? 15 : -4);
		this.maximizebuttonX = this.closebuttonX - (this.options.maximizable ? 19 : 0);
		this.minimizebuttonX = this.maximizebuttonX - (this.options.minimizable ? 19 : 0);
		
		if (this.options.closable)
			this.closebutton(ctx, this.closebuttonX, 15, this.options.closeColor, 1.0);

		if (this.options.maximizable)
			this.maximizebutton(ctx, this.maximizebuttonX, 15, this.options.maximizeColor, 1.0);

		if (this.options.minimizable)
			this.minimizebutton(ctx, this.minimizebuttonX, 15, this.options.minimizeColor, 1.0); // Minimize

		if (this.options.resizable) 
			this.triangle(ctx, EspressoWidth - 20, EspressoHeight - 20, 12, 12, this.options.resizableColor, 1.0); // Resize handle
		
		// Invisible dummy object. The last element drawn is not rendered consistently while resizing in IE6 and IE7.
		this.triangle(ctx, 0, 0, 10, 10, this.options.resizableColor, 0); 

	},

	// Window body
	bodyRoundedRect: function(ctx, x, y, width, height){
		ctx.fillStyle = 'rgba(' + this.options.footerBgColor.join(',') + ', 100)';
		ctx.beginPath();
		ctx.moveTo(x, y + this.options.cornerRadius);
		ctx.lineTo(x, y + height - this.options.cornerRadius);
		ctx.quadraticCurveTo(x, y + height, x + this.options.cornerRadius, y + height);
		ctx.lineTo(x + width - this.options.cornerRadius, y + height);
		ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - this.options.cornerRadius);
		ctx.lineTo(x + width, y + this.options.cornerRadius);
		ctx.quadraticCurveTo(x + width, y, x + width - this.options.cornerRadius, y);
		ctx.lineTo(x + this.options.cornerRadius, y);
		ctx.quadraticCurveTo(x, y, x, y + this.options.cornerRadius);
		ctx.fill(); 
	},	
	roundedRect: function(ctx, x, y, width, height, radius, rgb, a){
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.beginPath();
		ctx.moveTo(x, y + radius);
		ctx.lineTo(x, y + height - radius);
		ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
		ctx.lineTo(x + width - radius, y + height);
		ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
		ctx.lineTo(x + width, y + radius);
		ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
		ctx.lineTo(x + radius, y);
		ctx.quadraticCurveTo(x, y, x, y + radius);
		ctx.fill(); 
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
	},
	// Resize handle
	triangle: function(ctx, x, y, width, height, rgb, a){
		ctx.beginPath();
		ctx.moveTo(x + width, y);
		ctx.lineTo(x, y + height);
		ctx.lineTo(x + width, y + height);
		ctx.closePath();
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
	},
	drawCircle: function(ctx, x, y, diameter, rgb, a){
		// Circle
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, diameter, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
	},
	maximizebutton: function(ctx, x, y, rgb, a){ // This could reuse the drawCircle method above
		// Circle
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, 7, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
		// X sign
		ctx.beginPath();
		ctx.moveTo(x, y - 4);
		ctx.lineTo(x, y + 4);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x - 4, y);
		ctx.lineTo(x + 4, y);
		ctx.stroke();
	},
	closebutton: function(ctx, x, y, rgb, a){ // This could reuse the drawCircle method above
		// Circle
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, 7, 0, Math.PI*2, true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
		// Plus sign
		ctx.beginPath();
		ctx.moveTo(x - 3, y - 3);
		ctx.lineTo(x + 3, y + 3);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x + 3, y - 3);
		ctx.lineTo(x - 3, y + 3);
		ctx.stroke();
	},
	minimizebutton: function(ctx, x, y, rgb, a){ // This could reuse the drawCircle method above
		// Circle
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(x,y,7,0,Math.PI*2,true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
		// Minus sign
		ctx.beginPath();
		ctx.moveTo(x - 4, y);
		ctx.lineTo(x + 4, y);
		ctx.stroke();
	},

	/**
	 * Attach event: Resize
	 **/
	attachResizable: function(){
		if(!this.options.resizable)
			return this;

		this.elements.contentWrapper.makeResizable({
			handle: this.elements.resizeHandle,
			modifiers: {
				x: 'width',
				y: 'height'
			},
			limit: (this.options.resizelimit ? {
				x: (this.options.maxWidth != null ? [this.options.minWidth, this.options.maxWidth] : [this.options.minWidth]),
				y: (this.options.maxHeight != null ? [this.options.minHeight, this.options.maxHeight] : [this.options.minHeight])
			} : false),
			onStart: function() {
				if (this.isMinimized)
					this.restoreMinimized(false);
				if (this.elements.iframe)
					this.elements.iframe.setStyle('visibility', 'hidden');
			}.bindWithEvent(this),
			onDrag: function() {
				this.draw();
				this.fireEvent('onResizeStart', this);
			}.bindWithEvent(this),
			onComplete: function() {
				if (this.elements.iframe)
					this.elements.iframe.setStyle('visibility', 'visible');
				this.isMaximized = false;
				this.isMinimized = false;
				this.fireEvent('onResize', this);
			}.bindWithEvent(this)
		});
		return this;
	},

	/**
	 * Attach event: Drag
	 *
	 * Private function
	 **/
	attachDraggable: function(){
		if (!this.options.draggable)
			return this;

		try { // IE Bug, unkown reason.
		this.dragMove = new Drag.Move($(this.container), {
			container: this.options.inject,
			handle: this.elements.titleBar,
			onStart: function() {
				this.isMoved = true;
				this.focus();
				if (this.iframe)
					this.elements.iframe.setStyle('visibility', 'hidden');
				this.fireEvent('onDragStart', this);
			}.bindWithEvent(this),
			onComplete: function() {
				if (this.iframe)
					this.elements.iframe.setStyle('visibility', 'visible');
				this.fireEvent('onDrag', this);
			}.bindWithEvent(this)
		});
		} catch(e) {
			//alert(e);
		}

		$(document.body).addEvent('mouseleave',
			function() {
				if(typeof this.dragMove == 'object')
					this.dragMove.stop();
			}.bindWithEvent(this)
		);

		return this;
	},

	/**
	 * Focus this window (makes highest zIndex[ed] element)
	 **/
	focus: function(onFocus, zIndex){
		// Only focus when needed
		if (zIndex == null) {
			if (Espresso.indexLevel == this.container.getStyle('zIndex') || Espresso.FocusedWindowNumber == this.windowNumber) {
				Espresso.FocusedWindowNumber = this.windowNumber;
				if (Espresso.hasDock && this.options.useDock && !this.elements.dockButton.hasClass('focused')) {
					this.elements.dockButton.addClass('focused');
				}
				if (Espresso.indexLevel > this.container.getStyle('zIndex')) {
					Espresso.indexLevel++;
					this.zIndex = Espresso.indexLevel;
					this.container.setStyle('zIndex', this.zIndex);
				}
				return this;
			}
		}

		if (zIndex != null) {
			this.zIndex = zIndex;
		} else {
			Espresso.indexLevel++;
			this.zIndex = Espresso.indexLevel;
		}
		this.container.setStyle('zIndex', this.zIndex);

		if (Espresso.hasDock && this.options.useDock) {
			$$('.dockButton').removeClass('focused');
			
			if ($(this.elements.dockButton))
				this.elements.dockButton.addClass('focused');

			if (Espresso.LastFocused != this.windowNumber)
				Espresso.LastFocused = Espresso.FocusedWindowNumber;

			if (Espresso.FocusedWindowNumber != this.windowNumber)
				Espresso.FocusedWindowNumber = this.windowNumber;
		}

		Espresso.FocusedWindow = this;

		this.fireEvent('onFocus', this);
		return this;
	},

	/**
	 * Show window
	 *
	 * @arguments
	 *   modal - is this a modal window
	 *   element - (element) Element to inject window into, if none provided,
	 *    will use options.inject element.
	 **/
	show: function(modal, element) {
		if (this.isVisible) return this;

		if (modal != null && modal != this.options.modal) this.options.modal = !this.options.modal;

		// if this is the first time we've shown this window
		if (!this.isInjected) {
			if (!this.isPositioned) {
				var positionSettings = {};
				if (this.options.top != null)
					positionSettings.top = this.options.top.toInt() + 'px';
				else
					positionSettings.bottom = this.options.bottom.toInt() + 'px';

				if (this.options.left != null)
					positionSettings.left = this.options.left.toInt() + 'px';
				else
					positionSettings.right = this.options.right.toInt() + 'px';

				if (this.options.effects) {
					var positionMorph = new Fx.Morph(this.container, {
						'duration': 300,
						'onComplete': function() {
							this.fireEvent('onShow', this);
						}.bindWithEvent(this)
					});
					positionMorph.start(positionSettings);
				} else {
					this.container.setStyles(positionSettings);
					this.fireEvent('onShow', this);
				}
			}

			if (!this.options.modal && this.options.useDock && this.options.alwaysInDock) {
				this.elements.dockButton.setStyle('display', 'block');
			}

			this.container.injectInside($(element) ? $(element) : $(this.options.inject));
			this.draw();
		} else {
			this.fireEvent('onShow', this);
		}

		if (this.isMinimized) {
			this.restoreMinimized(true);
			this.isMinimized = false;
		}

		this.setOpacity(this.options.opacity);
		this.container.setStyle('display', 'block');

		this.isInjected	= true;
		this.isVisible	= true;
		this.isClosing	= false;

		if ($(this.elements.dockButton) && $(this.elements.dockButton).getStyle('display') == 'none')
			this.elements.dockButton.setStyle('display', 'block');

		return this;
	},

	/**
	 * Close the window
	 **/
	close: function() {
		// If window is already closing, don't re-close
		if (this.isClosing)
			return this;

		// Say window is in closing process
		this.isClosing = true;

		// onClose Event
		this.fireEvent('onClose', this);

		// Hide or destory window
		if (this.options.destroyOnClose) {
			this.destroy();
		} else {
			this.hide();
		}

		// Say window is no longer visible
		this.isVisible	= false;

		return this;
	},

	/**
	 * Hide the window from the user
	 **/
	hide: function() {
		this.isVisible = false;

		// To avoid bug on scrolling bar
		this.oldStyle = this.elements.content.getStyle('overflow') || "auto";
		this.elements.content.setStyle('overflow', 'hidden');

		if (this.options.effects) {
			// Redraws IE windows without shadows since IE messes up canvas alpha when you change element opacity
			if (Browser.Engine.trident) this.draw();

			var hideMorph = new Fx.Morph(this.container, {
				duration: 250,
				onComplete: function(){
					if (this.isClosing) {
						this.fireEvent('onCloseComplete', this);
						this.isClosing = false;
					}
					this.container.setStyle('display', 'none');
				}.bindWithEvent(this)
			});
			hideMorph.start({
				'opacity': .4
			});
		} else {
			this.container.setStyle('display', 'none');
		}

		if ($(this.elements.dockButton))
			this.elements.dockButton.setStyle('display', 'none');

		// onHide Event
		this.fireEvent('onHide', this);
		return this;
	},

	/**
	 * Remove the window from the DOM
	 **/
	destroy: function() {
		if (this.options.effects) {
			// Redraws IE windows without shadows since IE messes up canvas alpha when you change element opacity
			if (Browser.Engine.trident) this.draw();

			var hideMorph = new Fx.Morph(this.container, {
				duration: 250,
				onComplete: function(){
					if (this.isClosing) {
						this.fireEvent('onCloseComplete', this);
					}

					this.container.setStyle('display', 'none');
					this.container.destroy();
					this.fireEvent('onDestroy', this);
				}.bindWithEvent(this)
			});
			hideMorph.start({
				'opacity': .4
			});
		} else {
			this.container.setStyle('display', 'none');
			this.container.destroy();
		}

		if ($(this.elements.dockButton))
			this.elements.dockButton.destroy();

		return this; // useless now though
	},

	/**
	 * Maximize a window
	 **/
	maximize: function() {
		// If window is maximized, don't do anything
		if (this.isMaximized)
			return this.restoreMaximize();

		// Say window is now maximized
		this.isMaximized = true;

		// Save original position, width and height
		this.container_oldTop = this.container.getStyle('top');
		this.container_oldLeft = this.container.getStyle('left');
		this.contentWrapper_oldWidth = this.elements.contentWrapper.getStyle('width');
		this.contentWrapper_oldHeight = this.elements.contentWrapper.getStyle('height');

		// Hide iframe if exists 
		if (this.iframe)
			this.elements.setStyle('visibility', 'hidden');

		// Get window size
		var windowDimensions = document.getCoordinates();

		// Run effect, or not...
		if (!this.options.effects){	
			this.container.setStyles({
				'top': -this.options.shadowWidth,
				'left': -this.options.shadowWidth
			});
			this.elements.contentWrapper.setStyles({
				'height': windowDimensions.height - this.options.headerHeight - this.options.footerHeight,
				'width':  windowDimensions.width
			});			
			this.draw();

			// Show iframe again
			if (this.iframe) {
				this.elements.iframe.setStyle('visibility', 'visible');
			}

			this.fireEvent('onResizeStart', this).fireEvent('onResize', this).callChain();
		}
		else {
			var maximizeMorph = new Fx.Morph(this.container, {
				'duration': 200,
				'onComplete': function(){
					this.elements.contentWrapper.setStyles({
						'height': (windowDimensions.height - this.options.headerHeight - this.options.footerHeight),
						'width':  windowDimensions.width
					});
					this.draw();

					// Show iframe again
					if (this.iframe) {
						this.elements.iframe.setStyle('visibility', 'visible');
					}

					this.fireEvent('onResizeStart', this).fireEvent('onResize', this).callChain();
				}.bindWithEvent(this)
			});
			maximizeMorph.start({
				'top':  -this.options.shadowWidth, // Takes shadowWidth into account
				'left': -this.options.shadowWidth  // Takes shadowWidth into account
			});
		}

		// onMaximize Event
		this.fireEvent('onMaximize', this);
		return this;
	},

	/**
	 * Un-maximize a window
	 **/
	restoreMaximize: function() {
		// If window is not maximised, don't try to unmaximzie it
		if (!this.isMaximized)
			return this;

		// Say window is no longer maximized
		this.isMaximized = false;

		// Hide iframe
		if (this.iframe)
			this.elements.iframe.setStyle('visibility', 'hidden');

		// Set inner content wrapper width and height
		this.elements.contentWrapper.setStyles({
			'width':  this.contentWrapper_oldWidth,
			'height': this.contentWrapper_oldHeight
		});

		// Redraw window
		this.draw();
		
		// If we have effects, use 'em, else position window boringly
		if (!this.options.effects){	
			this.container.setStyles({
				'top': this.container_oldTop,
				'left': this.container_oldLeft
			});		
		}
		else {
			var mochaMorph = new Fx.Morph(this.container, { 
				'duration':   150,
				'onComplete': function(el){
					if (this.iframe) {
						this.elements.iframe.setStyle('visibility', 'visible');
					}
				}.bindWithEvent(this)	
			});
			mochaMorph.start({
				'top': this.container_oldTop,
				'left': this.container_oldLeft
			});
		}

		// Events
		this.fireEvent('onResizeStart', this).fireEvent('onResize', this).fireEvent('onRestoreMaximize', this).callChain();

		return this;
	},

	/**
	 * Minimize a window
	 **/
	minimize: function() {
		// If window is already minimized, then un-mimize it
		if (this.isMinimized)
			return this.restoreMinimized(true);

		// Say window is now minimized
		this.isMinimized = true;

		// Set a new window as focused
		if (Espresso.hasDock && this.options.useDock) {
			if (Espresso.FocusedWindowNumber == this.windowNumber) {
				if (Espresso.LastFocused != null) {
					if (Espresso.WindowsByNumbers[Espresso.LastFocused].getElement('dockButton').hasClass('minimized')) {
						Espresso.FocusedWindowNumber = null;
					} else {
						Espresso.WindowsByNumbers[Espresso.LastFocused].focus();
					}
				} else {
					Espresso.FocusedWindowNumber = null;
				}
				Espresso.LastFocused = this.windowNumber;
			}
			if ($(this.elements.dockButton))
				this.elements.dockButton.removeClass('focused');
		}

		// Hide iframe to remove errors
		if (this.iframe)
			this.elements.iframe.setStyle('visibility', 'hidden');

		// Fixes a scrollbar issue in Mac FF2
		if (Browser.Platform.mac && Browser.Engine.gecko){
			this.elements.contentWrapper.setStyle('overflow', 'hidden');
		}

		// If we have a dock, inject a button, else hide window content
		if (this.options.useDock && Espresso.hasDock) {
			this.container.setStyle('visibility', 'hidden');
			this.elements.dockButton.addClass('minimized');
			this.elements.dockButton.setStyle('display', 'block');
		} else {
			// Hide the window content
			this.contentWrapper_oldHeight = this.elements.contentWrapper.getStyle('height');
			this.elements.contentWrapper.setStyle('height', '0px');
			this.elements.contentWrapper.setStyle('visibility', 'hidden');
			this.draw();
		}

		// Fixes a scrollbar issue in Mac FF2.
		// Have to use timeout because window gets focused when you click on the minimize button 	
		setTimeout(function(){ this.container.setStyle('zIndex', 1); }.bind(this),100); 

		// Say window is no longer visible
		this.isVisible = false;

		// onMinmize event
		this.fireEvent('onMinimize', this);
		return this;
	},

	/**
	 * Un-minize a window
	 **/
	restoreMinimized: function(restoreHeight) {
		// If window is not minimized, don't unminmize it
		if (!this.isMinimized)
			return this;

		if (restoreHeight == null) restoreHeight = true;
		
		// Say window is no longer minimized
		this.isMinimized = false;

		// Part of Mac FF2 scrollbar fix
		if (this.options.scrollbars && !this.iframe && !this.options.cssScrollbar){ 
			this.elements.contentWrapper.setStyle('overflow', 'auto');		
		}

		// Remove from dock is there, else show content
		if (this.options.useDock && Espresso.hasDock) {
			this.container.setStyle('visibility', 'visible');
			this.elements.dockButton.removeClass('minimized');
			if (!this.options.alwaysInDock) {
				this.elements.dockButton.setStyle('display', 'none')
			}
		} else {
			if (restoreHeight)
				this.elements.contentWrapper.setStyle('height', this.contentWrapper_oldHeight);
			this.elements.contentWrapper.setStyle('visibility', 'visible');
			this.draw();
		}
		
		// Show iframe
		if (this.iframe)
			this.elements.iframe.setStyle('visibility', 'visible');
		
		// onRestoreMinimize Event
		this.fireEvent('onRestoreMinimize', this);

		// Focus on window
		this.focus();

		return this;
	},

	/**
	 * Return TRUE if window is visible,
	 * FALSE otherwise.
	 **/
	visible: function() {
		return this.isVisible;
	},

	/**
	 * Show the window, and center as well
	 **/
	showCenter: function(modal, noFocus) {
		this.setPosition({center: true});
		this.show(modal);
		if (typeof noFocus == 'undefined' || noFocus == 'undefined' || noFocus == null || noFocus == true)
			this.focus();
	},

	/**
	 * Simple position wrapper to position the window
	 *
	 * Center window method:
	 * 	win.position(); // will center within 'options.inject'
	 **/
	setPosition: function(options) {
		options = $extend({
			top:	null,
			left:	null,
			bottom:	null,
			right:	null,
			effects:this.options.effects,
			center: true // a default setting
		}, options);

		var positionSettings = {};

		// Get window's position to use
		if (options.center) {
			if (this.options.inject.tagName.toLowerCase() == "body") {
				positionSettings.top = (Window.getHeight()-this.options.height)/2;
				positionSettings.left = (Window.getWidth()-this.options.width)/2;
			} else {
				positionSettings.top = (this.options.inject.getHeight()-this.options.height)/2;
				positionSettings.left = (this.options.inject.getWidth()-this.options.width)/2;
			}
			if (positionSettings.top<0) positionSettings.top = 0;
			if (positionSettings.left<0) positionSettings.left = 0;
		} else {
			if (options.top == null && options.bottom == null) {
				positionSettings.top = $random(0, this.options.inject.getHeight()-this.container.getHeight());
			} else {
				if (options.top != null)
					positionSettings.top = options.top.toInt() + 'px';
				else
					positionSettings.bottom = options.bottom.toInt() + 'px';
			}

			if (options.left == null && options.right == null) {
				positionSettings.left = $random(0, this.options.inject.getWidth()-this.container.getWidth());
			} else {
				if (options.left != null)
					positionSettings.left = options.left.toInt() + 'px';
				else
					positionSettings.right = options.right.toInt() + 'px';
			}
		}

		if (options.effects) {
			var positionMorph = new Fx.Morph(this.container, {
				'duration': 300
			});
			positionMorph.start(positionSettings);
		} else {
			this.container.setStyles(positionSettings);
		}

		this.isPositioned = true;
		return this;
	},

	/**
	 * Returns window's position in an object containing:
	 *   top, left, bottom, right, width, height
	 **/
	getPosition: function() {
		var position = $(this.elements.container).getCoordinates();
		position.height = position.height || this.options.height;
		position.width = position.width || this.options.width;
		return position;
	},

	getContentPosition: function() {
		return $(this.elements.contentWrapper).getCoordinates();
	},

	/**
	 * Reposition and resize window on window.onresize
	 **/
	resize: function() {
		if (this.options.center && this.isMoved == false) {
			this.setPosition({center: true});
		} else {
			if (this.isMoved) {
				this.setPosition({center: false});
			}
		}
		this.draw();
	},

	/**
	 * Set the size of the window
	 **/
	setSize: function(width, height, rePosition) {
		// Hide iframe if exists
		if (this.iframe)
			this.elements.setStyle('visibility', 'hidden');

		$$(this.elements.container, this.elements.contentWrapper).setStyles({'height': height, 'width': width}); 

		if (rePosition == false && rePosition != null)
			this.draw();
		else
			this.resize();

		// Show iframe again
		if (this.iframe)
			this.elements.iframe.setStyle('visibility', 'visible');

		this.fireEvent('onResizeStart', this).fireEvent('onResize', this).callChain();
		return this;
	},

	/**
	 * Simple set destory on close wrapper
	 **/
	setDestroyOnClose: function(true_or_false) {
		if (true_or_false == null)
			true_or_false = true;
		this.options.destroyOnClose = true_or_false == false ? false : true; // needs to be bool, def: true
		return this;
	}
});
