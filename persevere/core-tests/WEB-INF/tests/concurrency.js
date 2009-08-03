//
// Set some stuff up
//
var threadCount = 40;
var objectCount = 40;    

//
// The tests
//

tests([
	
  // Make sure there are no objects lying around
  // Extra tests here because of index:false bug.  Create objects with index:false attributes, remove them, then look 
  // for them via the non-indexed attributes and you'll find them still!
  function clear(){
    var os = load("Nano");
    os.forEach(function(object){
      remove(object);
    });
    commit();

    // Make sure there are no Nanos initially
    var count = load( "Nano.length" )
    assert( count == 0, "Needed NO Nano's via load initially - had " + count + " via load of Nano.length");

    // Make sure there are no Nanos initially
    var nanos = load( "Nano" )
    assert( nanos.length == 0, "Needed NO Nano's via load initially - had " + nanos.length + " via load of Nano");
    
    // This is here because of the index:false bug - when index:false, objects continue to be visible even when they're erased
    var nanos = load( "Nano/[?accesses=0]" )
    assert( nanos.length == 0, "Needed NO Nano's via load initially - had " + nanos.length + " via load of Nano/[?accesses=0]");  
	},
	
	// Idea is to add objects in different threads and make sure they all get made.
	// Makes threadCount threads,  creates objectCount objects in each thread, checks their creation in the thread, then 
	// checks all created objects outside the thread
	// Doesn't know when all the threads are done (no join), so it just waits for a bit...
	function checkAdding(){
	  
    // Make sure there are no Nanos initially
    var count = load( "Nano.length" )
    assert( count == 0, "Needed NO Nano's via load initially - had " + count );

    var index = 0;
    var threads = [];
    var threadError = 0;
    
    // Make the threads
    for ( var i = 0; i < threadCount; i++ ) {  
      // console.log( "Thread " + i )
      

      // WORKAROUND this : threads.push( new Thread( function() {
      // would really like to be ablew to call join on it!
      // Create this thread - store the object for later join( )
      var thread = java.lang.Thread( function () {
          // try to get a unique number for each thread - this is tricky...
          var t = index++;
          commit();
        
          // Create the objects
          for ( var j = 0; j < objectCount; j++ ) {
            // console.log( "  Thread " + t + " Object" + j );
    	      var n = new Nano( );
            n.accesses = t;
            n.property = j;
            commit();
          }
        try {          
                      
          // Check the objects within this thread 
          for ( var j = 0; j < objectCount; j++ ) {
            var r = load( "Nano/[?accesses="+t+"&property="+j+"]");
            assert( r.length, 1, "In thread, can't find the right number of T:" + t + " O:" + j );
            assertEqual( r[0].accesses, t, "In Thread Object Not Right" )
            assertEqual( r[0].property, j, "In Thread Object Not Right" )
          }
        } catch ( e ) {
          threadError++;
          console.log( "Error internal to thread" )
        }
          
       //WORKAROUND  this:    } ) );
      } );
      threads.push( thread );
      thread.start();
    }
    
    // hope all the threads are done
    // really want to join( ) all threads here 
    for ( var i = 0; i < threadCount; i++ )
      threads[ i ].join();
    
    // java.lang.Thread.sleep( 5000 );
    
    var noneErrors = 0;
    var tooManyErrors = 0;
    var objectWrongErrors = 0;
    for ( var i = 0; i < threadCount; i++ ) {  
      for ( var j = 0; j < objectCount; j++ ) {
        var r = load( "Nano/[?accesses="+i+"&property="+j+"]");
        // assertEqual( r.length, 1, "Post Thread Can't Find the right number of T:" + i + " O:" + j + " " + serialize( r ) );
        if ( r.length == 0 ) {
          noneErrors++;
          console.log( "Checking T:" + i + " O:" + j + " : No Object " );
        }
        if ( r.length > 1 ) {
          tooManyErrors++;
          console.log( "Checking T:" + i + " O:" + j + " : " + r.length + " Objects " );
        }
        if ( r.length == 1 ) {
          if ( r[0].accesses != i ) {
            console.log( "Checking T:" + i + " O:" + j + " : Accesses Not Right" );
            objectWrongErrors++;
          }
          if ( r[0].property != j ) {
            console.log( "Checking T:" + i + " O:" + j + " : Property Not Right" );
            objectWrongErrors++;
          }
        }
      }
    }
    assertEqual( noneErrors, 0, "More than 0 No Object errors" );
    assertEqual( tooManyErrors, 0, "More than 0 Too Many Object errors" );
    assertEqual( objectWrongErrors, 0, "More than 0 Object Wrong errors" );
	}
]);
      
      