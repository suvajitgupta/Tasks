test(function jsonp(){
	dojo.io.script.get({
		url:"/TestTable/",
		callbackParamName:"callback"
	}).addCallback(function(results){
		assert(results.length>0);
		passed();
	});
});

var remoteTestTableStore = new dojox.data.PersevereStore({target:"http://www.persvr.org/Customer/",schema:{prototype:{sayHello:function(){alert('hello');}}}});
test(function createObjectWithRemote(){
	var newTestTable = new TestTable({firstName:"test",lastName:"testTable"});
	
	remoteTestTableStore.fetchItemByIdentity({identity:"24",onItem:function(item){
//			item.sayHello();
		newTestTable.remote = item;
		remoteTestTableStore.setValue(item,"firstName", "Name with a number " + Math.random());
		remoteTestTableStore.save();
		passed();
	}});
});
test(function getObjectWithRemote(){
	testTableStore.fetchItemByIdentity({identity:"5",onItem:function(item){
		testTableStore.loadItem({item:item.remote,onItem:function(remote){
			console.log("remote", remote);
		}});
	}});
});
	
