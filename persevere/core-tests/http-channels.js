function stateChangeHandler(xhr,name) {
	xhr.onreadystatechange=function() {
		log(name + " readyState " + xhr.readyState); 
	}
}
var put;
function whenModifiedAfter() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET","/root.name",true);
	xhr.setRequestHeader("Subscribe","now");
	xhr.onreadystatechange=function() {
		if (xhr.readyState == 4) {
			if (xhr.status != 202) {
				failed("Failed to receive a 202 response");
			}
			if (put) {
				if (xhr.responseText != put) {
					failed("response does not match put");
				}
				else
					passed();
			}
			else
				failed("Received a response prior to the put");
		}
	}
	xhr.send(null);
	putName();
}
function putName() {
	setTimeout(function() {
		//alert('doign put');
		var xhr = new XMLHttpRequest();
		xhr.open("PUT","/root.name",true);
		put = "\"Name " + Math.random() + "\"";
		xhr.send(put);
	},500);
	
}
function httpChannels() {
	HttpChannels.startup();
	function callback(message) {
		log("message " + message.channel + " body " + message.body);		
	}
	put = null;
	HttpChannels.get("/root.name",{callback:function(message) {
		log("initial name " + message.body);
		if (put) {
			if (message.responseText != put) {
				failed("response does not match put");
			}
			else
				passed();
		}
		else {
			put = true;
			putName();
		}
		
	}});
	HttpChannels.subscribe("/root",{callback:callback});
	HttpChannels.subscribe("/root.groups",{callback:callback});
	
}
