tests([
	function serializeAndParseJSON(){
		var map = new java.util.HashMap();
		map.put("foo","bar");
		var json = org.persvr.util.JSON.serialize(map);
		assert(org.persvr.util.JSON.parse(json).get("foo") == "bar");
	}
]);

