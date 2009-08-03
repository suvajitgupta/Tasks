//dojox.io.xhrWindowNamePlugin("http://www.persvr.org");
//dojox.io.xhrPlugins.addProxy("/proxy?url=");
var persevereServerUrl = "http://www.persvr.org";
	dojox.io.xhrPlugins.register(
		"windowNamePersevere",
		function(method,args){
			 return args.sync !== true && 
				(args.url.substring(0,persevereServerUrl.length) == persevereServerUrl);
		},
		function(method,args){
			if(!(method=='POST' || method=='GET')){
				args.url += "?http-method=" + method;
				if(method=='PUT'){
					args.content = {"http-content":args.putData};
				}
				method = "POST";
			}else if(method=='POST' && args.postData){
				args.content = {"http-content":args.postData};
			}
			var dfd = dojox.io.windowName.send(method, args); // use the windowName transport
			dfd.addCallback(function(result){
				return dojo.fromJson(result);
			});
			return dfd;
		});
test(function oldCreateAndDeleteTable(){
	dojo.xhr("PUT",{url:"/Animal",putData:'{"extends":"Object"}'},true).addCallback(function(){
		dojo.xhr("POST",{url:"/Animal",postData:'{"foo":"bar"}'},true).addCallback(function(){
			dojo.xhr("DELETE",{url:"/Animal"}).addCallback(function(){
				passed();
			});
		});
	});
},true);
test(function createAndDeleteTable(){
	dojo.xhr("POST",{url:"/Class/",putData:'{"id":"Animal","extends":{"$ref":"Object"}}'},true).addCallback(function(){
		dojo.xhr("POST",{url:"/Animal",postData:'{"foo":"bar"}'},true).addCallback(function(){
			dojo.xhr("DELETE",{url:"/Class/Animal"}).addCallback(function(){
				passed();
			});
		});
	});
},true);
pjs.loadClasses();
if(window.TestTable){
	dojo.xhr("DELETE",{url:"/Class/TestTable",sync: true});	
}

dojo.xhr("POST",{url:"/Class/",sync: true, putData:'{"id":"TestTable","extends":{"$ref":"Object"}}'},true);	
pjs.loadClasses();
test(function createSimple(){
	var testItem = new TestTable({firstName:"unit",lastName:"test"});
	pjs.commit();
	TestTable.load("[?lastName='test']").addCallback(function(results){
		if(results.length==0){
			failed();
		}
		//pjs.remove(testItem);
		pjs.commit();
		passed();
	});
});
test(function testDecimal(){
	var decimal = "3.23432958239034323458325983205832";
	dojo.xhr("PUT",{url:"/TestTable/1.num",putData:decimal},true).addCallback(function(){
		dojo.xhr("GET",{url:"/TestTable/1.num"}).addCallback(function(response){
			assert(response==decimal);
			passed();
		});
	});
});
test(function testUnicode(){
	var unicode = "\"uni \u0259\"";
	dojo.xhr("PUT",{url:"/TestTable/1.unicode",putData:unicode},true).addCallback(function(){
		dojo.xhr("GET",{url:"/TestTable/1.unicode"}).addCallback(function(response){
			assert(response==unicode);
			passed();
		});
	});
});
test(function testTransactionIsolation(){
	dojo.xhr("PUT",{url:"/TestTable/1.num",putData:"333"},true).addCallback(function(){
		dojo.xhr("PUT",{url:"/TestTable/1.num",putData:"444", headers:{"Transaction":"open"}},true).addCallback(function(){
			dojox.rpc.Client.clientId = (Math.random() + '').substring(2,14) + (Math.random() + '').substring(2,14);
			dojo.xhr("GET",{url:"/TestTable/1.num"}).addCallback(function(response){
				assert(response=="333");
				passed();
			});
		});
	});
});
test(function createComplex(){
	var testItem = new TestTable({firstName:"unit",lastName:"complex test", negInfinite:-Infinity, nan: NaN, sub:{num:3,subsub:{str:"foo"}}});
	pjs.commit();
	pjs.set(testItem,"circ",testItem);
	pjs.set(testItem,"multipleRef",testItem.sub);
	pjs.commit();
	pjs.load("/TestTable/[?lastName='complex test' & firstName!='not unit']",function(results){
		assert(results.length!=0);
		testItem = results[0];
		assert(testItem.circ == testItem);
		assert(testItem.multipleRef == testItem.sub);
		assert(testItem.sub.subsub.str == "foo");
		assert(testItem.negInfinite == -Infinity);
		assert(typeof testItem.nan == 'number' && isNaN(testItem.nan));
		pjs.remove(testItem);
		pjs.commit();
		passed();
	});
});
test(function fileUpload(){
	var testItem = new TestTable({firstName:"unit",lastName:"upload"});
	pjs.commit();
	dojo.xhr("PUT",{
		url:testItem.__id + ".aFile",
		headers:{"Content-Type":"application/test"},
		putData:"some fake binary data", 
		sync:true
	},true);
	dojo.xhr("PUT",{
		url:testItem.__id,
		headers:{"Content-Type":"text/test"},
		putData:"some fake text data", 
		sync:true
	},true);
	dojo.xhr("GET",{
		url:testItem.__id,
		headers:{"Accept":"text/test"},
		sync:true
	}).addCallback(function(result){
		assert(result == "some fake text data"); 
	});
	dojo.xhr("GET",{
		url:testItem.__id + ".aFile",
		sync:true
	}).addCallback(function(result){
		assert(result == "some fake binary data"); 
	});
	dojo.xhr("GET",{
		url:testItem.__id,
		sync:true
	}).addCallback(function(result){
		assert(typeof dojo.fromJson(result) == 'object'); 
	});
	dojo.xhr("DELETE",{
		url:testItem.__id,
		sync:true
	});
	
	passed();
});
test(function directFileUpload(){
	var testItem = new TestTable({firstName:"unit",lastName:"upload"});
	pjs.commit();
	var deferred = dojo.xhr("POST",{
		url:"/File/",
		headers:{"Content-Type":"application/test"},
		putData:"some fake binary data", 
		sync:true
	},true);
	var location = deferred.ioArgs.xhr.getResponseHeader("Location");
	dojo.xhr("GET",{
		url:location,
		sync:true
	}).addCallback(function(result){
		assert(result == "some fake binary data"); 
	});
	dojo.xhr("DELETE",{
		url:location,
		sync:true
	});
	
	passed();
});
test(function schemaCheck(){
	dojo.xhr("PUT",{
		url:"/Class/TestTable.properties",
		putData:'{firstName:{type:"string"},age:{type:"number",optional:true}}'},true).addCallback(function(){
			dojo.xhr("PUT",{
				url:"/TestTable/1",
				putData:'{firstName:"John",lastName:"Doe",age:"33"}'},true).addErrback(function(){
					// should throw an error because the age is a string
					dojo.xhr("PUT",{
						url:"/Class/TestTable.properties",
						putData:'{firstName:{type:"string"},age:{type:"number",onSet:function(value){return Math.round(value)},optional:true}}'},true).addCallback(function(){
							dojo.xhr("PUT",{
								url:"/TestTable/1",
								putData:'{firstName:"John",lastName:"Doe",age:33.7}', handleAs:"json"},true).addCallback(function(results){
									// should work because the age is a number
									assert(results.age==34);
									passed();
								});
						});
				});
		});
});
test(function conditionalSave(){
	dojo.xhr("PUT",{
		url:"/TestTable/1",
		putData:'{firstName:"John",lastName:"Doe",age:33}'},true).addCallback(function(){
			dojo.xhr("PUT",{
				url:"/TestTable/1",
				putData:'{firstName:"John",lastName:"Doe",age:33}',
				headers:{"If-Condition":"/TestTable/1.firstName='not this'"}},true).addErrback(function(){
					// should fail the condition
					dojo.xhr("PUT",{
						url:"/TestTable/1",
						putData:'{firstName:"John",lastName:"Doe",age:33}',
						headers:{"If-Condition":"/TestTable/1.firstName='John'"}},true).addCallback(function(){
							// should pass the condition
							passed();
						});					
				});
		});
});

test(function queryTest(){
	dojo.xhr("PUT",{
		url:"/TestTable/1",
		putData:'{firstName:"Jeremy",lastName:"Doe",age:33}'
	},true).addCallback(function(result){
		dojo.xhr("GET",{url:"/TestTable/[?firstName='Jeremy']", handleAs:"json"}).addCallback(function(result){
			assert(result.length > 0);
			for (var i =0; i < result.length; i++){
				assert(result[i].firstName=="Jeremy");
			}
			passed();
		});
			
	});
	
});
test(function queryTest2(){
	dojo.xhr("PUT",{
		url:"/TestTable/1",
		handleAs:"json",
		putData:'{firstName:"Jeremy",lastName:"Doe",age:33}'
	},true).addCallback(function(result){
		dojo.xhr("GET",{url:"/TestTable/[?firstName='J*' & lastName~'doe']", handleAs:"json"}).addCallback(function(result){
			assert(result.length > 0);
			for (var i =0; i < result.length; i++){
				assert(result[i].firstName.charAt(0)=="J");
				assert(result[i].lastName.toLowerCase()=="doe");
			}
			passed();
		});
			
	});
	
});
test(function queryTest3(){
	dojo.xhr("PUT",{
		url:"/TestTable/1",
		putData:'{firstName:"Jeremy",lastName:"Doe",age:33}'
	},true).addCallback(function(result){
		dojo.xhr("GET",{url:"/TestTable/[?@['firstName']='J*']", handleAs:"json"}).addCallback(function(result){
			assert(result.length > 0);
			for (var i =0; i < result.length; i++){
				assert(result[i].firstName.charAt(0)=="J");
			}
			passed();
		});
			
	});
	
});
test(function sortTest(){
	dojo.xhr("POST",{url:"/TestTable/",postData:"{firstName:'foo',lastName:'bar',age:33}", sync:true},true);
	dojo.xhr("POST",{url:"/TestTable/",postData:"{firstName:'foo',lastName:'zzz',age:33}", sync:true},true);
	dojo.xhr("GET",{url:"/TestTable/[/firstName]", handleAs:"json"}).addCallback(function(result){
			var lastFirstName="";
			for (var i =0; i < result.length; i++){
				assert(lastFirstName <= result[i].firstName);
			}
			passed();
		});
});
test(function sortTest2(){
	dojo.xhr("POST",{url:"/TestTable/",postData:"{firstName:'foo',lastName:'bar',age:33}", sync:true},true);
	dojo.xhr("POST",{url:"/TestTable/",postData:"{firstName:'foo',lastName:'zzz',age:33}", sync:true},true);
	dojo.xhr("GET",{url:"/TestTable/[/firstName,/lastName]", handleAs:"json"}).addCallback(function(result){
			var lastFirstName="";
			for (var i =0; i < result.length; i++){
				assert(lastFirstName <= result[i].firstName);
			}
			passed();
		});
});
test(function deleteReferencesTest(){
	var postDfd = dojo.xhr("POST",{url:"/TestTable/",postData:"{firstName:'foo',lastName:'bar',age:33}"},true)
	postDfd.addCallback(function(){
		var newLocation = postDfd.ioArgs.xhr.getResponseHeader("Location");	
		var newId = newLocation.match(/[^\/]*$/)[0];
		dojo.xhr("PUT",{url:"/TestTable/1.references",handleAs:"json",putData:'[{$ref:"' + newId + '"}]'},true).addCallback(function(result){
			assert(result.length==1);
			dojo.xhr("DELETE",{url:"/TestTable/" + newId}).addCallback(function(response){
				dojo.xhr("GET",{url:"/TestTable/1",handleAs:"json"}).addCallback(function(result){
					assert(result.references.length==0);
					passed();
				});
			});
		});
	});
	
});
test(function createUserAndGrantAccess(){
	dojo.xhr("POST",{
		url:"/Class/User",
		postData:'{method:"createUser",params:["unit","test"],id:"callid"}',
		sync:true},true);
	dojo.xhr("POST",{
		url:"/Class/User",
		postData:'{method:"createUser",params:["unit2","test"],id:"callid"}',
		sync:true},true);
	dojo.xhr("POST",{
		url:"/Class/User",
		postData:'{method:"authenticate",params:["unit","test"],id:"callid"}',
		sync:true},true);
	dojo.xhr("POST",{
		url:"/Class/User",
		postData:'{method:"grantAccess",params:["unit2",ref("/TestTable/"),"write"],id:"callid"}',
		sync:true},true);
	dojo.xhr("POST",{
		url:"/Class/User",
		postData:'{method:"authenticate",params:["unit2","test"],id:"callid"}',
		sync:true},true);
	var fail = false;
	dojo.xhr("POST",{
		url:"/Customer/",
		postData:'{name:"should be denied"}',
		sync:true},true).addCallback(function(){
			console.log("first blog post should be denied");
			fail = true;
		});
	dojo.xhr("POST",{
		url:"/TestTable/",
		postData:'{firstName:"should be accepted"}',
		sync:true},true).addErrback(function(){
			console.log("first testItem post should be accepted");
			fail = true;
		});
	dojo.xhr("POST",{
		url:"/Class/User",
		postData:'{method:"authenticate",params:[null,null],id:"callid"}',
		sync:true},true);
	dojo.xhr("POST",{
		url:"/TestTable/",
		postData:'{firstName:"should be denied"}',
		sync:true},true).addCallback(function(){
			console.log("second testItem post should be denied");
			fail = true;
		});
	if(fail){
		failed();
	}else{
		passed();
	}
}, true);
 




