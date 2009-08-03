/*

*/

Class(   {
  "id":"Controller",
  "Handler":{
    "quality":0.8,
    "output": function(object){
      Controller.handleRequest( object );
    }
  },
  /*
  * handleRequest( ) is called by Controllers and Objects to render a view
  * passed in is the object itself.
  * The object can be a class if the URL was /Class/MyClassController
  * or it can be an actual object if the URL was /MyClass/id
  */
  "handleRequest":function( object ){
    response.setContentType("text/html");

    // TODO: Should send to some nice error page... could define here in Controller
    if ( object == null )             
    return
        
    console.log( "Controller gets Object Id:" + object.id )

    // load params
    var params = {}
    paramEnumerator = request.getParameterNames();
    while ( paramEnumerator.hasMoreElements() ) {
      param = paramEnumerator.nextElement();
      values = request.getParameterValues( param )
      if ( values.length == 1 )
      params[ param ] = values[ 0 ];
      else if ( values.length > 1 )
      params[ param ] = values;
      console.log( "P:" + param + " V:" + params[ param ] )
    }                            

    // unpack the id's
    var oid = object.id;
    var basedId = null;
    var controllerId = null;
    var classId = null;
    var instanceId = null;

    // objects
    var controllerObject = null;
    var classObject = null;
    var instanceObject = null;

    var cloc = oid.lastIndexOf( "Controller" ) 
    var cstart = ( oid.substring( 0, 6 ) == "Class/" )
    if ( cstart && cloc == oid.length - "Controller".length ) {
      controllerId = oid
      oid = oid.substring( 0, cloc )
      controllerObject = object;
    }
    if ( cstart) {
      baseId = oid.substring( 6 )
      classId = oid;
      // if it is a class, but wasn't a controller, this is a plain class object
      if ( controllerObject == null )                 
      classObject = object               
    } else {
      var sloc = oid.lastIndexOf( "/" )
      baseId = oid.substring( 0, sloc )            
      instanceId = oid.substring( sloc + 1 )     // why do we need this?       
      classId = "Class/" + baseId
      instanceObject = object
    }

    // work out the controller id if necessary
    if ( controllerId == null )
    controllerId = classId + "Controller"

    console.log( "  Base Id - " + baseId )
    console.log( "  Controller Id - " + controllerId + " Object " + controllerObject )
    console.log( "  Class Id - " + classId + " Object " + classObject )
    console.log( "  Instance Id - " + instanceId + " Object " + instanceObject )

    // if instance object not supplied, see if one was specified, try to load it
    // note that this object can be anything...  it might not walk like a duck
    if ( instanceObject == null ) {
      var id = params[ "id" ];
      if ( id != null ) {
        try {
          instanceObject = load( id )
        } catch ( e ) {
        }
      }
    } 

    // if controller not supplied, try to load it
    if ( controllerObject == null ) {
      try {
        controllerObject = load( controllerId  );
      }
      catch ( e ) {
      }
    }

    var action = params[ "action" ];                                     
    var context = { "baseId": baseId, "action": action, "object": instanceObject, "params": params }

    // If no action specified, the action is just the base name 
    if ( action == null )
      action = baseId

    // Try the controller, if we have it
    if ( controllerObject != null ) {
      if ( controllerObject[ action ] != null ) {
        controllerObject[ action ]( context )
        return;
      }
    }

    // Try to load it if we don't have it
    if ( classObject == null ) {
      try {
        controllerObject = load( controllerId  );
      }
      catch ( e ) {
      }
    }

    // Try the action on the class itself
    if ( controllerObject != null ) {
      if ( controllerObject[ action ] != null ) {
        controllerObject[ action ]( context )
        return;
      }
    }

    // Finally, try here
    this.render( action, context )            
  },  
  "render":function( actionName, context ) {
    response.setContentType("text/html");
    var te = new Tenjin.Engine();
    var fileName = context.baseId;
    if ( actionName != null && actionName != baseId )
    fileName += "_" + actionName;
    fileName += ".jshtml"
    var output = te.render( fileName, context);
    var os = response.getOutputStream();
    os.print(output);           
  },

  "prototype":{
  },
  "properties":{
  }
}
);
