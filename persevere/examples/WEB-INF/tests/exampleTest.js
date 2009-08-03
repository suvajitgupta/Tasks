tests([
	function simpleType(){
		var test = new Customer({firstName:"Jim", lastName:"Smith"});
		assert(test.getFullName() == "Jim Smith");		
	}
]);