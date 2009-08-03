/**
 * This test checks to make sure transactions are working properly
 */
var transactionTestObjects = load("TestClass/[?name='transactionTest1']");
transactionTestObjects.forEach(function(object){
	remove(object);
});
commit(); 
tests([
	function checkTransactionIsolation(){
		assert(load("TestClass/[?name='transactionTest1']").length == 0);
		var transactionTestObject = new TestClass({"name":'transactionTest1',numberProp:3.33, booleanProp: true});
		var threadError;
		commit();
		function testInitialState(){
			assert(transactionTestObject.stringProp == undefined);
			assert(transactionTestObject.numberProp == 3.33);
			assert(typeof transactionTestObject.booleanProp == "boolean");
		}
		var thread = java.lang.Thread(function () {
			try{
				java.lang.Thread.sleep(50);
				testInitialState();
/*				java.lang.Thread.sleep(100);
				assert(transactionTestObject.stringProp == "test");
				assert(transactionTestObject.numberProp == 2);*/
			}catch(e){
				threadError = e;
			}
		});
		transactionTestObject.stringProp = "test";
		transactionTestObject.numberProp = 2;
		delete transactionTestObject.booleanProp;
		//java.lang.Thread.sleep(100);
		//commit();
		thread.join();
		if(threadError){
			throw threadError;
		}
		rollback();
		testInitialState();		
	},
	function checkQueryForTransaction(){
		// this level of isolation is not implemented yet	
	}
	
]);

