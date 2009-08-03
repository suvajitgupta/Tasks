//
// Set some stuff up
//

// Database might have been secured...  need to get in 
try{
  authenticate("full","access");
}catch(e){
  createUser("full","access");
  authenticate("full","access");
}

Nano.removeAll();
commit();

//
// The tests
//

tests([
  // Can we even talk to ourselves?     
	function selfConnect(){
	  doRequest( "GET", "Nano" )
	},
	
	// What about adding an object via XHR
  function checkXHRBasicAdd(){
    // Make sure there are no Nanos locally
	  var count = load( "Nano.length" )
    assert( count == 0, "Needed NO Nano's via load initially - had " + count );
	  
    // Make sure there are no Nanos via XHR
	  count = doRequest( "GET", "Nano.length" )
    assert( count == 0, "Needed NO Nano's via XHR initially - had " + count );
	  
	  // Create a Nano externally
    var accesses = Math.floor( Math.random() * 100 );
    var property = Math.floor( Math.random() * 100 );
	  var nXHRPostString = doRequest( "POST", "Nano", "{ accesses:"+ accesses +" , property:" + property + " }" )
	 
	  commit();
	 
	  // Check to make sure we made one
    count = doRequest( "GET", "Nano.length" )
    assert( count == 1, "Needed One Nano via load after PUT, " + count );
	 
    // Check to make sure we can see it here too
    count = load( "Nano.length" )
    assert( count == 1, "Needed One Nano via XHR after PUT, " + count );

    // Get the local version & make sure it's right
	  var nLoad = load( "Nano")[ 0 ]
	  assertEqual( accesses, nLoad.accesses, "Local version not right - accesses was " + nLoad.accesses + " Should have been " + accesses )
    assertEqual( property, nLoad.property, "Local version not right - property was " + nLoad.property + " Should have been " + property )
	  
    // Check the XHR version returned from the post 
    var nXHRPost = eval( nXHRPostString );
    assertEqual( accesses, nXHRPost.accesses, "POST Returned version not right - accesses was " + nXHRPost.accesses + " Should have been " + accesses )
    assertEqual( property, nXHRPost.property, "POST Returned version not right - property was " + nXHRPost.property + " Should have been " + property )
	  
    // Get the first object via XHR & check it's ours
	  var nXHRGetString = doRequest( "GET", "Nano" );  	                       
    var nXHRGet = eval( nXHRGetString )[ 0 ];
    assertEqual( accesses, nXHRGet.accesses, "Get all Returned version not right - accesses was " + nXHRGet.accesses + " Should have been " + accesses )
    assertEqual( property, nXHRGet.property, "Get all Returned version not right - property was " + nXHRGet.property + " Should have been " + property )
    
    assertNotEqual( nXHRGet.id, null, "Needed an id" )
    
    // Get the object explicitly via XHR & check it 
    var nXHRGetString = doRequest( "GET", nXHRGet.id );
    var nXHRGetById = eval( nXHRGetString );
    assertEqual( accesses, nXHRGetById.accesses, "Get all returned version not right - accesses was " + nXHRGetById.accesses + " should have been " + accesses )
    assertEqual( property, nXHRGetById.property, "Get all returned version not right - property was " + nXHRGetById.property + " should have been " + property )
    
    // OK.  Now try to update the object
    var accessesNew = Math.floor( Math.random() * 100 );
    var nXHRGetString = doRequest( "PUT", nXHRGet.id, "{ accesses:" + accessesNew + ", property: " + property + " }" );
    
    // Get the modified object explicitly via XHR & check it 
    var nXHRGetString = doRequest( "GET", nXHRGet.id );
    var nXHRGetMod = eval( nXHRGetString );
    assertEqual( accessesNew, nXHRGetMod.accesses, "Get returned version not right - accesses was " + nXHRGetMod.accesses + " should have been " + accessesNew )
    assertEqual( property, nXHRGetMod.property, "Get returned version not right - property was " + nXHRGetMod.property + " should have been " + property )
    
    // Make sure we didn't make a new one 
    var count = load( "Nano.length" )
    assert( count == 1, "Needed One Nano after mod... had " + count );
    
    // Make sure there XHR agrees
    count = doRequest( "GET", "Nano.length" )
    assert( count == 1, "Needed One Nano's after mod... had " + count );
    
    // Now try to delete it
    doRequest( "DELETE", nXHRGet.id );
    
    // Make sure there are no Nanos locally
    count = load( "Nano.length" )
    assert( count == 0, "Needed NO Nano's after delete - had " + count );
    
    // Make sure there are no Nanos via XHR
    count = doRequest( "GET", "Nano.length" )
    assert( count == 0, "Needed NO Nano's after delete - had " + count );
        
	},
		
]);


function doRequest( method, path, content ) {
  // console.log( "Request will be : " + method + " " + path )
  var xhr = new XMLHttpRequest();
  xhr.open( method, "http://localhost:8080/" + path, true, "full", "access");
  var contact = false;
  xhr.onreadystatechange = function() { contact = true; } ; 
  xhr.contentType = "application/javascript";
  // Need this if any of the security tests have run on this database
  xhr.setRequestHeader( "Authorization", "full:access" );
  xhr.send( content );

  var waiting = 0;
  var interval = 100;
  while ( contact == false && waiting < 10000 ) {
    java.lang.Thread.sleep( interval )
    waiting += interval;
  }
  assert( waiting < 1000, "Request took too long " + waiting + "ms" )
  assert( contact, "No contact" )
  // console.log( "Request was: " + path + "Response was:" + xhr.responseText )
  return xhr.responseText;
};

