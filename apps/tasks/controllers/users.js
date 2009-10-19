//============================================================================
// Tasks.usersController
//============================================================================
/*globals Tasks sc_require */
sc_require('mixins/status_changed');

/**

  This is the Users Controller to track all users loaded into Tasks
  
  @extends SC.ArrayController
  @author Joshua Holt
  @version preBeta
  @since preBeta

*/

Tasks.usersController = SC.ArrayController.create(Tasks.StatusChanged,
  /** @scope Tasks.usersController.prototype */ {
  
  contentStatusDidChange: function(status){
    console.log("DEBUG: usersController " + status);
    if (status & SC.Record.READY){
      Tasks.usersLoadSuccess();
    }
    else if (status & SC.Record.ERROR){
      Tasks.usersLoadFailure();
    }
  }
  
});