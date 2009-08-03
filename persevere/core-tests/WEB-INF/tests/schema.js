function mustFailOnCommit(testFunc){
	try{
		testFunc();
		commit();
	}catch(e){
		return;
	}
	throw new Error("No exception was thrown where an exception was required");
}

tests([
	function emptyAllowed(){
		new TestSchema({});
	},
	function stringType(){
		new TestSchema({stringProp:"foo"});
	},
	function stringTypeFailure(){
		mustFailOnCommit(function(){
			new TestSchema({stringProp:44});
		});
	},
	function stringLength(){
		new TestSchema({stringLength:"foobar"});
	},
	function stringLengthFailure1(){
		mustFailOnCommit(function(){
			new TestSchema({stringLength:"foo"});
		});
	},
	function stringLengthFailure2(){
		mustFailOnCommit(function(){
			new TestSchema({stringLength:"foobarbazfoo"});
		});
	},
	function stringPattern(){
		new TestSchema({stringPattern:"sssfoo33"});
	},
	function stringPatternFailure1(){
		mustFailOnCommit(function(){
			new TestSchema({stringPattern:"foo"});
		});
	},
	function enumProp(){
		new TestSchema({"enum":"female"});
	},
	function enumPropFailure(){
		mustFailOnCommit(function(){
			new TestSchema({"enum":"unisex"});
		});
	},
	function numberType(){
		new TestSchema({numberProp:33.33});
	},
	function numberTypeFailure(){
		mustFailOnCommit(function(){
			new TestSchema({numberProp:"not a num"});
		});
	},
	function readonlyFailure(){
		var test = new TestSchema({readonly:1});
		commit();
		mustFailOnCommit(function(){
			test.readonly = 4;
		});
	},
	function additionalProperty(){
		var test = new TestSchema({foobar:"a string"});
	},
	function additionalPropertyFailure(){
		mustFailOnCommit(function(){
			new TestSchema({foobar:44});
		});
	},
	function defaultNumber(){
		assert((new TestSchema({})).defaultNumberProp == 3);
	},
	function numberMinMax(){
		new TestSchema({numberMinMax:33.33});
	},
	function numberMinMaxFailure1(){
		mustFailOnCommit(function(){
			new TestSchema({numberMinMax:0.2});
		});
	},
	function numberMinMaxFailure2(){
		mustFailOnCommit(function(){
			new TestSchema({numberMinMax:200});
		});
	},
	function integerType(){
		new TestSchema({integerProp:33});
	},
	function integerTypeFailure(){
		mustFailOnCommit(function(){
			new TestSchema({integerProp:44.222});
		});
	},
	function booleanType(){
		new TestSchema({booleanProp:true});
	},
	function booleanTypeFailure(){
		mustFailOnCommit(function(){
			new TestSchema({booleanProp:44.222});
		});
	},
	function objectType(){
		new TestSchema({objectProp:{foo:"bar"}});
	},
	function objectTypeFailure(){
		mustFailOnCommit(function(){
			new TestSchema({objectProp:44.222});
		});
	},
	function arrayType(){
		new TestSchema({arrayProp:["bar"]});
	},
	function arrayTypeFailure(){
		mustFailOnCommit(function(){
			new TestSchema({arrayProp:44.222});
		});
	},
	function dateType(){
		new TestSchema({dateProp:new Date()});
	},
	function dateTypeFailure(){
		mustFailOnCommit(function(){
			new TestSchema({dateProp:"hi"});
		});
	},
	function unionType(){
		new TestSchema({unionProp:"hi"});
	},
	function unionType2(){
		new TestSchema({unionProp:4});
	},
	function unionTypeFailure(){
		mustFailOnCommit(function(){
			new TestSchema({unionProp:false});
		});
	},
	function unionWithNullType(){
		new TestSchema({unionPropWithNull:null});
	},
	function unionWithNullType2(){
		new TestSchema({unionPropWithNull:{foo:"bar"}});
	},
	function unionWithNullTypeFailure(){
		mustFailOnCommit(function(){
			new TestSchema({unionPropWithNull:33});
		});
	},
	function numberTypeRequired(){
		new TestSchemaRequired({numberProp:4});
	},
	function emptyFailure(){
		mustFailOnCommit(function(){
			new TestSchemaRequired({});
		});
	},
	function extended(){
		new TestSchemaRequired({numberProp:4,stringProp:"hi"});
	},
	function extendedFailure(){
		mustFailOnCommit(function(){
			new TestSchemaRequired({numberProp:4,stringProp:55});
		});
	},
	function extendedAdditionalPropertyFailure(){
		mustFailOnCommit(function(){
			new TestSchemaRequired({numberProp:4,foobar:"a string"});
		});
	},
	function arraySetFailure(){
		mustFailOnCommit(function(){
			new TestSchema({arrayProp:[33]});
		});
	},
	function arraySet(){
		new TestSchema({arrayProp:["bar"]});
	},
	function arraySet2(){
		(new TestSchema({arrayProp:["bar"]})).arrayProp[0] = "baz";
	},
	function arraySetFailure3(){
		mustFailOnCommit(function(){
			(new TestSchema({arrayProp:["bar"]})).arrayProp[0] = 33;
		});
	},
	function arrayPushFailure(){
		mustFailOnCommit(function(){
			(new TestSchema({arrayProp:["bar"]})).arrayProp.push(true);
		});
	},
	function arrayPush(){
		(new TestSchema({arrayProp:["bar"]})).arrayProp.push("baz");
	}
]);

