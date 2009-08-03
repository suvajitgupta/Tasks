Class(    {
  "id":"Toot",    
  "Create":function(count){
    base = load( "/Toot.length" );
    console.log("Creating " + count + " Toots. Already " + base );
    var i = 0;
    var start = new Date();
    while(i++ < count)
    {
      var n = new Toot( );
      commit();
    }
    var elapsed = new Date() - start;
    console.log("  Elapsed time: " + elapsed );
    console.log("  Mean: " + (elapsed / count) + " ms per object");
	},
  "prototype":{
    initialize:function(  ) {
      this.name = "Toot-"+new Date()
		  this.accesses = 0;
		  this.prop = 0;
  	},
    getAccesses:function( ) {
      return this.accesses;
  	},
    access:function( ) {
      this.accesses += 1;
      this.prop = Math.floor( Math.random() * 1000 )
      return this.accesses;
    },
    output:function( ) {
      console.log( this.id + " : " + this.accesses + " accesses " );
  	}
  },
  "properties":{
    "name":{ type:"string" },
    "accesses":{ type:"integer" },
    "prop":{index: false, type:"integer" }
  },
  "methods":{
    access: {
      parameters: [],
      returns: { type:"integer" },
    },
    getAccesses: {
      parameters: [],
      returns: { type:"integer" },
      safe:true
    },
  }
} );

