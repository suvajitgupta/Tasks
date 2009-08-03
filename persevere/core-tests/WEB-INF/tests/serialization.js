/**
 * This tests serialization and deserialization
 */
var jsSource, jsonString, serializationTestObject;
tests([
	function persistentObjectSerialization(){
		serializationTestObject = new SerializationTest({"name":'serializationTest1',numberProp:3.33});
		serializationTestObject.arrayProp = ['a','b'];
		serializationTestObject.objectProp = {self:serializationTestObject};
		serializationTestObject.stringProp = "testing";
		serializationTestObject.nanProp = NaN;
		serializationTestObject.nullProp = null;
		commit();
		serializationTestObject.arrayProp.push('c');
		serializationTestObject.objectProp.foo = "bar";
		commit();
		jsSource = serialize(serializationTestObject);
		assertEqual(jsSource, '({"id":"' + serializationTestObject.id + '",\n"name":"serializationTest1",\n"numberProp":3.33,\n"arrayProp":[\n\t"a",\n\t"b",\n\t"c"\n],\n"objectProp":{\n\t"self":{"$ref":"' + serializationTestObject.id + '"},\n\t"foo":"bar"\n},\n"stringProp":"testing",\n"nanProp":NaN,\n"nullProp":null\n})');
		jsonString = JSON.stringify(serializationTestObject);
		assertEqual(jsonString, '{"id":"' + serializationTestObject.id + '",\n"name":"serializationTest1",\n"numberProp":3.33,\n"arrayProp":[\n\t"a",\n\t"b",\n\t"c"\n],\n"objectProp":{\n\t"self":{"$ref":"' + serializationTestObject.id + '"},\n\t"foo":"bar"\n},\n"stringProp":"testing",\n"nanProp":NaN,\n"nullProp":null\n}');
	},
	function deserializationPersistent(){
		var deserializationTestObject = deserialize("{id:'" + serializationTestObject.id + "', name:'serializationTest1', newNaN: NaN, newArray:[3,4]}");
		assertEqual(serializationTestObject, deserializationTestObject);
		assertEqual(serializationTestObject.newArray[1], 4);
		assertEqual(typeof serializationTestObject.newNaN, 'number');
		assert(isNaN(serializationTestObject.newNaN));
	},
	function transientObjectSerialization(){
		var serializationTestObject = {"name":'serializationTest1',numberProp:3.33};
		serializationTestObject.arrayProp = ['a','b'];
		jsSource = serialize(serializationTestObject);
		assertEqual(jsSource, '({\n"name":"serializationTest1",\n"numberProp":3.33,\n"arrayProp":[\n\t"a",\n\t"b"\n]\n})');
		jsonString = JSON.stringify(serializationTestObject);
		assertEqual(jsonString, '{\n"name":"serializationTest1",\n"numberProp":3.33,\n"arrayProp":[\n\t"a",\n\t"b"\n]\n}');
	},
	function deserializationTransient(){
		var deserialized = JSON.parse('{"number":44,"subObj":{"foo":"bar"}}');
		assertEqual(deserialized.number, 44);
		assertEqual(deserialized.subObj.foo, "bar");
	},
	function dateSerialization(){
		var aDate = new Date(100000000);
		var serialized = JSON.stringify({someDate: aDate});
		assertEqual(serialized, "{\n\"someDate\":\"1970-01-02T03:46:40Z\"\n}");
		var deserialized = JSON.parse(serialized);
		assertEqual(deserialized.someDate.getTime(), 100000000);
	}
	
]);

