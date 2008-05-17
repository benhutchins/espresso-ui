/* -----------------------------------------------------------------

	Script: 
		Add keyboard shortcuts easily with a simple wrapper.

		@script		Espresso.Shorcut
		@version	0.1
		@author		Benjamin Hutchins
		@date		May 16th, 2008

	Copyright:
		Copyright (c) 2008, Benjamin Hutchins <http://www.xvolter.com/>

	License:
		MIT license

   ----------------------------------------------------------------- */

/**
 *
 * Keys:
 *
 * 	key:		ascii	code (recommend you use codes)
 *
 * 	-------------------------
 * 	Special Characters:
 *	-------------------------
 * 	backspace	backspace	8
 * 	tab		tab		9
 * 	control		control		17	(used as modifier or event)
 * 	alt		alt		18	(used as modifier or event)
 * 	shift		shift		16	(used as modifier or event)
 * 	pause/break	pause		19
 * 	caps lock	capslock	20	(used as modifier or event)
 * 	esc		esc		27
 * 	space		space		32
 * 	pageUp		pageup		33
 * 	pageDown	pagedown	34
 * 	end		end		35
 * 	home		home		36
 * 	insert		insert		45
 * 	delete		delete		46
 *
 *	-------------------------
 * 	Arrow keys:
 * 	-------------------------
 * 	keyLeft		left		37
 * 	keyUp		up		38
 * 	keyRight	right		39
 * 	keyDown		down		40
 *
 * 	-------------------------
 * 	Keyboard:
 *	-------------------------
 * 	0		0		48
 * 	1		1		49
 * 	2		2		50
 * 	3		3		51
 * 	4		4		52
 * 	5		5		53
 * 	6		6		54
 * 	7		7		55
 * 	8		8		56
 * 	9		9		69
 * 	a		a		65
 * 	b		b		66
 * 	c		c		67
 * 	d		d		68
 * 	e		e		69
 * 	f		f		70
 * 	g		g		71
 * 	h		h		72
 * 	i		i		73
 * 	j		j		74
 * 	k		k		75
 * 	l		l		76
 * 	m		m		77
 * 	n		n		78
 * 	o		o		79
 * 	p		p		80
 * 	q		q		81
 * 	r		r		82
 * 	s		s		83
 * 	t		t		84
 * 	u		u		85
 * 	v		v		86
 * 	w		w		87
 * 	x		x		88
 * 	y		y		89
 * 	z		z		90
 *
 * 	[uppercase letters have shift-modifier enabled]
 *
 * 	-------------------------
 * 	Numpad (numpad lock enabled):
 * 	-------------------------
 * 	num0		0		96	numLock
 * 	num1		1		97	numLock
 * 	num2		2		98	numLock
 * 	num3		3		99	numLock
 * 	num4		4		100	numLock
 * 	num5		5		101	numLock
 * 	num6		6		102	numLock
 * 	num7		7		103	numLock
 * 	num8		8		104	numLock
 * 	num9		9		105	numLock
 * 	.		.		110	numLock
 *
 * 	-------------------------
 * 	Numpad (numpad lock disabled [can vary on keyboard]):
 * 	-------------------------
 * 	num0		-		45	(same as insert)
 * 	num1		#		35	(same as end)
 * 	num2		down		40
 * 	num3		"		34	(same as pageDown)
 * 	num4		left		37
 * 	num5				12
 * 	num6		right		39
 * 	num7		$		36	(same as home)
 * 	num8		up		38
 * 	num9		!		33	(same as pageUp)
 * 	.		delete		46	(same as delete)
 *
 * 	-------------------------
 * 	Numpad extras:
 * 	-------------------------
 *	/		/		111	numLock
 *	*		*		106	numLock
 *	-		-		109	numLock
 *	+		+		107	numLock
 *	enter		enter		13
 *
 * 	-------------------------
 *	Function keys (recommend never to use):
 *	-------------------------
 *	F1		f1		112
 * 	F2		f2		113
 * 	F3		f3		114
 * 	F4		f4		115
 * 	F5		f5		116	(highly unrecommended)
 * 	F6		f6		117
 * 	F7		f7		118
 * 	F8		f8		119
 * 	F9		f9		120
 * 	F10		f10		121
 * 	F11		f11		122
 * 	F12		f12		123
 *
 * 	-------------------------
 * 	Extras
 * 	-------------------------
 *	Command:	cmd		91	(windows key on windows, apple key on apples)
 * 	Numlock:	numlock		144
 * 	Scrolllock:	scrolllock	145
 * 
 * 	-------------------------
 *	Special characters (continued):
 *	-------------------------
 *	; :		;		186
 *	= +		=		187
 *	, <		,		188
 *	- _		-		189
 *	. >		.		190
 *	/ ?		/		191
 *	` ~		`		192
 *	\ |		\		220
 *	[ {		[		219
 *	] }		]		221
 *	' "		'		222
 * 	)		0		48	shift modifier is enabled
 * 	!		1		49	shift modifier is enabled
 * 	@		2		50	shift modifier is enabled
 * 	#		3		51	shift modifier is enabled
 * 	$		4		52	shift modifier is enabled
 * 	%		5		53	shift modifier is enabled
 * 	^		6		54	shift modifier is enabled
 * 	&		7		55	shift modifier is enabled
 * 	*		8		56	shift modifier is enabled
 * 	)		9		69	shift modifier is enabled
 *
 **/

if (typeof Espresso == "undefined") { var Espresso = {}; }

Espresso.Shortcut = new Class({
	Implements: [Options],

	options: {
		type: 'down', // either up, down or press
		modifiers: { // required modifiers
			'shift': false,		// does shift need to be held down
			'control': false,	// does ctrl need to be held down
			'alt': false,		// does alt need to be held down
			'meta': false,
			'numLock': false,	// does this have to be a numLock pad key
			'any': false		// if true, it requires all set modifiers, if false, only requires one
		},
		key: '', // you can enter a ASCII character
		code: '', // you can enter the keyCode
		onEvent: $empty,
		element: Document // element we're monitoring
	},

	initialize: function(options) {
		this.setOptions(options);

		if ($type(this.options.element) == 'string')
			this.options.element = $(this.options.element)
		else if ($type(this.options.element) == 'array')
			this.options.element = $$(this.options.element)
		else if ($type(this.options.element) == 'element')
			$empty(); // yes, i did this
		else
			this.options.element = Document;

		this.types = ['up', 'down', 'press'];
		this.type = this.options.type.toLowerCase();
		if (!this.types.contains(this.type)) this.type = 'down';

		this.options.key = this.fixAsciiKey(this.options.key);
		this.options.element.addEvent('key' + this.type, this.handleRequest.bindWithEvent(this));
	},

	handleRequest: function(event) {
		event = this.checkKey(new Event(event));
		
		// debug
		/*
		alert(
		'key     : ' + event.key + "\n" +
		'code    : ' + event.code + "\n" +
		'control : ' + event.control + "\n" + 
		'alt     : ' + event.alt + "\n" + 
		'shift   : ' + event.shift + "\n" + 
		'meta    : ' + event.meta + "\n" + 
		'num lock: ' + event.numLock
		);
		*/

		if (!this.checkModifiers(event)) return;

		if ($type(this.options.key) == 'array') {
			var hasPassed = false;
			for (var i=0; i<this.options.key.length; i++){
				if (this.options.key[i] == event.key) {
					hasPassed = true; break;
				}
			}
			if (hasPassed) return this.options.onEvent(event);
			return;
		} else {
			if (this.options.key.toLowerCase() == 'any') return this.options.onEvent(event);
			if (this.options.key != "" && event.key != this.options.key) return;
		}

		if ($type(this.options.code) == 'array') {
			var hasPassed = false;
			for (var i=0; i<this.options.code.length; i++){
				if (this.options.code[i] == event.code) {
					hasPassed = true; break;
				}
			}
			if (hasPassed) return this.options.onEvent(event);
			return;
		} else {
			if (this.options.code != "" && event.code != this.options.code) return;
		}

		return this.options.onEvent(event);
	},

	checkModifiers: function(event) {
		if (this.options.modifiers.any) {
			var hasMod = false;

			if (this.options.modifiers.alt && event.alt) hasMod = true;
			if (this.options.modifiers.control && event.control) hasMod = true;
			if (this.options.modifiers.meta && event.meta) hasMod = true;
			if (this.options.modifiers.shift && event.shift) hasMod = true;
			if (this.options.modifiers.numLock && event.numLock) hasMod = true;

			return hasMod;
		}

		if (
			(this.options.modifiers.alt && !event.alt) ||
			(this.options.modifiers.control && !event.control) ||
			(this.options.modifiers.meta && !event.meta) ||
			(this.options.modifiers.shift && !event.shift) ||
			(this.options.modifiers.numLock && !event.numLock)
		   )
			return false;

		return true;
	},

	fixAsciiKey: function(keyOrg) {
		var key = keyOrg;
		if ($type(key) == 'string') {
			if (key == "" || key.length == 0) return false;
			if (key.match(/number/i))
				key = ['0','1','2','3','4','5','6','7','8','9','10'];
			else if (key.match(/letter/i))
				key = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
		}

		if ($type(key) == 'array') {
			key = key.flatten();
			newKeys = [];
			for (var i=0; i<key.length; i++){
				var replaceWith = this.fixAsciiKey(key[i]);
				if (replaceWith !== false) newKeys.push(replaceWith);
			}
			return newKeys;
		}

		if (this.type == 'press') return key;

		switch (key) {
			case '~': key = '`'; break;
			case '!': key = '1'; break;
			case '@': key = '2'; break;
			case '#': key = '3'; break;
			case '$': key = '4'; break;
			case '%': key = '5'; break;
			case '^': key = '6'; break;
			case '&': key = '7'; break;
			case '*': key = '8'; break;
			case '(': key = '9'; break;
			case ')': key = '0'; break;
			case '_': key = '-'; break;
			case '+': key = '='; break;
			case '<': key = ','; break;
			case '>': key = '.'; break;
			case ':': key = ';'; break;
			case '"': key = '\''; break;
			case '{': key = '['; break;
			case '}': key = ']'; break;
			case '|': key = '\\'; break;
		}

		// if this is a shift+click key, use the shift
		var keyUppercase = key.toUpperCase();
		if (keyOrg !== key || this.options.key === keyUppercase) {
			this.options.modifiers.shift = true;
		}

		this.options.key = key;
		return key;
	},

	checkKey: function(event) {
		// extend event
		event = $extend(event, {
			numLock: false
		});

		// Mac::Opera sends out 0 for Ctrl and the CMD key is 17
		if (Browser.Platform.mac && Browser.Engine.opera) {
			switch (event.code) {
				case 0: event.code = 17; event.key = 'ctrl'; break;
				case 12: event.code = 144; event.key = 'numlock'; break;
				case 17: event.code = 91; event.key = 'cmd'; break;
			}
		}

		// Safari 1.9 sends out weird codes for a lot for the onkeypress event
		if (this.type == 'press' && Browser.Engine.webkit419) {
			switch (event.code) {
				case 63232: event.code = 37; event.key = 'left'; break;
				case 63233: event.code = 38; event.key = 'up'; break;
				case 63234: event.code = 39; event.key = 'right'; break;
				case 63235: event.code = 40; event.key = 'down'; break;
				case 63275: event.code = 35; event.key = 'end'; break;
				case 63272: event.code = 46; event.key = 'delete'; break;
				case 63236: event.code = 112; event.key = 'f1'; break;
				case 63237: event.code = 113; event.key = 'f2'; break;
				case 63238: event.code = 114; event.key = 'f3'; break;
				case 63239: event.code = 115; event.key = 'f4'; break;
				case 63240: event.code = 116; event.key = 'f5'; break;
				case 63241: event.code = 117; event.key = 'f6'; break;
				case 63242: event.code = 118; event.key = 'f7'; break;
				case 63243: event.code = 119; event.key = 'f8'; break;
				case 63244: event.code = 120; event.key = 'f9'; break;
				case 63245: event.code = 121; event.key = 'f10'; break;
				case 63246: event.code = 122; event.key = 'f11'; break;
				case 63247: event.code = 123; event.key = 'f12'; break;
				case 63273: event.code = 36; event.key = 'home'; break;
				case 63289: event.code = 144; event.key = 'numlock'; break;
				case 63276: event.code = 33; event.key = 'pageup'; break;
				case 63277: event.code = 34; event.key = 'pagedown'; break;
			}
		}

		// fix character codes for onkeydown and onkeyup
		if (this.type == 'up' || this.type == 'down') {
			event.key = event.key.toLowerCase();

			switch (event.key) {
				case '!': event.key = 'pageup'; break;
				case '"': event.key = 'pagedown'; break;
				case '#': event.key = 'end'; break;
				case '$': event.key = 'home'; break;
				case '-': event.key = 'insert'; break;
			}

			switch (event.code) {
				case 16: event.key = 'shift'; break;
				case 17: event.key = 'control'; break;
				case 18: event.key = 'alt'; break;
				case 19: event.key = 'pause'; break;
				case 20: event.key = 'capslock'; break;
				case 91: event.key = 'cmd'; break;
				case 96: event.key = '0'; event.numLock = true; break;
				case 97: event.key = '1'; event.numLock = true; break;
				case 98: event.key = '2'; event.numLock = true; break;
				case 99: event.key = '3'; event.numLock = true; break;
				case 100: event.key = '4'; event.numLock = true; break;
				case 101: event.key = '5'; event.numLock = true; break;
				case 102: event.key = '6'; event.numLock = true; break;
				case 103: event.key = '7'; event.numLock = true; break;
				case 104: event.key = '8'; event.numLock = true; break;
				case 105: event.key = '9'; event.numLock = true; break;
				case 110: event.key = '.'; event.numLock = true; break;
				case 106: event.key = '*'; event.numLock = true; break;
				case 107: event.key = '+'; event.numLock = true; break;
				case 109: event.key = '-'; event.numLock = true; break;
				case 111: event.key = '/'; event.numLock = true; break;
				case 144: event.key = 'numlock'; break;
				case 145: event.key = 'scrolllock'; break;
				case 186: event.key = ';'; break;
				case 187: event.key = '='; break;
				case 188: event.key = ','; break;
				case 189: event.key = '-'; break;
				case 190: event.key = '.'; break;
				case 191: event.key = '/'; break;
				case 192: event.key = '`'; break;
				case 219: event.key = '['; break;
				case 220: event.key = '\\'; break;
				case 221: event.key = ']'; break;
				case 222: event.key = "'"; break;
			}
		}

		return event; // return reformatted event
	}
});

/*
Native.implement([Element, Window, Document], {
	addShortcut: function(options) {
		new Espresso.Shortcut(this, options);
		return this;
	}
}); */
