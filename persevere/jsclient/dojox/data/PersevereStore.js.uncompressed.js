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

if(!dojo._hasResource["dojox.data.ServiceStore"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.data.ServiceStore"] = true;
dojo.provide("dojox.data.ServiceStore");

// note that dojox.rpc.Service is not required, you can create your own services

// A ServiceStore is a readonly data store that provides a data.data interface to an RPC service.
// var myServices = new dojox.rpc.Service(dojo.moduleUrl("dojox.rpc.tests.resources", "test.smd"));
// var serviceStore = new dojox.data.ServiceStore({service:myServices.ServiceStore});
//
// The ServiceStore also supports lazy loading. References can be made to objects that have not been loaded.
//	For example if a service returned:
// {"name":"Example","lazyLoadedObject":{"$ref":"obj2"}}
//
// And this object has accessed using the dojo.data API:
// var obj = serviceStore.getValue(myObject,"lazyLoadedObject");
// The object would automatically be requested from the server (with an object id of "obj2").
//

dojo.declare("dojox.data.ServiceStore",
	// ClientFilter is intentionally not required, ServiceStore does not need it, and is more
	// lightweight without it, but if it is provided, the ServiceStore will use it.
	dojox.data.ClientFilter,{
		service: null,
		constructor: function(options){
			//summary:
			//		ServiceStore constructor, instantiate a new ServiceStore
			// 		A ServiceStore can be configured from a JSON Schema. Queries are just
			// 		passed through to the underlying services
			//
			// options:
			// 		Keyword arguments
			// The *schema* parameter
			//		This is a schema object for this store. This should be JSON Schema format.
			//
			// The *service* parameter
			// 		This is the service object that is used to retrieve lazy data and save results
			// 		The function should be directly callable with a single parameter of an object id to be loaded
			//
			// The *idAttribute* parameter
			//		Defaults to 'id'. The name of the attribute that holds an objects id.
			//		This can be a preexisting id provided by the server.
			//		If an ID isn't already provided when an object
			//		is fetched or added to the store, the autoIdentity system
			//		will generate an id for it and add it to the index.
			//
			// The *estimateCountFactor* parameter
			// 		This parameter is used by the ServiceStore to estimate the total count. When
			//		paging is indicated in a fetch and the response includes the full number of items
			//	 	requested by the fetch's count parameter, then the total count will be estimated
			//		to be estimateCountFactor multiplied by the provided count. If this is 1, then it is assumed that the server
			//		does not support paging, and the response is the full set of items, where the
			// 		total count is equal to the numer of items returned. If the server does support
			//		paging, an estimateCountFactor of 2 is a good value for estimating the total count
			//		It is also possible to override _processResults if the server can provide an exact
			// 		total count.
			//
			// The *syncMode* parameter
			//		Setting this to true will set the store to using synchronous calls by default.
			//		Sync calls return their data immediately from the calling function, so
			//		callbacks are unnecessary. This will only work with a synchronous capable service.
			//
			// description:
			//		ServiceStore can do client side caching and result set updating if
			// 		dojox.data.ClientFilter is loaded. Do this add:
			//	|	dojo.require("dojox.data.ClientFilter")
			//		prior to loading the ServiceStore (ClientFilter must be loaded before ServiceStore).
			//		To utilize client side filtering with a subclass, you can break queries into
			//		client side and server side components by putting client side actions in
			//		clientFilter property in fetch calls. For example you could override fetch:
			//	|	fetch: function(args){
				//	|		// do the sorting and paging on the client side
	 			//	|		args.clientFilter = {start:args.start, count: args.count, sort: args.sort};
	 			//	|		// args.query will be passed to the service object for the server side handling
	 			//	|		return this.inherited(arguments);
			//	|	}
			//		When extending this class, if you would like to create lazy objects, you can follow
			//		the example from dojox.data.tests.stores.ServiceStore:
			// |	var lazyItem = {
			// |		_loadObject: function(callback){
			// |			this.name="loaded";
			// |			delete this._loadObject;
			// |			callback(this);
			// |		}
			// |	};
			//setup a byId alias to the api call
			this.byId=this.fetchItemByIdentity;
			this._index = {};
			// if the advanced json parser is enabled, we can pass through object updates as onSet events
			if(options){
				dojo.mixin(this,options);
			}
			// We supply a default idAttribute for parser driven construction, but if no id attribute
			//	is supplied, it should be null so that auto identification takes place properly
			this.idAttribute = (options && options.idAttribute) || (this.schema && this.schema._idAttr);
			this.labelAttribute = this.labelAttribute || "label";
		},
		schema: null,
		idAttribute: "id",
		syncMode: false,
		estimateCountFactor: 1,
		getSchema: function(){
			return this.schema;
		},

		loadLazyValues:true,

		getValue: function(/*Object*/ item, /*String*/property, /*value?*/defaultValue){
			// summary:
			//	Gets the value of an item's 'property'
			//
			//	item:
			//		The item to get the value from
			//	property:
			//		property to look up value for
			//	defaultValue:
			//		the default value

			var value = item[property];
			return value || // return the plain value since it was found;
						(property in item ? // a truthy value was not found, see if we actually have it
							value : // we do, so we can return it
							item._loadObject ? // property was not found, maybe because the item is not loaded, we will try to load it synchronously so we can get the property
								(dojox.rpc._sync = true) && arguments.callee.call(this,dojox.data.ServiceStore.prototype.loadItem({item:item}) || {}, property, defaultValue) : // load the item and run getValue again
								defaultValue);// not in item -> return default value
		},
		getValues: function(item, property){
			// summary:
			//		Gets the value of an item's 'property' and returns
			//		it.	If this value is an array it is just returned,
			//		if not, the value is added to an array and that is returned.
			//
			//	item: /* object */
			//	property: /* string */
			//		property to look up value for

			var val = this.getValue(item,property);
			return val instanceof Array ? val : val === undefined ? [] : [val];
		},

		getAttributes: function(item){
			// summary:
			//	Gets the available attributes of an item's 'property' and returns
			//	it as an array.
			//
			//	item: /* object */

			var res = [];
			for(var i in item){
				if(item.hasOwnProperty(i) && !(i.charAt(0) == '_' && i.charAt(1) == '_')){
					res.push(i);
				}
			}
			return res;
		},

		hasAttribute: function(item,attribute){
			// summary:
			//		Checks to see if item has attribute
			//
			//	item: /* object */
			//	attribute: /* string */
			return attribute in item;
		},

		containsValue: function(item, attribute, value){
			// summary:
			//		Checks to see if 'item' has 'value' at 'attribute'
			//
			//	item: /* object */
			//	attribute: /* string */
			//	value: /* anything */
			return dojo.indexOf(this.getValues(item,attribute),value) > -1;
		},


		isItem: function(item){
			// summary:
			//		Checks to see if the argument is an item
			//
			//	item: /* object */
			//	attribute: /* string */

			// we have no way of determining if it belongs, we just have object returned from
			// 	service queries
			return (typeof item == 'object') && item && !(item instanceof Date);
		},

		isItemLoaded: function(item){
			// summary:
			//		Checks to see if the item is loaded.
			//
			//		item: /* object */

			return item && !item._loadObject;
		},

		loadItem: function(args){
			// summary:
			// 		Loads an item and calls the callback handler. Note, that this will call the callback
			// 		handler even if the item is loaded. Consequently, you can use loadItem to ensure
			// 		that an item is loaded is situations when the item may or may not be loaded yet.
			// 		If you access a value directly through property access, you can use this to load
			// 		a lazy value as well (doesn't need to be an item).
			//
			//	example:
			//		store.loadItem({
			//			item: item, // this item may or may not be loaded
			//			onItem: function(item){
			// 				// do something with the item
			//			}
			//		});

			var item;
			if(args.item._loadObject){
				args.item._loadObject(function(result){
					item = result; // in synchronous mode this can allow loadItem to return the value
					delete item._loadObject;
					var func = result instanceof Error ? args.onError : args.onItem;
					if(func){
						func.call(args.scope, result);
					}
				});
			}else if(args.onItem){
				// even if it is already loaded, we will use call the callback, this makes it easier to
				// use when it is not known if the item is loaded (you can always safely call loadItem).
				args.onItem.call(args.scope, args.item);
			}
			return item;
		},
		_currentId : 0,
		_processResults : function(results, deferred){
			// this should return an object with the items as an array and the total count of
			// items (maybe more than currently in the result set).
			// for example:
			//	| {totalCount:10, items: [{id:1},{id:2}]}

			// index the results, assigning ids as necessary

			if(results && typeof results == 'object'){
				var id = results.__id;
				if(!id){// if it hasn't been assigned yet
					if(this.idAttribute){
						// use the defined id if available
						id = results[this.idAttribute];
					}else{
						id = this._currentId++;
					}
					if(id !== undefined){
						var existingObj = this._index[id];
						if(existingObj){
							for(var j in existingObj){
								delete existingObj[j]; // clear it so we can mixin
							}
							results = dojo.mixin(existingObj,results);
						}
						results.__id = id;
						this._index[id] = results;
					}
				}
				for(var i in results){
					results[i] = this._processResults(results[i], deferred).items;
				}
				var count = results.length;
			}
			return {totalCount: deferred.request.count == count ? (deferred.request.start || 0) + count * this.estimateCountFactor : count, items: results};
		},
		close: function(request){
			return request && request.abort && request.abort();
		},
		fetch: function(args){
			// summary:
			//		See dojo.data.api.Read.fetch
			//
			// The *queryOptions.cache* parameter
			//		If true, indicates that the query result should be cached for future use. This is only available
			// 		if dojox.data.ClientFilter has been loaded before the ServiceStore
			//
			//	The *syncMode* parameter
			//		Indicates that the call should be fetch synchronously if possible (this is not always possible)
			//
			// The *clientFetch* parameter
			//		This is a fetch keyword argument for explicitly doing client side filtering, querying, and paging

			args = args || {};

			if("syncMode" in args ? args.syncMode : this.syncMode){
				dojox.rpc._sync = true;
			}
			var self = this;

			var scope = args.scope || self;
			var defResult = this.cachingFetch ? this.cachingFetch(args) : this._doQuery(args);
			defResult.request = args;
			defResult.addCallback(function(results){
				if(args.clientFetch){
					results = self.clientSideFetch({query:args.clientFetch,sort:args.sort,start:args.start,count:args.count},results);
				}
				var resultSet = self._processResults(results, defResult);
				results = args.results = resultSet.items;
				if(args.onBegin){
					args.onBegin.call(scope, resultSet.totalCount, args);
				}
				if(args.onItem){
					for(var i=0; i<results.length;i++){
						args.onItem.call(scope, results[i], args);
					}
				}
				if(args.onComplete){
					args.onComplete.call(scope, args.onItem ? null : results, args);
				}
				return results;
			});
			defResult.addErrback(args.onError && function(err){
				return args.onError.call(scope, err, args);
			});
			args.abort = function(){
				// abort the request
				defResult.cancel();
			};
			args.store = this;
			return args;
		},
		_doQuery: function(args){
			var query= typeof args.queryStr == 'string' ? args.queryStr : args.query;
			return this.service(query);
		},
		getFeatures: function(){
			// summary:
			// 		return the store feature set

			return {
				"dojo.data.api.Read": true,
				"dojo.data.api.Identity": true,
				"dojo.data.api.Schema": this.schema
			};
		},

		getLabel: function(item){
			// summary
			//		returns the label for an item. Just gets the "label" attribute.
			//
			return this.getValue(item,this.labelAttribute);
		},

		getLabelAttributes: function(item){
			// summary:
			//		returns an array of attributes that are used to create the label of an item
			return [this.labelAttribute];
		},

		//Identity API Support


		getIdentity: function(item){
			return item.__id;
		},

		getIdentityAttributes: function(item){
			// summary:
			//		returns the attributes which are used to make up the
			//		identity of an item.	Basically returns this.idAttribute

			return [this.idAttribute];
		},

		fetchItemByIdentity: function(args){
			// summary:
			//		fetch an item by its identity, by looking in our index of what we have loaded
			var item = this._index[(args._prefix || '') + args.identity];
			if(item){
				// the item exists in the index
				if(item._loadObject){
					// we have a handle on the item, but it isn't loaded yet, so we need to load it
					args.item = item;
					return this.loadItem(args);
				}else if(args.onItem){
					// it's already loaded, so we can immediately callback
					args.onItem.call(args.scope, item);
				}
			}else{
				// convert the different spellings
				return this.fetch({
						query: args.identity,
						onComplete: args.onItem,
						onError: args.onError,
						scope: args.scope
					}).results;
			}
			return item;
		}

	}
);

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

if(!dojo._hasResource["dojox.json.ref"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.json.ref"] = true;
dojo.provide("dojox.json.ref");



dojox.json.ref = {
	// summary:
	// 		Adds advanced JSON {de}serialization capabilities to the base json library.
	// 		This enhances the capabilities of dojo.toJson and dojo.fromJson,
	// 		adding referencing support, date handling, and other extra format handling.
	// 		On parsing, references are resolved. When references are made to
	// 		ids/objects that have been loaded yet, the loader function will be set to
	// 		_loadObject to denote a lazy loading (not loaded yet) object. 


	resolveJson: function(/*Object*/ root,/*Object?*/ args){
		// summary:
		// 		Indexes and resolves references in the JSON object.
		// description:
		// 		A JSON Schema object that can be used to advise the handling of the JSON (defining ids, date properties, urls, etc)
		//
		// root:
		//		The root object of the object graph to be processed
		// args:
		//		Object with additional arguments:
		//
		// The *index* parameter.
		//		This is the index object (map) to use to store an index of all the objects. 
		// 		If you are using inter-message referencing, you must provide the same object for each call.
		// The *defaultId* parameter.
		//		This is the default id to use for the root object (if it doesn't define it's own id)
		//	The *idPrefix* parameter.
		//		This the prefix to use for the ids as they enter the index. This allows multiple tables 
		// 		to use ids (that might otherwise collide) that enter the same global index. 
		// 		idPrefix should be in the form "/Service/".  For example,
		//		if the idPrefix is "/Table/", and object is encountered {id:"4",...}, this would go in the
		//		index as "/Table/4".
		//	The *idAttribute* parameter.
		//		This indicates what property is the identity property. This defaults to "id"
		//	The *assignAbsoluteIds* parameter.
		//		This indicates that the resolveJson should assign absolute ids (__id) as the objects are being parsed.
		//  
		// The *schemas* parameter
		//		This provides a map of schemas, from which prototypes can be retrieved
		// The *loader* parameter
		//		This is a function that is called added to the reference objects that can't be resolved (lazy objects)
		// return:
		//		An object, the result of the processing
		args = args || {};
		var idAttribute = args.idAttribute || 'id';
		var refAttribute = this.refAttribute;
		var idAsRef = args.idAsRef;
		var prefix = args.idPrefix || ''; 
		var assignAbsoluteIds = args.assignAbsoluteIds;
		var index = args.index || {}; // create an index if one doesn't exist
		var timeStamps = args.timeStamps;
		var ref,reWalk=[];
		var pathResolveRegex = /^(.*\/)?(\w+:\/\/)|[^\/\.]+\/\.\.\/|^.*\/(\/)/;
		var addProp = this._addProp;
		var F = function(){};
		function walk(it, stop, defaultId, needsPrefix, schema, defaultObject){
			// this walks the new graph, resolving references and making other changes
		 	var i, update, val, id = idAttribute in it ? it[idAttribute] : defaultId;
		 	if(idAttribute in it || ((id !== undefined) && needsPrefix)){
		 		id = (prefix + id).replace(pathResolveRegex,'$2$3');
		 	}
		 	var target = defaultObject || it;
			if(id !== undefined){ // if there is an id available...
				if(assignAbsoluteIds){
					it.__id = id;
				}
				if(args.schemas && (!(it instanceof Array)) && // won't try on arrays to do prototypes, plus it messes with queries 
		 					(val = id.match(/^(.+\/)[^\.\[]*$/))){ // if it has a direct table id (no paths)
		 			schema = args.schemas[val[1]];
				} 
				// if the id already exists in the system, we should use the existing object, and just 
				// update it... as long as the object is compatible
				if(index[id] && ((it instanceof Array) == (index[id] instanceof Array))){ 
					target = index[id];
					delete target.$ref; // remove this artifact
					delete target._loadObject;
					update = true;
				}else{
				 	var proto = schema && schema.prototype; // and if has a prototype
					if(proto){
						// if the schema defines a prototype, that needs to be the prototype of the object
						F.prototype = proto;
						target = new F();
					}
				}
				index[id] = target; // add the prefix, set _id, and index it
				if(timeStamps){
					timeStamps[id] = args.time;
				}
			}
			while(schema){
				var properties = schema.properties;
				if(properties){
					for(i in it){
						var propertyDefinition = properties[i];
						if(propertyDefinition && propertyDefinition.format == 'date-time' && typeof it[i] == 'string'){
							it[i] = dojo.date.stamp.fromISOString(it[i]);
						}
					}
				}
				schema = schema["extends"];
			}
			var length = it.length;
			for(i in it){
				if(i==length){
					break;		
				}
				if(it.hasOwnProperty(i)){
					val=it[i];
					if((typeof val =='object') && val && !(val instanceof Date) && i != '__parent'){
						ref=val[refAttribute] || (idAsRef && val[idAttribute]);
						if(!ref || !val.__parent){
							val.__parent = it;
						}
						if(ref){ // a reference was found
							// make sure it is a safe reference
							delete it[i];// remove the property so it doesn't resolve to itself in the case of id.propertyName lazy values
							var path = ref.toString().replace(/(#)([^\.\[])/,'$1.$2').match(/(^([^\[]*\/)?[^#\.\[]*)#?([\.\[].*)?/); // divide along the path
							if((ref = (path[1]=='$' || path[1]=='this' || path[1]=='') ? root : index[(prefix + path[1]).replace(pathResolveRegex,'$2$3')])){  // a $ indicates to start with the root, otherwise start with an id
								// if there is a path, we will iterate through the path references
								if(path[3]){
									path[3].replace(/(\[([^\]]+)\])|(\.?([^\.\[]+))/g,function(t,a,b,c,d){
										ref = ref && ref[b ? b.replace(/[\"\'\\]/,'') : d];
									});
								}
							}
							if(ref){
								val = ref;
							}else{
								// otherwise, no starting point was found (id not found), if stop is set, it does not exist, we have
								// unloaded reference, if stop is not set, it may be in a part of the graph not walked yet,
								// we will wait for the second loop
								if(!stop){
									var rewalking;
									if(!rewalking){
										reWalk.push(target); // we need to rewalk it to resolve references
									}
									rewalking = true; // we only want to add it once
									val = walk(val, false, val[refAttribute], true, propertyDefinition);
									// create a lazy loaded object
									val._loadObject = args.loader;
								}
							}
						}else{
							if(!stop){ // if we are in stop, that means we are in the second loop, and we only need to check this current one,
								// further walking may lead down circular loops
								val = walk(
									val,
									reWalk==it,
									id === undefined ? undefined : addProp(id, i), // the default id to use
									false,
									propertyDefinition, 
									// if we have an existing object child, we want to 
									// maintain it's identity, so we pass it as the default object
									target != it && typeof target[i] == 'object' && target[i] 
								);
							}
						}
					}
					it[i] = val;
					if(target!=it && !target.__isDirty){// do updates if we are updating an existing object and it's not dirty				
						var old = target[i];
						target[i] = val; // only update if it changed
						if(update && val !== old && // see if it is different 
								!target._loadObject && // no updates if we are just lazy loading
								!(i.charAt(0) == '_' && i.charAt(1) == '_') && i != "$ref" &&  
								!(val instanceof Date && old instanceof Date && val.getTime() == old.getTime()) && // make sure it isn't an identical date
								!(typeof val == 'function' && typeof old == 'function' && val.toString() == old.toString()) && // make sure it isn't an indentical function
								index.onUpdate){
							index.onUpdate(target,i,old,val); // call the listener for each update
						}
					}
				}
			}
	
			if(update && (idAttribute in it)){
				// this means we are updating with a full representation of the object, we need to remove deleted
				for(i in target){
					if(!target.__isDirty && target.hasOwnProperty(i) && !it.hasOwnProperty(i) && !(i.charAt(0) == '_' && i.charAt(1) == '_') && !(target instanceof Array && isNaN(i))){
						if(index.onUpdate && i != "_loadObject" && i != "_idAttr"){
							index.onUpdate(target,i,target[i],undefined); // call the listener for each update
						}
						delete target[i];
						while(target instanceof Array && target.length && target[target.length-1] === undefined){
							// shorten the target if necessary
							target.length--;
						}
					}
				}
			}else{
				if(index.onLoad){
					index.onLoad(target);
				}
			}
			return target;
		}
		if(root && typeof root == 'object'){
			root = walk(root,false,args.defaultId, true); // do the main walk through
			walk(reWalk,false); // re walk any parts that were not able to resolve references on the first round
		}
		return root;
	},


	fromJson: function(/*String*/ str,/*Object?*/ args){
	// summary:
	// 		evaluates the passed string-form of a JSON object.
	//
	// str:
	//		a string literal of a JSON item, for instance:
	//			'{ "foo": [ "bar", 1, { "baz": "thud" } ] }'
	// args: See resolveJson
	//
	// return:
	//		An object, the result of the evaluation
		function ref(target){ // support call styles references as well
			var refObject = {};
			refObject[this.refAttribute] = target;
			return refObject;
		}
		try{
			var root = eval('(' + str + ')'); // do the eval
		}catch(e){
			throw new SyntaxError("Invalid JSON string: " + e.message + " parsing: "+ str);
		}		
		if(root){
			return this.resolveJson(root, args);
		}
		return root;
	},
	
	toJson: function(/*Object*/ it, /*Boolean?*/ prettyPrint, /*Object?*/ idPrefix, /*Object?*/ indexSubObjects){
		// summary:
		//		Create a JSON serialization of an object.
		//		This has support for referencing, including circular references, duplicate references, and out-of-message references
		// 		id and path-based referencing is supported as well and is based on http://www.json.com/2007/10/19/json-referencing-proposal-and-library/.
		//
		// it:
		//		an object to be serialized.
		//
		// prettyPrint:
		//		if true, we indent objects and arrays to make the output prettier.
		//		The variable dojo.toJsonIndentStr is used as the indent string
		//		-- to use something other than the default (tab),
		//		change that variable before calling dojo.toJson().
		//
		// idPrefix: The prefix that has been used for the absolute ids
		//
		// return:
		//		a String representing the serialized version of the passed object.
		var useRefs = this._useRefs;
		var addProp = this._addProp;
		var refAttribute = this.refAttribute;
		idPrefix = idPrefix || ''; // the id prefix for this context
		var paths={};
		var generated = {};
		function serialize(it,path,_indentStr){
			if(typeof it == 'object' && it){
				var value;
				if(it instanceof Date){ // properly serialize dates
					return '"' + dojo.date.stamp.toISOString(it,{zulu:true}) + '"';
				}
				var id = it.__id;
				if(id){ // we found an identifiable object, we will just serialize a reference to it... unless it is the root
					if(path != '#' && ((useRefs && !id.match(/#/)) || paths[id])){
						var ref = id;	
						if(id.charAt(0)!='#'){
							if(it.__clientId == id){
								ref = "cid:" + id;
							}else if(id.substring(0, idPrefix.length) == idPrefix){ // see if the reference is in the current context
								// a reference with a prefix matching the current context, the prefix should be removed
								ref = id.substring(idPrefix.length);
							}else{
								// a reference to a different context, assume relative url based referencing
								ref = id;
							}
						}
						var refObject = {};
						refObject[refAttribute] = ref;
						return serialize(refObject,'#');
					}
					path = id;
				}else{
					it.__id = path; // we will create path ids for other objects in case they are circular
					generated[path] = it;
				}
				paths[path] = it;// save it here so they can be deleted at the end
				_indentStr = _indentStr || "";
				var nextIndent = prettyPrint ? _indentStr + dojo.toJsonIndentStr : "";
				var newLine = prettyPrint ? "\n" : "";
				var sep = prettyPrint ? " " : "";
	
				if(it instanceof Array){
					var res = dojo.map(it, function(obj,i){
						var val = serialize(obj, addProp(path, i), nextIndent);
						if(typeof val != "string"){
							val = "undefined";
						}
						return newLine + nextIndent + val;
					});
					return "[" + res.join("," + sep) + newLine + _indentStr + "]";
				}
	
				var output = [];
				for(var i in it){
					if(it.hasOwnProperty(i)){
						var keyStr;
						if(typeof i == "number"){
							keyStr = '"' + i + '"';
						}else if(typeof i == "string" && (i.charAt(0) != '_' || i.charAt(1) != '_')){
							// we don't serialize our internal properties __id and __clientId
							keyStr = dojo._escapeString(i);
						}else{
							// skip non-string or number keys
							continue;
						}
						var val = serialize(it[i],addProp(path, i),nextIndent);
						if(typeof val != "string"){
							// skip non-serializable values
							continue;
						}
						output.push(newLine + nextIndent + keyStr + ":" + sep + val);
					}
				}
				return "{" + output.join("," + sep) + newLine + _indentStr + "}";
			}else if(typeof it == "function" && dojox.json.ref.serializeFunctions){
				return it.toString();
			}
	
			return dojo.toJson(it); // use the default serializer for primitives
		}
		var json = serialize(it,'#','');
		if(!indexSubObjects){
			for(var i in generated)  {// cleanup the temporary path-generated ids
				delete generated[i].__id;
			}
		}
		return json;
	},
	_addProp: function(id, prop){
		return id + (id.match(/#/) ? id.length == 1 ? '' : '.' : '#') + prop;
	},
	//	refAttribute: String
	//		This indicates what property is the reference property. This acts like the idAttribute
	// 		except that this is used to indicate the current object is a reference or only partially 
	// 		loaded. This defaults to "$ref". 
	refAttribute: "$ref",
	_useRefs: false,
	serializeFunctions: false
}

}

if(!dojo._hasResource["dojox.rpc.Rest"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.rpc.Rest"] = true;
dojo.provide("dojox.rpc.Rest"); 
// Note: This doesn't require dojox.rpc.Service, and if you want it you must require it 
// yourself, and you must load it prior to dojox.rpc.Rest.

// summary:
// 		This provides a HTTP REST service with full range REST verbs include PUT,POST, and DELETE.
// description:
// 		A normal GET query is done by using the service directly:
// 		| var restService = dojox.rpc.Rest("Project");
// 		| restService("4");
//		This will do a GET for the URL "/Project/4".
//		| restService.put("4","new content");
//		This will do a PUT to the URL "/Project/4" with the content of "new content".
//		You can also use the SMD service to generate a REST service:
// 		| var services = dojox.rpc.Service({services: {myRestService: {transport: "REST",...
// 		| services.myRestService("parameters");
//
// 		The modifying methods can be called as sub-methods of the rest service method like:
//  	| services.myRestService.put("parameters","data to put in resource");
//  	| services.myRestService.post("parameters","data to post to the resource");
//  	| services.myRestService['delete']("parameters");
(function(){
	if(dojox.rpc && dojox.rpc.transportRegistry){
		// register it as an RPC service if the registry is available
		dojox.rpc.transportRegistry.register(
			"REST",
			function(str){return str == "REST";},
			{
				getExecutor : function(func,method,svc){
					return new dojox.rpc.Rest(
						method.name,
						(method.contentType||svc._smd.contentType||"").match(/json|javascript/), // isJson
						null,
						function(id, args){
							var request = svc._getRequest(method,[id]);
							request.url= request.target + (request.data ? '?'+  request.data : '');
							return request;
						}
					);
				}
			}
		);
	}
	var drr;

	function index(deferred, service, range, id){
		deferred.addCallback(function(result){
			if(deferred.ioArgs.xhr && range){
					// try to record the total number of items from the range header
					range = deferred.ioArgs.xhr.getResponseHeader("Content-Range");
					deferred.fullLength = range && (range=range.match(/\/(.*)/)) && parseInt(range[1]);
			}
			return result;
		});
		return deferred;
	}
	drr = dojox.rpc.Rest = function(/*String*/path, /*Boolean?*/isJson, /*Object?*/schema, /*Function?*/getRequest){
		// summary:
		//		Creates a REST service using the provided path.
		var service;
		// it should be in the form /Table/
		service = function(id, args){
			return drr._get(service, id, args);
		};
		service.isJson = isJson;
		service._schema = schema;
		// cache:
		//		This is an object that provides indexing service
		// 		This can be overriden to take advantage of more complex referencing/indexing
		// 		schemes
		service.cache = {
			serialize: isJson ? ((dojox.json && dojox.json.ref) || dojo).toJson : function(result){
				return result;
			}
		};
		// the default XHR args creator:
		service._getRequest = getRequest || function(id, args){
			if(dojo.isObject(id)){
				id = dojo.objectToQuery(id);
				id = id ? "?" + id: "";
			}
			if(args && args.sort && !args.queryStr){
				id += (id ? "&" : "?") + "sort("
				for(var i = 0; i<args.sort.length; i++){
					var sort = args.sort[i];
					id += (i > 0 ? "," : "") + (sort.descending ? '-' : '+') + encodeURIComponent(sort.attribute); 
				}
				id += ")";
			}
			var request = {
				url: path + (id == null ? "" : id),
				handleAs: isJson ? 'json' : 'text', 
				contentType: isJson ? 'application/json' : 'text/plain',
				sync: dojox.rpc._sync,
				headers: {
					Accept: isJson ? 'application/json,application/javascript' : '*/*'
				}
			};
			if(args && (args.start >= 0 || args.count >= 0)){
				request.headers.Range = "items=" + (args.start || '0') + '-' + ((args.count && args.count != Infinity && (args.count + (args.start || 0) - 1)) || '');
			}
			dojox.rpc._sync = false;
			return request;
		};
		// each calls the event handler
		function makeRest(name){
			service[name] = function(id,content){
				return drr._change(name,service,id,content); // the last parameter is to let the OfflineRest know where to store the item
			};
		}
		makeRest('put');
		makeRest('post');
		makeRest('delete');
		// record the REST services for later lookup
		service.servicePath = path;
		return service;
	};

	drr._index={};// the map of all indexed objects that have gone through REST processing
	drr._timeStamps={};
	// these do the actual requests
	drr._change = function(method,service,id,content){
		// this is called to actually do the put, post, and delete
		var request = service._getRequest(id);
		request[method+"Data"] = content;
		return index(dojo.xhr(method.toUpperCase(),request,true),service);
	};

	drr._get= function(service,id, args){
		args = args || {};
		// this is called to actually do the get
		return index(dojo.xhrGet(service._getRequest(id, args)), service, (args.start >= 0 || args.count >= 0), id);
	};
})();

}

if(!dojo._hasResource["dojox.rpc.JsonRest"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.rpc.JsonRest"] = true;
dojo.provide("dojox.rpc.JsonRest");

 // this provides json indexing

// summary:
// 		Provides JSON/REST utility functions
(function(){
	var dirtyObjects = [];
	var Rest = dojox.rpc.Rest;
	var jr;
	function resolveJson(service, deferred, value, defaultId){
		var timeStamp = deferred.ioArgs && deferred.ioArgs.xhr && deferred.ioArgs.xhr.getResponseHeader("Last-Modified");
		if(timeStamp && Rest._timeStamps){
			Rest._timeStamps[defaultId] = timeStamp;
		}
		var hrefProperty = service._schema && service._schema.hrefProperty;
		if(hrefProperty){
			dojox.json.ref.refAttribute = hrefProperty;
		}
		value = value && dojox.json.ref.resolveJson(value, {
			defaultId: defaultId, 
			index: Rest._index,
			timeStamps: timeStamp && Rest._timeStamps,
			time: timeStamp,
			idPrefix: service.servicePath.replace(/[^\/]*$/,''),
			idAttribute: jr.getIdAttribute(service),
			schemas: jr.schemas,
			loader:	jr._loader,
			idAsRef: service.idAsRef, 
			assignAbsoluteIds: true
		});
		dojox.json.ref.refAttribute  = "$ref";
		return value;
	}
	jr = dojox.rpc.JsonRest={
		serviceClass: dojox.rpc.Rest,
		conflictDateHeader: "If-Unmodified-Since",
		commit: function(kwArgs){
			// summary:
			//		Saves the dirty data using REST Ajax methods

			kwArgs = kwArgs || {};
			var actions = [];
			var alreadyRecorded = {};
			var savingObjects = [];
			for(var i = 0; i < dirtyObjects.length; i++){
				var dirty = dirtyObjects[i];
				var object = dirty.object;
				var old = dirty.old;
				var append = false;
				if(!(kwArgs.service && (object || old) && 
						(object || old).__id.indexOf(kwArgs.service.servicePath)) && dirty.save){
					delete object.__isDirty;
					if(object){
						if(old){
							// changed object
							var pathParts;
							if((pathParts = object.__id.match(/(.*)#.*/))){ // it is a path reference
								// this means it is a sub object, we must go to the parent object and save it
								object = Rest._index[pathParts[1]];
							}
							if(!(object.__id in alreadyRecorded)){// if it has already been saved, we don't want to repeat it
								// record that we are saving
								alreadyRecorded[object.__id] = object;
								if(kwArgs.incrementalUpdates 
									&& !pathParts){ // I haven't figured out how we would do incremental updates on sub-objects yet
									// make an incremental update using a POST
									var incremental = (typeof kwArgs.incrementalUpdates == 'function' ?
										kwArgs.incrementalUpdates : function(){
											incremental = {};
											for(var j in object){
												if(object.hasOwnProperty(j)){
													if(object[j] !== old[j]){
														incremental[j] = object[j];
													}
												}else if(old.hasOwnProperty(j)){
													// we can't use incremental updates to remove properties
													return null;
												}
											}
											return incremental;
										})(object, old);
								}
								
								if(incremental){
									actions.push({method:"post",target:object, content: incremental});
								}
								else{
									actions.push({method:"put",target:object,content:object});
								}
							}
						}else{
							// new object
							var service = jr.getServiceAndId(object.__id).service;
							var idAttribute = jr.getIdAttribute(service);
							if((idAttribute in object) && !kwArgs.alwaysPostNewItems){
								// if the id attribute is specified, then we should know the location
								actions.push({method:"put",target:object, content:object});
							}else{
								actions.push({method:"post",target:{__id:service.servicePath},
														content:object});
							}
						}
					}else if(old){
						// deleted object
						actions.push({method:"delete",target:old});
					}//else{ this would happen if an object is created and then deleted, don't do anything
					savingObjects.push(dirty);
					dirtyObjects.splice(i--,1);
				}
			}
			dojo.connect(kwArgs,"onError",function(){
				if(kwArgs.revertOnError !== false){
					var postCommitDirtyObjects = dirtyObjects;
					dirtyObjects = savingObjects;
					var numDirty = 0; // make sure this does't do anything if it is called again
					jr.revert(); // revert if there was an error
					dirtyObjects = postCommitDirtyObjects;
				}
				else{
					dirtyObjects = dirtyObject.concat(savingObjects); 
				}
			});
			jr.sendToServer(actions, kwArgs);
			return actions;
		},
		sendToServer: function(actions, kwArgs){
			var xhrSendId;
			var plainXhr = dojo.xhr;
			var left = actions.length;// this is how many changes are remaining to be received from the server
			var i, contentLocation;
			var timeStamp;
			var conflictDateHeader = this.conflictDateHeader;
			// add headers for extra information
			dojo.xhr = function(method,args){
				// keep the transaction open as we send requests
				args.headers = args.headers || {};
				// the last one should commit the transaction
				args.headers['Transaction'] = actions.length - 1 == i ? "commit" : "open";
				if(conflictDateHeader && timeStamp){
					args.headers[conflictDateHeader] = timeStamp; 
				}
				if(contentLocation){
					args.headers['Content-ID'] = '<' + contentLocation + '>';
				}
				return plainXhr.apply(dojo,arguments);
			};			
			for(i =0; i < actions.length;i++){ // iterate through the actions to execute
				var action = actions[i];
				dojox.rpc.JsonRest._contentId = action.content && action.content.__id; // this is used by OfflineRest
				var isPost = action.method == 'post';
				timeStamp = action.method == 'put' && Rest._timeStamps[action.content.__id];
				if(timeStamp){
					// update it now
					Rest._timeStamps[action.content.__id] = (new Date()) + '';
				}
				// send the content location to the server
				contentLocation = isPost && dojox.rpc.JsonRest._contentId;
				var serviceAndId = jr.getServiceAndId(action.target.__id);
				var service = serviceAndId.service; 
				var dfd = action.deferred = service[action.method](
									serviceAndId.id.replace(/#/,''), // if we are using references, we need eliminate #
									dojox.json.ref.toJson(action.content, false, service.servicePath, true)
								);
				(function(object, dfd, service){
					dfd.addCallback(function(value){
						try{
							// Implements id assignment per the HTTP specification
							var newId = dfd.ioArgs.xhr && dfd.ioArgs.xhr.getResponseHeader("Location");
							//TODO: match URLs if the servicePath is relative...
							if(newId){
								// if the path starts in the middle of an absolute URL for Location, we will use the just the path part 
								var startIndex = newId.match(/(^\w+:\/\/)/) && newId.indexOf(service.servicePath);
								newId = startIndex > 0 ? newId.substring(startIndex) : (service.servicePath + newId).
										// now do simple relative URL resolution in case of a relative URL. 
										replace(/^(.*\/)?(\w+:\/\/)|[^\/\.]+\/\.\.\/|^.*\/(\/)/,'$2$3');
								object.__id = newId;
								Rest._index[newId] = object;
							}
							value = resolveJson(service, dfd, value, object && object.__id);
						}catch(e){}
						if(!(--left)){
							if(kwArgs.onComplete){
								kwArgs.onComplete.call(kwArgs.scope, actions);
							}
						}
						return value;
					});
				})(action.content, dfd, service);
								
				dfd.addErrback(function(value){
					
					// on an error we want to revert, first we want to separate any changes that were made since the commit
					left = -1; // first make sure that success isn't called
					kwArgs.onError.call(kwArgs.scope, value);
				});
			}
			// revert back to the normal XHR handler
			dojo.xhr = plainXhr;
			
		},
		getDirtyObjects: function(){
			return dirtyObjects;
		},
		revert: function(service){
			// summary:
			//		Reverts all the changes made to JSON/REST data
			for(var i = dirtyObjects.length; i > 0;){
				i--;
				var dirty = dirtyObjects[i];
				var object = dirty.object;
				var old = dirty.old;
				var store = dojox.data._getStoreForItem(object || old);
				
				if(!(service && (object || old) && 
					(object || old).__id.indexOf(service.servicePath))){
					// if we are in the specified store or if this is a global revert
					if(object && old){
						// changed
						for(var j in old){
							if(old.hasOwnProperty(j) && object[j] !== old[j]){
								if(store){
									store.onSet(object, j, object[j], old[j]);
								}
								object[j] = old[j];
							}
						}
						for(j in object){
							if(!old.hasOwnProperty(j)){
								if(store){
									store.onSet(object, j, object[j]);
								}
								delete object[j];
							}
						}
					}else if(!old){
						// was an addition, remove it
						if(store){
							store.onDelete(object);
						}
					}else{
						// was a deletion, we will add it back
						if(store){
							store.onNew(old);
						}
					}
					delete (object || old).__isDirty;
					dirtyObjects.splice(i, 1);
				}
			}
		},
		changing: function(object,_deleting){
			// summary:
			//		adds an object to the list of dirty objects.  This object
			//		contains a reference to the object itself as well as a
			//		cloned and trimmed version of old object for use with
			//		revert.
			if(!object.__id){
				return;
			}
			object.__isDirty = true;
			//if an object is already in the list of dirty objects, don't add it again
			//or it will overwrite the premodification data set.
			for(var i=0; i<dirtyObjects.length; i++){
				var dirty = dirtyObjects[i];
				if(object==dirty.object){
					if(_deleting){
						// we are deleting, no object is an indicator of deletiong
						dirty.object = false;
						if(!this._saveNotNeeded){
							dirty.save = true;
						}
					}
					return;
				}
			}
			var old = object instanceof Array ? [] : {};
			for(i in object){
				if(object.hasOwnProperty(i)){
					old[i] = object[i];
				}
			}
			dirtyObjects.push({object: !_deleting && object, old: old, save: !this._saveNotNeeded});
		},
		deleteObject: function(object){
			// summary:
			//		deletes an object 
			//	object:
			//  	object to delete
			this.changing(object,true);
		},
		getConstructor: function(/*Function|String*/service, schema){
			// summary:
			// 		Creates or gets a constructor for objects from this service
			if(typeof service == 'string'){
				var servicePath = service;
				service = new dojox.rpc.Rest(service,true);
				this.registerService(service, servicePath, schema);
			}
			if(service._constructor){
				return service._constructor;
			}
			service._constructor = function(data){
				// summary:
				//		creates a new object for this table
				//
				//	data:
				//		object to mixed in
				var self = this;
				var args = arguments;
				var properties;
				var initializeCalled;
				function addDefaults(schema){
					if(schema){
						addDefaults(schema['extends']);
						properties = schema.properties;
						for(var i in properties){
							var propDef = properties[i]; 
							if(propDef && (typeof propDef == 'object') && ("default" in propDef)){
								self[i] = propDef["default"];
							}
						}
					}
					if(schema && schema.prototype && schema.prototype.initialize){
						initializeCalled = true;
						schema.prototype.initialize.apply(self, args);
					}
				}
				addDefaults(service._schema);
				if(!initializeCalled && data && typeof data == 'object'){
					dojo.mixin(self,data);
				}
				var idAttribute = jr.getIdAttribute(service);
				Rest._index[this.__id = this.__clientId = 
						service.servicePath + (this[idAttribute] || 
							Math.random().toString(16).substring(2,14) + '@' + ((dojox.rpc.Client && dojox.rpc.Client.clientId) || "client"))] = this;
				if(dojox.json.schema && properties){
					dojox.json.schema.mustBeValid(dojox.json.schema.validate(this, service._schema));
				} 
				dirtyObjects.push({object:this, save: true});
			};
			return dojo.mixin(service._constructor, service._schema, {load:service});
		},
		fetch: function(absoluteId){
			// summary:
			//		Fetches a resource by an absolute path/id and returns a dojo.Deferred.
			var serviceAndId = jr.getServiceAndId(absoluteId);
			return this.byId(serviceAndId.service,serviceAndId.id);
		},
		getIdAttribute: function(service){
			// summary:
			//		Return the ids attribute used by this service (based on it's schema).
			//		Defaults to "id", if not other id is defined
			var schema = service._schema;
			var idAttr;
			if(schema){
				if(!(idAttr = schema._idAttr)){
					for(var i in schema.properties){
						if(schema.properties[i].identity || (schema.properties[i].link == "self")){
							schema._idAttr = idAttr = i;
						}
					}
				}
			}
			return idAttr || 'id';
		},
		getServiceAndId: function(/*String*/absoluteId){
			// summary:
			//		Returns the REST service and the local id for the given absolute id. The result 
			// 		is returned as an object with a service property and an id property
			//	absoluteId:
			//		This is the absolute id of the object
			var serviceName = '';
			
			for(var service in jr.services){
				if((absoluteId.substring(0, service.length) == service) && (service.length >= serviceName.length)){
					serviceName = service;
				}
			}
			if (serviceName){
				return {service: jr.services[serviceName], id:absoluteId.substring(serviceName.length)};
			}			
			var parts = absoluteId.match(/^(.*\/)([^\/]*)$/);
			return {service: new jr.serviceClass(parts[1], true), id:parts[2]};
		},
		services:{},
		schemas:{},
		registerService: function(/*Function*/ service, /*String*/ servicePath, /*Object?*/ schema){
			//	summary:
			//		Registers a service for as a JsonRest service, mapping it to a path and schema
			//	service:
			//		This is the service to register
			//	servicePath:
			//		This is the path that is used for all the ids for the objects returned by service
			//	schema:
			//		This is a JSON Schema object to associate with objects returned by this service
			servicePath = service.servicePath = servicePath || service.servicePath;
			service._schema = jr.schemas[servicePath] = schema || service._schema || {};
			jr.services[servicePath] = service;
		},
		byId: function(service, id){
			// if caching is allowed, we look in the cache for the result
			var deferred, result = Rest._index[(service.servicePath || '') + id];
			if(result && !result._loadObject){// cache hit
				deferred = new dojo.Deferred();
				deferred.callback(result);
				return deferred;
			}
			return this.query(service, id);
		},
		query: function(service, id, args){
			var deferred = service(id, args);
			
			deferred.addCallback(function(result){
				if(result.nodeType && result.cloneNode){
					// return immediately if it is an XML document
					return result;
				}				
				return resolveJson(service, deferred, result, typeof id != 'string' || (args && (args.start || args.count)) ? undefined: id);
			});
			return deferred;			
		},
		_loader: function(callback){
			// load a lazy object
			var serviceAndId = jr.getServiceAndId(this.__id);
			var self = this;
			jr.query(serviceAndId.service, serviceAndId.id).addBoth(function(result){
				// if they are the same this means an object was loaded, otherwise it 
				// might be a primitive that was loaded or maybe an error
				if(result == self){
					// we can clear the flag, so it is a loaded object
					delete result.$ref;
					delete result._loadObject;
				}else{
					// it is probably a primitive value, we can't change the identity of an object to
					//	the loaded value, so we will keep it lazy, but define the lazy loader to always
					//	return the loaded value
					self._loadObject = function(callback){
						callback(result);
					};
				}
				callback(result);
			});
		},
		isDirty: function(item){
			// summary
			//		returns true if the item is marked as dirty or true if there are any dirty items
			if(!item){
				return !!dirtyObjects.length;
			}
			return item.__isDirty;
		}
		
	};
})();



}

if(!dojo._hasResource["dojox.data.JsonRestStore"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.data.JsonRestStore"] = true;
dojo.provide("dojox.data.JsonRestStore");




dojo.declare("dojox.data.JsonRestStore",
	dojox.data.ServiceStore,
	{
		constructor: function(options){
			//summary:
			//		JsonRestStore is a Dojo Data store interface to JSON HTTP/REST web
			//		storage services that support read and write through GET, PUT, POST, and DELETE.
			// options:
			// 		Keyword arguments
			//
			// The *schema* parameter
			//		This is a schema object for this store. This should be JSON Schema format.
			//
			// The *service* parameter
			// 		This is the service object that is used to retrieve lazy data and save results
			// 		The function should be directly callable with a single parameter of an object id to be loaded
			// 		The function should also have the following methods:
			// 			put(id,value) - puts the value at the given id
			// 			post(id,value) - posts (appends) the value at the given id
			// 			delete(id) - deletes the value corresponding to the given id
			//		Note that it is critical that the service parses responses as JSON.
			//		If you are using dojox.rpc.Service, the easiest way to make sure this
			// 		happens is to make the responses have a content type of
			// 		application/json. If you are creating your own service, make sure you
			//		use handleAs: "json" with your XHR requests.
			//
			// The *target* parameter
			// 		This is the target URL for this Service store. This may be used in place
			// 		of a service parameter to connect directly to RESTful URL without
			// 		using a dojox.rpc.Service object.
			//
			// The *idAttribute* parameter
			//		Defaults to 'id'. The name of the attribute that holds an objects id.
			//		This can be a preexisting id provided by the server.
			//		If an ID isn't already provided when an object
			//		is fetched or added to the store, the autoIdentity system
			//		will generate an id for it and add it to the index.
			//
			// The *syncMode* parameter
			//		Setting this to true will set the store to using synchronous calls by default.
			//		Sync calls return their data immediately from the calling function, so
			//		callbacks are unnecessary
			//
			//	description:
			//		The JsonRestStore will cause all saved modifications to be sent to the server using Rest commands (PUT, POST, or DELETE).
			// 		When using a Rest store on a public network, it is important to implement proper security measures to
			//		control access to resources.
			//		On the server side implementing a REST interface means providing GET, PUT, POST, and DELETE handlers.
			//		GET - Retrieve an object or array/result set, this can be by id (like /table/1) or with a
			// 			query (like /table/?name=foo).
			//		PUT - This should modify a object, the URL will correspond to the id (like /table/1), and the body will
			// 			provide the modified object
			//		POST - This should create a new object. The URL will correspond to the target store (like /table/)
			// 			and the body should be the properties of the new object. The server's response should include a
			// 			Location header that indicates the id of the newly created object. This id will be used for subsequent
			// 			PUT and DELETE requests. JsonRestStore also includes a Content-Location header that indicates
			//			the temporary randomly generated id used by client, and this location is used for subsequent
			// 			PUT/DELETEs if no Location header is provided by the server or if a modification is sent prior
			// 			to receiving a response from the server.
			// 		DELETE - This should delete an object by id.
			// 		These articles include more detailed information on using the JsonRestStore:
			//		http://www.sitepen.com/blog/2008/06/13/restful-json-dojo-data/
			//		http://blog.medryx.org/2008/07/24/jsonreststore-overview/
			//
			//	example:
			// 		A JsonRestStore takes a REST service or a URL and uses it the remote communication for a
			// 		read/write dojo.data implementation. A JsonRestStore can be created with a simple URL like:
			// 	|	new JsonRestStore({target:"/MyData/"});
			//	example:
			// 		To use a JsonRestStore with a service, you should create a
			// 		service with a REST transport. This can be configured with an SMD:
			//	|	{
			//	|		services: {
			//	|			jsonRestStore: {
			//	|				transport: "REST",
			//	|				envelope: "URL",
			//	|				target: "store.php",
			//	|				contentType:"application/json",
			//	|				parameters: [
			//	|					{name: "location", type: "string", optional: true}
			//	|				]
			//	|			}
			//	|		}
			//	|	}
			// 		The SMD can then be used to create service, and the service can be passed to a JsonRestStore. For example:
			//	|	var myServices = new dojox.rpc.Service(dojo.moduleUrl("dojox.rpc.tests.resources", "test.smd"));
			//	|	var jsonStore = new dojox.data.JsonRestStore({service:myServices.jsonRestStore});
			//	example:
			//		The JsonRestStore also supports lazy loading. References can be made to objects that have not been loaded.
			//		For example if a service returned:
			//	|	{"name":"Example","lazyLoadedObject":{"$ref":"obj2"}}
			// 		And this object has accessed using the dojo.data API:
			//	|	var obj = jsonStore.getValue(myObject,"lazyLoadedObject");
			//		The object would automatically be requested from the server (with an object id of "obj2").
			//

			dojo.connect(dojox.rpc.Rest._index,"onUpdate",this,function(obj,attrName,oldValue,newValue){
				var prefix = this.service.servicePath;
				if(!obj.__id){
					console.log("no id on updated object ", obj);
				}else if(obj.__id.substring(0,prefix.length) == prefix){
					this.onSet(obj,attrName,oldValue,newValue);
				}
			});
			this.idAttribute = this.idAttribute || 'id';// no options about it, we have to have identity

			if(typeof options.target == 'string'){
				options.target = options.target.match(/\/$/) || this.allowNoTrailingSlash ? options.target : (options.target + '/');
				if(!this.service){
					this.service = dojox.rpc.JsonRest.services[options.target] ||
							dojox.rpc.Rest(options.target, true);
					// create a default Rest service
				}
			}

			dojox.rpc.JsonRest.registerService(this.service, options.target, this.schema);
			this.schema = this.service._schema = this.schema || this.service._schema || {};
			// wrap the service with so it goes through JsonRest manager
			this.service._store = this;
			this.service.idAsRef = this.idAsRef;
			this.schema._idAttr = this.idAttribute;
			var constructor = dojox.rpc.JsonRest.getConstructor(this.service);
			var self = this;
			this._constructor = function(data){
				constructor.call(this, data);
				self.onNew(this);
			}
			this._constructor.prototype = constructor.prototype;
			this._index = dojox.rpc.Rest._index;
		},
		
		// summary:
		//		Will load any schemas referenced content-type header or in Link headers
		loadReferencedSchema: true,
		// summary:
		//		Treat objects in queries as partially loaded objects
		idAsRef: false,
		referenceIntegrity: true,
		target:"",
		// summary:
		// 		Allow no trailing slash on target paths. This is generally discouraged since
		// 		it creates prevents simple scalar values from being used a relative URLs.
		// 		Disabled by default.
		allowNoTrailingSlash: false,
		//Write API Support
		newItem: function(data, parentInfo){
			// summary:
			//		adds a new item to the store at the specified point.
			//		Takes two parameters, data, and options.
			//
			//	data: /* object */
			//		The data to be added in as an item.
			data = new this._constructor(data);
			if(parentInfo){
				// get the previous value or any empty array
				var values = this.getValue(parentInfo.parent,parentInfo.attribute,[]);
				// set the new value
				values = values.concat([data]);
				data.__parent = values;
				this.setValue(parentInfo.parent, parentInfo.attribute, values);
			}
			return data;
		},
		deleteItem: function(item){
			// summary:
			//		deletes item and any references to that item from the store.
			//
			//	item:
			//		item to delete
			//

			//	If the desire is to delete only one reference, unsetAttribute or
			//	setValue is the way to go.
			var checked = [];
			var store = dojox.data._getStoreForItem(item) || this;
			if(this.referenceIntegrity){
				// cleanup all references
				dojox.rpc.JsonRest._saveNotNeeded = true;
				var index = dojox.rpc.Rest._index;
				var fixReferences = function(parent){
					var toSplice;
					// keep track of the checked ones
					checked.push(parent);
					// mark it checked so we don't run into circular loops when encountering cycles
					parent.__checked = 1;
					for(var i in parent){
						if(i.substring(0,2) != "__"){
							var value = parent[i];
							if(value == item){
								if(parent != index){ // make sure we are just operating on real objects
									if(parent instanceof Array){
										// mark it as needing to be spliced, don't do it now or it will mess up the index into the array
										(toSplice = toSplice || []).push(i);
									}else{
										// property, just delete it.
										(dojox.data._getStoreForItem(parent) || store).unsetAttribute(parent, i);
									}
								}
							}else{
								if((typeof value == 'object') && value){
									if(!value.__checked){
										// recursively search
										fixReferences(value);
									}
									if(typeof value.__checked == 'object' && parent != index){
										// if it is a modified array, we will replace it
										(dojox.data._getStoreForItem(parent) || store).setValue(parent, i, value.__checked);
									}
								}
							}
						}
					}
					if(toSplice){
						// we need to splice the deleted item out of these arrays
						i = toSplice.length;
						parent = parent.__checked = parent.concat(); // indicates that the array is modified
						while(i--){
							parent.splice(toSplice[i], 1);
						}
						return parent;
					}
					return null;
				};
				// start with the index
				fixReferences(index);
				dojox.rpc.JsonRest._saveNotNeeded = false;
				var i = 0;
				while(checked[i]){
					// remove the checked marker
					delete checked[i++].__checked;
				}
			}
			dojox.rpc.JsonRest.deleteObject(item);

			store.onDelete(item);
		},
		changing: function(item,_deleting){
			// summary:
			//		adds an item to the list of dirty items.	This item
			//		contains a reference to the item itself as well as a
			//		cloned and trimmed version of old item for use with
			//		revert.
			dojox.rpc.JsonRest.changing(item,_deleting);
		},

		setValue: function(item, attribute, value){
			// summary:
			//		sets 'attribute' on 'item' to 'value'

			var old = item[attribute];
			var store = item.__id ? dojox.data._getStoreForItem(item) : this;
			if(dojox.json.schema && store.schema && store.schema.properties){
				// if we have a schema and schema validator available we will validate the property change
				dojox.json.schema.mustBeValid(dojox.json.schema.checkPropertyChange(value,store.schema.properties[attribute]));
			}
			if(attribute == store.idAttribute){
				throw new Error("Can not change the identity attribute for an item");
			}
			store.changing(item);
			item[attribute]=value;
			if(value && !value.__parent){
				value.__parent = item;
			}
			store.onSet(item,attribute,old,value);
		},
		setValues: function(item, attribute, values){
			// summary:
			//	sets 'attribute' on 'item' to 'value' value
			//	must be an array.


			if(!dojo.isArray(values)){
				throw new Error("setValues expects to be passed an Array object as its value");
			}
			this.setValue(item,attribute,values);
		},

		unsetAttribute: function(item, attribute){
			// summary:
			//		unsets 'attribute' on 'item'

			this.changing(item);
			var old = item[attribute];
			delete item[attribute];
			this.onSet(item,attribute,old,undefined);
		},
		save: function(kwArgs){
			// summary:
			//		Saves the dirty data using REST Ajax methods. See dojo.data.api.Write for API.
			//
			//	kwArgs.global:
			//		This will cause the save to commit the dirty data for all
			// 		JsonRestStores as a single transaction.
			//
			//	kwArgs.revertOnError
			//		This will cause the changes to be reverted if there is an
			//		error on the save. By default a revert is executed unless
			//		a value of false is provide for this parameter.
			//
			//	kwArgs.incrementalUpdates
			//		For items that have been updated, if this is enabled, the server will be sent a POST request
			// 		with a JSON object containing the changed properties. By default this is
			// 		not enabled, and a PUT is used to deliver an update, and will include a full
			// 		serialization of all the properties of the item/object.
			//		If this is true, the POST request body will consist of a JSON object with
			// 		only the changed properties. The incrementalUpdates parameter may also
			//		be a function, in which case it will be called with the updated and previous objects
			//		and an object update representation can be returned.
			//
			//	kwArgs.alwaysPostNewItems
			//		If this is true, new items will always be sent with a POST request. By default
			//		this is not enabled, and the JsonRestStore will send a POST request if
			//		the item does not include its identifier (expecting server assigned location/
			//		identifier), and will send a PUT request if the item does include its identifier
			//		(the PUT will be sent to the URI corresponding to the provided identifier).

			if(!(kwArgs && kwArgs.global)){
				(kwArgs = kwArgs || {}).service = this.service;
			}
			if("syncMode" in kwArgs ? kwArgs.syncMode : this.syncMode){
				dojox.rpc._sync = true;
			}

			var actions = dojox.rpc.JsonRest.commit(kwArgs);
			this.serverVersion = this._updates && this._updates.length;
			return actions;
		},

		revert: function(kwArgs){
			// summary
			//		returns any modified data to its original state prior to a save();
			//
			//	kwArgs.global:
			//		This will cause the revert to undo all the changes for all
			// 		JsonRestStores in a single operation.
			dojox.rpc.JsonRest.revert(kwArgs && kwArgs.global && this.service);
		},

		isDirty: function(item){
			// summary
			//		returns true if the item is marked as dirty.
			return dojox.rpc.JsonRest.isDirty(item);
		},
		isItem: function(item, anyStore){
			//	summary:
			//		Checks to see if a passed 'item'
			//		really belongs to this JsonRestStore.
			//
			//	item: /* object */
			//		The value to test for being an item
			//	anyStore: /* boolean*/
			//		If true, this will return true if the value is an item for any JsonRestStore,
			//		not just this instance
			return item && item.__id && (anyStore || this.service == dojox.rpc.JsonRest.getServiceAndId(item.__id).service);
		},
		_doQuery: function(args){
			var query= typeof args.queryStr == 'string' ? args.queryStr : args.query;
			var deferred = dojox.rpc.JsonRest.query(this.service,query, args);
			var self = this;
			if(this.loadReferencedSchema){
				deferred.addCallback(function(result){
					var contentType = deferred.ioArgs && deferred.ioArgs.xhr && deferred.ioArgs.xhr.getResponseHeader("Content-Type");
					var schemaRef = contentType && contentType.match(/definedby\s*=\s*([^;]*)/);
					if(contentType && !schemaRef){
						schemaRef = deferred.ioArgs.xhr.getResponseHeader("Link");
						schemaRef = schemaRef && schemaRef.match(/<([^>]*)>;\s*rel="?definedby"?/);
					}
					schemaRef = schemaRef && schemaRef[1];
					if(schemaRef){
						var serviceAndId = dojox.rpc.JsonRest.getServiceAndId((self.target + schemaRef).replace(/^(.*\/)?(\w+:\/\/)|[^\/\.]+\/\.\.\/|^.*\/(\/)/,"$2$3"));
						var schemaDeferred = dojox.rpc.JsonRest.byId(serviceAndId.service, serviceAndId.id);
						schemaDeferred.addCallbacks(function(newSchema){
							dojo.mixin(self.schema, newSchema);
							return result;
						}, function(error){
							console.error(error); // log it, but don't let it cause the main request to fail
							return result;
						});
						return schemaDeferred;
					}
					return undefined;//don't change anything, and deal with the stupid post-commit lint complaints
				});
			}
			return deferred;
		},
		_processResults: function(results, deferred){
			// index the results
			var count = results.length;
			// if we don't know the length, and it is partial result, we will guess that it is twice as big, that will work for most widgets
			return {totalCount:deferred.fullLength || (deferred.request.count == count ? (deferred.request.start || 0) + count * 2 : count), items: results};
		},

		getConstructor: function(){
			// summary:
			// 		Gets the constructor for objects from this store
			return this._constructor;
		},
		getIdentity: function(item){
			var id = item.__clientId || item.__id;
			if(!id){
				return id;
			}
			var prefix = this.service.servicePath.replace(/[^\/]*$/,'');
			// support for relative or absolute referencing with ids
			return id.substring(0,prefix.length) != prefix ?	id : id.substring(prefix.length); // String
		},
		fetchItemByIdentity: function(args){
			var id = args.identity;
			var store = this;
			// if it is an absolute id, we want to find the right store to query
			if(id.toString().match(/^(\w*:)?\//)){
				var serviceAndId = dojox.rpc.JsonRest.getServiceAndId(id);
				store = serviceAndId.service._store;
				args.identity = serviceAndId.id;
			}
			args._prefix = store.service.servicePath.replace(/[^\/]*$/,'');
			return store.inherited(arguments);
		},
		//Notifcation Support

		onSet: function(){},
		onNew: function(){},
		onDelete: 	function(){},

		getFeatures: function(){
			// summary:
			// 		return the store feature set
			var features = this.inherited(arguments);
			features["dojo.data.api.Write"] = true;
			features["dojo.data.api.Notification"] = true;
			return features;
		},

		getParent: function(item){
			//	summary:
			//		Returns the parent item (or query) for the given item
			//	item:
			//		The item to find the parent of

			return item && item.__parent;
		}


	}
);
dojox.data.JsonRestStore.getStore = function(options, Class){
	//	summary:
	//		Will retrieve or create a store using the given options (the same options
	//		that are passed to JsonRestStore constructor. Returns a JsonRestStore instance
	//	options:
	//		See the JsonRestStore constructor
	//	Class:
	//		Constructor to use (for creating stores from JsonRestStore subclasses).
	// 		This is optional and defaults to JsonRestStore.
	if(typeof options.target == 'string'){
		options.target = options.target.match(/\/$/) || options.allowNoTrailingSlash ?
				options.target : (options.target + '/');
		var store = (dojox.rpc.JsonRest.services[options.target] || {})._store;
		if(store){
			return store;
		}
	}
	return new (Class || dojox.data.JsonRestStore)(options);
};
dojox.data._getStoreForItem = function(item){
	if(item.__id){
		var serviceAndId = dojox.rpc.JsonRest.getServiceAndId(item.__id);
		if(serviceAndId && serviceAndId.service._store){
			return serviceAndId.service._store;
		}else{
			var servicePath = item.__id.toString().match(/.*\//)[0];
			return new dojox.data.JsonRestStore({target:servicePath});
		}
	}
	return null;
};
dojox.json.ref._useRefs = true; // Use referencing when identifiable objects are referenced

}

if(!dojo._hasResource["dojox.data.util.JsonQuery"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.data.util.JsonQuery"] = true;
dojo.provide("dojox.data.util.JsonQuery");
// this is a mixin to convert object attribute queries to 
// JSONQuery/JSONPath syntax to be sent to the server.
dojo.declare("dojox.data.util.JsonQuery", null, {
	useFullIdInQueries: false,
	_toJsonQuery: function(args, jsonQueryPagination){
		var first = true;
		var self = this;
		function buildQuery(path, query){
			var isDataItem = query.__id; 
			if(isDataItem){
				// it is a reference to a persisted object, need to make it a query by id
				var newQuery = {};
				newQuery[self.idAttribute] = self.useFullIdInQueries ? query.__id : query[self.idAttribute];
				query = newQuery;
			}
			for(var i in query){
				// iterate through each property, adding them to the overall query
				var value = query[i];
				var newPath = path + (/^[a-zA-Z_][\w_]*$/.test(i) ? '.' + i : '[' + dojo._escapeString(i) + ']');
				if(value && typeof value == "object"){
					buildQuery(newPath, value);
				}else if(value!="*"){ // full wildcards can be ommitted
					jsonQuery += (first ? "" : "&") + newPath +
						((!isDataItem && typeof value == "string" && args.queryOptions && args.queryOptions.ignoreCase) ? "~" : "=") +
						 (self.simplifiedQuery ? encodeURIComponent(value) : dojo.toJson(value));
					first = false;
				}
			}			
		}
		// performs conversion of Dojo Data query objects and sort arrays to JSONQuery strings
		if(args.query && typeof args.query == "object"){
			// convert Dojo Data query objects to JSONQuery
			var jsonQuery = "[?(";
			buildQuery("@", args.query);
			if(!first){
				// use ' instead of " for quoting in JSONQuery, and end with ]
				jsonQuery += ")]"; 
			}else{
				jsonQuery = "";
			}
			args.queryStr = jsonQuery.replace(/\\"|"/g,function(t){return t == '"' ? "'" : t;});
		}else if(!args.query || args.query == '*'){
			args.query = "";
		}
		
		var sort = args.sort;
		if(sort){
			// if we have a sort order, add that to the JSONQuery expression
			args.queryStr = args.queryStr || (typeof args.query == 'string' ? args.query : ""); 
			first = true;
			for(i = 0; i < sort.length; i++){
				args.queryStr += (first ? '[' : ',') + (sort[i].descending ? '\\' : '/') + "@[" + dojo._escapeString(sort[i].attribute) + "]";
				first = false; 
			}
			if(!first){
				args.queryStr += ']';
			}
		}
		// this is optional because with client side paging JSONQuery doesn't yield the total count
		if(jsonQueryPagination && (args.start || args.count)){
			// pagination
			args.queryStr = (args.queryStr || (typeof args.query == 'string' ? args.query : "")) +
				'[' + (args.start || '') + ':' + (args.count ? (args.start || 0) + args.count : '') + ']'; 
		}
		if(typeof args.queryStr == 'string'){
			args.queryStr = args.queryStr.replace(/\\"|"/g,function(t){return t == '"' ? "'" : t;});
			return args.queryStr;
		}
		return args.query;
	},
	jsonQueryPagination: true,
	fetch: function(args){
		this._toJsonQuery(args, this.jsonQueryPagination);
		return this.inherited(arguments);
	},
	isUpdateable: function(){
		return true;
	},
	matchesQuery: function(item,request){
		request._jsonQuery = request._jsonQuery || dojox.json.query(this._toJsonQuery(request)); 
		return request._jsonQuery([item]).length;
	},
	clientSideFetch: function(/*Object*/ request,/*Array*/ baseResults){
		request._jsonQuery = request._jsonQuery || dojox.json.query(this._toJsonQuery(request));
		// we use client side paging function here instead of JSON Query because we must also determine the total count
		return this.clientSidePaging(request, request._jsonQuery(baseResults));
	},
	querySuperSet: function(argsSuper,argsSub){
		if(!argsSuper.query){
			return argsSub.query;
		}
		return this.inherited(arguments);
	}
	
});

}

if(!dojo._hasResource["dojox.data.JsonQueryRestStore"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.data.JsonQueryRestStore"] = true;
dojo.provide("dojox.data.JsonQueryRestStore");



dojo.requireIf(!!dojox.data.ClientFilter,"dojox.json.query"); // this is so we can perform queries locally 

// this is an extension of JsonRestStore to convert object attribute queries to 
// JSONQuery/JSONPath syntax to be sent to the server. This also enables
//	JSONQuery/JSONPath queries to be performed locally if dojox.data.ClientFilter
//	has been loaded
dojo.declare("dojox.data.JsonQueryRestStore",[dojox.data.JsonRestStore,dojox.data.util.JsonQuery],{
	matchesQuery: function(item,request){
		return item.__id && (item.__id.indexOf("#") == -1) && this.inherited(arguments);
	}
});

}

if(!dojo._hasResource["dojox.rpc.Client"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.rpc.Client"] = true;
dojo.provide("dojox.rpc.Client");
// Provide extra headers for robust client and server communication
(function() {
	dojo._defaultXhr = dojo.xhr;
	dojo.xhr = function(method,args){
		var headers = args.headers = args.headers || {};
		// set the client id, this can be used by servers to maintain state information with the
		// a specific client. Many servers rely on sessions for this, but sessions are shared
		// between tabs/windows, so this is not appropriate for application state, it
		// really only useful for storing user authentication
		headers["Client-Id"] = dojox.rpc.Client.clientId;
		// set the sequence id. HTTP is non-deterministic, message can arrive at the server
		// out of order. In complex Ajax applications, it may be more to ensure that messages
		// can be properly sequenced deterministically. This applies a sequency id to each
		// XHR request so that the server can order them.
		headers["Seq-Id"] = dojox._reqSeqId = (dojox._reqSeqId||0)+1;
		return dojo._defaultXhr.apply(dojo,arguments);
	}
})();
// initiate the client id to a good random number
dojox.rpc.Client.clientId = (Math.random() + '').substring(2,14) + (new Date().getTime() + '').substring(8,13);

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

if(!dojo._hasResource["dojox.io.xhrPlugins"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.io.xhrPlugins"] = true;
dojo.provide("dojox.io.xhrPlugins");



(function() {
	var registry;
	var plainXhr;
	function getPlainXhr(){
		return plainXhr = dojox.io.xhrPlugins.plainXhr = plainXhr || dojo._defaultXhr || dojo.xhr;
	}
	dojox.io.xhrPlugins.register = function(){
		//	summary:
		// 		overrides the default xhr handler to implement a registry of
		// 		xhr handlers
		var plainXhr = getPlainXhr();
		if(!registry){
			registry = new dojo.AdapterRegistry();
			// replaces the default xhr() method. Can we just use connect() instead?
			dojo[dojo._defaultXhr ? "_defaultXhr" : "xhr"] = function(/*String*/ method, /*dojo.__XhrArgs*/ args, /*Boolean?*/ hasBody){
				return registry.match.apply(registry,arguments);						
			};
			registry.register(
				"xhr",
				function(method,args){ 
					if(!args.url.match(/^\w*:\/\//)){
						// if it is not an absolute url (or relative to the
						// protocol) we can use this plain XHR
						return true;
					}
					var root = window.location.href.match(/^.*?\/\/.*?\//)[0];
					return args.url.substring(0, root.length) == root; // or check to see if we have the same path
				},
				plainXhr
			);
		}
		return registry.register.apply(registry, arguments);
	};
	dojox.io.xhrPlugins.addProxy = function(proxyUrl){
		//	summary:
		//		adds a server side proxy xhr handler for cross-site URLs
		//	proxyUrl:
		//		This is URL to send the requests to.
		//	example:
		//		Define a proxy:
		//	|	dojox.io.xhrPlugins.addProxy("/proxy?url=");
		// 		And then when you call:
		//	|	dojo.xhr("GET",{url:"http://othersite.com/file"});
		// 		It would result in the request (to your origin server):
		//	|	GET /proxy?url=http%3A%2F%2Fothersite.com%2Ffile HTTP/1.1
		var plainXhr = getPlainXhr();
		dojox.io.xhrPlugins.register(
			"proxy",
			function(method,args){
				// this will match on URL

				// really can be used for anything, but plain XHR will take
				// precedent by order of loading 
				return true; 
			},
			function(method,args,hasBody){
				args.url = proxyUrl + encodeURIComponent(args.url);
				return plainXhr.call(dojo, method, args, hasBody);
			});
	};
	var csXhrSupport;
	dojox.io.xhrPlugins.addCrossSiteXhr = function(url, httpAdapter){
		//	summary:
		// 		Adds W3C Cross site XHR or XDomainRequest handling for the given URL prefix
		//
		// 	url: 
		//		Requests that start with this URL will be considered for using 
		// 		cross-site XHR.
		//
		// 	httpAdapter: This allows for adapting HTTP requests that could not otherwise be 
		// 		sent with XDR, so you can use a convention for headers and PUT/DELETE methods.
		//
		//	description:
		// 		This can be used for servers that support W3C cross-site XHR. In order for 
		// 		a server to allow a client to make cross-site XHR requests, 
		// 		it should respond with the header like:
		//	|	Access-Control: allow <*>
		//		see: http://www.w3.org/TR/access-control/
		var plainXhr = getPlainXhr();
		if(csXhrSupport === undefined && window.XMLHttpRequest){
			// just run this once to see if we have cross-site support
			try{
				var xhr = new XMLHttpRequest();
				xhr.open("GET","http://testing-cross-domain-capability.com",true);
				csXhrSupport = true;
				dojo.config.noRequestedWithHeaders = true;
			}catch(e){
				csXhrSupport = false;
			}
		}
		dojox.io.xhrPlugins.register(
			"cs-xhr",
			function(method,args){ 
				return (csXhrSupport || 
						(window.XDomainRequest && args.sync !== true && 
							(method == "GET" || method == "POST" || httpAdapter))) &&
					(args.url.substring(0,url.length) == url); 
			},
			csXhrSupport ? plainXhr : function(){
				var normalXhrObj = dojo._xhrObj;
				// we will just substitute this in temporarily so we can use XDomainRequest instead of XMLHttpRequest
				dojo._xhrObj = function(){
					
					var xdr = new XDomainRequest();
					xdr.readyState = 1;
					xdr.setRequestHeader = function(){}; // just absorb them, we can't set headers :/
					xdr.getResponseHeader = function(header){ // this is the only header we can access 
						return header == "Content-Type" ? xdr.contentType : null;
					}
					// adapt the xdr handlers to xhr
					function handler(status, readyState){
						return function(){							
							xdr.readyState = readyState;
							xdr.status = status;
						}
					}
					xdr.onload = handler(200, 4);
					xdr.onprogress = handler(200, 3);
					xdr.onerror = handler(404, 4); // an error, who knows what the real status is
					return xdr;
				};
				var dfd = (httpAdapter ? httpAdapter(getPlainXhr()) : getPlainXhr()).apply(dojo,arguments);
				dojo._xhrObj = normalXhrObj;
				return dfd; 
			}
		);
	};
	dojox.io.xhrPlugins.fullHttpAdapter = function(plainXhr,noRawBody){
		// summary:
		// 		Provides a HTTP adaption.
		// description:
		// 		The following convention is used:
		// 		method name -> ?http-method=PUT
		// 		Header -> http-Header-Name=header-value
		//		X-Header -> header_name=header-value
		//	example:
		//		dojox.io.xhrPlugins.addXdr("http://somesite.com", dojox.io.xhrPlugins.fullHttpAdapter);
		return function(method,args,hasBody){
			var content = {};
			var parameters = {};
			if(method != "GET"){
				parameters["http-method"] = method;
				if(args.putData && noRawBody){
					content["http-content"] = args.putData;
					delete args.putData;
					hasBody = false;
				}
				if(args.postData && noRawBody){
					content["http-content"] = args.postData;
					delete args.postData;
					hasBody = false;
				}
				method = "POST";
			
			}
			for(var i in args.headers){
				var parameterName = i.match(/^X-/) ? i.substring(2).replace(/-/g,'_').toLowerCase() : ("http-" + i);
				parameters[parameterName] = args.headers[i];
			}
			args.query = dojo.objectToQuery(parameters);
			dojo._ioAddQueryToUrl(args);
			args.content = dojo.mixin(args.content || {},content);
			return plainXhr.call(dojo,method,args,hasBody);
		};
	};
})();




}

if(!dojo._hasResource["dojo.io.script"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.io.script"] = true;
dojo.provide("dojo.io.script");

/*=====
dojo.declare("dojo.io.script.__ioArgs", dojo.__IoArgs, {
	constructor: function(){
		//	summary:
		//		All the properties described in the dojo.__ioArgs type, apply to this
		//		type as well, EXCEPT "handleAs". It is not applicable to
		//		dojo.io.script.get() calls, since it is implied by the usage of
		//		"jsonp" (response will be a JSONP call returning JSON)
		//		or the response is pure JavaScript defined in
		//		the body of the script that was attached.
		//	callbackParamName: String
		//		Deprecated as of Dojo 1.4 in favor of "jsonp", but still supported for
		// 		legacy code. See notes for jsonp property.
		//	jsonp: String
		//		The URL parameter name that indicates the JSONP callback string.
		//		For instance, when using Yahoo JSONP calls it is normally, 
		//		jsonp: "callback". For AOL JSONP calls it is normally 
		//		jsonp: "c".
		//	checkString: String
		//		A string of JavaScript that when evaluated like so: 
		//		"typeof(" + checkString + ") != 'undefined'"
		//		being true means that the script fetched has been loaded. 
		//		Do not use this if doing a JSONP type of call (use callbackParamName instead).
		//	frameDoc: Document
		//		The Document object for a child iframe. If this is passed in, the script
		//		will be attached to that document. This can be helpful in some comet long-polling
		//		scenarios with Firefox and Opera.
		this.callbackParamName = callbackParamName;
		this.jsonp = jsonp;
		this.checkString = checkString;
		this.frameDoc = frameDoc;
	}
});
=====*/
;(function(){
	var loadEvent = dojo.isIE ? "onreadystatechange" : "load",
		readyRegExp = /complete|loaded/;

	dojo.io.script = {
		get: function(/*dojo.io.script.__ioArgs*/args){
			//	summary:
			//		sends a get request using a dynamically created script tag.
			var dfd = this._makeScriptDeferred(args);
			var ioArgs = dfd.ioArgs;
			dojo._ioAddQueryToUrl(ioArgs);
	
			dojo._ioNotifyStart(dfd);

			if(this._canAttach(ioArgs)){
				var node = this.attach(ioArgs.id, ioArgs.url, args.frameDoc);

				//If not a jsonp callback or a polling checkString case, bind
				//to load event on the script tag.
				if(!ioArgs.jsonp && !ioArgs.args.checkString){
					var handle = dojo.connect(node, loadEvent, function(evt){
						if(evt.type == "load" || readyRegExp.test(node.readyState)){
							dojo.disconnect(handle);
							ioArgs.scriptLoaded = evt;
						}
					});
				}
			}

			dojo._ioWatch(dfd, this._validCheck, this._ioCheck, this._resHandle);
			return dfd;
		},
	
		attach: function(/*String*/id, /*String*/url, /*Document?*/frameDocument){
			//	summary:
			//		creates a new <script> tag pointing to the specified URL and
			//		adds it to the document.
			//	description:
			//		Attaches the script element to the DOM.  Use this method if you
			//		just want to attach a script to the DOM and do not care when or
			//		if it loads.
			var doc = (frameDocument || dojo.doc);
			var element = doc.createElement("script");
			element.type = "text/javascript";
			element.src = url;
			element.id = id;
			element.charset = "utf-8";
			return doc.getElementsByTagName("head")[0].appendChild(element);
		},
	
		remove: function(/*String*/id, /*Document?*/frameDocument){
			//summary: removes the script element with the given id, from the given frameDocument.
			//If no frameDocument is passed, the current document is used.
			dojo.destroy(dojo.byId(id, frameDocument));
			
			//Remove the jsonp callback on dojo.io.script, if it exists.
			if(this["jsonp_" + id]){
				delete this["jsonp_" + id];
			}
		},
	
		_makeScriptDeferred: function(/*Object*/args){
			//summary: 
			//		sets up a Deferred object for an IO request.
			var dfd = dojo._ioSetArgs(args, this._deferredCancel, this._deferredOk, this._deferredError);
	
			var ioArgs = dfd.ioArgs;
			ioArgs.id = dojo._scopeName + "IoScript" + (this._counter++);
			ioArgs.canDelete = false;
	
			//Special setup for jsonp case
			ioArgs.jsonp = args.callbackParamName || args.jsonp;
			if(ioArgs.jsonp){
				//Add the jsonp parameter.
				ioArgs.query = ioArgs.query || "";
				if(ioArgs.query.length > 0){
					ioArgs.query += "&";
				}
				ioArgs.query += ioArgs.jsonp
					+ "="
					+ (args.frameDoc ? "parent." : "")
					+ dojo._scopeName + ".io.script.jsonp_" + ioArgs.id + "._jsonpCallback";
	
				ioArgs.frameDoc = args.frameDoc;
	
				//Setup the Deferred to have the jsonp callback.
				ioArgs.canDelete = true;
				dfd._jsonpCallback = this._jsonpCallback;
				this["jsonp_" + ioArgs.id] = dfd;
			}
			return dfd; // dojo.Deferred
		},
		
		_deferredCancel: function(/*Deferred*/dfd){
			//summary: canceller function for dojo._ioSetArgs call.
	
			//DO NOT use "this" and expect it to be dojo.io.script.
			dfd.canceled = true;
			if(dfd.ioArgs.canDelete){
				dojo.io.script._addDeadScript(dfd.ioArgs);
			}
		},
	
		_deferredOk: function(/*Deferred*/dfd){
			//summary: okHandler function for dojo._ioSetArgs call.
	
			//DO NOT use "this" and expect it to be dojo.io.script.
			var ioArgs = dfd.ioArgs;
	
			//Add script to list of things that can be removed.		
			if(ioArgs.canDelete){
				dojo.io.script._addDeadScript(ioArgs);
			}
	
			//Favor JSONP responses, script load events then lastly ioArgs.
			//The ioArgs are goofy, but cannot return the dfd since that stops
			//the callback chain in Deferred. The return value is not that important
			//in that case, probably a checkString case.
			return ioArgs.json || ioArgs.scriptLoaded || ioArgs;
		},
	
		_deferredError: function(/*Error*/error, /*Deferred*/dfd){
			//summary: errHandler function for dojo._ioSetArgs call.
	
			if(dfd.ioArgs.canDelete){
				//DO NOT use "this" and expect it to be dojo.io.script.
				if(error.dojoType == "timeout"){
					//For timeouts, remove the script element immediately to
					//avoid a response from it coming back later and causing trouble.
					dojo.io.script.remove(dfd.ioArgs.id, dfd.ioArgs.frameDoc);
				}else{
					dojo.io.script._addDeadScript(dfd.ioArgs);
				}
			}
			console.log("dojo.io.script error", error);
			return error;
		},
	
		_deadScripts: [],
		_counter: 1,
	
		_addDeadScript: function(/*Object*/ioArgs){
			//summary: sets up an entry in the deadScripts array.
			dojo.io.script._deadScripts.push({id: ioArgs.id, frameDoc: ioArgs.frameDoc});
			//Being extra paranoid about leaks:
			ioArgs.frameDoc = null;
		},
	
		_validCheck: function(/*Deferred*/dfd){
			//summary: inflight check function to see if dfd is still valid.
	
			//Do script cleanup here. We wait for one inflight pass
			//to make sure we don't get any weird things by trying to remove a script
			//tag that is part of the call chain (IE 6 has been known to
			//crash in that case).
			var _self = dojo.io.script;
			var deadScripts = _self._deadScripts;
			if(deadScripts && deadScripts.length > 0){
				for(var i = 0; i < deadScripts.length; i++){
					//Remove the script tag
					_self.remove(deadScripts[i].id, deadScripts[i].frameDoc);
					deadScripts[i].frameDoc = null;
				}
				dojo.io.script._deadScripts = [];
			}
	
			return true;
		},
	
		_ioCheck: function(/*Deferred*/dfd){
			//summary: inflight check function to see if IO finished.
			var ioArgs = dfd.ioArgs;
			//Check for finished jsonp
			if(ioArgs.json || (ioArgs.scriptLoaded && !ioArgs.args.checkString)){
				return true;
			}
	
			//Check for finished "checkString" case.
			var checkString = ioArgs.args.checkString;
			if(checkString && eval("typeof(" + checkString + ") != 'undefined'")){
				return true;
			}
	
			return false;
		},
	
		_resHandle: function(/*Deferred*/dfd){
			//summary: inflight function to handle a completed response.
			if(dojo.io.script._ioCheck(dfd)){
				dfd.callback(dfd);
			}else{
				//This path should never happen since the only way we can get
				//to _resHandle is if _ioCheck is true.
				dfd.errback(new Error("inconceivable dojo.io.script._resHandle error"));
			}
		},
	
		_canAttach: function(/*Object*/ioArgs){
			//summary: A method that can be overridden by other modules
			//to control when the script attachment occurs.
			return true;
		},
		
		_jsonpCallback: function(/*JSON Object*/json){
			//summary: 
			//		generic handler for jsonp callback. A pointer to this function
			//		is used for all jsonp callbacks.  NOTE: the "this" in this
			//		function will be the Deferred object that represents the script
			//		request.
			this.ioArgs.json = json;
		}
	}
})();

}

if(!dojo._hasResource["dojo.io.iframe"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.io.iframe"] = true;
dojo.provide("dojo.io.iframe");

/*=====
dojo.declare("dojo.io.iframe.__ioArgs", dojo.__IoArgs, {
	constructor: function(){
		//	summary:
		//		All the properties described in the dojo.__ioArgs type, apply
		//		to this type. The following additional properties are allowed
		//		for dojo.io.iframe.send():
		//	method: String?
		//		The HTTP method to use. "GET" or "POST" are the only supported
		//		values.  It will try to read the value from the form node's
		//		method, then try this argument. If neither one exists, then it
		//		defaults to POST.
		//	handleAs: String?
		//		Specifies what format the result data should be given to the
		//		load/handle callback. Valid values are: text, html, xml, json,
		//		javascript. IMPORTANT: For all values EXCEPT html and xml, The
		//		server response should be an HTML file with a textarea element.
		//		The response data should be inside the textarea element. Using an
		//		HTML document the only reliable, cross-browser way this
		//		transport can know when the response has loaded. For the html
		//		handleAs value, just return a normal HTML document.  NOTE: xml
		//		is now supported with this transport (as of 1.1+); a known issue
		//		is if the XML document in question is malformed, Internet Explorer
		//		will throw an uncatchable error.
		//	content: Object?
		//		If "form" is one of the other args properties, then the content
		//		object properties become hidden form form elements. For
		//		instance, a content object of {name1 : "value1"} is converted
		//		to a hidden form element with a name of "name1" and a value of
		//		"value1". If there is not a "form" property, then the content
		//		object is converted into a name=value&name=value string, by
		//		using dojo.objectToQuery().
		this.method = method;
		this.handleAs = handleAs;
		this.content = content;
	}
});
=====*/

dojo.io.iframe = {
	// summary: 
	//		Sends an Ajax I/O call using and Iframe (for instance, to upload files)
	
	create: function(/*String*/fname, /*String*/onloadstr, /*String?*/uri){
		//	summary:
		//		Creates a hidden iframe in the page. Used mostly for IO
		//		transports.  You do not need to call this to start a
		//		dojo.io.iframe request. Just call send().
		//	fname: String
		//		The name of the iframe. Used for the name attribute on the
		//		iframe.
		//	onloadstr: String
		//		A string of JavaScript that will be executed when the content
		//		in the iframe loads.
		//	uri: String
		//		The value of the src attribute on the iframe element. If a
		//		value is not given, then dojo/resources/blank.html will be
		//		used.
		if(window[fname]){ return window[fname]; }
		if(window.frames[fname]){ return window.frames[fname]; }
		var cframe = null;
		var turi = uri;
		if(!turi){
			if(dojo.config["useXDomain"] && !dojo.config["dojoBlankHtmlUrl"]){
				console.warn("dojo.io.iframe.create: When using cross-domain Dojo builds,"
					+ " please save dojo/resources/blank.html to your domain and set djConfig.dojoBlankHtmlUrl"
					+ " to the path on your domain to blank.html");
			}
			turi = (dojo.config["dojoBlankHtmlUrl"]||dojo.moduleUrl("dojo", "resources/blank.html"));
		}
		var ifrstr = dojo.isIE ? '<iframe name="'+fname+'" src="'+turi+'" onload="'+onloadstr+'">' : 'iframe';
		cframe = dojo.doc.createElement(ifrstr);
		with(cframe){
			name = fname;
			setAttribute("name", fname);
			id = fname;
		}
		dojo.body().appendChild(cframe);
		window[fname] = cframe;
	
		with(cframe.style){
			if(!(dojo.isSafari < 3)){
				//We can't change the src in Safari 2.0.3 if absolute position. Bizarro.
				position = "absolute";
			}
			left = top = "1px";
			height = width = "1px";
			visibility = "hidden";
		}

		if(!dojo.isIE){
			this.setSrc(cframe, turi, true);
			cframe.onload = new Function(onloadstr);
		}

		return cframe;
	},

	setSrc: function(/*DOMNode*/iframe, /*String*/src, /*Boolean*/replace){
		//summary:
		//		Sets the URL that is loaded in an IFrame. The replace parameter
		//		indicates whether location.replace() should be used when
		//		changing the location of the iframe.
		try{
			if(!replace){
				if(dojo.isWebKit){
					iframe.location = src;
				}else{
					frames[iframe.name].location = src;
				}
			}else{
				// Fun with DOM 0 incompatibilities!
				var idoc;
				//WebKit > 521 corresponds with Safari 3, which started with 522 WebKit version.
				if(dojo.isIE || dojo.isWebKit > 521){
					idoc = iframe.contentWindow.document;
				}else if(dojo.isSafari){
					idoc = iframe.document;
				}else{ //  if(d.isMozilla){
					idoc = iframe.contentWindow;
				}
	
				//For Safari (at least 2.0.3) and Opera, if the iframe
				//has just been created but it doesn't have content
				//yet, then iframe.document may be null. In that case,
				//use iframe.location and return.
				if(!idoc){
					iframe.location = src;
					return;
				}else{
					idoc.location.replace(src);
				}
			}
		}catch(e){ 
			console.log("dojo.io.iframe.setSrc: ", e); 
		}
	},

	doc: function(/*DOMNode*/iframeNode){
		//summary: Returns the document object associated with the iframe DOM Node argument.
		var doc = iframeNode.contentDocument || // W3
			(
				(
					(iframeNode.name) && (iframeNode.document) && 
					(dojo.doc.getElementsByTagName("iframe")[iframeNode.name].contentWindow) &&
					(dojo.doc.getElementsByTagName("iframe")[iframeNode.name].contentWindow.document)
				)
			) ||  // IE
			(
				(iframeNode.name)&&(dojo.doc.frames[iframeNode.name])&&
				(dojo.doc.frames[iframeNode.name].document)
			) || null;
		return doc;
	},

	send: function(/*dojo.io.iframe.__ioArgs*/args){
		//summary: 
		//		Function that sends the request to the server.
		//		This transport can only process one send() request at a time, so if send() is called
		//multiple times, it will queue up the calls and only process one at a time.
		if(!this["_frame"]){
			this._frame = this.create(this._iframeName, dojo._scopeName + ".io.iframe._iframeOnload();");
		}

		//Set up the deferred.
		var dfd = dojo._ioSetArgs(
			args,
			function(/*Deferred*/dfd){
				//summary: canceller function for dojo._ioSetArgs call.
				dfd.canceled = true;
				dfd.ioArgs._callNext();
			},
			function(/*Deferred*/dfd){
				//summary: okHandler function for dojo._ioSetArgs call.
				var value = null;
				try{
					var ioArgs = dfd.ioArgs;
					var dii = dojo.io.iframe;
					var ifd = dii.doc(dii._frame);
					var handleAs = ioArgs.handleAs;

					//Assign correct value based on handleAs value.
					value = ifd; //html
					if(handleAs != "html"){
						if(handleAs == "xml"){
							//	FF, Saf 3+ and Opera all seem to be fine with ifd being xml.  We have to
							//	do it manually for IE.  Refs #6334.
							if(dojo.isIE){
								dojo.query("a", dii._frame.contentWindow.document.documentElement).orphan();
								var xmlText=(dii._frame.contentWindow.document).documentElement.innerText;
								xmlText=xmlText.replace(/>\s+</g, "><");
								xmlText=dojo.trim(xmlText);
								//Reusing some code in base dojo for handling XML content.  Simpler and keeps
								//Core from duplicating the effort needed to locate the XML Parser on IE.
								var fauxXhr = { responseText: xmlText };
								value = dojo._contentHandlers["xml"](fauxXhr); // DOMDocument
							}
						}else{
							value = ifd.getElementsByTagName("textarea")[0].value; //text
							if(handleAs == "json"){
								value = dojo.fromJson(value); //json
							}else if(handleAs == "javascript"){
								value = dojo.eval(value); //javascript
							}
						}
					}
				}catch(e){
					value = e;
				}finally{
					ioArgs._callNext();				
				}
				return value;
			},
			function(/*Error*/error, /*Deferred*/dfd){
				//summary: errHandler function for dojo._ioSetArgs call.
				dfd.ioArgs._hasError = true;
				dfd.ioArgs._callNext();
				return error;
			}
		);

		//Set up a function that will fire the next iframe request. Make sure it only
		//happens once per deferred.
		dfd.ioArgs._callNext = function(){
			if(!this["_calledNext"]){
				this._calledNext = true;
				dojo.io.iframe._currentDfd = null;
				dojo.io.iframe._fireNextRequest();
			}
		}

		this._dfdQueue.push(dfd);
		this._fireNextRequest();
		
		//Add it the IO watch queue, to get things like timeout support.
		dojo._ioWatch(
			dfd,
			function(/*Deferred*/dfd){
				//validCheck
				return !dfd.ioArgs["_hasError"];
			},
			function(dfd){
				//ioCheck
				return (!!dfd.ioArgs["_finished"]);
			},
			function(dfd){
				//resHandle
				if(dfd.ioArgs._finished){
					dfd.callback(dfd);
				}else{
					dfd.errback(new Error("Invalid dojo.io.iframe request state"));
				}
			}
		);

		return dfd;
	},

	_currentDfd: null,
	_dfdQueue: [],
	_iframeName: dojo._scopeName + "IoIframe",

	_fireNextRequest: function(){
		//summary: Internal method used to fire the next request in the bind queue.
		try{
			if((this._currentDfd)||(this._dfdQueue.length == 0)){ return; }
			//Find next deferred, skip the canceled ones.
			do{
				var dfd = this._currentDfd = this._dfdQueue.shift();
			} while(dfd && dfd.canceled && this._dfdQueue.length);

			//If no more dfds, cancel.
			if(!dfd || dfd.canceled){
				this._currentDfd =  null;
				return;
			}

			var ioArgs = dfd.ioArgs;
			var args = ioArgs.args;

			ioArgs._contentToClean = [];
			var fn = dojo.byId(args["form"]);
			var content = args["content"] || {};
			if(fn){
				if(content){
					// if we have things in content, we need to add them to the form
					// before submission
					var pHandler = function(name, value) {
						var tn;
						if(dojo.isIE){
							tn = dojo.doc.createElement("<input type='hidden' name='"+name+"'>");
						}else{
							tn = dojo.doc.createElement("input");
							tn.type = "hidden";
							tn.name = name;
						}
						tn.value = value;
						fn.appendChild(tn);
						ioArgs._contentToClean.push(name);
					};
					for(var x in content){
						var val = content[x];
						if(dojo.isArray(val) && val.length > 1){
							var i;
							for (i = 0; i < val.length; i++) {
								pHandler(x,val[i]);
							}
						}else{
							if(!fn[x]){
								pHandler(x,val);
							}else{
								fn[x].value = val;
							}
						}
					}
				}
				//IE requires going through getAttributeNode instead of just getAttribute in some form cases, 
				//so use it for all.  See #2844
				var actnNode = fn.getAttributeNode("action");
				var mthdNode = fn.getAttributeNode("method");
				var trgtNode = fn.getAttributeNode("target");
				if(args["url"]){
					ioArgs._originalAction = actnNode ? actnNode.value : null;
					if(actnNode){
						actnNode.value = args.url;
					}else{
						fn.setAttribute("action",args.url);
					}
				}
				if(!mthdNode || !mthdNode.value){
					if(mthdNode){
						mthdNode.value= (args["method"]) ? args["method"] : "post";
					}else{
						fn.setAttribute("method", (args["method"]) ? args["method"] : "post");
					}
				}
				ioArgs._originalTarget = trgtNode ? trgtNode.value: null;
				if(trgtNode){
					trgtNode.value = this._iframeName;
				}else{
					fn.setAttribute("target", this._iframeName);
				}
				fn.target = this._iframeName;
				dojo._ioNotifyStart(dfd);
				fn.submit();
			}else{
				// otherwise we post a GET string by changing URL location for the
				// iframe
				var tmpUrl = args.url + (args.url.indexOf("?") > -1 ? "&" : "?") + ioArgs.query;
				dojo._ioNotifyStart(dfd);
				this.setSrc(this._frame, tmpUrl, true);
			}
		}catch(e){
			dfd.errback(e);
		}
	},

	_iframeOnload: function(){
		var dfd = this._currentDfd;
		if(!dfd){
			this._fireNextRequest();
			return;
		}

		var ioArgs = dfd.ioArgs;
		var args = ioArgs.args;
		var fNode = dojo.byId(args.form);
	
		if(fNode){
			// remove all the hidden content inputs
			var toClean = ioArgs._contentToClean;
			for(var i = 0; i < toClean.length; i++) {
				var key = toClean[i];
				//Need to cycle over all nodes since we may have added
				//an array value which means that more than one node could
				//have the same .name value.
				for(var j = 0; j < fNode.childNodes.length; j++){
					var chNode = fNode.childNodes[j];
					if(chNode.name == key){
						dojo.destroy(chNode);
						break;
					}
				}
			}

			// restore original action + target
			if(ioArgs["_originalAction"]){
				fNode.setAttribute("action", ioArgs._originalAction);
			}
			if(ioArgs["_originalTarget"]){
				fNode.setAttribute("target", ioArgs._originalTarget);
				fNode.target = ioArgs._originalTarget;
			}
		}

		ioArgs._finished = true;
	}
}

}

if(!dojo._hasResource["dojox.io.scriptFrame"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.io.scriptFrame"] = true;
dojo.provide("dojox.io.scriptFrame");




//This module extends dojo.io.script to use an iframe for the dojo.io.script.attach calls
//if the frameDoc argument is passed to dojo.io.script.get(), and if frameDoc is a string (representing
//the DOM ID of an iframe that should be used for the connection. If frameDoc is not a string, then
//it is probably a document object, and dojox.io.scriptFrame should not get involved with the request.
//This is useful in some long-polling comet situations in Firefox and Opera. Those browsers execute scripts
//in DOM order, not network-receive order, so a long-polling script will block other
//dynamically appended scripts from running until it completes. By using an iframe
//for the dojo.io.script requests, this issue can be avoided.

//WARNING: the url argument to dojo.io.script MUST BE relative to the iframe document's location,
//NOT the parent page location. This iframe document's URL will be (dojo.moduleUrl("dojo", "resources/blank.html")
//or djConfig.dojoBlankHtmlUrl (for xdomain loading).

(function(){
	var ioScript = dojo.io.script;
	dojox.io.scriptFrame = {
		_waiters: {},
		_loadedIds: {},

		_getWaiters: function(/*String*/frameId){
			return this._waiters[frameId] || (this._waiters[frameId] = []);
		},

		_fixAttachUrl: function(/*String*/url){
			//summary: fixes the URL so that 		
		},

		_loaded: function(/*String*/frameId){
			//summary: callback used when waiting for a frame to load (related to the usage of
			//the frameId argument to dojo.io.script.get().
			var waiters = this._getWaiters(frameId);
			this._loadedIds[frameId] = true;
			this._waiters[frameId] = null;

			for(var i = 0; i < waiters.length; i++){
				var ioArgs = waiters[i];
				ioArgs.frameDoc = dojo.io.iframe.doc(dojo.byId(frameId));
				ioScript.attach(ioArgs.id, ioArgs.url, ioArgs.frameDoc);
			}
		}
	};

	//Hold on to the old _canAttach function.
	var oldCanAttach = ioScript._canAttach;
	var scriptFrame = dojox.io.scriptFrame;

	//Define frame-aware _canAttach method on dojo.io.script
	ioScript._canAttach = function(/*Object*/ioArgs){
		//summary: provides an override of dojo.io.script._canAttach to check for
		//the existence of a the args.frameDoc property. If it is there, and it is a string,
		//not a document, then create the iframe with an ID of frameDoc, and use that for the calls.
		//If frameDoc is a document, then dojox.io.scriptFrame should not get involved.
		var fId = ioArgs.args.frameDoc;

		if(fId && dojo.isString(fId)){
			var frame = dojo.byId(fId);
			var waiters = scriptFrame._getWaiters(fId);
			if(!frame){
				//Need to create frame, but the frame document, which *must* be
				//on the same domain as the page (set djConfig.dojoBlankHtmlUrl
				//if using xdomain loading). Loading of the frame document is asynchronous,
				//so we need to do callback stuff.
				waiters.push(ioArgs);
				dojo.io.iframe.create(fId, dojox._scopeName + ".io.scriptFrame._loaded('" + fId + "');");
			}else{
				//Frame loading could still be happening. Only call attach if the frame has loaded.
				if(scriptFrame._loadedIds[fId]){
					ioArgs.frameDoc = dojo.io.iframe.doc(frame);
					this.attach(ioArgs.id, ioArgs.url, ioArgs.frameDoc);
				}else{
					waiters.push(ioArgs);
				}
			}
			return false;
		}else{
			return oldCanAttach.apply(this, arguments);
		}
	}
})();


}

if(!dojo._hasResource["dojox.io.xhrScriptPlugin"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.io.xhrScriptPlugin"] = true;
dojo.provide("dojox.io.xhrScriptPlugin");




dojox.io.xhrScriptPlugin = function(/*String*/url, /*String*/callbackParamName, /*Function?*/httpAdapter){
	// summary:
	//		Adds the script transport (JSONP) as an XHR plugin for the given site. See
	//		dojox.io.script for more information on the transport. Note, that JSONP
	//		is *not* a secure transport, by loading data from a third-party site using JSONP
	//		the site has full access to your JavaScript environment.
	//	url:
	//		Url prefix of the site which can handle JSONP requests.
	// 	httpAdapter: This allows for adapting HTTP requests that could not otherwise be 
	// 		sent with JSONP, so you can use a convention for headers and PUT/DELETE methods.
	dojox.io.xhrPlugins.register(
		"script",
		function(method,args){
			 return args.sync !== true && 
				(method == "GET" || httpAdapter) && 
				(args.url.substring(0,url.length) == url);
		},
		function(method,args,hasBody){
			var send = function(){
				args.callbackParamName = callbackParamName;
				if(dojo.body()){
					args.frameDoc = "frame" + Math.random();
				}
				return dojo.io.script.get(args);
			}
			return (httpAdapter ? httpAdapter(send, true) : send)(method, args, hasBody); // use the JSONP transport
		}
	);
};

}

if(!dojo._hasResource["dojox.data.PersevereStore"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.data.PersevereStore"] = true;
dojo.provide("dojox.data.PersevereStore");

 // Persevere supports this and it improves reliability

// PersevereStore is an extension of JsonRestStore to handle Persevere's special features

dojox.json.ref.serializeFunctions = true; // Persevere supports persisted functions

dojo.declare("dojox.data.PersevereStore",dojox.data.JsonQueryRestStore,{
	useFullIdInQueries: true, // in JSONQuerys use the full id
	jsonQueryPagination: false // use the Range headers instead	
});
	
dojox.data.PersevereStore.getStores = function(/*String?*/path,/*Boolean?*/sync){
	// summary:
	//		Creates Dojo data stores for all the table/classes on a Persevere server
	// path:
	// 		URL of the Persevere server's root, this normally just "/"
	// 		which is the default value if the target is not provided
	// sync:
	// 		Indicates that the operation should happen synchronously.
	// return:
	// 		A map/object of datastores will be returned if it is performed asynchronously,
	// 		otherwise it will return a Deferred object that will provide the map/object.
	// 		The name of each property is a the name of a store,
	// 		and the value is the actual data store object.
	path = (path && (path.match(/\/$/) ? path : (path + '/'))) || '/';
	if(path.match(/^\w*:\/\//)){
		// if it is cross-domain, we will use window.name for communication
		
		dojox.io.xhrScriptPlugin(path, "callback", dojox.io.xhrPlugins.fullHttpAdapter);
	}
	var plainXhr = dojo.xhr;
	dojo.xhr = function(method,args){
		(args.headers = args.headers || {})['Server-Methods'] = false;
		return plainXhr.apply(dojo,arguments);
	}
	var rootService= dojox.rpc.Rest(path,true);
	dojox.rpc._sync = sync;
	var dfd = rootService("Class/");//dojo.xhrGet({url: target, sync:!callback, handleAs:'json'});
	var results;
	var stores = {};
	var callId = 0;
	dfd.addCallback(function(schemas){
		dojox.json.ref.resolveJson(schemas, {
			index: dojox.rpc.Rest._index,
			idPrefix: "/Class/",
			assignAbsoluteIds: true
		});
		function setupHierarchy(schema){
			if(schema['extends'] && schema['extends'].prototype){
				if(!schema.prototype || !schema.prototype.isPrototypeOf(schema['extends'].prototype)){
					setupHierarchy(schema['extends']);
					dojox.rpc.Rest._index[schema.prototype.__id] = schema.prototype = dojo.mixin(dojo.delegate(schema['extends'].prototype), schema.prototype);
				}
			}
		}
		function setupMethods(methodsDefinitions, methodsTarget){
			if(methodsDefinitions && methodsTarget){
				for(var j in methodsDefinitions){
					var methodDef = methodsDefinitions[j];
					// if any method definitions indicate that the method should run on the server, than add 
					// it to the prototype as a JSON-RPC method
					if(methodDef.runAt != "client" && !methodsTarget[j]){
						methodsTarget[j] = (function(methodName){
							return function(){
								// execute a JSON-RPC call
								var deferred = dojo.rawXhrPost({
									url: this.__id,
									// the JSON-RPC call
									postData: dojo.toJson({
										method: methodName,
										id: callId++,
										params: dojo._toArray(arguments)
									}),
									handleAs: "json"
								});
								deferred.addCallback(function(response){
									// handle the response
									return response.error ?
										new Error(response.error) :
										response.result;
								});
								return deferred;
							}
						})(j);	
					}
				}
			}
		}
		for(var i in schemas){
			if(typeof schemas[i] == 'object'){
				var schema = schemas[i];
				setupHierarchy(schema);
				setupMethods(schema.methods, schema.prototype = schema.prototype || {});
				setupMethods(schema.staticMethods, schema);
				stores[schemas[i].id] = new dojox.data.PersevereStore({target:new dojo._Url(path,schemas[i].id) + '/',schema:schema});
			}
		}
		return (results = stores);
	});
	dojo.xhr = plainXhr;
	return sync ? results : dfd;
};
dojox.data.PersevereStore.addProxy = function(){
	// summary:
	//		Invokes the XHR proxy plugin. Call this if you will be using x-site data.
	 // also not necessary, but we can register that Persevere supports proxying
	dojox.io.xhrPlugins.addProxy("/proxy/");
};

}

