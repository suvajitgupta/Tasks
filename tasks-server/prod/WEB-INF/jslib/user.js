Class({
  id: "user",
  properties: {
    _id: { type: "any", optional: true },
    createdAt: { type: "any", optional: true },
    updatedAt: { type: "any", optional: true },
    name: { type: "any", optional: false },
    loginName: { type: "any", optional: false },
    role: { type: "any", optional: false },
    email: { type: "any", optional: true },
    password: { type: "any", optional: true },
    preferences: { type: "object", optional: true },
    authToken: { type: "any", optional: true }
  },
  authenticate: function(username, password){
     if(username === null){
        //signing out
        return null;
     }
     var error = "null";
     var successful = false; 
     var user = load("user/[?loginName=$1]",username)[0];
     
     if (user) {
       if (user.password === password || user.password === null) {
         successful = true;
       } else {
         error = "("+user.password+")";
       }
     } else {
       error = " User " + username + " Found";
     } 
     
     if(!successful){
        throw new AccessError("Authentication failed  " + error );
     }
     // return a user object
     return load("user/[?loginName=$1]",username)[0];
  }
});
