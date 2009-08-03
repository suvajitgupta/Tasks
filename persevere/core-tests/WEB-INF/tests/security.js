/**
 * This tests Persevere's security system
 */
try{
	authenticate("full","access");
}catch(e){
	createUser("full","access");
	authenticate("full","access");
}
function mustFail(testFunc){
	try{
		testFunc();
	//TODO: the conditional catch should work:
//	}catch(e if e instanceof AccessError){
	}catch(e){
		return;
	}
	throw new Error("No exception was thrown where an exception was required");
}

var testObject, testCapability, partialAccessUser,partialAccessCapability,toBeDeleted;
tests([
	function fullAccess(){
		// make sure we have full access to the system
		var a = Class.instances[0].name;
		TestClass.instances[0];
		testObject = new TestClass({"name":'securityTest1'});
		commit();
		testObject.numberProp = 343;
	},
	function failedLogin(){
		mustFail(function(){
			authenticate("nonexistentuser","wrongpassword");
		});
		mustFail(function(){
			authenticate("full","wrongpassword");
		});
	},
	function readOnlyAccess(){
		// make sure we have read only access to the system
		authenticate(null,null);
		var a = Class.instances[0].name;
		TestClass.instances[0];
		a = testObject.numberProp;
		mustFail(function(){
			testObject.numberProp = 555;
		});
		mustFail(function(){
			new TestClass({"name":'shouldBeDenied'});
		});
		mustFail(function(){
			new Capability;
		});
	},
	function createTestUser(){
		// make test more fine-grained access to the system
		try{
			partialAccessUser = authenticate("partial","access");
		}catch(e){
			createUser("partial","access");
			partialAccessUser = authenticate("partial","access");
		}
		mustFail(function(){
			new Capability;
		});
		authenticate("full","access");
		partialAccessCapability = new Capability({members:[partialAccessUser], append:[TestClass.instances],write:[TestSchema],limited:[Capability]});
		commit();
		authenticate("partial","access");
		var a = Class.instances[0].name;
		TestClass.instances[0];
		a = testObject.numberProp;
		toBeDeleted = new TestClass({"name":'shouldBeAccepted'});
		partialAccessUser.myOwnNumber = 2;
		partialAccessUser.myOwnNumber = 3;
		commit();
		mustFail(function(){
			Capability.instances[0].members = [];
		});
		mustFail(function(){
			testObject.numberProp = 777;
		});
		mustFail(function(){
			TestSchemaRequired.foo = "bar";
		});
		if(TestSchema.instances[0]){
			TestSchema.instances[0].stringProp = "ddd";
		}
		mustFail(function(){
			// this would be a big security violation
			partialAccessCapability.write.push(Class);
		});
	},
	function changeAccessLevel(){
		authenticate("full","access");
		partialAccessCapability.write.push(TestClass.instances);
		commit();
		authenticate("partial","access");
		testObject.numberProp = 222;
		
	},
	function changeMembers(){
		authenticate("full","access");
		partialAccessCapability.members[0] = null; // make it for public instead
		commit();
		authenticate("partial","access");
		testObject.numberProp = 444;
		authenticate(null,null);
		testObject.numberProp = 555;
	},
	function removeCapability(){
		authenticate("full","access");
		remove(partialAccessCapability);
		commit();
		authenticate("partial","access");
		mustFail(function(){
			testObject.numberProp = 4444;
		});
		authenticate(null,null);
		mustFail(function(){
			testObject.numberProp = 53355;
		});
	}
	
	
]);
authenticate("full","access");
if(typeof toBeDeleted != 'undefined'){
	remove(toBeDeleted);
}
if(typeof testObject != 'undefined'){
	remove(testObject);
}
