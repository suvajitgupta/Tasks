/**
 * This tests the JSONQuery capabilities
 */

load("TestClass/[?name='queryTest']").forEach(function(object){
	remove(object);
});

function checkIds( objectArray, testArray, message  ) {
  var idChecklist = {}
  for ( var i  = 0; i < testArray.length; i++ ) {
    var id = testArray[ i ].id;
    idChecklist[ id ] = true;
    //console.log( " Adding " + id )
  }
  for ( var i = 0; i < objectArray.length; i++ ) {
    if ( idChecklist[ objectArray[ i ].id ] == null )
      throw new Error( "Unexpected ID" +  objectArray[ i ].id )
    idChecklist[ objectArray[ i ].id ] = null
  }
  for ( var id in idChecklist ) {
    if ( idChecklist[ id ] != null ) 
      throw new Error( "ID not encountered:" + id )
  }  
}


var a = new TestClass({name:'queryTest', num: 12, str: "some string", nullProp: null, bool: true, arr:[1,true]});
var b = new TestClass({name:'queryTest', num: 12.22, dateProp: new Date(), arr:[a,44,{sub:a}]});
var c = new TestClass({name:'queryTest', objProp: a, num: -1, dateProp: new Date(10), str:"something",arr:[false, 2]});
var d = new TestClass({name:'queryTest', objProp: a, dateProp: new Date(100), num: -1});
var e = new TestClass({name:'queryTest', num: 1, str: "Some String", arr:[1,"no"]});
commit();



tests([
	function simpleMatch(){
	  var result = load("TestClass/?str='some string'");	  
	  assertEqual(result.length, 1);
	  checkIds( result, [ a ], "Single String Search" );    
	},
  function simpleNoMatch(){
    var result = load("TestClass/?str='no string'");    
    assertEqual(result.length, 0, "Simple No Match");
  },
	function simpleCaseInsensitive(){
    var result = load("TestClass/[?str~'SOME STRING']");   
    assertEqual(result.length, 2);
    checkIds( result, [ a, e ], "Case insensitive Search" );    
	},
	function simpleStart(){
    var result = load("TestClass/[?str='some*']");
	  assertEqual( result.length, 2);
    checkIds( result, [ a, c ], "Simple Start" );    	  
	},
	function stringGreaterThan(){
    var result = load("TestClass/[?str>'some string']");
    assertEqual( result.length, 1);
    checkIds( result, [ c ], "String Greater Than" )            
	},
	function stringGreaterThanOrEqual(){
    var result = load("TestClass/[?str>='some string']");
    assertEqual( result.length, 2);
    checkIds( result, [ a, c ], "String Greater Than Or Equal" )            
	},
	function stringLessThan(){
    var result = load("TestClass/[?str<'something']");
    assertEqual( result.length, 2);
    checkIds( result, [ a, e ], "String Less Than" );            
	},
	function stringLessThanOrEqual(){
    var result = load("TestClass/[?str<='some string']");
    assertEqual( result.length, 2);
    checkIds( result, [ a, e ], "String Less Than or Equal" )            
	},
	function comboQuery(){
    var result = load("TestClass/[?str='some*'][?num>=12]");
		assertEqual( result.length, 1);
    checkIds( result, [ a ], "Combo Query" );            
	},
	function comboQuery2(){
    var result = load("TestClass/[?num>=12][?str='some*']");
    assertEqual( result.length, 1);
    checkIds( result, [ a ], "Combo Query 2" );            
	},
	function simpleStartCaseInsensitive(){
    var result = load("TestClass/[?str~'Some*']");
		assertEqual( result.length, 3);
    checkIds( result, [ a, c, e ], "Start Case Insensitive" );            		
	},
	function simpleBool(){
    var result = load("TestClass/[?bool=true]");
		assertEqual( result.length, 1);
    checkIds( result, [ a ], "Simple Bool" );            
	},
	function simpleNull(){
    var result = load("TestClass/[?nullProp=null&name='queryTest']");
		assertEqual( result.length, 1);
    checkIds( result, [ a ], "Simple Null" )            		
	},
  function simpleNumberEquals(){
    var result = load("TestClass/[?num=-1]");
    assertEqual( result.length, 2);
    checkIds( result, [ c, d ], "Simple Number Equals" );
  },
  function simpleNumberNotEquals(){
    var result = load("TestClass/[?name='queryTest'&num!=-1]");
    assertEqual( result.length, 3);
    checkIds( result, [ a, b, e ], "Simple Number Not Equals" );
  },
  function simpleNumberLess(){
    var result = load("TestClass/[?num<12]");
    assertEqual( result.length, 3);
    checkIds( result, [ c, d, e ], "Simple Number Less" );
  },
  function simpleNumberLessEqual(){
    var result = load("TestClass/[?num<=12]");
    assertEqual( result.length, 4);
    checkIds( result, [ a, c, d, e ], "Simple Number Less or Equal" );
  },
  function simpleNumberGreater(){
    var result = load("TestClass/[?num>12]");
    assertEqual( result.length, 1 );
    checkIds( result, [ b ], "Simple Number Greater " );
  },
  function simpleNumberGreaterEqual(){
    var result = load("TestClass/[?num>=12]");
    assertEqual( result.length, 2 );
    checkIds( result, [ a, b ], "Simple Number Greater or Equal" );
  },
	function simpleParameter(){
    var result = load("TestClass/?num=$1", 12);
		assertEqual( result.length, 1);
    checkIds( result, [ a ], "Simple Parameter" )
	},
	function dateMatch(){
    var result = load("TestClass/?dateProp=date(10)");
		assertEqual( result.length, 1);
    checkIds( result, [ c ], "Date Match" )
	},
	function dateGreaterThan(){
    var result = load("TestClass/?dateProp>date(10)");
    assertEqual( result.length, 2);
    checkIds( result, [ b, d ], "Date Greater Than" )
	},
	function dateLessThan(){
    var result = load("TestClass/?dateProp<date(100)");
		assertEqual( result.length, 1 );
    checkIds( result, [ c ], "Date Less Than" )
	},
	function dateRange(){
    var result = load("TestClass/?dateProp>date(1)&dateProp<date(11)");
    assertEqual( result.length, 1 );
    checkIds( result, [ c ], "Date Range Than" )
	},
	function idRange(){
		function idNum(id){
			return id.substring(id.indexOf('/') + 1,id.length);
		}
		assertEqual(load("TestClass/?id>" + idNum(a.id) + " & id < " + idNum(d.id)).length, 2);
	},
	function referenceObject(){
		assertEqual(load("TestClass/?objProp=/" + a.id).length, 2);
	},
	function simpleContains(){
		assertEqual(load("TestClass/?arr.contains(44, true)").length, 2);
	},
	function containsReference(){
		assertEqual(load("TestClass/?arr.contains(/" + a.id + ")").length, 1);
	},
	function nestedContainsReference(){
		assertEqual(load("TestClass/?arr.contains(?sub=/" + c.id + ")").length, 0);
	},
	function nestedDoesntContainReference(){
		assertEqual(load("TestClass/?arr.contains(?sub=/" + a.id + ")").length, 1);
	},
	function sumTest(){
		assertEqual(load("TestClass/.sum(?num)"), 23.22);
	},
	function maxTest(){
		assertEqual(load("TestClass/.max(?num)"), 12.22);
	},
	function minTest(){
		assertEqual(load("TestClass/.min(?num)"), -1);
	},
	function sortUp(){
		assertEqual(load("TestClass/[?name='queryTest'][/num]")[2],e);
	},
	function sortDown(){
		// TODO: This should check
		assertEqual(load("TestClass/[?name='queryTest'][\\num,/str]")[0],b);
	},
	function sliceTest(){
		var sliced = load("TestClass/[?name='queryTest'][/num][0:3:2]");
		assertEqual(sliced.length,2);
		assertEqual(sliced[1],e);
	},
	function pathTest(){
		assertEqual(load("TestClass/[?name='queryTest'][/num][3].arr[1]"),true);
	}
	
]);

