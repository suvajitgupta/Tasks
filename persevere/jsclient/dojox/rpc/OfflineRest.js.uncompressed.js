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

if(!dojo._hasResource["dojox.storage.Provider"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.storage.Provider"] = true;
dojo.provide("dojox.storage.Provider");

dojo.declare("dojox.storage.Provider", null, {
	// summary: A singleton for working with dojox.storage.
	// description:
	//		dojox.storage exposes the current available storage provider on this
	//		platform. It gives you methods such as dojox.storage.put(),
	//		dojox.storage.get(), etc.
	//		
	//		For more details on dojox.storage, see the primary documentation
	//		page at
	//			http://manual.dojotoolkit.org/storage.html
	//		
	//		Note for storage provider developers who are creating subclasses-
	//		This is the base class for all storage providers Specific kinds of
	//		Storage Providers should subclass this and implement these methods.
	//		You should avoid initialization in storage provider subclass's
	//		constructor; instead, perform initialization in your initialize()
	//		method. 
	constructor: function(){
	},
	
	// SUCCESS: String
	//	Flag that indicates a put() call to a 
	//	storage provider was succesful.
	SUCCESS: "success",
	
	// FAILED: String
	//	Flag that indicates a put() call to 
	//	a storage provider failed.
	FAILED: "failed",
	
	// PENDING: String
	//	Flag that indicates a put() call to a 
	//	storage provider is pending user approval.
	PENDING: "pending",
	
	// SIZE_NOT_AVAILABLE: String
	//	Returned by getMaximumSize() if this storage provider can not determine
	//	the maximum amount of data it can support. 
	SIZE_NOT_AVAILABLE: "Size not available",
	
	// SIZE_NO_LIMIT: String
	//	Returned by getMaximumSize() if this storage provider has no theoretical
	//	limit on the amount of data it can store. 
	SIZE_NO_LIMIT: "No size limit",

	// DEFAULT_NAMESPACE: String
	//	The namespace for all storage operations. This is useful if several
	//	applications want access to the storage system from the same domain but
	//	want different storage silos. 
	DEFAULT_NAMESPACE: "default",
	
	// onHideSettingsUI: Function
	//	If a function is assigned to this property, then when the settings
	//	provider's UI is closed this function is called. Useful, for example,
	//	if the user has just cleared out all storage for this provider using
	//	the settings UI, and you want to update your UI.
	onHideSettingsUI: null,

	initialize: function(){
		// summary: 
		//		Allows this storage provider to initialize itself. This is
		//		called after the page has finished loading, so you can not do
		//		document.writes(). Storage Provider subclasses should initialize
		//		themselves inside of here rather than in their function
		//		constructor.
		console.warn("dojox.storage.initialize not implemented");
	},
	
	isAvailable: function(){ /*Boolean*/
		// summary: 
		//		Returns whether this storage provider is available on this
		//		platform. 
		console.warn("dojox.storage.isAvailable not implemented");
	},

	put: function(	/*string*/ key,
					/*object*/ value, 
					/*function*/ resultsHandler,
					/*string?*/ namespace){
		// summary:
		//		Puts a key and value into this storage system.
		// description:
		//		Example-
		//			var resultsHandler = function(status, key, message, namespace){
		//			  alert("status="+status+", key="+key+", message="+message);
		//			};
		//			dojox.storage.put("test", "hello world", resultsHandler);
		//
		//			Arguments:
		//
		//			status - The status of the put operation, given by
		//								dojox.storage.FAILED, dojox.storage.SUCCEEDED, or
		//								dojox.storage.PENDING
		//			key - The key that was used for the put
		//			message - An optional message if there was an error or things failed.
		//			namespace - The namespace of the key. This comes at the end since
		//									it was added later.
		//	
		//		Important note: if you are using Dojo Storage in conjunction with
		//		Dojo Offline, then you don't need to provide
		//		a resultsHandler; this is because for Dojo Offline we 
		//		use Google Gears to persist data, which has unlimited data
		//		once the user has given permission. If you are using Dojo
		//		Storage apart from Dojo Offline, then under the covers hidden
		//		Flash might be used, which is both asychronous and which might
		//		get denied; in this case you must provide a resultsHandler.
		// key:
		//		A string key to use when retrieving this value in the future.
		// value:
		//		A value to store; this can be any JavaScript type.
		// resultsHandler:
		//		A callback function that will receive three arguments. The
		//		first argument is one of three values: dojox.storage.SUCCESS,
		//		dojox.storage.FAILED, or dojox.storage.PENDING; these values
		//		determine how the put request went. In some storage systems
		//		users can deny a storage request, resulting in a
		//		dojox.storage.FAILED, while in other storage systems a storage
		//		request must wait for user approval, resulting in a
		//		dojox.storage.PENDING status until the request is either
		//		approved or denied, resulting in another call back with
		//		dojox.storage.SUCCESS. 
		//		The second argument in the call back is the key name that was being stored.
		//		The third argument in the call back is an optional message that
		//		details possible error messages that might have occurred during
		//		the storage process.
		//	namespace:
		//		Optional string namespace that this value will be placed into;
		//		if left off, the value will be placed into dojox.storage.DEFAULT_NAMESPACE
		
		console.warn("dojox.storage.put not implemented");
	},

	get: function(/*string*/ key, /*string?*/ namespace){ /*Object*/
		// summary:
		//		Gets the value with the given key. Returns null if this key is
		//		not in the storage system.
		// key:
		//		A string key to get the value of.
		//	namespace:
		//		Optional string namespace that this value will be retrieved from;
		//		if left off, the value will be retrieved from dojox.storage.DEFAULT_NAMESPACE
		// return: Returns any JavaScript object type; null if the key is not present
		console.warn("dojox.storage.get not implemented");
	},

	hasKey: function(/*string*/ key, /*string?*/ namespace){
		// summary: Determines whether the storage has the given key. 
		return !!this.get(key, namespace); // Boolean
	},

	getKeys: function(/*string?*/ namespace){ /*Array*/
		// summary: Enumerates all of the available keys in this storage system.
		// return: Array of available keys
		console.warn("dojox.storage.getKeys not implemented");
	},
	
	clear: function(/*string?*/ namespace){
		// summary: 
		//		Completely clears this storage system of all of it's values and
		//		keys. If 'namespace' is provided just clears the keys in that
		//		namespace.
		console.warn("dojox.storage.clear not implemented");
	},
  
	remove: function(/*string*/ key, /*string?*/ namespace){
		// summary: Removes the given key from this storage system.
		console.warn("dojox.storage.remove not implemented");
	},
	
	getNamespaces: function(){ /*string[]*/
		console.warn("dojox.storage.getNamespaces not implemented");
	},

	isPermanent: function(){ /*Boolean*/
		// summary:
		//		Returns whether this storage provider's values are persisted
		//		when this platform is shutdown. 
		console.warn("dojox.storage.isPermanent not implemented");
	},

	getMaximumSize: function(){ /* mixed */
		// summary: The maximum storage allowed by this provider
		// returns: 
		//	Returns the maximum storage size 
		//	supported by this provider, in 
		//	thousands of bytes (i.e., if it 
		//	returns 60 then this means that 60K 
		//	of storage is supported).
		//
		//	If this provider can not determine 
		//	it's maximum size, then 
		//	dojox.storage.SIZE_NOT_AVAILABLE is 
		//	returned; if there is no theoretical
		//	limit on the amount of storage 
		//	this provider can return, then
		//	dojox.storage.SIZE_NO_LIMIT is 
		//	returned
		console.warn("dojox.storage.getMaximumSize not implemented");
	},
		
	putMultiple: function(	/*array*/ keys,
							/*array*/ values, 
							/*function*/ resultsHandler,
							/*string?*/ namespace){
		// summary:
		//		Puts multiple keys and values into this storage system.
		// description:
		//		Example-
		//			var resultsHandler = function(status, key, message){
		//			  alert("status="+status+", key="+key+", message="+message);
		//			};
		//			dojox.storage.put(["test"], ["hello world"], resultsHandler);
		//	
		//		Important note: if you are using Dojo Storage in conjunction with
		//		Dojo Offline, then you don't need to provide
		//		a resultsHandler; this is because for Dojo Offline we 
		//		use Google Gears to persist data, which has unlimited data
		//		once the user has given permission. If you are using Dojo
		//		Storage apart from Dojo Offline, then under the covers hidden
		//		Flash might be used, which is both asychronous and which might
		//		get denied; in this case you must provide a resultsHandler.
		// keys:
		//		An array of string keys to use when retrieving this value in the future,
		//		one per value to be stored
		// values:
		//		An array of values to store; this can be any JavaScript type, though the
		//		performance of plain strings is considerably better
		// resultsHandler:
		//		A callback function that will receive three arguments. The
		//		first argument is one of three values: dojox.storage.SUCCESS,
		//		dojox.storage.FAILED, or dojox.storage.PENDING; these values
		//		determine how the put request went. In some storage systems
		//		users can deny a storage request, resulting in a
		//		dojox.storage.FAILED, while in other storage systems a storage
		//		request must wait for user approval, resulting in a
		//		dojox.storage.PENDING status until the request is either
		//		approved or denied, resulting in another call back with
		//		dojox.storage.SUCCESS. 
		//		The second argument in the call back is the key name that was being stored.
		//		The third argument in the call back is an optional message that
		//		details possible error messages that might have occurred during
		//		the storage process.
		//	namespace:
		//		Optional string namespace that this value will be placed into;
		//		if left off, the value will be placed into dojox.storage.DEFAULT_NAMESPACE
		
		for(var i = 0; i < keys.length; i++){ 
			dojox.storage.put(keys[i], values[i], resultsHandler, namespace); 
		}
	},

	getMultiple: function(/*array*/ keys, /*string?*/ namespace){ /*Object*/
		// summary:
		//		Gets the valuse corresponding to each of the given keys. 
		//		Returns a null array element for each given key that is
		//		not in the storage system.
		// keys:
		//		An array of string keys to get the value of.
		//	namespace:
		//		Optional string namespace that this value will be retrieved from;
		//		if left off, the value will be retrieved from dojox.storage.DEFAULT_NAMESPACE
		// return: Returns any JavaScript object type; null if the key is not present
		
		var results = []; 
		for(var i = 0; i < keys.length; i++){ 
			results.push(dojox.storage.get(keys[i], namespace)); 
		} 
		
		return results;
	},

	removeMultiple: function(/*array*/ keys, /*string?*/ namespace) {
		// summary: Removes the given keys from this storage system.
		
		for(var i = 0; i < keys.length; i++){ 
			dojox.storage.remove(keys[i], namespace); 
		}
	},
	
	isValidKeyArray: function( keys) {
		if(keys === null || keys === undefined || !dojo.isArray(keys)){
			return false;
		}

		//	JAC: This could be optimized by running the key validity test 
		//  directly over a joined string
		return !dojo.some(keys, function(key){
			return !this.isValidKey(key);
		}, this); // Boolean
	},

	hasSettingsUI: function(){ /*Boolean*/
		// summary: Determines whether this provider has a settings UI.
		return false;
	},

	showSettingsUI: function(){
		// summary: If this provider has a settings UI, determined
		// by calling hasSettingsUI(), it is shown. 
		console.warn("dojox.storage.showSettingsUI not implemented");
	},

	hideSettingsUI: function(){
		// summary: If this provider has a settings UI, hides it.
		console.warn("dojox.storage.hideSettingsUI not implemented");
	},
	
	isValidKey: function(/*string*/ keyName){ /*Boolean*/
		// summary:
		//		Subclasses can call this to ensure that the key given is valid
		//		in a consistent way across different storage providers. We use
		//		the lowest common denominator for key values allowed: only
		//		letters, numbers, and underscores are allowed. No spaces. 
		if(keyName === null || keyName === undefined){
			return false;
		}
			
		return /^[0-9A-Za-z_]*$/.test(keyName);
	},
	
	getResourceList: function(){ /* Array[] */
		// summary:
		//	Returns a list of URLs that this
		//	storage provider might depend on.
		// description:
		//	This method returns a list of URLs that this
		//	storage provider depends on to do its work.
		//	This list is used by the Dojo Offline Toolkit
		//	to cache these resources to ensure the machinery
		//	used by this storage provider is available offline.
		//	What is returned is an array of URLs.
		//  Note that Dojo Offline uses Gears as its native 
		//  storage provider, and does not support using other
		//  kinds of storage providers while offline anymore.
		
		return [];
	}
});

}

if(!dojo._hasResource["dojox.storage.manager"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.storage.manager"] = true;
dojo.provide("dojox.storage.manager");
//
// FIXME: refactor this to use an AdapterRegistry

dojox.storage.manager = new function(){
	// summary: A singleton class in charge of the dojox.storage system
	// description:
	//		Initializes the storage systems and figures out the best available 
	//		storage options on this platform.	
	
	// currentProvider: Object
	//	The storage provider that was automagically chosen to do storage
	//	on this platform, such as dojox.storage.FlashStorageProvider.
	this.currentProvider = null;
	
	// available: Boolean
	//	Whether storage of some kind is available.
	this.available = false;

  // providers: Array
  //  Array of all the static provider instances, useful if you want to
  //  loop through and see what providers have been registered.
  this.providers = [];
	
	this._initialized = false;

	this._onLoadListeners = [];
	
	this.initialize = function(){
		// summary: 
		//		Initializes the storage system and autodetects the best storage
		//		provider we can provide on this platform
		this.autodetect();
	};
	
	this.register = function(/*string*/ name, /*Object*/ instance){
		// summary:
		//		Registers the existence of a new storage provider; used by
		//		subclasses to inform the manager of their existence. The
		//		storage manager will select storage providers based on 
		//		their ordering, so the order in which you call this method
		//		matters. 
		// name:
		//		The full class name of this provider, such as
		//		"dojox.storage.FlashStorageProvider".
		// instance:
		//		An instance of this provider, which we will use to call
		//		isAvailable() on. 
		
		// keep list of providers as a list so that we can know what order
		// storage providers are preferred; also, store the providers hashed
		// by name in case someone wants to get a provider that uses
		// a particular storage backend
		this.providers.push(instance);
		this.providers[name] = instance;
	};
	
	this.setProvider = function(storageClass){
		// summary:
		//		Instructs the storageManager to use the given storage class for
		//		all storage requests.
		// description:
		//		Example-
		//			dojox.storage.setProvider(
		//				dojox.storage.IEStorageProvider)
	
	};
	
	this.autodetect = function(){
		// summary:
		//		Autodetects the best possible persistent storage provider
		//		available on this platform. 
		
		//console.debug("dojox.storage.manager.autodetect");
		
		if(this._initialized){ // already finished
			return;
		}

		// a flag to force the storage manager to use a particular 
		// storage provider type, such as 
		// djConfig = {forceStorageProvider: "dojox.storage.WhatWGStorageProvider"};
		var forceProvider = dojo.config["forceStorageProvider"] || false;

		// go through each provider, seeing if it can be used
		var providerToUse;
		//FIXME: use dojo.some
		for(var i = 0; i < this.providers.length; i++){
			providerToUse = this.providers[i];
			if(forceProvider && forceProvider == providerToUse.declaredClass){
				// still call isAvailable for this provider, since this helps some
				// providers internally figure out if they are available
				// FIXME: This should be refactored since it is non-intuitive
				// that isAvailable() would initialize some state
				providerToUse.isAvailable();
				break;
			}else if(!forceProvider && providerToUse.isAvailable()){
				break;
			}
		}
		
		if(!providerToUse){ // no provider available
			this._initialized = true;
			this.available = false;
			this.currentProvider = null;
			console.warn("No storage provider found for this platform");
			this.loaded();
			return;
		}
			
		// create this provider and mix in it's properties
		// so that developers can do dojox.storage.put rather
		// than dojox.storage.currentProvider.put, for example
		this.currentProvider = providerToUse;
		dojo.mixin(dojox.storage, this.currentProvider);
		
		// have the provider initialize itself
		dojox.storage.initialize();
		
		this._initialized = true;
		this.available = true;
	};
	
	this.isAvailable = function(){ /*Boolean*/
		// summary: Returns whether any storage options are available.
		return this.available;
	};
	
	this.addOnLoad = function(func){ /* void */
		// summary:
		//		Adds an onload listener to know when Dojo Offline can be used.
		// description:
		//		Adds a listener to know when Dojo Offline can be used. This
		//		ensures that the Dojo Offline framework is loaded and that the
		//		local dojox.storage system is ready to be used. This method is
		//		useful if you don't want to have a dependency on Dojo Events
		//		when using dojox.storage.
		// func: Function
		//		A function to call when Dojo Offline is ready to go
		this._onLoadListeners.push(func);
		
		if(this.isInitialized()){
			this._fireLoaded();
		}
	};
	
	this.removeOnLoad = function(func){ /* void */
		// summary: Removes the given onLoad listener
		for(var i = 0; i < this._onLoadListeners.length; i++){
			if(func == this._onLoadListeners[i]){
				this._onLoadListeners = this._onLoadListeners.splice(i, 1);
				break;
			}
		}
	};
	
	this.isInitialized = function(){ /*Boolean*/
	 	// summary:
		//		Returns whether the storage system is initialized and ready to
		//		be used. 

		// FIXME: This should REALLY not be in here, but it fixes a tricky
		// Flash timing bug.
		// Confirm that this is still needed with the newly refactored Dojo
		// Flash. Used to be for Internet Explorer. -- Brad Neuberg
		if(this.currentProvider != null
			&& this.currentProvider.declaredClass == "dojox.storage.FlashStorageProvider" 
			&& dojox.flash.ready == false){
			return false;
		}else{
			return this._initialized;
		}
	};

	this.supportsProvider = function(/*string*/ storageClass){ /* Boolean */
		// summary: Determines if this platform supports the given storage provider.
		// description:
		//		Example-
		//			dojox.storage.manager.supportsProvider(
		//				"dojox.storage.InternetExplorerStorageProvider");

		// construct this class dynamically
		try{
			// dynamically call the given providers class level isAvailable()
			// method
			var provider = eval("new " + storageClass + "()");
			var results = provider.isAvailable();
			if(!results){ return false; }
			return results;
		}catch(e){
			return false;
		}
	};

	this.getProvider = function(){ /* Object */
		// summary: Gets the current provider
		return this.currentProvider;
	};
	
	this.loaded = function(){
		// summary:
		//		The storage provider should call this method when it is loaded
		//		and ready to be used. Clients who will use the provider will
		//		connect to this method to know when they can use the storage
		//		system. You can either use dojo.connect to connect to this
		//		function, or can use dojox.storage.manager.addOnLoad() to add
		//		a listener that does not depend on the dojo.event package.
		// description:
		//		Example 1-
		//			if(dojox.storage.manager.isInitialized() == false){ 
		//				dojo.connect(dojox.storage.manager, "loaded", TestStorage, "initialize");
		//			}else{
		//				dojo.connect(dojo, "loaded", TestStorage, "initialize");
		//			}
		//		Example 2-
		//			dojox.storage.manager.addOnLoad(someFunction);


		// FIXME: we should just provide a Deferred for this. That way you
		// don't care when this happens or has happened. Deferreds are in Base
		this._fireLoaded();
	};
	
	this._fireLoaded = function(){
		//console.debug("dojox.storage.manager._fireLoaded");
		
		dojo.forEach(this._onLoadListeners, function(i){ 
			try{ 
				i(); 
			}catch(e){ console.debug(e); } 
		});
	};
	
	this.getResourceList = function(){
		// summary:
		//		Returns a list of whatever resources are necessary for storage
		//		providers to work. 
		// description:
		//		This will return all files needed by all storage providers for
		//		this particular environment type. For example, if we are in the
		//		browser environment, then this will return the hidden SWF files
		//		needed by the FlashStorageProvider, even if we don't need them
		//		for the particular browser we are working within. This is meant
		//		to faciliate Dojo Offline, which must retrieve all resources we
		//		need offline into the offline cache -- we retrieve everything
		//		needed, in case another browser that requires different storage
		//		mechanisms hits the local offline cache. For example, if we
		//		were to sync against Dojo Offline on Firefox 2, then we would
		//		not grab the FlashStorageProvider resources needed for Safari.
		var results = [];
		dojo.forEach(dojox.storage.manager.providers, function(currentProvider){
			results = results.concat(currentProvider.getResourceList());
		});
		
		return results;
	}
};

}

if(!dojo._hasResource["dojo.gears"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.gears"] = true;
dojo.provide("dojo.gears");

dojo.gears._gearsObject = function(){
	// summary: 
	//		factory method to get a Google Gears plugin instance to
	//		expose in the browser runtime environment, if present
	var factory;
	var results;
	
	var gearsObj = dojo.getObject("google.gears");
	if(gearsObj){ return gearsObj; } // already defined elsewhere
	
	if(typeof GearsFactory != "undefined"){ // Firefox
		factory = new GearsFactory();
	}else{
		if(dojo.isIE){
			// IE
			try{
				factory = new ActiveXObject("Gears.Factory");
			}catch(e){
				// ok to squelch; there's no gears factory.  move on.
			}
		}else if(navigator.mimeTypes["application/x-googlegears"]){
			// Safari?
			factory = document.createElement("object");
			factory.setAttribute("type", "application/x-googlegears");
			factory.setAttribute("width", 0);
			factory.setAttribute("height", 0);
			factory.style.display = "none";
			document.documentElement.appendChild(factory);
		}
	}

	// still nothing?
	if(!factory){ return null; }
	
	// define the global objects now; don't overwrite them though if they
	// were somehow set internally by the Gears plugin, which is on their
	// dev roadmap for the future
	dojo.setObject("google.gears.factory", factory);
	return dojo.getObject("google.gears");
};

/*=====
dojo.gears.available = {
	// summary: True if client is using Google Gears
};
=====*/
// see if we have Google Gears installed, and if
// so, make it available in the runtime environment
// and in the Google standard 'google.gears' global object
dojo.gears.available = (!!dojo.gears._gearsObject())||0;

}

if(!dojo._hasResource["dojox.sql._crypto"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.sql._crypto"] = true;
dojo.provide("dojox.sql._crypto");
dojo.mixin(dojox.sql._crypto, {
	// summary: dojox.sql cryptography code
	// description: 
	//	Taken from http://www.movable-type.co.uk/scripts/aes.html by
	// 	Chris Veness (CLA signed); adapted for Dojo and Google Gears Worker Pool
	// 	by Brad Neuberg, bkn3@columbia.edu
	//
	// _POOL_SIZE:
	//	Size of worker pool to create to help with crypto
	_POOL_SIZE: 100,

	encrypt: function(plaintext, password, callback){
		// summary:
		//	Use Corrected Block TEA to encrypt plaintext using password
		//	(note plaintext & password must be strings not string objects).
		//	Results will be returned to the 'callback' asychronously.	
		this._initWorkerPool();

		var msg ={plaintext: plaintext, password: password};
		msg = dojo.toJson(msg);
		msg = "encr:" + String(msg);

		this._assignWork(msg, callback);
	},

	decrypt: function(ciphertext, password, callback){
		// summary:
		//	Use Corrected Block TEA to decrypt ciphertext using password
		//	(note ciphertext & password must be strings not string objects).
		//	Results will be returned to the 'callback' asychronously.
		this._initWorkerPool();

		var msg = {ciphertext: ciphertext, password: password};
		msg = dojo.toJson(msg);
		msg = "decr:" + String(msg);

		this._assignWork(msg, callback);
	},

	_initWorkerPool: function(){
		// bugs in Google Gears prevents us from dynamically creating
		// and destroying workers as we need them -- the worker
		// pool functionality stops working after a number of crypto
		// cycles (probably related to a memory leak in Google Gears).
		// this is too bad, since it results in much simpler code.

		// instead, we have to create a pool of workers and reuse them. we
		// keep a stack of 'unemployed' Worker IDs that are currently not working.
		// if a work request comes in, we pop off the 'unemployed' stack
		// and put them to work, storing them in an 'employed' hashtable,
		// keyed by their Worker ID with the value being the callback function
		// that wants the result. when an employed worker is done, we get
		// a message in our 'manager' which adds this worker back to the 
		// unemployed stack and routes the result to the callback that
		// wanted it. if all the workers were employed in the past but
		// more work needed to be done (i.e. it's a tight labor pool ;) 
		// then the work messages are pushed onto
		// a 'handleMessage' queue as an object tuple{msg: msg, callback: callback}

		if(!this._manager){
			try{
				this._manager = google.gears.factory.create("beta.workerpool", "1.0");
				this._unemployed = [];
				this._employed ={};
				this._handleMessage = [];
		
				var self = this;
				this._manager.onmessage = function(msg, sender){
					// get the callback necessary to serve this result
					var callback = self._employed["_" + sender];
			
					// make this worker unemployed
					self._employed["_" + sender] = undefined;
					self._unemployed.push("_" + sender);
			
					// see if we need to assign new work
					// that was queued up needing to be done
					if(self._handleMessage.length){
						var handleMe = self._handleMessage.shift();
						self._assignWork(handleMe.msg, handleMe.callback);
					}
			
					// return results
					callback(msg);
				}
			
				var workerInit = "function _workerInit(){"
									+ "gearsWorkerPool.onmessage = "
										+ String(this._workerHandler)
									+ ";"
								+ "}";
		
				var code = workerInit + " _workerInit();";

				// create our worker pool
				for(var i = 0; i < this._POOL_SIZE; i++){
					this._unemployed.push("_" + this._manager.createWorker(code));
				}
			}catch(exp){
				throw exp.message||exp;
			}
		}
	},

	_assignWork: function(msg, callback){
		// can we immediately assign this work?
		if(!this._handleMessage.length && this._unemployed.length){
			// get an unemployed worker
			var workerID = this._unemployed.shift().substring(1); // remove _
	
			// list this worker as employed
			this._employed["_" + workerID] = callback;
	
			// do the worke
			this._manager.sendMessage(msg, parseInt(workerID,10));
		}else{
			// we have to queue it up
			this._handleMessage ={msg: msg, callback: callback};
		}
	},

	_workerHandler: function(msg, sender){
	
		/* Begin AES Implementation */
	
		/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
	
		// Sbox is pre-computed multiplicative inverse in GF(2^8) used in SubBytes and KeyExpansion [§5.1.1]
		var Sbox =	[0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
					 0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
					 0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
					 0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
					 0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
					 0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
					 0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
					 0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
					 0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
					 0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
					 0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
					 0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
					 0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
					 0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
					 0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
					 0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16];

		// Rcon is Round Constant used for the Key Expansion [1st col is 2^(r-1) in GF(2^8)] [§5.2]
		var Rcon = [ [0x00, 0x00, 0x00, 0x00],
					 [0x01, 0x00, 0x00, 0x00],
					 [0x02, 0x00, 0x00, 0x00],
					 [0x04, 0x00, 0x00, 0x00],
					 [0x08, 0x00, 0x00, 0x00],
					 [0x10, 0x00, 0x00, 0x00],
					 [0x20, 0x00, 0x00, 0x00],
					 [0x40, 0x00, 0x00, 0x00],
					 [0x80, 0x00, 0x00, 0x00],
					 [0x1b, 0x00, 0x00, 0x00],
					 [0x36, 0x00, 0x00, 0x00] ]; 

		/*
		 * AES Cipher function: encrypt 'input' with Rijndael algorithm
		 *
		 *	 takes	 byte-array 'input' (16 bytes)
		 *			 2D byte-array key schedule 'w' (Nr+1 x Nb bytes)
		 *
		 *	 applies Nr rounds (10/12/14) using key schedule w for 'add round key' stage
		 *
		 *	 returns byte-array encrypted value (16 bytes)
		 */
		function Cipher(input, w) {	   // main Cipher function [§5.1]
		  var Nb = 4;				// block size (in words): no of columns in state (fixed at 4 for AES)
		  var Nr = w.length/Nb - 1; // no of rounds: 10/12/14 for 128/192/256-bit keys

		  var state = [[],[],[],[]];  // initialise 4xNb byte-array 'state' with input [§3.4]
		  for (var i=0; i<4*Nb; i++) state[i%4][Math.floor(i/4)] = input[i];

		  state = AddRoundKey(state, w, 0, Nb);

		  for (var round=1; round<Nr; round++) {
			state = SubBytes(state, Nb);
			state = ShiftRows(state, Nb);
			state = MixColumns(state, Nb);
			state = AddRoundKey(state, w, round, Nb);
		  }

		  state = SubBytes(state, Nb);
		  state = ShiftRows(state, Nb);
		  state = AddRoundKey(state, w, Nr, Nb);

		  var output = new Array(4*Nb);	 // convert state to 1-d array before returning [§3.4]
		  for (var i=0; i<4*Nb; i++) output[i] = state[i%4][Math.floor(i/4)];
		  return output;
		}


		function SubBytes(s, Nb) {	  // apply SBox to state S [§5.1.1]
		  for (var r=0; r<4; r++) {
			for (var c=0; c<Nb; c++) s[r][c] = Sbox[s[r][c]];
		  }
		  return s;
		}


		function ShiftRows(s, Nb) {	   // shift row r of state S left by r bytes [§5.1.2]
		  var t = new Array(4);
		  for (var r=1; r<4; r++) {
			for (var c=0; c<4; c++) t[c] = s[r][(c+r)%Nb];	// shift into temp copy
			for (var c=0; c<4; c++) s[r][c] = t[c];			// and copy back
		  }			 // note that this will work for Nb=4,5,6, but not 7,8 (always 4 for AES):
		  return s;	 // see fp.gladman.plus.com/cryptography_technology/rijndael/aes.spec.311.pdf 
		}


		function MixColumns(s, Nb) {   // combine bytes of each col of state S [§5.1.3]
		  for (var c=0; c<4; c++) {
			var a = new Array(4);  // 'a' is a copy of the current column from 's'
			var b = new Array(4);  // 'b' is a•{02} in GF(2^8)
			for (var i=0; i<4; i++) {
			  a[i] = s[i][c];
			  b[i] = s[i][c]&0x80 ? s[i][c]<<1 ^ 0x011b : s[i][c]<<1;
			}
			// a[n] ^ b[n] is a•{03} in GF(2^8)
			s[0][c] = b[0] ^ a[1] ^ b[1] ^ a[2] ^ a[3]; // 2*a0 + 3*a1 + a2 + a3
			s[1][c] = a[0] ^ b[1] ^ a[2] ^ b[2] ^ a[3]; // a0 * 2*a1 + 3*a2 + a3
			s[2][c] = a[0] ^ a[1] ^ b[2] ^ a[3] ^ b[3]; // a0 + a1 + 2*a2 + 3*a3
			s[3][c] = a[0] ^ b[0] ^ a[1] ^ a[2] ^ b[3]; // 3*a0 + a1 + a2 + 2*a3
		  }
		  return s;
		}


		function AddRoundKey(state, w, rnd, Nb) {  // xor Round Key into state S [§5.1.4]
		  for (var r=0; r<4; r++) {
			for (var c=0; c<Nb; c++) state[r][c] ^= w[rnd*4+c][r];
		  }
		  return state;
		}


		function KeyExpansion(key) {  // generate Key Schedule (byte-array Nr+1 x Nb) from Key [§5.2]
		  var Nb = 4;			 // block size (in words): no of columns in state (fixed at 4 for AES)
		  var Nk = key.length/4	 // key length (in words): 4/6/8 for 128/192/256-bit keys
		  var Nr = Nk + 6;		 // no of rounds: 10/12/14 for 128/192/256-bit keys

		  var w = new Array(Nb*(Nr+1));
		  var temp = new Array(4);

		  for (var i=0; i<Nk; i++) {
			var r = [key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]];
			w[i] = r;
		  }

		  for (var i=Nk; i<(Nb*(Nr+1)); i++) {
			w[i] = new Array(4);
			for (var t=0; t<4; t++) temp[t] = w[i-1][t];
			if (i % Nk == 0) {
			  temp = SubWord(RotWord(temp));
			  for (var t=0; t<4; t++) temp[t] ^= Rcon[i/Nk][t];
			} else if (Nk > 6 && i%Nk == 4) {
			  temp = SubWord(temp);
			}
			for (var t=0; t<4; t++) w[i][t] = w[i-Nk][t] ^ temp[t];
		  }

		  return w;
		}

		function SubWord(w) {	 // apply SBox to 4-byte word w
		  for (var i=0; i<4; i++) w[i] = Sbox[w[i]];
		  return w;
		}

		function RotWord(w) {	 // rotate 4-byte word w left by one byte
		  w[4] = w[0];
		  for (var i=0; i<4; i++) w[i] = w[i+1];
		  return w;
		}

		/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

		/* 
		 * Use AES to encrypt 'plaintext' with 'password' using 'nBits' key, in 'Counter' mode of operation
		 *							 - see http://csrc.nist.gov/publications/nistpubs/800-38a/sp800-38a.pdf
		 *	 for each block
		 *	 - outputblock = cipher(counter, key)
		 *	 - cipherblock = plaintext xor outputblock
		 */
		function AESEncryptCtr(plaintext, password, nBits) {
		  if (!(nBits==128 || nBits==192 || nBits==256)) return '';	 // standard allows 128/192/256 bit keys

		  // for this example script, generate the key by applying Cipher to 1st 16/24/32 chars of password; 
		  // for real-world applications, a more secure approach would be to hash the password e.g. with SHA-1
		  var nBytes = nBits/8;	 // no bytes in key
		  var pwBytes = new Array(nBytes);
		  for (var i=0; i<nBytes; i++) pwBytes[i] = password.charCodeAt(i) & 0xff;

		  var key = Cipher(pwBytes, KeyExpansion(pwBytes));

		  key = key.concat(key.slice(0, nBytes-16));  // key is now 16/24/32 bytes long

		  // initialise counter block (NIST SP800-38A §B.2): millisecond time-stamp for nonce in 1st 8 bytes,
		  // block counter in 2nd 8 bytes
		  var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
		  var counterBlock = new Array(blockSize);	// block size fixed at 16 bytes / 128 bits (Nb=4) for AES
		  var nonce = (new Date()).getTime();  // milliseconds since 1-Jan-1970

		  // encode nonce in two stages to cater for JavaScript 32-bit limit on bitwise ops
		  for (var i=0; i<4; i++) counterBlock[i] = (nonce >>> i*8) & 0xff;
		  for (var i=0; i<4; i++) counterBlock[i+4] = (nonce/0x100000000 >>> i*8) & 0xff; 

		  // generate key schedule - an expansion of the key into distinct Key Rounds for each round
		  var keySchedule = KeyExpansion(key);

		  var blockCount = Math.ceil(plaintext.length/blockSize);
		  var ciphertext = new Array(blockCount);  // ciphertext as array of strings
 
		  for (var b=0; b<blockCount; b++) {
			// set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
			// again done in two stages for 32-bit ops
			for (var c=0; c<4; c++) counterBlock[15-c] = (b >>> c*8) & 0xff;
			for (var c=0; c<4; c++) counterBlock[15-c-4] = (b/0x100000000 >>> c*8)

			var cipherCntr = Cipher(counterBlock, keySchedule);	 // -- encrypt counter block --

			// calculate length of final block:
			var blockLength = b<blockCount-1 ? blockSize : (plaintext.length-1)%blockSize+1;

			var ct = '';
			for (var i=0; i<blockLength; i++) {	 // -- xor plaintext with ciphered counter byte-by-byte --
			  var plaintextByte = plaintext.charCodeAt(b*blockSize+i);
			  var cipherByte = plaintextByte ^ cipherCntr[i];
			  ct += String.fromCharCode(cipherByte);
			}
			// ct is now ciphertext for this block

			ciphertext[b] = escCtrlChars(ct);  // escape troublesome characters in ciphertext
		  }

		  // convert the nonce to a string to go on the front of the ciphertext
		  var ctrTxt = '';
		  for (var i=0; i<8; i++) ctrTxt += String.fromCharCode(counterBlock[i]);
		  ctrTxt = escCtrlChars(ctrTxt);

		  // use '-' to separate blocks, use Array.join to concatenate arrays of strings for efficiency
		  return ctrTxt + '-' + ciphertext.join('-');
		}


		/* 
		 * Use AES to decrypt 'ciphertext' with 'password' using 'nBits' key, in Counter mode of operation
		 *
		 *	 for each block
		 *	 - outputblock = cipher(counter, key)
		 *	 - cipherblock = plaintext xor outputblock
		 */
		function AESDecryptCtr(ciphertext, password, nBits) {
		  if (!(nBits==128 || nBits==192 || nBits==256)) return '';	 // standard allows 128/192/256 bit keys

		  var nBytes = nBits/8;	 // no bytes in key
		  var pwBytes = new Array(nBytes);
		  for (var i=0; i<nBytes; i++) pwBytes[i] = password.charCodeAt(i) & 0xff;
		  var pwKeySchedule = KeyExpansion(pwBytes);
		  var key = Cipher(pwBytes, pwKeySchedule);
		  key = key.concat(key.slice(0, nBytes-16));  // key is now 16/24/32 bytes long

		  var keySchedule = KeyExpansion(key);

		  ciphertext = ciphertext.split('-');  // split ciphertext into array of block-length strings 

		  // recover nonce from 1st element of ciphertext
		  var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
		  var counterBlock = new Array(blockSize);
		  var ctrTxt = unescCtrlChars(ciphertext[0]);
		  for (var i=0; i<8; i++) counterBlock[i] = ctrTxt.charCodeAt(i);

		  var plaintext = new Array(ciphertext.length-1);

		  for (var b=1; b<ciphertext.length; b++) {
			// set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
			for (var c=0; c<4; c++) counterBlock[15-c] = ((b-1) >>> c*8) & 0xff;
			for (var c=0; c<4; c++) counterBlock[15-c-4] = ((b/0x100000000-1) >>> c*8) & 0xff;

			var cipherCntr = Cipher(counterBlock, keySchedule);	 // encrypt counter block

			ciphertext[b] = unescCtrlChars(ciphertext[b]);

			var pt = '';
			for (var i=0; i<ciphertext[b].length; i++) {
			  // -- xor plaintext with ciphered counter byte-by-byte --
			  var ciphertextByte = ciphertext[b].charCodeAt(i);
			  var plaintextByte = ciphertextByte ^ cipherCntr[i];
			  pt += String.fromCharCode(plaintextByte);
			}
			// pt is now plaintext for this block

			plaintext[b-1] = pt;  // b-1 'cos no initial nonce block in plaintext
		  }

		  return plaintext.join('');
		}

		/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

		function escCtrlChars(str) {  // escape control chars which might cause problems handling ciphertext
		  return str.replace(/[\0\t\n\v\f\r\xa0!-]/g, function(c) { return '!' + c.charCodeAt(0) + '!'; });
		}  // \xa0 to cater for bug in Firefox; include '-' to leave it free for use as a block marker

		function unescCtrlChars(str) {	// unescape potentially problematic control characters
		  return str.replace(/!\d\d?\d?!/g, function(c) { return String.fromCharCode(c.slice(1,-1)); });
		}

		/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
	
		function encrypt(plaintext, password){
			return AESEncryptCtr(plaintext, password, 256);
		}

		function decrypt(ciphertext, password){	
			return AESDecryptCtr(ciphertext, password, 256);
		}
	
		/* End AES Implementation */
	
		var cmd = msg.substr(0,4);
		var arg = msg.substr(5);
		if(cmd == "encr"){
			arg = eval("(" + arg + ")");
			var plaintext = arg.plaintext;
			var password = arg.password;
			var results = encrypt(plaintext, password);
			gearsWorkerPool.sendMessage(String(results), sender);
		}else if(cmd == "decr"){
			arg = eval("(" + arg + ")");
			var ciphertext = arg.ciphertext;
			var password = arg.password;
			var results = decrypt(ciphertext, password);
			gearsWorkerPool.sendMessage(String(results), sender);
		}
	}
});

}

if(!dojo._hasResource["dojox.sql._base"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.sql._base"] = true;
dojo.provide("dojox.sql._base");


dojo.mixin(dojox.sql, {
	// summary:
	//	Executes a SQL expression.
	// description:
	// 	There are four ways to call this:
	// 	1) Straight SQL: dojox.sql("SELECT * FROM FOOBAR");
	// 	2) SQL with parameters: dojox.sql("INSERT INTO FOOBAR VALUES (?)", someParam)
	// 	3) Encrypting particular values: 
	//			dojox.sql("INSERT INTO FOOBAR VALUES (ENCRYPT(?))", someParam, "somePassword", callback)
	// 	4) Decrypting particular values:
	//			dojox.sql("SELECT DECRYPT(SOMECOL1), DECRYPT(SOMECOL2) FROM
	//					FOOBAR WHERE SOMECOL3 = ?", someParam,
	//					"somePassword", callback)
	//
	// 	For encryption and decryption the last two values should be the the password for
	// 	encryption/decryption, and the callback function that gets the result set.
	//
	// 	Note: We only support ENCRYPT(?) statements, and
	// 	and DECRYPT(*) statements for now -- you can not have a literal string
	// 	inside of these, such as ENCRYPT('foobar')
	//
	// 	Note: If you have multiple columns to encrypt and decrypt, you can use the following
	// 	convenience form to not have to type ENCRYPT(?)/DECRYPT(*) many times:
	//
	// 	dojox.sql("INSERT INTO FOOBAR VALUES (ENCRYPT(?, ?, ?))", 
	//					someParam1, someParam2, someParam3, 
	//					"somePassword", callback)
	//
	// 	dojox.sql("SELECT DECRYPT(SOMECOL1, SOMECOL2) FROM
	//					FOOBAR WHERE SOMECOL3 = ?", someParam,
	//					"somePassword", callback)

	dbName: null,
	
	// summary:
	//	If true, then we print out any SQL that is executed
	//	to the debug window
	debug: (dojo.exists("dojox.sql.debug") ? dojox.sql.debug:false),

	open: function(dbName){
		if(this._dbOpen && (!dbName || dbName == this.dbName)){
			return;
		}
		
		if(!this.dbName){
			this.dbName = "dot_store_" 
				+ window.location.href.replace(/[^0-9A-Za-z_]/g, "_");
			// database names in Gears are limited to 64 characters long
			if(this.dbName.length > 63){
			  this.dbName = this.dbName.substring(0, 63);
			}
		}
		
		if(!dbName){
			dbName = this.dbName;
		}
		
		try{
			this._initDb();
			this.db.open(dbName);
			this._dbOpen = true;
		}catch(exp){
			throw exp.message||exp;
		}
	},

	close: function(dbName){
		// on Internet Explorer, Google Gears throws an exception
		// "Object not a collection", when we try to close the
		// database -- just don't close it on this platform
		// since we are running into a Gears bug; the Gears team
		// said it's ok to not close a database connection
		if(dojo.isIE){ return; }
		
		if(!this._dbOpen && (!dbName || dbName == this.dbName)){
			return;
		}
		
		if(!dbName){
			dbName = this.dbName;
		}
		
		try{
			this.db.close(dbName);
			this._dbOpen = false;
		}catch(exp){
			throw exp.message||exp;
		}
	},
	
	_exec: function(params){
		try{	
			// get the Gears Database object
			this._initDb();
		
			// see if we need to open the db; if programmer
			// manually called dojox.sql.open() let them handle
			// it; otherwise we open and close automatically on
			// each SQL execution
			if(!this._dbOpen){
				this.open();
				this._autoClose = true;
			}
		
			// determine our parameters
			var sql = null;
			var callback = null;
			var password = null;

			var args = dojo._toArray(params);

			sql = args.splice(0, 1)[0];

			// does this SQL statement use the ENCRYPT or DECRYPT
			// keywords? if so, extract our callback and crypto
			// password
			if(this._needsEncrypt(sql) || this._needsDecrypt(sql)){
				callback = args.splice(args.length - 1, 1)[0];
				password = args.splice(args.length - 1, 1)[0];
			}

			// 'args' now just has the SQL parameters

			// print out debug SQL output if the developer wants that
			if(this.debug){
				this._printDebugSQL(sql, args);
			}

			// handle SQL that needs encryption/decryption differently
			// do we have an ENCRYPT SQL statement? if so, handle that first
			var crypto;
			if(this._needsEncrypt(sql)){
				crypto = new dojox.sql._SQLCrypto("encrypt", sql, 
													password, args, 
													callback);
				return null; // encrypted results will arrive asynchronously
			}else if(this._needsDecrypt(sql)){ // otherwise we have a DECRYPT statement
				crypto = new dojox.sql._SQLCrypto("decrypt", sql, 
													password, args, 
													callback);
				return null; // decrypted results will arrive asynchronously
			}

			// execute the SQL and get the results
			var rs = this.db.execute(sql, args);
			
			// Gears ResultSet object's are ugly -- normalize
			// these into something JavaScript programmers know
			// how to work with, basically an array of 
			// JavaScript objects where each property name is
			// simply the field name for a column of data
			rs = this._normalizeResults(rs);
		
			if(this._autoClose){
				this.close();
			}
		
			return rs;
		}catch(exp){
			exp = exp.message||exp;
			
			console.debug("SQL Exception: " + exp);
			
			if(this._autoClose){
				try{ 
					this.close(); 
				}catch(e){
					console.debug("Error closing database: " 
									+ e.message||e);
				}
			}
		
			throw exp;
		}
		
		return null;
	},

	_initDb: function(){
		if(!this.db){
			try{
				this.db = google.gears.factory.create('beta.database', '1.0');
			}catch(exp){
				dojo.setObject("google.gears.denied", true);
				if(dojox.off){
				  dojox.off.onFrameworkEvent("coreOperationFailed");
				}
				throw "Google Gears must be allowed to run";
			}
		}
	},

	_printDebugSQL: function(sql, args){
		var msg = "dojox.sql(\"" + sql + "\"";
		for(var i = 0; i < args.length; i++){
			if(typeof args[i] == "string"){
				msg += ", \"" + args[i] + "\"";
			}else{
				msg += ", " + args[i];
			}
		}
		msg += ")";
	
		console.debug(msg);
	},

	_normalizeResults: function(rs){
		var results = [];
		if(!rs){ return []; }
	
		while(rs.isValidRow()){
			var row = {};
		
			for(var i = 0; i < rs.fieldCount(); i++){
				var fieldName = rs.fieldName(i);
				var fieldValue = rs.field(i);
				row[fieldName] = fieldValue;
			}
		
			results.push(row);
		
			rs.next();
		}
	
		rs.close();
		
		return results;
	},

	_needsEncrypt: function(sql){
		return /encrypt\([^\)]*\)/i.test(sql);
	},

	_needsDecrypt: function(sql){
		return /decrypt\([^\)]*\)/i.test(sql);
	}
});

dojo.declare("dojox.sql._SQLCrypto", null, {
	// summary:
	//	A private class encapsulating any cryptography that must be done
	// 	on a SQL statement. We instantiate this class and have it hold
	//	it's state so that we can potentially have several encryption
	//	operations happening at the same time by different SQL statements.	
	constructor: function(action, sql, password, args, callback){
		if(action == "encrypt"){
			this._execEncryptSQL(sql, password, args, callback);
		}else{
			this._execDecryptSQL(sql, password, args, callback);
		}		
	}, 
	
	_execEncryptSQL: function(sql, password, args, callback){
		// strip the ENCRYPT/DECRYPT keywords from the SQL
		var strippedSQL = this._stripCryptoSQL(sql);
	
		// determine what arguments need encryption
		var encryptColumns = this._flagEncryptedArgs(sql, args);
	
		// asynchronously encrypt each argument that needs it
		var self = this;
		this._encrypt(strippedSQL, password, args, encryptColumns, function(finalArgs){
			// execute the SQL
			var error = false;
			var resultSet = [];
			var exp = null;
			try{
				resultSet = dojox.sql.db.execute(strippedSQL, finalArgs);
			}catch(execError){
				error = true;
				exp = execError.message||execError;
			}
		
			// was there an error during SQL execution?
			if(exp != null){
				if(dojox.sql._autoClose){
					try{ dojox.sql.close(); }catch(e){}
				}
			
				callback(null, true, exp.toString());
				return;
			}
		
			// normalize SQL results into a JavaScript object 
			// we can work with
			resultSet = dojox.sql._normalizeResults(resultSet);
		
			if(dojox.sql._autoClose){
				dojox.sql.close();
			}
				
			// are any decryptions necessary on the result set?
			if(dojox.sql._needsDecrypt(sql)){
				// determine which of the result set columns needs decryption
	 			var needsDecrypt = self._determineDecryptedColumns(sql);

				// now decrypt columns asynchronously
				// decrypt columns that need it
				self._decrypt(resultSet, needsDecrypt, password, function(finalResultSet){
					callback(finalResultSet, false, null);
				});
			}else{
				callback(resultSet, false, null);
			}
		});
	},

	_execDecryptSQL: function(sql, password, args, callback){
		// strip the ENCRYPT/DECRYPT keywords from the SQL
		var strippedSQL = this._stripCryptoSQL(sql);
	
		// determine which columns needs decryption; this either
		// returns the value *, which means all result set columns will
		// be decrypted, or it will return the column names that need
		// decryption set on a hashtable so we can quickly test a given
		// column name; the key is the column name that needs
		// decryption and the value is 'true' (i.e. needsDecrypt["someColumn"] 
		// would return 'true' if it needs decryption, and would be 'undefined'
		// or false otherwise)
		var needsDecrypt = this._determineDecryptedColumns(sql);
	
		// execute the SQL
		var error = false;
		var resultSet = [];
		var exp = null;
		try{
			resultSet = dojox.sql.db.execute(strippedSQL, args);
		}catch(execError){
			error = true;
			exp = execError.message||execError;
		}
	
		// was there an error during SQL execution?
		if(exp != null){
			if(dojox.sql._autoClose){
				try{ dojox.sql.close(); }catch(e){}
			}
		
			callback(resultSet, true, exp.toString());
			return;
		}
	
		// normalize SQL results into a JavaScript object 
		// we can work with
		resultSet = dojox.sql._normalizeResults(resultSet);
	
		if(dojox.sql._autoClose){
			dojox.sql.close();
		}
	
		// decrypt columns that need it
		this._decrypt(resultSet, needsDecrypt, password, function(finalResultSet){
			callback(finalResultSet, false, null);
		});
	},

	_encrypt: function(sql, password, args, encryptColumns, callback){
		//console.debug("_encrypt, sql="+sql+", password="+password+", encryptColumns="+encryptColumns+", args="+args);
	
		this._totalCrypto = 0;
		this._finishedCrypto = 0;
		this._finishedSpawningCrypto = false;
		this._finalArgs = args;
	
		for(var i = 0; i < args.length; i++){
			if(encryptColumns[i]){
				// we have an encrypt() keyword -- get just the value inside
				// the encrypt() parantheses -- for now this must be a ?
				var sqlParam = args[i];
				var paramIndex = i;
			
				// update the total number of encryptions we know must be done asynchronously
				this._totalCrypto++;
			
				// FIXME: This currently uses DES as a proof-of-concept since the
				// DES code used is quite fast and was easy to work with. Modify dojox.sql
				// to be able to specify a different encryption provider through a 
				// a SQL-like syntax, such as dojox.sql("SET ENCRYPTION BLOWFISH"),
				// and modify the dojox.crypto.Blowfish code to be able to work using
				// a Google Gears Worker Pool
			
				// do the actual encryption now, asychronously on a Gears worker thread
				dojox.sql._crypto.encrypt(sqlParam, password, dojo.hitch(this, function(results){
					// set the new encrypted value
					this._finalArgs[paramIndex] = results;
					this._finishedCrypto++;
					// are we done with all encryption?
					if(this._finishedCrypto >= this._totalCrypto
						&& this._finishedSpawningCrypto){
						callback(this._finalArgs);
					}
				}));
			}
		}
	
		this._finishedSpawningCrypto = true;
	},

	_decrypt: function(resultSet, needsDecrypt, password, callback){
		//console.debug("decrypt, resultSet="+resultSet+", needsDecrypt="+needsDecrypt+", password="+password);
		
		this._totalCrypto = 0;
		this._finishedCrypto = 0;
		this._finishedSpawningCrypto = false;
		this._finalResultSet = resultSet;
	
		for(var i = 0; i < resultSet.length; i++){
			var row = resultSet[i];
		
			// go through each of the column names in row,
			// seeing if they need decryption
			for(var columnName in row){
				if(needsDecrypt == "*" || needsDecrypt[columnName]){
					this._totalCrypto++;
					var columnValue = row[columnName];
				
					// forming a closure here can cause issues, with values not cleanly
					// saved on Firefox/Mac OS X for some of the values above that
					// are needed in the callback below; call a subroutine that will form 
					// a closure inside of itself instead
					this._decryptSingleColumn(columnName, columnValue, password, i,
												function(finalResultSet){
						callback(finalResultSet);
					});
				}
			}
		}
	
		this._finishedSpawningCrypto = true;
	},

	_stripCryptoSQL: function(sql){
		// replace all DECRYPT(*) occurrences with a *
		sql = sql.replace(/DECRYPT\(\*\)/ig, "*");
	
		// match any ENCRYPT(?, ?, ?, etc) occurrences,
		// then replace with just the question marks in the
		// middle
		var matches = sql.match(/ENCRYPT\([^\)]*\)/ig);
		if(matches != null){
			for(var i = 0; i < matches.length; i++){
				var encryptStatement = matches[i];
				var encryptValue = encryptStatement.match(/ENCRYPT\(([^\)]*)\)/i)[1];
				sql = sql.replace(encryptStatement, encryptValue);
			}
		}
	
		// match any DECRYPT(COL1, COL2, etc) occurrences,
		// then replace with just the column names
		// in the middle
		matches = sql.match(/DECRYPT\([^\)]*\)/ig);
		if(matches != null){
			for(i = 0; i < matches.length; i++){
				var decryptStatement = matches[i];
				var decryptValue = decryptStatement.match(/DECRYPT\(([^\)]*)\)/i)[1];
				sql = sql.replace(decryptStatement, decryptValue);
			}
		}
	
		return sql;
	},

	_flagEncryptedArgs: function(sql, args){
		// capture literal strings that have question marks in them,
		// and also capture question marks that stand alone
		var tester = new RegExp(/([\"][^\"]*\?[^\"]*[\"])|([\'][^\']*\?[^\']*[\'])|(\?)/ig);
		var matches;
		var currentParam = 0;
		var results = [];
		while((matches = tester.exec(sql)) != null){
			var currentMatch = RegExp.lastMatch+"";

			// are we a literal string? then ignore it
			if(/^[\"\']/.test(currentMatch)){
				continue;
			}

			// do we have an encrypt keyword to our left?
			var needsEncrypt = false;
			if(/ENCRYPT\([^\)]*$/i.test(RegExp.leftContext)){
				needsEncrypt = true;
			}

			// set the encrypted flag
			results[currentParam] = needsEncrypt;

			currentParam++;
		}
	
		return results;
	},

	_determineDecryptedColumns: function(sql){
		var results = {};

		if(/DECRYPT\(\*\)/i.test(sql)){
			results = "*";
		}else{
			var tester = /DECRYPT\((?:\s*\w*\s*\,?)*\)/ig;
			var matches = tester.exec(sql);
			while(matches){
				var lastMatch = new String(RegExp.lastMatch);
				var columnNames = lastMatch.replace(/DECRYPT\(/i, "");
				columnNames = columnNames.replace(/\)/, "");
				columnNames = columnNames.split(/\s*,\s*/);
				dojo.forEach(columnNames, function(column){
					if(/\s*\w* AS (\w*)/i.test(column)){
						column = column.match(/\s*\w* AS (\w*)/i)[1];
					}
					results[column] = true;
				});
				
				matches = tester.exec(sql)
			}
		}

		return results;
	},

	_decryptSingleColumn: function(columnName, columnValue, password, currentRowIndex,
											callback){
		//console.debug("decryptSingleColumn, columnName="+columnName+", columnValue="+columnValue+", currentRowIndex="+currentRowIndex)
		dojox.sql._crypto.decrypt(columnValue, password, dojo.hitch(this, function(results){
			// set the new decrypted value
			this._finalResultSet[currentRowIndex][columnName] = results;
			this._finishedCrypto++;
			
			// are we done with all encryption?
			if(this._finishedCrypto >= this._totalCrypto
				&& this._finishedSpawningCrypto){
				//console.debug("done with all decrypts");
				callback(this._finalResultSet);
			}
		}));
	}
});

(function(){

	var orig_sql = dojox.sql;
	dojox.sql = new Function("return dojox.sql._exec(arguments);");
	dojo.mixin(dojox.sql, orig_sql);
	
})();

}

if(!dojo._hasResource["dojox.sql"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.sql"] = true;
dojo.provide("dojox.sql"); 


}

if(!dojo._hasResource["dojox.storage.GearsStorageProvider"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.storage.GearsStorageProvider"] = true;
dojo.provide("dojox.storage.GearsStorageProvider");





if(dojo.gears.available){
	
	(function(){
		// make sure we don't define the gears provider if we're not gears
		// enabled
		
		dojo.declare("dojox.storage.GearsStorageProvider", dojox.storage.Provider, {
			// summary:
			//		Storage provider that uses the features of Google Gears
			//		to store data (it is saved into the local SQL database
			//		provided by Gears, using dojox.sql)
			// description: 
			//		You can disable this storage provider with the following djConfig
			//		variable:
			//		var djConfig = { disableGearsStorage: true };
			//		
			//		Authors of this storage provider-	
			//			Brad Neuberg, bkn3@columbia.edu 
			constructor: function(){
			},
			// instance methods and properties
			TABLE_NAME: "__DOJO_STORAGE",
			initialized: false,
			
			_available: null,
			_storageReady: false,
			
			initialize: function(){
				//console.debug("dojox.storage.GearsStorageProvider.initialize");
				if(dojo.config["disableGearsStorage"] == true){
					return;
				}
				
				// partition our storage data so that multiple apps
				// on the same host won't collide
				this.TABLE_NAME = "__DOJO_STORAGE";
				
				// we delay creating our internal tables until an operation is
				// actually called, to avoid having a Gears permission dialog
				// on page load (bug #7538)
				
				// indicate that this storage provider is now loaded
				this.initialized = true;
				dojox.storage.manager.loaded();	
			},
			
			isAvailable: function(){
				// is Google Gears available and defined?
				return this._available = dojo.gears.available;
			},

			put: function(key, value, resultsHandler, namespace){
				this._initStorage();
				
				if(!this.isValidKey(key)){
					throw new Error("Invalid key given: " + key);
				}
				
				namespace = namespace||this.DEFAULT_NAMESPACE;
				if(!this.isValidKey(namespace)){
					throw new Error("Invalid namespace given: " + key);
				}
				
				// serialize the value;
				// handle strings differently so they have better performance
				if(dojo.isString(value)){
					value = "string:" + value;
				}else{
					value = dojo.toJson(value);
				}
				
				// try to store the value	
				try{
					dojox.sql("DELETE FROM " + this.TABLE_NAME
								+ " WHERE namespace = ? AND key = ?",
								namespace, key);
					dojox.sql("INSERT INTO " + this.TABLE_NAME
								+ " VALUES (?, ?, ?)",
								namespace, key, value);
				}catch(e){
					// indicate we failed
					console.debug("dojox.storage.GearsStorageProvider.put:", e);
					resultsHandler(this.FAILED, key, e.toString(), namespace);
					return;
				}
				
				if(resultsHandler){
					resultsHandler(dojox.storage.SUCCESS, key, null, namespace);
				}
			},

			get: function(key, namespace){
				this._initStorage();
				
				if(!this.isValidKey(key)){
					throw new Error("Invalid key given: " + key);
				}
				
				namespace = namespace||this.DEFAULT_NAMESPACE;
				if(!this.isValidKey(namespace)){
					throw new Error("Invalid namespace given: " + key);
				}
				
				// try to find this key in the database
				var results = dojox.sql("SELECT * FROM " + this.TABLE_NAME
											+ " WHERE namespace = ? AND "
											+ " key = ?",
											namespace, key);
				if(!results.length){
					return null;
				}else{
					results = results[0].value;
				}
				
				// destringify the content back into a 
				// real JavaScript object;
				// handle strings differently so they have better performance
				if(dojo.isString(results) && (/^string:/.test(results))){
					results = results.substring("string:".length);
				}else{
					results = dojo.fromJson(results);
				}
				
				return results;
			},
			
			getNamespaces: function(){
				this._initStorage();
				
				var results = [ dojox.storage.DEFAULT_NAMESPACE ];
				
				var rs = dojox.sql("SELECT namespace FROM " + this.TABLE_NAME
									+ " DESC GROUP BY namespace");
				for(var i = 0; i < rs.length; i++){
					if(rs[i].namespace != dojox.storage.DEFAULT_NAMESPACE){
						results.push(rs[i].namespace);
					}
				}
				
				return results;
			},

			getKeys: function(namespace){
				this._initStorage();
				
				namespace = namespace||this.DEFAULT_NAMESPACE;
				if(!this.isValidKey(namespace)){
					throw new Error("Invalid namespace given: " + namespace);
				}
				
				var rs = dojox.sql("SELECT key FROM " + this.TABLE_NAME
									+ " WHERE namespace = ?",
									namespace);
				
				var results = [];
				for(var i = 0; i < rs.length; i++){
					results.push(rs[i].key);
				}
				
				return results;
			},

			clear: function(namespace){
				this._initStorage();
				
				namespace = namespace||this.DEFAULT_NAMESPACE;
				if(!this.isValidKey(namespace)){
					throw new Error("Invalid namespace given: " + namespace);
				}
				
				dojox.sql("DELETE FROM " + this.TABLE_NAME 
							+ " WHERE namespace = ?",
							namespace);
			},
			
			remove: function(key, namespace){
				this._initStorage();
				
				if(!this.isValidKey(key)){
					throw new Error("Invalid key given: " + key);
				}
				
				namespace = namespace||this.DEFAULT_NAMESPACE;
				if(!this.isValidKey(namespace)){
					throw new Error("Invalid namespace given: " + key);
				}
				
				dojox.sql("DELETE FROM " + this.TABLE_NAME 
							+ " WHERE namespace = ? AND"
							+ " key = ?",
							namespace,
							key);
			},
			
			putMultiple: function(keys, values, resultsHandler, namespace) {
				this._initStorage();
				
 				if(!this.isValidKeyArray(keys) 
						|| ! values instanceof Array 
						|| keys.length != values.length){
					throw new Error("Invalid arguments: keys = [" 
									+ keys + "], values = [" + values + "]");
				}
				
				if(namespace == null || typeof namespace == "undefined"){
					namespace = dojox.storage.DEFAULT_NAMESPACE;		
				}
				if(!this.isValidKey(namespace)){
					throw new Error("Invalid namespace given: " + namespace);
				}
	
				this._statusHandler = resultsHandler;

				// try to store the value	
				try{
					dojox.sql.open();
					dojox.sql.db.execute("BEGIN TRANSACTION");
					var _stmt = "REPLACE INTO " + this.TABLE_NAME + " VALUES (?, ?, ?)";
					for(var i=0;i<keys.length;i++) {
						// serialize the value;
						// handle strings differently so they have better performance
						var value = values[i];
						if(dojo.isString(value)){
							value = "string:" + value;
						}else{
							value = dojo.toJson(value);
						}
				
						dojox.sql.db.execute( _stmt,
							[namespace, keys[i], value]);
					}
					dojox.sql.db.execute("COMMIT TRANSACTION");
					dojox.sql.close();
				}catch(e){
					// indicate we failed
					console.debug("dojox.storage.GearsStorageProvider.putMultiple:", e);
					if(resultsHandler){
						resultsHandler(this.FAILED, keys, e.toString(), namespace);
					}
					return;
				}
				
				if(resultsHandler){
					resultsHandler(dojox.storage.SUCCESS, keys, null, namespace);
				}
			},

			getMultiple: function(keys, namespace){
				//	TODO: Maybe use SELECT IN instead
				this._initStorage();

				if(!this.isValidKeyArray(keys)){
					throw new ("Invalid key array given: " + keys);
				}
				
				if(namespace == null || typeof namespace == "undefined"){
					namespace = dojox.storage.DEFAULT_NAMESPACE;		
				}
				if(!this.isValidKey(namespace)){
					throw new Error("Invalid namespace given: " + namespace);
				}
		
				var _stmt = "SELECT * FROM " + this.TABLE_NAME 
					+ " WHERE namespace = ? AND "	+ " key = ?";
				
				var results = [];
				for(var i=0;i<keys.length;i++){
					var result = dojox.sql( _stmt, namespace, keys[i]);
						
					if( ! result.length){
						results[i] = null;
					}else{
						result = result[0].value;
						
						// destringify the content back into a 
						// real JavaScript object;
						// handle strings differently so they have better performance
						if(dojo.isString(result) && (/^string:/.test(result))){
							results[i] = result.substring("string:".length);
						}else{
							results[i] = dojo.fromJson(result);
						}
					}
				}
				
				return results;
			},
			
			removeMultiple: function(keys, namespace){
				this._initStorage();
				
				if(!this.isValidKeyArray(keys)){
					throw new Error("Invalid arguments: keys = [" + keys + "]");
				}
				
				if(namespace == null || typeof namespace == "undefined"){
					namespace = dojox.storage.DEFAULT_NAMESPACE;		
				}
				if(!this.isValidKey(namespace)){
					throw new Error("Invalid namespace given: " + namespace);
				}
				
				dojox.sql.open();
				dojox.sql.db.execute("BEGIN TRANSACTION");
				var _stmt = "DELETE FROM " + this.TABLE_NAME 
										+ " WHERE namespace = ? AND key = ?";

				for(var i=0;i<keys.length;i++){
					dojox.sql.db.execute( _stmt,
						[namespace, keys[i]]);
				}
				dojox.sql.db.execute("COMMIT TRANSACTION");
				dojox.sql.close();
			}, 				
			
			isPermanent: function(){ return true; },

			getMaximumSize: function(){ return this.SIZE_NO_LIMIT; },

			hasSettingsUI: function(){ return false; },
			
			showSettingsUI: function(){
				throw new Error(this.declaredClass 
									+ " does not support a storage settings user-interface");
			},
			
			hideSettingsUI: function(){
				throw new Error(this.declaredClass 
									+ " does not support a storage settings user-interface");
			},
			
			_initStorage: function(){
				// we delay creating the tables until an operation is actually
				// called so that we don't give a Gears dialog right on page
				// load (bug #7538)
				if (this._storageReady) {
					return;
				}
				
				if (!google.gears.factory.hasPermission) {
					var siteName = null;
					var icon = null;
					var msg = 'This site would like to use Google Gears to enable '
										+ 'enhanced functionality.';
					var allowed = google.gears.factory.getPermission(siteName, icon, msg);
					if (!allowed) {
						throw new Error('You must give permission to use Gears in order to '
														+ 'store data');
					}
				}
				
				// create the table that holds our data
				try{
					dojox.sql("CREATE TABLE IF NOT EXISTS " + this.TABLE_NAME + "( "
								+ " namespace TEXT, "
								+ " key TEXT, "
								+ " value TEXT "
								+ ")"
							);
					dojox.sql("CREATE UNIQUE INDEX IF NOT EXISTS namespace_key_index" 
								+ " ON " + this.TABLE_NAME
								+ " (namespace, key)");
				}catch(e){
					console.debug("dojox.storage.GearsStorageProvider._createTables:", e);
					throw new Error('Unable to create storage tables for Gears in '
					                + 'Dojo Storage');
				}
				
				this._storageReady = true;
		  }
		});

		// register the existence of our storage providers
		dojox.storage.manager.register("dojox.storage.GearsStorageProvider",
										new dojox.storage.GearsStorageProvider());
	})();
}

}

if(!dojo._hasResource["dojox.storage.WhatWGStorageProvider"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.storage.WhatWGStorageProvider"] = true;
dojo.provide("dojox.storage.WhatWGStorageProvider");



dojo.declare("dojox.storage.WhatWGStorageProvider", [ dojox.storage.Provider ], {
	// summary:
	//		Storage provider that uses WHAT Working Group features in Firefox 2 
	//		to achieve permanent storage.
	// description: 
	//		The WHAT WG storage API is documented at 
	//		http://www.whatwg.org/specs/web-apps/current-work/#scs-client-side
	//
	//		You can disable this storage provider with the following djConfig
	//		variable:
	//		var djConfig = { disableWhatWGStorage: true };
	//		
	//		Authors of this storage provider-	
	//			JB Boisseau, jb.boisseau@eutech-ssii.com
	//			Brad Neuberg, bkn3@columbia.edu 

	initialized: false,
	
	_domain: null,
	_available: null,
	_statusHandler: null,
	_allNamespaces: null,
	_storageEventListener: null,
	
	initialize: function(){
		if(dojo.config["disableWhatWGStorage"] == true){
			return;
		}
		
		// get current domain
		this._domain = location.hostname;
		// console.debug(this._domain);
		
		// indicate that this storage provider is now loaded
		this.initialized = true;
		dojox.storage.manager.loaded();	
	},
	
	isAvailable: function(){
		try{
			var myStorage = globalStorage[location.hostname]; 
		}catch(e){
			this._available = false;
			return this._available;
		}
		
		this._available = true;	
		return this._available;
	},

	put: function(key, value, resultsHandler, namespace){
		if(this.isValidKey(key) == false){
			throw new Error("Invalid key given: " + key);
		}
		namespace = namespace||this.DEFAULT_NAMESPACE;
		
		// get our full key name, which is namespace + key
		key = this.getFullKey(key, namespace);	
		
		this._statusHandler = resultsHandler;
		
		// serialize the value;
		// handle strings differently so they have better performance
		if(dojo.isString(value)){
			value = "string:" + value;
		}else{
			value = dojo.toJson(value);
		}
		
		// register for successful storage events.
		var storageListener = dojo.hitch(this, function(evt){
			// remove any old storage event listener we might have added
			// to the window on old put() requests; Firefox has a bug
			// where it can occassionaly go into infinite loops calling
			// our storage event listener over and over -- this is a 
			// workaround
			// FIXME: Simplify this into a test case and submit it
			// to Firefox
			window.removeEventListener("storage", storageListener, false);
			
			// indicate we succeeded
			if(resultsHandler){
				resultsHandler.call(null, this.SUCCESS, key, null, namespace);
			}
		});
		
		window.addEventListener("storage", storageListener, false);
		
		// try to store the value	
		try{
			var myStorage = globalStorage[this._domain];
			myStorage.setItem(key, value);
		}catch(e){
			// indicate we failed
			this._statusHandler.call(null, this.FAILED, key, e.toString(), namespace);
		}
	},

	get: function(key, namespace){
		if(this.isValidKey(key) == false){
			throw new Error("Invalid key given: " + key);
		}
		namespace = namespace||this.DEFAULT_NAMESPACE;
		
		// get our full key name, which is namespace + key
		key = this.getFullKey(key, namespace);
		
		// sometimes, even if a key doesn't exist, Firefox
		// will return a blank string instead of a null --
		// this _might_ be due to having underscores in the
		// keyname, but I am not sure.
		
		// FIXME: Simplify this bug into a testcase and
		// submit it to Firefox
		var myStorage = globalStorage[this._domain];
		var results = myStorage.getItem(key);
		
		if(results == null || results == ""){
			return null;
		}
		
		results = results.value;
		
		// destringify the content back into a 
		// real JavaScript object;
		// handle strings differently so they have better performance
		if(dojo.isString(results) && (/^string:/.test(results))){
			results = results.substring("string:".length);
		}else{
			results = dojo.fromJson(results);
		}
		
		return results;
	},
	
	getNamespaces: function(){
		var results = [ this.DEFAULT_NAMESPACE ];
		
		// simply enumerate through our array and save any string
		// that starts with __
		var found = {};
		var myStorage = globalStorage[this._domain];
		var tester = /^__([^_]*)_/;
		for(var i = 0; i < myStorage.length; i++){
			var currentKey = myStorage.key(i);
			if(tester.test(currentKey) == true){
				var currentNS = currentKey.match(tester)[1];
				// have we seen this namespace before?
				if(typeof found[currentNS] == "undefined"){
					found[currentNS] = true;
					results.push(currentNS);
				}
			}
		}
		
		return results;
	},

	getKeys: function(namespace){
		namespace = namespace||this.DEFAULT_NAMESPACE;
		
		if(this.isValidKey(namespace) == false){
			throw new Error("Invalid namespace given: " + namespace);
		}
		
		// create a regular expression to test the beginning
		// of our key names to see if they match our namespace;
		// if it is the default namespace then test for the presence
		// of no namespace for compatibility with older versions
		// of dojox.storage
		var namespaceTester;
		if(namespace == this.DEFAULT_NAMESPACE){
			namespaceTester = new RegExp("^([^_]{2}.*)$");	
		}else{
			namespaceTester = new RegExp("^__" + namespace + "_(.*)$");
		}
		
		var myStorage = globalStorage[this._domain];
		var keysArray = [];
		for(var i = 0; i < myStorage.length; i++){
			var currentKey = myStorage.key(i);
			if(namespaceTester.test(currentKey) == true){
				// strip off the namespace portion
				currentKey = currentKey.match(namespaceTester)[1];
				keysArray.push(currentKey);
			}
		}
		
		return keysArray;
	},

	clear: function(namespace){
		namespace = namespace||this.DEFAULT_NAMESPACE;
		
		if(this.isValidKey(namespace) == false){
			throw new Error("Invalid namespace given: " + namespace);
		}
		
		// create a regular expression to test the beginning
		// of our key names to see if they match our namespace;
		// if it is the default namespace then test for the presence
		// of no namespace for compatibility with older versions
		// of dojox.storage
		var namespaceTester;
		if(namespace == this.DEFAULT_NAMESPACE){
			namespaceTester = new RegExp("^[^_]{2}");	
		}else{
			namespaceTester = new RegExp("^__" + namespace + "_");
		}
		
		var myStorage = globalStorage[this._domain];
		var keys = [];
		for(var i = 0; i < myStorage.length; i++){
			if(namespaceTester.test(myStorage.key(i)) == true){
				keys[keys.length] = myStorage.key(i);
			}
		}
		
		dojo.forEach(keys, dojo.hitch(myStorage, "removeItem"));
	},
	
	remove: function(key, namespace){
		// get our full key name, which is namespace + key
		key = this.getFullKey(key, namespace);
		
		var myStorage = globalStorage[this._domain];
		myStorage.removeItem(key);
	},
	
	isPermanent: function(){
		return true;
	},

	getMaximumSize: function(){
		return this.SIZE_NO_LIMIT;
	},

	hasSettingsUI: function(){
		return false;
	},
	
	showSettingsUI: function(){
		throw new Error(this.declaredClass + " does not support a storage settings user-interface");
	},
	
	hideSettingsUI: function(){
		throw new Error(this.declaredClass + " does not support a storage settings user-interface");
	},
	
	getFullKey: function(key, namespace){
		namespace = namespace||this.DEFAULT_NAMESPACE;
		
		if(this.isValidKey(namespace) == false){
			throw new Error("Invalid namespace given: " + namespace);
		}
		
		// don't append a namespace string for the default namespace,
		// for compatibility with older versions of dojox.storage
		if(namespace == this.DEFAULT_NAMESPACE){
			return key;
		}else{
			return "__" + namespace + "_" + key;
		}
	}
});

dojox.storage.manager.register("dojox.storage.WhatWGStorageProvider", 
								new dojox.storage.WhatWGStorageProvider());

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

if(!dojo._hasResource["dojox.flash._base"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.flash._base"] = true;
dojo.provide("dojox.flash._base");
dojo.experimental("dojox.flash");

// for dijit.getViewport(), needed by dojox.flash.Embed.center()


dojox.flash = function(){
	// summary:
	//	Utilities to embed and communicate with the Flash player from Javascript
	//
	// description:
	//	The goal of dojox.flash is to make it easy to extend Flash's capabilities
	//	into an Ajax/DHTML environment.
	//  
	//	dojox.flash provides an easy object for interacting with the Flash plugin. 
	//	This object provides methods to determine the current version of the Flash
	//	plugin (dojox.flash.info); write out the necessary markup to 
	//	dynamically insert a Flash object into the page (dojox.flash.Embed; and 
	//	do dynamic installation and upgrading of the current Flash plugin in 
	//	use (dojox.flash.Install). If you want to call methods on the Flash object
	//	embedded into the page it is your responsibility to use Flash's ExternalInterface
	//	API and get a reference to the Flash object yourself.
	//		
	//	To use dojox.flash, you must first wait until Flash is finished loading 
	//	and initializing before you attempt communication or interaction. 
	//	To know when Flash is finished use dojo.connect:
	//		
	//|	dojo.connect(dojox.flash, "loaded", myInstance, "myCallback");
	//		
	//	Then, while the page is still loading provide the file name:
	//		
	//|	dojox.flash.setSwf(dojo.moduleUrl("dojox", "_storage/storage.swf"));
	//			
	//	If no SWF files are specified, then Flash is not initialized.
	//		
	//	Your Flash must use Flash's ExternalInterface to expose Flash methods and
	//	to call JavaScript.
	//		
	//	setSwf can take an optional 'visible' attribute to control whether
	//	the Flash object is visible or not on the page; the default is visible:
	//		
	//|	dojox.flash.setSwf(dojo.moduleUrl("dojox", "_storage/storage.swf"),
	//						false);
	//		
	//	Once finished, you can query Flash version information:
	//		
	//|	dojox.flash.info.version
	//		
	//	Or can communicate with Flash methods that were exposed:	
	//
	//|	var f = dojox.flash.get();
	//|	var results = f.sayHello("Some Message");	
	// 
	//	Your Flash files should use DojoExternalInterface.as to register methods;
	//	this file wraps Flash's normal ExternalInterface but correct various
	//	serialization bugs that ExternalInterface has.
	//
	//	Note that dojox.flash is not meant to be a generic Flash embedding
	//	mechanism; it is as generic as necessary to make Dojo Storage's
	//	Flash Storage Provider as clean and modular as possible. If you want 
	//	a generic Flash embed mechanism see [SWFObject](http://blog.deconcept.com/swfobject/).
	//
	// 	Notes:
	//	Note that dojox.flash can currently only work with one Flash object
	//	on the page; it does not yet support multiple Flash objects on
	//	the same page. 
	//		
	//	Your code can detect whether the Flash player is installing or having
	//	its version revved in two ways. First, if dojox.flash detects that
	//	Flash installation needs to occur, it sets dojox.flash.info.installing
	//	to true. Second, you can detect if installation is necessary with the
	//	following callback:
	//		
	//|	dojo.connect(dojox.flash, "installing", myInstance, "myCallback");
	//		
	//	You can use this callback to delay further actions that might need Flash;
	//	when installation is finished the full page will be refreshed and the
	//	user will be placed back on your page with Flash installed.
	//		
	//	-------------------
	//	Todo/Known Issues
	//	-------------------
	//
	//	* On Internet Explorer, after doing a basic install, the page is
	//	not refreshed or does not detect that Flash is now available. The way
	//	to fix this is to create a custom small Flash file that is pointed to
	//	during installation; when it is finished loading, it does a callback
	//	that says that Flash installation is complete on IE, and we can proceed
	//	to initialize the dojox.flash subsystem.
	//	* Things aren't super tested for sending complex objects to Flash
	//	methods, since Dojo Storage only needs strings
	//		
	//	Author- Brad Neuberg, http://codinginparadise.org
}

dojox.flash = {
	ready: false,
	url: null,
	
	_visible: true,
	_loadedListeners: [],
	_installingListeners: [],
	
	setSwf: function(/* String */ url, /* boolean? */ visible){
		// summary: Sets the SWF files and versions we are using.
		// url: String
		//	The URL to this Flash file.
		// visible: boolean?
		//	Whether the Flash file is visible or not. If it is not visible we hide 
		//	it off the screen. This defaults to true (i.e. the Flash file is
		//	visible).
		this.url = url;
		
		this._visible = true;
		if(visible !== null && visible !== undefined){
			this._visible = visible;
		}
		
		// initialize ourselves		
		this._initialize();
	},
	
	addLoadedListener: function(/* Function */ listener){
		// summary:
		//	Adds a listener to know when Flash is finished loading. 
		//	Useful if you don't want a dependency on dojo.event.
		// listener: Function
		//	A function that will be called when Flash is done loading.
		
		this._loadedListeners.push(listener);
	},

	addInstallingListener: function(/* Function */ listener){
		// summary:
		//	Adds a listener to know if Flash is being installed. 
		//	Useful if you don't want a dependency on dojo.event.
		// listener: Function
		//	A function that will be called if Flash is being
		//	installed
		
		this._installingListeners.push(listener);
	},	
	
	loaded: function(){
		// summary: Called back when the Flash subsystem is finished loading.
		// description:
		//	A callback when the Flash subsystem is finished loading and can be
		//	worked with. To be notified when Flash is finished loading, add a
		//  loaded listener: 
		//
		//  dojox.flash.addLoadedListener(loadedListener);
	
		dojox.flash.ready = true;
		if(dojox.flash._loadedListeners.length){ // FIXME: redundant if? use forEach?
			for(var i = 0;i < dojox.flash._loadedListeners.length; i++){
				dojox.flash._loadedListeners[i].call(null);
			}
		}
	},
	
	installing: function(){
		// summary: Called if Flash is being installed.
		// description:
		//	A callback to know if Flash is currently being installed or
		//	having its version revved. To be notified if Flash is installing, connect
		//	your callback to this method using the following:
		//	
		//	dojo.event.connect(dojox.flash, "installing", myInstance, "myCallback");
		
		if(dojox.flash._installingListeners.length){ // FIXME: redundant if? use forEach?
			for(var i = 0; i < dojox.flash._installingListeners.length; i++){
				dojox.flash._installingListeners[i].call(null);
			}
		}
	},
	
	// Initializes dojox.flash.
	_initialize: function(){
		//console.debug("dojox.flash._initialize");
		// see if we need to rev or install Flash on this platform
		var installer = new dojox.flash.Install();
		dojox.flash.installer = installer;

		if(installer.needed()){		
			installer.install();
		}else{
			// write the flash object into the page
			dojox.flash.obj = new dojox.flash.Embed(this._visible);
			dojox.flash.obj.write();
			
			// setup the communicator
			dojox.flash.comm = new dojox.flash.Communicator();
		}
	}
};


dojox.flash.Info = function(){
	// summary: A class that helps us determine whether Flash is available.
	// description:
	//	A class that helps us determine whether Flash is available,
	//	it's major and minor versions, and what Flash version features should
	//	be used for Flash/JavaScript communication. Parts of this code
	//	are adapted from the automatic Flash plugin detection code autogenerated 
	//	by the Macromedia Flash 8 authoring environment. 
	//	
	//	An instance of this class can be accessed on dojox.flash.info after
	//	the page is finished loading.

	this._detectVersion();
}

dojox.flash.Info.prototype = {
	// version: String
	//		The full version string, such as "8r22".
	version: -1,
	
	// versionMajor, versionMinor, versionRevision: String
	//		The major, minor, and revisions of the plugin. For example, if the
	//		plugin is 8r22, then the major version is 8, the minor version is 0,
	//		and the revision is 22. 
	versionMajor: -1,
	versionMinor: -1,
	versionRevision: -1,
	
	// capable: Boolean
	//		Whether this platform has Flash already installed.
	capable: false,
	
	// installing: Boolean
	//	Set if we are in the middle of a Flash installation session.
	installing: false,
	
	isVersionOrAbove: function(
							/* int */ reqMajorVer, 
							/* int */ reqMinorVer, 
							/* int */ reqVer){ /* Boolean */
		// summary: 
		//	Asserts that this environment has the given major, minor, and revision
		//	numbers for the Flash player.
		// description:
		//	Asserts that this environment has the given major, minor, and revision
		//	numbers for the Flash player. 
		//	
		//	Example- To test for Flash Player 7r14:
		//	
		//	dojox.flash.info.isVersionOrAbove(7, 0, 14)
		// returns:
		//	Returns true if the player is equal
		//	or above the given version, false otherwise.
		
		// make the revision a decimal (i.e. transform revision 14 into
		// 0.14
		reqVer = parseFloat("." + reqVer);
		
		if(this.versionMajor >= reqMajorVer && this.versionMinor >= reqMinorVer
			 && this.versionRevision >= reqVer){
			return true;
		}else{
			return false;
		}
	},
	
	_detectVersion: function(){
		var versionStr;
		
		// loop backwards through the versions until we find the newest version	
		for(var testVersion = 25; testVersion > 0; testVersion--){
			if(dojo.isIE){
				var axo;
				try{
					if(testVersion > 6){
						axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash." 
																		+ testVersion);
					}else{
						axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
					}
					if(typeof axo == "object"){
						if(testVersion == 6){
							axo.AllowScriptAccess = "always";
						}
						versionStr = axo.GetVariable("$version");
					}
				}catch(e){
					continue;
				}
			}else{
				versionStr = this._JSFlashInfo(testVersion);		
			}
				
			if(versionStr == -1 ){
				this.capable = false; 
				return;
			}else if(versionStr != 0){
				var versionArray;
				if(dojo.isIE){
					var tempArray = versionStr.split(" ");
					var tempString = tempArray[1];
					versionArray = tempString.split(",");
				}else{
					versionArray = versionStr.split(".");
				}
					
				this.versionMajor = versionArray[0];
				this.versionMinor = versionArray[1];
				this.versionRevision = versionArray[2];
				
				// 7.0r24 == 7.24
				var versionString = this.versionMajor + "." + this.versionRevision;
				this.version = parseFloat(versionString);
				
				this.capable = true;
				
				break;
			}
		}
	},
	 
	// JavaScript helper required to detect Flash Player PlugIn version 
	// information. Internet Explorer uses a corresponding Visual Basic
	// version to interact with the Flash ActiveX control. 
	_JSFlashInfo: function(testVersion){
		// NS/Opera version >= 3 check for Flash plugin in plugin array
		if(navigator.plugins != null && navigator.plugins.length > 0){
			if(navigator.plugins["Shockwave Flash 2.0"] || 
				 navigator.plugins["Shockwave Flash"]){
				var swVer2 = navigator.plugins["Shockwave Flash 2.0"] ? " 2.0" : "";
				var flashDescription = navigator.plugins["Shockwave Flash" + swVer2].description;
				var descArray = flashDescription.split(" ");
				var tempArrayMajor = descArray[2].split(".");
				var versionMajor = tempArrayMajor[0];
				var versionMinor = tempArrayMajor[1];
				var tempArrayMinor = (descArray[3] || descArray[4]).split("r");
				var versionRevision = tempArrayMinor[1] > 0 ? tempArrayMinor[1] : 0;
				var version = versionMajor + "." + versionMinor + "." + versionRevision;
											
				return version;
			}
		}
		
		return -1;
	}
};

dojox.flash.Embed = function(visible){
	// summary: A class that is used to write out the Flash object into the page.
	// description:
	//	Writes out the necessary tags to embed a Flash file into the page. Note that
	//	these tags are written out as the page is loaded using document.write, so
	//	you must call this class before the page has finished loading.
	
	this._visible = visible;
}

dojox.flash.Embed.prototype = {
	// width: int
	//	The width of this Flash applet. The default is the minimal width
	//	necessary to show the Flash settings dialog. Current value is 
	//  215 pixels.
	width: 215,
	
	// height: int 
	//	The height of this Flash applet. The default is the minimal height
	//	necessary to show the Flash settings dialog. Current value is
	// 138 pixels.
	height: 138,
	
	// id: String
	// 	The id of the Flash object. Current value is 'flashObject'.
	id: "flashObject",
	
	// Controls whether this is a visible Flash applet or not.
	_visible: true,

	protocol: function(){
		switch(window.location.protocol){
			case "https:":
				return "https";
				break;
			default:
				return "http";
				break;
		}
	},
	
	write: function(/* Boolean? */ doExpressInstall){
		// summary: Writes the Flash into the page.
		// description:
		//	This must be called before the page
		//	is finished loading. 
		// doExpressInstall: Boolean
		//	Whether to write out Express Install
		//	information. Optional value; defaults to false.
		
		// figure out the SWF file to get and how to write out the correct HTML
		// for this Flash version
		var objectHTML;
		var swfloc = dojox.flash.url;
		var swflocObject = swfloc;
		var swflocEmbed = swfloc;
		var dojoUrl = dojo.baseUrl;
		var xdomainBase = document.location.protocol + '//' + document.location.host;
		if(doExpressInstall){
			// the location to redirect to after installing
			var redirectURL = escape(window.location);
			document.title = document.title.slice(0, 47) + " - Flash Player Installation";
			var docTitle = escape(document.title);
			swflocObject += "?MMredirectURL=" + redirectURL
			                + "&MMplayerType=ActiveX"
			                + "&MMdoctitle=" + docTitle
			                + "&baseUrl=" + escape(dojoUrl)
			                + "&xdomain=" + escape(xdomainBase);
			swflocEmbed += "?MMredirectURL=" + redirectURL 
			                + "&MMplayerType=PlugIn"
			                + "&baseUrl=" + escape(dojoUrl)
			                + "&xdomain=" + escape(xdomainBase);
		}else{
			// IE/Flash has an evil bug that shows up some time: if we load the
			// Flash and it isn't in the cache, ExternalInterface works fine --
			// however, the second time when its loaded from the cache a timing
			// bug can keep ExternalInterface from working. The trick below 
			// simply invalidates the Flash object in the cache all the time to
			// keep it loading fresh. -- Brad Neuberg
			swflocObject += "?cachebust=" + new Date().getTime();
			swflocObject += "&baseUrl=" + escape(dojoUrl);
			swflocObject += "&xdomain=" + escape(xdomainBase);
		}

		if(swflocEmbed.indexOf("?") == -1){
			swflocEmbed += '?baseUrl='+escape(dojoUrl);
		}else{
		  swflocEmbed += '&baseUrl='+escape(dojoUrl);
		}
		swflocEmbed += '&xdomain='+escape(xdomainBase);
		
		objectHTML =
			'<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" '
			  + 'codebase="'
				+ this.protocol()
				+ '://fpdownload.macromedia.com/pub/shockwave/cabs/flash/'
				+ 'swflash.cab#version=8,0,0,0"\n '
			  + 'width="' + this.width + '"\n '
			  + 'height="' + this.height + '"\n '
			  + 'id="' + this.id + '"\n '
			  + 'name="' + this.id + '"\n '
			  + 'align="middle">\n '
			  + '<param name="allowScriptAccess" value="always"></param>\n '
			  + '<param name="movie" value="' + swflocObject + '"></param>\n '
			  + '<param name="quality" value="high"></param>\n '
			  + '<param name="bgcolor" value="#ffffff"></param>\n '
			  + '<embed src="' + swflocEmbed + '" '
			  	  + 'quality="high" '
				  + 'bgcolor="#ffffff" '
				  + 'width="' + this.width + '" '
				  + 'height="' + this.height + '" '
				  + 'id="' + this.id + 'Embed' + '" '
				  + 'name="' + this.id + '" '
				  + 'swLiveConnect="true" '
				  + 'align="middle" '
				  + 'allowScriptAccess="always" '
				  + 'type="application/x-shockwave-flash" '
				  + 'pluginspage="'
				  + this.protocol()
				  +'://www.macromedia.com/go/getflashplayer" '
				  + '></embed>\n'
			+ '</object>\n';
					
		// using same mechanism on all browsers now to write out
		// Flash object into page

		// document.write no longer works correctly due to Eolas patent workaround
		// in IE; nothing happens (i.e. object doesn't go into page if we use it)
		dojo.connect(dojo, "loaded", dojo.hitch(this, function(){
			// Prevent putting duplicate SWFs onto the page
			var containerId = this.id + "Container";
			if(dojo.byId(containerId)){
				return;
			}
			
			var div = document.createElement("div");
			div.id = this.id + "Container";
			
			div.style.width = this.width + "px";
			div.style.height = this.height + "px";
			if(!this._visible){
				div.style.position = "absolute";
				div.style.zIndex = "10000";
				div.style.top = "-1000px";
			}

			div.innerHTML = objectHTML;

			var body = document.getElementsByTagName("body");
			if(!body || !body.length){
				throw new Error("No body tag for this page");
			}
			body = body[0];
			body.appendChild(div);
		}));
	},  
	
	get: function(){ /* Object */
		// summary: Gets the Flash object DOM node.

		if(dojo.isIE || dojo.isWebKit){
			//TODO: should this really be the else?
			return dojo.byId(this.id);
		}else{
			// different IDs on OBJECT and EMBED tags or
			// else Firefox will return wrong one and
			// communication won't work; 
			// also, document.getElementById() returns a
			// plugin but ExternalInterface calls don't
			// work on it so we have to use
			// document[id] instead
			return document[this.id + "Embed"];
		}
	},
	
	setVisible: function(/* Boolean */ visible){
		//console.debug("setVisible, visible="+visible);
		
		// summary: Sets the visibility of this Flash object.		
		var container = dojo.byId(this.id + "Container");
		if(visible){
			container.style.position = "absolute"; // IE -- Brad Neuberg
			container.style.visibility = "visible";
		}else{
			container.style.position = "absolute";
			container.style.y = "-1000px";
			container.style.visibility = "hidden";
		}
	},
	
	center: function(){
		// summary: Centers the flash applet on the page.
		
		var elementWidth = this.width;
		var elementHeight = this.height;

		var viewport = dijit.getViewport();

		// compute the centered position    
		var x = viewport.l + (viewport.w - elementWidth) / 2;
		var y = viewport.t + (viewport.h - elementHeight) / 2; 
		
		// set the centered position
		var container = dojo.byId(this.id + "Container");
		container.style.top = y + "px";
		container.style.left = x + "px";
	}
};


dojox.flash.Communicator = function(){
	// summary:
	//	A class that is used to communicate between Flash and JavaScript.
	// description:
	//	This class helps mediate Flash and JavaScript communication. Internally
	//	it uses Flash 8's ExternalInterface API, but adds functionality to fix 
	//	various encoding bugs that ExternalInterface has.
}

dojox.flash.Communicator.prototype = {
	// Registers the existence of a Flash method that we can call with
	// JavaScript, using Flash 8's ExternalInterface. 
	_addExternalInterfaceCallback: function(methodName){
		//console.debug("addExternalInterfaceCallback, methodName="+methodName);
		var wrapperCall = dojo.hitch(this, function(){
			// some browsers don't like us changing values in the 'arguments' array, so
			// make a fresh copy of it
			var methodArgs = new Array(arguments.length);
			for(var i = 0; i < arguments.length; i++){
				methodArgs[i] = this._encodeData(arguments[i]);
			}
			
			var results = this._execFlash(methodName, methodArgs);
			results = this._decodeData(results);
			
			return results;
		});
		
		this[methodName] = wrapperCall;
	},
	
	// Encodes our data to get around ExternalInterface bugs that are still
	// present even in Flash 9.
	_encodeData: function(data){
		//console.debug("encodeData, data=", data);
		if(!data || typeof data != "string"){
			return data;
		}
		
		// transforming \ into \\ doesn't work; just use a custom encoding
		data = data.replace("\\", "&custom_backslash;");

		// also use custom encoding for the null character to avoid problems 
		data = data.replace(/\0/g, "&custom_null;");

		return data;
	},
	
	// Decodes our data to get around ExternalInterface bugs that are still
	// present even in Flash 9.
	_decodeData: function(data){
		//console.debug("decodeData, data=", data);
		// wierdly enough, Flash sometimes returns the result as an
		// 'object' that is actually an array, rather than as a String;
		// detect this by looking for a length property; for IE
		// we also make sure that we aren't dealing with a typeof string
		// since string objects have length property there
		if(data && data.length && typeof data != "string"){
			data = data[0];
		}
		
		if(!data || typeof data != "string"){
			return data;
		}
		
		// needed for IE; \0 is the NULL character 
		data = data.replace(/\&custom_null\;/g, "\0");
	
		// certain XMLish characters break Flash's wire serialization for
		// ExternalInterface; these are encoded on the 
		// DojoExternalInterface side into a custom encoding, rather than
		// the standard entity encoding, because otherwise we won't be able to
		// differentiate between our own encoding and any entity characters
		// that are being used in the string itself
		data = data.replace(/\&custom_lt\;/g, "<")
			.replace(/\&custom_gt\;/g, ">")
			.replace(/\&custom_backslash\;/g, '\\');
		
		return data;
	},
	
	// Executes a Flash method; called from the JavaScript wrapper proxy we
	// create on dojox.flash.comm.
	_execFlash: function(methodName, methodArgs){
		//console.debug("execFlash, methodName="+methodName+", methodArgs=", methodArgs);
		var plugin = dojox.flash.obj.get();
		methodArgs = (methodArgs) ? methodArgs : [];
		
		// encode arguments that are strings
		for(var i = 0; i < methodArgs; i++){
			if(typeof methodArgs[i] == "string"){
				methodArgs[i] = this._encodeData(methodArgs[i]);
			}
		}

		// we use this gnarly hack below instead of 
		// plugin[methodName] for two reasons:
		// 1) plugin[methodName] has no call() method, which
		// means we can't pass in multiple arguments dynamically
		// to a Flash method -- we can only have one
		// 2) On IE plugin[methodName] returns undefined -- 
		// plugin[methodName] used to work on IE when we
		// used document.write but doesn't now that
		// we use dynamic DOM insertion of the Flash object
		// -- Brad Neuberg
		var flashExec = function(){ 
			return eval(plugin.CallFunction(
						 "<invoke name=\"" + methodName
						+ "\" returntype=\"javascript\">" 
						+ __flash__argumentsToXML(methodArgs, 0) 
						+ "</invoke>")); 
		};
		var results = flashExec.call(methodArgs);
		
		if(typeof results == "string"){
			results = this._decodeData(results);
		}
			
		return results;
	}
}

// FIXME: dojo.declare()-ify this

// TODO: I did not test the Install code when I refactored Dojo Flash from 0.4 to 
// 1.0, so am not sure if it works. If Flash is not present I now prefer 
// that Gears is installed instead of Flash because GearsStorageProvider is
// much easier to work with than Flash's hacky ExternalInteface. 
// -- Brad Neuberg
dojox.flash.Install = function(){
	// summary: Helps install Flash plugin if needed.
	// description:
	//		Figures out the best way to automatically install the Flash plugin
	//		for this browser and platform. Also determines if installation or
	//		revving of the current plugin is needed on this platform.
}

dojox.flash.Install.prototype = {
	needed: function(){ /* Boolean */
		// summary:
		//		Determines if installation or revving of the current plugin is
		//		needed. 
	
		// do we even have flash?
		if(!dojox.flash.info.capable){
			return true;
		}

		// Must have ExternalInterface which came in Flash 8
		if(!dojox.flash.info.isVersionOrAbove(8, 0, 0)){
			return true;
		}

		// otherwise we don't need installation
		return false;
	},

	install: function(){
		// summary: Performs installation or revving of the Flash plugin.
		var installObj;
	
		// indicate that we are installing
		dojox.flash.info.installing = true;
		dojox.flash.installing();
		
		if(dojox.flash.info.capable == false){ // we have no Flash at all
			// write out a simple Flash object to force the browser to prompt
			// the user to install things
			installObj = new dojox.flash.Embed(false);
			installObj.write(); // write out HTML for Flash
		}else if(dojox.flash.info.isVersionOrAbove(6, 0, 65)){ // Express Install
			installObj = new dojox.flash.Embed(false);
			installObj.write(true); // write out HTML for Flash 8 version+
			installObj.setVisible(true);
			installObj.center();
		}else{ // older Flash install than version 6r65
			alert("This content requires a more recent version of the Macromedia "
						+" Flash Player.");
			window.location.href = + dojox.flash.Embed.protocol() +
						"://www.macromedia.com/go/getflashplayer";
		}
	},
	
	// Called when the Express Install is either finished, failed, or was
	// rejected by the user.
	_onInstallStatus: function(msg){
		if (msg == "Download.Complete"){
			// Installation is complete.
			dojox.flash._initialize();
		}else if(msg == "Download.Cancelled"){
			alert("This content requires a more recent version of the Macromedia "
						+" Flash Player.");
			window.location.href = dojox.flash.Embed.protocol() +
						"://www.macromedia.com/go/getflashplayer";
		}else if (msg == "Download.Failed"){
			// The end user failed to download the installer due to a network failure
			alert("There was an error downloading the Flash Player update. "
						+ "Please try again later, or visit macromedia.com to download "
						+ "the latest version of the Flash plugin.");
		}	
	}
}

// find out if Flash is installed
dojox.flash.info = new dojox.flash.Info();

// vim:ts=4:noet:tw=0:

}

if(!dojo._hasResource["dojox.flash"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.flash"] = true;
dojo.provide("dojox.flash");


}

if(!dojo._hasResource["dojox.storage.FlashStorageProvider"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.storage.FlashStorageProvider"] = true;
dojo.provide("dojox.storage.FlashStorageProvider");





// summary: 
//		Storage provider that uses features in Flash to achieve permanent
//		storage
// description:
//		Authors of this storage provider-
//			Brad Neuberg, bkn3@columbia.edu	
dojo.declare("dojox.storage.FlashStorageProvider", dojox.storage.Provider, {
		initialized: false,
		
		_available: null,
		_statusHandler: null,
		_flashReady: false,
		_pageReady: false,
		
		initialize: function(){
		  //console.debug("FlashStorageProvider.initialize");
			if(dojo.config["disableFlashStorage"] == true){
				return;
			}
			
			// initialize our Flash
			dojox.flash.addLoadedListener(dojo.hitch(this, function(){
			  //console.debug("flashReady");
			  // indicate our Flash subsystem is now loaded
			  this._flashReady = true;
			  if(this._flashReady && this._pageReady){
				  this._loaded();
				}
			}));
			var swfLoc = dojo.moduleUrl("dojox", "storage/Storage.swf").toString();
			dojox.flash.setSwf(swfLoc, false);
			
			// wait till page is finished loading
			dojo.connect(dojo, "loaded", this, function(){
			  //console.debug("pageReady");
			  this._pageReady = true;
			  if(this._flashReady && this._pageReady){
			    this._loaded();
			  }
			});
		},
		
		//	Set a new value for the flush delay timer.
		//	Possible values:
		//	  0 : Perform the flush synchronously after each "put" request
		//	> 0 : Wait until 'newDelay' ms have passed without any "put" request to flush
		//	 -1 : Do not  automatically flush
		setFlushDelay: function(newDelay){
			if(newDelay === null || typeof newDelay === "undefined" || isNaN(newDelay)){
				throw new Error("Invalid argunment: " + newDelay);
			}
			
			dojox.flash.comm.setFlushDelay(String(newDelay));
		},
		
		getFlushDelay: function(){
			return Number(dojox.flash.comm.getFlushDelay());
		},
		
		flush: function(namespace){
			//FIXME: is this test necessary?  Just use !namespace
			if(namespace == null || typeof namespace == "undefined"){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}
			dojox.flash.comm.flush(namespace);
		},

		isAvailable: function(){
			return (this._available = !dojo.config["disableFlashStorage"]);
		},

		put: function(key, value, resultsHandler, namespace){
			if(!this.isValidKey(key)){
				throw new Error("Invalid key given: " + key);
			}
			
			if(!namespace){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}
			
			if(!this.isValidKey(namespace)){
				throw new Error("Invalid namespace given: " + namespace);
			}
				
			this._statusHandler = resultsHandler;
			
			// serialize the value;
			// handle strings differently so they have better performance
			if(dojo.isString(value)){
				value = "string:" + value;
			}else{
				value = dojo.toJson(value);
			}
			
			dojox.flash.comm.put(key, value, namespace);
		},

		putMultiple: function(keys, values, resultsHandler, namespace){
			if(!this.isValidKeyArray(keys) || ! values instanceof Array 
			    || keys.length != values.length){
				throw new Error("Invalid arguments: keys = [" + keys + "], values = [" + values + "]");
			}
			
			if(!namespace){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}

			if(!this.isValidKey(namespace)){
				throw new Error("Invalid namespace given: " + namespace);
			}

			this._statusHandler = resultsHandler;
			
			//	Convert the arguments on strings we can pass along to Flash
			var metaKey = keys.join(",");
			var lengths = [];
			for(var i=0;i<values.length;i++){
				if(dojo.isString(values[i])){
					values[i] = "string:" + values[i];
				}else{
					values[i] = dojo.toJson(values[i]);
				}
				lengths[i] = values[i].length; 
			}
			var metaValue = values.join("");
			var metaLengths = lengths.join(",");
			
			dojox.flash.comm.putMultiple(metaKey, metaValue, metaLengths, namespace);
		},

		get: function(key, namespace){
			if(!this.isValidKey(key)){
				throw new Error("Invalid key given: " + key);
			}
			
			if(!namespace){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}
			
			if(!this.isValidKey(namespace)){
				throw new Error("Invalid namespace given: " + namespace);
			}
			
			var results = dojox.flash.comm.get(key, namespace);

			if(results == ""){
				return null;
			}
		
			return this._destringify(results);
		},

		getMultiple: function(/*array*/ keys, /*string?*/ namespace){ /*Object*/
			if(!this.isValidKeyArray(keys)){
				throw new ("Invalid key array given: " + keys);
			}
			
			if(!namespace){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}
			
			if(!this.isValidKey(namespace)){
				throw new Error("Invalid namespace given: " + namespace);
			}
			
			var metaKey = keys.join(",");
			var metaResults = dojox.flash.comm.getMultiple(metaKey, namespace);
			var results = eval("(" + metaResults + ")");
			
			//	destringify each entry back into a real JS object
			//FIXME: use dojo.map
			for(var i = 0; i < results.length; i++){
				results[i] = (results[i] == "") ? null : this._destringify(results[i]);
			}
			
			return results;		
		},

		_destringify: function(results){
			// destringify the content back into a 
			// real JavaScript object;
			// handle strings differently so they have better performance
			if(dojo.isString(results) && (/^string:/.test(results))){
				results = results.substring("string:".length);
			}else{
				results = dojo.fromJson(results);
			}
		
			return results;
		},
		
		getKeys: function(namespace){
			if(!namespace){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}
			
			if(!this.isValidKey(namespace)){
				throw new Error("Invalid namespace given: " + namespace);
			}
			
			var results = dojox.flash.comm.getKeys(namespace);
			
			// Flash incorrectly returns an empty string as "null"
			if(results == null || results == "null"){
			  results = "";
			}
			
			results = results.split(",");
			results.sort();
			
			return results;
		},
		
		getNamespaces: function(){
			var results = dojox.flash.comm.getNamespaces();
			
			// Flash incorrectly returns an empty string as "null"
			if(results == null || results == "null"){
			  results = dojox.storage.DEFAULT_NAMESPACE;
			}
			
			results = results.split(",");
			results.sort();
			
			return results;
		},

		clear: function(namespace){
			if(!namespace){
				namespace = dojox.storage.DEFAULT_NAMESPACE;
			}
			
			if(!this.isValidKey(namespace)){
				throw new Error("Invalid namespace given: " + namespace);
			}
			
			dojox.flash.comm.clear(namespace);
		},
		
		remove: function(key, namespace){
			if(!namespace){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}
			
			if(!this.isValidKey(namespace)){
				throw new Error("Invalid namespace given: " + namespace);
			}
			
			dojox.flash.comm.remove(key, namespace);
		},
		
		removeMultiple: function(/*array*/ keys, /*string?*/ namespace){ /*Object*/
			if(!this.isValidKeyArray(keys)){
				dojo.raise("Invalid key array given: " + keys);
			}
			if(!namespace){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}
			
			if(!this.isValidKey(namespace)){
				throw new Error("Invalid namespace given: " + namespace);
			}
			
			var metaKey = keys.join(",");
			dojox.flash.comm.removeMultiple(metaKey, namespace);
		},

		isPermanent: function(){
			return true;
		},

		getMaximumSize: function(){
			return dojox.storage.SIZE_NO_LIMIT;
		},

		hasSettingsUI: function(){
			return true;
		},

		showSettingsUI: function(){
			dojox.flash.comm.showSettings();
			dojox.flash.obj.setVisible(true);
			dojox.flash.obj.center();
		},

		hideSettingsUI: function(){
			// hide the dialog
			dojox.flash.obj.setVisible(false);
			
			// call anyone who wants to know the dialog is
			// now hidden
			if(dojo.isFunction(dojox.storage.onHideSettingsUI)){
				dojox.storage.onHideSettingsUI.call(null);	
			}
		},
		
		getResourceList: function(){ /* Array[] */
			// Dojo Offline no longer uses the FlashStorageProvider for offline
			// storage; Gears is now required
			return [];
		},
		
		/** Called when Flash and the page are finished loading. */
		_loaded: function(){
			// get available namespaces
			this._allNamespaces = this.getNamespaces();
			
			this.initialized = true;

			// indicate that this storage provider is now loaded
			dojox.storage.manager.loaded();
		},
		
		//	Called if the storage system needs to tell us about the status
		//	of a put() request. 
		_onStatus: function(statusResult, key, namespace){
		  //console.debug("onStatus, statusResult="+statusResult+", key="+key);
			var ds = dojox.storage;
			var dfo = dojox.flash.obj;
			
			if(statusResult == ds.PENDING){
				dfo.center();
				dfo.setVisible(true);
			}else{
				dfo.setVisible(false);
			}
			
			if(ds._statusHandler){
				ds._statusHandler.call(null, statusResult, key, null, namespace);		
			}
		}
	}
);

dojox.storage.manager.register("dojox.storage.FlashStorageProvider",
								new dojox.storage.FlashStorageProvider());

}

if(!dojo._hasResource["dojox.storage._common"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.storage._common"] = true;
dojo.provide("dojox.storage._common");



/*
  Note: if you are doing Dojo Offline builds you _must_
  have offlineProfile=true when you run the build script:
  ./build.sh action=release profile=offline offlineProfile=true
*/




// now that we are loaded and registered tell the storage manager to
// initialize itself
dojox.storage.manager.initialize();

}

if(!dojo._hasResource["dojox.storage"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.storage"] = true;
dojo.provide("dojox.storage");


}

if(!dojo._hasResource["dojox.rpc.OfflineRest"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.rpc.OfflineRest"] = true;
dojo.provide("dojox.rpc.OfflineRest");





// summary:
// 		Makes the REST service be able to store changes in local
// 		storage so it can be used offline automatically.
(function(){
	var Rest = dojox.rpc.Rest;
	var namespace = "dojox_rpc_OfflineRest";
	var loaded;
	var index = Rest._index;
	dojox.storage.manager.addOnLoad(function(){
		// now that we are loaded we need to save everything in the index
		loaded = dojox.storage.manager.available;
		for(var i in index){
			saveObject(index[i], i);
		}
	});
	var dontSave;
	function getStorageKey(key){
		// returns a key that is safe to use in storage
		return key.replace(/[^0-9A-Za-z_]/g,'_');
	}
	function saveObject(object,id){
		// save the object into local storage
		
		if(loaded && !dontSave && (id || (object && object.__id))){
			dojox.storage.put(
					getStorageKey(id||object.__id),
					typeof object=='object'?dojox.json.ref.toJson(object):object, // makeshift technique to determine if the object is json object or not
					function(){},
					namespace);
		}
	}
	function isNetworkError(error){
		//	determine if the error was a network error and should be saved offline
		// 	or if it was a server error and not a result of offline-ness
		return error instanceof Error && (error.status == 503 || error.status > 12000 ||  !error.status); // TODO: Make the right error determination
	}
	function sendChanges(){
		// periodical try to save our dirty data
		if(loaded){
			var dirty = dojox.storage.get("dirty",namespace);
			if(dirty){
				for (var dirtyId in dirty){
					commitDirty(dirtyId,dirty);
				}
			}
		}
	}
	var OfflineRest;
	function sync(){
		OfflineRest.sendChanges();
		OfflineRest.downloadChanges();
	} 
	var syncId = setInterval(sync,15000);
	dojo.connect(document, "ononline", sync);
	OfflineRest = dojox.rpc.OfflineRest = {
		turnOffAutoSync: function(){
			clearInterval(syncId);
		},
		sync: sync,
		sendChanges: sendChanges,
		downloadChanges: function(){
			
		},
		addStore: function(/*data-store*/store,/*query?*/baseQuery){
			// summary:
			//		Adds a store to the monitored store for local storage
			//	store:
			//		Store to add
			//	baseQuery:
			//		This is the base query to should be used to load the items for
			//		the store. Generally you want to load all the items that should be
			//		available when offline.
			OfflineRest.stores.push(store);
			store.fetch({queryOptions:{cache:true},query:baseQuery,onComplete:function(results,args){
				store._localBaseResults = results;
				store._localBaseFetch = args;
			}});
						
		}
	};
	OfflineRest.stores = [];
	var defaultGet = Rest._get;
	Rest._get = function(service, id){
		// We specifically do NOT want the paging information to be used by the default handler,
		// this is because online apps want to minimize the data transfer,
		// but an offline app wants the opposite, as much data as possible transferred to
		// the client side
		try{
			// if we are reloading the application with local dirty data in an online environment
			//	we want to make sure we save the changes first, so that we get up-to-date
			//	information from the server
			sendChanges();
			if(window.navigator && navigator.onLine===false){
				// we force an error if we are offline in firefox, otherwise it will silently load it from the cache
				throw new Error();
			}
			var dfd = defaultGet(service, id);
		}catch(e){
			dfd = new dojo.Deferred();
			dfd.errback(e);
		} 
		var sync = dojox.rpc._sync;
		dfd.addCallback(function(result){
			saveObject(result, service._getRequest(id).url);
			return result;			
		});
		dfd.addErrback(function(error){
			if(loaded){
				// if the storage is loaded, we can go ahead and get the object out of storage
				if(isNetworkError(error)){
					var loadedObjects = {};
					// network error, load from local storage
					var byId = function(id,backup){
						if(loadedObjects[id]){
							return backup;
						}
						var result = dojo.fromJson(dojox.storage.get(getStorageKey(id),namespace)) || backup;
						
						loadedObjects[id] = result;
						for(var i in result){
							var val = result[i]; // resolve references if we can
							id = val && val.$ref;
							if (id){
								if(id.substring && id.substring(0,4) == "cid:"){
									// strip the cid scheme, we should be able to resolve it locally
									id = id.substring(4);
								}
								result[i] = byId(id,val);
							}
						}
						if (result instanceof Array){
							//remove any deleted items
							for (i = 0;i<result.length;i++){
								if (result[i]===undefined){
									result.splice(i--,1);
								}
							}
						}
						return result;
					};
					dontSave = true; // we don't want to be resaving objects when loading from local storage
					//TODO: Should this reuse something from dojox.rpc.Rest
					var result = byId(service._getRequest(id).url);
					
					if(!result){// if it is not found we have to just return the error
						return error;
					}
					dontSave = false;
					return result;
				}
				else{
					return error; // server error, let the error propagate
				}
			}
			else{
				if(sync){
					return new Error("Storage manager not loaded, can not continue");
				}
				// we are not loaded, so we need to defer until we are loaded
				dfd = new dojo.Deferred();
				dfd.addCallback(arguments.callee);
				dojox.storage.manager.addOnLoad(function(){
					dfd.callback();
				});
				return dfd;
			}
		});
		return dfd;
	};
	function changeOccurred(method, absoluteId, contentId, serializedContent, service){
		if(method=='delete'){
			dojox.storage.remove(getStorageKey(absoluteId),namespace);
		}		
		else{
			// both put and post should store the actual object
			dojox.storage.put(getStorageKey(contentId), serializedContent, function(){
			},namespace);
		}
		var store = service && service._store;
		// record all the updated queries
		if(store){
			store.updateResultSet(store._localBaseResults, store._localBaseFetch);
			dojox.storage.put(getStorageKey(service._getRequest(store._localBaseFetch.query).url),dojox.json.ref.toJson(store._localBaseResults),function(){
				},namespace);
			
		}
		
	}
	dojo.addOnLoad(function(){
		dojo.connect(dojox.data, "restListener", function(message){
			var channel = message.channel;
			var method = message.event.toLowerCase();
			var service = dojox.rpc.JsonRest && dojox.rpc.JsonRest.getServiceAndId(channel).service;
			changeOccurred(
				method, 
				channel,
				method == "post" ? channel + message.result.id : channel,
				dojo.toJson(message.result),
				service
			);
			
		});
	});
	//FIXME: Should we make changes after a commit to see if the server rejected the change
	// or should we come up with a revert mechanism? 
	var defaultChange = Rest._change;
	Rest._change = function(method,service,id,serializedContent){
		if(!loaded){
			return defaultChange.apply(this,arguments);
		}
		var absoluteId = service._getRequest(id).url;
		changeOccurred(method, absoluteId, dojox.rpc.JsonRest._contentId, serializedContent, service);
		var dirty = dojox.storage.get("dirty",namespace) || {};
		if (method=='put' || method=='delete'){
			// these supersede so we can overwrite anything using this id
			var dirtyId = absoluteId;
		}
		else{
			dirtyId = 0;
			for (var i in dirty){
				if(!isNaN(parseInt(i))){
					dirtyId = i;
				}
			} // get the last dirtyId to make a unique id for non-idempotent methods
			dirtyId++;
		}
		dirty[dirtyId] = {method:method,id:absoluteId,content:serializedContent};
		return commitDirty(dirtyId,dirty);
	};
	function commitDirty(dirtyId, dirty){
		var dirtyItem = dirty[dirtyId];
		var serviceAndId = dojox.rpc.JsonRest.getServiceAndId(dirtyItem.id);
		var deferred = defaultChange(dirtyItem.method,serviceAndId.service,serviceAndId.id,dirtyItem.content);
		// add it to our list of dirty objects		
		dirty[dirtyId] = dirtyItem;
		dojox.storage.put("dirty",dirty,function(){},namespace);
		deferred.addBoth(function(result){
			if (isNetworkError(result)){
				// if a network error (offlineness) was the problem, we leave it 
				// dirty, and return to indicate successfulness
				return null;
			}
			// it was successful or the server rejected it, we remove it from the dirty list 
			var dirty = dojox.storage.get("dirty",namespace) || {};
			delete dirty[dirtyId];
			dojox.storage.put("dirty",dirty,function(){},namespace);
			return result;
		});
		return deferred;
	}
		
	dojo.connect(index,"onLoad",saveObject);
	dojo.connect(index,"onUpdate",saveObject);
	
})();

}

