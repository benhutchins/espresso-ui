/*
	Milkbox - required: mootools.js v1.2b2+
	v1.1.1 - fix: now you can use links inside the caption. Please use html entities inside the title property.
	by Luca Reghellin (http://www.reghellin.com) April 2008, MIT-style license.
	Inspiration from Slimbox by Christophe Beyls (http://www.digitalia.be) 
	and from THE VERY FIRST MAN ON THE MOON: Lokesh Dhakar (http://www.lokeshdhakar.com/projects/lightbox2/)
	AND OF COURSE, SPECIAL THANKS TO THE MOOTOOLS DEVELOPERS
*/

if (typeof Espresso == "undefined") { var Espresso = {} }

Espresso.Lightbox = new Class({

	Implements: Options,
	
	options:{
		overlayOpacity:0.7,
		topPosition:80,
		initialWidth:250,
		initialHeight:250,
		resizeDuration:500,
		resizeTransition:'sine:in:out',/*function (ex. Transitions.Sine.easeIn) or string (ex. 'quint:out')*/
		hoverBackgroundPosition:'0 -23px'
	},

	initialize: function(options){
		
		this.setOptions(options);
		this.galleries = [];
		this.currentImage = null;
		this.currentIndex = null;
		this.currentGallery = null;
		
		this.specialDescription = null;//for showThisImage
		
		this.mode = null;//'singleImage','imageGallery','showThisImage'
		this.closed = true;
		this.busy = true;//to control keyboard events
				
		this.loadedImages = [];//to check the preloaded images 
				
		this.initMilkbox();
		
	},//end init
	
	initMilkbox:function(){
		
		this.prepareGalleries();
		if(this.galleries.length == 0){ return; };
		
		this.prepareHTML();
		this.prepareEffects();
		this.prepareEvents();

	},
	
	//runs only 1 time per gallery
	openMilkbox:function(gallery,index){

		this.overlay.setStyles({ 'top': -$(window).getScroll().y,'height':$(window).getScrollSize().y+$(window).getScroll().y });
		
		this.center.addClass('mbLoading');
		this.center.setStyle('top',$(window).getScroll().y+this.options.topPosition);

		this.currentGallery = gallery;
		this.currentIndex = index;
		this.overlay.tween('opacity',this.options.overlayOpacity);//onComplete: center.tween opacity
		
		if(gallery.length == 1){
			this.mode = 'singleImage';
			this.loadImages(gallery[index].href);
		} else {
			this.mode = 'imageGallery';
			
			var images = gallery.map(function(item){ return item.href; });

			$$(this.prev, this.next, this.count).setStyles({'display':'block'});
			var border = this.center.getStyle('border-right-width').toInt();//border-right is just ok for design purposes..
			var navWidth = this.prev.getSize().x+this.next.getSize().x+this.close.getSize().x+border;
			this.navigation.setStyle('width',navWidth);
			this.description.setStyle('margin-right',navWidth);
			
			var next = (index != images.length-1) ? images[index+1] : images[0];
			var prev = (index != 0) ? images[index-1] : images[images.length-1];
			var preloads = (prev == next) ? prev : [prev,next]; //if gallery.length == 2, then prev == next
			
			this.loadImages(images[index],preloads);
		}
		
		this.closed = false;
	},
	
	//call with js
	showThisImage:function(image,description){
		
		this.mode = 'showThisImage';
		
		this.specialDescription = description;
		
		this.overlay.setStyles({ 'top': -$(window).getScroll().y,'height':$(window).getScrollSize().y+$(window).getScroll().y });
		
		this.center.addClass('mbLoading');
		this.center.setStyle('top',$(window).getScroll().y+this.options.topPosition);
		
		this.overlay.tween('opacity',this.options.overlayOpacity);//onComplete: center.tween opacity
		this.loadImages(image);
		
		this.closed = false;
	},

 	//see loadImages()
 	showImage:function(image){
 		
 		if(this.closed){ return; };//if you close the FastBox and an onload event is still running
 		
 		var imageBoxSize = this.image.getSize();
 		
 		this.image.setStyles({'opacity':0, 'width':'', 'height':''});
 		
 		var imageSize = new Hash(image.getProperties('width','height')).map(function(item, index){
			return item.toInt();
		});
 		
 		var centerSize = new Hash(this.center.getStyles('width','height')).map(function(item, index){
 			return item.toInt();
		});
 		
 		var targetSize = {};
 		
 		if(imageSize.width != centerSize.width){ 
 			targetSize.width = imageSize.width;
 			targetSize.marginLeft = -(imageSize.width/2).round();
 		};
 		
 		var gap = (imageBoxSize.y > 0) ? centerSize.height - imageBoxSize.y : 0; 

 		var targetHeight = imageSize.height + gap;

 	   targetSize.height = targetHeight;
 	   
		//so nav doesn't move when you click next/prev
		this.image.setStyles({'width':imageSize.width, 'height':imageSize.height})

 		this.center.removeClass('mbLoading');
 		this.center.morph(targetSize);//onComplete: show all items
 		
 	},
 	
	loadImages:function(currentImage,preloads){

			var loadImage = new Asset.image(currentImage, { onload:function(img){
				this.currentImage = img;
				if(!this.loadedImages.contains(currentImage)){ this.loadedImages.push(currentImage); };//see next/prev events
				$$(this.description,this.navigation).setStyle('visibility','hidden');
				this.navigation.setStyle('height','');//reset the height setted in center.morph.onComplete
				$$(this.next,this.prev,this.close).setStyle('backgroundPosition','0 0');
				this.showImage(this.currentImage);
			}.bindWithEvent(this)});
			
			if(preloads && !this.loadedImages.contains(preloads)){
				var preloadImage = new Asset.images(preloads, { onload:function(img){
					if(!this.loadedImages.contains(preloadImage)){ this.loadedImages.push(preloadImage); };//see next/prev events
				}.bindWithEvent(this)});
			};
			
	},
	
	//all the main events
	prepareEvents:function(){
	
		//galleries
		this.galleries.each(function(gallery){
			$$(gallery).addEvent('click',function(e){
				var button=($(e.target).match('a')) ? $(e.target) : $(e.target).getParent('a');
				e.preventDefault();
				this.openMilkbox(gallery, gallery.indexOf(button));
			}.bindWithEvent(this));
		},this);
		
		//next, prev, see next_prev_aux()
		this.next.addEvent('click',this.next_prev_aux.bindWithEvent(this,'next'));
		this.prev.addEvent('click',this.next_prev_aux.bindWithEvent(this,'prev'));
		
		//keyboard next/prev/close
		$(window.document).addEvent('keydown',function(e){
			if(this.mode != 'imageGallery' || this.busy == true){ return; };
			if(e.key == 'right' || e.key == 'space'){ this.next_prev_aux(e,'next'); }
			else if(e.key == 'left'){ this.next_prev_aux(e,'next'); }
			else if(e.key == 'esc'){ this.closeMilkbox(); };
		}.bindWithEvent(this));
		
		
		//css hover doesn't work in ie6, so I must do it via js...
		$$(this.next,this.prev,this.close).addEvents({
				'mouseover':function(e){ 
					var button=($(e.target).match('a')) ? $(e.target) : $(e.target).getParent('a');
					button.setStyle('backgroundPosition',this.options.hoverBackgroundPosition); 
				}.bindWithEvent(this),
				'mouseout':function(){ this.setStyle('backgroundPosition','0 0'); }
		});
		
		
		
		//overlay
		this.overlay.retrieve('tween').addEvent('onComplete',function(){
			if(this.overlay.getStyle('opacity') == this.options.overlayOpacity){ 
				this.center.tween('opacity',1);
			} else if(this.overlay.getStyle('opacity') == 0) {
				this.overlay.setStyles({'height':'','top':''});
			};
		}.bindWithEvent(this));
		
		//center
		this.center.retrieve('morph').addEvent('onComplete',function(){
			
 			 this.image.grab(this.currentImage);
			 this.image.tween('opacity',1);
			 
			 var d = (!(this.mode == 'showThisImage')) ? this.currentGallery[this.currentIndex].getProperty('title') : this.specialDescription;
			 if($chk(d)){ this.description.innerHTML = d; };
			 
			 if(this.mode == 'imageGallery'){ 
			 	this.count.appendText((this.currentIndex+1)+' of '+this.currentGallery.length); 
			 }
			 
			 var currentCenterHeight = this.center.getStyle('height').toInt();
			 
			 this.navigation.setStyle('height',this.bottom.getStyle('height').toInt());//to have the right-border height == total bottom height
			 var bottomSize = this.bottom.getSize().y;
			 
			 //after the 1st time, currentCenterHeight is always > this.image.getSize().y
			 var targetOffset = (currentCenterHeight > this.image.getSize().y) ? (this.bottom.getSize().y+this.image.getSize().y)-currentCenterHeight : bottomSize;

			 this.bottom.setStyle('display','none');//to avoid rendering problems during setFinalHeight

			 this.center.retrieve('setFinalHeight').start(currentCenterHeight,currentCenterHeight+targetOffset);

		}.bindWithEvent(this));
		
		this.center.retrieve('setFinalHeight').addEvent('onComplete',function(){
			this.bottom.setStyles({'visibility':'visible','display':'block'});
			$$(this.description,this.navigation).setStyle('visibility','visible');
			//reset overlay height based on position and height
			var scrollSize = $(window).getScrollSize().y;
			var scrollTop = $(window).getScroll().y;
			
			this.overlay.setStyle('height',scrollSize+scrollTop);
			this.busy = false;
		}.bindWithEvent(this));

		//reset overlay height and position onResize
		window.addEvent('resize',function(){
			if(this.overlay.getStyle('opacity') == 0){ return; };//resize only if visible
			var scrollSize = $(window).getScrollSize().y;
			var scrollTop = $(window).getScroll().y;
			this.overlay.setStyles({ 'height':scrollSize+scrollTop,'top':-scrollTop });
		}.bindWithEvent(this))

		//close
		$$(this.overlay,this.image,this.close).addEvent('click',function(){ this.closeMilkbox(); }.bindWithEvent(this));
		
	},
	
	next_prev_aux:function(e,direction){
		e.preventDefault();
		this.busy = true;
		
		if(direction == "next"){
			var i= (this.currentIndex != this.currentGallery.length-1) ? this.currentIndex += 1 : this.currentIndex = 0;
			var _i= (this.currentIndex != this.currentGallery.length-1) ? this.currentIndex + 1 : 0;
		} else {
			var i= (this.currentIndex != 0) ? this.currentIndex -= 1 : this.currentIndex = this.currentGallery.length-1;
			var _i= (this.currentIndex != 0) ? this.currentIndex - 1 : this.currentGallery.length-1;		
		};

		this.image.empty();
		this.description.empty();
		this.count.empty();
		 
	
		if(!this.loadedImages.contains(this.currentGallery[i].href)){ this.center.addClass('muLoading'); };
		this.loadImages(this.currentGallery[i].href,this.currentGallery[_i].href);
	},
	
	closeMilkbox:function(){
		this.cancelAllEffects();
		
		this.currentImage = null;
		this.currentIndex = null;
		this.currentGallery = null;
 		
		$$(this.prev, this.next, this.count).setStyle('display','none');
		var border = this.center.getStyle('border-right-width').toInt();
		var navWidth = this.close.getSize().x+border;
		this.navigation.setStyles({'width':navWidth,'height':'','visibility':'hidden'});
		this.description.setStyle('margin-right',navWidth);
		this.description.empty();
		this.bottom.setStyles({'visibility':'hidden','display':''});
		
   	this.image.setStyles({'opacity':0, 'width':'', 'height':''});
 		this.image.empty();
 		
 		this.count.empty();
		
		this.center.setStyles({'opacity':0,'width':this.options.initialWidth,'height':this.options.initialHeight,'marginLeft':-(this.options.initialWidth/2)});
		this.overlay.tween('opacity',0);//see onComplete in prepareEvents() 
		
		this.mode = null;
		this.closed = true;
	},
	
	cancelAllEffects:function(){
		this.overlay.retrieve('tween').cancel();
		this.center.retrieve('morph').cancel();
		this.center.retrieve('tween').cancel();
		this.center.retrieve('setFinalHeight').cancel();
		this.image.retrieve('tween').cancel();
	},
	
	prepareEffects:function(){
		this.overlay.set('tween',{ duration:'short',link:'cancel' });
		this.center.set('tween',{ duration:'short',link:'chain' });
		this.center.set('morph',{ duration:this.options.resizeDuration,link:'chain',transition:this.options.resizeTransition });
		this.center.store('setFinalHeight',new Fx.Tween(this.center,'height',{duration:'short'}));
		this.image.set('tween',{ link:'chain' });
	},
	
	prepareGalleries:function(){
		var families = [];
		var milkbox_a = [];
		
		$$('a').each(function(a){
			//test 'milkbox' and link extension, and collect all milkbox links
			if(a.rel && a.rel.test(/^milkbox/i) && (a.href.contains('.gif') || a.href.contains('.jpg') || a.href.contains('.png'))){
				if(a.rel.length>7 && !families.contains(a.rel)){ families.push(a.rel); };
				milkbox_a.push(a);
			}
		},this);

		//console.log(milkbox_a)
		
		//create an array of arrays with all galleries
		milkbox_a.each(function(a){
			$(a).store('href',a.href);
			$(a).store('rel',a.rel);
			if(a.rel.length > 7){
				families.each(function(f,i){
					if(a.rel == f){
						if(!this.galleries[i]){ this.galleries[i] = [] };
						this.galleries[i].push($(a));
					};
				},this);
			} else { this.galleries.push([$(a)]); };
		},this);
		
		//console.log(this.galleries)
	},
		
	prepareHTML:function(){		
		
		this.overlay = new Element('div', { 'id':'mbOverlay','styles':{ 'opacity':'0','visibility':'visible' }}).inject($(document.body));
		
		this.center = new Element('div', {'id':'mbCenter', 'styles':{'width':this.options.initialWidth,'height':this.options.initialHeight,'marginLeft':-(this.options.initialWidth/2),'opacity':0}}).inject($(document.body));
		this.image = new Element('div', {'id':'mbImage'}).inject(this.center);
		
		this.bottom = new Element('div',{'id':'mbBottom'}).inject(this.center).setStyle('visibility','hidden');
		this.navigation = new Element('div',{'id':'mbNavigation'}).setStyle('visibility','hidden');
		this.description = new Element('div',{'id':'mbDescription'}).setStyle('visibility','hidden');

		this.bottom.adopt(this.navigation, this.description, new Element('div',{'class':'clear'}));
		
		this.close = new Element('a',{'id':'mbCloseLink'});
		this.next = new Element('a',{'id':'mbNextLink'});
		this.prev = new Element('a',{'id':'mbPrevLink'});
		this.count = new Element('span',{'id':'mbCount'});
		
		$$(this.next, this.prev, this.count).setStyle('display','none');
		
		this.navigation.adopt(this.close, this.next, this.prev,new Element('div',{'class':'clear'}), this.count);

	}
	
});
