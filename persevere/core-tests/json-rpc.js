test(function jsonRpc(){
	dojo.xhr("PUT",{
		url:"/Class/TestTable.prototype",
		putData:"{add:function(a,b){this.lastOp = {sum:a+b,diff:a-b};return a + b;}}"},true).addCallback(function(){
			dojo.xhr("POST",{
				url:"/TestTable/1",
				postData:'{id:"call1",method:"add",params:[5,3]}',
				handleAs:"json"
			},true).addCallback(function(response){
				assert(response.result==8);
				dojo.xhr("GET",{url:"/TestTable/1",handleAs:"json"}).addCallback(function(response){
					assert(response.lastOp.sum==8);
					assert(response.lastOp.diff==2);
					passed();
				});
			});
		});
});
test(function schemaChange(){
	function schemaChangeTestFunction(){
		if(!TestTable.properties){
			TestTable.properties = {};
		}
		TestTable.properties.num = String;
		commit();
		assert(typeof this.num == 'string');
		TestTable.properties.num = {type:"number",optional:true};
		commit();
		assert(typeof this.num == 'number');
		return true;
	}
	var deferred = dojo.xhr("POST",{
		url:"/TestTable/",
		postData:'{num:444}',
		sync:true
	},true);
	var location = deferred.ioArgs.xhr.getResponseHeader("Location");
	dojo.xhr("PUT",{
		url:"/Class/TestTable.prototype", sync: true,
		putData:'{schemaChange:' + schemaChangeTestFunction + '}'},true);
	dojo.xhr("POST",{
		url:location, handleAs: 'json',
		postData:'{id:"2353", method:"schemaChange", params:[]}'},true).addCallback(function(result){
			if(result.result){
				passed();
			}else{
				failed();
			}
		});;
		
});


test(function jsonRpcTyped(){
	dojo.xhr("PUT",{
		url:"/Class/TestTable.prototype",
		putData:"{add:function(a,b){try{this.add('a string',true);return 'no error';}catch(e){return 'type error';}}}"},true).addCallback(function(){
			dojo.xhr("PUT",{
				url:"/Class/TestTable.methods",
				putData:'{add:{parameters:[{type:"number"},{type:"integer"}],returns:{type:["number","string"]}}}'},true).addCallback(function(){
					dojo.xhr("POST",{
					url:"/TestTable/1",
					postData:'{id:"call1",method:"add",params:[5,3]}',
					handleAs:"json"
				},true).addCallback(function(response){
					assert(response.result=="type error");
					passed();
				});
			});
		});
});

function serverSideTest(func){
	var testFunc = function(){
		dojo.rawXhrPut({
			url:"/Class/TestTable.testFunc",
			sync:true,
			putData: func.toString(),
			handleAs: 'json'
		});
		dojo.xhr("POST",{
			url:"/Class/TestTable", handleAs: 'json',
			postData:'{id:"2351", method:"testFunc", params:[]}'},true).addCallback(function(result){
				if(result.result){
					passed();
				}else{
					failed();
				}
			});
		
	};
	testFunc.name = func.name;
	test(testFunc);
}

serverSideTest(function emptyObject(){
	var NewClass = new Class();
	commit();
	var test = new NewClass();
	commit();
	console.log("Created new empty object, testing to see if it shows up in a query")
	return NewClass.instances[NewClass.instances.length-1] == test;
});