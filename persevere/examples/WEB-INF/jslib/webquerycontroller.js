require( 'controller.js' )

Class(   {
  id:"WebQueryController",
  // "representation:text/html":Controller.Handler,
  "representation:text/html": {
    "quality":0.8,
    "output": function(object){
      Controller.handleRequest( object );
    }
  },
  WebQuery:function( context ){
    history = request.getSession().getValue( "history" )
    if ( history == null )
    	history = []      
    context.history = history
    print( "Before:" + history )
    webQuery = context.params[ "webQuery" ]
    if ( webQuery == null )
    	webQuery = ""
    try {
       print( "  About to Load :" + webQuery )
       var result = load( webQuery )
       print( "  Done :" + webQuery )
       result = ( result instanceof Array ) ? result : [ result ]
       var output = []
       print( serialize( result ) )                             
       for ( var i = 0; i < result.length; i++  ){
    	   ri = result[ i ]
    	   print( i + ":" + ri + " -> " + serialize( ri, "application/json" ) )
    	   output.push( serialize( ri, "application/json" ) ) 
       }
       context.webResult = output
    }
    catch ( e ) {
      print( "Error! " + e )
      context.webResult = null
    }
    Controller.render( null, context );
    if ( webQuery != null && context.webResult != null )
      history.push( webQuery )
      print( "After:" + history )
    	request.getSession().putValue( "history", history )        	
	},
  create:function( context ){
    print( JSON.stringify( context ) );
    var t = new Toot(  )    
    commit();
    context.webResult = [ serialize( t, "application/json"  ) ];
    Controller.render( null, context );
  },
  clearHistory:function( context ) {
    request.getSession().putValue( "history", null )
    context.history = null
    context.webResult = null
    Controller.render( null, context );
  },        
} );
