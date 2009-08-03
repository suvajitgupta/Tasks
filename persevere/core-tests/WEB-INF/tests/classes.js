tests([
	function initializeMethod(){
		var newTest = new TestClass({stringProp:"foo"}, 2);
		assert(newTest.arrayProp instanceof Array);
		assertEqual(newTest.checkDefault, "bar");
		assertEqual(newTest.second, 2);
	},
	function instanceMethod(){
		assertEqual(new TestClass({stringProp:"foo"}).instanceMethod(4), "4foo");
	},
	function verifyAncestorInitialized(){
	  var tsr = new TestSchemaRequired({numberProp:2});
		assertEqual(tsr.ancestor, "initialized");
		assertEqual(tsr.child, "initialized");
	},

	
]);

