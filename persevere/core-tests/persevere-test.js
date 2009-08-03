var testObject;
test(function createObject(){
	testObject = new TestTable({firstName:"testing pjs"});
	pjs.commit(function(){
		assert(pjs.get(testObject,"firstName") == "testing pjs");
		pjs.set(testObject, "numberProp", 33);
		pjs.commit(function(){
			passed();
		});
	});
});
test(function loadObject(){
	pjs.load(pjs.getId(testObject), function(loadedTestObject){
		assert(pjs.get(loadedTestObject, "firstName") == "testing pjs");
		assert(pjs.get(loadedTestObject, "numberProp") == 33);
		pjs.set(testObject, "booleanProp", true);
		pjs.commit(function(){
			passed();	
		});
	});
});
test(function loadObject2(){
	pjs.load(pjs.getId(testObject), function(loadedTestObject){
		assert(pjs.get(loadedTestObject, "booleanProp") === true);
		pjs.remove(loadedTestObject);
		pjs.commit(function(){
			passed();	
		});
	});
});
test(function deletedObject(){
	pjs.load(pjs.getId(testObject), function(loadedTestObject){
		passed();
	});
});
