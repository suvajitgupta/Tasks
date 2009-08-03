tests([
	function arrays(){
		assert(['a','b','c'].length == 3);
		assert(['a','b','c'][1] == 'b');
		assert(new Array(4).length == 4);
		assert([5].length == 1);
		assert([].length == 0);
	},
	function objects(){
		var obj = ({foo:"bar"});
		assert(obj.foo == "bar");
		var arr = [];
		for(var i in obj){
			arr.push(i);
		}
		assert(arr.length == 1);
		assert(arr[0] == "foo");
	}
	
]);

