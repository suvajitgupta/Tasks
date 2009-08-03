tests([
	function environment(){
		assertEqual(String.type,"string");
	},
	function jslibLoaded(){
		assertEqual(coreTests,true);
	},
	function testExports(){
		assertEqual(require("increment").increment(4), 5);
		assertEqual(require("math").add(4,3), 7);
	},
	function containment(){
		assertEqual(typeof add,"undefined");
	}
	
]);

