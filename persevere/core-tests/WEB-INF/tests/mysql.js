/**
 * This will test MySQL if the drivers are setup correctly
 */
if(typeof Project != 'undefined'){
tests([
	function loadAndCheckStateMySQL(){
		var persistenceTestObject = load("Project/[?name='mysqlTest1']")[0];
		if(!persistenceTestObject){
			console.log("MySQL test data has not been created, please run tests again");
			return;
		}
				
//		assert(persistenceTestObject.tasks.length == 1);
	},
	function saveStateMySQL(){
		var persistenceTestObjects = load("Project/[?name='mysqlTest1']");
		persistenceTestObjects.forEach(function(object){
			object["delete"]();
		});
		var persistenceTestObject = new Project({"name":'mysqlTest1'});
		new Project;
	},
	function changeStateMySQL(){
		var persistenceTestObject = load("Project/[?name='mysqlTest1']")[0];
		persistenceTestObject.name = "something else";
		commit();
		persistenceTestObject.name = "mysqlTest1";
	}
	
]);
}
