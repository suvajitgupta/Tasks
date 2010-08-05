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

if(!dojo._hasResource["dojox.json.query"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.json.query"] = true;
dojo.provide("dojox.json.query");

(function(){
	function s(obj,start,end,step){
		// handles slice operations: [3:6:2]
		var len=obj.length,results = [];
		end = end || len;
		start = (start < 0) ? Math.max(0,start+len) : Math.min(len,start);
		end = (end < 0) ? Math.max(0,end+len) : Math.min(len,end);
	  	for(var i=start; i<end; i+=step){
	  		results.push(obj[i]);
	  	}
		return results;
	}
	function e(obj,name){
		// handles ..name, .*, [*], [val1,val2], [val]
		// name can be a property to search for, undefined for full recursive, or an array for picking by index
		var results = [];
		function walk(obj){
			if(name){
				if(name===true && !(obj instanceof Array)){
					//recursive object search
					results.push(obj);
				}else if(obj[name]){
					// found the name, add to our results
					results.push(obj[name]);
				}
			}
			for(var i in obj){
				var val = obj[i];
				if(!name){
					// if we don't have a name we are just getting all the properties values (.* or [*])
					results.push(val);
				}else if(val && typeof val == 'object'){
					
					walk(val);
				}
			}
		}
		if(name instanceof Array){
			// this is called when multiple items are in the brackets: [3,4,5]
			if(name.length==1){
				// this can happen as a result of the parser becoming confused about commas 
				// in the brackets like [@.func(4,2)]. Fixing the parser would require recursive 
				// analsys, very expensive, but this fixes the problem nicely. 
				return obj[name[0]];
			}
			for(var i = 0; i < name.length; i++){
				results.push(obj[name[i]]);
			}
		}else{
			// otherwise we expanding
			walk(obj);
		}
		return results;
	}
	
	function distinctFilter(array, callback){
		// does the filter with removal of duplicates in O(n)
		var outArr = [];
		var primitives = {};
		for(var i=0,l=array.length; i<l; ++i){
			var value = array[i];
			if(callback(value, i, array)){
				if((typeof value == 'object') && value){
					// with objects we prevent duplicates with a marker property
					if(!value.__included){
						value.__included = true;
						outArr.push(value);
					}
				}else if(!primitives[value + typeof value]){
					// with primitives we prevent duplicates by putting it in a map 
					primitives[value + typeof value] = true;
					outArr.push(value);
				}
			}
		}
		for(i=0,l=outArr.length; i<l; ++i){
			// cleanup the marker properties
			if(outArr[i]){
				delete outArr[i].__included;
			}
		}
		return outArr;
	}
	dojox.json.query = function(/*String*/query,/*Object?*/obj){
		// summary:
		// 		Performs a JSONQuery on the provided object and returns the results. 
		// 		If no object is provided (just a query), it returns a "compiled" function that evaluates objects
		// 		according to the provided query.
		// query:
		// 		Query string
		// 	obj:
		// 		Target of the JSONQuery
		//
		//	description:
		//		JSONQuery provides a comprehensive set of data querying tools including filtering,
		//		recursive search, sorting, mapping, range selection, and powerful expressions with
		//		wildcard string comparisons and various operators. JSONQuery generally supersets
		// 		JSONPath and provides syntax that matches and behaves like JavaScript where
		// 		possible.
		//
		//		JSONQuery evaluations begin with the provided object, which can referenced with
		// 		$. From
		// 		the starting object, various operators can be successively applied, each operating
		// 		on the result of the last operation. 
		//
		// 		Supported Operators:
		// 		--------------------
		//		* .property - This will return the provided property of the object, behaving exactly 
		// 		like JavaScript. 
		// 		* [expression] - This returns the property name/index defined by the evaluation of 
		// 		the provided expression, behaving exactly like JavaScript.
		//		* [?expression] - This will perform a filter operation on an array, returning all the
		// 		items in an array that match the provided expression. This operator does not
		//		need to be in brackets, you can simply use ?expression, but since it does not
		//		have any containment, no operators can be used afterwards when used 
		// 		without brackets.
		//		* [^?expression] - This will perform a distinct filter operation on an array. This behaves
		//		as [?expression] except that it will remove any duplicate values/objects from the 
		//		result set.
		// 		* [/expression], [\expression], [/expression, /expression] - This performs a sort 
		// 		operation on an array, with sort based on the provide expression. Multiple comma delimited sort
		// 		expressions can be provided for multiple sort orders (first being highest priority). /
		//		indicates ascending order and \ indicates descending order
		// 		* [=expression] - This performs a map operation on an array, creating a new array
		//		with each item being the evaluation of the expression for each item in the source array.
		//		* [start:end:step] - This performs an array slice/range operation, returning the elements
		//		from the optional start index to the optional end index, stepping by the optional step number.
		// 		* [expr,expr] - This a union operator, returning an array of all the property/index values from
		// 		the evaluation of the comma delimited expressions. 
		// 		* .* or [*] - This returns the values of all the properties of the current object. 
		// 		* $ - This is the root object, If a JSONQuery expression does not being with a $, 
		// 		it will be auto-inserted at the beginning. 
		// 		* @ - This is the current object in filter, sort, and map expressions. This is generally
		// 		not necessary, names are auto-converted to property references of the current object
		// 		in expressions. 
		// 		*	..property - Performs a recursive search for the given property name, returning
		// 		an array of all values with such a property name in the current object and any subobjects
		// 		* expr = expr - Performs a comparison (like JS's ==). When comparing to
		// 		a string, the comparison string may contain wildcards * (matches any number of 
		// 		characters) and ? (matches any single character).
		// 		* expr ~ expr - Performs a string comparison with case insensitivity.
		//		* ..[?expression] - This will perform a deep search filter operation on all the objects and 
		// 		subobjects of the current data. Rather than only searching an array, this will search 
		// 		property values, arrays, and their children.
		//		* $1,$2,$3, etc. - These are references to extra parameters passed to the query
		//		function or the evaluator function.
		//		* +, -, /, *, &, |, %, (, ), <, >, <=, >=, != - These operators behave just as they do
		// 		in JavaScript.
		//		
		//	
		//	
		// 	|	dojox.json.query(queryString,object) 
		// 		and
		// 	|	dojox.json.query(queryString)(object)
		// 		always return identical results. The first one immediately evaluates, the second one returns a
		// 		function that then evaluates the object.
		//  
		// 	example:
		// 	|	dojox.json.query("foo",{foo:"bar"}) 
		// 		This will return "bar".
		//
		//	example:
		//	|	evaluator = dojox.json.query("?foo='bar'&rating>3");
		//		This creates a function that finds all the objects in an array with a property
		//		foo that is equals to "bar" and with a rating property with a value greater
		//		than 3.
		//	|	evaluator([{foo:"bar",rating:4},{foo:"baz",rating:2}])
		// 		This returns:
		// 	|	{foo:"bar",rating:4}
		//
		//	example:
		// 	|	evaluator = dojox.json.query("$[?price<15.00][\rating][0:10]");
		// 	 	This finds objects in array with a price less than 15.00 and sorts then
		// 		by rating, highest rated first, and returns the first ten items in from this
		// 		filtered and sorted list.
		var depth = 0;	
		var str = [];
		query = query.replace(/"(\\.|[^"\\])*"|'(\\.|[^'\\])*'|[\[\]]/g,function(t){
			depth += t == '[' ? 1 : t == ']' ? -1 : 0; // keep track of bracket depth
			return (t == ']' && depth > 0) ? '`]' : // we mark all the inner brackets as skippable
					(t.charAt(0) == '"' || t.charAt(0) == "'") ? "`" + (str.push(t) - 1) :// and replace all the strings
						t;     
		});
		var prefix = '';
		function call(name){
			// creates a function call and puts the expression so far in a parameter for a call 
			prefix = name + "(" + prefix;
		}
		function makeRegex(t,a,b,c,d,e,f,g){
			// creates a regular expression matcher for when wildcards and ignore case is used 
			return str[g].match(/[\*\?]/) || f == '~' ?
					"/^" + str[g].substring(1,str[g].length-1).replace(/\\([btnfr\\"'])|([^\w\*\?])/g,"\\$1$2").replace(/([\*\?])/g,"[\\w\\W]$1") + (f == '~' ? '$/i' : '$/') + ".test(" + a + ")" :
					t;
		}
		query.replace(/(\]|\)|push|pop|shift|splice|sort|reverse)\s*\(/,function(){
			throw new Error("Unsafe function call");
		});
		
		query = query.replace(/([^=]=)([^=])/g,"$1=$2"). // change the equals to comparisons
			replace(/@|(\.\s*)?[a-zA-Z\$_]+(\s*:)?/g,function(t){
				return t.charAt(0) == '.' ? t : // leave .prop alone 
					t == '@' ? "$obj" :// the reference to the current object 
					(t.match(/:|^(\$|Math|true|false|null)$/) ? "" : "$obj.") + t; // plain names should be properties of root... unless they are a label in object initializer
			}).
			replace(/\.?\.?\[(`\]|[^\]])*\]|\?.*|\.\.([\w\$_]+)|\.\*/g,function(t,a,b){
				var oper = t.match(/^\.?\.?(\[\s*\^?\?|\^?\?|\[\s*==)(.*?)\]?$/); // [?expr] and ?expr and [=expr and =expr
				if(oper){
					var prefix = '';
					if(t.match(/^\./)){
						// recursive object search
						call("e");
						prefix = ",true)";
					}
					call(oper[1].match(/\=/) ? "dojo.map" : oper[1].match(/\^/) ? "distinctFilter" : "dojo.filter");
					return prefix + ",function($obj){return " + oper[2] + "})"; 
				}
				oper = t.match(/^\[\s*([\/\\].*)\]/); // [/sortexpr,\sortexpr]
				if(oper){
					// make a copy of the array and then sort it using the sorting expression
					return ".concat().sort(function(a,b){" + oper[1].replace(/\s*,?\s*([\/\\])\s*([^,\\\/]+)/g,function(t,a,b){
							return "var av= " + b.replace(/\$obj/,"a") + ",bv= " + b.replace(/\$obj/,"b") + // FIXME: Should check to make sure the $obj token isn't followed by characters
									";if(av>bv||bv==null){return " + (a== "/" ? 1 : -1) +";}\n" +
									"if(bv>av||av==null){return " + (a== "/" ? -1 : 1) +";}\n";
					}) + "return 0;})";
				}
				oper = t.match(/^\[(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)\]/); // slice [0:3]
				if(oper){
					call("s");
					return "," + (oper[1] || 0) + "," + (oper[2] || 0) + "," + (oper[3] || 1) + ")"; 
				}
				if(t.match(/^\.\.|\.\*|\[\s*\*\s*\]|,/)){ // ..prop and [*]
					call("e");
					return (t.charAt(1) == '.' ? 
							",'" + b + "'" : // ..prop 
								t.match(/,/) ? 
									"," + t : // [prop1,prop2]
									"") + ")"; // [*]
				}
				return t;
			}).
			replace(/(\$obj\s*((\.\s*[\w_$]+\s*)|(\[\s*`([0-9]+)\s*`\]))*)(==|~)\s*`([0-9]+)/g,makeRegex). // create regex matching
			replace(/`([0-9]+)\s*(==|~)\s*(\$obj\s*((\.\s*[\w_$]+)|(\[\s*`([0-9]+)\s*`\]))*)/g,function(t,a,b,c,d,e,f,g){ // and do it for reverse =
				return makeRegex(t,c,d,e,f,g,b,a);
			});
		query = prefix + (query.charAt(0) == '$' ? "" : "$") + query.replace(/`([0-9]+|\])/g,function(t,a){
			//restore the strings
			return a == ']' ? ']' : str[a];
		});
		// create a function within this scope (so it can use expand and slice)
		
		var executor = eval("1&&function($,$1,$2,$3,$4,$5,$6,$7,$8,$9){var $obj=$;return " + query + "}");
		for(var i = 0;i<arguments.length-1;i++){
			arguments[i] = arguments[i+1];
		}
		return obj ? executor.apply(this,arguments) : executor;
	};
	
})();

}

if(!dojo._hasResource["dojo.data.util.filter"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.data.util.filter"] = true;
dojo.provide("dojo.data.util.filter");

dojo.data.util.filter.patternToRegExp = function(/*String*/pattern, /*boolean?*/ ignoreCase){
	//	summary:  
	//		Helper function to convert a simple pattern to a regular expression for matching.
	//	description:
	//		Returns a regular expression object that conforms to the defined conversion rules.
	//		For example:  
	//			ca*   -> /^ca.*$/
	//			*ca*  -> /^.*ca.*$/
	//			*c\*a*  -> /^.*c\*a.*$/
	//			*c\*a?*  -> /^.*c\*a..*$/
	//			and so on.
	//
	//	pattern: string
	//		A simple matching pattern to convert that follows basic rules:
	//			* Means match anything, so ca* means match anything starting with ca
	//			? Means match single character.  So, b?b will match to bob and bab, and so on.
	//      	\ is an escape character.  So for example, \* means do not treat * as a match, but literal character *.
	//				To use a \ as a character in the string, it must be escaped.  So in the pattern it should be 
	//				represented by \\ to be treated as an ordinary \ character instead of an escape.
	//
	//	ignoreCase:
	//		An optional flag to indicate if the pattern matching should be treated as case-sensitive or not when comparing
	//		By default, it is assumed case sensitive.

	var rxp = "^";
	var c = null;
	for(var i = 0; i < pattern.length; i++){
		c = pattern.charAt(i);
		switch(c){
			case '\\':
				rxp += c;
				i++;
				rxp += pattern.charAt(i);
				break;
			case '*':
				rxp += ".*"; break;
			case '?':
				rxp += "."; break;
			case '$':
			case '^':
			case '/':
			case '+':
			case '.':
			case '|':
			case '(':
			case ')':
			case '{':
			case '}':
			case '[':
			case ']':
				rxp += "\\"; //fallthrough
			default:
				rxp += c;
		}
	}
	rxp += "$";
	if(ignoreCase){
		return new RegExp(rxp,"mi"); //RegExp
	}else{
		return new RegExp(rxp,"m"); //RegExp
	}
	
};

}

if(!dojo._hasResource["dojox.data.ClientFilter"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.data.ClientFilter"] = true;
dojo.provide("dojox.data.ClientFilter");
 
// This is an abstract data store module for adding updateable result set functionality to an existing data store class
(function(){
	var cf;
	var addUpdate = function(store,create,remove){
		// create a handler that adds to the list of notifications
		return function(item){
			store._updates.push({
					create:create && item,
					remove:remove && item
				});
			cf.onUpdate();
		}
	};
	cf = dojo.declare("dojox.data.ClientFilter",
		null,
		{
			cacheByDefault: false,
			constructor: function(){
				// summary:
				//		This is an abstract class that data stores can extend to add updateable result set functionality
				// 		as well as client side querying capabilities. This enables
				//		widgets to be aware of how active results change in response to the modifications/notifications.
				//
				//	description:
				//		To a update a result set after a notification (onNew, onSet, and onDelete),
				// 		widgets can call the updateResultSet method. Widgets can use the updated
				//		result sets to determine how to react to notifications, and how to update their displayed results
				//		based on changes.
				//
				// 		This module will use the best available information to update result sets, using query attribute
				// 		objects to determine if items are in a result set, and using the sort arrays to maintain sort
				// 		information. However, queries can be opaque strings, and this module can not update
				// 		results by itself in this case. In this situations, data stores can provide a isUpdateable(request) function
				// 		and matchesQuery(item,request) function. If a data store can handle a query, it can return true from
				// 		isUpdateable and if an item matches a query, it can return true from matchesQuery. Here is 
				//		definition of isUpdateable and matchesQuery
				// 		isUpdateable(request)  - request is the keywords arguments as is passed to the fetch function.
				// 		matchesQuery(item,request) - item is the item to test, and request is the value arguments object
				//				for the fetch function.
				//
				//		You can define a property on this object instance "cacheByDefault" to a value of true that will 
				// 		cause all queries to be cached by default unless the cache queryOption is explicitly set to false.
				// 		This can be defined in the constructor options for ServiceStore/JsonRestStore and subtypes. 
				//
				// example:
				//		to make a updated-result-set data store from an existing data store:
				//	|	dojo.declare("dojox.data.MyLiveDataStore",
				//	|		dojox.data.MyDataStore,dojox.data.ClientFilter], // subclass LiveResultSets if available
				//	|		{}
				//	|	);
				this.onSet = addUpdate(this,true,true);
				this.onNew = addUpdate(this,true,false);
				this.onDelete = addUpdate(this,false,true);
				this._updates= [];
				this._fetchCache = [];				
			},
			clearCache: function(){
				//	summary:
				//		Clears the cache of client side queries
				this._fetchCache = [];
			},
			updateResultSet: function(/*Array*/ resultSet, /*Object*/ request){
				//	summary:
				//		Attempts to update the given result set based on previous notifications
				//	resultSet:				
				//		The result set array that should be updated
				//	request:
				//		This object follows the same meaning as the keywordArgs passed to a dojo.data.api.Read.fetch.
				//	description:
				// 		This will attempt to update the provide result based on previous notification, adding new items 
				// 		from onNew calls, removing deleted items, and updating modified items, and properly removing
				//  	and adding items as required by the query and sort parameters. This function will return:
				//		0: Indicates it could not successfully update the result set
				//		1: Indicates it could successfully handle all the notifications, but no changes were made to the result set
				//		2: Indicates it successfully handled all the notifications and result set has been updated.
				if(this.isUpdateable(request)){
					// we try to avoid rerunning notification updates more than once on the same object for performance 
					for(var i = request._version || 0; i < this._updates.length;i++){
						// for each notification,we will update the result set
						var create = this._updates[i].create;
						var remove = this._updates[i].remove;
						if(remove){
							for(var j = 0; j < resultSet.length;j++){
								if(resultSet[j] == remove){
									resultSet.splice(j--,1);
									var updated = true;
								}
							}
						}
						if(create && this.matchesQuery(create,request) && // if there is a new/replacement item and it matches the query 
								dojo.indexOf(resultSet,create) == -1){ // and it doesn't already exist in query
							resultSet.push(create); // should this go at the beginning by default instead?
							updated = true;
						}
					}
					if(request.sort && updated){
						// do the sort if needed
						resultSet.sort(this.makeComparator(request.sort.concat()));
					}
					resultSet._fullLength = resultSet.length;
					if(request.count && updated && request.count !== Infinity){
						// do we really need to do this?
						// make sure we still find within the defined paging set
						resultSet.splice(request.count, resultSet.length);
					}
					request._version = this._updates.length;
					return updated ? 2 : 1;
				}
				return 0;
			},
			querySuperSet: function(argsSuper, argsSub){
				//	summary:
				//		Determines whether the provided arguments are super/sub sets of each other
				// argsSuper:
				// 		Dojo Data Fetch arguments 
				// argsSub:
				// 		Dojo Data Fetch arguments
				if(argsSuper.query == argsSub.query){
					return {};
				}
				if(!(argsSub.query instanceof Object && // sub query must be an object
						// super query must be non-existent or an object
						(!argsSuper.query || typeof argsSuper.query == 'object'))){
					return false;
				}
				var clientQuery = dojo.mixin({},argsSub.query);
				for(var i in argsSuper.query){
					if(clientQuery[i] == argsSuper.query[i]){
						delete clientQuery[i];
					}else if(!(typeof argsSuper.query[i] == 'string' && 
							// if it is a pattern, we can test to see if it is a sub-pattern 
							// FIXME: This is not technically correct, but it will work for the majority of cases
							dojo.data.util.filter.patternToRegExp(argsSuper.query[i]).test(clientQuery[i]))){
						return false;
					}
				}
				return clientQuery;
			},
			//	This is the point in the version notification history at which it is known that the server is in sync, this should
			//	be updated to this._updates.length on commit operations.
			serverVersion: 0,
			
			cachingFetch: function(args){
				var self = this;
				for(var i = 0; i < this._fetchCache.length;i++){
					var cachedArgs = this._fetchCache[i];
					var clientQuery = this.querySuperSet(cachedArgs,args);
					if(clientQuery !== false){
						var defResult = cachedArgs._loading;
						if(!defResult){
							defResult = new dojo.Deferred();
							defResult.callback(cachedArgs.cacheResults);
						}
						defResult.addCallback(function(results){
							results = self.clientSideFetch(dojo.mixin(dojo.mixin({}, args),{query:clientQuery}), results);
							defResult.fullLength = results._fullLength;
							return results;
						});
						args._version = cachedArgs._version;
						break;
					}
				}
				if(!defResult){
					var serverArgs = dojo.mixin({}, args);
					var putInCache = (args.queryOptions || 0).cache;
					var fetchCache = this._fetchCache;
					if(putInCache === undefined ? this.cacheByDefault : putInCache){
						// we are caching this request, so we want to get all the data, and page on the client side
						if(args.start || args.count){
							delete serverArgs.start;
							delete serverArgs.count;
							args.clientQuery = dojo.mixin(args.clientQuery || {}, {
								start: args.start,
								count: args.count
							});
						}
						args = serverArgs;
						fetchCache.push(args);
					}
					defResult= args._loading = this._doQuery(args);
					 
					defResult.addErrback(function(){
						fetchCache.splice(dojo.indexOf(fetchCache, args), 1);
					});
				}
				var version = this.serverVersion;
				
				defResult.addCallback(function(results){
					delete args._loading;
					// update the result set in case anything changed while we were waiting for the fetch
					if(results){
						args._version = typeof args._version == "number" ? args._version : version;
						self.updateResultSet(results,args);
						args.cacheResults = results;
						if(!args.count || results.length < args.count){
							defResult.fullLength = ((args.start)?args.start:0) + results.length;
						}
					}
					return results;
				});
				return defResult;
			},
			isUpdateable: function(/*Object*/ request){
				//	summary:
				//		Returns whether the provide fetch arguments can be used to update an existing list
				//	request:
				//		See dojo.data.api.Read.fetch request
				
				return typeof request.query == "object";
			},
			clientSideFetch: function(/*Object*/ request,/*Array*/ baseResults){
				// summary:
				//		Performs a query on the client side and returns the results as an array
				//
				//	request:
				//		See dojo.data.api.Read.fetch request
				//		
				//	baseResults:
				//		This provides the result set to start with for client side querying
				if(request.queryOptions && request.queryOptions.results){
					baseResults = request.queryOptions.results;
				}
				if(request.query){
					// filter by the query
					var results = [];
					for(var i = 0; i < baseResults.length; i++){
						var value = baseResults[i];
						if(value && this.matchesQuery(value,request)){
							results.push(baseResults[i]);
						}
					}
				}else{
					results = request.sort ? baseResults.concat() : baseResults; // we don't want to mutate the baseResults if we are doing a sort
				}
				if(request.sort){
					// do the sort if needed
					results.sort(this.makeComparator(request.sort.concat()));
				}
				return this.clientSidePaging(request, results);
			},
			clientSidePaging: function(/*Object*/ request,/*Array*/ baseResults){
				var start = request.start || 0;
				var finalResults = (start || request.count) ? baseResults.slice(start,start + (request.count || baseResults.length)) : baseResults;
				finalResults._fullLength = baseResults.length;
				return finalResults; 
			},
			matchesQuery: function(item,request){
				var query = request.query; 
				var ignoreCase = request.queryOptions && request.queryOptions.ignoreCase;
				for(var i in query){
					// if anything doesn't match, than this should be in the query
					var match = query[i];
					var value = this.getValue(item,i);
					if((typeof match == 'string' && (match.match(/[\*\.]/) || ignoreCase)) ?
						!dojo.data.util.filter.patternToRegExp(match, ignoreCase).test(value) :
						value != match){
						return false;
					}
				}
				return true;
			},
			makeComparator: function(sort){
				//	summary:
				// 		returns a comparator function for the given sort order array
				//	sort:
				//		See dojox.data.api.Read.fetch
				var current = sort.shift();
				if(!current){
					// sort order for ties and no sort orders
					return function(){
						return 0;// keep the order unchanged
					}; 
				}
				var attribute = current.attribute;
				var descending = !!current.descending;
				var next = this.makeComparator(sort);
				var store = this;
				return function(a,b){
					var av = store.getValue(a,attribute);
					var bv = store.getValue(b,attribute);
					if(av != bv){
						return av < bv == descending ? 1 : -1;
					}
					return next(a,b); 
				}; 
			}
		}
	);
	cf.onUpdate = function(){};
})();

}

