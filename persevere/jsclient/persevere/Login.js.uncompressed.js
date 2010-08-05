/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/

/*
	This is a compiled version of Dojo, built for deployment and not for
	development. To get an editable version, please visit:

		http://dojotoolkit.org

	for documentation and information on getting the source.
*/

if(!dojo._hasResource["dojo.i18n"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.i18n"] = true;
dojo.provide("dojo.i18n");

/*=====
dojo.i18n = {
	// summary: Utility classes to enable loading of resources for internationalization (i18n)
};
=====*/

dojo.i18n.getLocalization = function(/*String*/packageName, /*String*/bundleName, /*String?*/locale){
	//	summary:
	//		Returns an Object containing the localization for a given resource
	//		bundle in a package, matching the specified locale.
	//	description:
	//		Returns a hash containing name/value pairs in its prototypesuch
	//		that values can be easily overridden.  Throws an exception if the
	//		bundle is not found.  Bundle must have already been loaded by
	//		`dojo.requireLocalization()` or by a build optimization step.  NOTE:
	//		try not to call this method as part of an object property
	//		definition (`var foo = { bar: dojo.i18n.getLocalization() }`).  In
	//		some loading situations, the bundle may not be available in time
	//		for the object definition.  Instead, call this method inside a
	//		function that is run after all modules load or the page loads (like
	//		in `dojo.addOnLoad()`), or in a widget lifecycle method.
	//	packageName:
	//		package which is associated with this resource
	//	bundleName:
	//		the base filename of the resource bundle (without the ".js" suffix)
	//	locale:
	//		the variant to load (optional).  By default, the locale defined by
	//		the host environment: dojo.locale

	locale = dojo.i18n.normalizeLocale(locale);

	// look for nearest locale match
	var elements = locale.split('-');
	var module = [packageName,"nls",bundleName].join('.');
	var bundle = dojo._loadedModules[module];
	if(bundle){
		var localization;
		for(var i = elements.length; i > 0; i--){
			var loc = elements.slice(0, i).join('_');
			if(bundle[loc]){
				localization = bundle[loc];
				break;
			}
		}
		if(!localization){
			localization = bundle.ROOT;
		}

		// make a singleton prototype so that the caller won't accidentally change the values globally
		if(localization){
			var clazz = function(){};
			clazz.prototype = localization;
			return new clazz(); // Object
		}
	}

	throw new Error("Bundle not found: " + bundleName + " in " + packageName+" , locale=" + locale);
};

dojo.i18n.normalizeLocale = function(/*String?*/locale){
	//	summary:
	//		Returns canonical form of locale, as used by Dojo.
	//
	//  description:
	//		All variants are case-insensitive and are separated by '-' as specified in [RFC 3066](http://www.ietf.org/rfc/rfc3066.txt).
	//		If no locale is specified, the dojo.locale is returned.  dojo.locale is defined by
	//		the user agent's locale unless overridden by djConfig.

	var result = locale ? locale.toLowerCase() : dojo.locale;
	if(result == "root"){
		result = "ROOT";
	}
	return result; // String
};

dojo.i18n._requireLocalization = function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale, /*String?*/availableFlatLocales){
	//	summary:
	//		See dojo.requireLocalization()
	//	description:
	// 		Called by the bootstrap, but factored out so that it is only
	// 		included in the build when needed.

	var targetLocale = dojo.i18n.normalizeLocale(locale);
 	var bundlePackage = [moduleName, "nls", bundleName].join(".");
	// NOTE: 
	//		When loading these resources, the packaging does not match what is
	//		on disk.  This is an implementation detail, as this is just a
	//		private data structure to hold the loaded resources.  e.g.
	//		`tests/hello/nls/en-us/salutations.js` is loaded as the object
	//		`tests.hello.nls.salutations.en_us={...}` The structure on disk is
	//		intended to be most convenient for developers and translators, but
	//		in memory it is more logical and efficient to store in a different
	//		order.  Locales cannot use dashes, since the resulting path will
	//		not evaluate as valid JS, so we translate them to underscores.
	
	//Find the best-match locale to load if we have available flat locales.
	var bestLocale = "";
	if(availableFlatLocales){
		var flatLocales = availableFlatLocales.split(",");
		for(var i = 0; i < flatLocales.length; i++){
			//Locale must match from start of string.
			//Using ["indexOf"] so customBase builds do not see
			//this as a dojo._base.array dependency.
			if(targetLocale["indexOf"](flatLocales[i]) == 0){
				if(flatLocales[i].length > bestLocale.length){
					bestLocale = flatLocales[i];
				}
			}
		}
		if(!bestLocale){
			bestLocale = "ROOT";
		}		
	}

	//See if the desired locale is already loaded.
	var tempLocale = availableFlatLocales ? bestLocale : targetLocale;
	var bundle = dojo._loadedModules[bundlePackage];
	var localizedBundle = null;
	if(bundle){
		if(dojo.config.localizationComplete && bundle._built){return;}
		var jsLoc = tempLocale.replace(/-/g, '_');
		var translationPackage = bundlePackage+"."+jsLoc;
		localizedBundle = dojo._loadedModules[translationPackage];
	}

	if(!localizedBundle){
		bundle = dojo["provide"](bundlePackage);
		var syms = dojo._getModuleSymbols(moduleName);
		var modpath = syms.concat("nls").join("/");
		var parent;

		dojo.i18n._searchLocalePath(tempLocale, availableFlatLocales, function(loc){
			var jsLoc = loc.replace(/-/g, '_');
			var translationPackage = bundlePackage + "." + jsLoc;
			var loaded = false;
			if(!dojo._loadedModules[translationPackage]){
				// Mark loaded whether it's found or not, so that further load attempts will not be made
				dojo["provide"](translationPackage);
				var module = [modpath];
				if(loc != "ROOT"){module.push(loc);}
				module.push(bundleName);
				var filespec = module.join("/") + '.js';
				loaded = dojo._loadPath(filespec, null, function(hash){
					// Use singleton with prototype to point to parent bundle, then mix-in result from loadPath
					var clazz = function(){};
					clazz.prototype = parent;
					bundle[jsLoc] = new clazz();
					for(var j in hash){ bundle[jsLoc][j] = hash[j]; }
				});
			}else{
				loaded = true;
			}
			if(loaded && bundle[jsLoc]){
				parent = bundle[jsLoc];
			}else{
				bundle[jsLoc] = parent;
			}
			
			if(availableFlatLocales){
				//Stop the locale path searching if we know the availableFlatLocales, since
				//the first call to this function will load the only bundle that is needed.
				return true;
			}
		});
	}

	//Save the best locale bundle as the target locale bundle when we know the
	//the available bundles.
	if(availableFlatLocales && targetLocale != bestLocale){
		bundle[targetLocale.replace(/-/g, '_')] = bundle[bestLocale.replace(/-/g, '_')];
	}
};

(function(){
	// If other locales are used, dojo.requireLocalization should load them as
	// well, by default. 
	// 
	// Override dojo.requireLocalization to do load the default bundle, then
	// iterate through the extraLocale list and load those translations as
	// well, unless a particular locale was requested.

	var extra = dojo.config.extraLocale;
	if(extra){
		if(!extra instanceof Array){
			extra = [extra];
		}

		var req = dojo.i18n._requireLocalization;
		dojo.i18n._requireLocalization = function(m, b, locale, availableFlatLocales){
			req(m,b,locale, availableFlatLocales);
			if(locale){return;}
			for(var i=0; i<extra.length; i++){
				req(m,b,extra[i], availableFlatLocales);
			}
		};
	}
})();

dojo.i18n._searchLocalePath = function(/*String*/locale, /*Boolean*/down, /*Function*/searchFunc){
	//	summary:
	//		A helper method to assist in searching for locale-based resources.
	//		Will iterate through the variants of a particular locale, either up
	//		or down, executing a callback function.  For example, "en-us" and
	//		true will try "en-us" followed by "en" and finally "ROOT".

	locale = dojo.i18n.normalizeLocale(locale);

	var elements = locale.split('-');
	var searchlist = [];
	for(var i = elements.length; i > 0; i--){
		searchlist.push(elements.slice(0, i).join('-'));
	}
	searchlist.push(false);
	if(down){searchlist.reverse();}

	for(var j = searchlist.length - 1; j >= 0; j--){
		var loc = searchlist[j] || "ROOT";
		var stop = searchFunc(loc);
		if(stop){ break; }
	}
};

dojo.i18n._preloadLocalizations = function(/*String*/bundlePrefix, /*Array*/localesGenerated){
	//	summary:
	//		Load built, flattened resource bundles, if available for all
	//		locales used in the page. Only called by built layer files.

	function preload(locale){
		locale = dojo.i18n.normalizeLocale(locale);
		dojo.i18n._searchLocalePath(locale, true, function(loc){
			for(var i=0; i<localesGenerated.length;i++){
				if(localesGenerated[i] == loc){
					dojo["require"](bundlePrefix+"_"+loc);
					return true; // Boolean
				}
			}
			return false; // Boolean
		});
	}
	preload();
	var extra = dojo.config.extraLocale||[];
	for(var i=0; i<extra.length; i++){
		preload(extra[i]);
	}
};

}

if(!dojo._hasResource["dijit._base.manager"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.manager"] = true;
dojo.provide("dijit._base.manager");

dojo.declare("dijit.WidgetSet", null, {
	// summary:
	//		A set of widgets indexed by id. A default instance of this class is
	//		available as `dijit.registry`
	//
	// example:
	//		Create a small list of widgets:
	//		|	var ws = new dijit.WidgetSet();
	//		|	ws.add(dijit.byId("one"));
	//		| 	ws.add(dijit.byId("two"));
	//		|	// destroy both:
	//		|	ws.forEach(function(w){ w.destroy(); });
	//
	// example:
	//		Using dijit.registry:
	//		|	dijit.registry.forEach(function(w){ /* do something */ });

	constructor: function(){
		this._hash = {};
		this.length = 0;
	},

	add: function(/*dijit._Widget*/ widget){
		// summary:
		//		Add a widget to this list. If a duplicate ID is detected, a error is thrown.
		//
		// widget: dijit._Widget
		//		Any dijit._Widget subclass.
		if(this._hash[widget.id]){
			throw new Error("Tried to register widget with id==" + widget.id + " but that id is already registered");
		}
		this._hash[widget.id] = widget;
		this.length++;
	},

	remove: function(/*String*/ id){
		// summary:
		//		Remove a widget from this WidgetSet. Does not destroy the widget; simply
		//		removes the reference.
		if(this._hash[id]){
			delete this._hash[id];
			this.length--;
		}
	},

	forEach: function(/*Function*/ func, /* Object? */thisObj){
		// summary:
		//		Call specified function for each widget in this set.
		//
		// func:
		//		A callback function to run for each item. Is passed the widget, the index
		//		in the iteration, and the full hash, similar to `dojo.forEach`.
		//
		// thisObj:
		//		An optional scope parameter
		//
		// example:
		//		Using the default `dijit.registry` instance:
		//		|	dijit.registry.forEach(function(widget){
		//		|		console.log(widget.declaredClass);
		//		|	});
		//
		// returns:
		//		Returns self, in order to allow for further chaining.

		thisObj = thisObj || dojo.global;
		var i = 0, id;
		for(id in this._hash){
			func.call(thisObj, this._hash[id], i++, this._hash);
		}
		return this;	// dijit.WidgetSet
	},

	filter: function(/*Function*/ filter, /* Object? */thisObj){
		// summary:
		//		Filter down this WidgetSet to a smaller new WidgetSet
		//		Works the same as `dojo.filter` and `dojo.NodeList.filter`
		//
		// filter:
		//		Callback function to test truthiness. Is passed the widget
		//		reference and the pseudo-index in the object.
		//
		// thisObj: Object?
		//		Option scope to use for the filter function.
		//
		// example:
		//		Arbitrary: select the odd widgets in this list
		//		|	dijit.registry.filter(function(w, i){
		//		|		return i % 2 == 0;
		//		|	}).forEach(function(w){ /* odd ones */ });

		thisObj = thisObj || dojo.global;
		var res = new dijit.WidgetSet(), i = 0, id;
		for(id in this._hash){
			var w = this._hash[id];
			if(filter.call(thisObj, w, i++, this._hash)){
				res.add(w);
			}
		}
		return res; // dijit.WidgetSet
	},

	byId: function(/*String*/ id){
		// summary:
		//		Find a widget in this list by it's id.
		// example:
		//		Test if an id is in a particular WidgetSet
		//		| var ws = new dijit.WidgetSet();
		//		| ws.add(dijit.byId("bar"));
		//		| var t = ws.byId("bar") // returns a widget
		//		| var x = ws.byId("foo"); // returns undefined

		return this._hash[id];	// dijit._Widget
	},

	byClass: function(/*String*/ cls){
		// summary:
		//		Reduce this widgetset to a new WidgetSet of a particular `declaredClass`
		//
		// cls: String
		//		The Class to scan for. Full dot-notated string.
		//
		// example:
		//		Find all `dijit.TitlePane`s in a page:
		//		|	dijit.registry.byClass("dijit.TitlePane").forEach(function(tp){ tp.close(); });

		var res = new dijit.WidgetSet(), id, widget;
		for(id in this._hash){
			widget = this._hash[id];
			if(widget.declaredClass == cls){
				res.add(widget);
			}
		 }
		 return res; // dijit.WidgetSet
},

	toArray: function(){
		// summary:
		//		Convert this WidgetSet into a true Array
		//
		// example:
		//		Work with the widget .domNodes in a real Array
		//		|	dojo.map(dijit.registry.toArray(), function(w){ return w.domNode; });

		var ar = [];
		for(var id in this._hash){
			ar.push(this._hash[id]);
		}
		return ar;	// dijit._Widget[]
},

	map: function(/* Function */func, /* Object? */thisObj){
		// summary:
		//		Create a new Array from this WidgetSet, following the same rules as `dojo.map`
		// example:
		//		|	var nodes = dijit.registry.map(function(w){ return w.domNode; });
		//
		// returns:
		//		A new array of the returned values.
		return dojo.map(this.toArray(), func, thisObj); // Array
	},

	every: function(func, thisObj){
		// summary:
		// 		A synthetic clone of `dojo.every` acting explictly on this WidgetSet
		//
		// func: Function
		//		A callback function run for every widget in this list. Exits loop
		//		when the first false return is encountered.
		//
		// thisObj: Object?
		//		Optional scope parameter to use for the callback

		thisObj = thisObj || dojo.global;
		var x = 0, i;
		for(i in this._hash){
			if(!func.call(thisObj, this._hash[i], x++, this._hash)){
				return false; // Boolean
			}
		}
		return true; // Boolean
	},

	some: function(func, thisObj){
		// summary:
		// 		A synthetic clone of `dojo.some` acting explictly on this WidgetSet
		//
		// func: Function
		//		A callback function run for every widget in this list. Exits loop
		//		when the first true return is encountered.
		//
		// thisObj: Object?
		//		Optional scope parameter to use for the callback

		thisObj = thisObj || dojo.global;
		var x = 0, i;
		for(i in this._hash){
			if(func.call(thisObj, this._hash[i], x++, this._hash)){
				return true; // Boolean
			}
		}
		return false; // Boolean
	}

});

/*=====
dijit.registry = {
	// summary:
	//		A list of widgets on a page.
	// description:
	//		Is an instance of `dijit.WidgetSet`
};
=====*/
dijit.registry= new dijit.WidgetSet();

dijit._widgetTypeCtr = {};

dijit.getUniqueId = function(/*String*/widgetType){
	// summary:
	//		Generates a unique id for a given widgetType

	var id;
	do{
		id = widgetType + "_" +
			(widgetType in dijit._widgetTypeCtr ?
				++dijit._widgetTypeCtr[widgetType] : dijit._widgetTypeCtr[widgetType] = 0);
	}while(dijit.byId(id));
	return dijit._scopeName == "dijit" ? id : dijit._scopeName + "_" + id; // String
};

dijit.findWidgets = function(/*DomNode*/ root){
	// summary:
	//		Search subtree under root returning widgets found.
	//		Doesn't search for nested widgets (ie, widgets inside other widgets).

	var outAry = [];

	function getChildrenHelper(root){
		for(var node = root.firstChild; node; node = node.nextSibling){
			if(node.nodeType == 1){
				var widgetId = node.getAttribute("widgetId");
				if(widgetId){
					var widget = dijit.byId(widgetId);
					outAry.push(widget);
				}else{
					getChildrenHelper(node);
				}
			}
		}
	}

	getChildrenHelper(root);
	return outAry;
};

dijit._destroyAll = function(){
	// summary:
	//		Code to destroy all widgets and do other cleanup on page unload

	// Clean up focus manager lingering references to widgets and nodes
	dijit._curFocus = null;
	dijit._prevFocus = null;
	dijit._activeStack = [];

	// Destroy all the widgets, top down
	dojo.forEach(dijit.findWidgets(dojo.body()), function(widget){
		// Avoid double destroy of widgets like Menu that are attached to <body>
		// even though they are logically children of other widgets.
		if(!widget._destroyed){
			if(widget.destroyRecursive){
				widget.destroyRecursive();
			}else if(widget.destroy){
				widget.destroy();
			}
		}
	});
};

if(dojo.isIE){
	// Only run _destroyAll() for IE because we think it's only necessary in that case,
	// and because it causes problems on FF.  See bug #3531 for details.
	dojo.addOnWindowUnload(function(){
		dijit._destroyAll();
	});
}

dijit.byId = function(/*String|Widget*/id){
	// summary:
	//		Returns a widget by it's id, or if passed a widget, no-op (like dojo.byId())
	return typeof id == "string" ? dijit.registry._hash[id] : id; // dijit._Widget
};

dijit.byNode = function(/* DOMNode */ node){
	// summary:
	//		Returns the widget corresponding to the given DOMNode
	return dijit.registry.byId(node.getAttribute("widgetId")); // dijit._Widget
};

dijit.getEnclosingWidget = function(/* DOMNode */ node){
	// summary:
	//		Returns the widget whose DOM tree contains the specified DOMNode, or null if
	//		the node is not contained within the DOM tree of any widget
	while(node){
		var id = node.getAttribute && node.getAttribute("widgetId");
		if(id){
			return dijit.byId(id);
		}
		node = node.parentNode;
	}
	return null;
};

dijit._isElementShown = function(/*Element*/elem){
	var style = dojo.style(elem);
	return (style.visibility != "hidden")
		&& (style.visibility != "collapsed")
		&& (style.display != "none")
		&& (dojo.attr(elem, "type") != "hidden");
}

dijit.isTabNavigable = function(/*Element*/elem){
	// summary:
	//		Tests if an element is tab-navigable

	// TODO: convert (and rename method) to return effectivite tabIndex; will save time in _getTabNavigable()
	if(dojo.attr(elem, "disabled")){
		return false;
	}else if(dojo.hasAttr(elem, "tabIndex")){
		// Explicit tab index setting
		return dojo.attr(elem, "tabIndex") >= 0; // boolean
	}else{
		// No explicit tabIndex setting, need to investigate node type
		switch(elem.nodeName.toLowerCase()){
			case "a":
				// An <a> w/out a tabindex is only navigable if it has an href
				return dojo.hasAttr(elem, "href");
			case "area":
			case "button":
			case "input":
			case "object":
			case "select":
			case "textarea":
				// These are navigable by default
				return true;
			case "iframe":
				// If it's an editor <iframe> then it's tab navigable.
				if(dojo.isMoz){
					return elem.contentDocument.designMode == "on";
				}else if(dojo.isWebKit){
					var doc = elem.contentDocument,
						body = doc && doc.body;
					return body && body.contentEditable == 'true';
				}else{
					// contentWindow.document isn't accessible within IE7/8
					// if the iframe.src points to a foreign url and this
					// page contains an element, that could get focus
					try{
						doc = elem.contentWindow.document;
						body = doc && doc.body;
						return body && body.firstChild && body.firstChild.contentEditable == 'true';
					}catch(e){
						return false;
					}
				}
			default:
				return elem.contentEditable == 'true';
		}
	}
};

dijit._getTabNavigable = function(/*DOMNode*/root){
	// summary:
	//		Finds descendants of the specified root node.
	//
	// description:
	//		Finds the following descendants of the specified root node:
	//		* the first tab-navigable element in document order
	//		  without a tabIndex or with tabIndex="0"
	//		* the last tab-navigable element in document order
	//		  without a tabIndex or with tabIndex="0"
	//		* the first element in document order with the lowest
	//		  positive tabIndex value
	//		* the last element in document order with the highest
	//		  positive tabIndex value
	var first, last, lowest, lowestTabindex, highest, highestTabindex;
	var walkTree = function(/*DOMNode*/parent){
		dojo.query("> *", parent).forEach(function(child){
			var isShown = dijit._isElementShown(child);
			if(isShown && dijit.isTabNavigable(child)){
				var tabindex = dojo.attr(child, "tabIndex");
				if(!dojo.hasAttr(child, "tabIndex") || tabindex == 0){
					if(!first){ first = child; }
					last = child;
				}else if(tabindex > 0){
					if(!lowest || tabindex < lowestTabindex){
						lowestTabindex = tabindex;
						lowest = child;
					}
					if(!highest || tabindex >= highestTabindex){
						highestTabindex = tabindex;
						highest = child;
					}
				}
			}
			if(isShown && child.nodeName.toUpperCase() != 'SELECT'){ walkTree(child) }
		});
	};
	if(dijit._isElementShown(root)){ walkTree(root) }
	return { first: first, last: last, lowest: lowest, highest: highest };
}
dijit.getFirstInTabbingOrder = function(/*String|DOMNode*/root){
	// summary:
	//		Finds the descendant of the specified root node
	//		that is first in the tabbing order
	var elems = dijit._getTabNavigable(dojo.byId(root));
	return elems.lowest ? elems.lowest : elems.first; // DomNode
};

dijit.getLastInTabbingOrder = function(/*String|DOMNode*/root){
	// summary:
	//		Finds the descendant of the specified root node
	//		that is last in the tabbing order
	var elems = dijit._getTabNavigable(dojo.byId(root));
	return elems.last ? elems.last : elems.highest; // DomNode
};

/*=====
dojo.mixin(dijit, {
	// defaultDuration: Integer
	//		The default animation speed (in ms) to use for all Dijit
	//		transitional animations, unless otherwise specified
	//		on a per-instance basis. Defaults to 200, overrided by
	//		`djConfig.defaultDuration`
	defaultDuration: 300
});
=====*/

dijit.defaultDuration = dojo.config["defaultDuration"] || 200;

}

if(!dojo._hasResource["dijit._base.focus"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.focus"] = true;
dojo.provide("dijit._base.focus");

	// for dijit.isTabNavigable()

// summary:
//		These functions are used to query or set the focus and selection.
//
//		Also, they trace when widgets become activated/deactivated,
//		so that the widget can fire _onFocus/_onBlur events.
//		"Active" here means something similar to "focused", but
//		"focus" isn't quite the right word because we keep track of
//		a whole stack of "active" widgets.  Example: ComboButton --> Menu -->
//		MenuItem.  The onBlur event for ComboButton doesn't fire due to focusing
//		on the Menu or a MenuItem, since they are considered part of the
//		ComboButton widget.  It only happens when focus is shifted
//		somewhere completely different.

dojo.mixin(dijit, {
	// _curFocus: DomNode
	//		Currently focused item on screen
	_curFocus: null,

	// _prevFocus: DomNode
	//		Previously focused item on screen
	_prevFocus: null,

	isCollapsed: function(){
		// summary:
		//		Returns true if there is no text selected
		return dijit.getBookmark().isCollapsed;
	},

	getBookmark: function(){
		// summary:
		//		Retrieves a bookmark that can be used with moveToBookmark to return to the same range
		var bm, rg, tg, sel = dojo.doc.selection, cf = dijit._curFocus;

		if(dojo.global.getSelection){
			//W3C Range API for selections.
			sel = dojo.global.getSelection();
			if(sel){
				if(sel.isCollapsed){
					tg = cf? cf.tagName : "";
					if(tg){
						//Create a fake rangelike item to restore selections.
						tg = tg.toLowerCase();
						if(tg == "textarea" ||
								(tg == "input" && (!cf.type || cf.type.toLowerCase() == "text"))){
							sel = {
								start: cf.selectionStart,
								end: cf.selectionEnd,
								node: cf,
								pRange: true
							};
							return {isCollapsed: (sel.end <= sel.start), mark: sel}; //Object.
						}
					}
					bm = {isCollapsed:true};
				}else{
					rg = sel.getRangeAt(0);
					bm = {isCollapsed: false, mark: rg.cloneRange()};
				}
			}
		}else if(sel){
			// If the current focus was a input of some sort and no selection, don't bother saving
			// a native bookmark.  This is because it causes issues with dialog/page selection restore.
			// So, we need to create psuedo bookmarks to work with.
			tg = cf ? cf.tagName : "";
			tg = tg.toLowerCase();
			if(cf && tg && (tg == "button" || tg == "textarea" || tg == "input")){
				if(sel.type && sel.type.toLowerCase() == "none"){
					return {
						isCollapsed: true,
						mark: null
					}
				}else{
					rg = sel.createRange();
					return {
						isCollapsed: rg.text && rg.text.length?false:true,
						mark: {
							range: rg,
							pRange: true
						}
					};
				}
			}
			bm = {};

			//'IE' way for selections.
			try{
				// createRange() throws exception when dojo in iframe
				//and nothing selected, see #9632
				rg = sel.createRange();
				bm.isCollapsed = !(sel.type == 'Text' ? rg.htmlText.length : rg.length);
			}catch(e){
				bm.isCollapsed = true;
				return bm;
			}
			if(sel.type.toUpperCase() == 'CONTROL'){
				if(rg.length){
					bm.mark=[];
					var i=0,len=rg.length;
					while(i<len){
						bm.mark.push(rg.item(i++));
					}
				}else{
					bm.isCollapsed = true;
					bm.mark = null;
				}
			}else{
				bm.mark = rg.getBookmark();
			}
		}else{
			console.warn("No idea how to store the current selection for this browser!");
		}
		return bm; // Object
	},

	moveToBookmark: function(/*Object*/bookmark){
		// summary:
		//		Moves current selection to a bookmark
		// bookmark:
		//		This should be a returned object from dijit.getBookmark()

		var _doc = dojo.doc,
			mark = bookmark.mark;
		if(mark){
			if(dojo.global.getSelection){
				//W3C Rangi API (FF, WebKit, Opera, etc)
				var sel = dojo.global.getSelection();
				if(sel && sel.removeAllRanges){
					if(mark.pRange){
						var r = mark;
						var n = r.node;
						n.selectionStart = r.start;
						n.selectionEnd = r.end;
					}else{
						sel.removeAllRanges();
						sel.addRange(mark);
					}
				}else{
					console.warn("No idea how to restore selection for this browser!");
				}
			}else if(_doc.selection && mark){
				//'IE' way.
				var rg;
				if(mark.pRange){
					rg = mark.range;
				}else if(dojo.isArray(mark)){
					rg = _doc.body.createControlRange();
					//rg.addElement does not have call/apply method, so can not call it directly
					//rg is not available in "range.addElement(item)", so can't use that either
					dojo.forEach(mark, function(n){
						rg.addElement(n);
					});
				}else{
					rg = _doc.body.createTextRange();
					rg.moveToBookmark(mark);
				}
				rg.select();
			}
		}
	},

	getFocus: function(/*Widget?*/ menu, /*Window?*/ openedForWindow){
		// summary:
		//		Called as getFocus(), this returns an Object showing the current focus
		//		and selected text.
		//
		//		Called as getFocus(widget), where widget is a (widget representing) a button
		//		that was just pressed, it returns where focus was before that button
		//		was pressed.   (Pressing the button may have either shifted focus to the button,
		//		or removed focus altogether.)   In this case the selected text is not returned,
		//		since it can't be accurately determined.
		//
		// menu: dijit._Widget or {domNode: DomNode} structure
		//		The button that was just pressed.  If focus has disappeared or moved
		//		to this button, returns the previous focus.  In this case the bookmark
		//		information is already lost, and null is returned.
		//
		// openedForWindow:
		//		iframe in which menu was opened
		//
		// returns:
		//		A handle to restore focus/selection, to be passed to `dijit.focus`
		var node = !dijit._curFocus || (menu && dojo.isDescendant(dijit._curFocus, menu.domNode)) ? dijit._prevFocus : dijit._curFocus;
		return {
			node: node,
			bookmark: (node == dijit._curFocus) && dojo.withGlobal(openedForWindow || dojo.global, dijit.getBookmark),
			openedForWindow: openedForWindow
		}; // Object
	},

	focus: function(/*Object || DomNode */ handle){
		// summary:
		//		Sets the focused node and the selection according to argument.
		//		To set focus to an iframe's content, pass in the iframe itself.
		// handle:
		//		object returned by get(), or a DomNode

		if(!handle){ return; }

		var node = "node" in handle ? handle.node : handle,		// because handle is either DomNode or a composite object
			bookmark = handle.bookmark,
			openedForWindow = handle.openedForWindow,
			collapsed = bookmark ? bookmark.isCollapsed : false;

		// Set the focus
		// Note that for iframe's we need to use the <iframe> to follow the parentNode chain,
		// but we need to set focus to iframe.contentWindow
		if(node){
			var focusNode = (node.tagName.toLowerCase() == "iframe") ? node.contentWindow : node;
			if(focusNode && focusNode.focus){
				try{
					// Gecko throws sometimes if setting focus is impossible,
					// node not displayed or something like that
					focusNode.focus();
				}catch(e){/*quiet*/}
			}
			dijit._onFocusNode(node);
		}

		// set the selection
		// do not need to restore if current selection is not empty
		// (use keyboard to select a menu item) or if previous selection was collapsed
		// as it may cause focus shift (Esp in IE).
		if(bookmark && dojo.withGlobal(openedForWindow || dojo.global, dijit.isCollapsed) && !collapsed){
			if(openedForWindow){
				openedForWindow.focus();
			}
			try{
				dojo.withGlobal(openedForWindow || dojo.global, dijit.moveToBookmark, null, [bookmark]);
			}catch(e2){
				/*squelch IE internal error, see http://trac.dojotoolkit.org/ticket/1984 */
			}
		}
	},

	// _activeStack: dijit._Widget[]
	//		List of currently active widgets (focused widget and it's ancestors)
	_activeStack: [],

	registerIframe: function(/*DomNode*/ iframe){
		// summary:
		//		Registers listeners on the specified iframe so that any click
		//		or focus event on that iframe (or anything in it) is reported
		//		as a focus/click event on the <iframe> itself.
		// description:
		//		Currently only used by editor.
		// returns:
		//		Handle to pass to unregisterIframe()
		return dijit.registerWin(iframe.contentWindow, iframe);
	},

	unregisterIframe: function(/*Object*/ handle){
		// summary:
		//		Unregisters listeners on the specified iframe created by registerIframe.
		//		After calling be sure to delete or null out the handle itself.
		// handle:
		//		Handle returned by registerIframe()

		dijit.unregisterWin(handle);
	},

	registerWin: function(/*Window?*/targetWindow, /*DomNode?*/ effectiveNode){
		// summary:
		//		Registers listeners on the specified window (either the main
		//		window or an iframe's window) to detect when the user has clicked somewhere
		//		or focused somewhere.
		// description:
		//		Users should call registerIframe() instead of this method.
		// targetWindow:
		//		If specified this is the window associated with the iframe,
		//		i.e. iframe.contentWindow.
		// effectiveNode:
		//		If specified, report any focus events inside targetWindow as
		//		an event on effectiveNode, rather than on evt.target.
		// returns:
		//		Handle to pass to unregisterWin()

		// TODO: make this function private in 2.0; Editor/users should call registerIframe(),

		var mousedownListener = function(evt){
			dijit._justMouseDowned = true;
			setTimeout(function(){ dijit._justMouseDowned = false; }, 0);
			dijit._onTouchNode(effectiveNode || evt.target || evt.srcElement, "mouse");
		};
		//dojo.connect(targetWindow, "onscroll", ???);

		// Listen for blur and focus events on targetWindow's document.
		// IIRC, I'm using attachEvent() rather than dojo.connect() because focus/blur events don't bubble
		// through dojo.connect(), and also maybe to catch the focus events early, before onfocus handlers
		// fire.
		// Connect to <html> (rather than document) on IE to avoid memory leaks, but document on other browsers because
		// (at least for FF) the focus event doesn't fire on <html> or <body>.
		var doc = dojo.isIE ? targetWindow.document.documentElement : targetWindow.document;
		if(doc){
			if(dojo.isIE){
				doc.attachEvent('onmousedown', mousedownListener);
				var activateListener = function(evt){
					// IE reports that nodes like <body> have gotten focus, even though they have tabIndex=-1,
					// Should consider those more like a mouse-click than a focus....
					if(evt.srcElement.tagName.toLowerCase() != "#document" &&
						dijit.isTabNavigable(evt.srcElement)){
						dijit._onFocusNode(effectiveNode || evt.srcElement);
					}else{
						dijit._onTouchNode(effectiveNode || evt.srcElement);
					}
				};
				doc.attachEvent('onactivate', activateListener);
				var deactivateListener =  function(evt){
					dijit._onBlurNode(effectiveNode || evt.srcElement);
				};
				doc.attachEvent('ondeactivate', deactivateListener);

				return function(){
					doc.detachEvent('onmousedown', mousedownListener);
					doc.detachEvent('onactivate', activateListener);
					doc.detachEvent('ondeactivate', deactivateListener);
					doc = null;	// prevent memory leak (apparent circular reference via closure)
				};
			}else{
				doc.addEventListener('mousedown', mousedownListener, true);
				var focusListener = function(evt){
					dijit._onFocusNode(effectiveNode || evt.target);
				};
				doc.addEventListener('focus', focusListener, true);
				var blurListener = function(evt){
					dijit._onBlurNode(effectiveNode || evt.target);
				};
				doc.addEventListener('blur', blurListener, true);

				return function(){
					doc.removeEventListener('mousedown', mousedownListener, true);
					doc.removeEventListener('focus', focusListener, true);
					doc.removeEventListener('blur', blurListener, true);
					doc = null;	// prevent memory leak (apparent circular reference via closure)
				};
			}
		}
	},

	unregisterWin: function(/*Handle*/ handle){
		// summary:
		//		Unregisters listeners on the specified window (either the main
		//		window or an iframe's window) according to handle returned from registerWin().
		//		After calling be sure to delete or null out the handle itself.

		// Currently our handle is actually a function
		handle && handle();
	},

	_onBlurNode: function(/*DomNode*/ node){
		// summary:
		// 		Called when focus leaves a node.
		//		Usually ignored, _unless_ it *isn't* follwed by touching another node,
		//		which indicates that we tabbed off the last field on the page,
		//		in which case every widget is marked inactive
		dijit._prevFocus = dijit._curFocus;
		dijit._curFocus = null;

		if(dijit._justMouseDowned){
			// the mouse down caused a new widget to be marked as active; this blur event
			// is coming late, so ignore it.
			return;
		}

		// if the blur event isn't followed by a focus event then mark all widgets as inactive.
		if(dijit._clearActiveWidgetsTimer){
			clearTimeout(dijit._clearActiveWidgetsTimer);
		}
		dijit._clearActiveWidgetsTimer = setTimeout(function(){
			delete dijit._clearActiveWidgetsTimer;
			dijit._setStack([]);
			dijit._prevFocus = null;
		}, 100);
	},

	_onTouchNode: function(/*DomNode*/ node, /*String*/ by){
		// summary:
		//		Callback when node is focused or mouse-downed
		// node:
		//		The node that was touched.
		// by:
		//		"mouse" if the focus/touch was caused by a mouse down event

		// ignore the recent blurNode event
		if(dijit._clearActiveWidgetsTimer){
			clearTimeout(dijit._clearActiveWidgetsTimer);
			delete dijit._clearActiveWidgetsTimer;
		}

		// compute stack of active widgets (ex: ComboButton --> Menu --> MenuItem)
		var newStack=[];
		try{
			while(node){
				var popupParent = dojo.attr(node, "dijitPopupParent");
				if(popupParent){
					node=dijit.byId(popupParent).domNode;
				}else if(node.tagName && node.tagName.toLowerCase() == "body"){
					// is this the root of the document or just the root of an iframe?
					if(node === dojo.body()){
						// node is the root of the main document
						break;
					}
					// otherwise, find the iframe this node refers to (can't access it via parentNode,
					// need to do this trick instead). window.frameElement is supported in IE/FF/Webkit
					node=dijit.getDocumentWindow(node.ownerDocument).frameElement;
				}else{
					var id = node.getAttribute && node.getAttribute("widgetId");
					if(id){
						newStack.unshift(id);
					}
					node=node.parentNode;
				}
			}
		}catch(e){ /* squelch */ }

		dijit._setStack(newStack, by);
	},

	_onFocusNode: function(/*DomNode*/ node){
		// summary:
		//		Callback when node is focused

		if(!node){
			return;
		}

		if(node.nodeType == 9){
			// Ignore focus events on the document itself.  This is here so that
			// (for example) clicking the up/down arrows of a spinner
			// (which don't get focus) won't cause that widget to blur. (FF issue)
			return;
		}

		dijit._onTouchNode(node);

		if(node == dijit._curFocus){ return; }
		if(dijit._curFocus){
			dijit._prevFocus = dijit._curFocus;
		}
		dijit._curFocus = node;
		dojo.publish("focusNode", [node]);
	},

	_setStack: function(/*String[]*/ newStack, /*String*/ by){
		// summary:
		//		The stack of active widgets has changed.  Send out appropriate events and records new stack.
		// newStack:
		//		array of widget id's, starting from the top (outermost) widget
		// by:
		//		"mouse" if the focus/touch was caused by a mouse down event

		var oldStack = dijit._activeStack;
		dijit._activeStack = newStack;

		// compare old stack to new stack to see how many elements they have in common
		for(var nCommon=0; nCommon<Math.min(oldStack.length, newStack.length); nCommon++){
			if(oldStack[nCommon] != newStack[nCommon]){
				break;
			}
		}

		var widget;
		// for all elements that have gone out of focus, send blur event
		for(var i=oldStack.length-1; i>=nCommon; i--){
			widget = dijit.byId(oldStack[i]);
			if(widget){
				widget._focused = false;
				widget._hasBeenBlurred = true;
				if(widget._onBlur){
					widget._onBlur(by);
				}
				if(widget._setStateClass){
					widget._setStateClass();
				}
				dojo.publish("widgetBlur", [widget, by]);
			}
		}

		// for all element that have come into focus, send focus event
		for(i=nCommon; i<newStack.length; i++){
			widget = dijit.byId(newStack[i]);
			if(widget){
				widget._focused = true;
				if(widget._onFocus){
					widget._onFocus(by);
				}
				if(widget._setStateClass){
					widget._setStateClass();
				}
				dojo.publish("widgetFocus", [widget, by]);
			}
		}
	}
});

// register top window and all the iframes it contains
dojo.addOnLoad(function(){
	var handle = dijit.registerWin(window);
	if(dojo.isIE){
		dojo.addOnWindowUnload(function(){
			dijit.unregisterWin(handle);
			handle = null;
		})
	}
});

}

if(!dojo._hasResource["dojo.AdapterRegistry"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.AdapterRegistry"] = true;
dojo.provide("dojo.AdapterRegistry");

dojo.AdapterRegistry = function(/*Boolean?*/ returnWrappers){
	//	summary:
	//		A registry to make contextual calling/searching easier.
	//	description:
	//		Objects of this class keep list of arrays in the form [name, check,
	//		wrap, directReturn] that are used to determine what the contextual
	//		result of a set of checked arguments is. All check/wrap functions
	//		in this registry should be of the same arity.
	//	example:
	//	|	// create a new registry
	//	|	var reg = new dojo.AdapterRegistry();
	//	|	reg.register("handleString",
	//	|		dojo.isString,
	//	|		function(str){
	//	|			// do something with the string here
	//	|		}
	//	|	);
	//	|	reg.register("handleArr",
	//	|		dojo.isArray,
	//	|		function(arr){
	//	|			// do something with the array here
	//	|		}
	//	|	);
	//	|
	//	|	// now we can pass reg.match() *either* an array or a string and
	//	|	// the value we pass will get handled by the right function
	//	|	reg.match("someValue"); // will call the first function
	//	|	reg.match(["someValue"]); // will call the second

	this.pairs = [];
	this.returnWrappers = returnWrappers || false; // Boolean
}

dojo.extend(dojo.AdapterRegistry, {
	register: function(/*String*/ name, /*Function*/ check, /*Function*/ wrap, /*Boolean?*/ directReturn, /*Boolean?*/ override){
		//	summary: 
		//		register a check function to determine if the wrap function or
		//		object gets selected
		//	name:
		//		a way to identify this matcher.
		//	check:
		//		a function that arguments are passed to from the adapter's
		//		match() function.  The check function should return true if the
		//		given arguments are appropriate for the wrap function.
		//	directReturn:
		//		If directReturn is true, the value passed in for wrap will be
		//		returned instead of being called. Alternately, the
		//		AdapterRegistry can be set globally to "return not call" using
		//		the returnWrappers property. Either way, this behavior allows
		//		the registry to act as a "search" function instead of a
		//		function interception library.
		//	override:
		//		If override is given and true, the check function will be given
		//		highest priority. Otherwise, it will be the lowest priority
		//		adapter.
		this.pairs[((override) ? "unshift" : "push")]([name, check, wrap, directReturn]);
	},

	match: function(/* ... */){
		// summary:
		//		Find an adapter for the given arguments. If no suitable adapter
		//		is found, throws an exception. match() accepts any number of
		//		arguments, all of which are passed to all matching functions
		//		from the registered pairs.
		for(var i = 0; i < this.pairs.length; i++){
			var pair = this.pairs[i];
			if(pair[1].apply(this, arguments)){
				if((pair[3])||(this.returnWrappers)){
					return pair[2];
				}else{
					return pair[2].apply(this, arguments);
				}
			}
		}
		throw new Error("No match found");
	},

	unregister: function(name){
		// summary: Remove a named adapter from the registry

		// FIXME: this is kind of a dumb way to handle this. On a large
		// registry this will be slow-ish and we can use the name as a lookup
		// should we choose to trade memory for speed.
		for(var i = 0; i < this.pairs.length; i++){
			var pair = this.pairs[i];
			if(pair[0] == name){
				this.pairs.splice(i, 1);
				return true;
			}
		}
		return false;
	}
});

}

if(!dojo._hasResource["dijit._base.place"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.place"] = true;
dojo.provide("dijit._base.place");



// ported from dojo.html.util

dijit.getViewport = function(){
	// summary:
	//		Returns the dimensions and scroll position of the viewable area of a browser window

	var scrollRoot = (dojo.doc.compatMode == 'BackCompat')? dojo.body() : dojo.doc.documentElement;

	// get scroll position
	var scroll = dojo._docScroll(); // scrollRoot.scrollTop/Left should work
	return { w: scrollRoot.clientWidth, h: scrollRoot.clientHeight, l: scroll.x, t: scroll.y };
};

/*=====
dijit.__Position = function(){
	// x: Integer
	//		horizontal coordinate in pixels, relative to document body
	// y: Integer
	//		vertical coordinate in pixels, relative to document body

	thix.x = x;
	this.y = y;
}
=====*/


dijit.placeOnScreen = function(
	/* DomNode */			node,
	/* dijit.__Position */	pos,
	/* String[] */			corners,
	/* dijit.__Position? */	padding){
	// summary:
	//		Positions one of the node's corners at specified position
	//		such that node is fully visible in viewport.
	// description:
	//		NOTE: node is assumed to be absolutely or relatively positioned.
	//	pos:
	//		Object like {x: 10, y: 20}
	//	corners:
	//		Array of Strings representing order to try corners in, like ["TR", "BL"].
	//		Possible values are:
	//			* "BL" - bottom left
	//			* "BR" - bottom right
	//			* "TL" - top left
	//			* "TR" - top right
	//	padding:
	//		set padding to put some buffer around the element you want to position.
	// example:
	//		Try to place node's top right corner at (10,20).
	//		If that makes node go (partially) off screen, then try placing
	//		bottom left corner at (10,20).
	//	|	placeOnScreen(node, {x: 10, y: 20}, ["TR", "BL"])

	var choices = dojo.map(corners, function(corner){
		var c = { corner: corner, pos: {x:pos.x,y:pos.y} };
		if(padding){
			c.pos.x += corner.charAt(1) == 'L' ? padding.x : -padding.x;
			c.pos.y += corner.charAt(0) == 'T' ? padding.y : -padding.y;
		}
		return c;
	});

	return dijit._place(node, choices);
}

dijit._place = function(/*DomNode*/ node, /* Array */ choices, /* Function */ layoutNode){
	// summary:
	//		Given a list of spots to put node, put it at the first spot where it fits,
	//		of if it doesn't fit anywhere then the place with the least overflow
	// choices: Array
	//		Array of elements like: {corner: 'TL', pos: {x: 10, y: 20} }
	//		Above example says to put the top-left corner of the node at (10,20)
	// layoutNode: Function(node, aroundNodeCorner, nodeCorner)
	//		for things like tooltip, they are displayed differently (and have different dimensions)
	//		based on their orientation relative to the parent.   This adjusts the popup based on orientation.

	// get {x: 10, y: 10, w: 100, h:100} type obj representing position of
	// viewport over document
	var view = dijit.getViewport();

	// This won't work if the node is inside a <div style="position: relative">,
	// so reattach it to dojo.doc.body.   (Otherwise, the positioning will be wrong
	// and also it might get cutoff)
	if(!node.parentNode || String(node.parentNode.tagName).toLowerCase() != "body"){
		dojo.body().appendChild(node);
	}

	var best = null;
	dojo.some(choices, function(choice){
		var corner = choice.corner;
		var pos = choice.pos;

		// configure node to be displayed in given position relative to button
		// (need to do this in order to get an accurate size for the node, because
		// a tooltips size changes based on position, due to triangle)
		if(layoutNode){
			layoutNode(node, choice.aroundCorner, corner);
		}

		// get node's size
		var style = node.style;
		var oldDisplay = style.display;
		var oldVis = style.visibility;
		style.visibility = "hidden";
		style.display = "";
		var mb = dojo.marginBox(node);
		style.display = oldDisplay;
		style.visibility = oldVis;

		// coordinates and size of node with specified corner placed at pos,
		// and clipped by viewport
		var startX = Math.max(view.l, corner.charAt(1) == 'L' ? pos.x : (pos.x - mb.w)),
			startY = Math.max(view.t, corner.charAt(0) == 'T' ? pos.y : (pos.y - mb.h)),
			endX = Math.min(view.l + view.w, corner.charAt(1) == 'L' ? (startX + mb.w) : pos.x),
			endY = Math.min(view.t + view.h, corner.charAt(0) == 'T' ? (startY + mb.h) : pos.y),
			width = endX - startX,
			height = endY - startY,
			overflow = (mb.w - width) + (mb.h - height);

		if(best == null || overflow < best.overflow){
			best = {
				corner: corner,
				aroundCorner: choice.aroundCorner,
				x: startX,
				y: startY,
				w: width,
				h: height,
				overflow: overflow
			};
		}
		return !overflow;
	});

	node.style.left = best.x + "px";
	node.style.top = best.y + "px";
	if(best.overflow && layoutNode){
		layoutNode(node, best.aroundCorner, best.corner);
	}
	return best;
}

dijit.placeOnScreenAroundNode = function(
	/* DomNode */		node,
	/* DomNode */		aroundNode,
	/* Object */		aroundCorners,
	/* Function? */		layoutNode){

	// summary:
	//		Position node adjacent or kitty-corner to aroundNode
	//		such that it's fully visible in viewport.
	//
	// description:
	//		Place node such that corner of node touches a corner of
	//		aroundNode, and that node is fully visible.
	//
	// aroundCorners:
	//		Ordered list of pairs of corners to try matching up.
	//		Each pair of corners is represented as a key/value in the hash,
	//		where the key corresponds to the aroundNode's corner, and
	//		the value corresponds to the node's corner:
	//
	//	|	{ aroundNodeCorner1: nodeCorner1, aroundNodeCorner2: nodeCorner2, ...}
	//
	//		The following strings are used to represent the four corners:
	//			* "BL" - bottom left
	//			* "BR" - bottom right
	//			* "TL" - top left
	//			* "TR" - top right
	//
	// layoutNode: Function(node, aroundNodeCorner, nodeCorner)
	//		For things like tooltip, they are displayed differently (and have different dimensions)
	//		based on their orientation relative to the parent.   This adjusts the popup based on orientation.
	//
	// example:
	//	|	dijit.placeOnScreenAroundNode(node, aroundNode, {'BL':'TL', 'TR':'BR'});
	//		This will try to position node such that node's top-left corner is at the same position
	//		as the bottom left corner of the aroundNode (ie, put node below
	//		aroundNode, with left edges aligned).  If that fails it will try to put
	// 		the bottom-right corner of node where the top right corner of aroundNode is
	//		(ie, put node above aroundNode, with right edges aligned)
	//

	// get coordinates of aroundNode
	aroundNode = dojo.byId(aroundNode);
	var oldDisplay = aroundNode.style.display;
	aroundNode.style.display="";
	// #3172: use the slightly tighter border box instead of marginBox
	var aroundNodePos = dojo.position(aroundNode, true);
	aroundNode.style.display=oldDisplay;

	// place the node around the calculated rectangle
	return dijit._placeOnScreenAroundRect(node,
		aroundNodePos.x, aroundNodePos.y, aroundNodePos.w, aroundNodePos.h,	// rectangle
		aroundCorners, layoutNode);
};

/*=====
dijit.__Rectangle = function(){
	// x: Integer
	//		horizontal offset in pixels, relative to document body
	// y: Integer
	//		vertical offset in pixels, relative to document body
	// width: Integer
	//		width in pixels
	// height: Integer
	//		height in pixels

	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
}
=====*/


dijit.placeOnScreenAroundRectangle = function(
	/* DomNode */			node,
	/* dijit.__Rectangle */	aroundRect,
	/* Object */			aroundCorners,
	/* Function */			layoutNode){

	// summary:
	//		Like dijit.placeOnScreenAroundNode(), except that the "around"
	//		parameter is an arbitrary rectangle on the screen (x, y, width, height)
	//		instead of a dom node.

	return dijit._placeOnScreenAroundRect(node,
		aroundRect.x, aroundRect.y, aroundRect.width, aroundRect.height,	// rectangle
		aroundCorners, layoutNode);
};

dijit._placeOnScreenAroundRect = function(
	/* DomNode */		node,
	/* Number */		x,
	/* Number */		y,
	/* Number */		width,
	/* Number */		height,
	/* Object */		aroundCorners,
	/* Function */		layoutNode){

	// summary:
	//		Like dijit.placeOnScreenAroundNode(), except it accepts coordinates
	//		of a rectangle to place node adjacent to.

	// TODO: combine with placeOnScreenAroundRectangle()

	// Generate list of possible positions for node
	var choices = [];
	for(var nodeCorner in aroundCorners){
		choices.push( {
			aroundCorner: nodeCorner,
			corner: aroundCorners[nodeCorner],
			pos: {
				x: x + (nodeCorner.charAt(1) == 'L' ? 0 : width),
				y: y + (nodeCorner.charAt(0) == 'T' ? 0 : height)
			}
		});
	}

	return dijit._place(node, choices, layoutNode);
};

dijit.placementRegistry= new dojo.AdapterRegistry();
dijit.placementRegistry.register("node",
	function(n, x){
		return typeof x == "object" &&
			typeof x.offsetWidth != "undefined" && typeof x.offsetHeight != "undefined";
	},
	dijit.placeOnScreenAroundNode);
dijit.placementRegistry.register("rect",
	function(n, x){
		return typeof x == "object" &&
			"x" in x && "y" in x && "width" in x && "height" in x;
	},
	dijit.placeOnScreenAroundRectangle);

dijit.placeOnScreenAroundElement = function(
	/* DomNode */		node,
	/* Object */		aroundElement,
	/* Object */		aroundCorners,
	/* Function */		layoutNode){

	// summary:
	//		Like dijit.placeOnScreenAroundNode(), except it accepts an arbitrary object
	//		for the "around" argument and finds a proper processor to place a node.

	return dijit.placementRegistry.match.apply(dijit.placementRegistry, arguments);
};

dijit.getPopupAlignment = function(/*Array*/ position, /*Boolean*/ leftToRight){
	// summary:
	//		Transforms the passed array of preferred positions into a format suitable for passing as the aroundCorners argument to dijit.placeOnScreenAroundElement.
	//
	// position: String[]
	//		This variable controls the position of the drop down.
	//		It's an array of strings with the following values:
	//
	//			* before: places drop down to the left of the target node/widget, or to the right in
	//			  the case of RTL scripts like Hebrew and Arabic
	//			* after: places drop down to the right of the target node/widget, or to the left in
	//			  the case of RTL scripts like Hebrew and Arabic
	//			* above: drop down goes above target node
	//			* below: drop down goes below target node
	//
	//		The list is positions is tried, in order, until a position is found where the drop down fits
	//		within the viewport.
	//
	// leftToRight: Boolean
	//		Whether the popup will be displaying in leftToRight mode.
	//
	var align = {};
	dojo.forEach(position, function(pos){
		switch(pos){
			case "after":
				align[leftToRight ? "BR" : "BL"] = leftToRight ? "BL" : "BR";
				break;
			case "before":
				align[leftToRight ? "BL" : "BR"] = leftToRight ? "BR" : "BL";
				break;
			case "below":
				// first try to align left borders, next try to align right borders (or reverse for RTL mode)
				align[leftToRight ? "BL" : "BR"] = leftToRight ? "TL" : "TR";
				align[leftToRight ? "BR" : "BL"] = leftToRight ? "TR" : "TL";
				break;
			case "above":
			default:
				// first try to align left borders, next try to align right borders (or reverse for RTL mode)
				align[leftToRight ? "TL" : "TR"] = leftToRight ? "BL" : "BR";
				align[leftToRight ? "TR" : "TL"] = leftToRight ? "BR" : "BL";
				break;
		}
	});
	return align;
};
dijit.getPopupAroundAlignment = function(/*Array*/ position, /*Boolean*/ leftToRight){
	// summary:
	//		Transforms the passed array of preferred positions into a format suitable for passing as the aroundCorners argument to dijit.placeOnScreenAroundElement.
	//
	// position: String[]
	//		This variable controls the position of the drop down.
	//		It's an array of strings with the following values:
	//
	//			* before: places drop down to the left of the target node/widget, or to the right in
	//			  the case of RTL scripts like Hebrew and Arabic
	//			* after: places drop down to the right of the target node/widget, or to the left in
	//			  the case of RTL scripts like Hebrew and Arabic
	//			* above: drop down goes above target node
	//			* below: drop down goes below target node
	//
	//		The list is positions is tried, in order, until a position is found where the drop down fits
	//		within the viewport.
	//
	// leftToRight: Boolean
	//		Whether the popup will be displaying in leftToRight mode.
	//
	var align = {};
	dojo.forEach(position, function(pos){
		switch(pos){
			case "after":
				align[leftToRight ? "BR" : "BL"] = leftToRight ? "BL" : "BR";
				break;
			case "before":
				align[leftToRight ? "BL" : "BR"] = leftToRight ? "BR" : "BL";
				break;
			case "below":
				// first try to align left borders, next try to align right borders (or reverse for RTL mode)
				align[leftToRight ? "BL" : "BR"] = leftToRight ? "TL" : "TR";
				align[leftToRight ? "BR" : "BL"] = leftToRight ? "TR" : "TL";
				break;
			case "above":
			default:
				// first try to align left borders, next try to align right borders (or reverse for RTL mode)
				align[leftToRight ? "TL" : "TR"] = leftToRight ? "BL" : "BR";
				align[leftToRight ? "TR" : "TL"] = leftToRight ? "BR" : "BL";
				break;
		}
	});
	return align;
};

}

if(!dojo._hasResource["dijit._base.window"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.window"] = true;
dojo.provide("dijit._base.window");

// TODO: remove this in 2.0, it's not used anymore, or at least not internally

dijit.getDocumentWindow = function(doc){
	// summary:
	// 		Get window object associated with document doc

	// In some IE versions (at least 6.0), document.parentWindow does not return a
	// reference to the real window object (maybe a copy), so we must fix it as well
	// We use IE specific execScript to attach the real window reference to
	// document._parentWindow for later use
	if(dojo.isIE && window !== document.parentWindow && !doc._parentWindow){
		/*
		In IE 6, only the variable "window" can be used to connect events (others
		may be only copies).
		*/
		doc.parentWindow.execScript("document._parentWindow = window;", "Javascript");
		//to prevent memory leak, unset it after use
		//another possibility is to add an onUnload handler which seems overkill to me (liucougar)
		var win = doc._parentWindow;
		doc._parentWindow = null;
		return win;	//	Window
	}

	return doc._parentWindow || doc.parentWindow || doc.defaultView;	//	Window
}

}

if(!dojo._hasResource["dijit._base.popup"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.popup"] = true;
dojo.provide("dijit._base.popup");





dijit.popup = new function(){
	// summary:
	//		This class is used to show/hide widgets as popups.

	var stack = [],
		beginZIndex=1000,
		idGen = 1;

	this.moveOffScreen = function(/*DomNode*/ node){
		// summary:
		//		Moves node offscreen without hiding it (so that all layout widgets included 
		//		in this node can still layout properly)
		//
		// description:
		//		Attaches node to dojo.doc.body, and
		//		positions it off screen, but not display:none, so that
		//		the widget doesn't appear in the page flow and/or cause a blank
		//		area at the bottom of the viewport (making scrollbar longer), but
		//		initialization of contained widgets works correctly

		var s = node.style;
		s.visibility = "hidden";	// so TAB key doesn't navigate to hidden popup
		s.position = "absolute";
		s.top = "-9999px";
		if(s.display == "none"){
			s.display="";
		}
		dojo.body().appendChild(node);
	};

/*=====
dijit.popup.__OpenArgs = function(){
	// popup: Widget
	//		widget to display
	// parent: Widget
	//		the button etc. that is displaying this popup
	// around: DomNode
	//		DOM node (typically a button); place popup relative to this node.  (Specify this *or* "x" and "y" parameters.)
	// x: Integer
	//		Absolute horizontal position (in pixels) to place node at.  (Specify this *or* "around" parameter.)
	// y: Integer
	//		Absolute vertical position (in pixels) to place node at.  (Specity this *or* "around" parameter.)
	// orient: Object || String
	//		When the around parameter is specified, orient should be an
	//		ordered list of tuples of the form (around-node-corner, popup-node-corner).
	//		dijit.popup.open() tries to position the popup according to each tuple in the list, in order,
	//		until the popup appears fully within the viewport.
	//
	//		The default value is {BL:'TL', TL:'BL'}, which represents a list of two tuples:
	//			1. (BL, TL)
	//			2. (TL, BL)
	//		where BL means "bottom left" and "TL" means "top left".
	//		So by default, it first tries putting the popup below the around node, left-aligning them,
	//		and then tries to put it above the around node, still left-aligning them.   Note that the
	//		default is horizontally reversed when in RTL mode.
	//
	//		When an (x,y) position is specified rather than an around node, orient is either
	//		"R" or "L".  R (for right) means that it tries to put the popup to the right of the mouse,
	//		specifically positioning the popup's top-right corner at the mouse position, and if that doesn't
	//		fit in the viewport, then it tries, in order, the bottom-right corner, the top left corner,
	//		and the top-right corner.
	// onCancel: Function
	//		callback when user has canceled the popup by
	//			1. hitting ESC or
	//			2. by using the popup widget's proprietary cancel mechanism (like a cancel button in a dialog);
	//			   i.e. whenever popupWidget.onCancel() is called, args.onCancel is called
	// onClose: Function
	//		callback whenever this popup is closed
	// onExecute: Function
	//		callback when user "executed" on the popup/sub-popup by selecting a menu choice, etc. (top menu only)
	// padding: dijit.__Position
	//		adding a buffer around the opening position. This is only useful when around is not set.
	this.popup = popup;
	this.parent = parent;
	this.around = around;
	this.x = x;
	this.y = y;
	this.orient = orient;
	this.onCancel = onCancel;
	this.onClose = onClose;
	this.onExecute = onExecute;
	this.padding = padding;
}
=====*/

	// Compute the closest ancestor popup that's *not* a child of another popup.
	// Ex: For a TooltipDialog with a button that spawns a tree of menus, find the popup of the button.
	var getTopPopup = function(){
		for(var pi=stack.length-1; pi > 0 && stack[pi].parent === stack[pi-1].widget; pi--){
			/* do nothing, just trying to get right value for pi */
		}
		return stack[pi];
	};

	var wrappers=[];
	this.open = function(/*dijit.popup.__OpenArgs*/ args){
		// summary:
		//		Popup the widget at the specified position
		//
		// example:
		//		opening at the mouse position
		//		|		dijit.popup.open({popup: menuWidget, x: evt.pageX, y: evt.pageY});
		//
		// example:
		//		opening the widget as a dropdown
		//		|		dijit.popup.open({parent: this, popup: menuWidget, around: this.domNode, onClose: function(){...}});
		//
		//		Note that whatever widget called dijit.popup.open() should also listen to its own _onBlur callback
		//		(fired from _base/focus.js) to know that focus has moved somewhere else and thus the popup should be closed.

		var widget = args.popup,
			orient = args.orient || (
				dojo._isBodyLtr() ?
				{'BL':'TL', 'BR':'TR', 'TL':'BL', 'TR':'BR'} :
				{'BR':'TR', 'BL':'TL', 'TR':'BR', 'TL':'BL'}
			),
			around = args.around,
			id = (args.around && args.around.id) ? (args.around.id+"_dropdown") : ("popup_"+idGen++);

		// make wrapper div to hold widget and possibly hold iframe behind it.
		// we can't attach the iframe as a child of the widget.domNode because
		// widget.domNode might be a <table>, <ul>, etc.

		var wrapperobj = wrappers.pop(), wrapper, iframe;
		if(!wrapperobj){
			wrapper = dojo.create("div",{
				"class":"dijitPopup"
			}, dojo.body());
			dijit.setWaiRole(wrapper, "presentation");
		}else{
			// recycled a old wrapper, so that we don't need to reattach the iframe
			// which is slow even if the iframe is empty, see #10167
			wrapper = wrapperobj[0];
			iframe = wrapperobj[1];
		}

		dojo.attr(wrapper,{
			id: id,
			style:{
				zIndex: beginZIndex + stack.length,
				visibility:"hidden",
				// prevent transient scrollbar causing misalign (#5776), and initial flash in upper left (#10111)
				top: "-9999px"
			},
			dijitPopupParent: args.parent ? args.parent.id : ""
		});

		var s = widget.domNode.style;
		s.display = "";
		s.visibility = "";
		s.position = "";
		s.top = "0px";
		wrapper.appendChild(widget.domNode);

		if(!iframe){
			iframe = new dijit.BackgroundIframe(wrapper);
		}else{
			iframe.resize(wrapper)
		}

		// position the wrapper node
		var best = around ?
			dijit.placeOnScreenAroundElement(wrapper, around, orient, widget.orient ? dojo.hitch(widget, "orient") : null) :
			dijit.placeOnScreen(wrapper, args, orient == 'R' ? ['TR','BR','TL','BL'] : ['TL','BL','TR','BR'], args.padding);

		wrapper.style.visibility = "visible";
		// TODO: use effects to fade in wrapper

		var handlers = [];

		// provide default escape and tab key handling
		// (this will work for any widget, not just menu)
		handlers.push(dojo.connect(wrapper, "onkeypress", this, function(evt){
			if(evt.charOrCode == dojo.keys.ESCAPE && args.onCancel){
				dojo.stopEvent(evt);
				args.onCancel();
			}else if(evt.charOrCode === dojo.keys.TAB){
				dojo.stopEvent(evt);
				var topPopup = getTopPopup();
				if(topPopup && topPopup.onCancel){
					topPopup.onCancel();
				}
			}
		}));

		// watch for cancel/execute events on the popup and notify the caller
		// (for a menu, "execute" means clicking an item)
		if(widget.onCancel){
			handlers.push(dojo.connect(widget, "onCancel", args.onCancel));
		}

		handlers.push(dojo.connect(widget, widget.onExecute ? "onExecute" : "onChange", function(){
			var topPopup = getTopPopup();
			if(topPopup && topPopup.onExecute){
				topPopup.onExecute();
			}
		}));

		stack.push({
			wrapper: wrapper,
			iframe: iframe,
			widget: widget,
			parent: args.parent,
			onExecute: args.onExecute,
			onCancel: args.onCancel,
 			onClose: args.onClose,
			handlers: handlers
		});

		if(widget.onOpen){
			// TODO: in 2.0 standardize onShow() (used by StackContainer) and onOpen() (used here)
			widget.onOpen(best);
		}

		return best;
	};

	this.close = function(/*dijit._Widget*/ popup){
		// summary:
		//		Close specified popup and any popups that it parented
		
		// Basically work backwards from the top of the stack closing popups
		// until we hit the specified popup, but IIRC there was some issue where closing
		// a popup would cause others to close too.  Thus if we are trying to close B in [A,B,C]
		// closing C might close B indirectly and then the while() condition will run where stack==[A]...
		// so the while condition is constructed defensively.
		while(dojo.some(stack, function(elem){return elem.widget == popup;})){
			var top = stack.pop(),
				wrapper = top.wrapper,
				iframe = top.iframe,
				widget = top.widget,
				onClose = top.onClose;

			if(widget.onClose){
				// TODO: in 2.0 standardize onHide() (used by StackContainer) and onClose() (used here)
				widget.onClose();
			}
			dojo.forEach(top.handlers, dojo.disconnect);

			// Move the widget offscreen, unless it has already been destroyed in above onClose() etc.
			if(widget && widget.domNode){
				this.moveOffScreen(widget.domNode);
			}
                        
			// recycle the wrapper plus iframe, so we prevent reattaching iframe everytime an popup opens
			// don't use moveOffScreen which would also reattach the wrapper to body, which causes reloading of iframe
			wrapper.style.top = "-9999px";
			wrapper.style.visibility = "hidden";
			wrappers.push([wrapper,iframe]);

			if(onClose){
				onClose();
			}
		}
	};
}();

dijit._frames = new function(){
	// summary:
	//		cache of iframes
	var queue = [];

	this.pop = function(){
		var iframe;
		if(queue.length){
			iframe = queue.pop();
			iframe.style.display="";
		}else{
			if(dojo.isIE){
				var burl = dojo.config["dojoBlankHtmlUrl"] || (dojo.moduleUrl("dojo", "resources/blank.html")+"") || "javascript:\"\"";
				var html="<iframe src='" + burl + "'"
					+ " style='position: absolute; left: 0px; top: 0px;"
					+ "z-index: -1; filter:Alpha(Opacity=\"0\");'>";
				iframe = dojo.doc.createElement(html);
			}else{
			 	iframe = dojo.create("iframe");
				iframe.src = 'javascript:""';
				iframe.className = "dijitBackgroundIframe";
				dojo.style(iframe, "opacity", 0.1);
			}
			iframe.tabIndex = -1; // Magic to prevent iframe from getting focus on tab keypress - as style didnt work.
		}
		return iframe;
	};

	this.push = function(iframe){
		iframe.style.display="none";
		queue.push(iframe);
	}
}();


dijit.BackgroundIframe = function(/* DomNode */node){
	// summary:
	//		For IE/FF z-index schenanigans. id attribute is required.
	//
	// description:
	//		new dijit.BackgroundIframe(node)
	//			Makes a background iframe as a child of node, that fills
	//			area (and position) of node

	if(!node.id){ throw new Error("no id"); }
	if(dojo.isIE || dojo.isMoz){
		var iframe = dijit._frames.pop();
		node.appendChild(iframe);
		if(dojo.isIE<7){
			this.resize(node);
			this._conn = dojo.connect(node, 'onresize', this, function(){
				this.resize(node);
			});
		}else{
			dojo.style(iframe, {
				width: '100%',
				height: '100%'
			});
		}
		this.iframe = iframe;
	}
};

dojo.extend(dijit.BackgroundIframe, {
	resize: function(node){
		// summary:
		// 		resize the iframe so its the same size as node
		// description:
		//		this function is a no-op in all browsers except
		//		IE6, which does not support 100% width/height 
		//		of absolute positioned iframes
		if(this.iframe && dojo.isIE<7){
			dojo.style(this.iframe, {
				width: node.offsetWidth + 'px',
				height: node.offsetHeight + 'px'
			});
		}
	},
	destroy: function(){
		// summary:
		//		destroy the iframe
		if(this._conn){
			dojo.disconnect(this._conn);
			this._conn = null;
		}
		if(this.iframe){
			dijit._frames.push(this.iframe);
			delete this.iframe;
		}
	}
});

}

if(!dojo._hasResource["dijit._base.scroll"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.scroll"] = true;
dojo.provide("dijit._base.scroll");

dijit.scrollIntoView = function(/*DomNode*/ node, /*Object?*/ pos){
	// summary:
	//		Scroll the passed node into view, if it is not already.
	
	// don't rely on that node.scrollIntoView works just because the function is there

	try{ // catch unexpected/unrecreatable errors (#7808) since we can recover using a semi-acceptable native method
	node = dojo.byId(node);
	var doc = node.ownerDocument || dojo.doc,
		body = doc.body || dojo.body(),
		html = doc.documentElement || body.parentNode,
		isIE = dojo.isIE, isWK = dojo.isWebKit;
	// if an untested browser, then use the native method
	if((!(dojo.isMoz || isIE || isWK) || node == body || node == html) && (typeof node.scrollIntoView != "undefined")){
		node.scrollIntoView(false); // short-circuit to native if possible
		return;
	}
	var backCompat = doc.compatMode == 'BackCompat',
		clientAreaRoot = backCompat? body : html,
		scrollRoot = isWK ? body : clientAreaRoot,
		rootWidth = clientAreaRoot.clientWidth,
		rootHeight = clientAreaRoot.clientHeight,
		rtl = !dojo._isBodyLtr(),
		nodePos = pos || dojo.position(node),
		el = node.parentNode,
		isFixed = function(el){
			return ((isIE <= 6 || (isIE && backCompat))? false : (dojo.style(el, 'position').toLowerCase() == "fixed"));
		};
	if(isFixed(node)){ return; } // nothing to do
	while(el){
		if(el == body){ el = scrollRoot; }
		var elPos = dojo.position(el),
			fixedPos = isFixed(el);
		with(elPos){
			if(el == scrollRoot){
				w = rootWidth, h = rootHeight;
				if(scrollRoot == html && isIE && rtl){ x += scrollRoot.offsetWidth-w; } // IE workaround where scrollbar causes negative x
				if(x < 0 || !isIE){ x = 0; } // IE can have values > 0
				if(y < 0 || !isIE){ y = 0; }
			}else{
				var pb = dojo._getPadBorderExtents(el);
				w -= pb.w; h -= pb.h; x += pb.l; y += pb.t;
			}
			with(el){
				if(el != scrollRoot){ // body, html sizes already have the scrollbar removed
					var clientSize = clientWidth,
						scrollBarSize = w - clientSize;
					if(clientSize > 0 && scrollBarSize > 0){
						w = clientSize;
						if(isIE && rtl){ x += scrollBarSize; }
					}
					clientSize = clientHeight;
					scrollBarSize = h - clientSize;
					if(clientSize > 0 && scrollBarSize > 0){
						h = clientSize;
					}
				}
				if(fixedPos){ // bounded by viewport, not parents
					if(y < 0){
						h += y, y = 0;
					}
					if(x < 0){
						w += x, x = 0;
					}
					if(y + h > rootHeight){
						h = rootHeight - y;
					}
					if(x + w > rootWidth){
						w = rootWidth - x;
					}
				}
				// calculate overflow in all 4 directions
				var l = nodePos.x - x, // beyond left: < 0
					t = nodePos.y - Math.max(y, 0), // beyond top: < 0
					r = l + nodePos.w - w, // beyond right: > 0
					bot = t + nodePos.h - h; // beyond bottom: > 0
				if(r * l > 0){
					var s = Math[l < 0? "max" : "min"](l, r);
					nodePos.x += scrollLeft;
					scrollLeft += (isIE >= 8 && !backCompat && rtl)? -s : s;
					nodePos.x -= scrollLeft;
				}
				if(bot * t > 0){
					nodePos.y += scrollTop;
					scrollTop += Math[t < 0? "max" : "min"](t, bot);
					nodePos.y -= scrollTop;
				}
			}
		}
		el = (el != scrollRoot) && !fixedPos && el.parentNode;
	}
	}catch(error){
		console.error('scrollIntoView: ' + error);
		node.scrollIntoView(false);
	}
};

}

if(!dojo._hasResource["dijit._base.sniff"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.sniff"] = true;
// summary:
//		Applies pre-set CSS classes to the top-level HTML node, based on:
// 			- browser (ex: dj_ie)
//			- browser version (ex: dj_ie6)
//			- box model (ex: dj_contentBox)
//			- text direction (ex: dijitRtl)
//
//		In addition, browser, browser version, and box model are
//		combined with an RTL flag when browser text is RTL.  ex: dj_ie-rtl.
//
//		Simply doing a require on this module will
//		establish this CSS.  Modified version of Morris' CSS hack.

dojo.provide("dijit._base.sniff");

(function(){

	var d = dojo,
		html = d.doc.documentElement,
		ie = d.isIE,
		opera = d.isOpera,
		maj = Math.floor,
		ff = d.isFF,
		boxModel = d.boxModel.replace(/-/,''),

		classes = {
			dj_ie: ie,
			dj_ie6: maj(ie) == 6,
			dj_ie7: maj(ie) == 7,
			dj_ie8: maj(ie) == 8,
			dj_iequirks: ie && d.isQuirks,

			// NOTE: Opera not supported by dijit
			dj_opera: opera,

			dj_khtml: d.isKhtml,

			dj_webkit: d.isWebKit,
			dj_safari: d.isSafari,
			dj_chrome: d.isChrome,

			dj_gecko: d.isMozilla,
			dj_ff3: maj(ff) == 3
		}; // no dojo unsupported browsers

	classes["dj_" + boxModel] = true;

	// apply browser, browser version, and box model class names
	for(var p in classes){
		if(classes[p]){
			if(html.className){
				html.className += " " + p;
			}else{
				html.className = p;
			}
		}
	}

	// If RTL mode then add dijitRtl flag plus repeat existing classes
	// with -rtl extension
	// (unshift is to make this code run after <body> node is loaded but before parser runs)
	dojo._loaders.unshift(function(){
		if(!dojo._isBodyLtr()){
			html.className += " dijitRtl";
			for(var p in classes){
				if(classes[p]){
					html.className += " " + p + "-rtl";
				}
			}
		}
	});

})();

}

if(!dojo._hasResource["dijit._base.typematic"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.typematic"] = true;
dojo.provide("dijit._base.typematic");

dijit.typematic = {
	// summary:
	//		These functions are used to repetitively call a user specified callback
	//		method when a specific key or mouse click over a specific DOM node is
	//		held down for a specific amount of time.
	//		Only 1 such event is allowed to occur on the browser page at 1 time.

	_fireEventAndReload: function(){
		this._timer = null;
		this._callback(++this._count, this._node, this._evt);
		
		// Schedule next event, reducing the timer a little bit each iteration, bottoming-out at 10 to avoid
		// browser overload (particularly avoiding starving DOH robot so it never gets to send a mouseup)
		this._currentTimeout = Math.max(
			this._currentTimeout < 0 ? this._initialDelay :
				(this._subsequentDelay > 1 ? this._subsequentDelay : Math.round(this._currentTimeout * this._subsequentDelay)),
			10);
		this._timer = setTimeout(dojo.hitch(this, "_fireEventAndReload"), this._currentTimeout);
	},

	trigger: function(/*Event*/ evt, /* Object */ _this, /*DOMNode*/ node, /* Function */ callback, /* Object */ obj, /* Number */ subsequentDelay, /* Number */ initialDelay){
		// summary:
		//		Start a timed, repeating callback sequence.
		//		If already started, the function call is ignored.
		//		This method is not normally called by the user but can be
		//		when the normal listener code is insufficient.
		// evt:
		//		key or mouse event object to pass to the user callback
		// _this:
		//		pointer to the user's widget space.
		// node:
		//		the DOM node object to pass the the callback function
		// callback:
		//		function to call until the sequence is stopped called with 3 parameters:
		// count:
		//		integer representing number of repeated calls (0..n) with -1 indicating the iteration has stopped
		// node:
		//		the DOM node object passed in
		// evt:
		//		key or mouse event object
		// obj:
		//		user space object used to uniquely identify each typematic sequence
		// subsequentDelay:
		//		if > 1, the number of milliseconds until the 3->n events occur
		//		or else the fractional time multiplier for the next event's delay, default=0.9
		// initialDelay:
		//		the number of milliseconds until the 2nd event occurs, default=500ms
		if(obj != this._obj){
			this.stop();
			this._initialDelay = initialDelay || 500;
			this._subsequentDelay = subsequentDelay || 0.90;
			this._obj = obj;
			this._evt = evt;
			this._node = node;
			this._currentTimeout = -1;
			this._count = -1;
			this._callback = dojo.hitch(_this, callback);
			this._fireEventAndReload();
		}
	},

	stop: function(){
		// summary:
		//		Stop an ongoing timed, repeating callback sequence.
		if(this._timer){
			clearTimeout(this._timer);
			this._timer = null;
		}
		if(this._obj){
			this._callback(-1, this._node, this._evt);
			this._obj = null;
		}
	},

	addKeyListener: function(/*DOMNode*/ node, /*Object*/ keyObject, /*Object*/ _this, /*Function*/ callback, /*Number*/ subsequentDelay, /*Number*/ initialDelay){
		// summary:
		//		Start listening for a specific typematic key.
		//		See also the trigger method for other parameters.
		// keyObject:
		//		an object defining the key to listen for.
		// charOrCode:
		//		the printable character (string) or keyCode (number) to listen for.
		// keyCode:
		//		(deprecated - use charOrCode) the keyCode (number) to listen for (implies charCode = 0).
		// charCode:
		//		(deprecated - use charOrCode) the charCode (number) to listen for.
		// ctrlKey:
		//		desired ctrl key state to initiate the calback sequence:
		//			- pressed (true)
		//			- released (false)
		//			- either (unspecified)
		// altKey:
		//		same as ctrlKey but for the alt key
		// shiftKey:
		//		same as ctrlKey but for the shift key
		// returns:
		//		an array of dojo.connect handles
		if(keyObject.keyCode){
			keyObject.charOrCode = keyObject.keyCode;
			dojo.deprecated("keyCode attribute parameter for dijit.typematic.addKeyListener is deprecated. Use charOrCode instead.", "", "2.0");
		}else if(keyObject.charCode){
			keyObject.charOrCode = String.fromCharCode(keyObject.charCode);
			dojo.deprecated("charCode attribute parameter for dijit.typematic.addKeyListener is deprecated. Use charOrCode instead.", "", "2.0");
		}
		return [
			dojo.connect(node, "onkeypress", this, function(evt){
				if(evt.charOrCode == keyObject.charOrCode &&
				(keyObject.ctrlKey === undefined || keyObject.ctrlKey == evt.ctrlKey) &&
				(keyObject.altKey === undefined || keyObject.altKey == evt.altKey) &&
				(keyObject.metaKey === undefined || keyObject.metaKey == (evt.metaKey || false)) && // IE doesn't even set metaKey
				(keyObject.shiftKey === undefined || keyObject.shiftKey == evt.shiftKey)){
					dojo.stopEvent(evt);
					dijit.typematic.trigger(keyObject, _this, node, callback, keyObject, subsequentDelay, initialDelay);
				}else if(dijit.typematic._obj == keyObject){
					dijit.typematic.stop();
				}
			}),
			dojo.connect(node, "onkeyup", this, function(evt){
				if(dijit.typematic._obj == keyObject){
					dijit.typematic.stop();
				}
			})
		];
	},

	addMouseListener: function(/*DOMNode*/ node, /*Object*/ _this, /*Function*/ callback, /*Number*/ subsequentDelay, /*Number*/ initialDelay){
		// summary:
		//		Start listening for a typematic mouse click.
		//		See the trigger method for other parameters.
		// returns:
		//		an array of dojo.connect handles
		var dc = dojo.connect;
		return [
			dc(node, "mousedown", this, function(evt){
				dojo.stopEvent(evt);
				dijit.typematic.trigger(evt, _this, node, callback, node, subsequentDelay, initialDelay);
			}),
			dc(node, "mouseup", this, function(evt){
				dojo.stopEvent(evt);
				dijit.typematic.stop();
			}),
			dc(node, "mouseout", this, function(evt){
				dojo.stopEvent(evt);
				dijit.typematic.stop();
			}),
			dc(node, "mousemove", this, function(evt){
				dojo.stopEvent(evt);
			}),
			dc(node, "dblclick", this, function(evt){
				dojo.stopEvent(evt);
				if(dojo.isIE){
					dijit.typematic.trigger(evt, _this, node, callback, node, subsequentDelay, initialDelay);
					setTimeout(dojo.hitch(this, dijit.typematic.stop), 50);
				}
			})
		];
	},

	addListener: function(/*Node*/ mouseNode, /*Node*/ keyNode, /*Object*/ keyObject, /*Object*/ _this, /*Function*/ callback, /*Number*/ subsequentDelay, /*Number*/ initialDelay){
		// summary:
		//		Start listening for a specific typematic key and mouseclick.
		//		This is a thin wrapper to addKeyListener and addMouseListener.
		//		See the addMouseListener and addKeyListener methods for other parameters.
		// mouseNode:
		//		the DOM node object to listen on for mouse events.
		// keyNode:
		//		the DOM node object to listen on for key events.
		// returns:
		//		an array of dojo.connect handles
		return this.addKeyListener(keyNode, keyObject, _this, callback, subsequentDelay, initialDelay).concat(
			this.addMouseListener(mouseNode, _this, callback, subsequentDelay, initialDelay));
	}
};

}

if(!dojo._hasResource["dijit._base.wai"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.wai"] = true;
dojo.provide("dijit._base.wai");

dijit.wai = {
	onload: function(){
		// summary:
		//		Detects if we are in high-contrast mode or not

		// This must be a named function and not an anonymous
		// function, so that the widget parsing code can make sure it
		// registers its onload function after this function.
		// DO NOT USE "this" within this function.

		// create div for testing if high contrast mode is on or images are turned off
		var div = dojo.create("div",{
			id: "a11yTestNode",
			style:{
				cssText:'border: 1px solid;'
					+ 'border-color:red green;'
					+ 'position: absolute;'
					+ 'height: 5px;'
					+ 'top: -999px;'
					+ 'background-image: url("' + (dojo.config.blankGif || dojo.moduleUrl("dojo", "resources/blank.gif")) + '");'
			}
		}, dojo.body());

		// test it
		var cs = dojo.getComputedStyle(div);
		if(cs){
			var bkImg = cs.backgroundImage;
			var needsA11y = (cs.borderTopColor == cs.borderRightColor) || (bkImg != null && (bkImg == "none" || bkImg == "url(invalid-url:)" ));
			dojo[needsA11y ? "addClass" : "removeClass"](dojo.body(), "dijit_a11y");
			if(dojo.isIE){
				div.outerHTML = "";		// prevent mixed-content warning, see http://support.microsoft.com/kb/925014
			}else{
				dojo.body().removeChild(div);
			}
		}
	}
};

// Test if computer is in high contrast mode.
// Make sure the a11y test runs first, before widgets are instantiated.
if(dojo.isIE || dojo.isMoz){	// NOTE: checking in Safari messes things up
	dojo._loaders.unshift(dijit.wai.onload);
}

dojo.mixin(dijit, {
	_XhtmlRoles: /banner|contentinfo|definition|main|navigation|search|note|secondary|seealso/,

	hasWaiRole: function(/*Element*/ elem, /*String*/ role){
		// summary:
		//		Determines if an element has a particular non-XHTML role.
		// returns:
		//		True if elem has the specific non-XHTML role attribute and false if not.
		// 		For backwards compatibility if role parameter not provided,
		// 		returns true if has non XHTML role
		var waiRole = this.getWaiRole(elem);
		return role ? (waiRole.indexOf(role) > -1) : (waiRole.length > 0);
	},

	getWaiRole: function(/*Element*/ elem){
		// summary:
		//		Gets the non-XHTML role for an element (which should be a wai role).
		// returns:
		//		The non-XHTML role of elem or an empty string if elem
		//		does not have a role.
		 return dojo.trim((dojo.attr(elem, "role") || "").replace(this._XhtmlRoles,"").replace("wairole:",""));
	},

	setWaiRole: function(/*Element*/ elem, /*String*/ role){
		// summary:
		//		Sets the role on an element.
		// description:
		//		Replace existing role attribute with new role.
		//		If elem already has an XHTML role, append this role to XHTML role
		//		and remove other ARIA roles.

		var curRole = dojo.attr(elem, "role") || "";
		if(!this._XhtmlRoles.test(curRole)){
			dojo.attr(elem, "role", role);
		}else{
			if((" "+ curRole +" ").indexOf(" " + role + " ") < 0){
				var clearXhtml = dojo.trim(curRole.replace(this._XhtmlRoles, ""));
				var cleanRole = dojo.trim(curRole.replace(clearXhtml, ""));
				dojo.attr(elem, "role", cleanRole + (cleanRole ? ' ' : '') + role);
			}
		}
	},

	removeWaiRole: function(/*Element*/ elem, /*String*/ role){
		// summary:
		//		Removes the specified non-XHTML role from an element.
		// 		Removes role attribute if no specific role provided (for backwards compat.)

		var roleValue = dojo.attr(elem, "role");
		if(!roleValue){ return; }
		if(role){
			var t = dojo.trim((" " + roleValue + " ").replace(" " + role + " ", " "));
			dojo.attr(elem, "role", t);
		}else{
			elem.removeAttribute("role");
		}
	},

	hasWaiState: function(/*Element*/ elem, /*String*/ state){
		// summary:
		//		Determines if an element has a given state.
		// description:
		//		Checks for an attribute called "aria-"+state.
		// returns:
		//		true if elem has a value for the given state and
		//		false if it does not.

		return elem.hasAttribute ? elem.hasAttribute("aria-"+state) : !!elem.getAttribute("aria-"+state);
	},

	getWaiState: function(/*Element*/ elem, /*String*/ state){
		// summary:
		//		Gets the value of a state on an element.
		// description:
		//		Checks for an attribute called "aria-"+state.
		// returns:
		//		The value of the requested state on elem
		//		or an empty string if elem has no value for state.

		return elem.getAttribute("aria-"+state) || "";
	},

	setWaiState: function(/*Element*/ elem, /*String*/ state, /*String*/ value){
		// summary:
		//		Sets a state on an element.
		// description:
		//		Sets an attribute called "aria-"+state.

		elem.setAttribute("aria-"+state, value);
	},

	removeWaiState: function(/*Element*/ elem, /*String*/ state){
		// summary:
		//		Removes a state from an element.
		// description:
		//		Sets an attribute called "aria-"+state.

		elem.removeAttribute("aria-"+state);
	}
});

}

if(!dojo._hasResource["dijit._base"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base"] = true;
dojo.provide("dijit._base");











}

if(!dojo._hasResource["dijit._Widget"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._Widget"] = true;
dojo.provide("dijit._Widget");

dojo.require( "dijit._base" );


// This code is to assist deferring dojo.connect() calls in widgets (connecting to events on the widgets'
// DOM nodes) until someone actually needs to monitor that event.
dojo.connect(dojo, "_connect",
	function(/*dijit._Widget*/ widget, /*String*/ event){
		if(widget && dojo.isFunction(widget._onConnect)){
			widget._onConnect(event);
		}
	});

dijit._connectOnUseEventHandler = function(/*Event*/ event){};

// Keep track of where the last keydown event was, to help avoid generating
// spurious ondijitclick events when:
// 1. focus is on a <button> or <a>
// 2. user presses then releases the ENTER key
// 3. onclick handler fires and shifts focus to another node, with an ondijitclick handler
// 4. onkeyup event fires, causing the ondijitclick handler to fire
dijit._lastKeyDownNode = null;
if(dojo.isIE){
	(function(){
		var keydownCallback = function(evt){
			dijit._lastKeyDownNode = evt.srcElement;
		};
		dojo.doc.attachEvent('onkeydown', keydownCallback);
		dojo.addOnWindowUnload(function(){
			dojo.doc.detachEvent('onkeydown', keydownCallback);
		});
	})();
}else{
	dojo.doc.addEventListener('keydown', function(evt){
		dijit._lastKeyDownNode = evt.target;
	}, true);
}

(function(){

var _attrReg = {},	// cached results from getSetterAttributes
	getSetterAttributes = function(widget){
		// summary:
		//		Returns list of attributes with custom setters for specified widget
		var dc = widget.declaredClass;
		if(!_attrReg[dc]){
			var r = [],
				attrs,
				proto = widget.constructor.prototype;
			for(var fxName in proto){
				if(dojo.isFunction(proto[fxName]) && (attrs = fxName.match(/^_set([a-zA-Z]*)Attr$/)) && attrs[1]){
					r.push(attrs[1].charAt(0).toLowerCase() + attrs[1].substr(1));
				}
			}
			_attrReg[dc] = r;
		}
		return _attrReg[dc] || [];	// String[]
	};

dojo.declare("dijit._Widget", null, {
	// summary:
	//		Base class for all Dijit widgets.

	// id: [const] String
	//		A unique, opaque ID string that can be assigned by users or by the
	//		system. If the developer passes an ID which is known not to be
	//		unique, the specified ID is ignored and the system-generated ID is
	//		used instead.
	id: "",

	// lang: [const] String
	//		Rarely used.  Overrides the default Dojo locale used to render this widget,
	//		as defined by the [HTML LANG](http://www.w3.org/TR/html401/struct/dirlang.html#adef-lang) attribute.
	//		Value must be among the list of locales specified during by the Dojo bootstrap,
	//		formatted according to [RFC 3066](http://www.ietf.org/rfc/rfc3066.txt) (like en-us).
	lang: "",

	// dir: [const] String
	//		Unsupported by Dijit, but here for completeness.  Dijit only supports setting text direction on the
	//		entire document.
	//		Bi-directional support, as defined by the [HTML DIR](http://www.w3.org/TR/html401/struct/dirlang.html#adef-dir)
	//		attribute. Either left-to-right "ltr" or right-to-left "rtl".
	dir: "",

	// class: String
	//		HTML class attribute
	"class": "",

	// style: String||Object
	//		HTML style attributes as cssText string or name/value hash
	style: "",

	// title: String
	//		HTML title attribute.
	//
	//		For form widgets this specifies a tooltip to display when hovering over
	//		the widget (just like the native HTML title attribute).
	//
	//		For TitlePane or for when this widget is a child of a TabContainer, AccordionContainer,
	//		etc., it's used to specify the tab label, accordion pane title, etc.
	title: "",

	// tooltip: String
	//		When this widget's title attribute is used to for a tab label, accordion pane title, etc.,
	//		this specifies the tooltip to appear when the mouse is hovered over that text.
	tooltip: "",

	// srcNodeRef: [readonly] DomNode
	//		pointer to original DOM node
	srcNodeRef: null,

	// domNode: [readonly] DomNode
	//		This is our visible representation of the widget! Other DOM
	//		Nodes may by assigned to other properties, usually through the
	//		template system's dojoAttachPoint syntax, but the domNode
	//		property is the canonical "top level" node in widget UI.
	domNode: null,

	// containerNode: [readonly] DomNode
	//		Designates where children of the source DOM node will be placed.
	//		"Children" in this case refers to both DOM nodes and widgets.
	//		For example, for myWidget:
	//
	//		|	<div dojoType=myWidget>
	//		|		<b> here's a plain DOM node
	//		|		<span dojoType=subWidget>and a widget</span>
	//		|		<i> and another plain DOM node </i>
	//		|	</div>
	//
	//		containerNode would point to:
	//
	//		|		<b> here's a plain DOM node
	//		|		<span dojoType=subWidget>and a widget</span>
	//		|		<i> and another plain DOM node </i>
	//
	//		In templated widgets, "containerNode" is set via a
	//		dojoAttachPoint assignment.
	//
	//		containerNode must be defined for any widget that accepts innerHTML
	//		(like ContentPane or BorderContainer or even Button), and conversely
	//		is null for widgets that don't, like TextBox.
	containerNode: null,

/*=====
	// _started: Boolean
	//		startup() has completed.
	_started: false,
=====*/

	// attributeMap: [protected] Object
	//		attributeMap sets up a "binding" between attributes (aka properties)
	//		of the widget and the widget's DOM.
	//		Changes to widget attributes listed in attributeMap will be
	//		reflected into the DOM.
	//
	//		For example, calling attr('title', 'hello')
	//		on a TitlePane will automatically cause the TitlePane's DOM to update
	//		with the new title.
	//
	//		attributeMap is a hash where the key is an attribute of the widget,
	//		and the value reflects a binding to a:
	//
	//		- DOM node attribute
	// |		focus: {node: "focusNode", type: "attribute"}
	// 		Maps this.focus to this.focusNode.focus
	//
	//		- DOM node innerHTML
	//	|		title: { node: "titleNode", type: "innerHTML" }
	//		Maps this.title to this.titleNode.innerHTML
	//
	//		- DOM node innerText
	//	|		title: { node: "titleNode", type: "innerText" }
	//		Maps this.title to this.titleNode.innerText
	//
	//		- DOM node CSS class
	// |		myClass: { node: "domNode", type: "class" }
	//		Maps this.myClass to this.domNode.className
	//
	//		If the value is an array, then each element in the array matches one of the
	//		formats of the above list.
	//
	//		There are also some shorthands for backwards compatibility:
	//		- string --> { node: string, type: "attribute" }, for example:
	//	|	"focusNode" ---> { node: "focusNode", type: "attribute" }
	//		- "" --> { node: "domNode", type: "attribute" }
	attributeMap: {id:"", dir:"", lang:"", "class":"", style:"", title:""},

	// _deferredConnects: [protected] Object
	//		attributeMap addendum for event handlers that should be connected only on first use
	_deferredConnects: {
		onClick: "",
		onDblClick: "",
		onKeyDown: "",
		onKeyPress: "",
		onKeyUp: "",
		onMouseMove: "",
		onMouseDown: "",
		onMouseOut: "",
		onMouseOver: "",
		onMouseLeave: "",
		onMouseEnter: "",
		onMouseUp: ""
	},

	onClick: dijit._connectOnUseEventHandler,
	/*=====
	onClick: function(event){
		// summary:
		//		Connect to this function to receive notifications of mouse click events.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onDblClick: dijit._connectOnUseEventHandler,
	/*=====
	onDblClick: function(event){
		// summary:
		//		Connect to this function to receive notifications of mouse double click events.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onKeyDown: dijit._connectOnUseEventHandler,
	/*=====
	onKeyDown: function(event){
		// summary:
		//		Connect to this function to receive notifications of keys being pressed down.
		// event:
		//		key Event
		// tags:
		//		callback
	},
	=====*/
	onKeyPress: dijit._connectOnUseEventHandler,
	/*=====
	onKeyPress: function(event){
		// summary:
		//		Connect to this function to receive notifications of printable keys being typed.
		// event:
		//		key Event
		// tags:
		//		callback
	},
	=====*/
	onKeyUp: dijit._connectOnUseEventHandler,
	/*=====
	onKeyUp: function(event){
		// summary:
		//		Connect to this function to receive notifications of keys being released.
		// event:
		//		key Event
		// tags:
		//		callback
	},
	=====*/
	onMouseDown: dijit._connectOnUseEventHandler,
	/*=====
	onMouseDown: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse button is pressed down.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseMove: dijit._connectOnUseEventHandler,
	/*=====
	onMouseMove: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves over nodes contained within this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseOut: dijit._connectOnUseEventHandler,
	/*=====
	onMouseOut: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves off of nodes contained within this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseOver: dijit._connectOnUseEventHandler,
	/*=====
	onMouseOver: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves onto nodes contained within this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseLeave: dijit._connectOnUseEventHandler,
	/*=====
	onMouseLeave: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves off of this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseEnter: dijit._connectOnUseEventHandler,
	/*=====
	onMouseEnter: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse moves onto this widget.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/
	onMouseUp: dijit._connectOnUseEventHandler,
	/*=====
	onMouseUp: function(event){
		// summary:
		//		Connect to this function to receive notifications of when the mouse button is released.
		// event:
		//		mouse Event
		// tags:
		//		callback
	},
	=====*/

	// Constants used in templates

	// _blankGif: [protected] String
	//		Path to a blank 1x1 image.
	//		Used by <img> nodes in templates that really get their image via CSS background-image.
	_blankGif: (dojo.config.blankGif || dojo.moduleUrl("dojo", "resources/blank.gif")).toString(),

	//////////// INITIALIZATION METHODS ///////////////////////////////////////

	postscript: function(/*Object?*/params, /*DomNode|String*/srcNodeRef){
		// summary:
		//		Kicks off widget instantiation.  See create() for details.
		// tags:
		//		private
		this.create(params, srcNodeRef);
	},

	create: function(/*Object?*/params, /*DomNode|String?*/srcNodeRef){
		// summary:
		//		Kick off the life-cycle of a widget
		// params:
		//		Hash of initialization parameters for widget, including
		//		scalar values (like title, duration etc.) and functions,
		//		typically callbacks like onClick.
		// srcNodeRef:
		//		If a srcNodeRef (DOM node) is specified:
		//			- use srcNodeRef.innerHTML as my contents
		//			- if this is a behavioral widget then apply behavior
		//			  to that srcNodeRef
		//			- otherwise, replace srcNodeRef with my generated DOM
		//			  tree
		// description:
		//		Create calls a number of widget methods (postMixInProperties, buildRendering, postCreate,
		//		etc.), some of which of you'll want to override. See http://docs.dojocampus.org/dijit/_Widget
		//		for a discussion of the widget creation lifecycle.
		//
		//		Of course, adventurous developers could override create entirely, but this should
		//		only be done as a last resort.
		// tags:
		//		private

		// store pointer to original DOM tree
		this.srcNodeRef = dojo.byId(srcNodeRef);

		// For garbage collection.  An array of handles returned by Widget.connect()
		// Each handle returned from Widget.connect() is an array of handles from dojo.connect()
		this._connects = [];

		// For garbage collection.  An array of handles returned by Widget.subscribe()
		// The handle returned from Widget.subscribe() is the handle returned from dojo.subscribe()
		this._subscribes = [];

		// To avoid double-connects, remove entries from _deferredConnects
		// that have been setup manually by a subclass (ex, by dojoAttachEvent).
		// If a subclass has redefined a callback (ex: onClick) then assume it's being
		// connected to manually.
		this._deferredConnects = dojo.clone(this._deferredConnects);
		for(var attr in this.attributeMap){
			delete this._deferredConnects[attr]; // can't be in both attributeMap and _deferredConnects
		}
		for(attr in this._deferredConnects){
			if(this[attr] !== dijit._connectOnUseEventHandler){
				delete this._deferredConnects[attr];	// redefined, probably dojoAttachEvent exists
			}
		}

		//mixin our passed parameters
		if(this.srcNodeRef && (typeof this.srcNodeRef.id == "string")){ this.id = this.srcNodeRef.id; }
		if(params){
			this.params = params;
			dojo.mixin(this,params);
		}
		this.postMixInProperties();

		// generate an id for the widget if one wasn't specified
		// (be sure to do this before buildRendering() because that function might
		// expect the id to be there.)
		if(!this.id){
			this.id = dijit.getUniqueId(this.declaredClass.replace(/\./g,"_"));
		}
		dijit.registry.add(this);

		this.buildRendering();

		if(this.domNode){
			// Copy attributes listed in attributeMap into the [newly created] DOM for the widget.
			this._applyAttributes();

			var source = this.srcNodeRef;
			if(source && source.parentNode){
				source.parentNode.replaceChild(this.domNode, source);
			}

			// If the developer has specified a handler as a widget parameter
			// (ex: new Button({onClick: ...})
			// then naturally need to connect from DOM node to that handler immediately,
			for(attr in this.params){
				this._onConnect(attr);
			}
		}

		if(this.domNode){
			this.domNode.setAttribute("widgetId", this.id);
		}
		this.postCreate();

		// If srcNodeRef has been processed and removed from the DOM (e.g. TemplatedWidget) then delete it to allow GC.
		if(this.srcNodeRef && !this.srcNodeRef.parentNode){
			delete this.srcNodeRef;
		}

		this._created = true;
	},

	_applyAttributes: function(){
		// summary:
		//		Step during widget creation to copy all widget attributes to the
		//		DOM as per attributeMap and _setXXXAttr functions.
		// description:
		//		Skips over blank/false attribute values, unless they were explicitly specified
		//		as parameters to the widget, since those are the default anyway,
		//		and setting tabIndex="" is different than not setting tabIndex at all.
		//
		//		It processes the attributes in the attribute map first, and then
		//		it goes through and processes the attributes for the _setXXXAttr
		//		functions that have been specified
		// tags:
		//		private
		var condAttrApply = function(attr, scope){
			if((scope.params && attr in scope.params) || scope[attr]){
				scope.attr(attr, scope[attr]);
			}
		};

		// Do the attributes in attributeMap
		for(var attr in this.attributeMap){
			condAttrApply(attr, this);
		}

		// And also any attributes with custom setters
		dojo.forEach(getSetterAttributes(this), function(a){
			if(!(a in this.attributeMap)){
				condAttrApply(a, this);
			}
		}, this);
	},

	postMixInProperties: function(){
		// summary:
		//		Called after the parameters to the widget have been read-in,
		//		but before the widget template is instantiated. Especially
		//		useful to set properties that are referenced in the widget
		//		template.
		// tags:
		//		protected
	},

	buildRendering: function(){
		// summary:
		//		Construct the UI for this widget, setting this.domNode
		// description:
		//		Most widgets will mixin `dijit._Templated`, which implements this
		//		method.
		// tags:
		//		protected
		this.domNode = this.srcNodeRef || dojo.create('div');
	},

	postCreate: function(){
		// summary:
		//		Processing after the DOM fragment is created
		// description:
		//		Called after the DOM fragment has been created, but not necessarily
		//		added to the document.  Do not include any operations which rely on
		//		node dimensions or placement.
		// tags:
		//		protected
	},

	startup: function(){
		// summary:
		//		Processing after the DOM fragment is added to the document
		// description:
		//		Called after a widget and its children have been created and added to the page,
		//		and all related widgets have finished their create() cycle, up through postCreate().
		//		This is useful for composite widgets that need to control or layout sub-widgets.
		//		Many layout widgets can use this as a wiring phase.
		this._started = true;
	},

	//////////// DESTROY FUNCTIONS ////////////////////////////////

	destroyRecursive: function(/*Boolean?*/ preserveDom){
		// summary:
		// 		Destroy this widget and its descendants
		// description:
		//		This is the generic "destructor" function that all widget users
		// 		should call to cleanly discard with a widget. Once a widget is
		// 		destroyed, it is removed from the manager object.
		// preserveDom:
		//		If true, this method will leave the original DOM structure
		//		alone of descendant Widgets. Note: This will NOT work with
		//		dijit._Templated widgets.

		this._beingDestroyed = true;
		this.destroyDescendants(preserveDom);
		this.destroy(preserveDom);
	},

	destroy: function(/*Boolean*/ preserveDom){
		// summary:
		// 		Destroy this widget, but not its descendants.
		//		This method will, however, destroy internal widgets such as those used within a template.
		// preserveDom: Boolean
		//		If true, this method will leave the original DOM structure alone.
		//		Note: This will not yet work with _Templated widgets

		this._beingDestroyed = true;
		this.uninitialize();
		var d = dojo,
			dfe = d.forEach,
			dun = d.unsubscribe;
		dfe(this._connects, function(array){
			dfe(array, d.disconnect);
		});
		dfe(this._subscribes, function(handle){
			dun(handle);
		});

		// destroy widgets created as part of template, etc.
		dfe(this._supportingWidgets || [], function(w){
			if(w.destroyRecursive){
				w.destroyRecursive();
			}else if(w.destroy){
				w.destroy();
			}
		});

		this.destroyRendering(preserveDom);
		dijit.registry.remove(this.id);
		this._destroyed = true;
	},

	destroyRendering: function(/*Boolean?*/ preserveDom){
		// summary:
		//		Destroys the DOM nodes associated with this widget
		// preserveDom:
		//		If true, this method will leave the original DOM structure alone
		//		during tear-down. Note: this will not work with _Templated
		//		widgets yet.
		// tags:
		//		protected

		if(this.bgIframe){
			this.bgIframe.destroy(preserveDom);
			delete this.bgIframe;
		}

		if(this.domNode){
			if(preserveDom){
				dojo.removeAttr(this.domNode, "widgetId");
			}else{
				dojo.destroy(this.domNode);
			}
			delete this.domNode;
		}

		if(this.srcNodeRef){
			if(!preserveDom){
				dojo.destroy(this.srcNodeRef);
			}
			delete this.srcNodeRef;
		}
	},

	destroyDescendants: function(/*Boolean?*/ preserveDom){
		// summary:
		//		Recursively destroy the children of this widget and their
		//		descendants.
		// preserveDom:
		//		If true, the preserveDom attribute is passed to all descendant
		//		widget's .destroy() method. Not for use with _Templated
		//		widgets.

		// get all direct descendants and destroy them recursively
		dojo.forEach(this.getChildren(), function(widget){
			if(widget.destroyRecursive){
				widget.destroyRecursive(preserveDom);
			}
		});
	},


	uninitialize: function(){
		// summary:
		//		Stub function. Override to implement custom widget tear-down
		//		behavior.
		// tags:
		//		protected
		return false;
	},

	////////////////// MISCELLANEOUS METHODS ///////////////////

	onFocus: function(){
		// summary:
		//		Called when the widget becomes "active" because
		//		it or a widget inside of it either has focus, or has recently
		//		been clicked.
		// tags:
		//		callback
	},

	onBlur: function(){
		// summary:
		//		Called when the widget stops being "active" because
		//		focus moved to something outside of it, or the user
		//		clicked somewhere outside of it, or the widget was
		//		hidden.
		// tags:
		//		callback
	},

	_onFocus: function(e){
		// summary:
		//		This is where widgets do processing for when they are active,
		//		such as changing CSS classes.  See onFocus() for more details.
		// tags:
		//		protected
		this.onFocus();
	},

	_onBlur: function(){
		// summary:
		//		This is where widgets do processing for when they stop being active,
		//		such as changing CSS classes.  See onBlur() for more details.
		// tags:
		//		protected
		this.onBlur();
	},

	_onConnect: function(/*String*/ event){
		// summary:
		//		Called when someone connects to one of my handlers.
		//		"Turn on" that handler if it isn't active yet.
		//
		//		This is also called for every single initialization parameter
		//		so need to do nothing for parameters like "id".
		// tags:
		//		private
		if(event in this._deferredConnects){
			var mapNode = this[this._deferredConnects[event] || 'domNode'];
			this.connect(mapNode, event.toLowerCase(), event);
			delete this._deferredConnects[event];
		}
	},

	_setClassAttr: function(/*String*/ value){
		// summary:
		//		Custom setter for the CSS "class" attribute
		// tags:
		//		protected
		var mapNode = this[this.attributeMap["class"] || 'domNode'];
		dojo.removeClass(mapNode, this["class"])
		this["class"] = value;
		dojo.addClass(mapNode, value);
	},

	_setStyleAttr: function(/*String||Object*/ value){
		// summary:
		//		Sets the style attribut of the widget according to value,
		//		which is either a hash like {height: "5px", width: "3px"}
		//		or a plain string
		// description:
		//		Determines which node to set the style on based on style setting
		//		in attributeMap.
		// tags:
		//		protected

		var mapNode = this[this.attributeMap.style || 'domNode'];

		// Note: technically we should revert any style setting made in a previous call
		// to his method, but that's difficult to keep track of.

		if(dojo.isObject(value)){
			dojo.style(mapNode, value);
		}else{
			if(mapNode.style.cssText){
				mapNode.style.cssText += "; " + value;
			}else{
				mapNode.style.cssText = value;
			}
		}

		this.style = value;
	},

	setAttribute: function(/*String*/ attr, /*anything*/ value){
		// summary:
		//		Deprecated.  Use attr() instead.
		// tags:
		//		deprecated
		dojo.deprecated(this.declaredClass+"::setAttribute() is deprecated. Use attr() instead.", "", "2.0");
		this.attr(attr, value);
	},

	_attrToDom: function(/*String*/ attr, /*String*/ value){
		// summary:
		//		Reflect a widget attribute (title, tabIndex, duration etc.) to
		//		the widget DOM, as specified in attributeMap.
		//
		// description:
		//		Also sets this["attr"] to the new value.
		//		Note some attributes like "type"
		//		cannot be processed this way as they are not mutable.
		//
		// tags:
		//		private

		var commands = this.attributeMap[attr];
		dojo.forEach(dojo.isArray(commands) ? commands : [commands], function(command){

			// Get target node and what we are doing to that node
			var mapNode = this[command.node || command || "domNode"];	// DOM node
			var type = command.type || "attribute";	// class, innerHTML, innerText, or attribute

			switch(type){
				case "attribute":
					if(dojo.isFunction(value)){ // functions execute in the context of the widget
						value = dojo.hitch(this, value);
					}

					// Get the name of the DOM node attribute; usually it's the same
					// as the name of the attribute in the widget (attr), but can be overridden.
					// Also maps handler names to lowercase, like onSubmit --> onsubmit
					var attrName = command.attribute ? command.attribute :
						(/^on[A-Z][a-zA-Z]*$/.test(attr) ? attr.toLowerCase() : attr);

					dojo.attr(mapNode, attrName, value);
					break;
				case "innerText":
					mapNode.innerHTML = "";
					mapNode.appendChild(dojo.doc.createTextNode(value));
					break;
				case "innerHTML":
					mapNode.innerHTML = value;
					break;
				case "class":
					dojo.removeClass(mapNode, this[attr]);
					dojo.addClass(mapNode, value);
					break;
			}
		}, this);
		this[attr] = value;
	},

	attr: function(/*String|Object*/name, /*Object?*/value){
		// summary:
		//		Set or get properties on a widget instance.
		//	name:
		//		The property to get or set. If an object is passed here and not
		//		a string, its keys are used as names of attributes to be set
		//		and the value of the object as values to set in the widget.
		//	value:
		//		Optional. If provided, attr() operates as a setter. If omitted,
		//		the current value of the named property is returned.
		// description:
		//		Get or set named properties on a widget. If no value is
		//		provided, the current value of the attribute is returned,
		//		potentially via a getter method. If a value is provided, then
		//		the method acts as a setter, assigning the value to the name,
		//		potentially calling any explicitly provided setters to handle
		//		the operation. For instance, if the widget has properties "foo"
		//		and "bar" and a method named "_setFooAttr", calling:
		//	|	myWidget.attr("foo", "Howdy!");
		//		would be equivalent to calling:
		//	|	widget._setFooAttr("Howdy!");
		//		while calling:
		//	|	myWidget.attr("bar", "Howdy!");
		//		would be the same as writing:
		//	|	widget.bar = "Howdy!";
		//		It also tries to copy the changes to the widget's DOM according
		//		to settings in attributeMap (see description of `dijit._Widget.attributeMap`
		//		for details)
		//		For example, calling:
		//	|	myTitlePane.attr("title", "Howdy!");
		//		will do
		//	|	myTitlePane.title = "Howdy!";
		//	|	myTitlePane.title.innerHTML = "Howdy!";
		//		It works for DOM node attributes too.  Calling
		//	|	widget.attr("disabled", true)
		//		will set the disabled attribute on the widget's focusNode,
		//		among other housekeeping for a change in disabled state.

		//	open questions:
		//		- how to handle build shortcut for attributes which want to map
		//		into DOM attributes?
		//		- what relationship should setAttribute()/attr() have to
		//		layout() calls?
		var args = arguments.length;
		if(args == 1 && !dojo.isString(name)){
			for(var x in name){ this.attr(x, name[x]); }
			return this;
		}
		var names = this._getAttrNames(name);
		if(args >= 2){ // setter
			if(this[names.s]){
				// use the explicit setter
				args = dojo._toArray(arguments, 1);
				return this[names.s].apply(this, args) || this;
			}else{
				// if param is specified as DOM node attribute, copy it
				if(name in this.attributeMap){
					this._attrToDom(name, value);
				}

				// FIXME: what about function assignments? Any way to connect() here?
				this[name] = value;
			}
			return this;
		}else{ // getter
			return this[names.g] ? this[names.g]() : this[name];
		}
	},

	_attrPairNames: {},		// shared between all widgets
	_getAttrNames: function(name){
		// summary:
		//		Helper function for Widget.attr().
		//		Caches attribute name values so we don't do the string ops every time.
		// tags:
		//		private

		var apn = this._attrPairNames;
		if(apn[name]){ return apn[name]; }
		var uc = name.charAt(0).toUpperCase() + name.substr(1);
		return (apn[name] = {
			n: name+"Node",
			s: "_set"+uc+"Attr",
			g: "_get"+uc+"Attr"
		});
	},

	toString: function(){
		// summary:
		//		Returns a string that represents the widget
		// description:
		//		When a widget is cast to a string, this method will be used to generate the
		//		output. Currently, it does not implement any sort of reversible
		//		serialization.
		return '[Widget ' + this.declaredClass + ', ' + (this.id || 'NO ID') + ']'; // String
	},

	getDescendants: function(){
		// summary:
		//		Returns all the widgets contained by this, i.e., all widgets underneath this.containerNode.
		//		This method should generally be avoided as it returns widgets declared in templates, which are
		//		supposed to be internal/hidden, but it's left here for back-compat reasons.

		return this.containerNode ? dojo.query('[widgetId]', this.containerNode).map(dijit.byNode) : []; // dijit._Widget[]
	},

	getChildren: function(){
		// summary:
		//		Returns all the widgets contained by this, i.e., all widgets underneath this.containerNode.
		//		Does not return nested widgets, nor widgets that are part of this widget's template.
		return this.containerNode ? dijit.findWidgets(this.containerNode) : []; // dijit._Widget[]
	},

	// nodesWithKeyClick: [private] String[]
	//		List of nodes that correctly handle click events via native browser support,
	//		and don't need dijit's help
	nodesWithKeyClick: ["input", "button"],

	connect: function(
			/*Object|null*/ obj,
			/*String|Function*/ event,
			/*String|Function*/ method){
		// summary:
		//		Connects specified obj/event to specified method of this object
		//		and registers for disconnect() on widget destroy.
		// description:
		//		Provide widget-specific analog to dojo.connect, except with the
		//		implicit use of this widget as the target object.
		//		This version of connect also provides a special "ondijitclick"
		//		event which triggers on a click or space or enter keyup
		// returns:
		//		A handle that can be passed to `disconnect` in order to disconnect before
		//		the widget is destroyed.
		// example:
		//	|	var btn = new dijit.form.Button();
		//	|	// when foo.bar() is called, call the listener we're going to
		//	|	// provide in the scope of btn
		//	|	btn.connect(foo, "bar", function(){
		//	|		console.debug(this.toString());
		//	|	});
		// tags:
		//		protected

		var d = dojo,
			dc = d._connect,
			handles = [];
		if(event == "ondijitclick"){
			// add key based click activation for unsupported nodes.
			// do all processing onkey up to prevent spurious clicks
			// for details see comments at top of this file where _lastKeyDownNode is defined
			if(!this.nodesWithKeyClick[obj.tagName.toLowerCase()]){
				var m = d.hitch(this, method);
				handles.push(
					dc(obj, "onkeydown", this, function(e){
						//console.log(this.id + ": onkeydown, e.target = ", e.target, ", lastKeyDownNode was ", dijit._lastKeyDownNode, ", equality is ", (e.target === dijit._lastKeyDownNode));
						if((e.keyCode == d.keys.ENTER || e.keyCode == d.keys.SPACE) &&
							!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey){
							// needed on IE for when focus changes between keydown and keyup - otherwise dropdown menus do not work
							dijit._lastKeyDownNode = e.target;
							d.stopEvent(e);		// stop event to prevent scrolling on space key in IE
						}
			 		}),
					dc(obj, "onkeyup", this, function(e){
						//console.log(this.id + ": onkeyup, e.target = ", e.target, ", lastKeyDownNode was ", dijit._lastKeyDownNode, ", equality is ", (e.target === dijit._lastKeyDownNode));
						if( (e.keyCode == d.keys.ENTER || e.keyCode == d.keys.SPACE) &&
							e.target === dijit._lastKeyDownNode &&
							!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey){
								//need reset here or have problems in FF when focus returns to trigger element after closing popup/alert
								dijit._lastKeyDownNode = null;
								return m(e);
						}
					})
				);
			}
			event = "onclick";
		}
		handles.push(dc(obj, event, this, method));

		this._connects.push(handles);
		return handles;		// _Widget.Handle
	},

	disconnect: function(/* _Widget.Handle */ handles){
		// summary:
		//		Disconnects handle created by `connect`.
		//		Also removes handle from this widget's list of connects.
		// tags:
		//		protected
		for(var i=0; i<this._connects.length; i++){
			if(this._connects[i] == handles){
				dojo.forEach(handles, dojo.disconnect);
				this._connects.splice(i, 1);
				return;
			}
		}
	},

	subscribe: function(
			/*String*/ topic,
			/*String|Function*/ method){
		// summary:
		//		Subscribes to the specified topic and calls the specified method
		//		of this object and registers for unsubscribe() on widget destroy.
		// description:
		//		Provide widget-specific analog to dojo.subscribe, except with the
		//		implicit use of this widget as the target object.
		// example:
		//	|	var btn = new dijit.form.Button();
		//	|	// when /my/topic is published, this button changes its label to
		//	|   // be the parameter of the topic.
		//	|	btn.subscribe("/my/topic", function(v){
		//	|		this.attr("label", v);
		//	|	});
		var d = dojo,
			handle = d.subscribe(topic, this, method);

		// return handles for Any widget that may need them
		this._subscribes.push(handle);
		return handle;
	},

	unsubscribe: function(/*Object*/ handle){
		// summary:
		//		Unsubscribes handle created by this.subscribe.
		//		Also removes handle from this widget's list of subscriptions
		for(var i=0; i<this._subscribes.length; i++){
			if(this._subscribes[i] == handle){
				dojo.unsubscribe(handle);
				this._subscribes.splice(i, 1);
				return;
			}
		}
	},

	isLeftToRight: function(){
		// summary:
		//		Checks the page for text direction
		// tags:
		//		protected
		return dojo._isBodyLtr(); //Boolean
	},

	isFocusable: function(){
		// summary:
		//		Return true if this widget can currently be focused
		//		and false if not
		return this.focus && (dojo.style(this.domNode, "display") != "none");
	},

	placeAt: function(/* String|DomNode|_Widget */reference, /* String?|Int? */position){
		// summary:
		//		Place this widget's domNode reference somewhere in the DOM based
		//		on standard dojo.place conventions, or passing a Widget reference that
		//		contains and addChild member.
		//
		// description:
		//		A convenience function provided in all _Widgets, providing a simple
		//		shorthand mechanism to put an existing (or newly created) Widget
		//		somewhere in the dom, and allow chaining.
		//
		// reference:
		//		The String id of a domNode, a domNode reference, or a reference to a Widget posessing
		//		an addChild method.
		//
		// position:
		//		If passed a string or domNode reference, the position argument
		//		accepts a string just as dojo.place does, one of: "first", "last",
		//		"before", or "after".
		//
		//		If passed a _Widget reference, and that widget reference has an ".addChild" method,
		//		it will be called passing this widget instance into that method, supplying the optional
		//		position index passed.
		//
		// returns:
		//		dijit._Widget
		//		Provides a useful return of the newly created dijit._Widget instance so you
		//		can "chain" this function by instantiating, placing, then saving the return value
		//		to a variable.
		//
		// example:
		// | 	// create a Button with no srcNodeRef, and place it in the body:
		// | 	var button = new dijit.form.Button({ label:"click" }).placeAt(dojo.body());
		// | 	// now, 'button' is still the widget reference to the newly created button
		// | 	dojo.connect(button, "onClick", function(e){ console.log('click'); });
		//
		// example:
		// |	// create a button out of a node with id="src" and append it to id="wrapper":
		// | 	var button = new dijit.form.Button({},"src").placeAt("wrapper");
		//
		// example:
		// |	// place a new button as the first element of some div
		// |	var button = new dijit.form.Button({ label:"click" }).placeAt("wrapper","first");
		//
		// example:
		// |	// create a contentpane and add it to a TabContainer
		// |	var tc = dijit.byId("myTabs");
		// |	new dijit.layout.ContentPane({ href:"foo.html", title:"Wow!" }).placeAt(tc)

		if(reference.declaredClass && reference.addChild){
			reference.addChild(this, position);
		}else{
			dojo.place(this.domNode, reference, position);
		}
		return this;
	},

	_onShow: function(){
		// summary:
		//		Internal method called when this widget is made visible.
		//		See `onShow` for details.
		this.onShow();
	},

	onShow: function(){
		// summary:
		//		Called when this widget becomes the selected pane in a
		//		`dijit.layout.TabContainer`, `dijit.layout.StackContainer`,
		//		`dijit.layout.AccordionContainer`, etc.
		//
		//		Also called to indicate display of a `dijit.Dialog`, `dijit.TooltipDialog`, or `dijit.TitlePane`.
		// tags:
		//		callback
	},

	onHide: function(){
		// summary:
			//		Called when another widget becomes the selected pane in a
			//		`dijit.layout.TabContainer`, `dijit.layout.StackContainer`,
			//		`dijit.layout.AccordionContainer`, etc.
			//
			//		Also called to indicate hide of a `dijit.Dialog`, `dijit.TooltipDialog`, or `dijit.TitlePane`.
			// tags:
			//		callback
	}
});

})();

}

if(!dojo._hasResource["dojo.string"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.string"] = true;
dojo.provide("dojo.string");

/*=====
dojo.string = { 
	// summary: String utilities for Dojo
};
=====*/

dojo.string.rep = function(/*String*/str, /*Integer*/num){
	//	summary:
	//		Efficiently replicate a string `n` times.
	//	str:
	//		the string to replicate
	//	num:
	//		number of times to replicate the string
	
	if(num <= 0 || !str){ return ""; }
	
	var buf = [];
	for(;;){
		if(num & 1){
			buf.push(str);
		}
		if(!(num >>= 1)){ break; }
		str += str;
	}
	return buf.join("");	// String
};

dojo.string.pad = function(/*String*/text, /*Integer*/size, /*String?*/ch, /*Boolean?*/end){
	//	summary:
	//		Pad a string to guarantee that it is at least `size` length by
	//		filling with the character `ch` at either the start or end of the
	//		string. Pads at the start, by default.
	//	text:
	//		the string to pad
	//	size:
	//		length to provide padding
	//	ch:
	//		character to pad, defaults to '0'
	//	end:
	//		adds padding at the end if true, otherwise pads at start
	//	example:
	//	|	// Fill the string to length 10 with "+" characters on the right.  Yields "Dojo++++++".
	//	|	dojo.string.pad("Dojo", 10, "+", true);

	if(!ch){
		ch = '0';
	}
	var out = String(text),
		pad = dojo.string.rep(ch, Math.ceil((size - out.length) / ch.length));
	return end ? out + pad : pad + out;	// String
};

dojo.string.substitute = function(	/*String*/		template, 
									/*Object|Array*/map, 
									/*Function?*/	transform, 
									/*Object?*/		thisObject){
	//	summary:
	//		Performs parameterized substitutions on a string. Throws an
	//		exception if any parameter is unmatched.
	//	template: 
	//		a string with expressions in the form `${key}` to be replaced or
	//		`${key:format}` which specifies a format function. keys are case-sensitive. 
	//	map:
	//		hash to search for substitutions
	//	transform: 
	//		a function to process all parameters before substitution takes
	//		place, e.g. mylib.encodeXML
	//	thisObject: 
	//		where to look for optional format function; default to the global
	//		namespace
	//	example:
	//		Substitutes two expressions in a string from an Array or Object
	//	|	// returns "File 'foo.html' is not found in directory '/temp'."
	//	|	// by providing substitution data in an Array
	//	|	dojo.string.substitute(
	//	|		"File '${0}' is not found in directory '${1}'.",
	//	|		["foo.html","/temp"]
	//	|	);
	//	|
	//	|	// also returns "File 'foo.html' is not found in directory '/temp'."
	//	|	// but provides substitution data in an Object structure.  Dotted
	//	|	// notation may be used to traverse the structure.
	//	|	dojo.string.substitute(
	//	|		"File '${name}' is not found in directory '${info.dir}'.",
	//	|		{ name: "foo.html", info: { dir: "/temp" } }
	//	|	);
	//	example:
	//		Use a transform function to modify the values:
	//	|	// returns "file 'foo.html' is not found in directory '/temp'."
	//	|	dojo.string.substitute(
	//	|		"${0} is not found in ${1}.",
	//	|		["foo.html","/temp"],
	//	|		function(str){
	//	|			// try to figure out the type
	//	|			var prefix = (str.charAt(0) == "/") ? "directory": "file";
	//	|			return prefix + " '" + str + "'";
	//	|		}
	//	|	);
	//	example:
	//		Use a formatter
	//	|	// returns "thinger -- howdy"
	//	|	dojo.string.substitute(
	//	|		"${0:postfix}", ["thinger"], null, {
	//	|			postfix: function(value, key){
	//	|				return value + " -- howdy";
	//	|			}
	//	|		}
	//	|	);

	thisObject = thisObject || dojo.global;
	transform = transform ? 
		dojo.hitch(thisObject, transform) : function(v){ return v; };

	return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g,
		function(match, key, format){
			var value = dojo.getObject(key, false, map);
			if(format){
				value = dojo.getObject(format, false, thisObject).call(thisObject, value, key);
			}
			return transform(value, key).toString();
		}); // String
};

/*=====
dojo.string.trim = function(str){
	//	summary:
	//		Trims whitespace from both sides of the string
	//	str: String
	//		String to be trimmed
	//	returns: String
	//		Returns the trimmed string
	//	description:
	//		This version of trim() was taken from [Steven Levithan's blog](http://blog.stevenlevithan.com/archives/faster-trim-javascript).
	//		The short yet performant version of this function is dojo.trim(),
	//		which is part of Dojo base.  Uses String.prototype.trim instead, if available.
	return "";	// String
}
=====*/

dojo.string.trim = String.prototype.trim ?
	dojo.trim : // aliasing to the native function
	function(str){
		str = str.replace(/^\s+/, '');
		for(var i = str.length - 1; i >= 0; i--){
			if(/\S/.test(str.charAt(i))){
				str = str.substring(0, i + 1);
				break;
			}
		}
		return str;
	};

}

if(!dojo._hasResource["dojo.date.stamp"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.date.stamp"] = true;
dojo.provide("dojo.date.stamp");

// Methods to convert dates to or from a wire (string) format using well-known conventions

dojo.date.stamp.fromISOString = function(/*String*/formattedString, /*Number?*/defaultTime){
	//	summary:
	//		Returns a Date object given a string formatted according to a subset of the ISO-8601 standard.
	//
	//	description:
	//		Accepts a string formatted according to a profile of ISO8601 as defined by
	//		[RFC3339](http://www.ietf.org/rfc/rfc3339.txt), except that partial input is allowed.
	//		Can also process dates as specified [by the W3C](http://www.w3.org/TR/NOTE-datetime)
	//		The following combinations are valid:
	//
	//			* dates only
	//			|	* yyyy
	//			|	* yyyy-MM
	//			|	* yyyy-MM-dd
	// 			* times only, with an optional time zone appended
	//			|	* THH:mm
	//			|	* THH:mm:ss
	//			|	* THH:mm:ss.SSS
	// 			* and "datetimes" which could be any combination of the above
	//
	//		timezones may be specified as Z (for UTC) or +/- followed by a time expression HH:mm
	//		Assumes the local time zone if not specified.  Does not validate.  Improperly formatted
	//		input may return null.  Arguments which are out of bounds will be handled
	// 		by the Date constructor (e.g. January 32nd typically gets resolved to February 1st)
	//		Only years between 100 and 9999 are supported.
	//
  	//	formattedString:
	//		A string such as 2005-06-30T08:05:00-07:00 or 2005-06-30 or T08:05:00
	//
	//	defaultTime:
	//		Used for defaults for fields omitted in the formattedString.
	//		Uses 1970-01-01T00:00:00.0Z by default.

	if(!dojo.date.stamp._isoRegExp){
		dojo.date.stamp._isoRegExp =
//TODO: could be more restrictive and check for 00-59, etc.
			/^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+-](\d{2}):(\d{2}))|Z)?)?$/;
	}

	var match = dojo.date.stamp._isoRegExp.exec(formattedString),
		result = null;

	if(match){
		match.shift();
		if(match[1]){match[1]--;} // Javascript Date months are 0-based
		if(match[6]){match[6] *= 1000;} // Javascript Date expects fractional seconds as milliseconds

		if(defaultTime){
			// mix in defaultTime.  Relatively expensive, so use || operators for the fast path of defaultTime === 0
			defaultTime = new Date(defaultTime);
			dojo.map(["FullYear", "Month", "Date", "Hours", "Minutes", "Seconds", "Milliseconds"], function(prop){
				return defaultTime["get" + prop]();
			}).forEach(function(value, index){
				if(match[index] === undefined){
					match[index] = value;
				}
			});
		}
		result = new Date(match[0]||1970, match[1]||0, match[2]||1, match[3]||0, match[4]||0, match[5]||0, match[6]||0); //TODO: UTC defaults
		if(match[0] < 100){
			result.setFullYear(match[0] || 1970);
		}

		var offset = 0,
			zoneSign = match[7] && match[7].charAt(0);
		if(zoneSign != 'Z'){
			offset = ((match[8] || 0) * 60) + (Number(match[9]) || 0);
			if(zoneSign != '-'){ offset *= -1; }
		}
		if(zoneSign){
			offset -= result.getTimezoneOffset();
		}
		if(offset){
			result.setTime(result.getTime() + offset * 60000);
		}
	}

	return result; // Date or null
}

/*=====
	dojo.date.stamp.__Options = function(){
		//	selector: String
		//		"date" or "time" for partial formatting of the Date object.
		//		Both date and time will be formatted by default.
		//	zulu: Boolean
		//		if true, UTC/GMT is used for a timezone
		//	milliseconds: Boolean
		//		if true, output milliseconds
		this.selector = selector;
		this.zulu = zulu;
		this.milliseconds = milliseconds;
	}
=====*/

dojo.date.stamp.toISOString = function(/*Date*/dateObject, /*dojo.date.stamp.__Options?*/options){
	//	summary:
	//		Format a Date object as a string according a subset of the ISO-8601 standard
	//
	//	description:
	//		When options.selector is omitted, output follows [RFC3339](http://www.ietf.org/rfc/rfc3339.txt)
	//		The local time zone is included as an offset from GMT, except when selector=='time' (time without a date)
	//		Does not check bounds.  Only years between 100 and 9999 are supported.
	//
	//	dateObject:
	//		A Date object

	var _ = function(n){ return (n < 10) ? "0" + n : n; };
	options = options || {};
	var formattedDate = [],
		getter = options.zulu ? "getUTC" : "get",
		date = "";
	if(options.selector != "time"){
		var year = dateObject[getter+"FullYear"]();
		date = ["0000".substr((year+"").length)+year, _(dateObject[getter+"Month"]()+1), _(dateObject[getter+"Date"]())].join('-');
	}
	formattedDate.push(date);
	if(options.selector != "date"){
		var time = [_(dateObject[getter+"Hours"]()), _(dateObject[getter+"Minutes"]()), _(dateObject[getter+"Seconds"]())].join(':');
		var millis = dateObject[getter+"Milliseconds"]();
		if(options.milliseconds){
			time += "."+ (millis < 100 ? "0" : "") + _(millis);
		}
		if(options.zulu){
			time += "Z";
		}else if(options.selector != "time"){
			var timezoneOffset = dateObject.getTimezoneOffset();
			var absOffset = Math.abs(timezoneOffset);
			time += (timezoneOffset > 0 ? "-" : "+") + 
				_(Math.floor(absOffset/60)) + ":" + _(absOffset%60);
		}
		formattedDate.push(time);
	}
	return formattedDate.join('T'); // String
}

}

if(!dojo._hasResource["dojo.parser"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.parser"] = true;
dojo.provide("dojo.parser");


dojo.parser = new function(){
	// summary: The Dom/Widget parsing package

	var d = dojo;
	this._attrName = d._scopeName + "Type";
	this._query = "[" + this._attrName + "]";

	function val2type(/*Object*/ value){
		// summary:
		//		Returns name of type of given value.

		if(d.isString(value)){ return "string"; }
		if(typeof value == "number"){ return "number"; }
		if(typeof value == "boolean"){ return "boolean"; }
		if(d.isFunction(value)){ return "function"; }
		if(d.isArray(value)){ return "array"; } // typeof [] == "object"
		if(value instanceof Date) { return "date"; } // assume timestamp
		if(value instanceof d._Url){ return "url"; }
		return "object";
	}

	function str2obj(/*String*/ value, /*String*/ type){
		// summary:
		//		Convert given string value to given type
		switch(type){
			case "string":
				return value;
			case "number":
				return value.length ? Number(value) : NaN;
			case "boolean":
				// for checked/disabled value might be "" or "checked".  interpret as true.
				return typeof value == "boolean" ? value : !(value.toLowerCase()=="false");
			case "function":
				if(d.isFunction(value)){
					// IE gives us a function, even when we say something like onClick="foo"
					// (in which case it gives us an invalid function "function(){ foo }"). 
					//  Therefore, convert to string
					value=value.toString();
					value=d.trim(value.substring(value.indexOf('{')+1, value.length-1));
				}
				try{
					if(value.search(/[^\w\.]+/i) != -1){
						// The user has specified some text for a function like "return x+5"
						return new Function(value);
					}else{
						// The user has specified the name of a function like "myOnClick"
						return d.getObject(value, false);
					}
				}catch(e){ return new Function(); }
			case "array":
				return value ? value.split(/\s*,\s*/) : [];
			case "date":
				switch(value){
					case "": return new Date("");	// the NaN of dates
					case "now": return new Date();	// current date
					default: return d.date.stamp.fromISOString(value);
				}
			case "url":
				return d.baseUrl + value;
			default:
				return d.fromJson(value);
		}
	}

	var instanceClasses = {
		// map from fully qualified name (like "dijit.Button") to structure like
		// { cls: dijit.Button, params: {label: "string", disabled: "boolean"} }
	};

	// Widgets like BorderContainer add properties to _Widget via dojo.extend().
	// If BorderContainer is loaded after _Widget's parameter list has been cached,
	// we need to refresh that parameter list (for _Widget and all widgets that extend _Widget).
	dojo.connect(dojo, "extend", function(){
		instanceClasses = {};
	});

	function getClassInfo(/*String*/ className){
		// className:
		//		fully qualified name (like "dijit.form.Button")
		// returns:
		//		structure like
		//			{ 
		//				cls: dijit.Button, 
		//				params: { label: "string", disabled: "boolean"}
		//			}

		if(!instanceClasses[className]){
			// get pointer to widget class
			var cls = d.getObject(className);
			if(!d.isFunction(cls)){
				throw new Error("Could not load class '" + className +
					"'. Did you spell the name correctly and use a full path, like 'dijit.form.Button'?");
			}
			var proto = cls.prototype;
	
			// get table of parameter names & types
			var params = {}, dummyClass = {};
			for(var name in proto){
				if(name.charAt(0)=="_"){ continue; } 	// skip internal properties
				if(name in dummyClass){ continue; }		// skip "constructor" and "toString"
				var defVal = proto[name];
				params[name]=val2type(defVal);
			}

			instanceClasses[className] = { cls: cls, params: params };
		}
		return instanceClasses[className];
	}

	this._functionFromScript = function(script){
		var preamble = "";
		var suffix = "";
		var argsStr = script.getAttribute("args");
		if(argsStr){
			d.forEach(argsStr.split(/\s*,\s*/), function(part, idx){
				preamble += "var "+part+" = arguments["+idx+"]; ";
			});
		}
		var withStr = script.getAttribute("with");
		if(withStr && withStr.length){
			d.forEach(withStr.split(/\s*,\s*/), function(part){
				preamble += "with("+part+"){";
				suffix += "}";
			});
		}
		return new Function(preamble+script.innerHTML+suffix);
	}

	this.instantiate = function(/* Array */nodes, /* Object? */mixin, /* Object? */args){
		// summary:
		//		Takes array of nodes, and turns them into class instances and
		//		potentially calls a layout method to allow them to connect with
		//		any children		
		// mixin: Object?
		//		An object that will be mixed in with each node in the array.
		//		Values in the mixin will override values in the node, if they
		//		exist.
		// args: Object?
		//		An object used to hold kwArgs for instantiation.
		//		Only supports 'noStart' currently.
		var thelist = [], dp = dojo.parser;
		mixin = mixin||{};
		args = args||{};
		
		d.forEach(nodes, function(node){
			if(!node){ return; }
			var type = dp._attrName in mixin?mixin[dp._attrName]:node.getAttribute(dp._attrName);
			if(!type || !type.length){ return; }
			var clsInfo = getClassInfo(type),
				clazz = clsInfo.cls,
				ps = clazz._noScript || clazz.prototype._noScript;

			// read parameters (ie, attributes).
			// clsInfo.params lists expected params like {"checked": "boolean", "n": "number"}
			var params = {},
				attributes = node.attributes;
			for(var name in clsInfo.params){
				var item = name in mixin?{value:mixin[name],specified:true}:attributes.getNamedItem(name);
				if(!item || (!item.specified && (!dojo.isIE || name.toLowerCase()!="value"))){ continue; }
				var value = item.value;
				// Deal with IE quirks for 'class' and 'style'
				switch(name){
				case "class":
					value = "className" in mixin?mixin.className:node.className;
					break;
				case "style":
					value = "style" in mixin?mixin.style:(node.style && node.style.cssText); // FIXME: Opera?
				}
				var _type = clsInfo.params[name];
				if(typeof value == "string"){
					params[name] = str2obj(value, _type);
				}else{
					params[name] = value;
				}
			}

			// Process <script type="dojo/*"> script tags
			// <script type="dojo/method" event="foo"> tags are added to params, and passed to
			// the widget on instantiation.
			// <script type="dojo/method"> tags (with no event) are executed after instantiation
			// <script type="dojo/connect" event="foo"> tags are dojo.connected after instantiation
			// note: dojo/* script tags cannot exist in self closing widgets, like <input />
			if(!ps){
				var connects = [],	// functions to connect after instantiation
					calls = [];		// functions to call after instantiation

				d.query("> script[type^='dojo/']", node).orphan().forEach(function(script){
					var event = script.getAttribute("event"),
						type = script.getAttribute("type"),
						nf = d.parser._functionFromScript(script);
					if(event){
						if(type == "dojo/connect"){
							connects.push({event: event, func: nf});
						}else{
							params[event] = nf;
						}
					}else{
						calls.push(nf);
					}
				});
			}

			var markupFactory = clazz.markupFactory || clazz.prototype && clazz.prototype.markupFactory;
			// create the instance
			var instance = markupFactory ? markupFactory(params, node, clazz) : new clazz(params, node);
			thelist.push(instance);

			// map it to the JS namespace if that makes sense
			var jsname = node.getAttribute("jsId");
			if(jsname){
				d.setObject(jsname, instance);
			}

			// process connections and startup functions
			if(!ps){
				d.forEach(connects, function(connect){
					d.connect(instance, connect.event, null, connect.func);
				});
				d.forEach(calls, function(func){
					func.call(instance);
				});
			}
		});

		// Call startup on each top level instance if it makes sense (as for
		// widgets).  Parent widgets will recursively call startup on their
		// (non-top level) children
		if(!mixin._started){
			d.forEach(thelist, function(instance){
				if(	!args.noStart && instance  && 
					instance.startup &&
					!instance._started && 
					(!instance.getParent || !instance.getParent())
				){
					instance.startup();
				}
			});
		}
		return thelist;
	};

	this.parse = function(/*DomNode?*/ rootNode, /* Object? */ args){
		// summary:
		//		Scan the DOM for class instances, and instantiate them.
		//
		// description:
		//		Search specified node (or root node) recursively for class instances,
		//		and instantiate them Searches for
		//		dojoType="qualified.class.name"
		//
		// rootNode: DomNode?
		//		A default starting root node from which to start the parsing. Can be
		//		omitted, defaulting to the entire document. If omitted, the `args`
		//		object can be passed in this place. If the `args` object has a 
		//		`rootNode` member, that is used.
		//
		// args:
		//		a kwArgs object passed along to instantiate()
		//		
		//			* noStart: Boolean?
		//				when set will prevent the parser from calling .startup()
		//				when locating the nodes. 
		//			* rootNode: DomNode?
		//				identical to the function's `rootNode` argument, though
		//				allowed to be passed in via this `args object. 
		//
		// example:
		//		Parse all widgets on a page:
		//	|		dojo.parser.parse();
		//
		// example:
		//		Parse all classes within the node with id="foo"
		//	|		dojo.parser.parse(dojo.byId(foo));
		//
		// example:
		//		Parse all classes in a page, but do not call .startup() on any 
		//		child
		//	|		dojo.parser.parse({ noStart: true })
		//
		// example:
		//		Parse all classes in a node, but do not call .startup()
		//	|		dojo.parser.parse(someNode, { noStart:true });
		//	|		// or
		// 	|		dojo.parser.parse({ noStart:true, rootNode: someNode });

		// determine the root node based on the passed arguments.
		var root;
		if(!args && rootNode && rootNode.rootNode){
			args = rootNode;
			root = args.rootNode;
		}else{
			root = rootNode;
		}

		var	list = d.query(this._query, root);
			// go build the object instances
		return this.instantiate(list, null, args); // Array

	};
}();

//Register the parser callback. It should be the first callback
//after the a11y test.

(function(){
	var parseRunner = function(){ 
		if(dojo.config.parseOnLoad){
			dojo.parser.parse(); 
		}
	};

	// FIXME: need to clobber cross-dependency!!
	if(dojo.exists("dijit.wai.onload") && (dijit.wai.onload === dojo._loaders[0])){
		dojo._loaders.splice(1, 0, parseRunner);
	}else{
		dojo._loaders.unshift(parseRunner);
	}
})();

}

if(!dojo._hasResource["dojo.cache"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.cache"] = true;
dojo.provide("dojo.cache");

/*=====
dojo.cache = { 
	// summary:
	// 		A way to cache string content that is fetchable via `dojo.moduleUrl`.
};
=====*/

(function(){
	var cache = {};
	dojo.cache = function(/*String||Object*/module, /*String*/url, /*String||Object?*/value){
		// summary:
		// 		A getter and setter for storing the string content associated with the
		// 		module and url arguments.
		// description:
		// 		module and url are used to call `dojo.moduleUrl()` to generate a module URL.
		// 		If value is specified, the cache value for the moduleUrl will be set to
		// 		that value. Otherwise, dojo.cache will fetch the moduleUrl and store it
		// 		in its internal cache and return that cached value for the URL. To clear
		// 		a cache value pass null for value. Since XMLHttpRequest (XHR) is used to fetch the
		// 		the URL contents, only modules on the same domain of the page can use this capability.
		// 		The build system can inline the cache values though, to allow for xdomain hosting.
		// module: String||Object
		// 		If a String, the module name to use for the base part of the URL, similar to module argument
		// 		to `dojo.moduleUrl`. If an Object, something that has a .toString() method that
		// 		generates a valid path for the cache item. For example, a dojo._Url object.
		// url: String
		// 		The rest of the path to append to the path derived from the module argument. If
		// 		module is an object, then this second argument should be the "value" argument instead.
		// value: String||Object?
		// 		If a String, the value to use in the cache for the module/url combination.
		// 		If an Object, it can have two properties: value and sanitize. The value property
		// 		should be the value to use in the cache, and sanitize can be set to true or false,
		// 		to indicate if XML declarations should be removed from the value and if the HTML
		// 		inside a body tag in the value should be extracted as the real value. The value argument
		// 		or the value property on the value argument are usually only used by the build system
		// 		as it inlines cache content.
		//	example:
		//		To ask dojo.cache to fetch content and store it in the cache (the dojo["cache"] style
		// 		of call is used to avoid an issue with the build system erroneously trying to intern
		// 		this example. To get the build system to intern your dojo.cache calls, use the
		// 		"dojo.cache" style of call):
		// 		|	//If template.html contains "<h1>Hello</h1>" that will be
		// 		|	//the value for the text variable.
		//		|	var text = dojo["cache"]("my.module", "template.html");
		//	example:
		//		To ask dojo.cache to fetch content and store it in the cache, and sanitize the input
		// 		 (the dojo["cache"] style of call is used to avoid an issue with the build system 
		// 		erroneously trying to intern this example. To get the build system to intern your
		// 		dojo.cache calls, use the "dojo.cache" style of call):
		// 		|	//If template.html contains "<html><body><h1>Hello</h1></body></html>", the
		// 		|	//text variable will contain just "<h1>Hello</h1>".
		//		|	var text = dojo["cache"]("my.module", "template.html", {sanitize: true});
		//	example:
		//		Same example as previous, but demostrates how an object can be passed in as
		//		the first argument, then the value argument can then be the second argument.
		// 		|	//If template.html contains "<html><body><h1>Hello</h1></body></html>", the
		// 		|	//text variable will contain just "<h1>Hello</h1>".
		//		|	var text = dojo["cache"](new dojo._Url("my/module/template.html"), {sanitize: true});

		//Module could be a string, or an object that has a toString() method
		//that will return a useful path. If it is an object, then the "url" argument
		//will actually be the value argument.
		if(typeof module == "string"){
			var pathObj = dojo.moduleUrl(module, url);
		}else{
			pathObj = module;
			value = url;
		}
		var key = pathObj.toString();

		var val = value;
		if(value !== undefined && !dojo.isString(value)){
			val = ("value" in value ? value.value : undefined);
		}

		var sanitize = value && value.sanitize ? true : false;

		if(val || val === null){
			//We have a value, either clear or set the cache value.
			if(val == null){
				delete cache[key];
			}else{
				val = cache[key] = sanitize ? dojo.cache._sanitize(val) : val;
			}
		}else{
			//Allow cache values to be empty strings. If key property does
			//not exist, fetch it.
			if(!(key in cache)){
				val = dojo._getText(key);
				cache[key] = sanitize ? dojo.cache._sanitize(val) : val;
			}
			val = cache[key];
		}
		return val; //String
	};

	dojo.cache._sanitize = function(/*String*/val){
		// summary: 
		//		Strips <?xml ...?> declarations so that external SVG and XML
		// 		documents can be added to a document without worry. Also, if the string
		//		is an HTML document, only the part inside the body tag is returned.
		// description:
		// 		Copied from dijit._Templated._sanitizeTemplateString.
		if(val){
			val = val.replace(/^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im, "");
			var matches = val.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
			if(matches){
				val = matches[1];
			}
		}else{
			val = "";
		}
		return val; //String
	};
})();

}

if(!dojo._hasResource["dijit._Templated"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._Templated"] = true;
dojo.provide("dijit._Templated");






dojo.declare("dijit._Templated",
	null,
	{
		// summary:
		//		Mixin for widgets that are instantiated from a template

		// templateString: [protected] String
		//		A string that represents the widget template. Pre-empts the
		//		templatePath. In builds that have their strings "interned", the
		//		templatePath is converted to an inline templateString, thereby
		//		preventing a synchronous network call.
		//
		//		Use in conjunction with dojo.cache() to load from a file.
		templateString: null,

		// templatePath: [protected deprecated] String
		//		Path to template (HTML file) for this widget relative to dojo.baseUrl.
		//		Deprecated: use templateString with dojo.cache() instead.
		templatePath: null,

		// widgetsInTemplate: [protected] Boolean
		//		Should we parse the template to find widgets that might be
		//		declared in markup inside it?  False by default.
		widgetsInTemplate: false,

		// skipNodeCache: [protected] Boolean
		//		If using a cached widget template node poses issues for a
		//		particular widget class, it can set this property to ensure
		//		that its template is always re-built from a string
		_skipNodeCache: false,

		// _earlyTemplatedStartup: Boolean
		//		A fallback to preserve the 1.0 - 1.3 behavior of children in
		//		templates having their startup called before the parent widget
		//		fires postCreate. Defaults to 'false', causing child widgets to
		//		have their .startup() called immediately before a parent widget
		//		.startup(), but always after the parent .postCreate(). Set to
		//		'true' to re-enable to previous, arguably broken, behavior.
		_earlyTemplatedStartup: false,

		// _attachPoints: [private] String[]
		//		List of widget attribute names associated with dojoAttachPoint=... in the
		//		template, ex: ["containerNode", "labelNode"]
/*=====
 		_attachPoints: [],
 =====*/

		constructor: function(){
			this._attachPoints = [];
		},

		_stringRepl: function(tmpl){
			// summary:
			//		Does substitution of ${foo} type properties in template string
			// tags:
			//		private
			var className = this.declaredClass, _this = this;
			// Cache contains a string because we need to do property replacement
			// do the property replacement
			return dojo.string.substitute(tmpl, this, function(value, key){
				if(key.charAt(0) == '!'){ value = dojo.getObject(key.substr(1), false, _this); }
				if(typeof value == "undefined"){ throw new Error(className+" template:"+key); } // a debugging aide
				if(value == null){ return ""; }

				// Substitution keys beginning with ! will skip the transform step,
				// in case a user wishes to insert unescaped markup, e.g. ${!foo}
				return key.charAt(0) == "!" ? value :
					// Safer substitution, see heading "Attribute values" in
					// http://www.w3.org/TR/REC-html40/appendix/notes.html#h-B.3.2
					value.toString().replace(/"/g,"&quot;"); //TODO: add &amp? use encodeXML method?
			}, this);
		},

		// method over-ride
		buildRendering: function(){
			// summary:
			//		Construct the UI for this widget from a template, setting this.domNode.
			// tags:
			//		protected

			// Lookup cached version of template, and download to cache if it
			// isn't there already.  Returns either a DomNode or a string, depending on
			// whether or not the template contains ${foo} replacement parameters.
			var cached = dijit._Templated.getCachedTemplate(this.templatePath, this.templateString, this._skipNodeCache);

			var node;
			if(dojo.isString(cached)){
				node = dojo._toDom(this._stringRepl(cached));
				if(node.nodeType != 1){
					// Flag common problems such as templates with multiple top level nodes (nodeType == 11)
					throw new Error("Invalid template: " + cached);
				}
			}else{
				// if it's a node, all we have to do is clone it
				node = cached.cloneNode(true);
			}

			this.domNode = node;

			// recurse through the node, looking for, and attaching to, our
			// attachment points and events, which should be defined on the template node.
			this._attachTemplateNodes(node);

			if(this.widgetsInTemplate){
				// Make sure dojoType is used for parsing widgets in template.
				// The dojo.parser.query could be changed from multiversion support.
				var parser = dojo.parser, qry, attr;
				if(parser._query != "[dojoType]"){
					qry = parser._query;
					attr = parser._attrName;
					parser._query = "[dojoType]";
					parser._attrName = "dojoType";
				}

				// Store widgets that we need to start at a later point in time
				var cw = (this._startupWidgets = dojo.parser.parse(node, {
					noStart: !this._earlyTemplatedStartup
				}));

				// Restore the query.
				if(qry){
					parser._query = qry;
					parser._attrName = attr;
				}

				this._supportingWidgets = dijit.findWidgets(node);

				this._attachTemplateNodes(cw, function(n,p){
					return n[p];
				});
			}

			this._fillContent(this.srcNodeRef);
		},

		_fillContent: function(/*DomNode*/ source){
			// summary:
			//		Relocate source contents to templated container node.
			//		this.containerNode must be able to receive children, or exceptions will be thrown.
			// tags:
			//		protected
			var dest = this.containerNode;
			if(source && dest){
				while(source.hasChildNodes()){
					dest.appendChild(source.firstChild);
				}
			}
		},

		_attachTemplateNodes: function(rootNode, getAttrFunc){
			// summary:
			//		Iterate through the template and attach functions and nodes accordingly.
			// description:
			//		Map widget properties and functions to the handlers specified in
			//		the dom node and it's descendants. This function iterates over all
			//		nodes and looks for these properties:
			//			* dojoAttachPoint
			//			* dojoAttachEvent
			//			* waiRole
			//			* waiState
			// rootNode: DomNode|Array[Widgets]
			//		the node to search for properties. All children will be searched.
			// getAttrFunc: Function?
			//		a function which will be used to obtain property for a given
			//		DomNode/Widget
			// tags:
			//		private

			getAttrFunc = getAttrFunc || function(n,p){ return n.getAttribute(p); };

			var nodes = dojo.isArray(rootNode) ? rootNode : (rootNode.all || rootNode.getElementsByTagName("*"));
			var x = dojo.isArray(rootNode) ? 0 : -1;
			for(; x<nodes.length; x++){
				var baseNode = (x == -1) ? rootNode : nodes[x];
				if(this.widgetsInTemplate && getAttrFunc(baseNode, "dojoType")){
					continue;
				}
				// Process dojoAttachPoint
				var attachPoint = getAttrFunc(baseNode, "dojoAttachPoint");
				if(attachPoint){
					var point, points = attachPoint.split(/\s*,\s*/);
					while((point = points.shift())){
						if(dojo.isArray(this[point])){
							this[point].push(baseNode);
						}else{
							this[point]=baseNode;
						}
						this._attachPoints.push(point);
					}
				}

				// Process dojoAttachEvent
				var attachEvent = getAttrFunc(baseNode, "dojoAttachEvent");
				if(attachEvent){
					// NOTE: we want to support attributes that have the form
					// "domEvent: nativeEvent; ..."
					var event, events = attachEvent.split(/\s*,\s*/);
					var trim = dojo.trim;
					while((event = events.shift())){
						if(event){
							var thisFunc = null;
							if(event.indexOf(":") != -1){
								// oh, if only JS had tuple assignment
								var funcNameArr = event.split(":");
								event = trim(funcNameArr[0]);
								thisFunc = trim(funcNameArr[1]);
							}else{
								event = trim(event);
							}
							if(!thisFunc){
								thisFunc = event;
							}
							this.connect(baseNode, event, thisFunc);
						}
					}
				}

				// waiRole, waiState
				var role = getAttrFunc(baseNode, "waiRole");
				if(role){
					dijit.setWaiRole(baseNode, role);
				}
				var values = getAttrFunc(baseNode, "waiState");
				if(values){
					dojo.forEach(values.split(/\s*,\s*/), function(stateValue){
						if(stateValue.indexOf('-') != -1){
							var pair = stateValue.split('-');
							dijit.setWaiState(baseNode, pair[0], pair[1]);
						}
					});
				}
			}
		},

		startup: function(){
			dojo.forEach(this._startupWidgets, function(w){
				if(w && !w._started && w.startup){
					w.startup();
				}
			});
			this.inherited(arguments);
		},

		destroyRendering: function(){
			// Delete all attach points to prevent IE6 memory leaks.
			dojo.forEach(this._attachPoints, function(point){
				delete this[point];
			}, this);
			this._attachPoints = [];

			this.inherited(arguments);
		}
	}
);

// key is either templatePath or templateString; object is either string or DOM tree
dijit._Templated._templateCache = {};

dijit._Templated.getCachedTemplate = function(templatePath, templateString, alwaysUseString){
	// summary:
	//		Static method to get a template based on the templatePath or
	//		templateString key
	// templatePath: String||dojo.uri.Uri
	//		The URL to get the template from.
	// templateString: String?
	//		a string to use in lieu of fetching the template from a URL. Takes precedence
	//		over templatePath
	// returns: Mixed
	//		Either string (if there are ${} variables that need to be replaced) or just
	//		a DOM tree (if the node can be cloned directly)

	// is it already cached?
	var tmplts = dijit._Templated._templateCache;
	var key = templateString || templatePath;
	var cached = tmplts[key];
	if(cached){
		try{
			// if the cached value is an innerHTML string (no ownerDocument) or a DOM tree created within the current document, then use the current cached value
			if(!cached.ownerDocument || cached.ownerDocument == dojo.doc){
				// string or node of the same document
				return cached;
			}
		}catch(e){ /* squelch */ } // IE can throw an exception if cached.ownerDocument was reloaded
		dojo.destroy(cached);
	}

	// If necessary, load template string from template path
	if(!templateString){
		templateString = dojo.cache(templatePath, {sanitize: true});
	}
	templateString = dojo.string.trim(templateString);

	if(alwaysUseString || templateString.match(/\$\{([^\}]+)\}/g)){
		// there are variables in the template so all we can do is cache the string
		return (tmplts[key] = templateString); //String
	}else{
		// there are no variables in the template so we can cache the DOM tree
		var node = dojo._toDom(templateString);
		if(node.nodeType != 1){
			throw new Error("Invalid template: " + templateString);
		}
		return (tmplts[key] = node); //Node
	}
};

if(dojo.isIE){
	dojo.addOnWindowUnload(function(){
		var cache = dijit._Templated._templateCache;
		for(var key in cache){
			var value = cache[key];
			if(typeof value == "object"){ // value is either a string or a DOM node template
				dojo.destroy(value);
			}
			delete cache[key];
		}
	});
}

// These arguments can be specified for widgets which are used in templates.
// Since any widget can be specified as sub widgets in template, mix it
// into the base widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit._Widget,{
	dojoAttachEvent: "",
	dojoAttachPoint: "",
	waiRole: "",
	waiState:""
});

}

if(!dojo._hasResource["dijit.form._FormWidget"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.form._FormWidget"] = true;
dojo.provide("dijit.form._FormWidget");




dojo.declare("dijit.form._FormWidget", [dijit._Widget, dijit._Templated],
	{
	// summary:
	//		Base class for widgets corresponding to native HTML elements such as <checkbox> or <button>,
	//		which can be children of a <form> node or a `dijit.form.Form` widget.
	//
	// description:
	//		Represents a single HTML element.
	//		All these widgets should have these attributes just like native HTML input elements.
	//		You can set them during widget construction or afterwards, via `dijit._Widget.attr`.
	//
	//		They also share some common methods.

	// baseClass: [protected] String
	//		Root CSS class of the widget (ex: dijitTextBox), used to add CSS classes of widget
	//		(ex: "dijitTextBox dijitTextBoxInvalid dijitTextBoxFocused dijitTextBoxInvalidFocused")
	//		See _setStateClass().
	baseClass: "",

	// name: String
	//		Name used when submitting form; same as "name" attribute or plain HTML elements
	name: "",

	// alt: String
	//		Corresponds to the native HTML <input> element's attribute.
	alt: "",

	// value: String
	//		Corresponds to the native HTML <input> element's attribute.
	value: "",

	// type: String
	//		Corresponds to the native HTML <input> element's attribute.
	type: "text",

	// tabIndex: Integer
	//		Order fields are traversed when user hits the tab key
	tabIndex: "0",

	// disabled: Boolean
	//		Should this widget respond to user input?
	//		In markup, this is specified as "disabled='disabled'", or just "disabled".
	disabled: false,

	// intermediateChanges: Boolean
	//		Fires onChange for each value change or only on demand
	intermediateChanges: false,

	// scrollOnFocus: Boolean
	//		On focus, should this widget scroll into view?
	scrollOnFocus: true,

	// These mixins assume that the focus node is an INPUT, as many but not all _FormWidgets are.
	attributeMap: dojo.delegate(dijit._Widget.prototype.attributeMap, {
		value: "focusNode",
		id: "focusNode",
		tabIndex: "focusNode",
		alt: "focusNode",
		title: "focusNode"
	}),

	postMixInProperties: function(){
		// Setup name=foo string to be referenced from the template (but only if a name has been specified)
		// Unfortunately we can't use attributeMap to set the name due to IE limitations, see #8660
		this.nameAttrSetting = this.name ? ("name='" + this.name + "'") : "";
		this.inherited(arguments);
	},

	_setDisabledAttr: function(/*Boolean*/ value){
		this.disabled = value;
		dojo.attr(this.focusNode, 'disabled', value);
		if(this.valueNode){
			dojo.attr(this.valueNode, 'disabled', value);
		}
		dijit.setWaiState(this.focusNode, "disabled", value);

		if(value){
			// reset those, because after the domNode is disabled, we can no longer receive
			// mouse related events, see #4200
			this._hovering = false;
			this._active = false;
			// remove the tabIndex, especially for FF
			this.focusNode.setAttribute('tabIndex', "-1");
		}else{
			this.focusNode.setAttribute('tabIndex', this.tabIndex);
		}
		this._setStateClass();
	},

	setDisabled: function(/*Boolean*/ disabled){
		// summary:
		//		Deprecated.   Use attr('disabled', ...) instead.
		dojo.deprecated("setDisabled("+disabled+") is deprecated. Use attr('disabled',"+disabled+") instead.", "", "2.0");
		this.attr('disabled', disabled);
	},

	_onFocus: function(e){
		if(this.scrollOnFocus){
			dijit.scrollIntoView(this.domNode);
		}
		this.inherited(arguments);
	},

	_onMouse : function(/*Event*/ event){
		// summary:
		//	Sets _hovering, _active, and stateModifier properties depending on mouse state,
		//	then calls setStateClass() to set appropriate CSS classes for this.domNode.
		//
		//	To get a different CSS class for hover, send onmouseover and onmouseout events to this method.
		//	To get a different CSS class while mouse button is depressed, send onmousedown to this method.

		var mouseNode = event.currentTarget;
		if(mouseNode && mouseNode.getAttribute){
			this.stateModifier = mouseNode.getAttribute("stateModifier") || "";
		}

		if(!this.disabled){
			switch(event.type){
				case "mouseenter":
				case "mouseover":
					this._hovering = true;
					this._active = this._mouseDown;
					break;

				case "mouseout":
				case "mouseleave":
					this._hovering = false;
					this._active = false;
					break;

				case "mousedown" :
					this._active = true;
					this._mouseDown = true;
					// set a global event to handle mouseup, so it fires properly
					//	even if the cursor leaves the button
					var mouseUpConnector = this.connect(dojo.body(), "onmouseup", function(){
						// if user clicks on the button, even if the mouse is released outside of it,
						// this button should get focus (which mimics native browser buttons)
						if(this._mouseDown && this.isFocusable()){
							this.focus();
						}
						this._active = false;
						this._mouseDown = false;
						this._setStateClass();
						this.disconnect(mouseUpConnector);
					});
					break;
			}
			this._setStateClass();
		}
	},

	isFocusable: function(){
		// summary:
		//		Tells if this widget is focusable or not.   Used internally by dijit.
		// tags:
		//		protected
		return !this.disabled && !this.readOnly && this.focusNode && (dojo.style(this.domNode, "display") != "none");
	},

	focus: function(){
		// summary:
		//		Put focus on this widget
		dijit.focus(this.focusNode);
	},

	_setStateClass: function(){
		// summary:
		//		Update the visual state of the widget by setting the css classes on this.domNode
		//		(or this.stateNode if defined) by combining this.baseClass with
		//		various suffixes that represent the current widget state(s).
		//
		// description:
		//		In the case where a widget has multiple
		//		states, it sets the class based on all possible
		//	 	combinations.  For example, an invalid form widget that is being hovered
		//		will be "dijitInput dijitInputInvalid dijitInputHover dijitInputInvalidHover".
		//
		//		For complex widgets with multiple regions, there can be various hover/active states,
		//		such as "Hover" or "CloseButtonHover" (for tab buttons).
		//		This is controlled by a stateModifier="CloseButton" attribute on the close button node.
		//
		//		The widget may have one or more of the following states, determined
		//		by this.state, this.checked, this.valid, and this.selected:
		//			- Error - ValidationTextBox sets this.state to "Error" if the current input value is invalid
		//			- Checked - ex: a checkmark or a ToggleButton in a checked state, will have this.checked==true
		//			- Selected - ex: currently selected tab will have this.selected==true
		//
		//		In addition, it may have one or more of the following states,
		//		based on this.disabled and flags set in _onMouse (this._active, this._hovering, this._focused):
		//			- Disabled	- if the widget is disabled
		//			- Active		- if the mouse (or space/enter key?) is being pressed down
		//			- Focused		- if the widget has focus
		//			- Hover		- if the mouse is over the widget

		// Compute new set of classes
		var newStateClasses = this.baseClass.split(" ");

		function multiply(modifier){
			newStateClasses = newStateClasses.concat(dojo.map(newStateClasses, function(c){ return c+modifier; }), "dijit"+modifier);
		}

		if(this.checked){
			multiply("Checked");
		}
		if(this.state){
			multiply(this.state);
		}
		if(this.selected){
			multiply("Selected");
		}

		if(this.disabled){
			multiply("Disabled");
		}else if(this.readOnly){
			multiply("ReadOnly");
		}else if(this._active){
			multiply(this.stateModifier+"Active");
		}else{
			if(this._focused){
				multiply("Focused");
			}
			if(this._hovering){
				multiply(this.stateModifier+"Hover");
			}
		}

		// Remove old state classes and add new ones.
		// For performance concerns we only write into domNode.className once.
		var tn = this.stateNode || this.domNode,
			classHash = {};	// set of all classes (state and otherwise) for node

		dojo.forEach(tn.className.split(" "), function(c){ classHash[c] = true; });

		if("_stateClasses" in this){
			dojo.forEach(this._stateClasses, function(c){ delete classHash[c]; });
		}

		dojo.forEach(newStateClasses, function(c){ classHash[c] = true; });

		var newClasses = [];
		for(var c in classHash){
			newClasses.push(c);
		}
		tn.className = newClasses.join(" ");

		this._stateClasses = newStateClasses;
	},

	compare: function(/*anything*/val1, /*anything*/val2){
		// summary:
		//		Compare 2 values (as returned by attr('value') for this widget).
		// tags:
		//		protected
		if(typeof val1 == "number" && typeof val2 == "number"){
			return (isNaN(val1) && isNaN(val2)) ? 0 : val1 - val2;
		}else if(val1 > val2){
			return 1;
		}else if(val1 < val2){
			return -1;
		}else{
			return 0;
		}
	},

	onChange: function(newValue){
		// summary:
		//		Callback when this widget's value is changed.
		// tags:
		//		callback
	},

	// _onChangeActive: [private] Boolean
	//		Indicates that changes to the value should call onChange() callback.
	//		This is false during widget initialization, to avoid calling onChange()
	//		when the initial value is set.
	_onChangeActive: false,

	_handleOnChange: function(/*anything*/ newValue, /* Boolean? */ priorityChange){
		// summary:
		//		Called when the value of the widget is set.  Calls onChange() if appropriate
		// newValue:
		//		the new value
		// priorityChange:
		//		For a slider, for example, dragging the slider is priorityChange==false,
		//		but on mouse up, it's priorityChange==true.  If intermediateChanges==true,
		//		onChange is only called form priorityChange=true events.
		// tags:
		//		private
		this._lastValue = newValue;
		if(this._lastValueReported == undefined && (priorityChange === null || !this._onChangeActive)){
			// this block executes not for a change, but during initialization,
			// and is used to store away the original value (or for ToggleButton, the original checked state)
			this._resetValue = this._lastValueReported = newValue;
		}
		if((this.intermediateChanges || priorityChange || priorityChange === undefined) &&
			((typeof newValue != typeof this._lastValueReported) ||
				this.compare(newValue, this._lastValueReported) != 0)){
			this._lastValueReported = newValue;
			if(this._onChangeActive){
				if(this._onChangeHandle){
					clearTimeout(this._onChangeHandle);
				}
				// setTimout allows hidden value processing to run and
				// also the onChange handler can safely adjust focus, etc
				this._onChangeHandle = setTimeout(dojo.hitch(this,
					function(){
						this._onChangeHandle = null;
						this.onChange(newValue);
					}), 0); // try to collapse multiple onChange's fired faster than can be processed
			}
		}
	},

	create: function(){
		// Overrides _Widget.create()
		this.inherited(arguments);
		this._onChangeActive = true;
		this._setStateClass();
	},

	destroy: function(){
		if(this._onChangeHandle){ // destroy called before last onChange has fired
			clearTimeout(this._onChangeHandle);
			this.onChange(this._lastValueReported);
		}
		this.inherited(arguments);
	},

	setValue: function(/*String*/ value){
		// summary:
		//		Deprecated.   Use attr('value', ...) instead.
		dojo.deprecated("dijit.form._FormWidget:setValue("+value+") is deprecated.  Use attr('value',"+value+") instead.", "", "2.0");
		this.attr('value', value);
	},

	getValue: function(){
		// summary:
		//		Deprecated.   Use attr('value') instead.
		dojo.deprecated(this.declaredClass+"::getValue() is deprecated. Use attr('value') instead.", "", "2.0");
		return this.attr('value');
	}
});

dojo.declare("dijit.form._FormValueWidget", dijit.form._FormWidget,
{
	// summary:
	//		Base class for widgets corresponding to native HTML elements such as <input> or <select> that have user changeable values.
	// description:
	//		Each _FormValueWidget represents a single input value, and has a (possibly hidden) <input> element,
	//		to which it serializes it's input value, so that form submission (either normal submission or via FormBind?)
	//		works as expected.

	// Don't attempt to mixin the 'type', 'name' attributes here programatically -- they must be declared
	// directly in the template as read by the parser in order to function. IE is known to specifically
	// require the 'name' attribute at element creation time.   See #8484, #8660.
	// TODO: unclear what that {value: ""} is for; FormWidget.attributeMap copies value to focusNode,
	// so maybe {value: ""} is so the value *doesn't* get copied to focusNode?
	// Seems like we really want value removed from attributeMap altogether
	// (although there's no easy way to do that now)

	// readOnly: Boolean
	//		Should this widget respond to user input?
	//		In markup, this is specified as "readOnly".
	//		Similar to disabled except readOnly form values are submitted.
	readOnly: false,

	attributeMap: dojo.delegate(dijit.form._FormWidget.prototype.attributeMap, {
		value: "",
		readOnly: "focusNode"
	}),

	_setReadOnlyAttr: function(/*Boolean*/ value){
		this.readOnly = value;
		dojo.attr(this.focusNode, 'readOnly', value);
		dijit.setWaiState(this.focusNode, "readonly", value);
		this._setStateClass();
	},

	postCreate: function(){
		if(dojo.isIE){ // IE won't stop the event with keypress
			this.connect(this.focusNode || this.domNode, "onkeydown", this._onKeyDown);
		}
		// Update our reset value if it hasn't yet been set (because this.attr
		// is only called when there *is* a value
		if(this._resetValue === undefined){
			this._resetValue = this.value;
		}
	},

	_setValueAttr: function(/*anything*/ newValue, /*Boolean, optional*/ priorityChange){
		// summary:
		//		Hook so attr('value', value) works.
		// description:
		//		Sets the value of the widget.
		//		If the value has changed, then fire onChange event, unless priorityChange
		//		is specified as null (or false?)
		this.value = newValue;
		this._handleOnChange(newValue, priorityChange);
	},

	_getValueAttr: function(){
		// summary:
		//		Hook so attr('value') works.
		return this._lastValue;
	},

	undo: function(){
		// summary:
		//		Restore the value to the last value passed to onChange
		this._setValueAttr(this._lastValueReported, false);
	},

	reset: function(){
		// summary:
		//		Reset the widget's value to what it was at initialization time
		this._hasBeenBlurred = false;
		this._setValueAttr(this._resetValue, true);
	},

	_onKeyDown: function(e){
		if(e.keyCode == dojo.keys.ESCAPE && !(e.ctrlKey || e.altKey || e.metaKey)){
			var te;
			if(dojo.isIE){
				e.preventDefault(); // default behavior needs to be stopped here since keypress is too late
				te = document.createEventObject();
				te.keyCode = dojo.keys.ESCAPE;
				te.shiftKey = e.shiftKey;
				e.srcElement.fireEvent('onkeypress', te);
			}
		}
	},

	_layoutHackIE7: function(){
		// summary:
		//		Work around table sizing bugs on IE7 by forcing redraw

		if(dojo.isIE == 7){ // fix IE7 layout bug when the widget is scrolled out of sight
			var domNode = this.domNode;
			var parent = domNode.parentNode;
			var pingNode = domNode.firstChild || domNode; // target node most unlikely to have a custom filter
			var origFilter = pingNode.style.filter; // save custom filter, most likely nothing
			while(parent && parent.clientHeight == 0){ // search for parents that haven't rendered yet
				parent._disconnectHandle = this.connect(parent, "onscroll", dojo.hitch(this, function(e){
					this.disconnect(parent._disconnectHandle); // only call once
					parent.removeAttribute("_disconnectHandle"); // clean up DOM node
					pingNode.style.filter = (new Date()).getMilliseconds(); // set to anything that's unique
					setTimeout(function(){ pingNode.style.filter = origFilter }, 0); // restore custom filter, if any
				}));
				parent = parent.parentNode;
			}
		}
	}
});

}

if(!dojo._hasResource["dijit.form.TextBox"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.form.TextBox"] = true;
dojo.provide("dijit.form.TextBox");



dojo.declare(
	"dijit.form.TextBox",
	dijit.form._FormValueWidget,
	{
		// summary:
		//		A base class for textbox form inputs

		// trim: Boolean
		//		Removes leading and trailing whitespace if true.  Default is false.
		trim: false,

		// uppercase: Boolean
		//		Converts all characters to uppercase if true.  Default is false.
		uppercase: false,

		// lowercase: Boolean
		//		Converts all characters to lowercase if true.  Default is false.
		lowercase: false,

		// propercase: Boolean
		//		Converts the first character of each word to uppercase if true.
		propercase: false,

		//	maxLength: String
		//		HTML INPUT tag maxLength declaration.
		maxLength: "",

		//	selectOnClick: [const] Boolean
		//		If true, all text will be selected when focused with mouse
		selectOnClick: false,

		templateString: dojo.cache("dijit.form", "templates/TextBox.html", "<input class=\"dijit dijitReset dijitLeft\" dojoAttachPoint='textbox,focusNode'\n\tdojoAttachEvent='onmouseenter:_onMouse,onmouseleave:_onMouse'\n\tautocomplete=\"off\" type=\"${type}\" ${nameAttrSetting}\n\t/>\n"),
		baseClass: "dijitTextBox",

		attributeMap: dojo.delegate(dijit.form._FormValueWidget.prototype.attributeMap, {
			maxLength: "focusNode"
		}),

		_getValueAttr: function(){
			// summary:
			//		Hook so attr('value') works as we like.
			// description:
			//		For `dijit.form.TextBox` this basically returns the value of the <input>.
			//
			//		For `dijit.form.MappedTextBox` subclasses, which have both
			//		a "displayed value" and a separate "submit value",
			//		This treats the "displayed value" as the master value, computing the
			//		submit value from it via this.parse().
			return this.parse(this.attr('displayedValue'), this.constraints);
		},

		_setValueAttr: function(value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
			// summary:
			//		Hook so attr('value', ...) works.
			//
			// description:
			//		Sets the value of the widget to "value" which can be of
			//		any type as determined by the widget.
			//
			// value:
			//		The visual element value is also set to a corresponding,
			//		but not necessarily the same, value.
			//
			// formattedValue:
			//		If specified, used to set the visual element value,
			//		otherwise a computed visual value is used.
			//
			// priorityChange:
			//		If true, an onChange event is fired immediately instead of
			//		waiting for the next blur event.

			var filteredValue;
			if(value !== undefined){
				// TODO: this is calling filter() on both the display value and the actual value.
				// I added a comment to the filter() definition about this, but it should be changed.
				filteredValue = this.filter(value);
				if(typeof formattedValue != "string"){
					if(filteredValue !== null && ((typeof filteredValue != "number") || !isNaN(filteredValue))){
						formattedValue = this.filter(this.format(filteredValue, this.constraints));
					}else{ formattedValue = ''; }
				}
			}
			if(formattedValue != null && formattedValue != undefined && ((typeof formattedValue) != "number" || !isNaN(formattedValue)) && this.textbox.value != formattedValue){
				this.textbox.value = formattedValue;
			}
			this.inherited(arguments, [filteredValue, priorityChange]);
		},

		// displayedValue: String
		//		For subclasses like ComboBox where the displayed value
		//		(ex: Kentucky) and the serialized value (ex: KY) are different,
		//		this represents the displayed value.
		//
		//		Setting 'displayedValue' through attr('displayedValue', ...)
		//		updates 'value', and vice-versa.  Othewise 'value' is updated
		//		from 'displayedValue' periodically, like onBlur etc.
		//
		//		TODO: move declaration to MappedTextBox?
		//		Problem is that ComboBox references displayedValue,
		//		for benefit of FilteringSelect.
		displayedValue: "",

		getDisplayedValue: function(){
			// summary:
			//		Deprecated.   Use attr('displayedValue') instead.
			// tags:
			//		deprecated
			dojo.deprecated(this.declaredClass+"::getDisplayedValue() is deprecated. Use attr('displayedValue') instead.", "", "2.0");
			return this.attr('displayedValue');
		},

		_getDisplayedValueAttr: function(){
			// summary:
			//		Hook so attr('displayedValue') works.
			// description:
			//		Returns the displayed value (what the user sees on the screen),
			// 		after filtering (ie, trimming spaces etc.).
			//
			//		For some subclasses of TextBox (like ComboBox), the displayed value
			//		is different from the serialized value that's actually
			//		sent to the server (see dijit.form.ValidationTextBox.serialize)

			return this.filter(this.textbox.value);
		},

		setDisplayedValue: function(/*String*/value){
			// summary:
			//		Deprecated.   Use attr('displayedValue', ...) instead.
			// tags:
			//		deprecated
			dojo.deprecated(this.declaredClass+"::setDisplayedValue() is deprecated. Use attr('displayedValue', ...) instead.", "", "2.0");
			this.attr('displayedValue', value);
		},

		_setDisplayedValueAttr: function(/*String*/value){
			// summary:
			//		Hook so attr('displayedValue', ...) works.
			// description:
			//		Sets the value of the visual element to the string "value".
			//		The widget value is also set to a corresponding,
			//		but not necessarily the same, value.

			if(value === null || value === undefined){ value = '' }
			else if(typeof value != "string"){ value = String(value) }
			this.textbox.value = value;
			this._setValueAttr(this.attr('value'), undefined, value);
		},

		format: function(/* String */ value, /* Object */ constraints){
			// summary:
			//		Replacable function to convert a value to a properly formatted string.
			// tags:
			//		protected extension
			return ((value == null || value == undefined) ? "" : (value.toString ? value.toString() : value));
		},

		parse: function(/* String */ value, /* Object */ constraints){
			// summary:
			//		Replacable function to convert a formatted string to a value
			// tags:
			//		protected extension

			return value;	// String
		},

		_refreshState: function(){
			// summary:
			//		After the user types some characters, etc., this method is
			//		called to check the field for validity etc.  The base method
			//		in `dijit.form.TextBox` does nothing, but subclasses override.
			// tags:
			//		protected
		},

		_onInput: function(e){
			if(e && e.type && /key/i.test(e.type) && e.keyCode){
				switch(e.keyCode){
					case dojo.keys.SHIFT:
					case dojo.keys.ALT:
					case dojo.keys.CTRL:
					case dojo.keys.TAB:
						return;
				}
			}
			if(this.intermediateChanges){
				var _this = this;
				// the setTimeout allows the key to post to the widget input box
				setTimeout(function(){ _this._handleOnChange(_this.attr('value'), false); }, 0);
			}
			this._refreshState();
		},

		postCreate: function(){
			// setting the value here is needed since value="" in the template causes "undefined"
			// and setting in the DOM (instead of the JS object) helps with form reset actions
			this.textbox.setAttribute("value", this.textbox.value); // DOM and JS values shuld be the same
			this.inherited(arguments);
			if(dojo.isMoz || dojo.isOpera){
				this.connect(this.textbox, "oninput", this._onInput);
			}else{
				this.connect(this.textbox, "onkeydown", this._onInput);
				this.connect(this.textbox, "onkeyup", this._onInput);
				this.connect(this.textbox, "onpaste", this._onInput);
				this.connect(this.textbox, "oncut", this._onInput);
			}
		},

		_blankValue: '', // if the textbox is blank, what value should be reported
		filter: function(val){
			// summary:
			//		Auto-corrections (such as trimming) that are applied to textbox
			//		value on blur or form submit.
			// description:
			//		For MappedTextBox subclasses, this is called twice
			// 			- once with the display value
			//			- once the value as set/returned by attr('value', ...)
			//		and attr('value'), ex: a Number for NumberTextBox.
			//
			//		In the latter case it does corrections like converting null to NaN.  In
			//		the former case the NumberTextBox.filter() method calls this.inherited()
			//		to execute standard trimming code in TextBox.filter().
			//
			//		TODO: break this into two methods in 2.0
			//
			// tags:
			//		protected extension
			if(val === null){ return this._blankValue; }
			if(typeof val != "string"){ return val; }
			if(this.trim){
				val = dojo.trim(val);
			}
			if(this.uppercase){
				val = val.toUpperCase();
			}
			if(this.lowercase){
				val = val.toLowerCase();
			}
			if(this.propercase){
				val = val.replace(/[^\s]+/g, function(word){
					return word.substring(0,1).toUpperCase() + word.substring(1);
				});
			}
			return val;
		},

		_setBlurValue: function(){
			this._setValueAttr(this.attr('value'), true);
		},

		_onBlur: function(e){
			if(this.disabled){ return; }
			this._setBlurValue();
			this.inherited(arguments);

			if(this._selectOnClickHandle){
				this.disconnect(this._selectOnClickHandle);
			}
			if(this.selectOnClick && dojo.isMoz){
				this.textbox.selectionStart = this.textbox.selectionEnd = undefined; // clear selection so that the next mouse click doesn't reselect
			}
		},

		_onFocus: function(/*String*/ by){
			if(this.disabled || this.readOnly){ return; }

			// Select all text on focus via click if nothing already selected.
			// Since mouse-up will clear the selection need to defer selection until after mouse-up.
			// Don't do anything on focus by tabbing into the widgetm since there's no associated mouse-up event.
			if(this.selectOnClick && by == "mouse"){
				this._selectOnClickHandle = this.connect(this.domNode, "onmouseup", function(){
					// Only select all text on first click; otherwise users would have no way to clear
					// the selection.
					this.disconnect(this._selectOnClickHandle);

					// Check if the user selected some text manually (mouse-down, mouse-move, mouse-up)
					// and if not, then select all the text
					var textIsNotSelected;
					if(dojo.isIE){
						var range = dojo.doc.selection.createRange();
						var parent = range.parentElement();
						textIsNotSelected = parent == this.textbox && range.text.length == 0;
					}else{
						textIsNotSelected = this.textbox.selectionStart == this.textbox.selectionEnd;
					}
					if(textIsNotSelected){
						dijit.selectInputText(this.textbox);
					}
				});
			}

			this._refreshState();
			this.inherited(arguments);
		},

		reset: function(){
			// Overrides dijit._FormWidget.reset().
			// Additionally resets the displayed textbox value to ''
			this.textbox.value = '';
			this.inherited(arguments);
		}
	}
);

dijit.selectInputText = function(/*DomNode*/element, /*Number?*/ start, /*Number?*/ stop){
	// summary:
	//		Select text in the input element argument, from start (default 0), to stop (default end).

	// TODO: use functions in _editor/selection.js?
	var _window = dojo.global;
	var _document = dojo.doc;
	element = dojo.byId(element);
	if(isNaN(start)){ start = 0; }
	if(isNaN(stop)){ stop = element.value ? element.value.length : 0; }
	dijit.focus(element);
	if(_document["selection"] && dojo.body()["createTextRange"]){ // IE
		if(element.createTextRange){
			var range = element.createTextRange();
			with(range){
				collapse(true);
				moveStart("character", -99999); // move to 0
				moveStart("character", start); // delta from 0 is the correct position
				moveEnd("character", stop-start);
				select();
			}
		}
	}else if(_window["getSelection"]){
		if(element.setSelectionRange){
			element.setSelectionRange(start, stop);
		}
	}
};

}

if(!dojo._hasResource["dijit.Tooltip"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.Tooltip"] = true;
dojo.provide("dijit.Tooltip");




dojo.declare(
	"dijit._MasterTooltip",
	[dijit._Widget, dijit._Templated],
	{
		// summary:
		//		Internal widget that holds the actual tooltip markup,
		//		which occurs once per page.
		//		Called by Tooltip widgets which are just containers to hold
		//		the markup
		// tags:
		//		protected

		// duration: Integer
		//		Milliseconds to fade in/fade out
		duration: dijit.defaultDuration,

		templateString: dojo.cache("dijit", "templates/Tooltip.html", "<div class=\"dijitTooltip dijitTooltipLeft\" id=\"dojoTooltip\">\n\t<div class=\"dijitTooltipContainer dijitTooltipContents\" dojoAttachPoint=\"containerNode\" waiRole='alert'></div>\n\t<div class=\"dijitTooltipConnector\"></div>\n</div>\n"),

		postCreate: function(){
			dojo.body().appendChild(this.domNode);

			this.bgIframe = new dijit.BackgroundIframe(this.domNode);

			// Setup fade-in and fade-out functions.
			this.fadeIn = dojo.fadeIn({ node: this.domNode, duration: this.duration, onEnd: dojo.hitch(this, "_onShow") });
			this.fadeOut = dojo.fadeOut({ node: this.domNode, duration: this.duration, onEnd: dojo.hitch(this, "_onHide") });

		},

		show: function(/*String*/ innerHTML, /*DomNode*/ aroundNode, /*String[]?*/ position){
			// summary:
			//		Display tooltip w/specified contents to right of specified node
			//		(To left if there's no space on the right, or if LTR==right)

			if(this.aroundNode && this.aroundNode === aroundNode){
				return;
			}

			if(this.fadeOut.status() == "playing"){
				// previous tooltip is being hidden; wait until the hide completes then show new one
				this._onDeck=arguments;
				return;
			}
			this.containerNode.innerHTML=innerHTML;

			// Firefox bug. when innerHTML changes to be shorter than previous
			// one, the node size will not be updated until it moves.
			this.domNode.style.top = (this.domNode.offsetTop + 1) + "px";

			var pos = dijit.placeOnScreenAroundElement(this.domNode, aroundNode, dijit.getPopupAroundAlignment((position && position.length) ? position : dijit.Tooltip.defaultPosition, this.isLeftToRight()), dojo.hitch(this, "orient"));

			// show it
			dojo.style(this.domNode, "opacity", 0);
			this.fadeIn.play();
			this.isShowingNow = true;
			this.aroundNode = aroundNode;
		},

		orient: function(/* DomNode */ node, /* String */ aroundCorner, /* String */ tooltipCorner){
			// summary:
			//		Private function to set CSS for tooltip node based on which position it's in.
			//		This is called by the dijit popup code.
			// tags:
			//		protected

			node.className = "dijitTooltip " +
				{
					"BL-TL": "dijitTooltipBelow dijitTooltipABLeft",
					"TL-BL": "dijitTooltipAbove dijitTooltipABLeft",
					"BR-TR": "dijitTooltipBelow dijitTooltipABRight",
					"TR-BR": "dijitTooltipAbove dijitTooltipABRight",
					"BR-BL": "dijitTooltipRight",
					"BL-BR": "dijitTooltipLeft"
				}[aroundCorner + "-" + tooltipCorner];
		},

		_onShow: function(){
			// summary:
			//		Called at end of fade-in operation
			// tags:
			//		protected
			if(dojo.isIE){
				// the arrow won't show up on a node w/an opacity filter
				this.domNode.style.filter="";
			}
		},

		hide: function(aroundNode){
			// summary:
			//		Hide the tooltip
			if(this._onDeck && this._onDeck[1] == aroundNode){
				// this hide request is for a show() that hasn't even started yet;
				// just cancel the pending show()
				this._onDeck=null;
			}else if(this.aroundNode === aroundNode){
				// this hide request is for the currently displayed tooltip
				this.fadeIn.stop();
				this.isShowingNow = false;
				this.aroundNode = null;
				this.fadeOut.play();
			}else{
				// just ignore the call, it's for a tooltip that has already been erased
			}
		},

		_onHide: function(){
			// summary:
			//		Called at end of fade-out operation
			// tags:
			//		protected

			this.domNode.style.cssText="";	// to position offscreen again
			if(this._onDeck){
				// a show request has been queued up; do it now
				this.show.apply(this, this._onDeck);
				this._onDeck=null;
			}
		}

	}
);

dijit.showTooltip = function(/*String*/ innerHTML, /*DomNode*/ aroundNode, /*String[]?*/ position){
	// summary:
	//		Display tooltip w/specified contents in specified position.
	//		See description of dijit.Tooltip.defaultPosition for details on position parameter.
	//		If position is not specified then dijit.Tooltip.defaultPosition is used.
	if(!dijit._masterTT){ dijit._masterTT = new dijit._MasterTooltip(); }
	return dijit._masterTT.show(innerHTML, aroundNode, position);
};

dijit.hideTooltip = function(aroundNode){
	// summary:
	//		Hide the tooltip
	if(!dijit._masterTT){ dijit._masterTT = new dijit._MasterTooltip(); }
	return dijit._masterTT.hide(aroundNode);
};

dojo.declare(
	"dijit.Tooltip",
	dijit._Widget,
	{
		// summary:
		//		Pops up a tooltip (a help message) when you hover over a node.

		// label: String
		//		Text to display in the tooltip.
		//		Specified as innerHTML when creating the widget from markup.
		label: "",

		// showDelay: Integer
		//		Number of milliseconds to wait after hovering over/focusing on the object, before
		//		the tooltip is displayed.
		showDelay: 400,

		// connectId: [const] String[]
		//		Id's of domNodes to attach the tooltip to.
		//		When user hovers over any of the specified dom nodes, the tooltip will appear.
		//
		//		Note: Currently connectId can only be specified on initialization, it cannot
		//		be changed via attr('connectId', ...)
		//
		//		Note: in 2.0 this will be renamed to connectIds for less confusion.
		connectId: [],

		// position: String[]
		//		See description of `dijit.Tooltip.defaultPosition` for details on position parameter.
		position: [],

		constructor: function(){
			// Map id's of nodes I'm connected to to a list of the this.connect() handles
			this._nodeConnectionsById = {};
		},

		_setConnectIdAttr: function(newIds){
			for(var oldId in this._nodeConnectionsById){
				this.removeTarget(oldId);
			}
			dojo.forEach(dojo.isArrayLike(newIds) ? newIds : [newIds], this.addTarget, this);
		},

		_getConnectIdAttr: function(){
			var ary = [];
			for(var id in this._nodeConnectionsById){
				ary.push(id);
			}
			return ary;
		},

		addTarget: function(/*DOMNODE || String*/ id){
			// summary:
			//		Attach tooltip to specified node, if it's not already connected
			var node = dojo.byId(id);
			if(!node){ return; }
			if(node.id in this._nodeConnectionsById){ return; }//Already connected

			this._nodeConnectionsById[node.id] = [
				this.connect(node, "onmouseenter", "_onTargetMouseEnter"),
				this.connect(node, "onmouseleave", "_onTargetMouseLeave"),
				this.connect(node, "onfocus", "_onTargetFocus"),
				this.connect(node, "onblur", "_onTargetBlur")
			];
			if(dojo.isIE && !node.style.zoom){//preserve zoom
				// BiDi workaround
				node.style.zoom = 1;
			}
		},

		removeTarget: function(/*DOMNODE || String*/ node){
			// summary:
			//		Detach tooltip from specified node

			// map from DOMNode back to plain id string
			var id = node.id || node;

			if(id in this._nodeConnectionsById){
				dojo.forEach(this._nodeConnectionsById[id], this.disconnect, this);
				delete this._nodeConnectionsById[id];
			}
		},

		postCreate: function(){
			dojo.addClass(this.domNode,"dijitTooltipData");
		},

		startup: function(){
			this.inherited(arguments);

			// If this tooltip was created in a template, or for some other reason the specified connectId[s]
			// didn't exist during the widget's initialization, then connect now.
			var ids = this.connectId;
			dojo.forEach(dojo.isArrayLike(ids) ? ids : [ids], this.addTarget, this);
		},

		_onTargetMouseEnter: function(/*Event*/ e){
			// summary:
			//		Handler for mouseenter event on the target node
			// tags:
			//		private
			this._onHover(e);
		},

		_onTargetMouseLeave: function(/*Event*/ e){
			// summary:
			//		Handler for mouseleave event on the target node
			// tags:
			//		private
			this._onUnHover(e);
		},

		_onTargetFocus: function(/*Event*/ e){
			// summary:
			//		Handler for focus event on the target node
			// tags:
			//		private

			this._focus = true;
			this._onHover(e);
		},

		_onTargetBlur: function(/*Event*/ e){
			// summary:
			//		Handler for blur event on the target node
			// tags:
			//		private

			this._focus = false;
			this._onUnHover(e);
		},

		_onHover: function(/*Event*/ e){
			// summary:
			//		Despite the name of this method, it actually handles both hover and focus
			//		events on the target node, setting a timer to show the tooltip.
			// tags:
			//		private
			if(!this._showTimer){
				var target = e.target;
				this._showTimer = setTimeout(dojo.hitch(this, function(){this.open(target)}), this.showDelay);
			}
		},

		_onUnHover: function(/*Event*/ e){
			// summary:
			//		Despite the name of this method, it actually handles both mouseleave and blur
			//		events on the target node, hiding the tooltip.
			// tags:
			//		private

			// keep a tooltip open if the associated element still has focus (even though the
			// mouse moved away)
			if(this._focus){ return; }

			if(this._showTimer){
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
			this.close();
		},

		open: function(/*DomNode*/ target){
 			// summary:
			//		Display the tooltip; usually not called directly.
			// tags:
			//		private

			if(this._showTimer){
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
			dijit.showTooltip(this.label || this.domNode.innerHTML, target, this.position);

			this._connectNode = target;
			this.onShow(target, this.position);
		},

		close: function(){
			// summary:
			//		Hide the tooltip or cancel timer for show of tooltip
			// tags:
			//		private

			if(this._connectNode){
				// if tooltip is currently shown
				dijit.hideTooltip(this._connectNode);
				delete this._connectNode;
				this.onHide();
			}
			if(this._showTimer){
				// if tooltip is scheduled to be shown (after a brief delay)
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
		},

		onShow: function(target, position){
			// summary:
			//		Called when the tooltip is shown
			// tags:
			//		callback
		},

		onHide: function(){
			// summary:
			//		Called when the tooltip is hidden
			// tags:
			//		callback
		},

		uninitialize: function(){
			this.close();
			this.inherited(arguments);
		}
	}
);

// dijit.Tooltip.defaultPosition: String[]
//		This variable controls the position of tooltips, if the position is not specified to
//		the Tooltip widget or *TextBox widget itself.  It's an array of strings with the following values:
//
//			* before: places tooltip to the left of the target node/widget, or to the right in
//			  the case of RTL scripts like Hebrew and Arabic
//			* after: places tooltip to the right of the target node/widget, or to the left in
//			  the case of RTL scripts like Hebrew and Arabic
//			* above: tooltip goes above target node
//			* below: tooltip goes below target node
//
//		The list is positions is tried, in order, until a position is found where the tooltip fits
//		within the viewport.
//
//		Be careful setting this parameter.  A value of "above" may work fine until the user scrolls
//		the screen so that there's no room above the target node.   Nodes with drop downs, like
//		DropDownButton or FilteringSelect, are especially problematic, in that you need to be sure
//		that the drop down and tooltip don't overlap, even when the viewport is scrolled so that there
//		is only room below (or above) the target node, but not both.
dijit.Tooltip.defaultPosition = ["after", "before"];

}

if(!dojo._hasResource["dijit.form.ValidationTextBox"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.form.ValidationTextBox"] = true;
dojo.provide("dijit.form.ValidationTextBox");








/*=====
	dijit.form.ValidationTextBox.__Constraints = function(){
		// locale: String
		//		locale used for validation, picks up value from this widget's lang attribute
		// _flags_: anything
		//		various flags passed to regExpGen function
		this.locale = "";
		this._flags_ = "";
	}
=====*/

dojo.declare(
	"dijit.form.ValidationTextBox",
	dijit.form.TextBox,
	{
		// summary:
		//		Base class for textbox widgets with the ability to validate content of various types and provide user feedback.
		// tags:
		//		protected

		templateString: dojo.cache("dijit.form", "templates/ValidationTextBox.html", "<div class=\"dijit dijitReset dijitInlineTable dijitLeft\"\n\tid=\"widget_${id}\"\n\tdojoAttachEvent=\"onmouseenter:_onMouse,onmouseleave:_onMouse,onmousedown:_onMouse\" waiRole=\"presentation\"\n\t><div style=\"overflow:hidden;\"\n\t\t><div class=\"dijitReset dijitValidationIcon\"><br></div\n\t\t><div class=\"dijitReset dijitValidationIconText\">&Chi;</div\n\t\t><div class=\"dijitReset dijitInputField\"\n\t\t\t><input class=\"dijitReset\" dojoAttachPoint='textbox,focusNode' autocomplete=\"off\"\n\t\t\t${nameAttrSetting} type='${type}'\n\t\t/></div\n\t></div\n></div>\n"),
		baseClass: "dijitTextBox",

		// required: Boolean
		//		User is required to enter data into this field.
		required: false,

		// promptMessage: String
		//		If defined, display this hint string immediately on focus to the textbox, if empty.
		//		Think of this like a tooltip that tells the user what to do, not an error message
		//		that tells the user what they've done wrong.
		//
		//		Message disappears when user starts typing.
		promptMessage: "",

		// invalidMessage: String
		// 		The message to display if value is invalid.
		invalidMessage: "$_unset_$", // read from the message file if not overridden

		// constraints: dijit.form.ValidationTextBox.__Constraints
		//		user-defined object needed to pass parameters to the validator functions
		constraints: {},

		// regExp: [extension protected] String
		//		regular expression string used to validate the input
		//		Do not specify both regExp and regExpGen
		regExp: ".*",

		regExpGen: function(/*dijit.form.ValidationTextBox.__Constraints*/constraints){
			// summary:
			//		Overridable function used to generate regExp when dependent on constraints.
			//		Do not specify both regExp and regExpGen.
			// tags:
			//		extension protected
			return this.regExp; // String
		},

		// state: [readonly] String
		//		Shows current state (ie, validation result) of input (Normal, Warning, or Error)
		state: "",

		// tooltipPosition: String[]
		//		See description of `dijit.Tooltip.defaultPosition` for details on this parameter.
		tooltipPosition: [],

		_setValueAttr: function(){
			// summary:
			//		Hook so attr('value', ...) works.
			this.inherited(arguments);
			this.validate(this._focused);
		},

		validator: function(/*anything*/value, /*dijit.form.ValidationTextBox.__Constraints*/constraints){
			// summary:
			//		Overridable function used to validate the text input against the regular expression.
			// tags:
			//		protected
			return (new RegExp("^(?:" + this.regExpGen(constraints) + ")"+(this.required?"":"?")+"$")).test(value) &&
				(!this.required || !this._isEmpty(value)) &&
				(this._isEmpty(value) || this.parse(value, constraints) !== undefined); // Boolean
		},

		_isValidSubset: function(){
			// summary:
			//		Returns true if the value is either already valid or could be made valid by appending characters.
			//		This is used for validation while the user [may be] still typing.
			return this.textbox.value.search(this._partialre) == 0;
		},

		isValid: function(/*Boolean*/ isFocused){
			// summary:
			//		Tests if value is valid.
			//		Can override with your own routine in a subclass.
			// tags:
			//		protected
			return this.validator(this.textbox.value, this.constraints);
		},

		_isEmpty: function(value){
			// summary:
			//		Checks for whitespace
			return /^\s*$/.test(value); // Boolean
		},

		getErrorMessage: function(/*Boolean*/ isFocused){
			// summary:
			//		Return an error message to show if appropriate
			// tags:
			//		protected
			return this.invalidMessage; // String
		},

		getPromptMessage: function(/*Boolean*/ isFocused){
			// summary:
			//		Return a hint message to show when widget is first focused
			// tags:
			//		protected
			return this.promptMessage; // String
		},

		_maskValidSubsetError: true,
		validate: function(/*Boolean*/ isFocused){
			// summary:
			//		Called by oninit, onblur, and onkeypress.
			// description:
			//		Show missing or invalid messages if appropriate, and highlight textbox field.
			// tags:
			//		protected
			var message = "";
			var isValid = this.disabled || this.isValid(isFocused);
			if(isValid){ this._maskValidSubsetError = true; }
			var isValidSubset = !isValid && isFocused && this._isValidSubset();
			var isEmpty = this._isEmpty(this.textbox.value);
			if(isEmpty){ this._maskValidSubsetError = true; }
			this.state = (isValid || (!this._hasBeenBlurred && isEmpty) || isValidSubset) ? "" : "Error";
			if(this.state == "Error"){ this._maskValidSubsetError = false; }
			this._setStateClass();
			dijit.setWaiState(this.focusNode, "invalid", isValid ? "false" : "true");
			if(isFocused){
				if(isEmpty){
					message = this.getPromptMessage(true);
				}
				if(!message && (this.state == "Error" || (isValidSubset && !this._maskValidSubsetError))){
					message = this.getErrorMessage(true);
				}
			}
			this.displayMessage(message);
			return isValid;
		},

		// _message: String
		//		Currently displayed message
		_message: "",

		displayMessage: function(/*String*/ message){
			// summary:
			//		Overridable method to display validation errors/hints.
			//		By default uses a tooltip.
			// tags:
			//		extension
			if(this._message == message){ return; }
			this._message = message;
			dijit.hideTooltip(this.domNode);
			if(message){
				dijit.showTooltip(message, this.domNode, this.tooltipPosition);
			}
		},

		_refreshState: function(){
			// Overrides TextBox._refreshState()
			this.validate(this._focused);
			this.inherited(arguments);
		},

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		constructor: function(){
			this.constraints = {};
		},

		postMixInProperties: function(){
			this.inherited(arguments);
			this.constraints.locale = this.lang;
			this.messages = dojo.i18n.getLocalization("dijit.form", "validate", this.lang);
			if(this.invalidMessage == "$_unset_$"){ this.invalidMessage = this.messages.invalidMessage; }
			var p = this.regExpGen(this.constraints);
			this.regExp = p;
			var partialre = "";
			// parse the regexp and produce a new regexp that matches valid subsets
			// if the regexp is .* then there's no use in matching subsets since everything is valid
			if(p != ".*"){ this.regExp.replace(/\\.|\[\]|\[.*?[^\\]{1}\]|\{.*?\}|\(\?[=:!]|./g,
				function (re){
					switch(re.charAt(0)){
						case '{':
						case '+':
						case '?':
						case '*':
						case '^':
						case '$':
						case '|':
						case '(':
							partialre += re;
							break;
						case ")":
							partialre += "|$)";
							break;
						 default:
							partialre += "(?:"+re+"|$)";
							break;
					}
				}
			);}
			try{ // this is needed for now since the above regexp parsing needs more test verification
				"".search(partialre);
			}catch(e){ // should never be here unless the original RE is bad or the parsing is bad
				partialre = this.regExp;
				console.warn('RegExp error in ' + this.declaredClass + ': ' + this.regExp);
			} // should never be here unless the original RE is bad or the parsing is bad
			this._partialre = "^(?:" + partialre + ")$";
		},

		_setDisabledAttr: function(/*Boolean*/ value){
			this.inherited(arguments);	// call FormValueWidget._setDisabledAttr()
			this._refreshState();
		},

		_setRequiredAttr: function(/*Boolean*/ value){
			this.required = value;
			dijit.setWaiState(this.focusNode,"required", value);
			this._refreshState();
		},

		postCreate: function(){
			if(dojo.isIE){ // IE INPUT tag fontFamily has to be set directly using STYLE
				var s = dojo.getComputedStyle(this.focusNode);
				if(s){
					var ff = s.fontFamily;
					if(ff){
						this.focusNode.style.fontFamily = ff;
					}
				}
			}
			this.inherited(arguments);
		},

		reset:function(){
			// Overrides dijit.form.TextBox.reset() by also
			// hiding errors about partial matches
			this._maskValidSubsetError = true;
			this.inherited(arguments);
		},

		_onBlur: function(){
			this.displayMessage('');
			this.inherited(arguments);
		}
	}
);

dojo.declare(
	"dijit.form.MappedTextBox",
	dijit.form.ValidationTextBox,
	{
		// summary:
		//		A dijit.form.ValidationTextBox subclass which provides a base class for widgets that have
		//		a visible formatted display value, and a serializable
		//		value in a hidden input field which is actually sent to the server.
		// description:
		//		The visible display may
		//		be locale-dependent and interactive.  The value sent to the server is stored in a hidden
		//		input field which uses the `name` attribute declared by the original widget.  That value sent
		//		to the server is defined by the dijit.form.MappedTextBox.serialize method and is typically
		//		locale-neutral.
		// tags:
		//		protected

		postMixInProperties: function(){
			this.inherited(arguments);

			// we want the name attribute to go to the hidden <input>, not the displayed <input>,
			// so override _FormWidget.postMixInProperties() setting of nameAttrSetting
			this.nameAttrSetting = "";
		},

		serialize: function(/*anything*/val, /*Object?*/options){
			// summary:
			//		Overridable function used to convert the attr('value') result to a canonical
			//		(non-localized) string.  For example, will print dates in ISO format, and
			//		numbers the same way as they are represented in javascript.
			// tags:
			//		protected extension
			return val.toString ? val.toString() : ""; // String
		},

		toString: function(){
			// summary:
			//		Returns widget as a printable string using the widget's value
			// tags:
			//		protected
			var val = this.filter(this.attr('value')); // call filter in case value is nonstring and filter has been customized
			return val != null ? (typeof val == "string" ? val : this.serialize(val, this.constraints)) : ""; // String
		},

		validate: function(){
			// Overrides `dijit.form.TextBox.validate`
			this.valueNode.value = this.toString();
			return this.inherited(arguments);
		},

		buildRendering: function(){
			// Overrides `dijit._Templated.buildRendering`

			this.inherited(arguments);

			// Create a hidden <input> node with the serialized value used for submit
			// (as opposed to the displayed value).
			// Passing in name as markup rather than calling dojo.create() with an attrs argument
			// to make dojo.query(input[name=...]) work on IE. (see #8660)
			this.valueNode = dojo.place("<input type='hidden'" + (this.name ? " name='" + this.name + "'" : "") + ">", this.textbox, "after");
		},

		reset:function(){
			// Overrides `dijit.form.ValidationTextBox.reset` to
			// reset the hidden textbox value to ''
			this.valueNode.value = '';
			this.inherited(arguments);
		}
	}
);

/*=====
	dijit.form.RangeBoundTextBox.__Constraints = function(){
		// min: Number
		//		Minimum signed value.  Default is -Infinity
		// max: Number
		//		Maximum signed value.  Default is +Infinity
		this.min = min;
		this.max = max;
	}
=====*/

dojo.declare(
	"dijit.form.RangeBoundTextBox",
	dijit.form.MappedTextBox,
	{
		// summary:
		//		Base class for textbox form widgets which defines a range of valid values.

		// rangeMessage: String
		//		The message to display if value is out-of-range
		rangeMessage: "",

		/*=====
		// constraints: dijit.form.RangeBoundTextBox.__Constraints
		constraints: {},
		======*/

		rangeCheck: function(/*Number*/ primitive, /*dijit.form.RangeBoundTextBox.__Constraints*/ constraints){
			// summary:
			//		Overridable function used to validate the range of the numeric input value.
			// tags:
			//		protected
			return	("min" in constraints? (this.compare(primitive,constraints.min) >= 0) : true) &&
				("max" in constraints? (this.compare(primitive,constraints.max) <= 0) : true); // Boolean
		},

		isInRange: function(/*Boolean*/ isFocused){
			// summary:
			//		Tests if the value is in the min/max range specified in constraints
			// tags:
			//		protected
			return this.rangeCheck(this.attr('value'), this.constraints);
		},

		_isDefinitelyOutOfRange: function(){
			// summary:
			//		Returns true if the value is out of range and will remain
			//		out of range even if the user types more characters
			var val = this.attr('value');
			var isTooLittle = false;
			var isTooMuch = false;
			if("min" in this.constraints){
				var min = this.constraints.min;
				min = this.compare(val, ((typeof min == "number") && min >= 0 && val !=0) ? 0 : min);
				isTooLittle = (typeof min == "number") && min < 0;
			}
			if("max" in this.constraints){
				var max = this.constraints.max;
				max = this.compare(val, ((typeof max != "number") || max > 0) ? max : 0);
				isTooMuch = (typeof max == "number") && max > 0;
			}
			return isTooLittle || isTooMuch;
		},

		_isValidSubset: function(){
			// summary:
			//		Overrides `dijit.form.ValidationTextBox._isValidSubset`.
			//		Returns true if the input is syntactically valid, and either within
			//		range or could be made in range by more typing.
			return this.inherited(arguments) && !this._isDefinitelyOutOfRange();
		},

		isValid: function(/*Boolean*/ isFocused){
			// Overrides dijit.form.ValidationTextBox.isValid to check that the value is also in range.
			return this.inherited(arguments) &&
				((this._isEmpty(this.textbox.value) && !this.required) || this.isInRange(isFocused)); // Boolean
		},

		getErrorMessage: function(/*Boolean*/ isFocused){
			// Overrides dijit.form.ValidationTextBox.getErrorMessage to print "out of range" message if appropriate
			var v = this.attr('value');
			if(v !== null && v !== '' && v !== undefined && !this.isInRange(isFocused)){ // don't check isInRange w/o a real value
				return this.rangeMessage; // String
			}
			return this.inherited(arguments);
		},

		postMixInProperties: function(){
			this.inherited(arguments);
			if(!this.rangeMessage){
				this.messages = dojo.i18n.getLocalization("dijit.form", "validate", this.lang);
				this.rangeMessage = this.messages.rangeMessage;
			}
		},

		postCreate: function(){
			this.inherited(arguments);
			if(this.constraints.min !== undefined){
				dijit.setWaiState(this.focusNode, "valuemin", this.constraints.min);
			}
			if(this.constraints.max !== undefined){
				dijit.setWaiState(this.focusNode, "valuemax", this.constraints.max);
			}
		},

		_setValueAttr: function(/*Number*/ value, /*Boolean?*/ priorityChange){
			// summary:
			//		Hook so attr('value', ...) works.

			dijit.setWaiState(this.focusNode, "valuenow", value);
			this.inherited(arguments);
		}
	}
);

}

if(!dojo._hasResource["dijit._Container"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._Container"] = true;
dojo.provide("dijit._Container");

dojo.declare("dijit._Container",
	null,
	{
		// summary:
		//		Mixin for widgets that contain a set of widget children.
		// description:
		//		Use this mixin for widgets that needs to know about and
		//		keep track of their widget children. Suitable for widgets like BorderContainer
		//		and TabContainer which contain (only) a set of child widgets.
		//
		//		It's not suitable for widgets like ContentPane
		//		which contains mixed HTML (plain DOM nodes in addition to widgets),
		//		and where contained widgets are not necessarily directly below
		//		this.containerNode.   In that case calls like addChild(node, position)
		//		wouldn't make sense.

		// isContainer: [protected] Boolean
		//		Indicates that this widget acts as a "parent" to the descendant widgets.
		//		When the parent is started it will call startup() on the child widgets.
		//		See also `isLayoutContainer`.
		isContainer: true,

		buildRendering: function(){
			this.inherited(arguments);
			if(!this.containerNode){
				// all widgets with descendants must set containerNode
	 				this.containerNode = this.domNode;
			}
		},

		addChild: function(/*dijit._Widget*/ widget, /*int?*/ insertIndex){
			// summary:
			//		Makes the given widget a child of this widget.
			// description:
			//		Inserts specified child widget's dom node as a child of this widget's
			//		container node, and possibly does other processing (such as layout).

			var refNode = this.containerNode;
			if(insertIndex && typeof insertIndex == "number"){
				var children = this.getChildren();
				if(children && children.length >= insertIndex){
					refNode = children[insertIndex-1].domNode;
					insertIndex = "after";
				}
			}
			dojo.place(widget.domNode, refNode, insertIndex);

			// If I've been started but the child widget hasn't been started,
			// start it now.  Make sure to do this after widget has been
			// inserted into the DOM tree, so it can see that it's being controlled by me,
			// so it doesn't try to size itself.
			if(this._started && !widget._started){
				widget.startup();
			}
		},

		removeChild: function(/*Widget or int*/ widget){
			// summary:
			//		Removes the passed widget instance from this widget but does
			//		not destroy it.  You can also pass in an integer indicating
			//		the index within the container to remove

			if(typeof widget == "number" && widget > 0){
				widget = this.getChildren()[widget];
			}

			if(widget && widget.domNode){
				var node = widget.domNode;
				node.parentNode.removeChild(node); // detach but don't destroy
			}
		},

		getChildren: function(){
			// summary:
			//		Returns array of children widgets.
			// description:
			//		Returns the widgets that are directly under this.containerNode.
			return dojo.query("> [widgetId]", this.containerNode).map(dijit.byNode); // Widget[]
		},

		hasChildren: function(){
			// summary:
			//		Returns true if widget has children, i.e. if this.containerNode contains something.
			return dojo.query("> [widgetId]", this.containerNode).length > 0;	// Boolean
		},

		destroyDescendants: function(/*Boolean*/ preserveDom){
			// summary:
			//      Destroys all the widgets inside this.containerNode,
			//      but not this widget itself
			dojo.forEach(this.getChildren(), function(child){ child.destroyRecursive(preserveDom); });
		},

		_getSiblingOfChild: function(/*dijit._Widget*/ child, /*int*/ dir){
			// summary:
			//		Get the next or previous widget sibling of child
			// dir:
			//		if 1, get the next sibling
			//		if -1, get the previous sibling
			// tags:
			//      private
			var node = child.domNode,
				which = (dir>0 ? "nextSibling" : "previousSibling");
			do{
				node = node[which];
			}while(node && (node.nodeType != 1 || !dijit.byNode(node)));
			return node && dijit.byNode(node);	// dijit._Widget
		},

		getIndexOfChild: function(/*dijit._Widget*/ child){
			// summary:
			//		Gets the index of the child in this container or -1 if not found
			return dojo.indexOf(this.getChildren(), child);	// int
		},

		startup: function(){
			// summary:
			//		Called after all the widgets have been instantiated and their
			//		dom nodes have been inserted somewhere under dojo.doc.body.
			//
			//		Widgets should override this method to do any initialization
			//		dependent on other widgets existing, and then call
			//		this superclass method to finish things off.
			//
			//		startup() in subclasses shouldn't do anything
			//		size related because the size of the widget hasn't been set yet.

			if(this._started){ return; }

			// Startup all children of this widget
			dojo.forEach(this.getChildren(), function(child){ child.startup(); });

			this.inherited(arguments);
		}
	}
);

}

if(!dojo._hasResource["dijit._HasDropDown"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._HasDropDown"] = true;
dojo.provide("dijit._HasDropDown");




dojo.declare("dijit._HasDropDown",
	null,
	{
		// summary:
		//		Mixin for widgets that need drop down ability.

		// _buttonNode: [protected] DomNode
		//		The button/icon/node to click to display the drop down.
		//		Can be set via a dojoAttachPoint assignment.
		//		If missing, then either focusNode or domNode (if focusNode is also missing) will be used.
		_buttonNode: null,

		// _arrowWrapperNode: [protected] DomNode
		//		Will set CSS class dijitUpArrow, dijitDownArrow, dijitRightArrow etc. on this node depending
		//		on where the drop down is set to be positioned.
		//		Can be set via a dojoAttachPoint assignment.
		//		If missing, then _buttonNode will be used.
		_arrowWrapperNode: null,

		// _popupStateNode: [protected] DomNode
		//		The node to set the popupActive class on.
		//		Can be set via a dojoAttachPoint assignment.
		//		If missing, then focusNode or _buttonNode (if focusNode is missing) will be used.
		_popupStateNode: null,

		// _aroundNode: [protected] DomNode
		//		The node to display the popup around.
		//		Can be set via a dojoAttachPoint assignment.
		//		If missing, then domNode will be used.
		_aroundNode: null,

		// dropDown: [protected] Widget
		//		The widget to display as a popup.  This widget *must* be
		//		defined before the startup function is called.
		dropDown: null,

		// autoWidth: [protected] Boolean
		//		Set to true to make the drop down at least as wide as this
		//		widget.  Set to false if the drop down should just be its
		//		default width
		autoWidth: true,

		// forceWidth: [protected] Boolean
		//		Set to true to make the drop down exactly as wide as this
		//		widget.  Overrides autoWidth.
		forceWidth: false,

		// maxHeight: [protected] Integer
		//		The max height for our dropdown.  Set to 0 for no max height.
		//		any dropdown taller than this will have scrollbars
		maxHeight: 0,

		// dropDownPosition: [const] String[]
		//		This variable controls the position of the drop down.
		//		It's an array of strings with the following values:
		//
		//			* before: places drop down to the left of the target node/widget, or to the right in
		//			  the case of RTL scripts like Hebrew and Arabic
		//			* after: places drop down to the right of the target node/widget, or to the left in
		//			  the case of RTL scripts like Hebrew and Arabic
		//			* above: drop down goes above target node
		//			* below: drop down goes below target node
		//
		//		The list is positions is tried, in order, until a position is found where the drop down fits
		//		within the viewport.
		//
		dropDownPosition: ["below","above"],

		// _stopClickEvents: Boolean
		//		When set to false, the click events will not be stopped, in
		//		case you want to use them in your subwidget
		_stopClickEvents: true,

		_onDropDownMouse: function(/*Event*/ e){
			// summary:
			//		Callback when the user mouse clicks on the arrow icon, or presses the down
			//		arrow key, to open the drop down.

			// We handle mouse events using onmousedown in order to allow for selecting via
			// a mouseDown --> mouseMove --> mouseUp.  So, our click is already handled, unless
			// we are executed via keypress - in which case, this._seenKeydown
			// will be set to true.
			if(e.type == "click" && !this._seenKeydown){ return; }
			this._seenKeydown = false;

			// If we are a mouse event, set up the mouseup handler.  See _onDropDownMouse() for
			// details on this handler.
			if(e.type == "mousedown"){
				this._docHandler = this.connect(dojo.doc, "onmouseup", "_onDropDownMouseup");
			}
			if(this.disabled || this.readOnly){ return; }
			if(this._stopClickEvents){
				dojo.stopEvent(e);
			}
			this.toggleDropDown();

			// If we are a click, then we'll pretend we did a mouse up
			if(e.type == "click" || e.type == "keypress"){
				this._onDropDownMouseup();
			}
		},

		_onDropDownMouseup: function(/*Event?*/ e){
			// summary:
			//		Callback when the user lifts their mouse after mouse down on the arrow icon.
			//		If the drop is a simple menu and the mouse is over the menu, we execute it, otherwise, we focus our
			//		dropDown node.  If the event is missing, then we are not
			//		a mouseup event.
			//
			//		This is useful for the common mouse movement pattern
			//		with native browser <select> nodes:
			//			1. mouse down on the select node (probably on the arrow)
			//			2. move mouse to a menu item while holding down the mouse button
			//			3. mouse up.  this selects the menu item as though the user had clicked it.

			if(e && this._docHandler){
				this.disconnect(this._docHandler);
			}
			var dropDown = this.dropDown, overMenu = false;

			if(e && this._opened){
				// This code deals with the corner-case when the drop down covers the original widget,
				// because it's so large.  In that case mouse-up shouldn't select a value from the menu.
				// Find out if our target is somewhere in our dropdown widget,
				// but not over our _buttonNode (the clickable node)
				var c = dojo.position(this._buttonNode, true);
				if(!(e.pageX >= c.x && e.pageX <= c.x + c.w) ||
					!(e.pageY >= c.y && e.pageY <= c.y + c.h)){
					var t = e.target;
					while(t && !overMenu){
						if(dojo.hasClass(t, "dijitPopup")){
							overMenu = true;
						}else{
							t = t.parentNode;
						}
					}
					if(overMenu){
						t = e.target;
						if(dropDown.onItemClick){
							var menuItem;
							while(t && !(menuItem = dijit.byNode(t))){
								t = t.parentNode;
							}
							if(menuItem && menuItem.onClick && menuItem.getParent){
								menuItem.getParent().onItemClick(menuItem, e);
							}
						}
						return;
					}
				}
			}
			if(this._opened && dropDown.focus){
				// Focus the dropdown widget - do it on a delay so that we
				// don't steal our own focus.
				window.setTimeout(dojo.hitch(dropDown, "focus"), 1);
			}
		},

		_setupDropdown: function(){
			// summary:
			//		set up nodes and connect our mouse and keypress events
			this._buttonNode = this._buttonNode || this.focusNode || this.domNode;
			this._popupStateNode = this._popupStateNode || this.focusNode || this._buttonNode;
			this._aroundNode = this._aroundNode || this.domNode;
			this.connect(this._buttonNode, "onmousedown", "_onDropDownMouse");
			this.connect(this._buttonNode, "onclick", "_onDropDownMouse");
			this.connect(this._buttonNode, "onkeydown", "_onDropDownKeydown");
			this.connect(this._buttonNode, "onblur", "_onDropDownBlur");
			this.connect(this._buttonNode, "onkeypress", "_onKey");

			// If we have a _setStateClass function (which happens when
			// we are a form widget), then we need to connect our open/close
			// functions to it
			if(this._setStateClass){
				this.connect(this, "openDropDown", "_setStateClass");
				this.connect(this, "closeDropDown", "_setStateClass");
			}

			// Add a class to the "dijitDownArrowButton" type class to _buttonNode so theme can set direction of arrow
			// based on where drop down will normally appear
			var defaultPos = {
					"after" : this.isLeftToRight() ? "Right" : "Left",
					"before" : this.isLeftToRight() ? "Left" : "Right",
					"above" : "Up",
					"below" : "Down",
					"left" : "Left",
					"right" : "Right"
			}[this.dropDownPosition[0]] || this.dropDownPosition[0] || "Down";
			dojo.addClass(this._arrowWrapperNode || this._buttonNode, "dijit" + defaultPos + "ArrowButton");
		},

		postCreate: function(){
			this._setupDropdown();
			this.inherited(arguments);
		},

		destroyDescendants: function(){
			if(this.dropDown){
				// Destroy the drop down, unless it's already been destroyed.  This can happen because
				// the drop down is a direct child of <body> even though it's logically my child.
				if(!this.dropDown._destroyed){
					this.dropDown.destroyRecursive();
				}
				delete this.dropDown;
			}
			this.inherited(arguments);
		},

		_onDropDownKeydown: function(/*Event*/ e){
			this._seenKeydown = true;
		},

		_onKeyPress: function(/*Event*/ e){
			if(this._opened && e.charOrCode == dojo.keys.ESCAPE && !e.shiftKey && !e.ctrlKey && !e.altKey){
				this.toggleDropDown();
				dojo.stopEvent(e);
				return;
			}
			this.inherited(arguments);
		},

		_onDropDownBlur: function(/*Event*/ e){
			this._seenKeydown = false;
		},

		_onKey: function(/*Event*/ e){
			// summary:
			//		Callback when the user presses a key on menu popup node

			if(this.disabled || this.readOnly){ return; }
			var d = this.dropDown;
			if(d && this._opened && d.handleKey){
				if(d.handleKey(e) === false){ return; }
			}
			if(d && this._opened && e.keyCode == dojo.keys.ESCAPE){
				this.toggleDropDown();
				return;
			}
			if(e.keyCode == dojo.keys.DOWN_ARROW || e.keyCode == dojo.keys.ENTER || e.charOrCode == " "){
				this._onDropDownMouse(e);
			}
		},

		_onBlur: function(){
			// summary:
			//		Called magically when focus has shifted away from this widget and it's dropdown

			this.closeDropDown();
			// don't focus on button.  the user has explicitly focused on something else.
			this.inherited(arguments);
		},

		isLoaded: function(){
			// summary:
			//		Returns whether or not the dropdown is loaded.  This can
			//		be overridden in order to force a call to loadDropDown().
			// tags:
			//		protected

			return true;
		},

		loadDropDown: function(/* Function */ loadCallback){
			// summary:
			//		Loads the data for the dropdown, and at some point, calls
			//		the given callback
			// tags:
			//		protected

			loadCallback();
		},

		toggleDropDown: function(){
			// summary:
			//		Toggle the drop-down widget; if it is up, close it, if not, open it
			// tags:
			//		protected

			if(this.disabled || this.readOnly){ return; }
			this.focus();
			var dropDown = this.dropDown;
			if(!dropDown){ return; }
			if(!this._opened){
				// If we aren't loaded, load it first so there isn't a flicker
				if(!this.isLoaded()){
					this.loadDropDown(dojo.hitch(this, "openDropDown"));
					return;
				}else{
					this.openDropDown();
				}
			}else{
				this.closeDropDown();
			}
		},

		openDropDown: function(){
			// summary:
			//		Opens the dropdown for this widget - it returns the
			//		return value of dijit.popup.open
			// tags:
			//		protected

			var dropDown = this.dropDown;
			var ddNode = dropDown.domNode;
			var self = this;

			// Prepare our popup's height and honor maxHeight if it exists.

			// TODO: isn't maxHeight dependent on the return value from dijit.popup.open(),
			// ie, dependent on how much space is available (BK)

			if(!this._preparedNode){
				dijit.popup.moveOffScreen(ddNode);
				this._preparedNode = true;			
				// Check if we have explicitly set width and height on the dropdown widget dom node
				if(ddNode.style.width){
					this._explicitDDWidth = true;
				}
				if(ddNode.style.height){
					this._explicitDDHeight = true;
				}
			}
			if(this.maxHeight || this.forceWidth || this.autoWidth){
				var myStyle = {
					display: "",
					visibility: "hidden"
				};
				if(!this._explicitDDWidth){
					myStyle.width = "";
				}
				if(!this._explicitDDHeight){
					myStyle.height = "";
				}
				dojo.style(ddNode, myStyle);
				var mb = dojo.marginBox(ddNode);
				var overHeight = (this.maxHeight && mb.h > this.maxHeight);
				dojo.style(ddNode, {overflow: overHeight ? "auto" : "hidden"});
				if(this.forceWidth){
					mb.w = this.domNode.offsetWidth;
				}else if(this.autoWidth){
					mb.w = Math.max(mb.w, this.domNode.offsetWidth);
				}else{
					delete mb.w;
				}
				if(overHeight){
					mb.h = this.maxHeight;
					if("w" in mb){
						mb.w += 16;
					}
				}else{
					delete mb.h;
				}
				delete mb.t;
				delete mb.l;
				if(dojo.isFunction(dropDown.resize)){
					dropDown.resize(mb);
				}else{
					dojo.marginBox(ddNode, mb);
				}
			}
			var retVal = dijit.popup.open({
				parent: this,
				popup: dropDown,
				around: this._aroundNode,
				orient: dijit.getPopupAroundAlignment((this.dropDownPosition && this.dropDownPosition.length) ? this.dropDownPosition : ["below"],this.isLeftToRight()),
				onExecute: function(){
					self.closeDropDown(true);
				},
				onCancel: function(){
					self.closeDropDown(true);
				},
				onClose: function(){
					dojo.attr(self._popupStateNode, "popupActive", false);
					dojo.removeClass(self._popupStateNode, "dijitHasDropDownOpen");
					self._opened = false;
					self.state = "";
				}
			});
			dojo.attr(this._popupStateNode, "popupActive", "true");
			dojo.addClass(self._popupStateNode, "dijitHasDropDownOpen");
			this._opened=true;
			this.state="Opened";
			// TODO: set this.checked and call setStateClass(), to affect button look while drop down is shown
			return retVal;
		},

		closeDropDown: function(/*Boolean*/ focus){
			// summary:
			//		Closes the drop down on this widget
			// tags:
			//		protected

			if(this._opened){
				dijit.popup.close(this.dropDown);
				if(focus){ this.focus(); }
				this._opened = false;
				this.state = "";
			}
		}

	}
);

}

if(!dojo._hasResource["dijit.form.Button"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.form.Button"] = true;
dojo.provide("dijit.form.Button");





dojo.declare("dijit.form.Button",
	dijit.form._FormWidget,
	{
	// summary:
	//		Basically the same thing as a normal HTML button, but with special styling.
	// description:
	//		Buttons can display a label, an icon, or both.
	//		A label should always be specified (through innerHTML) or the label
	//		attribute.  It can be hidden via showLabel=false.
	// example:
	// |	<button dojoType="dijit.form.Button" onClick="...">Hello world</button>
	//
	// example:
	// |	var button1 = new dijit.form.Button({label: "hello world", onClick: foo});
	// |	dojo.body().appendChild(button1.domNode);

	// label: HTML String
	//		Text to display in button.
	//		If the label is hidden (showLabel=false) then and no title has
	//		been specified, then label is also set as title attribute of icon.
	label: "",

	// showLabel: Boolean
	//		Set this to true to hide the label text and display only the icon.
	//		(If showLabel=false then iconClass must be specified.)
	//		Especially useful for toolbars.
	//		If showLabel=true, the label will become the title (a.k.a. tooltip/hint) of the icon.
	//
	//		The exception case is for computers in high-contrast mode, where the label
	//		will still be displayed, since the icon doesn't appear.
	showLabel: true,

	// iconClass: String
	//		Class to apply to DOMNode in button to make it display an icon
	iconClass: "",

	// type: String
	//		Defines the type of button.  "button", "submit", or "reset".
	type: "button",

	baseClass: "dijitButton",

	templateString: dojo.cache("dijit.form", "templates/Button.html", "<span class=\"dijit dijitReset dijitLeft dijitInline\"\n\tdojoAttachEvent=\"onclick:_onButtonClick,onmouseenter:_onMouse,onmouseleave:_onMouse,onmousedown:_onMouse\"\n\t><span class=\"dijitReset dijitRight dijitInline\"\n\t\t><span class=\"dijitReset dijitInline dijitButtonNode\"\n\t\t\t><button class=\"dijitReset dijitStretch dijitButtonContents\"\n\t\t\t\tdojoAttachPoint=\"titleNode,focusNode\"\n\t\t\t\t${nameAttrSetting} type=\"${type}\" value=\"${value}\" waiRole=\"button\" waiState=\"labelledby-${id}_label\"\n\t\t\t\t><span class=\"dijitReset dijitInline\" dojoAttachPoint=\"iconNode\"\n\t\t\t\t\t><span class=\"dijitReset dijitToggleButtonIconChar\">&#10003;</span\n\t\t\t\t></span\n\t\t\t\t><span class=\"dijitReset dijitInline dijitButtonText\"\n\t\t\t\t\tid=\"${id}_label\"\n\t\t\t\t\tdojoAttachPoint=\"containerNode\"\n\t\t\t\t></span\n\t\t\t></button\n\t\t></span\n\t></span\n></span>\n"),

	attributeMap: dojo.delegate(dijit.form._FormWidget.prototype.attributeMap, {
		label: { node: "containerNode", type: "innerHTML" },
		iconClass: { node: "iconNode", type: "class" }
	}),


	_onClick: function(/*Event*/ e){
		// summary:
		//		Internal function to handle click actions
		if(this.disabled){
			return false;
		}
		this._clicked(); // widget click actions
		return this.onClick(e); // user click actions
	},

	_onButtonClick: function(/*Event*/ e){
		// summary:
		//		Handler when the user activates the button portion.
		if(this._onClick(e) === false){ // returning nothing is same as true
			e.preventDefault(); // needed for checkbox
		}else if(this.type == "submit" && !this.focusNode.form){ // see if a nonform widget needs to be signalled
			for(var node=this.domNode; node.parentNode/*#5935*/; node=node.parentNode){
				var widget=dijit.byNode(node);
				if(widget && typeof widget._onSubmit == "function"){
					widget._onSubmit(e);
					break;
				}
			}
		}
	},

	_setValueAttr: function(/*String*/ value){
		// Verify that value cannot be set for BUTTON elements.
		var attr = this.attributeMap.value || '';
		if(this[attr.node || attr || 'domNode'].tagName == 'BUTTON'){
			// On IE, setting value actually overrides innerHTML, so disallow for everyone for consistency
			if(value != this.value){
				console.debug('Cannot change the value attribute on a Button widget.');
			}
		}
	},

	_fillContent: function(/*DomNode*/ source){
		// Overrides _Templated._fillContent().
		// If button label is specified as srcNodeRef.innerHTML rather than
		// this.params.label, handle it here.
		if(source && (!this.params || !("label" in this.params))){
			this.attr('label', source.innerHTML);
		}
	},

	postCreate: function(){
		dojo.setSelectable(this.focusNode, false);
		this.inherited(arguments);
	},

	_setShowLabelAttr: function(val){
		if(this.containerNode){
			dojo.toggleClass(this.containerNode, "dijitDisplayNone", !val);
		}
		this.showLabel = val;
	},

	onClick: function(/*Event*/ e){
		// summary:
		//		Callback for when button is clicked.
		//		If type="submit", return true to perform submit, or false to cancel it.
		// type:
		//		callback
		return true;		// Boolean
	},

	_clicked: function(/*Event*/ e){
		// summary:
		//		Internal overridable function for when the button is clicked
	},

	setLabel: function(/*String*/ content){
		// summary:
		//		Deprecated.  Use attr('label', ...) instead.
		dojo.deprecated("dijit.form.Button.setLabel() is deprecated.  Use attr('label', ...) instead.", "", "2.0");
		this.attr("label", content);
	},
	_setLabelAttr: function(/*String*/ content){
		// summary:
		//		Hook for attr('label', ...) to work.
		// description:
		//		Set the label (text) of the button; takes an HTML string.
		this.containerNode.innerHTML = this.label = content;
		if(this.showLabel == false && !this.params.title){
			this.titleNode.title = dojo.trim(this.containerNode.innerText || this.containerNode.textContent || '');
		}
	}
});


dojo.declare("dijit.form.DropDownButton", [dijit.form.Button, dijit._Container, dijit._HasDropDown], {
	// summary:
	//		A button with a drop down
	//
	// example:
	// |	<button dojoType="dijit.form.DropDownButton" label="Hello world">
	// |		<div dojotype="dijit.Menu">...</div>
	// |	</button>
	//
	// example:
	// |	var button1 = new dijit.form.DropDownButton({ label: "hi", dropDown: new dijit.Menu(...) });
	// |	dojo.body().appendChild(button1);
	//

	baseClass : "dijitDropDownButton",

	templateString: dojo.cache("dijit.form", "templates/DropDownButton.html", "<span class=\"dijit dijitReset dijitLeft dijitInline\"\n\tdojoAttachPoint=\"_buttonNode\"\n\tdojoAttachEvent=\"onmouseenter:_onMouse,onmouseleave:_onMouse,onmousedown:_onMouse\"\n\t><span class='dijitReset dijitRight dijitInline'\n\t\t><span class='dijitReset dijitInline dijitButtonNode'\n\t\t\t><button class=\"dijitReset dijitStretch dijitButtonContents\"\n\t\t\t\t${nameAttrSetting} type=\"${type}\" value=\"${value}\"\n\t\t\t\tdojoAttachPoint=\"focusNode,titleNode,_arrowWrapperNode\"\n\t\t\t\twaiRole=\"button\" waiState=\"haspopup-true,labelledby-${id}_label\"\n\t\t\t\t><span class=\"dijitReset dijitInline\"\n\t\t\t\t\tdojoAttachPoint=\"iconNode\"\n\t\t\t\t></span\n\t\t\t\t><span class=\"dijitReset dijitInline dijitButtonText\"\n\t\t\t\t\tdojoAttachPoint=\"containerNode,_popupStateNode\"\n\t\t\t\t\tid=\"${id}_label\"\n\t\t\t\t></span\n\t\t\t\t><span class=\"dijitReset dijitInline dijitArrowButtonInner\">&thinsp;</span\n\t\t\t\t><span class=\"dijitReset dijitInline dijitArrowButtonChar\">&#9660;</span\n\t\t\t></button\n\t\t></span\n\t></span\n></span>\n"),

	_fillContent: function(){
		// Overrides Button._fillContent().
		//
		// My inner HTML contains both the button contents and a drop down widget, like
		// <DropDownButton>  <span>push me</span>  <Menu> ... </Menu> </DropDownButton>
		// The first node is assumed to be the button content. The widget is the popup.

		if(this.srcNodeRef){ // programatically created buttons might not define srcNodeRef
			//FIXME: figure out how to filter out the widget and use all remaining nodes as button
			//	content, not just nodes[0]
			var nodes = dojo.query("*", this.srcNodeRef);
			dijit.form.DropDownButton.superclass._fillContent.call(this, nodes[0]);

			// save pointer to srcNode so we can grab the drop down widget after it's instantiated
			this.dropDownContainer = this.srcNodeRef;
		}
	},

	startup: function(){
		if(this._started){ return; }

		// the child widget from srcNodeRef is the dropdown widget.  Insert it in the page DOM,
		// make it invisible, and store a reference to pass to the popup code.
		if(!this.dropDown){
			var dropDownNode = dojo.query("[widgetId]", this.dropDownContainer)[0];
			this.dropDown = dijit.byNode(dropDownNode);
			delete this.dropDownContainer;
		}
		dijit.popup.moveOffScreen(this.dropDown.domNode);

		this.inherited(arguments);
	},

	isLoaded: function(){
		// Returns whether or not we are loaded - if our dropdown has an href,
		// then we want to check that.
		var dropDown = this.dropDown;
		return (!dropDown.href || dropDown.isLoaded);
	},

	loadDropDown: function(){
		// Loads our dropdown
		var dropDown = this.dropDown;
		if(!dropDown){ return; }
		if(!this.isLoaded()){
			var handler = dojo.connect(dropDown, "onLoad", this, function(){
				dojo.disconnect(handler);
				this.openDropDown();
			});
			dropDown.refresh();
		}else{
			this.openDropDown();
		}
	},

	isFocusable: function(){
		// Overridden so that focus is handled by the _HasDropDown mixin, not by
		// the _FormWidget mixin.
		return this.inherited(arguments) && !this._mouseDown;
	}
});

dojo.declare("dijit.form.ComboButton", dijit.form.DropDownButton, {
	// summary:
	//		A combination button and drop-down button.
	//		Users can click one side to "press" the button, or click an arrow
	//		icon to display the drop down.
	//
	// example:
	// |	<button dojoType="dijit.form.ComboButton" onClick="...">
	// |		<span>Hello world</span>
	// |		<div dojoType="dijit.Menu">...</div>
	// |	</button>
	//
	// example:
	// |	var button1 = new dijit.form.ComboButton({label: "hello world", onClick: foo, dropDown: "myMenu"});
	// |	dojo.body().appendChild(button1.domNode);
	//

	templateString: dojo.cache("dijit.form", "templates/ComboButton.html", "<table class='dijit dijitReset dijitInline dijitLeft'\n\tcellspacing='0' cellpadding='0' waiRole=\"presentation\"\n\t><tbody waiRole=\"presentation\"><tr waiRole=\"presentation\"\n\t\t><td class=\"dijitReset dijitStretch dijitButtonNode\"><button id=\"${id}_button\" class=\"dijitReset dijitButtonContents\"\n\t\t\tdojoAttachEvent=\"onclick:_onButtonClick,onmouseenter:_onMouse,onmouseleave:_onMouse,onmousedown:_onMouse,onkeypress:_onButtonKeyPress\"  dojoAttachPoint=\"titleNode\"\n\t\t\twaiRole=\"button\" waiState=\"labelledby-${id}_label\"\n\t\t\t><div class=\"dijitReset dijitInline\" dojoAttachPoint=\"iconNode\" waiRole=\"presentation\"></div\n\t\t\t><div class=\"dijitReset dijitInline dijitButtonText\" id=\"${id}_label\" dojoAttachPoint=\"containerNode\" waiRole=\"presentation\"></div\n\t\t></button></td\n\t\t><td id=\"${id}_arrow\" class='dijitReset dijitRight dijitButtonNode dijitArrowButton'\n\t\t\tdojoAttachPoint=\"_popupStateNode,focusNode,_buttonNode\"\n\t\t\tdojoAttachEvent=\"onmouseenter:_onMouse,onmouseleave:_onMouse,onkeypress:_onArrowKeyPress\"\n\t\t\tstateModifier=\"DownArrow\"\n\t\t\ttitle=\"${optionsTitle}\" ${nameAttrSetting}\n\t\t\twaiRole=\"button\" waiState=\"haspopup-true\"\n\t\t\t><div class=\"dijitReset dijitArrowButtonInner\" waiRole=\"presentation\">&thinsp;</div\n\t\t\t><div class=\"dijitReset dijitArrowButtonChar\" waiRole=\"presentation\">&#9660;</div\n\t\t></td\n\t></tr></tbody\n></table>\n"),

	attributeMap: dojo.mixin(dojo.clone(dijit.form.Button.prototype.attributeMap), {
		id: "",
		tabIndex: ["focusNode", "titleNode"],
		title: "titleNode"
	}),

	// optionsTitle: String
	//		Text that describes the options menu (accessibility)
	optionsTitle: "",

	baseClass: "dijitComboButton",

	_focusedNode: null,

	postCreate: function(){
		this.inherited(arguments);
		this._focalNodes = [this.titleNode, this._popupStateNode];
		var isIE = dojo.isIE;
		dojo.forEach(this._focalNodes, dojo.hitch(this, function(node){
			this.connect(node, isIE? "onactivate" : "onfocus", this._onNodeFocus);
			this.connect(node, isIE? "ondeactivate" : "onblur", this._onNodeBlur);
		}));
		if(isIE && (isIE < 8 || dojo.isQuirks)){ // fixed in IE8/strict
			with(this.titleNode){ // resize BUTTON tag so parent TD won't inherit extra padding
				style.width = scrollWidth + "px";
				this.connect(this.titleNode, "onresize", function(){
					setTimeout( function(){ style.width = scrollWidth + "px"; }, 0);
				});
			}
		}
	},

	_onNodeFocus: function(evt){
		this._focusedNode = evt.currentTarget;
		var fnc = this._focusedNode == this.focusNode ? "dijitDownArrowButtonFocused" : "dijitButtonContentsFocused";
		dojo.addClass(this._focusedNode, fnc);
	},

	_onNodeBlur: function(evt){
		var fnc = evt.currentTarget == this.focusNode ? "dijitDownArrowButtonFocused" : "dijitButtonContentsFocused";
		dojo.removeClass(evt.currentTarget, fnc);
	},

	_onBlur: function(){
		this.inherited(arguments);
		this._focusedNode = null;
	},
	
	_onButtonKeyPress: function(/*Event*/ evt){
		// summary:
		//		Handler for right arrow key when focus is on left part of button
		if(evt.charOrCode == dojo.keys[this.isLeftToRight() ? "RIGHT_ARROW" : "LEFT_ARROW"]){
			dijit.focus(this._popupStateNode);
			dojo.stopEvent(evt);
		}
	},

	_onArrowKeyPress: function(/*Event*/ evt){
		// summary:
		//		Handler for left arrow key when focus is on right part of button
		if(evt.charOrCode == dojo.keys[this.isLeftToRight() ? "LEFT_ARROW" : "RIGHT_ARROW"]){
			dijit.focus(this.titleNode);
			dojo.stopEvent(evt);
		}
	},
	
	focus: function(/*String*/ position){
		// summary:
		//		Focuses this widget to according to position, if specified,
		//		otherwise on arrow node
		// position:
		//		"start" or "end"
		
		dijit.focus(position == "start" ? this.titleNode : this._popupStateNode);
	}
});

dojo.declare("dijit.form.ToggleButton", dijit.form.Button, {
	// summary:
	//		A button that can be in two states (checked or not).
	//		Can be base class for things like tabs or checkbox or radio buttons

	baseClass: "dijitToggleButton",

	// checked: Boolean
	//		Corresponds to the native HTML <input> element's attribute.
	//		In markup, specified as "checked='checked'" or just "checked".
	//		True if the button is depressed, or the checkbox is checked,
	//		or the radio button is selected, etc.
	checked: false,

	attributeMap: dojo.mixin(dojo.clone(dijit.form.Button.prototype.attributeMap), {
		checked:"focusNode"
	}),

	_clicked: function(/*Event*/ evt){
		this.attr('checked', !this.checked);
	},

	_setCheckedAttr: function(/*Boolean*/ value){
		this.checked = value;
		dojo.attr(this.focusNode || this.domNode, "checked", value);
		dijit.setWaiState(this.focusNode || this.domNode, "pressed", value);
		this._setStateClass();
		this._handleOnChange(value, true);
	},

	setChecked: function(/*Boolean*/ checked){
		// summary:
		//		Deprecated.   Use attr('checked', true/false) instead.
		dojo.deprecated("setChecked("+checked+") is deprecated. Use attr('checked',"+checked+") instead.", "", "2.0");
		this.attr('checked', checked);
	},

	reset: function(){
		// summary:
		//		Reset the widget's value to what it was at initialization time

		this._hasBeenBlurred = false;

		// set checked state to original setting
		this.attr('checked', this.params.checked || false);
	}
});

}

if(!dojo._hasResource["dojo.fx.Toggler"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.fx.Toggler"] = true;
dojo.provide("dojo.fx.Toggler");

dojo.declare("dojo.fx.Toggler", null, {
	// summary:
	//		A simple `dojo.Animation` toggler API.
	//
	// description:
	//		class constructor for an animation toggler. It accepts a packed
	//		set of arguments about what type of animation to use in each
	//		direction, duration, etc. All available members are mixed into 
	//		these animations from the constructor (for example, `node`, 
	//		`showDuration`, `hideDuration`). 
	//
	// example:
	//	|	var t = new dojo.fx.Toggler({
	//	|		node: "nodeId",
	//	|		showDuration: 500,
	//	|		// hideDuration will default to "200"
	//	|		showFunc: dojo.fx.wipeIn, 
	//	|		// hideFunc will default to "fadeOut"
	//	|	});
	//	|	t.show(100); // delay showing for 100ms
	//	|	// ...time passes...
	//	|	t.hide();

	// node: DomNode
	//		the node to target for the showing and hiding animations
	node: null,

	// showFunc: Function
	//		The function that returns the `dojo.Animation` to show the node
	showFunc: dojo.fadeIn,

	// hideFunc: Function	
	//		The function that returns the `dojo.Animation` to hide the node
	hideFunc: dojo.fadeOut,

	// showDuration:
	//		Time in milliseconds to run the show Animation
	showDuration: 200,

	// hideDuration:
	//		Time in milliseconds to run the hide Animation
	hideDuration: 200,

	// FIXME: need a policy for where the toggler should "be" the next
	// time show/hide are called if we're stopped somewhere in the
	// middle.
	// FIXME: also would be nice to specify individual showArgs/hideArgs mixed into
	// each animation individually. 
	// FIXME: also would be nice to have events from the animations exposed/bridged

	/*=====
	_showArgs: null,
	_showAnim: null,

	_hideArgs: null,
	_hideAnim: null,

	_isShowing: false,
	_isHiding: false,
	=====*/

	constructor: function(args){
		var _t = this;

		dojo.mixin(_t, args);
		_t.node = args.node;
		_t._showArgs = dojo.mixin({}, args);
		_t._showArgs.node = _t.node;
		_t._showArgs.duration = _t.showDuration;
		_t.showAnim = _t.showFunc(_t._showArgs);

		_t._hideArgs = dojo.mixin({}, args);
		_t._hideArgs.node = _t.node;
		_t._hideArgs.duration = _t.hideDuration;
		_t.hideAnim = _t.hideFunc(_t._hideArgs);

		dojo.connect(_t.showAnim, "beforeBegin", dojo.hitch(_t.hideAnim, "stop", true));
		dojo.connect(_t.hideAnim, "beforeBegin", dojo.hitch(_t.showAnim, "stop", true));
	},

	show: function(delay){
		// summary: Toggle the node to showing
		// delay: Integer?
		//		Ammount of time to stall playing the show animation
		return this.showAnim.play(delay || 0);
	},

	hide: function(delay){
		// summary: Toggle the node to hidden
		// delay: Integer?
		//		Ammount of time to stall playing the hide animation
		return this.hideAnim.play(delay || 0);
	}
});

}

if(!dojo._hasResource["dojo.fx"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.fx"] = true;
dojo.provide("dojo.fx");
 // FIXME: remove this back-compat require in 2.0 
/*=====
dojo.fx = {
	// summary: Effects library on top of Base animations
};
=====*/
(function(){
	
	var d = dojo, 
		_baseObj = {
			_fire: function(evt, args){
				if(this[evt]){
					this[evt].apply(this, args||[]);
				}
				return this;
			}
		};

	var _chain = function(animations){
		this._index = -1;
		this._animations = animations||[];
		this._current = this._onAnimateCtx = this._onEndCtx = null;

		this.duration = 0;
		d.forEach(this._animations, function(a){
			this.duration += a.duration;
			if(a.delay){ this.duration += a.delay; }
		}, this);
	};
	d.extend(_chain, {
		_onAnimate: function(){
			this._fire("onAnimate", arguments);
		},
		_onEnd: function(){
			d.disconnect(this._onAnimateCtx);
			d.disconnect(this._onEndCtx);
			this._onAnimateCtx = this._onEndCtx = null;
			if(this._index + 1 == this._animations.length){
				this._fire("onEnd");
			}else{
				// switch animations
				this._current = this._animations[++this._index];
				this._onAnimateCtx = d.connect(this._current, "onAnimate", this, "_onAnimate");
				this._onEndCtx = d.connect(this._current, "onEnd", this, "_onEnd");
				this._current.play(0, true);
			}
		},
		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			if(!this._current){ this._current = this._animations[this._index = 0]; }
			if(!gotoStart && this._current.status() == "playing"){ return this; }
			var beforeBegin = d.connect(this._current, "beforeBegin", this, function(){
					this._fire("beforeBegin");
				}),
				onBegin = d.connect(this._current, "onBegin", this, function(arg){
					this._fire("onBegin", arguments);
				}),
				onPlay = d.connect(this._current, "onPlay", this, function(arg){
					this._fire("onPlay", arguments);
					d.disconnect(beforeBegin);
					d.disconnect(onBegin);
					d.disconnect(onPlay);
				});
			if(this._onAnimateCtx){
				d.disconnect(this._onAnimateCtx);
			}
			this._onAnimateCtx = d.connect(this._current, "onAnimate", this, "_onAnimate");
			if(this._onEndCtx){
				d.disconnect(this._onEndCtx);
			}
			this._onEndCtx = d.connect(this._current, "onEnd", this, "_onEnd");
			this._current.play.apply(this._current, arguments);
			return this;
		},
		pause: function(){
			if(this._current){
				var e = d.connect(this._current, "onPause", this, function(arg){
						this._fire("onPause", arguments);
						d.disconnect(e);
					});
				this._current.pause();
			}
			return this;
		},
		gotoPercent: function(/*Decimal*/percent, /*Boolean?*/ andPlay){
			this.pause();
			var offset = this.duration * percent;
			this._current = null;
			d.some(this._animations, function(a){
				if(a.duration <= offset){
					this._current = a;
					return true;
				}
				offset -= a.duration;
				return false;
			});
			if(this._current){
				this._current.gotoPercent(offset / this._current.duration, andPlay);
			}
			return this;
		},
		stop: function(/*boolean?*/ gotoEnd){
			if(this._current){
				if(gotoEnd){
					for(; this._index + 1 < this._animations.length; ++this._index){
						this._animations[this._index].stop(true);
					}
					this._current = this._animations[this._index];
				}
				var e = d.connect(this._current, "onStop", this, function(arg){
						this._fire("onStop", arguments);
						d.disconnect(e);
					});
				this._current.stop();
			}
			return this;
		},
		status: function(){
			return this._current ? this._current.status() : "stopped";
		},
		destroy: function(){
			if(this._onAnimateCtx){ d.disconnect(this._onAnimateCtx); }
			if(this._onEndCtx){ d.disconnect(this._onEndCtx); }
		}
	});
	d.extend(_chain, _baseObj);

	dojo.fx.chain = function(/*dojo.Animation[]*/ animations){
		// summary: 
		//		Chain a list of `dojo.Animation`s to run in sequence
		//
		// description:
		//		Return a `dojo.Animation` which will play all passed
		//		`dojo.Animation` instances in sequence, firing its own
		//		synthesized events simulating a single animation. (eg:
		//		onEnd of this animation means the end of the chain, 
		//		not the individual animations within)
		//
		// example:
		//	Once `node` is faded out, fade in `otherNode`
		//	|	dojo.fx.chain([
		//	|		dojo.fadeIn({ node:node }),
		//	|		dojo.fadeOut({ node:otherNode })
		//	|	]).play();
		//
		return new _chain(animations) // dojo.Animation
	};

	var _combine = function(animations){
		this._animations = animations||[];
		this._connects = [];
		this._finished = 0;

		this.duration = 0;
		d.forEach(animations, function(a){
			var duration = a.duration;
			if(a.delay){ duration += a.delay; }
			if(this.duration < duration){ this.duration = duration; }
			this._connects.push(d.connect(a, "onEnd", this, "_onEnd"));
		}, this);
		
		this._pseudoAnimation = new d.Animation({curve: [0, 1], duration: this.duration});
		var self = this;
		d.forEach(["beforeBegin", "onBegin", "onPlay", "onAnimate", "onPause", "onStop", "onEnd"], 
			function(evt){
				self._connects.push(d.connect(self._pseudoAnimation, evt,
					function(){ self._fire(evt, arguments); }
				));
			}
		);
	};
	d.extend(_combine, {
		_doAction: function(action, args){
			d.forEach(this._animations, function(a){
				a[action].apply(a, args);
			});
			return this;
		},
		_onEnd: function(){
			if(++this._finished > this._animations.length){
				this._fire("onEnd");
			}
		},
		_call: function(action, args){
			var t = this._pseudoAnimation;
			t[action].apply(t, args);
		},
		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			this._finished = 0;
			this._doAction("play", arguments);
			this._call("play", arguments);
			return this;
		},
		pause: function(){
			this._doAction("pause", arguments);
			this._call("pause", arguments);
			return this;
		},
		gotoPercent: function(/*Decimal*/percent, /*Boolean?*/ andPlay){
			var ms = this.duration * percent;
			d.forEach(this._animations, function(a){
				a.gotoPercent(a.duration < ms ? 1 : (ms / a.duration), andPlay);
			});
			this._call("gotoPercent", arguments);
			return this;
		},
		stop: function(/*boolean?*/ gotoEnd){
			this._doAction("stop", arguments);
			this._call("stop", arguments);
			return this;
		},
		status: function(){
			return this._pseudoAnimation.status();
		},
		destroy: function(){
			d.forEach(this._connects, dojo.disconnect);
		}
	});
	d.extend(_combine, _baseObj);

	dojo.fx.combine = function(/*dojo.Animation[]*/ animations){
		// summary: 
		//		Combine a list of `dojo.Animation`s to run in parallel
		//
		// description:
		//		Combine an array of `dojo.Animation`s to run in parallel, 
		//		providing a new `dojo.Animation` instance encompasing each
		//		animation, firing standard animation events.
		//
		// example:
		//	Fade out `node` while fading in `otherNode` simultaneously
		//	|	dojo.fx.combine([
		//	|		dojo.fadeIn({ node:node }),
		//	|		dojo.fadeOut({ node:otherNode })
		//	|	]).play();
		//
		// example:
		//	When the longest animation ends, execute a function:
		//	|	var anim = dojo.fx.combine([
		//	|		dojo.fadeIn({ node: n, duration:700 }),
		//	|		dojo.fadeOut({ node: otherNode, duration: 300 })
		//	|	]);
		//	|	dojo.connect(anim, "onEnd", function(){
		//	|		// overall animation is done.
		//	|	});
		//	|	anim.play(); // play the animation
		//
		return new _combine(animations); // dojo.Animation
	};

	dojo.fx.wipeIn = function(/*Object*/ args){
		// summary:
		//		Expand a node to it's natural height.
		//
		// description:
		//		Returns an animation that will expand the
		//		node defined in 'args' object from it's current height to
		//		it's natural height (with no scrollbar).
		//		Node must have no margin/border/padding.
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on)
		//
		// example:
		//	|	dojo.fx.wipeIn({
		//	|		node:"someId"
		//	|	}).play()
		var node = args.node = d.byId(args.node), s = node.style, o;

		var anim = d.animateProperty(d.mixin({
			properties: {
				height: {
					// wrapped in functions so we wait till the last second to query (in case value has changed)
					start: function(){
						// start at current [computed] height, but use 1px rather than 0
						// because 0 causes IE to display the whole panel
						o = s.overflow;
						s.overflow = "hidden";
						if(s.visibility == "hidden" || s.display == "none"){
							s.height = "1px";
							s.display = "";
							s.visibility = "";
							return 1;
						}else{
							var height = d.style(node, "height");
							return Math.max(height, 1);
						}
					},
					end: function(){
						return node.scrollHeight;
					}
				}
			}
		}, args));

		d.connect(anim, "onEnd", function(){ 
			s.height = "auto";
			s.overflow = o;
		});

		return anim; // dojo.Animation
	}

	dojo.fx.wipeOut = function(/*Object*/ args){
		// summary:
		//		Shrink a node to nothing and hide it. 
		//
		// description:
		//		Returns an animation that will shrink node defined in "args"
		//		from it's current height to 1px, and then hide it.
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on)
		// 
		// example:
		//	|	dojo.fx.wipeOut({ node:"someId" }).play()
		
		var node = args.node = d.byId(args.node), s = node.style, o;
		
		var anim = d.animateProperty(d.mixin({
			properties: {
				height: {
					end: 1 // 0 causes IE to display the whole panel
				}
			}
		}, args));

		d.connect(anim, "beforeBegin", function(){
			o = s.overflow;
			s.overflow = "hidden";
			s.display = "";
		});
		d.connect(anim, "onEnd", function(){
			s.overflow = o;
			s.height = "auto";
			s.display = "none";
		});

		return anim; // dojo.Animation
	}

	dojo.fx.slideTo = function(/*Object*/ args){
		// summary:
		//		Slide a node to a new top/left position
		//
		// description:
		//		Returns an animation that will slide "node" 
		//		defined in args Object from its current position to
		//		the position defined by (args.left, args.top).
		//
		// args: Object
		//		A hash-map of standard `dojo.Animation` constructor properties
		//		(such as easing: node: duration: and so on). Special args members
		//		are `top` and `left`, which indicate the new position to slide to.
		//
		// example:
		//	|	dojo.fx.slideTo({ node: node, left:"40", top:"50", units:"px" }).play()

		var node = args.node = d.byId(args.node), 
			top = null, left = null;

		var init = (function(n){
			return function(){
				var cs = d.getComputedStyle(n);
				var pos = cs.position;
				top = (pos == 'absolute' ? n.offsetTop : parseInt(cs.top) || 0);
				left = (pos == 'absolute' ? n.offsetLeft : parseInt(cs.left) || 0);
				if(pos != 'absolute' && pos != 'relative'){
					var ret = d.position(n, true);
					top = ret.y;
					left = ret.x;
					n.style.position="absolute";
					n.style.top=top+"px";
					n.style.left=left+"px";
				}
			};
		})(node);
		init();

		var anim = d.animateProperty(d.mixin({
			properties: {
				top: args.top || 0,
				left: args.left || 0
			}
		}, args));
		d.connect(anim, "beforeBegin", anim, init);

		return anim; // dojo.Animation
	}

})();

}

if(!dojo._hasResource["dojo.regexp"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.regexp"] = true;
dojo.provide("dojo.regexp");

/*=====
dojo.regexp = {
	// summary: Regular expressions and Builder resources
};
=====*/

dojo.regexp.escapeString = function(/*String*/str, /*String?*/except){
	//	summary:
	//		Adds escape sequences for special characters in regular expressions
	// except:
	//		a String with special characters to be left unescaped

	return str.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, function(ch){
		if(except && except.indexOf(ch) != -1){
			return ch;
		}
		return "\\" + ch;
	}); // String
}

dojo.regexp.buildGroupRE = function(/*Object|Array*/arr, /*Function*/re, /*Boolean?*/nonCapture){
	//	summary:
	//		Builds a regular expression that groups subexpressions
	//	description:
	//		A utility function used by some of the RE generators. The
	//		subexpressions are constructed by the function, re, in the second
	//		parameter.  re builds one subexpression for each elem in the array
	//		a, in the first parameter. Returns a string for a regular
	//		expression that groups all the subexpressions.
	// arr:
	//		A single value or an array of values.
	// re:
	//		A function. Takes one parameter and converts it to a regular
	//		expression. 
	// nonCapture:
	//		If true, uses non-capturing match, otherwise matches are retained
	//		by regular expression. Defaults to false

	// case 1: a is a single value.
	if(!(arr instanceof Array)){
		return re(arr); // String
	}

	// case 2: a is an array
	var b = [];
	for(var i = 0; i < arr.length; i++){
		// convert each elem to a RE
		b.push(re(arr[i]));
	}

	 // join the REs as alternatives in a RE group.
	return dojo.regexp.group(b.join("|"), nonCapture); // String
}

dojo.regexp.group = function(/*String*/expression, /*Boolean?*/nonCapture){
	// summary:
	//		adds group match to expression
	// nonCapture:
	//		If true, uses non-capturing match, otherwise matches are retained
	//		by regular expression. 
	return "(" + (nonCapture ? "?:":"") + expression + ")"; // String
}

}

if(!dojo._hasResource["dojo.number"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.number"] = true;
dojo.provide("dojo.number");







/*=====
dojo.number = {
	// summary: localized formatting and parsing routines for Number
}

dojo.number.__FormatOptions = function(){
	//	pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.
	//	type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	//	places: Number?
	//		fixed number of decimal places to show.  This overrides any
	//		information in the provided pattern.
	//	round: Number?
	//		5 rounds to nearest .5; 0 rounds to nearest whole (default). -1
	//		means do not round.
	//	locale: String?
	//		override the locale used to determine formatting rules
	this.pattern = pattern;
	this.type = type;
	this.places = places;
	this.round = round;
	this.locale = locale;
}
=====*/

dojo.number.format = function(/*Number*/value, /*dojo.number.__FormatOptions?*/options){
	// summary:
	//		Format a Number as a String, using locale-specific settings
	// description:
	//		Create a string from a Number using a known localized pattern.
	//		Formatting patterns appropriate to the locale are chosen from the
	//		[CLDR](http://unicode.org/cldr) as well as the appropriate symbols and
	//		delimiters.  See <http://www.unicode.org/reports/tr35/#Number_Elements>
	//		If value is Infinity, -Infinity, or is not a valid JavaScript number, return null.
	// value:
	//		the number to be formatted

	options = dojo.mixin({}, options || {});
	var locale = dojo.i18n.normalizeLocale(options.locale);
	var bundle = dojo.i18n.getLocalization("dojo.cldr", "number", locale);
	options.customs = bundle;
	var pattern = options.pattern || bundle[(options.type || "decimal") + "Format"];
	if(isNaN(value) || Math.abs(value) == Infinity){ return null; } // null
	return dojo.number._applyPattern(value, pattern, options); // String
};

//dojo.number._numberPatternRE = /(?:[#0]*,?)*[#0](?:\.0*#*)?/; // not precise, but good enough
dojo.number._numberPatternRE = /[#0,]*[#0](?:\.0*#*)?/; // not precise, but good enough

dojo.number._applyPattern = function(/*Number*/value, /*String*/pattern, /*dojo.number.__FormatOptions?*/options){
	// summary:
	//		Apply pattern to format value as a string using options. Gives no
	//		consideration to local customs.
	// value:
	//		the number to be formatted.
	// pattern:
	//		a pattern string as described by
	//		[unicode.org TR35](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	// options: dojo.number.__FormatOptions?
	//		_applyPattern is usually called via `dojo.number.format()` which
	//		populates an extra property in the options parameter, "customs".
	//		The customs object specifies group and decimal parameters if set.

	//TODO: support escapes
	options = options || {};
	var group = options.customs.group;
	var decimal = options.customs.decimal;

	var patternList = pattern.split(';');
	var positivePattern = patternList[0];
	pattern = patternList[(value < 0) ? 1 : 0] || ("-" + positivePattern);

	//TODO: only test against unescaped
	if(pattern.indexOf('%') != -1){
		value *= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		value *= 1000; // per mille
	}else if(pattern.indexOf('\u00a4') != -1){
		group = options.customs.currencyGroup || group;//mixins instead?
		decimal = options.customs.currencyDecimal || decimal;// Should these be mixins instead?
		pattern = pattern.replace(/\u00a4{1,3}/, function(match){
			var prop = ["symbol", "currency", "displayName"][match.length-1];
			return options[prop] || options.currency || "";
		});
	}else if(pattern.indexOf('E') != -1){
		throw new Error("exponential notation not supported");
	}
	
	//TODO: support @ sig figs?
	var numberPatternRE = dojo.number._numberPatternRE;
	var numberPattern = positivePattern.match(numberPatternRE);
	if(!numberPattern){
		throw new Error("unable to find a number expression in pattern: "+pattern);
	}
	if(options.fractional === false){ options.places = 0; }
	return pattern.replace(numberPatternRE,
		dojo.number._formatAbsolute(value, numberPattern[0], {decimal: decimal, group: group, places: options.places, round: options.round}));
}

dojo.number.round = function(/*Number*/value, /*Number?*/places, /*Number?*/increment){
	//	summary:
	//		Rounds to the nearest value with the given number of decimal places, away from zero
	//	description:
	//		Rounds to the nearest value with the given number of decimal places, away from zero if equal.
	//		Similar to Number.toFixed(), but compensates for browser quirks. Rounding can be done by
	//		fractional increments also, such as the nearest quarter.
	//		NOTE: Subject to floating point errors.  See dojox.math.round for experimental workaround.
	//	value:
	//		The number to round
	//	places:
	//		The number of decimal places where rounding takes place.  Defaults to 0 for whole rounding.
	//		Must be non-negative.
	//	increment:
	//		Rounds next place to nearest value of increment/10.  10 by default.
	//	example:
	//		>>> dojo.number.round(-0.5)
	//		-1
	//		>>> dojo.number.round(162.295, 2)
	//		162.29  // note floating point error.  Should be 162.3
	//		>>> dojo.number.round(10.71, 0, 2.5)
	//		10.75
	var factor = 10 / (increment || 10);
	return (factor * +value).toFixed(places) / factor; // Number
}

if((0.9).toFixed() == 0){
	// (isIE) toFixed() bug workaround: Rounding fails on IE when most significant digit
	// is just after the rounding place and is >=5
	(function(){
		var round = dojo.number.round;
		dojo.number.round = function(v, p, m){
			var d = Math.pow(10, -p || 0), a = Math.abs(v);
			if(!v || a >= d || a * Math.pow(10, p + 1) < 5){
				d = 0;
			}
			return round(v, p, m) + (v > 0 ? d : -d);
		}
	})();
}

/*=====
dojo.number.__FormatAbsoluteOptions = function(){
	//	decimal: String?
	//		the decimal separator
	//	group: String?
	//		the group separator
	//	places: Number?|String?
	//		number of decimal places.  the range "n,m" will format to m places.
	//	round: Number?
	//		5 rounds to nearest .5; 0 rounds to nearest whole (default). -1
	//		means don't round.
	this.decimal = decimal;
	this.group = group;
	this.places = places;
	this.round = round;
}
=====*/

dojo.number._formatAbsolute = function(/*Number*/value, /*String*/pattern, /*dojo.number.__FormatAbsoluteOptions?*/options){
	// summary: 
	//		Apply numeric pattern to absolute value using options. Gives no
	//		consideration to local customs.
	// value:
	//		the number to be formatted, ignores sign
	// pattern:
	//		the number portion of a pattern (e.g. `#,##0.00`)
	options = options || {};
	if(options.places === true){options.places=0;}
	if(options.places === Infinity){options.places=6;} // avoid a loop; pick a limit

	var patternParts = pattern.split(".");
	var maxPlaces = (options.places >= 0) ? options.places : (patternParts[1] && patternParts[1].length) || 0;
	if(!(options.round < 0)){
		value = dojo.number.round(value, maxPlaces, options.round);
	}

	var valueParts = String(Math.abs(value)).split(".");
	var fractional = valueParts[1] || "";
	if(options.places){
		var comma = dojo.isString(options.places) && options.places.indexOf(",");
		if(comma){
			options.places = options.places.substring(comma+1);
		}
		valueParts[1] = dojo.string.pad(fractional.substr(0, options.places), options.places, '0', true);
	}else if(patternParts[1] && options.places !== 0){
		// Pad fractional with trailing zeros
		var pad = patternParts[1].lastIndexOf("0") + 1;
		if(pad > fractional.length){
			valueParts[1] = dojo.string.pad(fractional, pad, '0', true);
		}

		// Truncate fractional
		var places = patternParts[1].length;
		if(places < fractional.length){
			valueParts[1] = fractional.substr(0, places);
		}
	}else{
		if(valueParts[1]){ valueParts.pop(); }
	}

	// Pad whole with leading zeros
	var patternDigits = patternParts[0].replace(',', '');
	pad = patternDigits.indexOf("0");
	if(pad != -1){
		pad = patternDigits.length - pad;
		if(pad > valueParts[0].length){
			valueParts[0] = dojo.string.pad(valueParts[0], pad);
		}

		// Truncate whole
		if(patternDigits.indexOf("#") == -1){
			valueParts[0] = valueParts[0].substr(valueParts[0].length - pad);
		}
	}

	// Add group separators
	var index = patternParts[0].lastIndexOf(',');
	var groupSize, groupSize2;
	if(index != -1){
		groupSize = patternParts[0].length - index - 1;
		var remainder = patternParts[0].substr(0, index);
		index = remainder.lastIndexOf(',');
		if(index != -1){
			groupSize2 = remainder.length - index - 1;
		}
	}
	var pieces = [];
	for(var whole = valueParts[0]; whole;){
		var off = whole.length - groupSize;
		pieces.push((off > 0) ? whole.substr(off) : whole);
		whole = (off > 0) ? whole.slice(0, off) : "";
		if(groupSize2){
			groupSize = groupSize2;
			delete groupSize2;
		}
	}
	valueParts[0] = pieces.reverse().join(options.group || ",");

	return valueParts.join(options.decimal || ".");
};

/*=====
dojo.number.__RegexpOptions = function(){
	//	pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.
	//	type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	//	locale: String?
	//		override the locale used to determine formatting rules
	//	strict: Boolean?
	//		strict parsing, false by default.  Strict parsing requires input as produced by the format() method.
	//		Non-strict is more permissive, e.g. flexible on white space, omitting thousands separators
	//	places: Number|String?
	//		number of decimal places to accept: Infinity, a positive number, or
	//		a range "n,m".  Defined by pattern or Infinity if pattern not provided.
	this.pattern = pattern;
	this.type = type;
	this.locale = locale;
	this.strict = strict;
	this.places = places;
}
=====*/
dojo.number.regexp = function(/*dojo.number.__RegexpOptions?*/options){
	//	summary:
	//		Builds the regular needed to parse a number
	//	description:
	//		Returns regular expression with positive and negative match, group
	//		and decimal separators
	return dojo.number._parseInfo(options).regexp; // String
}

dojo.number._parseInfo = function(/*Object?*/options){
	options = options || {};
	var locale = dojo.i18n.normalizeLocale(options.locale);
	var bundle = dojo.i18n.getLocalization("dojo.cldr", "number", locale);
	var pattern = options.pattern || bundle[(options.type || "decimal") + "Format"];
//TODO: memoize?
	var group = bundle.group;
	var decimal = bundle.decimal;
	var factor = 1;

	if(pattern.indexOf('%') != -1){
		factor /= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		factor /= 1000; // per mille
	}else{
		var isCurrency = pattern.indexOf('\u00a4') != -1;
		if(isCurrency){
			group = bundle.currencyGroup || group;
			decimal = bundle.currencyDecimal || decimal;
		}
	}

	//TODO: handle quoted escapes
	var patternList = pattern.split(';');
	if(patternList.length == 1){
		patternList.push("-" + patternList[0]);
	}

	var re = dojo.regexp.buildGroupRE(patternList, function(pattern){
		pattern = "(?:"+dojo.regexp.escapeString(pattern, '.')+")";
		return pattern.replace(dojo.number._numberPatternRE, function(format){
			var flags = {
				signed: false,
				separator: options.strict ? group : [group,""],
				fractional: options.fractional,
				decimal: decimal,
				exponent: false};
			var parts = format.split('.');
			var places = options.places;
			if(parts.length == 1 || places === 0){flags.fractional = false;}
			else{
				if(places === undefined){ places = options.pattern ? parts[1].lastIndexOf('0')+1 : Infinity; }
				if(places && options.fractional == undefined){flags.fractional = true;} // required fractional, unless otherwise specified
				if(!options.places && (places < parts[1].length)){ places += "," + parts[1].length; }
				flags.places = places;
			}
			var groups = parts[0].split(',');
			if(groups.length>1){
				flags.groupSize = groups.pop().length;
				if(groups.length>1){
					flags.groupSize2 = groups.pop().length;
				}
			}
			return "("+dojo.number._realNumberRegexp(flags)+")";
		});
	}, true);

	if(isCurrency){
		// substitute the currency symbol for the placeholder in the pattern
		re = re.replace(/([\s\xa0]*)(\u00a4{1,3})([\s\xa0]*)/g, function(match, before, target, after){
			var prop = ["symbol", "currency", "displayName"][target.length-1];
			var symbol = dojo.regexp.escapeString(options[prop] || options.currency || "");
			before = before ? "[\\s\\xa0]" : "";
			after = after ? "[\\s\\xa0]" : "";
			if(!options.strict){
				if(before){before += "*";}
				if(after){after += "*";}
				return "(?:"+before+symbol+after+")?";
			}
			return before+symbol+after;
		});
	}

//TODO: substitute localized sign/percent/permille/etc.?

	// normalize whitespace and return
	return {regexp: re.replace(/[\xa0 ]/g, "[\\s\\xa0]"), group: group, decimal: decimal, factor: factor}; // Object
}

/*=====
dojo.number.__ParseOptions = function(){
	//	pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.
	//	type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	//	locale: String?
	//		override the locale used to determine formatting rules
	//	strict: Boolean?
	//		strict parsing, false by default.  Strict parsing requires input as produced by the format() method.
	//		Non-strict is more permissive, e.g. flexible on white space, omitting thousands separators
	this.pattern = pattern;
	this.type = type;
	this.locale = locale;
	this.strict = strict;
}
=====*/
dojo.number.parse = function(/*String*/expression, /*dojo.number.__ParseOptions?*/options){
	// summary:
	//		Convert a properly formatted string to a primitive Number, using
	//		locale-specific settings.
	// description:
	//		Create a Number from a string using a known localized pattern.
	//		Formatting patterns are chosen appropriate to the locale
	//		and follow the syntax described by
	//		[unicode.org TR35](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	// expression:
	//		A string representation of a Number
	var info = dojo.number._parseInfo(options);
	var results = (new RegExp("^"+info.regexp+"$")).exec(expression);
	if(!results){
		return NaN; //NaN
	}
	var absoluteMatch = results[1]; // match for the positive expression
	if(!results[1]){
		if(!results[2]){
			return NaN; //NaN
		}
		// matched the negative pattern
		absoluteMatch =results[2];
		info.factor *= -1;
	}

	// Transform it to something Javascript can parse as a number.  Normalize
	// decimal point and strip out group separators or alternate forms of whitespace
	absoluteMatch = absoluteMatch.
		replace(new RegExp("["+info.group + "\\s\\xa0"+"]", "g"), "").
		replace(info.decimal, ".");
	// Adjust for negative sign, percent, etc. as necessary
	return absoluteMatch * info.factor; //Number
};

/*=====
dojo.number.__RealNumberRegexpFlags = function(){
	//	places: Number?
	//		The integer number of decimal places or a range given as "n,m".  If
	//		not given, the decimal part is optional and the number of places is
	//		unlimited.
	//	decimal: String?
	//		A string for the character used as the decimal point.  Default
	//		is ".".
	//	fractional: Boolean?|Array?
	//		Whether decimal places are used.  Can be true, false, or [true,
	//		false].  Default is [true, false] which means optional.
	//	exponent: Boolean?|Array?
	//		Express in exponential notation.  Can be true, false, or [true,
	//		false]. Default is [true, false], (i.e. will match if the
	//		exponential part is present are not).
	//	eSigned: Boolean?|Array?
	//		The leading plus-or-minus sign on the exponent.  Can be true,
	//		false, or [true, false].  Default is [true, false], (i.e. will
	//		match if it is signed or unsigned).  flags in regexp.integer can be
	//		applied.
	this.places = places;
	this.decimal = decimal;
	this.fractional = fractional;
	this.exponent = exponent;
	this.eSigned = eSigned;
}
=====*/

dojo.number._realNumberRegexp = function(/*dojo.number.__RealNumberRegexpFlags?*/flags){
	// summary:
	//		Builds a regular expression to match a real number in exponential
	//		notation

	// assign default values to missing paramters
	flags = flags || {};
	//TODO: use mixin instead?
	if(!("places" in flags)){ flags.places = Infinity; }
	if(typeof flags.decimal != "string"){ flags.decimal = "."; }
	if(!("fractional" in flags) || /^0/.test(flags.places)){ flags.fractional = [true, false]; }
	if(!("exponent" in flags)){ flags.exponent = [true, false]; }
	if(!("eSigned" in flags)){ flags.eSigned = [true, false]; }

	// integer RE
	var integerRE = dojo.number._integerRegexp(flags);

	// decimal RE
	var decimalRE = dojo.regexp.buildGroupRE(flags.fractional,
		function(q){
			var re = "";
			if(q && (flags.places!==0)){
				re = "\\" + flags.decimal;
				if(flags.places == Infinity){ 
					re = "(?:" + re + "\\d+)?"; 
				}else{
					re += "\\d{" + flags.places + "}"; 
				}
			}
			return re;
		},
		true
	);

	// exponent RE
	var exponentRE = dojo.regexp.buildGroupRE(flags.exponent,
		function(q){ 
			if(q){ return "([eE]" + dojo.number._integerRegexp({ signed: flags.eSigned}) + ")"; }
			return ""; 
		}
	);

	// real number RE
	var realRE = integerRE + decimalRE;
	// allow for decimals without integers, e.g. .25
	if(decimalRE){realRE = "(?:(?:"+ realRE + ")|(?:" + decimalRE + "))";}
	return realRE + exponentRE; // String
};

/*=====
dojo.number.__IntegerRegexpFlags = function(){
	//	signed: Boolean?
	//		The leading plus-or-minus sign. Can be true, false, or `[true,false]`.
	//		Default is `[true, false]`, (i.e. will match if it is signed
	//		or unsigned).
	//	separator: String?
	//		The character used as the thousands separator. Default is no
	//		separator. For more than one symbol use an array, e.g. `[",", ""]`,
	//		makes ',' optional.
	//	groupSize: Number?
	//		group size between separators
	//	groupSize2: Number?
	//		second grouping, where separators 2..n have a different interval than the first separator (for India)
	this.signed = signed;
	this.separator = separator;
	this.groupSize = groupSize;
	this.groupSize2 = groupSize2;
}
=====*/

dojo.number._integerRegexp = function(/*dojo.number.__IntegerRegexpFlags?*/flags){
	// summary: 
	//		Builds a regular expression that matches an integer

	// assign default values to missing paramters
	flags = flags || {};
	if(!("signed" in flags)){ flags.signed = [true, false]; }
	if(!("separator" in flags)){
		flags.separator = "";
	}else if(!("groupSize" in flags)){
		flags.groupSize = 3;
	}
	// build sign RE
	var signRE = dojo.regexp.buildGroupRE(flags.signed,
		function(q){ return q ? "[-+]" : ""; },
		true
	);

	// number RE
	var numberRE = dojo.regexp.buildGroupRE(flags.separator,
		function(sep){
			if(!sep){
				return "(?:\\d+)";
			}

			sep = dojo.regexp.escapeString(sep);
			if(sep == " "){ sep = "\\s"; }
			else if(sep == "\xa0"){ sep = "\\s\\xa0"; }

			var grp = flags.groupSize, grp2 = flags.groupSize2;
			//TODO: should we continue to enforce that numbers with separators begin with 1-9?  See #6933
			if(grp2){
				var grp2RE = "(?:0|[1-9]\\d{0," + (grp2-1) + "}(?:[" + sep + "]\\d{" + grp2 + "})*[" + sep + "]\\d{" + grp + "})";
				return ((grp-grp2) > 0) ? "(?:" + grp2RE + "|(?:0|[1-9]\\d{0," + (grp-1) + "}))" : grp2RE;
			}
			return "(?:0|[1-9]\\d{0," + (grp-1) + "}(?:[" + sep + "]\\d{" + grp + "})*)";
		},
		true
	);

	// integer RE
	return signRE + numberRE; // String
}

}

if(!dojo._hasResource["dijit.ProgressBar"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.ProgressBar"] = true;
dojo.provide("dijit.ProgressBar");







dojo.declare("dijit.ProgressBar", [dijit._Widget, dijit._Templated], {
	// summary:
	//		A progress indication widget, showing the amount completed
	//		(often the percentage completed) of a task.
	//
	// example:
	// |	<div dojoType="ProgressBar"
	// |		 places="0"
	// |		 progress="..." maximum="...">
	// |	</div>
	//
	// description:
	//		Note that the progress bar is updated via (a non-standard)
	//		update() method, rather than via attr() like other widgets.

	// progress: [const] String (Percentage or Number)
	//		Number or percentage indicating amount of task completed.
	// 		With "%": percentage value, 0% <= progress <= 100%, or
	// 		without "%": absolute value, 0 <= progress <= maximum
	// TODO: rename to value for 2.0
	progress: "0",

	// maximum: [const] Float
	//		Max sample number
	maximum: 100,

	// places: [const] Number
	//		Number of places to show in values; 0 by default
	places: 0,

	// indeterminate: [const] Boolean
	// 		If false: show progress value (number or percentage).
	// 		If true: show that a process is underway but that the amount completed is unknown.
	indeterminate: false,

	// name: String
	//		this is the field name (for a form) if set. This needs to be set if you want to use
	//		this widget in a dijit.form.Form widget (such as dijit.Dialog)
	name: '',

	templateString: dojo.cache("dijit", "templates/ProgressBar.html", "<div class=\"dijitProgressBar dijitProgressBarEmpty\"\n\t><div waiRole=\"progressbar\" dojoAttachPoint=\"internalProgress\" class=\"dijitProgressBarFull\"\n\t\t><div class=\"dijitProgressBarTile\"></div\n\t\t><span style=\"visibility:hidden\">&nbsp;</span\n\t></div\n\t><div dojoAttachPoint=\"label\" class=\"dijitProgressBarLabel\" id=\"${id}_label\">&nbsp;</div\n\t><img dojoAttachPoint=\"indeterminateHighContrastImage\" class=\"dijitProgressBarIndeterminateHighContrastImage\" alt=\"\"\n\t></img\n></div>\n"),

	// _indeterminateHighContrastImagePath: [private] dojo._URL
	//		URL to image to use for indeterminate progress bar when display is in high contrast mode
	_indeterminateHighContrastImagePath:
		dojo.moduleUrl("dijit", "themes/a11y/indeterminate_progress.gif"),

	// public functions
	postCreate: function(){
		this.inherited(arguments);
		this.indeterminateHighContrastImage.setAttribute("src",
			this._indeterminateHighContrastImagePath.toString());
		this.update();
	},

	update: function(/*Object?*/attributes){
		// summary:
		//		Change attributes of ProgressBar, similar to attr(hash).
		//
		// attributes:
		//		May provide progress and/or maximum properties on this parameter;
		//		see attribute specs for details.
		//
		// example:
		//	|	myProgressBar.update({'indeterminate': true});
		//	|	myProgressBar.update({'progress': 80});

		// TODO: deprecate this method and use attr() instead

		dojo.mixin(this, attributes || {});
		var tip = this.internalProgress;
		var percent = 1, classFunc;
		if(this.indeterminate){
			classFunc = "addClass";
			dijit.removeWaiState(tip, "valuenow");
			dijit.removeWaiState(tip, "valuemin");
			dijit.removeWaiState(tip, "valuemax");
		}else{
			classFunc = "removeClass";
			if(String(this.progress).indexOf("%") != -1){
				percent = Math.min(parseFloat(this.progress)/100, 1);
				this.progress = percent * this.maximum;
			}else{
				this.progress = Math.min(this.progress, this.maximum);
				percent = this.progress / this.maximum;
			}
			var text = this.report(percent);
			this.label.firstChild.nodeValue = text;
			dijit.setWaiState(tip, "describedby", this.label.id);
			dijit.setWaiState(tip, "valuenow", this.progress);
			dijit.setWaiState(tip, "valuemin", 0);
			dijit.setWaiState(tip, "valuemax", this.maximum);
		}
		dojo[classFunc](this.domNode, "dijitProgressBarIndeterminate");
		tip.style.width = (percent * 100) + "%";
		this.onChange();
	},

	_setValueAttr: function(v){
		if(v == Infinity){
			this.update({indeterminate:true});
		}else{
			this.update({indeterminate:false, progress:v});
		}
	},

	_getValueAttr: function(){
		return this.progress;
	},

	report: function(/*float*/percent){
		// summary:
		//		Generates message to show inside progress bar (normally indicating amount of task completed).
		//		May be overridden.
		// tags:
		//		extension

		return dojo.number.format(percent, { type: "percent", places: this.places, locale: this.lang });
	},

	onChange: function(){
		// summary:
		//		Callback fired when progress updates.
		// tags:
		//		progress
	}
});

}

if(!dojo._hasResource["dojo.dnd.common"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.dnd.common"] = true;
dojo.provide("dojo.dnd.common");

dojo.dnd.getCopyKeyState = dojo.isCopyKeyPressed;

dojo.dnd._uniqueId = 0;
dojo.dnd.getUniqueId = function(){
	// summary:
	//		returns a unique string for use with any DOM element
	var id;
	do{
		id = dojo._scopeName + "Unique" + (++dojo.dnd._uniqueId);
	}while(dojo.byId(id));
	return id;
};

dojo.dnd._empty = {};

dojo.dnd.isFormElement = function(/*Event*/ e){
	// summary:
	//		returns true if user clicked on a form element
	var t = e.target;
	if(t.nodeType == 3 /*TEXT_NODE*/){
		t = t.parentNode;
	}
	return " button textarea input select option ".indexOf(" " + t.tagName.toLowerCase() + " ") >= 0;	// Boolean
};

}

if(!dojo._hasResource["dojo.dnd.autoscroll"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.dnd.autoscroll"] = true;
dojo.provide("dojo.dnd.autoscroll");

dojo.dnd.getViewport = function(){
	// summary:
	//		Returns a viewport size (visible part of the window)

	// TODO: remove this when getViewport() moved to dojo core, see #7028

	// FIXME: need more docs!!
	var d = dojo.doc, dd = d.documentElement, w = window, b = dojo.body();
	if(dojo.isMozilla){
		return {w: dd.clientWidth, h: w.innerHeight};	// Object
	}else if(!dojo.isOpera && w.innerWidth){
		return {w: w.innerWidth, h: w.innerHeight};		// Object
	}else if (!dojo.isOpera && dd && dd.clientWidth){
		return {w: dd.clientWidth, h: dd.clientHeight};	// Object
	}else if (b.clientWidth){
		return {w: b.clientWidth, h: b.clientHeight};	// Object
	}
	return null;	// Object
};

dojo.dnd.V_TRIGGER_AUTOSCROLL = 32;
dojo.dnd.H_TRIGGER_AUTOSCROLL = 32;

dojo.dnd.V_AUTOSCROLL_VALUE = 16;
dojo.dnd.H_AUTOSCROLL_VALUE = 16;

dojo.dnd.autoScroll = function(e){
	// summary:
	//		a handler for onmousemove event, which scrolls the window, if
	//		necesary
	// e: Event
	//		onmousemove event

	// FIXME: needs more docs!
	var v = dojo.dnd.getViewport(), dx = 0, dy = 0;
	if(e.clientX < dojo.dnd.H_TRIGGER_AUTOSCROLL){
		dx = -dojo.dnd.H_AUTOSCROLL_VALUE;
	}else if(e.clientX > v.w - dojo.dnd.H_TRIGGER_AUTOSCROLL){
		dx = dojo.dnd.H_AUTOSCROLL_VALUE;
	}
	if(e.clientY < dojo.dnd.V_TRIGGER_AUTOSCROLL){
		dy = -dojo.dnd.V_AUTOSCROLL_VALUE;
	}else if(e.clientY > v.h - dojo.dnd.V_TRIGGER_AUTOSCROLL){
		dy = dojo.dnd.V_AUTOSCROLL_VALUE;
	}
	window.scrollBy(dx, dy);
};

dojo.dnd._validNodes = {"div": 1, "p": 1, "td": 1};
dojo.dnd._validOverflow = {"auto": 1, "scroll": 1};

dojo.dnd.autoScrollNodes = function(e){
	// summary:
	//		a handler for onmousemove event, which scrolls the first avaialble
	//		Dom element, it falls back to dojo.dnd.autoScroll()
	// e: Event
	//		onmousemove event

	// FIXME: needs more docs!
	for(var n = e.target; n;){
		if(n.nodeType == 1 && (n.tagName.toLowerCase() in dojo.dnd._validNodes)){
			var s = dojo.getComputedStyle(n);
			if(s.overflow.toLowerCase() in dojo.dnd._validOverflow){
				var b = dojo._getContentBox(n, s), t = dojo.position(n, true);
				//console.log(b.l, b.t, t.x, t.y, n.scrollLeft, n.scrollTop);
				var w = Math.min(dojo.dnd.H_TRIGGER_AUTOSCROLL, b.w / 2), 
					h = Math.min(dojo.dnd.V_TRIGGER_AUTOSCROLL, b.h / 2),
					rx = e.pageX - t.x, ry = e.pageY - t.y, dx = 0, dy = 0;
				if(dojo.isWebKit || dojo.isOpera){
					// FIXME: this code should not be here, it should be taken into account 
					// either by the event fixing code, or the dojo.position()
					// FIXME: this code doesn't work on Opera 9.5 Beta
					rx += dojo.body().scrollLeft, ry += dojo.body().scrollTop;
				}
				if(rx > 0 && rx < b.w){
					if(rx < w){
						dx = -w;
					}else if(rx > b.w - w){
						dx = w;
					}
				}
				//console.log("ry =", ry, "b.h =", b.h, "h =", h);
				if(ry > 0 && ry < b.h){
					if(ry < h){
						dy = -h;
					}else if(ry > b.h - h){
						dy = h;
					}
				}
				var oldLeft = n.scrollLeft, oldTop = n.scrollTop;
				n.scrollLeft = n.scrollLeft + dx;
				n.scrollTop  = n.scrollTop  + dy;
				if(oldLeft != n.scrollLeft || oldTop != n.scrollTop){ return; }
			}
		}
		try{
			n = n.parentNode;
		}catch(x){
			n = null;
		}
	}
	dojo.dnd.autoScroll(e);
};

}

if(!dojo._hasResource["dojo.dnd.Mover"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.dnd.Mover"] = true;
dojo.provide("dojo.dnd.Mover");




dojo.declare("dojo.dnd.Mover", null, {
	constructor: function(node, e, host){
		// summary:
		//		an object, which makes a node follow the mouse. 
		//		Used as a default mover, and as a base class for custom movers.
		// node: Node
		//		a node (or node's id) to be moved
		// e: Event
		//		a mouse event, which started the move;
		//		only pageX and pageY properties are used
		// host: Object?
		//		object which implements the functionality of the move,
		//	 	and defines proper events (onMoveStart and onMoveStop)
		this.node = dojo.byId(node);
		this.marginBox = {l: e.pageX, t: e.pageY};
		this.mouseButton = e.button;
		var h = this.host = host, d = node.ownerDocument, 
			firstEvent = dojo.connect(d, "onmousemove", this, "onFirstMove");
		this.events = [
			dojo.connect(d, "onmousemove", this, "onMouseMove"),
			dojo.connect(d, "onmouseup",   this, "onMouseUp"),
			// cancel text selection and text dragging
			dojo.connect(d, "ondragstart",   dojo.stopEvent),
			dojo.connect(d.body, "onselectstart", dojo.stopEvent),
			firstEvent
		];
		// notify that the move has started
		if(h && h.onMoveStart){
			h.onMoveStart(this);
		}
	},
	// mouse event processors
	onMouseMove: function(e){
		// summary:
		//		event processor for onmousemove
		// e: Event
		//		mouse event
		dojo.dnd.autoScroll(e);
		var m = this.marginBox;
		this.host.onMove(this, {l: m.l + e.pageX, t: m.t + e.pageY});
		dojo.stopEvent(e);
	},
	onMouseUp: function(e){
		if(dojo.isWebKit && dojo.isMac && this.mouseButton == 2 ? 
				e.button == 0 : this.mouseButton == e.button){
			this.destroy();
		}
		dojo.stopEvent(e);
	},
	// utilities
	onFirstMove: function(){
		// summary:
		//		makes the node absolute; it is meant to be called only once. 
		// 		relative and absolutely positioned nodes are assumed to use pixel units
		var s = this.node.style, l, t, h = this.host;
		switch(s.position){
			case "relative":
			case "absolute":
				// assume that left and top values are in pixels already
				l = Math.round(parseFloat(s.left));
				t = Math.round(parseFloat(s.top));
				break;
			default:
				s.position = "absolute";	// enforcing the absolute mode
				var m = dojo.marginBox(this.node);
				// event.pageX/pageY (which we used to generate the initial
				// margin box) includes padding and margin set on the body.
				// However, setting the node's position to absolute and then
				// doing dojo.marginBox on it *doesn't* take that additional
				// space into account - so we need to subtract the combined
				// padding and margin.  We use getComputedStyle and
				// _getMarginBox/_getContentBox to avoid the extra lookup of
				// the computed style. 
				var b = dojo.doc.body;
				var bs = dojo.getComputedStyle(b);
				var bm = dojo._getMarginBox(b, bs);
				var bc = dojo._getContentBox(b, bs);
				l = m.l - (bc.l - bm.l);
				t = m.t - (bc.t - bm.t);
				break;
		}
		this.marginBox.l = l - this.marginBox.l;
		this.marginBox.t = t - this.marginBox.t;
		if(h && h.onFirstMove){
			h.onFirstMove(this);
		}
		dojo.disconnect(this.events.pop());
	},
	destroy: function(){
		// summary:
		//		stops the move, deletes all references, so the object can be garbage-collected
		dojo.forEach(this.events, dojo.disconnect);
		// undo global settings
		var h = this.host;
		if(h && h.onMoveStop){
			h.onMoveStop(this);
		}
		// destroy objects
		this.events = this.node = this.host = null;
	}
});

}

if(!dojo._hasResource["dojo.dnd.Moveable"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.dnd.Moveable"] = true;
dojo.provide("dojo.dnd.Moveable");



/*=====
dojo.declare("dojo.dnd.__MoveableArgs", [], {
	// handle: Node||String
	//		A node (or node's id), which is used as a mouse handle.
	//		If omitted, the node itself is used as a handle.
	handle: null,

	// delay: Number
	//		delay move by this number of pixels
	delay: 0,

	// skip: Boolean
	//		skip move of form elements
	skip: false,

	// mover: Object
	//		a constructor of custom Mover
	mover: dojo.dnd.Mover
});
=====*/

dojo.declare("dojo.dnd.Moveable", null, {
	// object attributes (for markup)
	handle: "",
	delay: 0,
	skip: false,
	
	constructor: function(node, params){
		// summary:
		//		an object, which makes a node moveable
		// node: Node
		//		a node (or node's id) to be moved
		// params: dojo.dnd.__MoveableArgs?
		//		optional parameters
		this.node = dojo.byId(node);
		if(!params){ params = {}; }
		this.handle = params.handle ? dojo.byId(params.handle) : null;
		if(!this.handle){ this.handle = this.node; }
		this.delay = params.delay > 0 ? params.delay : 0;
		this.skip  = params.skip;
		this.mover = params.mover ? params.mover : dojo.dnd.Mover;
		this.events = [
			dojo.connect(this.handle, "onmousedown", this, "onMouseDown"),
			// cancel text selection and text dragging
			dojo.connect(this.handle, "ondragstart",   this, "onSelectStart"),
			dojo.connect(this.handle, "onselectstart", this, "onSelectStart")
		];
	},

	// markup methods
	markupFactory: function(params, node){
		return new dojo.dnd.Moveable(node, params);
	},

	// methods
	destroy: function(){
		// summary:
		//		stops watching for possible move, deletes all references, so the object can be garbage-collected
		dojo.forEach(this.events, dojo.disconnect);
		this.events = this.node = this.handle = null;
	},
	
	// mouse event processors
	onMouseDown: function(e){
		// summary:
		//		event processor for onmousedown, creates a Mover for the node
		// e: Event
		//		mouse event
		if(this.skip && dojo.dnd.isFormElement(e)){ return; }
		if(this.delay){
			this.events.push(
				dojo.connect(this.handle, "onmousemove", this, "onMouseMove"),
				dojo.connect(this.handle, "onmouseup", this, "onMouseUp")
			);
			this._lastX = e.pageX;
			this._lastY = e.pageY;
		}else{
			this.onDragDetected(e);
		}
		dojo.stopEvent(e);
	},
	onMouseMove: function(e){
		// summary:
		//		event processor for onmousemove, used only for delayed drags
		// e: Event
		//		mouse event
		if(Math.abs(e.pageX - this._lastX) > this.delay || Math.abs(e.pageY - this._lastY) > this.delay){
			this.onMouseUp(e);
			this.onDragDetected(e);
		}
		dojo.stopEvent(e);
	},
	onMouseUp: function(e){
		// summary:
		//		event processor for onmouseup, used only for delayed drags
		// e: Event
		//		mouse event
		for(var i = 0; i < 2; ++i){
			dojo.disconnect(this.events.pop());
		}
		dojo.stopEvent(e);
	},
	onSelectStart: function(e){
		// summary:
		//		event processor for onselectevent and ondragevent
		// e: Event
		//		mouse event
		if(!this.skip || !dojo.dnd.isFormElement(e)){
			dojo.stopEvent(e);
		}
	},
	
	// local events
	onDragDetected: function(/* Event */ e){
		// summary:
		//		called when the drag is detected;
		//		responsible for creation of the mover
		new this.mover(this.node, e, this);
	},
	onMoveStart: function(/* dojo.dnd.Mover */ mover){
		// summary:
		//		called before every move operation
		dojo.publish("/dnd/move/start", [mover]);
		dojo.addClass(dojo.body(), "dojoMove"); 
		dojo.addClass(this.node, "dojoMoveItem"); 
	},
	onMoveStop: function(/* dojo.dnd.Mover */ mover){
		// summary:
		//		called after every move operation
		dojo.publish("/dnd/move/stop", [mover]);
		dojo.removeClass(dojo.body(), "dojoMove");
		dojo.removeClass(this.node, "dojoMoveItem");
	},
	onFirstMove: function(/* dojo.dnd.Mover */ mover){
		// summary:
		//		called during the very first move notification;
		//		can be used to initialize coordinates, can be overwritten.
		
		// default implementation does nothing
	},
	onMove: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
		// summary:
		//		called during every move notification;
		//		should actually move the node; can be overwritten.
		this.onMoving(mover, leftTop);
		var s = mover.node.style;
		s.left = leftTop.l + "px";
		s.top  = leftTop.t + "px";
		this.onMoved(mover, leftTop);
	},
	onMoving: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
		// summary:
		//		called before every incremental move; can be overwritten.
		
		// default implementation does nothing
	},
	onMoved: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
		// summary:
		//		called after every incremental move; can be overwritten.
		
		// default implementation does nothing
	}
});

}

if(!dojo._hasResource["dojo.dnd.move"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.dnd.move"] = true;
dojo.provide("dojo.dnd.move");




/*=====
dojo.declare("dojo.dnd.move.__constrainedMoveableArgs", [dojo.dnd.__MoveableArgs], {
	// constraints: Function
	//		Calculates a constraint box.
	//		It is called in a context of the moveable object.
	constraints: function(){},

	// within: Boolean
	//		restrict move within boundaries.
	within: false
});
=====*/

dojo.declare("dojo.dnd.move.constrainedMoveable", dojo.dnd.Moveable, {
	// object attributes (for markup)
	constraints: function(){},
	within: false,
	
	// markup methods
	markupFactory: function(params, node){
		return new dojo.dnd.move.constrainedMoveable(node, params);
	},

	constructor: function(node, params){
		// summary:
		//		an object that makes a node moveable
		// node: Node
		//		a node (or node's id) to be moved
		// params: dojo.dnd.move.__constrainedMoveableArgs?
		//		an optional object with additional parameters;
		//		the rest is passed to the base class
		if(!params){ params = {}; }
		this.constraints = params.constraints;
		this.within = params.within;
	},
	onFirstMove: function(/* dojo.dnd.Mover */ mover){
		// summary:
		//		called during the very first move notification;
		//		can be used to initialize coordinates, can be overwritten.
		var c = this.constraintBox = this.constraints.call(this, mover);
		c.r = c.l + c.w;
		c.b = c.t + c.h;
		if(this.within){
			var mb = dojo.marginBox(mover.node);
			c.r -= mb.w;
			c.b -= mb.h;
		}
	},
	onMove: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
		// summary:
		//		called during every move notification;
		//		should actually move the node; can be overwritten.
		var c = this.constraintBox, s = mover.node.style;
		s.left = (leftTop.l < c.l ? c.l : c.r < leftTop.l ? c.r : leftTop.l) + "px";
		s.top  = (leftTop.t < c.t ? c.t : c.b < leftTop.t ? c.b : leftTop.t) + "px";
	}
});

/*=====
dojo.declare("dojo.dnd.move.__boxConstrainedMoveableArgs", [dojo.dnd.move.__constrainedMoveableArgs], {
	// box: Object
	//		a constraint box
	box: {}
});
=====*/

dojo.declare("dojo.dnd.move.boxConstrainedMoveable", dojo.dnd.move.constrainedMoveable, {
	// box:
	//		object attributes (for markup)
	box: {},
	
	// markup methods
	markupFactory: function(params, node){
		return new dojo.dnd.move.boxConstrainedMoveable(node, params);
	},

	constructor: function(node, params){
		// summary:
		//		an object, which makes a node moveable
		// node: Node
		//		a node (or node's id) to be moved
		// params: dojo.dnd.move.__boxConstrainedMoveableArgs?
		//		an optional object with parameters
		var box = params && params.box;
		this.constraints = function(){ return box; };
	}
});

/*=====
dojo.declare("dojo.dnd.move.__parentConstrainedMoveableArgs", [dojo.dnd.move.__constrainedMoveableArgs], {
	// area: String
	//		A parent's area to restrict the move.
	//		Can be "margin", "border", "padding", or "content".
	area: ""
});
=====*/

dojo.declare("dojo.dnd.move.parentConstrainedMoveable", dojo.dnd.move.constrainedMoveable, {
	// area:
	//		object attributes (for markup)
	area: "content",

	// markup methods
	markupFactory: function(params, node){
		return new dojo.dnd.move.parentConstrainedMoveable(node, params);
	},

	constructor: function(node, params){
		// summary:
		//		an object, which makes a node moveable
		// node: Node
		//		a node (or node's id) to be moved
		// params: dojo.dnd.move.__parentConstrainedMoveableArgs?
		//		an optional object with parameters
		var area = params && params.area;
		this.constraints = function(){
			var n = this.node.parentNode, 
				s = dojo.getComputedStyle(n), 
				mb = dojo._getMarginBox(n, s);
			if(area == "margin"){
				return mb;	// Object
			}
			var t = dojo._getMarginExtents(n, s);
			mb.l += t.l, mb.t += t.t, mb.w -= t.w, mb.h -= t.h;
			if(area == "border"){
				return mb;	// Object
			}
			t = dojo._getBorderExtents(n, s);
			mb.l += t.l, mb.t += t.t, mb.w -= t.w, mb.h -= t.h;
			if(area == "padding"){
				return mb;	// Object
			}
			t = dojo._getPadExtents(n, s);
			mb.l += t.l, mb.t += t.t, mb.w -= t.w, mb.h -= t.h;
			return mb;	// Object
		};
	}
});

// WARNING: below are obsolete objects, instead of custom movers use custom moveables (above)

dojo.dnd.move.constrainedMover = function(fun, within){
	// summary:
	//		returns a constrained version of dojo.dnd.Mover
	// description:
	//		this function produces n object, which will put a constraint on 
	//		the margin box of dragged object in absolute coordinates
	// fun: Function
	//		called on drag, and returns a constraint box
	// within: Boolean
	//		if true, constraints the whole dragged object withtin the rectangle, 
	//		otherwise the constraint is applied to the left-top corner

	dojo.deprecated("dojo.dnd.move.constrainedMover, use dojo.dnd.move.constrainedMoveable instead");
	var mover = function(node, e, notifier){
		dojo.dnd.Mover.call(this, node, e, notifier);
	};
	dojo.extend(mover, dojo.dnd.Mover.prototype);
	dojo.extend(mover, {
		onMouseMove: function(e){
			// summary: event processor for onmousemove
			// e: Event: mouse event
			dojo.dnd.autoScroll(e);
			var m = this.marginBox, c = this.constraintBox,
				l = m.l + e.pageX, t = m.t + e.pageY;
			l = l < c.l ? c.l : c.r < l ? c.r : l;
			t = t < c.t ? c.t : c.b < t ? c.b : t;
			this.host.onMove(this, {l: l, t: t});
		},
		onFirstMove: function(){
			// summary: called once to initialize things; it is meant to be called only once
			dojo.dnd.Mover.prototype.onFirstMove.call(this);
			var c = this.constraintBox = fun.call(this);
			c.r = c.l + c.w;
			c.b = c.t + c.h;
			if(within){
				var mb = dojo.marginBox(this.node);
				c.r -= mb.w;
				c.b -= mb.h;
			}
		}
	});
	return mover;	// Object
};

dojo.dnd.move.boxConstrainedMover = function(box, within){
	// summary:
	//		a specialization of dojo.dnd.constrainedMover, which constrains to the specified box
	// box: Object
	//		a constraint box (l, t, w, h)
	// within: Boolean
	//		if true, constraints the whole dragged object withtin the rectangle, 
	//		otherwise the constraint is applied to the left-top corner

	dojo.deprecated("dojo.dnd.move.boxConstrainedMover, use dojo.dnd.move.boxConstrainedMoveable instead");
	return dojo.dnd.move.constrainedMover(function(){ return box; }, within);	// Object
};

dojo.dnd.move.parentConstrainedMover = function(area, within){
	// summary:
	//		a specialization of dojo.dnd.constrainedMover, which constrains to the parent node
	// area: String
	//		"margin" to constrain within the parent's margin box, "border" for the border box,
	//		"padding" for the padding box, and "content" for the content box; "content" is the default value.
	// within: Boolean
	//		if true, constraints the whole dragged object within the rectangle, 
	//		otherwise the constraint is applied to the left-top corner

	dojo.deprecated("dojo.dnd.move.parentConstrainedMover, use dojo.dnd.move.parentConstrainedMoveable instead");
	var fun = function(){
		var n = this.node.parentNode, 
			s = dojo.getComputedStyle(n), 
			mb = dojo._getMarginBox(n, s);
		if(area == "margin"){
			return mb;	// Object
		}
		var t = dojo._getMarginExtents(n, s);
		mb.l += t.l, mb.t += t.t, mb.w -= t.w, mb.h -= t.h;
		if(area == "border"){
			return mb;	// Object
		}
		t = dojo._getBorderExtents(n, s);
		mb.l += t.l, mb.t += t.t, mb.w -= t.w, mb.h -= t.h;
		if(area == "padding"){
			return mb;	// Object
		}
		t = dojo._getPadExtents(n, s);
		mb.l += t.l, mb.t += t.t, mb.w -= t.w, mb.h -= t.h;
		return mb;	// Object
	};
	return dojo.dnd.move.constrainedMover(fun, within);	// Object
};

// patching functions one level up for compatibility

dojo.dnd.constrainedMover = dojo.dnd.move.constrainedMover;
dojo.dnd.boxConstrainedMover = dojo.dnd.move.boxConstrainedMover;
dojo.dnd.parentConstrainedMover = dojo.dnd.move.parentConstrainedMover;

}

if(!dojo._hasResource["dojo.dnd.TimedMoveable"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.dnd.TimedMoveable"] = true;
dojo.provide("dojo.dnd.TimedMoveable");



/*=====
dojo.declare("dojo.dnd.__TimedMoveableArgs", [dojo.dnd.__MoveableArgs], {
	// timeout: Number
	//		delay move by this number of ms,
	//		accumulating position changes during the timeout
	timeout: 0
});
=====*/

(function(){
	// precalculate long expressions
	var oldOnMove = dojo.dnd.Moveable.prototype.onMove;
		
	dojo.declare("dojo.dnd.TimedMoveable", dojo.dnd.Moveable, {
		// summary:
		//		A specialized version of Moveable to support an FPS throttling.
		//		This class puts an upper restriction on FPS, which may reduce 
		//		the CPU load. The additional parameter "timeout" regulates
		//		the delay before actually moving the moveable object.
		
		// object attributes (for markup)
		timeout: 40,	// in ms, 40ms corresponds to 25 fps
	
		constructor: function(node, params){
			// summary:
			//		an object that makes a node moveable with a timer
			// node: Node||String
			//		a node (or node's id) to be moved
			// params: dojo.dnd.__TimedMoveableArgs
			//		object with additional parameters.
			
			// sanitize parameters
			if(!params){ params = {}; }
			if(params.timeout && typeof params.timeout == "number" && params.timeout >= 0){
				this.timeout = params.timeout;
			}
		},
	
		// markup methods
		markupFactory: function(params, node){
			return new dojo.dnd.TimedMoveable(node, params);
		},
	
		onMoveStop: function(/* dojo.dnd.Mover */ mover){
			if(mover._timer){
				// stop timer
				clearTimeout(mover._timer)
				// reflect the last received position
				oldOnMove.call(this, mover, mover._leftTop)
			}
			dojo.dnd.Moveable.prototype.onMoveStop.apply(this, arguments);
		},
		onMove: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
			mover._leftTop = leftTop;
			if(!mover._timer){
				var _t = this;	// to avoid using dojo.hitch()
				mover._timer = setTimeout(function(){
					// we don't have any pending requests
					mover._timer = null;
					// reflect the last received position
					oldOnMove.call(_t, mover, mover._leftTop);
				}, this.timeout);
			}
		}
	});
})();

}

if(!dojo._hasResource["dijit.form._FormMixin"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.form._FormMixin"] = true;
dojo.provide("dijit.form._FormMixin");

dojo.declare("dijit.form._FormMixin", null,
	{
	// summary:
	//		Mixin for containers of form widgets (i.e. widgets that represent a single value
	//		and can be children of a <form> node or dijit.form.Form widget)
	// description:
	//		Can extract all the form widgets
	//		values and combine them into a single javascript object, or alternately
	//		take such an object and set the values for all the contained
	//		form widgets

/*=====
    // value: Object
	//		Name/value hash for each form element.
	//		If there are multiple elements w/the same name, value is an array,
	//		unless they are radio buttons in which case value is a scalar since only
	//		one can be checked at a time.
	//
	//		If the name is a dot separated list (like a.b.c.d), it's a nested structure.
	//		Only works on widget form elements.
	// example:
	//	| { name: "John Smith", interests: ["sports", "movies"] }
=====*/

	//	TODO:
	//	* Repeater
	//	* better handling for arrays.  Often form elements have names with [] like
	//	* people[3].sex (for a list of people [{name: Bill, sex: M}, ...])
	//
	//

		reset: function(){
			dojo.forEach(this.getDescendants(), function(widget){
				if(widget.reset){
					widget.reset();
				}
			});
		},

		validate: function(){
			// summary:
			//		returns if the form is valid - same as isValid - but
			//			provides a few additional (ui-specific) features.
			//			1 - it will highlight any sub-widgets that are not
			//				valid
			//			2 - it will call focus() on the first invalid
			//				sub-widget
			var didFocus = false;
			return dojo.every(dojo.map(this.getDescendants(), function(widget){
				// Need to set this so that "required" widgets get their
				// state set.
				widget._hasBeenBlurred = true;
				var valid = widget.disabled || !widget.validate || widget.validate();
				if(!valid && !didFocus){
					// Set focus of the first non-valid widget
					dijit.scrollIntoView(widget.containerNode || widget.domNode);
					widget.focus();
					didFocus = true;
				}
	 			return valid;
	 		}), function(item){ return item; });
		},

		setValues: function(val){
			dojo.deprecated(this.declaredClass+"::setValues() is deprecated. Use attr('value', val) instead.", "", "2.0");
			return this.attr('value', val);
		},
		_setValueAttr: function(/*object*/obj){
			// summary:
			//		Fill in form values from according to an Object (in the format returned by attr('value'))

			// generate map from name --> [list of widgets with that name]
			var map = { };
			dojo.forEach(this.getDescendants(), function(widget){
				if(!widget.name){ return; }
				var entry = map[widget.name] || (map[widget.name] = [] );
				entry.push(widget);
			});

			for(var name in map){
				if(!map.hasOwnProperty(name)){
					continue;
				}
				var widgets = map[name],						// array of widgets w/this name
					values = dojo.getObject(name, false, obj);	// list of values for those widgets

				if(values === undefined){
					continue;
				}
				if(!dojo.isArray(values)){
					values = [ values ];
				}
				if(typeof widgets[0].checked == 'boolean'){
					// for checkbox/radio, values is a list of which widgets should be checked
					dojo.forEach(widgets, function(w, i){
						w.attr('value', dojo.indexOf(values, w.value) != -1);
					});
				}else if(widgets[0].multiple){
					// it takes an array (e.g. multi-select)
					widgets[0].attr('value', values);
				}else{
					// otherwise, values is a list of values to be assigned sequentially to each widget
					dojo.forEach(widgets, function(w, i){
						w.attr('value', values[i]);
					});
				}
			}

			/***
			 * 	TODO: code for plain input boxes (this shouldn't run for inputs that are part of widgets)

			dojo.forEach(this.containerNode.elements, function(element){
				if(element.name == ''){return};	// like "continue"
				var namePath = element.name.split(".");
				var myObj=obj;
				var name=namePath[namePath.length-1];
				for(var j=1,len2=namePath.length;j<len2;++j){
					var p=namePath[j - 1];
					// repeater support block
					var nameA=p.split("[");
					if(nameA.length > 1){
						if(typeof(myObj[nameA[0]]) == "undefined"){
							myObj[nameA[0]]=[ ];
						} // if

						nameIndex=parseInt(nameA[1]);
						if(typeof(myObj[nameA[0]][nameIndex]) == "undefined"){
							myObj[nameA[0]][nameIndex] = { };
						}
						myObj=myObj[nameA[0]][nameIndex];
						continue;
					} // repeater support ends

					if(typeof(myObj[p]) == "undefined"){
						myObj=undefined;
						break;
					};
					myObj=myObj[p];
				}

				if(typeof(myObj) == "undefined"){
					return;		// like "continue"
				}
				if(typeof(myObj[name]) == "undefined" && this.ignoreNullValues){
					return;		// like "continue"
				}

				// TODO: widget values (just call attr('value', ...) on the widget)

				// TODO: maybe should call dojo.getNodeProp() instead
				switch(element.type){
					case "checkbox":
						element.checked = (name in myObj) &&
							dojo.some(myObj[name], function(val){ return val == element.value; });
						break;
					case "radio":
						element.checked = (name in myObj) && myObj[name] == element.value;
						break;
					case "select-multiple":
						element.selectedIndex=-1;
						dojo.forEach(element.options, function(option){
							option.selected = dojo.some(myObj[name], function(val){ return option.value == val; });
						});
						break;
					case "select-one":
						element.selectedIndex="0";
						dojo.forEach(element.options, function(option){
							option.selected = option.value == myObj[name];
						});
						break;
					case "hidden":
					case "text":
					case "textarea":
					case "password":
						element.value = myObj[name] || "";
						break;
				}
	  		});
	  		*/
		},

		getValues: function(){
			dojo.deprecated(this.declaredClass+"::getValues() is deprecated. Use attr('value') instead.", "", "2.0");
			return this.attr('value');
		},
		_getValueAttr: function(){
			// summary:
			// 		Returns Object representing form values.
			// description:
			//		Returns name/value hash for each form element.
			//		If there are multiple elements w/the same name, value is an array,
			//		unless they are radio buttons in which case value is a scalar since only
			//		one can be checked at a time.
			//
			//		If the name is a dot separated list (like a.b.c.d), creates a nested structure.
			//		Only works on widget form elements.
			// example:
			//		| { name: "John Smith", interests: ["sports", "movies"] }

			// get widget values
			var obj = { };
			dojo.forEach(this.getDescendants(), function(widget){
				var name = widget.name;
				if(!name || widget.disabled){ return; }

				// Single value widget (checkbox, radio, or plain <input> type widget
				var value = widget.attr('value');

				// Store widget's value(s) as a scalar, except for checkboxes which are automatically arrays
				if(typeof widget.checked == 'boolean'){
					if(/Radio/.test(widget.declaredClass)){
						// radio button
						if(value !== false){
							dojo.setObject(name, value, obj);
						}else{
							// give radio widgets a default of null
							value = dojo.getObject(name, false, obj);
							if(value === undefined){
								dojo.setObject(name, null, obj);
							}
						}
					}else{
						// checkbox/toggle button
						var ary=dojo.getObject(name, false, obj);
						if(!ary){
							ary=[];
							dojo.setObject(name, ary, obj);
						}
						if(value !== false){
							ary.push(value);
						}
					}
				}else{
					var prev=dojo.getObject(name, false, obj);
					if(typeof prev != "undefined"){
						if(dojo.isArray(prev)){
							prev.push(value);
						}else{
							dojo.setObject(name, [prev, value], obj);
						}
					}else{
						// unique name
						dojo.setObject(name, value, obj);
					}
				}
			});

			/***
			 * code for plain input boxes (see also dojo.formToObject, can we use that instead of this code?
			 * but it doesn't understand [] notation, presumably)
			var obj = { };
			dojo.forEach(this.containerNode.elements, function(elm){
				if(!elm.name)	{
					return;		// like "continue"
				}
				var namePath = elm.name.split(".");
				var myObj=obj;
				var name=namePath[namePath.length-1];
				for(var j=1,len2=namePath.length;j<len2;++j){
					var nameIndex = null;
					var p=namePath[j - 1];
					var nameA=p.split("[");
					if(nameA.length > 1){
						if(typeof(myObj[nameA[0]]) == "undefined"){
							myObj[nameA[0]]=[ ];
						} // if
						nameIndex=parseInt(nameA[1]);
						if(typeof(myObj[nameA[0]][nameIndex]) == "undefined"){
							myObj[nameA[0]][nameIndex] = { };
						}
					} else if(typeof(myObj[nameA[0]]) == "undefined"){
						myObj[nameA[0]] = { }
					} // if

					if(nameA.length == 1){
						myObj=myObj[nameA[0]];
					} else{
						myObj=myObj[nameA[0]][nameIndex];
					} // if
				} // for

				if((elm.type != "select-multiple" && elm.type != "checkbox" && elm.type != "radio") || (elm.type == "radio" && elm.checked)){
					if(name == name.split("[")[0]){
						myObj[name]=elm.value;
					} else{
						// can not set value when there is no name
					}
				} else if(elm.type == "checkbox" && elm.checked){
					if(typeof(myObj[name]) == 'undefined'){
						myObj[name]=[ ];
					}
					myObj[name].push(elm.value);
				} else if(elm.type == "select-multiple"){
					if(typeof(myObj[name]) == 'undefined'){
						myObj[name]=[ ];
					}
					for(var jdx=0,len3=elm.options.length; jdx<len3; ++jdx){
						if(elm.options[jdx].selected){
							myObj[name].push(elm.options[jdx].value);
						}
					}
				} // if
				name=undefined;
			}); // forEach
			***/
			return obj;
		},

		// TODO: ComboBox might need time to process a recently input value.  This should be async?
	 	isValid: function(){
	 		// summary:
	 		//		Returns true if all of the widgets are valid

	 		// This also populate this._invalidWidgets[] array with list of invalid widgets...
	 		// TODO: put that into separate function?   It's confusing to have that as a side effect
	 		// of a method named isValid().

			this._invalidWidgets = dojo.filter(this.getDescendants(), function(widget){
				return !widget.disabled && widget.isValid && !widget.isValid();
	 		});
			return !this._invalidWidgets.length;
		},


		onValidStateChange: function(isValid){
			// summary:
			//		Stub function to connect to if you want to do something
			//		(like disable/enable a submit button) when the valid
			//		state changes on the form as a whole.
		},

		_widgetChange: function(widget){
			// summary:
			//		Connected to a widget's onChange function - update our
			//		valid state, if needed.
			var isValid = this._lastValidState;
			if(!widget || this._lastValidState === undefined){
				// We have passed a null widget, or we haven't been validated
				// yet - let's re-check all our children
				// This happens when we connect (or reconnect) our children
				isValid = this.isValid();
				if(this._lastValidState === undefined){
					// Set this so that we don't fire an onValidStateChange
					// the first time
					this._lastValidState = isValid;
				}
			}else if(widget.isValid){
				this._invalidWidgets = dojo.filter(this._invalidWidgets || [], function(w){
					return (w != widget);
				}, this);
				if(!widget.isValid() && !widget.attr("disabled")){
					this._invalidWidgets.push(widget);
				}
				isValid = (this._invalidWidgets.length === 0);
			}
			if(isValid !== this._lastValidState){
				this._lastValidState = isValid;
				this.onValidStateChange(isValid);
			}
		},

		connectChildren: function(){
			// summary:
			//		Connects to the onChange function of all children to
			//		track valid state changes.  You can call this function
			//		directly, ex. in the event that you programmatically
			//		add a widget to the form *after* the form has been
			//		initialized.
			dojo.forEach(this._changeConnections, dojo.hitch(this, "disconnect"));
			var _this = this;

			// we connect to validate - so that it better reflects the states
			// of the widgets - also, we only connect if it has a validate
			// function (to avoid too many unneeded connections)
			var conns = this._changeConnections = [];
			dojo.forEach(dojo.filter(this.getDescendants(),
				function(item){ return item.validate; }
			),
			function(widget){
				// We are interested in whenever the widget is validated - or
				// whenever the disabled attribute on that widget is changed
				conns.push(_this.connect(widget, "validate",
									dojo.hitch(_this, "_widgetChange", widget)));
				conns.push(_this.connect(widget, "_setDisabledAttr",
									dojo.hitch(_this, "_widgetChange", widget)));
			});

			// Call the widget change function to update the valid state, in
			// case something is different now.
			this._widgetChange(null);
		},

		startup: function(){
			this.inherited(arguments);
			// Initialize our valid state tracking.  Needs to be done in startup
			// because it's not guaranteed that our children are initialized
			// yet.
			this._changeConnections = [];
			this.connectChildren();
		}
	});

}

if(!dojo._hasResource["dijit._DialogMixin"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._DialogMixin"] = true;
dojo.provide("dijit._DialogMixin");

dojo.declare("dijit._DialogMixin", null,
	{
		// summary:
		//		This provides functions useful to Dialog and TooltipDialog

		attributeMap: dijit._Widget.prototype.attributeMap,

		execute: function(/*Object*/ formContents){
			// summary:
			//		Callback when the user hits the submit button.
			//		Override this method to handle Dialog execution.
			// description:
			//		After the user has pressed the submit button, the Dialog
			//		first calls onExecute() to notify the container to hide the
			//		dialog and restore focus to wherever it used to be.
			//
			//		*Then* this method is called.
			// type:
			//		callback
		},

		onCancel: function(){
			// summary:
			//	    Called when user has pressed the Dialog's cancel button, to notify container.
			// description:
			//	    Developer shouldn't override or connect to this method;
			//		it's a private communication device between the TooltipDialog
			//		and the thing that opened it (ex: `dijit.form.DropDownButton`)
			// type:
			//		protected
		},

		onExecute: function(){
			// summary:
			//	    Called when user has pressed the dialog's OK button, to notify container.
			// description:
			//	    Developer shouldn't override or connect to this method;
			//		it's a private communication device between the TooltipDialog
			//		and the thing that opened it (ex: `dijit.form.DropDownButton`)
			// type:
			//		protected
		},

		_onSubmit: function(){
			// summary:
			//		Callback when user hits submit button
			// type:
			//		protected
			this.onExecute();	// notify container that we are about to execute
			this.execute(this.attr('value'));
		},

		_getFocusItems: function(/*Node*/ dialogNode){
			// summary:
			//		Find focusable Items each time a dialog is opened,
			//		setting _firstFocusItem and _lastFocusItem
			// tags:
			//		protected

			var elems = dijit._getTabNavigable(dojo.byId(dialogNode));
			this._firstFocusItem = elems.lowest || elems.first || dialogNode;
			this._lastFocusItem = elems.last || elems.highest || this._firstFocusItem;
			if(dojo.isMoz && this._firstFocusItem.tagName.toLowerCase() == "input" &&
					dojo.getNodeProp(this._firstFocusItem, "type").toLowerCase() == "file"){
				// FF doesn't behave well when first element is input type=file, set first focusable to dialog container
				dojo.attr(dialogNode, "tabIndex", "0");
				this._firstFocusItem = dialogNode;
			}
		}
	}
);

}

if(!dojo._hasResource["dijit.DialogUnderlay"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.DialogUnderlay"] = true;
dojo.provide("dijit.DialogUnderlay");




dojo.declare(
	"dijit.DialogUnderlay",
	[dijit._Widget, dijit._Templated],
	{
		// summary:
		//		The component that blocks the screen behind a `dijit.Dialog`
		//
		// description:
		// 		A component used to block input behind a `dijit.Dialog`. Only a single
		//		instance of this widget is created by `dijit.Dialog`, and saved as
		//		a reference to be shared between all Dialogs as `dijit._underlay`
		//
		//		The underlay itself can be styled based on and id:
		//	|	#myDialog_underlay { background-color:red; }
		//
		//		In the case of `dijit.Dialog`, this id is based on the id of the Dialog,
		//		suffixed with _underlay.

		// Template has two divs; outer div is used for fade-in/fade-out, and also to hold background iframe.
		// Inner div has opacity specified in CSS file.
		templateString: "<div class='dijitDialogUnderlayWrapper'><div class='dijitDialogUnderlay' dojoAttachPoint='node'></div></div>",

		// Parameters on creation or updatable later

		// dialogId: String
		//		Id of the dialog.... DialogUnderlay's id is based on this id
		dialogId: "",

		// class: String
		//		This class name is used on the DialogUnderlay node, in addition to dijitDialogUnderlay
		"class": "",

		attributeMap: { id: "domNode" },

		_setDialogIdAttr: function(id){
			dojo.attr(this.node, "id", id + "_underlay");
		},

		_setClassAttr: function(clazz){
			this.node.className = "dijitDialogUnderlay " + clazz;
		},

		postCreate: function(){
			// summary:
			//		Append the underlay to the body
			dojo.body().appendChild(this.domNode);
		},

		layout: function(){
			// summary:
			//		Sets the background to the size of the viewport
			//
			// description:
			//		Sets the background to the size of the viewport (rather than the size
			//		of the document) since we need to cover the whole browser window, even
			//		if the document is only a few lines long.
			// tags:
			//		private

			var is = this.node.style,
				os = this.domNode.style;

			// hide the background temporarily, so that the background itself isn't
			// causing scrollbars to appear (might happen when user shrinks browser
			// window and then we are called to resize)
			os.display = "none";

			// then resize and show
			var viewport = dijit.getViewport();
			os.top = viewport.t + "px";
			os.left = viewport.l + "px";
			is.width = viewport.w + "px";
			is.height = viewport.h + "px";
			os.display = "block";
		},

		show: function(){
			// summary:
			//		Show the dialog underlay
			this.domNode.style.display = "block";
			this.layout();
			this.bgIframe = new dijit.BackgroundIframe(this.domNode);
		},

		hide: function(){
			// summary:
			//		Hides the dialog underlay
			this.bgIframe.destroy();
			this.domNode.style.display = "none";
		},

		uninitialize: function(){
			if(this.bgIframe){
				this.bgIframe.destroy();
			}
			this.inherited(arguments);
		}
	}
);

}

if(!dojo._hasResource["dijit._Contained"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._Contained"] = true;
dojo.provide("dijit._Contained");

dojo.declare("dijit._Contained",
		null,
		{
			// summary:
			//		Mixin for widgets that are children of a container widget
			//
			// example:
			// | 	// make a basic custom widget that knows about it's parents
			// |	dojo.declare("my.customClass",[dijit._Widget,dijit._Contained],{});

			getParent: function(){
				// summary:
				//		Returns the parent widget of this widget, assuming the parent
				//		specifies isContainer
				var parent = dijit.getEnclosingWidget(this.domNode.parentNode);
				return parent && parent.isContainer ? parent : null;
			},

			_getSibling: function(/*String*/ which){
				// summary:
				//      Returns next or previous sibling
				// which:
				//      Either "next" or "previous"
				// tags:
				//      private
				var node = this.domNode;
				do{
					node = node[which+"Sibling"];
				}while(node && node.nodeType != 1);
				return node && dijit.byNode(node);	// dijit._Widget
			},

			getPreviousSibling: function(){
				// summary:
				//		Returns null if this is the first child of the parent,
				//		otherwise returns the next element sibling to the "left".

				return this._getSibling("previous"); // dijit._Widget
			},

			getNextSibling: function(){
				// summary:
				//		Returns null if this is the last child of the parent,
				//		otherwise returns the next element sibling to the "right".

				return this._getSibling("next"); // dijit._Widget
			},

			getIndexInParent: function(){
				// summary:
				//		Returns the index of this widget within its container parent.
				//		It returns -1 if the parent does not exist, or if the parent
				//		is not a dijit._Container

				var p = this.getParent();
				if(!p || !p.getIndexOfChild){
					return -1; // int
				}
				return p.getIndexOfChild(this); // int
			}
		}
	);


}

if(!dojo._hasResource["dijit.layout._LayoutWidget"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.layout._LayoutWidget"] = true;
dojo.provide("dijit.layout._LayoutWidget");





dojo.declare("dijit.layout._LayoutWidget",
	[dijit._Widget, dijit._Container, dijit._Contained],
	{
		// summary:
		//		Base class for a _Container widget which is responsible for laying out its children.
		//		Widgets which mixin this code must define layout() to manage placement and sizing of the children.

		// baseClass: [protected extension] String
		//		This class name is applied to the widget's domNode
		//		and also may be used to generate names for sub nodes,
		//		for example dijitTabContainer-content.
		baseClass: "dijitLayoutContainer",

		// isLayoutContainer: [protected] Boolean
		//		Indicates that this widget is going to call resize() on its
		//		children widgets, setting their size, when they become visible.
		isLayoutContainer: true,

		postCreate: function(){
			dojo.addClass(this.domNode, "dijitContainer");
			dojo.addClass(this.domNode, this.baseClass);

			this.inherited(arguments);
		},

		startup: function(){
			// summary:
			//		Called after all the widgets have been instantiated and their
			//		dom nodes have been inserted somewhere under dojo.doc.body.
			//
			//		Widgets should override this method to do any initialization
			//		dependent on other widgets existing, and then call
			//		this superclass method to finish things off.
			//
			//		startup() in subclasses shouldn't do anything
			//		size related because the size of the widget hasn't been set yet.

			if(this._started){ return; }

			// Need to call inherited first - so that child widgets get started
			// up correctly
			this.inherited(arguments);

			// If I am a not being controlled by a parent layout widget...
			var parent = this.getParent && this.getParent()
			if(!(parent && parent.isLayoutContainer)){
				// Do recursive sizing and layout of all my descendants
				// (passing in no argument to resize means that it has to glean the size itself)
				this.resize();

				// Since my parent isn't a layout container, and my style *may be* width=height=100%
				// or something similar (either set directly or via a CSS class),
				// monitor when my size changes so that I can re-layout.
				// For browsers where I can't directly monitor when my size changes,
				// monitor when the viewport changes size, which *may* indicate a size change for me.
				this.connect(dojo.isIE ? this.domNode : dojo.global, 'onresize', function(){
					// Using function(){} closure to ensure no arguments to resize.
					this.resize();
				});
			}
		},

		resize: function(changeSize, resultSize){
			// summary:
			//		Call this to resize a widget, or after its size has changed.
			// description:
			//		Change size mode:
			//			When changeSize is specified, changes the marginBox of this widget
			//			and forces it to relayout its contents accordingly.
			//			changeSize may specify height, width, or both.
			//
			//			If resultSize is specified it indicates the size the widget will
			//			become after changeSize has been applied.
			//
			//		Notification mode:
			//			When changeSize is null, indicates that the caller has already changed
			//			the size of the widget, or perhaps it changed because the browser
			//			window was resized.  Tells widget to relayout its contents accordingly.
			//
			//			If resultSize is also specified it indicates the size the widget has
			//			become.
			//
			//		In either mode, this method also:
			//			1. Sets this._borderBox and this._contentBox to the new size of
			//				the widget.  Queries the current domNode size if necessary.
			//			2. Calls layout() to resize contents (and maybe adjust child widgets).
			//
			// changeSize: Object?
			//		Sets the widget to this margin-box size and position.
			//		May include any/all of the following properties:
			//	|	{w: int, h: int, l: int, t: int}
			//
			// resultSize: Object?
			//		The margin-box size of this widget after applying changeSize (if
			//		changeSize is specified).  If caller knows this size and
			//		passes it in, we don't need to query the browser to get the size.
			//	|	{w: int, h: int}

			var node = this.domNode;

			// set margin box size, unless it wasn't specified, in which case use current size
			if(changeSize){
				dojo.marginBox(node, changeSize);

				// set offset of the node
				if(changeSize.t){ node.style.top = changeSize.t + "px"; }
				if(changeSize.l){ node.style.left = changeSize.l + "px"; }
			}

			// If either height or width wasn't specified by the user, then query node for it.
			// But note that setting the margin box and then immediately querying dimensions may return
			// inaccurate results, so try not to depend on it.
			var mb = resultSize || {};
			dojo.mixin(mb, changeSize || {});	// changeSize overrides resultSize
			if( !("h" in mb) || !("w" in mb) ){
				mb = dojo.mixin(dojo.marginBox(node), mb);	// just use dojo.marginBox() to fill in missing values
			}

			// Compute and save the size of my border box and content box
			// (w/out calling dojo.contentBox() since that may fail if size was recently set)
			var cs = dojo.getComputedStyle(node);
			var me = dojo._getMarginExtents(node, cs);
			var be = dojo._getBorderExtents(node, cs);
			var bb = (this._borderBox = {
				w: mb.w - (me.w + be.w),
				h: mb.h - (me.h + be.h)
			});
			var pe = dojo._getPadExtents(node, cs);
			this._contentBox = {
				l: dojo._toPixelValue(node, cs.paddingLeft),
				t: dojo._toPixelValue(node, cs.paddingTop),
				w: bb.w - pe.w,
				h: bb.h - pe.h
			};

			// Callback for widget to adjust size of its children
			this.layout();
		},

		layout: function(){
			// summary:
			//		Widgets override this method to size and position their contents/children.
			//		When this is called this._contentBox is guaranteed to be set (see resize()).
			//
			//		This is called after startup(), and also when the widget's size has been
			//		changed.
			// tags:
			//		protected extension
		},

		_setupChild: function(/*dijit._Widget*/child){
			// summary:
			//		Common setup for initial children and children which are added after startup
			// tags:
			//		protected extension

			dojo.addClass(child.domNode, this.baseClass+"-child");
			if(child.baseClass){
				dojo.addClass(child.domNode, this.baseClass+"-"+child.baseClass);
			}
		},

		addChild: function(/*dijit._Widget*/ child, /*Integer?*/ insertIndex){
			// Overrides _Container.addChild() to call _setupChild()
			this.inherited(arguments);
			if(this._started){
				this._setupChild(child);
			}
		},

		removeChild: function(/*dijit._Widget*/ child){
			// Overrides _Container.removeChild() to remove class added by _setupChild()
			dojo.removeClass(child.domNode, this.baseClass+"-child");
			if(child.baseClass){
				dojo.removeClass(child.domNode, this.baseClass+"-"+child.baseClass);
			}
			this.inherited(arguments);
		}
	}
);

dijit.layout.marginBox2contentBox = function(/*DomNode*/ node, /*Object*/ mb){
	// summary:
	//		Given the margin-box size of a node, return its content box size.
	//		Functions like dojo.contentBox() but is more reliable since it doesn't have
	//		to wait for the browser to compute sizes.
	var cs = dojo.getComputedStyle(node);
	var me = dojo._getMarginExtents(node, cs);
	var pb = dojo._getPadBorderExtents(node, cs);
	return {
		l: dojo._toPixelValue(node, cs.paddingLeft),
		t: dojo._toPixelValue(node, cs.paddingTop),
		w: mb.w - (me.w + pb.w),
		h: mb.h - (me.h + pb.h)
	};
};

(function(){
	var capitalize = function(word){
		return word.substring(0,1).toUpperCase() + word.substring(1);
	};

	var size = function(widget, dim){
		// size the child
		widget.resize ? widget.resize(dim) : dojo.marginBox(widget.domNode, dim);

		// record child's size, but favor our own numbers when we have them.
		// the browser lies sometimes
		dojo.mixin(widget, dojo.marginBox(widget.domNode));
		dojo.mixin(widget, dim);
	};

	dijit.layout.layoutChildren = function(/*DomNode*/ container, /*Object*/ dim, /*Object[]*/ children){
		// summary
		//		Layout a bunch of child dom nodes within a parent dom node
		// container:
		//		parent node
		// dim:
		//		{l, t, w, h} object specifying dimensions of container into which to place children
		// children:
		//		an array like [ {domNode: foo, layoutAlign: "bottom" }, {domNode: bar, layoutAlign: "client"} ]

		// copy dim because we are going to modify it
		dim = dojo.mixin({}, dim);

		dojo.addClass(container, "dijitLayoutContainer");

		// Move "client" elements to the end of the array for layout.  a11y dictates that the author
		// needs to be able to put them in the document in tab-order, but this algorithm requires that
		// client be last.
		children = dojo.filter(children, function(item){ return item.layoutAlign != "client"; })
			.concat(dojo.filter(children, function(item){ return item.layoutAlign == "client"; }));

		// set positions/sizes
		dojo.forEach(children, function(child){
			var elm = child.domNode,
				pos = child.layoutAlign;

			// set elem to upper left corner of unused space; may move it later
			var elmStyle = elm.style;
			elmStyle.left = dim.l+"px";
			elmStyle.top = dim.t+"px";
			elmStyle.bottom = elmStyle.right = "auto";

			dojo.addClass(elm, "dijitAlign" + capitalize(pos));

			// set size && adjust record of remaining space.
			// note that setting the width of a <div> may affect its height.
			if(pos == "top" || pos == "bottom"){
				size(child, { w: dim.w });
				dim.h -= child.h;
				if(pos == "top"){
					dim.t += child.h;
				}else{
					elmStyle.top = dim.t + dim.h + "px";
				}
			}else if(pos == "left" || pos == "right"){
				size(child, { h: dim.h });
				dim.w -= child.w;
				if(pos == "left"){
					dim.l += child.w;
				}else{
					elmStyle.left = dim.l + dim.w + "px";
				}
			}else if(pos == "client"){
				size(child, dim);
			}
		});
	};

})();

}

if(!dojo._hasResource["dojo.html"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.html"] = true;
dojo.provide("dojo.html");

// the parser might be needed..
 

(function(){ // private scope, sort of a namespace

	// idCounter is incremented with each instantiation to allow asignment of a unique id for tracking, logging purposes
	var idCounter = 0, 
		d = dojo;
	
	dojo.html._secureForInnerHtml = function(/*String*/ cont){
		// summary:
		//		removes !DOCTYPE and title elements from the html string.
		// 
		//		khtml is picky about dom faults, you can't attach a style or <title> node as child of body
		//		must go into head, so we need to cut out those tags
		//	cont:
		//		An html string for insertion into the dom
		//	
		return cont.replace(/(?:\s*<!DOCTYPE\s[^>]+>|<title[^>]*>[\s\S]*?<\/title>)/ig, ""); // String
	};

/*====
	dojo.html._emptyNode = function(node){
		// summary:
		//		removes all child nodes from the given node
		//	node: DOMNode
		//		the parent element
	};
=====*/
	dojo.html._emptyNode = dojo.empty;

	dojo.html._setNodeContent = function(/* DomNode */ node, /* String|DomNode|NodeList */ cont){
		// summary:
		//		inserts the given content into the given node
		//	node:
		//		the parent element
		//	content:
		//		the content to be set on the parent element. 
		//		This can be an html string, a node reference or a NodeList, dojo.NodeList, Array or other enumerable list of nodes
		
		// always empty
		d.empty(node);

		if(cont) {
			if(typeof cont == "string") {
				cont = d._toDom(cont, node.ownerDocument);
			}
			if(!cont.nodeType && d.isArrayLike(cont)) {
				// handle as enumerable, but it may shrink as we enumerate it
				for(var startlen=cont.length, i=0; i<cont.length; i=startlen==cont.length ? i+1 : 0) {
					d.place( cont[i], node, "last");
				}
			} else {
				// pass nodes, documentFragments and unknowns through to dojo.place
				d.place(cont, node, "last");
			}
		}

		// return DomNode
		return node;
	};

	// we wrap up the content-setting operation in a object
	dojo.declare("dojo.html._ContentSetter", null, 
		{
			// node: DomNode|String
			//		An node which will be the parent element that we set content into
			node: "",

			// content: String|DomNode|DomNode[]
			//		The content to be placed in the node. Can be an HTML string, a node reference, or a enumerable list of nodes
			content: "",
			
			// id: String?
			//		Usually only used internally, and auto-generated with each instance 
			id: "",

			// cleanContent: Boolean
			//		Should the content be treated as a full html document, 
			//		and the real content stripped of <html>, <body> wrapper before injection
			cleanContent: false,
			
			// extractContent: Boolean
			//		Should the content be treated as a full html document, and the real content stripped of <html>, <body> wrapper before injection
			extractContent: false,

			// parseContent: Boolean
			//		Should the node by passed to the parser after the new content is set
			parseContent: false,
			
			// lifecyle methods
			constructor: function(/* Object */params, /* String|DomNode */node){
				//	summary:
				//		Provides a configurable, extensible object to wrap the setting on content on a node
				//		call the set() method to actually set the content..
 
				// the original params are mixed directly into the instance "this"
				dojo.mixin(this, params || {});

				// give precedence to params.node vs. the node argument
				// and ensure its a node, not an id string
				node = this.node = dojo.byId( this.node || node );
	
				if(!this.id){
					this.id = [
						"Setter",
						(node) ? node.id || node.tagName : "", 
						idCounter++
					].join("_");
				}

				if(! (this.node || node)){
					new Error(this.declaredClass + ": no node provided to " + this.id);
				}
			},
			set: function(/* String|DomNode|NodeList? */ cont, /* Object? */ params){
				// summary:
				//		front-end to the set-content sequence 
				//	cont:
				//		An html string, node or enumerable list of nodes for insertion into the dom
				//		If not provided, the object's content property will be used
				if(undefined !== cont){
					this.content = cont;
				}
				// in the re-use scenario, set needs to be able to mixin new configuration
				if(params){
					this._mixin(params);
				}

				this.onBegin();
				this.setContent();
				this.onEnd();

				return this.node;
			},
			setContent: function(){
				// summary:
				//		sets the content on the node 

				var node = this.node; 
				if(!node) {
					console.error("setContent given no node");
				}
				try{
					node = dojo.html._setNodeContent(node, this.content);
				}catch(e){
					// check if a domfault occurs when we are appending this.errorMessage
					// like for instance if domNode is a UL and we try append a DIV
	
					// FIXME: need to allow the user to provide a content error message string
					var errMess = this.onContentError(e); 
					try{
						node.innerHTML = errMess;
					}catch(e){
						console.error('Fatal ' + this.declaredClass + '.setContent could not change content due to '+e.message, e);
					}
				}
				// always put back the node for the next method
				this.node = node; // DomNode
			},
			
			empty: function() {
				// summary
				//	cleanly empty out existing content

				// destroy any widgets from a previous run
				// NOTE: if you dont want this you'll need to empty 
				// the parseResults array property yourself to avoid bad things happenning
				if(this.parseResults && this.parseResults.length) {
					dojo.forEach(this.parseResults, function(w) {
						if(w.destroy){
							w.destroy();
						}
					});
					delete this.parseResults;
				}
				// this is fast, but if you know its already empty or safe, you could 
				// override empty to skip this step
				dojo.html._emptyNode(this.node);
			},
	
			onBegin: function(){
				// summary
				//		Called after instantiation, but before set(); 
				//		It allows modification of any of the object properties 
				//		- including the node and content provided - before the set operation actually takes place
				//		This default implementation checks for cleanContent and extractContent flags to 
				//		optionally pre-process html string content
				var cont = this.content;
	
				if(dojo.isString(cont)){
					if(this.cleanContent){
						cont = dojo.html._secureForInnerHtml(cont);
					}
  
					if(this.extractContent){
						var match = cont.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
						if(match){ cont = match[1]; }
					}
				}

				// clean out the node and any cruft associated with it - like widgets
				this.empty();
				
				this.content = cont;
				return this.node; /* DomNode */
			},
	
			onEnd: function(){
				// summary
				//		Called after set(), when the new content has been pushed into the node
				//		It provides an opportunity for post-processing before handing back the node to the caller
				//		This default implementation checks a parseContent flag to optionally run the dojo parser over the new content
				if(this.parseContent){
					// populates this.parseResults if you need those..
					this._parse();
				}
				return this.node; /* DomNode */
			},
	
			tearDown: function(){
				// summary
				//		manually reset the Setter instance if its being re-used for example for another set()
				// description
				//		tearDown() is not called automatically. 
				//		In normal use, the Setter instance properties are simply allowed to fall out of scope
				//		but the tearDown method can be called to explicitly reset this instance.
				delete this.parseResults; 
				delete this.node; 
				delete this.content; 
			},
  
			onContentError: function(err){
				return "Error occured setting content: " + err; 
			},
			
			_mixin: function(params){
				// mix properties/methods into the instance
				// TODO: the intention with tearDown is to put the Setter's state 
				// back to that of the original constructor (vs. deleting/resetting everything regardless of ctor params)
				// so we could do something here to move the original properties aside for later restoration
				var empty = {}, key;
				for(key in params){
					if(key in empty){ continue; }
					// TODO: here's our opportunity to mask the properties we dont consider configurable/overridable
					// .. but history shows we'll almost always guess wrong
					this[key] = params[key]; 
				}
			},
			_parse: function(){
				// summary: 
				//		runs the dojo parser over the node contents, storing any results in this.parseResults
				//		Any errors resulting from parsing are passed to _onError for handling

				var rootNode = this.node;
				try{
					// store the results (widgets, whatever) for potential retrieval
					this.parseResults = dojo.parser.parse(rootNode, true);
				}catch(e){
					this._onError('Content', e, "Error parsing in _ContentSetter#"+this.id);
				}
			},
  
			_onError: function(type, err, consoleText){
				// summary:
				//		shows user the string that is returned by on[type]Error
				//		overide/implement on[type]Error and return your own string to customize
				var errText = this['on' + type + 'Error'].call(this, err);
				if(consoleText){
					console.error(consoleText, err);
				}else if(errText){ // a empty string won't change current content
					dojo.html._setNodeContent(this.node, errText, true);
				}
			}
	}); // end dojo.declare()

	dojo.html.set = function(/* DomNode */ node, /* String|DomNode|NodeList */ cont, /* Object? */ params){
			// summary:
			//		inserts (replaces) the given content into the given node. dojo.place(cont, node, "only")
			//		may be a better choice for simple HTML insertion.
			// description:
			//		Unless you need to use the params capabilities of this method, you should use
			//		dojo.place(cont, node, "only"). dojo.place() has more robust support for injecting
			//		an HTML string into the DOM, but it only handles inserting an HTML string as DOM
			//		elements, or inserting a DOM node. dojo.place does not handle NodeList insertions
			//		or the other capabilities as defined by the params object for this method.
			//	node:
			//		the parent element that will receive the content
			//	cont:
			//		the content to be set on the parent element. 
			//		This can be an html string, a node reference or a NodeList, dojo.NodeList, Array or other enumerable list of nodes
			//	params: 
			//		Optional flags/properties to configure the content-setting. See dojo.html._ContentSetter
			//	example:
			//		A safe string/node/nodelist content replacement/injection with hooks for extension
			//		Example Usage: 
			//		dojo.html.set(node, "some string"); 
			//		dojo.html.set(node, contentNode, {options}); 
			//		dojo.html.set(node, myNode.childNodes, {options}); 
		if(undefined == cont){
			console.warn("dojo.html.set: no cont argument provided, using empty string");
			cont = "";
		}	
		if(!params){
			// simple and fast
			return dojo.html._setNodeContent(node, cont, true);
		}else{ 
			// more options but slower
			// note the arguments are reversed in order, to match the convention for instantiation via the parser
			var op = new dojo.html._ContentSetter(dojo.mixin( 
					params, 
					{ content: cont, node: node } 
			));
			return op.set();
		}
	};
})();

}

if(!dojo._hasResource["dijit.layout.ContentPane"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.layout.ContentPane"] = true;
dojo.provide("dijit.layout.ContentPane");



	// for dijit.layout.marginBox2contentBox()






dojo.declare(
	"dijit.layout.ContentPane", dijit._Widget,
{
	// summary:
	//		A widget that acts as a container for mixed HTML and widgets, and includes an Ajax interface
	// description:
	//		A widget that can be used as a stand alone widget
	//		or as a base class for other widgets.
	//
	//		Handles replacement of document fragment using either external uri or javascript
	//		generated markup or DOM content, instantiating widgets within that content.
	//		Don't confuse it with an iframe, it only needs/wants document fragments.
	//		It's useful as a child of LayoutContainer, SplitContainer, or TabContainer.
	//		But note that those classes can contain any widget as a child.
	// example:
	//		Some quick samples:
	//		To change the innerHTML use .attr('content', '<b>new content</b>')
	//
	//		Or you can send it a NodeList, .attr('content', dojo.query('div [class=selected]', userSelection))
	//		please note that the nodes in NodeList will copied, not moved
	//
	//		To do a ajax update use .attr('href', url)

	// href: String
	//		The href of the content that displays now.
	//		Set this at construction if you want to load data externally when the
	//		pane is shown.  (Set preload=true to load it immediately.)
	//		Changing href after creation doesn't have any effect; use attr('href', ...);
	href: "",

/*=====
	// content: String || DomNode || NodeList || dijit._Widget
	//		The innerHTML of the ContentPane.
	//		Note that the initialization parameter / argument to attr("content", ...)
	//		can be a String, DomNode, Nodelist, or _Widget.
	content: "",
=====*/

	// extractContent: Boolean
	//		Extract visible content from inside of <body> .... </body>.
	//		I.e., strip <html> and <head> (and it's contents) from the href
	extractContent: false,

	// parseOnLoad: Boolean
	//		Parse content and create the widgets, if any.
	parseOnLoad: true,

	// preventCache: Boolean
	//		Prevent caching of data from href's by appending a timestamp to the href.
	preventCache: false,

	// preload: Boolean
	//		Force load of data on initialization even if pane is hidden.
	preload: false,

	// refreshOnShow: Boolean
	//		Refresh (re-download) content when pane goes from hidden to shown
	refreshOnShow: false,

	// loadingMessage: String
	//		Message that shows while downloading
	loadingMessage: "<span class='dijitContentPaneLoading'>${loadingState}</span>",

	// errorMessage: String
	//		Message that shows if an error occurs
	errorMessage: "<span class='dijitContentPaneError'>${errorState}</span>",

	// isLoaded: [readonly] Boolean
	//		True if the ContentPane has data in it, either specified
	//		during initialization (via href or inline content), or set
	//		via attr('content', ...) / attr('href', ...)
	//
	//		False if it doesn't have any content, or if ContentPane is
	//		still in the process of downloading href.
	isLoaded: false,

	baseClass: "dijitContentPane",

	// doLayout: Boolean
	//		- false - don't adjust size of children
	//		- true - if there is a single visible child widget, set it's size to
	//				however big the ContentPane is
	doLayout: true,

	// ioArgs: Object
	//		Parameters to pass to xhrGet() request, for example:
	// |	<div dojoType="dijit.layout.ContentPane" href="./bar" ioArgs="{timeout: 500}">
	ioArgs: {},

	// isContainer: [protected] Boolean
	//		Indicates that this widget acts as a "parent" to the descendant widgets.
	//		When the parent is started it will call startup() on the child widgets.
	//		See also `isLayoutContainer`.
	isContainer: true,

	// isLayoutContainer: [protected] Boolean
	//		Indicates that this widget will call resize() on it's child widgets
	//		when they become visible.
	isLayoutContainer: true,

	// onLoadDeferred: [readonly] dojo.Deferred
	//		This is the `dojo.Deferred` returned by attr('href', ...) and refresh().
	//		Calling onLoadDeferred.addCallback() or addErrback() registers your
	//		callback to be called only once, when the prior attr('href', ...) call or
	//		the initial href parameter to the constructor finishes loading.
	//
	//		This is different than an onLoad() handler which gets called any time any href is loaded.
	onLoadDeferred: null,

	// Override _Widget's attributeMap because we don't want the title attribute (used to specify
	// tab labels) to be copied to ContentPane.domNode... otherwise a tooltip shows up over the
	// entire pane.
	attributeMap: dojo.delegate(dijit._Widget.prototype.attributeMap, {
		title: []
	}),

	postMixInProperties: function(){
		this.inherited(arguments);
		var messages = dojo.i18n.getLocalization("dijit", "loading", this.lang);
		this.loadingMessage = dojo.string.substitute(this.loadingMessage, messages);
		this.errorMessage = dojo.string.substitute(this.errorMessage, messages);

		// Detect if we were initialized with data
		if(!this.href && this.srcNodeRef && this.srcNodeRef.innerHTML){
			this.isLoaded = true;
		}
	},

	buildRendering: function(){
		// Overrides Widget.buildRendering().
		// Since we have no template we need to set this.containerNode ourselves.
		// For subclasses of ContentPane do have a template, does nothing.
		this.inherited(arguments);
		if(!this.containerNode){
			// make getDescendants() work
			this.containerNode = this.domNode;
		}
	},

	postCreate: function(){
		// remove the title attribute so it doesn't show up when hovering
		// over a node
		this.domNode.title = "";

		if(!dojo.attr(this.domNode,"role")){
			dijit.setWaiRole(this.domNode, "group");
		}

		dojo.addClass(this.domNode, this.baseClass);
	},

	startup: function(){
		// summary:
		//		See `dijit.layout._LayoutWidget.startup` for description.
		//		Although ContentPane doesn't extend _LayoutWidget, it does implement
		//		the same API.
		if(this._started){ return; }

		var parent = dijit._Contained.prototype.getParent.call(this);
		this._childOfLayoutWidget = parent && parent.isLayoutContainer;

		// I need to call resize() on my child/children (when I become visible), unless
		// I'm the child of a layout widget in which case my parent will call resize() on me and I'll do it then.
		this._needLayout = !this._childOfLayoutWidget;

		if(this.isLoaded){
			dojo.forEach(this.getChildren(), function(child){
				child.startup();
			});
		}

		if(this._isShown() || this.preload){
			this._onShow();
		}

		this.inherited(arguments);
	},

	_checkIfSingleChild: function(){
		// summary:
		//		Test if we have exactly one visible widget as a child,
		//		and if so assume that we are a container for that widget,
		//		and should propogate startup() and resize() calls to it.
		//		Skips over things like data stores since they aren't visible.

		var childNodes = dojo.query("> *", this.containerNode).filter(function(node){
				return node.tagName !== "SCRIPT"; // or a regexp for hidden elements like script|area|map|etc..
			}),
			childWidgetNodes = childNodes.filter(function(node){
				return dojo.hasAttr(node, "dojoType") || dojo.hasAttr(node, "widgetId");
			}),
			candidateWidgets = dojo.filter(childWidgetNodes.map(dijit.byNode), function(widget){
				return widget && widget.domNode && widget.resize;
			});

		if(
			// all child nodes are widgets
			childNodes.length == childWidgetNodes.length &&

			// all but one are invisible (like dojo.data)
			candidateWidgets.length == 1
		){
			this._singleChild = candidateWidgets[0];
		}else{
			delete this._singleChild;
		}

		// So we can set overflow: hidden to avoid a safari bug w/scrollbars showing up (#9449)
		dojo.toggleClass(this.containerNode, this.baseClass + "SingleChild", !!this._singleChild);
	},

	setHref: function(/*String|Uri*/ href){
		// summary:
		//		Deprecated.   Use attr('href', ...) instead.
		dojo.deprecated("dijit.layout.ContentPane.setHref() is deprecated. Use attr('href', ...) instead.", "", "2.0");
		return this.attr("href", href);
	},
	_setHrefAttr: function(/*String|Uri*/ href){
		// summary:
		//		Hook so attr("href", ...) works.
		// description:
		//		Reset the (external defined) content of this pane and replace with new url
		//		Note: It delays the download until widget is shown if preload is false.
		//	href:
		//		url to the page you want to get, must be within the same domain as your mainpage

		// Cancel any in-flight requests (an attr('href') will cancel any in-flight attr('href', ...))
		this.cancel();

		this.onLoadDeferred = new dojo.Deferred(dojo.hitch(this, "cancel"));

		this.href = href;

		// _setHrefAttr() is called during creation and by the user, after creation.
		// only in the second case do we actually load the URL; otherwise it's done in startup()
		if(this._created && (this.preload || this._isShown())){
			this._load();
		}else{
			// Set flag to indicate that href needs to be loaded the next time the
			// ContentPane is made visible
			this._hrefChanged = true;
		}

		return this.onLoadDeferred;		// dojo.Deferred
	},

	setContent: function(/*String|DomNode|Nodelist*/data){
		// summary:
		//		Deprecated.   Use attr('content', ...) instead.
		dojo.deprecated("dijit.layout.ContentPane.setContent() is deprecated.  Use attr('content', ...) instead.", "", "2.0");
		this.attr("content", data);
	},
	_setContentAttr: function(/*String|DomNode|Nodelist*/data){
		// summary:
		//		Hook to make attr("content", ...) work.
		//		Replaces old content with data content, include style classes from old content
		//	data:
		//		the new Content may be String, DomNode or NodeList
		//
		//		if data is a NodeList (or an array of nodes) nodes are copied
		//		so you can import nodes from another document implicitly

		// clear href so we can't run refresh and clear content
		// refresh should only work if we downloaded the content
		this.href = "";

		// Cancel any in-flight requests (an attr('content') will cancel any in-flight attr('href', ...))
		this.cancel();

		// Even though user is just setting content directly, still need to define an onLoadDeferred
		// because the _onLoadHandler() handler is still getting called from setContent()
		this.onLoadDeferred = new dojo.Deferred(dojo.hitch(this, "cancel"));

		this._setContent(data || "");

		this._isDownloaded = false; // mark that content is from a attr('content') not an attr('href')

		return this.onLoadDeferred; 	// dojo.Deferred
	},
	_getContentAttr: function(){
		// summary:
		//		Hook to make attr("content") work
		return this.containerNode.innerHTML;
	},

	cancel: function(){
		// summary:
		//		Cancels an in-flight download of content
		if(this._xhrDfd && (this._xhrDfd.fired == -1)){
			this._xhrDfd.cancel();
		}
		delete this._xhrDfd; // garbage collect

		this.onLoadDeferred = null;
	},

	uninitialize: function(){
		if(this._beingDestroyed){
			this.cancel();
		}
		this.inherited(arguments);
	},

	destroyRecursive: function(/*Boolean*/ preserveDom){
		// summary:
		//		Destroy the ContentPane and its contents

		// if we have multiple controllers destroying us, bail after the first
		if(this._beingDestroyed){
			return;
		}
		this.inherited(arguments);
	},

	resize: function(changeSize, resultSize){
		// summary:
		//		See `dijit.layout._LayoutWidget.resize` for description.
		//		Although ContentPane doesn't extend _LayoutWidget, it does implement
		//		the same API.

		// For the TabContainer --> BorderContainer --> ContentPane case, _onShow() is
		// never called, so resize() is our trigger to do the initial href download.
		if(!this._wasShown){
			this._onShow();
		}

		this._resizeCalled = true;

		// Set margin box size, unless it wasn't specified, in which case use current size.
		if(changeSize){
			dojo.marginBox(this.domNode, changeSize);
		}

		// Compute content box size of containerNode in case we [later] need to size our single child.
		var cn = this.containerNode;
		if(cn === this.domNode){
			// If changeSize or resultSize was passed to this method and this.containerNode ==
			// this.domNode then we can compute the content-box size without querying the node,
			// which is more reliable (similar to LayoutWidget.resize) (see for example #9449).
			var mb = resultSize || {};
			dojo.mixin(mb, changeSize || {}); // changeSize overrides resultSize
			if(!("h" in mb) || !("w" in mb)){
				mb = dojo.mixin(dojo.marginBox(cn), mb); // just use dojo.marginBox() to fill in missing values
			}
			this._contentBox = dijit.layout.marginBox2contentBox(cn, mb);
		}else{
			this._contentBox = dojo.contentBox(cn);
		}

		// Make my children layout, or size my single child widget
		this._layoutChildren();
	},

	_isShown: function(){
		// summary:
		//		Returns true if the content is currently shown.
		// description:
		//		If I am a child of a layout widget then it actually returns true if I've ever been visible,
		//		not whether I'm currently visible, since that's much faster than tracing up the DOM/widget
		//		tree every call, and at least solves the performance problem on page load by deferring loading
		//		hidden ContentPanes until they are first shown

		if(this._childOfLayoutWidget){
			// If we are TitlePane, etc - we return that only *IF* we've been resized
			if(this._resizeCalled && "open" in this){
				return this.open;
			}
			return this._resizeCalled;
		}else if("open" in this){
			return this.open;		// for TitlePane, etc.
		}else{
			// TODO: with _childOfLayoutWidget check maybe this branch no longer necessary?
			var node = this.domNode;
			return (node.style.display != 'none') && (node.style.visibility != 'hidden') && !dojo.hasClass(node, "dijitHidden");
		}
	},

	_onShow: function(){
		// summary:
		//		Called when the ContentPane is made visible
		// description:
		//		For a plain ContentPane, this is called on initialization, from startup().
		//		If the ContentPane is a hidden pane of a TabContainer etc., then it's
		//		called whenever the pane is made visible.
		//
		//		Does necessary processing, including href download and layout/resize of
		//		child widget(s)

		if(this.href){
			if(!this._xhrDfd && // if there's an href that isn't already being loaded
				(!this.isLoaded || this._hrefChanged || this.refreshOnShow)
			){
				this.refresh();
			}
		}else{
			// If we are the child of a layout widget then the layout widget will call resize() on
			// us, and then we will size our child/children.   Otherwise, we need to do it now.
			if(!this._childOfLayoutWidget && this._needLayout){
				// If a layout has been scheduled for when we become visible, do it now
				this._layoutChildren();
			}
		}

		this.inherited(arguments);

		// Need to keep track of whether ContentPane has been shown (which is different than
		// whether or not it's currently visible).
		this._wasShown = true;
	},

	refresh: function(){
		// summary:
		//		[Re]download contents of href and display
		// description:
		//		1. cancels any currently in-flight requests
		//		2. posts "loading..." message
		//		3. sends XHR to download new data

		// Cancel possible prior in-flight request
		this.cancel();

		this.onLoadDeferred = new dojo.Deferred(dojo.hitch(this, "cancel"));
		this._load();
		return this.onLoadDeferred;
	},

	_load: function(){
		// summary:
		//		Load/reload the href specified in this.href

		// display loading message
		this._setContent(this.onDownloadStart(), true);

		var self = this;
		var getArgs = {
			preventCache: (this.preventCache || this.refreshOnShow),
			url: this.href,
			handleAs: "text"
		};
		if(dojo.isObject(this.ioArgs)){
			dojo.mixin(getArgs, this.ioArgs);
		}

		var hand = (this._xhrDfd = (this.ioMethod || dojo.xhrGet)(getArgs));

		hand.addCallback(function(html){
			try{
				self._isDownloaded = true;
				self._setContent(html, false);
				self.onDownloadEnd();
			}catch(err){
				self._onError('Content', err); // onContentError
			}
			delete self._xhrDfd;
			return html;
		});

		hand.addErrback(function(err){
			if(!hand.canceled){
				// show error message in the pane
				self._onError('Download', err); // onDownloadError
			}
			delete self._xhrDfd;
			return err;
		});

		// Remove flag saying that a load is needed
		delete this._hrefChanged;
	},

	_onLoadHandler: function(data){
		// summary:
		//		This is called whenever new content is being loaded
		this.isLoaded = true;
		try{
			this.onLoadDeferred.callback(data);
			this.onLoad(data);
		}catch(e){
			console.error('Error '+this.widgetId+' running custom onLoad code: ' + e.message);
		}
	},

	_onUnloadHandler: function(){
		// summary:
		//		This is called whenever the content is being unloaded
		this.isLoaded = false;
		try{
			this.onUnload();
		}catch(e){
			console.error('Error '+this.widgetId+' running custom onUnload code: ' + e.message);
		}
	},

	destroyDescendants: function(){
		// summary:
		//		Destroy all the widgets inside the ContentPane and empty containerNode

		// Make sure we call onUnload (but only when the ContentPane has real content)
		if(this.isLoaded){
			this._onUnloadHandler();
		}

		// Even if this.isLoaded == false there might still be a "Loading..." message
		// to erase, so continue...

		// For historical reasons we need to delete all widgets under this.containerNode,
		// even ones that the user has created manually.
		var setter = this._contentSetter;
		dojo.forEach(this.getChildren(), function(widget){
			if(widget.destroyRecursive){
				widget.destroyRecursive();
			}
		});
		if(setter){
			// Most of the widgets in setter.parseResults have already been destroyed, but
			// things like Menu that have been moved to <body> haven't yet
			dojo.forEach(setter.parseResults, function(widget){
				if(widget.destroyRecursive && widget.domNode && widget.domNode.parentNode == dojo.body()){
					widget.destroyRecursive();
				}
			});
			delete setter.parseResults;
		}

		// And then clear away all the DOM nodes
		dojo.html._emptyNode(this.containerNode);

		// Delete any state information we have about current contents
		delete this._singleChild;
	},

	_setContent: function(cont, isFakeContent){
		// summary:
		//		Insert the content into the container node

		// first get rid of child widgets
		this.destroyDescendants();

		// dojo.html.set will take care of the rest of the details
		// we provide an override for the error handling to ensure the widget gets the errors
		// configure the setter instance with only the relevant widget instance properties
		// NOTE: unless we hook into attr, or provide property setters for each property,
		// we need to re-configure the ContentSetter with each use
		var setter = this._contentSetter;
		if(! (setter && setter instanceof dojo.html._ContentSetter)){
			setter = this._contentSetter = new dojo.html._ContentSetter({
				node: this.containerNode,
				_onError: dojo.hitch(this, this._onError),
				onContentError: dojo.hitch(this, function(e){
					// fires if a domfault occurs when we are appending this.errorMessage
					// like for instance if domNode is a UL and we try append a DIV
					var errMess = this.onContentError(e);
					try{
						this.containerNode.innerHTML = errMess;
					}catch(e){
						console.error('Fatal '+this.id+' could not change content due to '+e.message, e);
					}
				})/*,
				_onError */
			});
		};

		var setterParams = dojo.mixin({
			cleanContent: this.cleanContent,
			extractContent: this.extractContent,
			parseContent: this.parseOnLoad
		}, this._contentSetterParams || {});

		dojo.mixin(setter, setterParams);

		setter.set( (dojo.isObject(cont) && cont.domNode) ? cont.domNode : cont );

		// setter params must be pulled afresh from the ContentPane each time
		delete this._contentSetterParams;

		if(!isFakeContent){
			// Startup each top level child widget (and they will start their children, recursively)
			dojo.forEach(this.getChildren(), function(child){
				// The parser has already called startup on all widgets *without* a getParent() method
				if(!this.parseOnLoad || child.getParent){
					child.startup();
				}
			}, this);

			// Call resize() on each of my child layout widgets,
			// or resize() on my single child layout widget...
			// either now (if I'm currently visible)
			// or when I become visible
			this._scheduleLayout();

			this._onLoadHandler(cont);
		}
	},

	_onError: function(type, err, consoleText){
		this.onLoadDeferred.errback(err);

		// shows user the string that is returned by on[type]Error
		// overide on[type]Error and return your own string to customize
		var errText = this['on' + type + 'Error'].call(this, err);
		if(consoleText){
			console.error(consoleText, err);
		}else if(errText){// a empty string won't change current content
			this._setContent(errText, true);
		}
	},

	_scheduleLayout: function(){
		// summary:
		//		Call resize() on each of my child layout widgets, either now
		//		(if I'm currently visible) or when I become visible
		if(this._isShown()){
			this._layoutChildren();
		}else{
			this._needLayout = true;
		}
	},

	_layoutChildren: function(){
		// summary:
		//		Since I am a Container widget, each of my children expects me to
		//		call resize() or layout() on them.
		// description:
		//		Should be called on initialization and also whenever we get new content
		//		(from an href, or from attr('content', ...))... but deferred until
		//		the ContentPane is visible

		if(this.doLayout){
			this._checkIfSingleChild();
		}

		if(this._singleChild && this._singleChild.resize){
			var cb = this._contentBox || dojo.contentBox(this.containerNode);

			// note: if widget has padding this._contentBox will have l and t set,
			// but don't pass them to resize() or it will doubly-offset the child
			this._singleChild.resize({w: cb.w, h: cb.h});
		}else{
			// All my child widgets are independently sized (rather than matching my size),
			// but I still need to call resize() on each child to make it layout.
			dojo.forEach(this.getChildren(), function(widget){
				if(widget.resize){
					widget.resize();
				}
			});
		}
		delete this._needLayout;
	},

	// EVENT's, should be overide-able
	onLoad: function(data){
		// summary:
		//		Event hook, is called after everything is loaded and widgetified
		// tags:
		//		callback
	},

	onUnload: function(){
		// summary:
		//		Event hook, is called before old content is cleared
		// tags:
		//		callback
	},

	onDownloadStart: function(){
		// summary:
		//		Called before download starts.
		// description:
		//		The string returned by this function will be the html
		//		that tells the user we are loading something.
		//		Override with your own function if you want to change text.
		// tags:
		//		extension
		return this.loadingMessage;
	},

	onContentError: function(/*Error*/ error){
		// summary:
		//		Called on DOM faults, require faults etc. in content.
		//
		//		In order to display an error message in the pane, return
		//		the error message from this method, as an HTML string.
		//
		//		By default (if this method is not overriden), it returns
		//		nothing, so the error message is just printed to the console.
		// tags:
		//		extension
	},

	onDownloadError: function(/*Error*/ error){
		// summary:
		//		Called when download error occurs.
		//
		//		In order to display an error message in the pane, return
		//		the error message from this method, as an HTML string.
		//
		//		Default behavior (if this method is not overriden) is to display
		//		the error message inside the pane.
		// tags:
		//		extension
		return this.errorMessage;
	},

	onDownloadEnd: function(){
		// summary:
		//		Called when download is finished.
		// tags:
		//		callback
	}
});

}

if(!dojo._hasResource["dijit.TooltipDialog"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.TooltipDialog"] = true;
dojo.provide("dijit.TooltipDialog");






dojo.declare(
		"dijit.TooltipDialog",
		[dijit.layout.ContentPane, dijit._Templated, dijit.form._FormMixin, dijit._DialogMixin],
		{
			// summary:
			//		Pops up a dialog that appears like a Tooltip

			// title: String
			// 		Description of tooltip dialog (required for a11y)
			title: "",

			// doLayout: [protected] Boolean
			//		Don't change this parameter from the default value.
			//		This ContentPane parameter doesn't make sense for TooltipDialog, since TooltipDialog
			//		is never a child of a layout container, nor can you specify the size of
			//		TooltipDialog in order to control the size of an inner widget.
			doLayout: false,

			// autofocus: Boolean
			// 		A Toggle to modify the default focus behavior of a Dialog, which
			// 		is to focus on the first dialog element after opening the dialog.
			//		False will disable autofocusing. Default: true
			autofocus: true,

			// baseClass: [protected] String
			//		The root className to use for the various states of this widget
			baseClass: "dijitTooltipDialog",

			// _firstFocusItem: [private] [readonly] DomNode
			//		The pointer to the first focusable node in the dialog.
			//		Set by `dijit._DialogMixin._getFocusItems`.
			_firstFocusItem: null,

			// _lastFocusItem: [private] [readonly] DomNode
			//		The pointer to which node has focus prior to our dialog.
			//		Set by `dijit._DialogMixin._getFocusItems`.
			_lastFocusItem: null,

			templateString: dojo.cache("dijit", "templates/TooltipDialog.html", "<div waiRole=\"presentation\">\n\t<div class=\"dijitTooltipContainer\" waiRole=\"presentation\">\n\t\t<div class =\"dijitTooltipContents dijitTooltipFocusNode\" dojoAttachPoint=\"containerNode\" tabindex=\"-1\" waiRole=\"dialog\"></div>\n\t</div>\n\t<div class=\"dijitTooltipConnector\" waiRole=\"presentation\"></div>\n</div>\n"),

			postCreate: function(){
				this.inherited(arguments);
				this.connect(this.containerNode, "onkeypress", "_onKey");
				this.containerNode.title = this.title;
			},

			orient: function(/*DomNode*/ node, /*String*/ aroundCorner, /*String*/ corner){
				// summary:
				//		Configure widget to be displayed in given position relative to the button.
				//		This is called from the dijit.popup code, and should not be called
				//		directly.
				// tags:
				//		protected
				var c = this._currentOrientClass;
				if(c){
					dojo.removeClass(this.domNode, c);
				}
				c = "dijitTooltipAB"+(corner.charAt(1) == 'L'?"Left":"Right")+" dijitTooltip"+(corner.charAt(0) == 'T' ? "Below" : "Above");
				dojo.addClass(this.domNode, c);
				this._currentOrientClass = c;
			},

			onOpen: function(/*Object*/ pos){
				// summary:
				//		Called when dialog is displayed.
				//		This is called from the dijit.popup code, and should not be called directly.
				// tags:
				//		protected

				this.orient(this.domNode,pos.aroundCorner, pos.corner);
				this._onShow(); // lazy load trigger

				if(this.autofocus){
					this._getFocusItems(this.containerNode);
					dijit.focus(this._firstFocusItem);
				}
			},

			onClose: function(){
				// summary:
				//		Called when dialog is hidden.
				//		This is called from the dijit.popup code, and should not be called directly.
				// tags:
				//		protected
				this.onHide();
			},

			_onKey: function(/*Event*/ evt){
				// summary:
				//		Handler for keyboard events
				// description:
				//		Keep keyboard focus in dialog; close dialog on escape key
				// tags:
				//		private

				var node = evt.target;
				var dk = dojo.keys;
				if(evt.charOrCode === dk.TAB){
					this._getFocusItems(this.containerNode);
				}
				var singleFocusItem = (this._firstFocusItem == this._lastFocusItem);
				if(evt.charOrCode == dk.ESCAPE){
					// Use setTimeout to avoid crash on IE, see #10396.
					setTimeout(dojo.hitch(this, "onCancel"), 0);
					dojo.stopEvent(evt);
				}else if(node == this._firstFocusItem && evt.shiftKey && evt.charOrCode === dk.TAB){
					if(!singleFocusItem){
						dijit.focus(this._lastFocusItem); // send focus to last item in dialog
					}
					dojo.stopEvent(evt);
				}else if(node == this._lastFocusItem && evt.charOrCode === dk.TAB && !evt.shiftKey){
					if(!singleFocusItem){
						dijit.focus(this._firstFocusItem); // send focus to first item in dialog
					}
					dojo.stopEvent(evt);
				}else if(evt.charOrCode === dk.TAB){
					// we want the browser's default tab handling to move focus
					// but we don't want the tab to propagate upwards
					evt.stopPropagation();
				}
			}
		}
	);

}

if(!dojo._hasResource["dijit.Dialog"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.Dialog"] = true;
dojo.provide("dijit.Dialog");













/*=====
dijit._underlay = function(kwArgs){
	// summary:
	//		A shared instance of a `dijit.DialogUnderlay`
	//
	// description:
	//		A shared instance of a `dijit.DialogUnderlay` created and
	//		used by `dijit.Dialog`, though never created until some Dialog
	//		or subclass thereof is shown.
};
=====*/

dojo.declare(
	"dijit._DialogBase",
	[dijit._Templated, dijit.form._FormMixin, dijit._DialogMixin],
	{
		// summary:
		//		A modal dialog Widget
		//
		// description:
		//		Pops up a modal dialog window, blocking access to the screen
		//		and also graying out the screen Dialog is extended from
		//		ContentPane so it supports all the same parameters (href, etc.)
		//
		// example:
		// |	<div dojoType="dijit.Dialog" href="test.html"></div>
		//
		// example:
		// |	var foo = new dijit.Dialog({ title: "test dialog", content: "test content" };
		// |	dojo.body().appendChild(foo.domNode);
		// |	foo.startup();

		templateString: dojo.cache("dijit", "templates/Dialog.html", "<div class=\"dijitDialog\" tabindex=\"-1\" waiRole=\"dialog\" waiState=\"labelledby-${id}_title\">\n\t<div dojoAttachPoint=\"titleBar\" class=\"dijitDialogTitleBar\">\n\t<span dojoAttachPoint=\"titleNode\" class=\"dijitDialogTitle\" id=\"${id}_title\"></span>\n\t<span dojoAttachPoint=\"closeButtonNode\" class=\"dijitDialogCloseIcon\" dojoAttachEvent=\"onclick: onCancel, onmouseenter: _onCloseEnter, onmouseleave: _onCloseLeave\" title=\"${buttonCancel}\">\n\t\t<span dojoAttachPoint=\"closeText\" class=\"closeText\" title=\"${buttonCancel}\">x</span>\n\t</span>\n\t</div>\n\t\t<div dojoAttachPoint=\"containerNode\" class=\"dijitDialogPaneContent\"></div>\n</div>\n"),

		attributeMap: dojo.delegate(dijit._Widget.prototype.attributeMap, {
			title: [
				{ node: "titleNode", type: "innerHTML" },
				{ node: "titleBar", type: "attribute" }
			],
			"aria-describedby":""
		}),

		// open: Boolean
		//		True if Dialog is currently displayed on screen.
		open: false,

		// duration: Integer
		//		The time in milliseconds it takes the dialog to fade in and out
		duration: dijit.defaultDuration,

		// refocus: Boolean
		// 		A Toggle to modify the default focus behavior of a Dialog, which
		// 		is to re-focus the element which had focus before being opened.
		//		False will disable refocusing. Default: true
		refocus: true,

		// autofocus: Boolean
		// 		A Toggle to modify the default focus behavior of a Dialog, which
		// 		is to focus on the first dialog element after opening the dialog.
		//		False will disable autofocusing. Default: true
		autofocus: true,

		// _firstFocusItem: [private] [readonly] DomNode
		//		The pointer to the first focusable node in the dialog.
		//		Set by `dijit._DialogMixin._getFocusItems`.
		_firstFocusItem: null,

		// _lastFocusItem: [private] [readonly] DomNode
		//		The pointer to which node has focus prior to our dialog.
		//		Set by `dijit._DialogMixin._getFocusItems`.
		_lastFocusItem: null,

		// doLayout: [protected] Boolean
		//		Don't change this parameter from the default value.
		//		This ContentPane parameter doesn't make sense for Dialog, since Dialog
		//		is never a child of a layout container, nor can you specify the size of
		//		Dialog in order to control the size of an inner widget.
		doLayout: false,

		// draggable: Boolean
		//		Toggles the moveable aspect of the Dialog. If true, Dialog
		//		can be dragged by it's title. If false it will remain centered
		//		in the viewport.
		draggable: true,

		//aria-describedby: String
		//		Allows the user to add an aria-describedby attribute onto the dialog.   The value should
		//		be the id of the container element of text that describes the dialog purpose (usually
		//		the first text in the dialog).
		//		<div dojoType="dijit.Dialog" aria-describedby="intro" .....>
		//			<div id="intro">Introductory text</div>
		//			<div>rest of dialog contents</div>
		//		</div>
		"aria-describedby":"",

		postMixInProperties: function(){
			var _nlsResources = dojo.i18n.getLocalization("dijit", "common");
			dojo.mixin(this, _nlsResources);
			this.inherited(arguments);
		},

		postCreate: function(){
			dojo.style(this.domNode, {
				display: "none",
				position:"absolute"
			});
			dojo.body().appendChild(this.domNode);

			this.inherited(arguments);

			this.connect(this, "onExecute", "hide");
			this.connect(this, "onCancel", "hide");
			this._modalconnects = [];
		},

		onLoad: function(){
			// summary:
			//		Called when data has been loaded from an href.
			//		Unlike most other callbacks, this function can be connected to (via `dojo.connect`)
			//		but should *not* be overriden.
			// tags:
			//		callback

			// when href is specified we need to reposition the dialog after the data is loaded
			this._position();
			this.inherited(arguments);
		},

		_endDrag: function(e){
			// summary:
			//		Called after dragging the Dialog. Saves the position of the dialog in the viewport.
			// tags:
			//		private
			if(e && e.node && e.node === this.domNode){
				this._relativePosition = dojo.position(e.node);
			}
		},

		_setup: function(){
			// summary:
			//		Stuff we need to do before showing the Dialog for the first
			//		time (but we defer it until right beforehand, for
			//		performance reasons).
			// tags:
			//		private

			var node = this.domNode;

			if(this.titleBar && this.draggable){
				this._moveable = (dojo.isIE == 6) ?
					new dojo.dnd.TimedMoveable(node, { handle: this.titleBar }) :	// prevent overload, see #5285
					new dojo.dnd.Moveable(node, { handle: this.titleBar, timeout: 0 });
				dojo.subscribe("/dnd/move/stop",this,"_endDrag");
			}else{
				dojo.addClass(node,"dijitDialogFixed");
			}

			this.underlayAttrs = {
				dialogId: this.id,
				"class": dojo.map(this["class"].split(/\s/), function(s){ return s+"_underlay"; }).join(" ")
			};

			this._fadeIn = dojo.fadeIn({
				node: node,
				duration: this.duration,
				beforeBegin: dojo.hitch(this, function(){
					var underlay = dijit._underlay;
					if(!underlay){
						underlay = dijit._underlay = new dijit.DialogUnderlay(this.underlayAttrs);
					}else{
						underlay.attr(this.underlayAttrs);
					}

					var zIndex = 948 + dijit._dialogStack.length*2;
					dojo.style(dijit._underlay.domNode, 'zIndex', zIndex);
					dojo.style(this.domNode, 'zIndex', zIndex + 1);
					underlay.show();
				}),
				onEnd: dojo.hitch(this, function(){
					if(this.autofocus){
						// find focusable Items each time dialog is shown since if dialog contains a widget the
						// first focusable items can change
						this._getFocusItems(this.domNode);
						dijit.focus(this._firstFocusItem);
					}
				})
			 });

			this._fadeOut = dojo.fadeOut({
				node: node,
				duration: this.duration,
				onEnd: dojo.hitch(this, function(){
					node.style.display = "none";

					// Restore the previous dialog in the stack, or if this is the only dialog
					// then restore to original page
					var ds = dijit._dialogStack;
					if(ds.length == 0){
						dijit._underlay.hide();
					}else{
						dojo.style(dijit._underlay.domNode, 'zIndex', 948 + ds.length*2);
						dijit._underlay.attr(ds[ds.length-1].underlayAttrs);
					}

					// Restore focus to wherever it was before this dialog was displayed
					if(this.refocus){
						var focus = this._savedFocus;

						// If we are returning control to a previous dialog but for some reason
						// that dialog didn't have a focused field, set focus to first focusable item.
						// This situation could happen if two dialogs appeared at nearly the same time,
						// since a dialog doesn't set it's focus until the fade-in is finished.
						if(ds.length > 0){
							var pd = ds[ds.length-1];
							if(!dojo.isDescendant(focus.node, pd.domNode)){
								pd._getFocusItems(pd.domNode);
								focus = pd._firstFocusItem;
							}
						}

						dijit.focus(focus);
					}
				})
			 });
		},

		uninitialize: function(){
			var wasPlaying = false;
			if(this._fadeIn && this._fadeIn.status() == "playing"){
				wasPlaying = true;
				this._fadeIn.stop();
			}
			if(this._fadeOut && this._fadeOut.status() == "playing"){
				wasPlaying = true;
				this._fadeOut.stop();
			}
			
			// Hide the underlay, unless the underlay widget has already been destroyed
			// because we are being called during page unload (when all widgets are destroyed)
			if((this.open || wasPlaying) && !dijit._underlay._destroyed){
				dijit._underlay.hide();
			}
			if(this._moveable){
				this._moveable.destroy();
			}
			this.inherited(arguments);
		},

		_size: function(){
			// summary:
			// 		If necessary, shrink dialog contents so dialog fits in viewport
			// tags:
			//		private

			this._checkIfSingleChild();

			// If we resized the dialog contents earlier, reset them back to original size, so
			// that if the user later increases the viewport size, the dialog can display w/out a scrollbar.
			// Need to do this before the dojo.marginBox(this.domNode) call below.
			if(this._singleChild){
				if(this._singleChildOriginalStyle){
					this._singleChild.domNode.style.cssText = this._singleChildOriginalStyle;
				}
				delete this._singleChildOriginalStyle;
			}else{
				dojo.style(this.containerNode, {
					width:"auto",
					height:"auto"
				});
			}

			var mb = dojo.marginBox(this.domNode);
			var viewport = dijit.getViewport();
			if(mb.w >= viewport.w || mb.h >= viewport.h){
				// Reduce size of dialog contents so that dialog fits in viewport

				var w = Math.min(mb.w, Math.floor(viewport.w * 0.75)),
					h = Math.min(mb.h, Math.floor(viewport.h * 0.75));

				if(this._singleChild && this._singleChild.resize){
					this._singleChildOriginalStyle = this._singleChild.domNode.style.cssText;
					this._singleChild.resize({w: w, h: h});
				}else{
					dojo.style(this.containerNode, {
						width: w + "px",
						height: h + "px",
						overflow: "auto",
						position: "relative"	// workaround IE bug moving scrollbar or dragging dialog
					});
				}
			}else{
				if(this._singleChild && this._singleChild.resize){
					this._singleChild.resize();
				}
			}
		},

		_position: function(){
			// summary:
			//		Position modal dialog in the viewport. If no relative offset
			//		in the viewport has been determined (by dragging, for instance),
			//		center the node. Otherwise, use the Dialog's stored relative offset,
			//		and position the node to top: left: values based on the viewport.
			// tags:
			//		private
			if(!dojo.hasClass(dojo.body(),"dojoMove")){
				var node = this.domNode,
					viewport = dijit.getViewport(),
					p = this._relativePosition,
					bb = p ? null : dojo._getBorderBox(node),
					l = Math.floor(viewport.l + (p ? p.x : (viewport.w - bb.w) / 2)),
					t = Math.floor(viewport.t + (p ? p.y : (viewport.h - bb.h) / 2))
				;
				dojo.style(node,{
					left: l + "px",
					top: t + "px"
				});
			}
		},

		_onKey: function(/*Event*/ evt){
			// summary:
			//		Handles the keyboard events for accessibility reasons
			// tags:
			//		private

			var ds = dijit._dialogStack;
			if(ds[ds.length-1] != this){
				// console.debug(this.id + ': skipping because', this, 'is not the active dialog');
				return;
			}

			if(evt.charOrCode){
				var dk = dojo.keys;
				var node = evt.target;
				if(evt.charOrCode === dk.TAB){
					this._getFocusItems(this.domNode);
				}
				var singleFocusItem = (this._firstFocusItem == this._lastFocusItem);
				// see if we are shift-tabbing from first focusable item on dialog
				if(node == this._firstFocusItem && evt.shiftKey && evt.charOrCode === dk.TAB){
					if(!singleFocusItem){
						dijit.focus(this._lastFocusItem); // send focus to last item in dialog
					}
					dojo.stopEvent(evt);
				}else if(node == this._lastFocusItem && evt.charOrCode === dk.TAB && !evt.shiftKey){
					if(!singleFocusItem){
						dijit.focus(this._firstFocusItem); // send focus to first item in dialog
					}
					dojo.stopEvent(evt);
				}else{
					// see if the key is for the dialog
					while(node){
						if(node == this.domNode || dojo.hasClass(node, "dijitPopup")){
							if(evt.charOrCode == dk.ESCAPE){
								this.onCancel();
							}else{
								return; // just let it go
							}
						}
						node = node.parentNode;
					}
					// this key is for the disabled document window
					if(evt.charOrCode !== dk.TAB){ // allow tabbing into the dialog for a11y
						dojo.stopEvent(evt);
					// opera won't tab to a div
					}else if(!dojo.isOpera){
						try{
							this._firstFocusItem.focus();
						}catch(e){ /*squelch*/ }
					}
				}
			}
		},

		show: function(){
			// summary:
			//		Display the dialog
			if(this.open){ return; }

			// first time we show the dialog, there's some initialization stuff to do
			if(!this._alreadyInitialized){
				this._setup();
				this._alreadyInitialized=true;
			}

			if(this._fadeOut.status() == "playing"){
				this._fadeOut.stop();
			}

			this._modalconnects.push(dojo.connect(window, "onscroll", this, "layout"));
			this._modalconnects.push(dojo.connect(window, "onresize", this, function(){
				// IE gives spurious resize events and can actually get stuck
				// in an infinite loop if we don't ignore them
				var viewport = dijit.getViewport();
				if(!this._oldViewport ||
						viewport.h != this._oldViewport.h ||
						viewport.w != this._oldViewport.w){
					this.layout();
					this._oldViewport = viewport;
				}
			}));
			this._modalconnects.push(dojo.connect(dojo.doc.documentElement, "onkeypress", this, "_onKey"));

			dojo.style(this.domNode, {
				opacity:0,
				display:""
			});

			this.open = true;
			this._onShow(); // lazy load trigger

			this._size();
			this._position();
			dijit._dialogStack.push(this);
			this._fadeIn.play();

			this._savedFocus = dijit.getFocus(this);
		},

		hide: function(){
			// summary:
			//		Hide the dialog

			// if we haven't been initialized yet then we aren't showing and we can just return
			// or if we aren't the active dialog, don't allow us to close yet
			var ds = dijit._dialogStack;
			if(!this._alreadyInitialized || this != ds[ds.length-1]){
				return;
			}

			if(this._fadeIn.status() == "playing"){
				this._fadeIn.stop();
			}

			// throw away current active dialog from stack -- making the previous dialog or the node on the original page active
			ds.pop();

			this._fadeOut.play();

			if(this._scrollConnected){
				this._scrollConnected = false;
			}
			dojo.forEach(this._modalconnects, dojo.disconnect);
			this._modalconnects = [];

			if(this._relativePosition){
				delete this._relativePosition;
			}
			this.open = false;

			this.onHide();
		},

		layout: function(){
			// summary:
			//		Position the Dialog and the underlay
			// tags:
			//		private
			if(this.domNode.style.display != "none"){
				if(dijit._underlay){	// avoid race condition during show()
					dijit._underlay.layout();
				}
				this._position();
			}
		},

		destroy: function(){
			dojo.forEach(this._modalconnects, dojo.disconnect);
			if(this.refocus && this.open){
				setTimeout(dojo.hitch(dijit,"focus",this._savedFocus), 25);
			}
			this.inherited(arguments);
		},

		_onCloseEnter: function(){
			// summary:
			//		Called when user hovers over close icon
			// tags:
			//		private
			dojo.addClass(this.closeButtonNode, "dijitDialogCloseIcon-hover");
		},

		_onCloseLeave: function(){
			// summary:
			//		Called when user stops hovering over close icon
			// tags:
			//		private
			dojo.removeClass(this.closeButtonNode, "dijitDialogCloseIcon-hover");
		}
	}
);

dojo.declare(
	"dijit.Dialog",
	[dijit.layout.ContentPane, dijit._DialogBase],
	{}
);

// Stack of currenctly displayed dialogs, layered on top of each other
dijit._dialogStack = [];

// For back-compat.  TODO: remove in 2.0


}

if(!dojo._hasResource["persevere.Login"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["persevere.Login"] = true;
dojo.provide("persevere.Login");






dojo.declare("persevere.Login", dijit.Dialog,
{
    // summary: A login/register Dialog for a persevere server
    //
    // description: 
    // Displays a dialog for logging into a persevere server and also allows new users
    // to register.  You can provide your own login and register forms via 'loginHref'
    // and 'registerHref'.  'Login' and 'Register' buttons will be automatically added
    // to the login dialog and 'Register' and 'Cancel' buttons will be automatically
    // added to the register dialog.
    //
    // example:
    // |    <div dojoType="dojox.data.persevere.Login" userUrl="/Class/User"></div>
    //
    // example:
    // |    var foo = new dojox.data.persevere.Login({userUrl: "/Class/User"});
	// |	dojo.body().appendChild(foo.domNode);
	// |	foo.startup();
    
    // TODO:  need to try to make this so that you can only have one instance per page.
    //        consider disabling the close (x) button on the dialog.
    
    // currentUser: Object
    //        The last user to be logged in via this widget.
    currentUser: null,
    
    // userUrl: String
    //        The url to the 'User' class.  This url is used to authenticate
    //        and create users.
    userUrl: 'Class/User',
    
    // loginHref: String
    //        The url to be used as the href to the login form.
    loginHref: dojo.moduleUrl("persevere", 'resources/login/login.html'),
    
    // loginMethod: String
    //        The name of the method belonging to the Class at 'userUrl' that authenticates a user
    loginMethod: "authenticate",
    
    // registerHref: String
    //        The url to be used as the href to the form used to register a new user.
    registerHref: dojo.moduleUrl("persevere", 'resources/login/register.html'),
    
    // registerMethod: String
    //        The name of the method belonging to the Class at 'userUrl' that creates a new user
    registerMethod: "createUser",
    
    // userField: String
    //        The name of the username field in the form at 'loginHref'.
    userField: 'username',
    
    // passField: String
    //        The name of the password field in the form at 'loginHref'.
    passField: 'password',
    
    // newUserField: String
    //        The name of the new username field in the form at 'registerHref'.
    newUserField: 'newUsername',
    
    // newPassField: String
    //        The name of the new password field in the form at 'registerHref'.
    newPassField: 'newPassword',
    
    // confirmPassField: String
    //        The name of the confirm password field in the form at 'registerHref'.
    confirmPassField: 'confirmPassword',
    
    _loginTitle: 'Login',
    _registerTitle: 'Add a new User',
    
    constructor: function(options){
        dojo.mixin(this, options);
        // a progress bar to show that we're waiting on a response from the server
        this._busy = new dijit.ProgressBar({style:"display:none", indeterminate:true});
        // a place to put messages such as the error response from the server
        this._message = dojo.doc.createElement("div");
        dojo.query(this._message).style({color:"red", wordWrap:"break-word", width:"220px", margin:"auto"});
        // connect the ENTER key to the _onSubmit
        dojo.connect(this.domNode, "onkeypress", this, function(e){
            if(e.charOrCode == dojo.keys.ENTER){
                this._onSubmit();
            }
        });
    },
    
    startup: function(){
        this._showLogin();
    },
    
    _showLogin: function(){
        // summary: shows the login dialog
        this._message.innerHTML = '';
        var footer = dojo.doc.createElement('div');
        var buttons = dojo.doc.createElement('div');
        // need to find a better way to right-align the buttons - using dir:rtl and tabindex is not ideal
        buttons.setAttribute("dir", "rtl");
        var registerButton = new dijit.form.Button({type: "reset", label: "Register", tabIndex: "-1"}).placeAt(buttons);
        registerButton.onClick = dojo.hitch(this, "_showRegister");
        var loginButton = new dijit.form.Button({type: "submit", label: "Login"}).placeAt(buttons);
        footer.appendChild(buttons);
        footer.appendChild(this._message);
        this._busy.placeAt(footer);
        this.onDownloadEnd = function(){
            this.containerNode.appendChild(footer);
        };
        this.execute = this._login;
        this.attr("href", this.loginHref);
        this.attr("title", this._loginTitle);
        this.show();
    },
    
    _showRegister: function(){
        // summary: shows the register dialog
        this._message.innerHTML = '';
        var footer = dojo.doc.createElement('div');
        var buttons = dojo.doc.createElement('div');
        buttons.setAttribute("dir", "rtl");
        var cancelButton = new dijit.form.Button({type: "reset", label: "Cancel", tabIndex: "-1"}).placeAt(buttons);
        cancelButton.onClick = dojo.hitch(this, "_showLogin");
        var submitButton = new dijit.form.Button({type: "submit", label: "Register"}).placeAt(buttons);
        footer.appendChild(buttons);
        footer.appendChild(this._message);
        this._busy.placeAt(footer);
        this.onDownloadEnd = function(){
            this.containerNode.appendChild(footer);
        };
        this.execute = this._register;
        this.attr("href", this.registerHref);
        this.attr("title", this._registerTitle);
        this.show();
    },

    _login: function(form){
        // summary: this is the login action - it attempts to authenticate the user
        // using the "authenticate" method of the Class at 'userUrl' using the form params
        if (this.validate()){
            this._busy.attr("style", "display:block");
            dojo.xhrPost({
                url: this.userUrl,
                postData: dojo.toJson({method: this.loginMethod, id:"login", params:[form[this.userField], form[this.passField]]}),
                handleAs: "json",
                load: dojo.hitch(this, "_loginLoad"),
                error: dojo.hitch(this, "_loginError")
            });
        } else {
            this._message.innerHTML = 'Input is not valid';
            this.show();    
        }
    },
    
    _loginLoad: function(response, request){
        // summary: handles the response to the authentication attempt
        this._busy.attr("style", "display:none");
        if (response.error != null){
            this._message.innerHTML = response.error;
            this.onLoginFail(response, request);
        } else {
            this.currentUser = response.result;
            this.onLoginSuccess(response, request);
        }
        return response;
    },
    
    _loginError: function(response, request){
        // summary: handles login errors
        this._busy.attr("style", "display:none");
        this.onLoginError(response, request);
        return response;
    },
    
    _register: function(form){
        // summary: this is the register action - it attempts to register a new user
        // using the 'registerMethod' of the Class at the 'userUrl'
        if (this.validate() && (form[this.newPassField] == form[this.confirmPassField])){
            this._busy.attr("style", "display:block");
            dojo.xhrPost({
                url: this.userUrl,
        	    postData: dojo.toJson({method: this.registerMethod,id:"register", params:[form[this.newUserField], form[this.newPassField]]}),
                handleAs: "json",
                load: dojo.hitch(this, "_registerLoad"),
                error: dojo.hitch(this, "_registerError")
            })
        } else {
            this._message.innerHTML = 'Input is not valid';
            this.show();
        }
    },
    
    _registerLoad: function(response, request){
        this._busy.attr("style", "display:none");
        if (response.error != null){
            this._message.innerHTML = response.error;    
            this.onRegisterFail(response, request);
        } else {
            this.onRegisterSuccess(response, request);
        }
        return response;
    },
    
    _registerError: function(response, request){
        this._busy.attr("style", "display:none");
        this.onRegisterError(response, request);
        return response;
    },
    
    login: function(){
        this._showLogin();
    },
    
    logout: function(callBack){
	    if (confirm("Are you sure you want to sign out?")) {
            dojo.xhrPost({
                url: this.userUrl,
                postData: dojo.toJson({
                    method: this.loginMethod,
                    id: "logout",
                    params: [null, null]
                }),
                handleAs: "json",
                handle: function(response, request){
                    this.currentUser = null;
                }
            }).addCallback(callBack);
        }
    },
    
    onLoginSuccess: function(response, request){
    },
    
    onLoginFail: function(response, request){
        this.show();
    },
    
    onLoginError: function(response, request){
		console.error("HTTP status code: ", request.xhr.status);
    }, 

    onRegisterSuccess: function(response, request){
        // change this to authenticate the user and add the rest of the 
        // register params to the new user object
       /* var form = this.attr("value");
        var user = response.result;
        for (var attr in form){
            if (!user[attr] && (attr != this.newUserField) && (attr != this.newPassField) && (attr != this.confirmPassField)){
                user[attr] = form[attr];
            }
        }
        var login = dojo.xhrPost({
            url: this.userUrl,
            postData: dojo.toJson({method: this.loginMethod, id:"login", params:[form[this.newUserField], form[this.newPassField]]}),
            handleAs: "json",
            handle: dojo.hitch(this, "_loginHandle"),
            error: dojo.hitch(this, "_loginError")
        });
        var call = {
            url: this.userUrl + response.result.id
            // pick up from here... - need to add the other fields to the user object.
        }
        login.addCallback(dojo.hitch(this, function(){
            dojo.xhrPut({
                url: this.userUrl + response.result.id
            })
        }));*/
        this._showLogin();
        this._message.innerHTML = 'Registration successful.  Please login.'
    },
    
    onRegisterFail: function(response, request){
        this.show();
    },
    
    onRegisterError: function(response, request){
		console.error("HTTP status code: ", request.xhr.status);
    }
});

}


dojo.i18n._preloadLocalizations("persevere.nls.Login", ["ROOT","ar","ca","cs","da","de","de-de","el","en","en-gb","en-us","es","es-es","fi","fi-fi","fr","fr-fr","he","he-il","hu","it","it-it","ja","ja-jp","ko","ko-kr","nb","nl","nl-nl","pl","pt","pt-br","pt-pt","ru","sk","sl","sv","th","tr","xx","zh","zh-cn","zh-tw"]);
