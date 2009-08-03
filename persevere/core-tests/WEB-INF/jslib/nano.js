Class(    {
  id:"Nano",    
  prototype: {
    initialize:function(  ) {
		  this.accesses = 0;
		  this.property = 0;
    },    
    access:function( ) {
		   this.accesses += 1;
       console.log( this.id + " : " + this.accesses + " accesses " );
		   return this.accesses;
  	},
  },
  properties:{
    accesses:{"type":"integer", "default":0 },
    //accesses:{index:false, "type":"integer", "default":0 },
    property:{"type":"integer", "default":0 }
  },
  methods:{
    access: {
       parameters: [],
       returns: { type:"integer" },
    },
  }
} );

