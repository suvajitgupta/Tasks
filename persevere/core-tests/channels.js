test(function channelsNotification(){
	var randomName = "Random"+Math.random();
	dojo.xhr("PUT",{
		url:"/Class/TestTable.prototype", sync :true,
		putData:"{putLater:function(name){var self=this; setTimeout(function(){self.firstName = name;},100);}}"},true);
	dojox.cometd.RestChannels.defaultInstance.url = "/channels";
	var testTableStore = new dojox.data.PersevereStore({target:"/TestTable"});
	var connectId = dojo.connect(testTableStore,"onSet",function(obj, name, oldValue, value){
		if(name == 'firstName'){
			assert(value==randomName);
			dojo.disconnect(connectId);
			passed();
		}
	});
	function sendRPC(){
		dojo.xhr("POST",{
			url:"/TestTable/1",
			putData:'{id:"23532", method:"putLater", params:["' + randomName + '"]}'},true);
	}
	if(window.subscribed){
		sendRPC();
	}else{
		subscribed = true;
		testTableStore.fetch({onComplete:sendRPC});
	}
});
test(function channelsNotificationWithQuery(){
	var randomName = "Random"+Math.random();
	dojo.xhr("PUT",{
		url:"/Class/TestTable.prototype", sync :true,
		putData:"{putLater:function(name){var self=this; setTimeout(function(){self.firstName = name;},100);}}"},true);
	dojox.cometd.RestChannels.defaultInstance.url = "/channels";
	var testTableStore = new dojox.data.PersevereStore({target:"/TestTable"});
	var connectId = dojo.connect(testTableStore,"onSet",function(obj, name, oldValue, value){
		if(name == 'firstName'){
			assert(value==randomName);
			dojo.disconnect(connectId);
			passed();
		}
	});
	function sendRPC(){
		dojo.xhr("POST",{
			url:"/TestTable/1",
			putData:'{id:"23532", method:"putLater", params:["' + randomName + '"]}'},true);
	}
	if(window.subscribed){
		sendRPC();
	}else{
		subscribed = true;
		testTableStore.fetch({onComplete:sendRPC});
	}
});
