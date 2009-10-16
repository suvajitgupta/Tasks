//============================================================================
// Tasks.usersController
//============================================================================
/*globals Tasks */

/**

  This is the Users Controller to track all users loaded into Tasks
  
  @extends SC.ArrayController
  @author Joshua Holt
  @version preBeta
  @since preBeta

*/

Tasks.usersController = SC.ArrayController.create(Tasks.statusChanged,
  /** @scope Tasks.usersController.prototype */ {
    
  contentStatusDidChange: function(status){
    if (status & SC.Record.READY){
      Tasks.usersLoadSuccess();
    }
    else if (status & SC.Record.ERROR){
      Tasks.usersLoadFailure();
    }
  }
  
});