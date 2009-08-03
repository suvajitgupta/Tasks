/**
 * This test creates a new object and then when the test is restarted the 
 * test will check to make sure it is in the same state
 */
tests([
	function loadAndCheckState(){
		var persistenceTestObject = load("TestClass/[?name='persistenceTest1']")[0];
		if(!persistenceTestObject){
			console.log("Persistence test data has not been created, please run tests again");
			return;
		}
				
		assertEqual(persistenceTestObject.arrayProp.length, 3);
		assertEqual(persistenceTestObject.arrayProp[2], 'c');
		assertEqual(persistenceTestObject.numberProp, 3.33);
		assertEqual(persistenceTestObject.stringProp, "testing");
		assertEqual(persistenceTestObject.nullProp, null);
		assertEqual(persistenceTestObject.objectProp.foo, "bar");
		assertEqual(persistenceTestObject.objectProp.self, persistenceTestObject);
		assertEqual(typeof persistenceTestObject.nanProp, "number");
		assert(isNaN(persistenceTestObject.nanProp));
	},
	function saveState(){
		var persistenceTestObjects = load("TestClass/[?name='persistenceTest1']");
		persistenceTestObjects.forEach(function(object){
			remove(object);
		});
		var persistenceTestObject = new TestClass({"name":'persistenceTest1',numberProp:3.33});
		persistenceTestObject.arrayProp = ['a'];
		persistenceTestObject.objectProp = {self:persistenceTestObject};
		persistenceTestObject.stringProp = "testing";
		persistenceTestObject.nanProp = NaN;
		persistenceTestObject.nullProp = null;
		commit();
		assertEqual(persistenceTestObject.arrayProp.length, 1);
		assertEqual(persistenceTestObject.arrayProp[0], 'a');
		persistenceTestObject.arrayProp.push('b');
		commit();
		assertEqual(persistenceTestObject.arrayProp.length, 2);
		assertEqual(persistenceTestObject.arrayProp[1], 'b');
		
		persistenceTestObject.arrayProp.push('c');
		persistenceTestObject.arrayProp[0] = 'd';
		persistenceTestObject.objectProp.foo = "bar";
		commit();
		assertEqual(persistenceTestObject.arrayProp.length, 3);
		assertEqual(persistenceTestObject.arrayProp[2], 'c');
	},
	function changeObjectState(){
		var persistenceTestObject = load("TestClass/[?name='persistenceTest1']")[0];
		assertEqual(typeof persistenceTestObject.foo, "undefined");		
		persistenceTestObject.foo = "bar";
		assertEqual(persistenceTestObject.foo, "bar");
		commit();
		assertEqual(persistenceTestObject.foo, "bar");
		delete persistenceTestObject.foo;
		assertEqual(typeof persistenceTestObject.foo, "undefined");
		commit();
		assertEqual(typeof persistenceTestObject.foo, "undefined");
	},
	function changeArrayState(){
		var persistenceTestObject = load("TestClass/[?name='persistenceTest1']")[0];
		persistenceTestObject.arrayProp.splice(1,1);
		assertEqual(persistenceTestObject.arrayProp.length, 2);
		assertEqual(persistenceTestObject.arrayProp[1], 'c');		
		commit();
		assertEqual(persistenceTestObject.arrayProp.length, 2);
		assertEqual(persistenceTestObject.arrayProp[1], 'c');
		persistenceTestObject.arrayProp[2] = 'c';
		persistenceTestObject.arrayProp[1] = 'b';
		assertEqual(persistenceTestObject.arrayProp.length, 3);
		assertEqual(persistenceTestObject.arrayProp[2], 'c');
		commit();
		assertEqual(persistenceTestObject.arrayProp.length, 3);
		assertEqual(persistenceTestObject.arrayProp[2], 'c');
	},
	function queryById(){
		var persistenceTestObject = load("TestClass/[?name='persistenceTest1']")[0];
		var relookup = load("TestClass/[?id=" + persistenceTestObject.id.substring(persistenceTestObject.id.indexOf('/')+1) + "]")[0];
		assertEqual(relookup, persistenceTestObject);
		relookup.self = relookup; 
		commit();
		var relookup = load("TestClass/[?self=/" + persistenceTestObject.id + "]")[0];
		assertEqual(relookup, persistenceTestObject);
	}
	
]);

