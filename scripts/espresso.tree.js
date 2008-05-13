/* -----------------------------------------------------------------

	Script: 
		Turn a list element into a tree-styled list

		@script		Espresso.Node
		@version	0.2
		@author		Benjamin Hutchins
		@date		May 10th, 2008

	Copyright:
		Copyright (c) 2008, Benjamin Hutchins <http://www.xvolter.com/>

	License:
		MIT license

   ----------------------------------------------------------------- */

if (typeof window["Espresso"] == "undefined") { var window["Espresso"] = {}; }

Espresso.Tree = new Class({
	Extends: Espresso.Node.Basic,

	initialize: function(innerHTML, options) {
		this.parent($extend({'innerHTML': innerHTML}, options));
		this._children = [];
	},

	addChild: function(oChild) {
		if(oChild instanceof MUI.Node){
			this._children[this._children.length] = oChild;
		}
	},

	removeChild: function(oChild) {
		if ($type(oChild)=='number') {
			this._children = this._children.splice(oChild,1);
		} else {
			this._children = this._children.remove(oChild);
		}
	},

	titleClicked:function(){
		if(!this.opened){
			this._listEl.setStyle('display', 'block');
		}else{
			this._listEl.setStyle('display', 'none');
		}
		this.opened = !this.opened;
	},

	expand:function(all){
		if(all){
			this._children.each(function(oChild){
				if(oChild instanceof MUI.Tree){
					oChild._listEl.setStyle('display','block');
					oChild.opened = true;
				}
			});
		}
		this._listEl.setStyle('display', 'block');
		this.opened = true;
	},

	render: function(root){
		var selfEl = new Element("div").addClass("mui-tree");
		var self = this;

		this._titleEl = new Element("div")
			.addClass("mui-treetitle")
			.injectInside(selfEl);

		this._titleEl.appendText(this.title);

		// Create the children list
		if(this._children.length>0){
			this._titleEl.addEvent("click", this.titleClicked.bind(this));

			this._listEl = new Element("ul").setStyle("display","none");
			this._children.each(function(oChild){
				new Element("li").adopt( oChild.render() ).injectInside(this._listEl);
			}.bind(this));
			this._listEl.injectInside(selfEl);
		}
		return selfEl;
	},

	import: function(container){
		container = $(container);
		//if(!container.hasClass("mui-tree")) return;
		this.title = container.getFirst().innerHTML;
		var mainTreeEl = $(container.getElementsByTagName("ul")[0]),
		    nodesEls = mainTreeEl.getChildren();
		nodesEls.each(function(nodeEl){
			if(nodeEl.parentNode==mainTreeEl){
				var firstChild = nodeEl.getFirst();
				if(firstChild.hasClass("mui-tree")){
					this.addChild(new MUI.Tree().import(firstChild));
				}else if(firstChild.getTag()=='a'){
					this.addChild(new MUI.LinkNode().import(firstChild));
				}else{
					this.addChild( new MUI.Node().import(firstChild) );
				}
			}
		}.bind(this));

		return this;
	}
});

Element.implement({
	makeAsTree: function() {
		new Espresso.Tree().import(this).render().replaces(this);
	}
});
