//============================================================================
// Tasks.usersController
//============================================================================
/*globals Tasks CoreTasks sc_require */
sc_require('mixins/status_changed');

/**

  This is the Users Controller to track all users loaded into Tasks
  
  @extends SC.ArrayController
  @author Joshua HoltV
  @version preBeta
  @since preBeta

*/

Tasks.usersController = SC.ArrayController.create(Tasks.StatusChanged,
  /** @scope Tasks.usersController.prototype */ {
  
  isDeletable: function() {

    if(!CoreTasks.getPath('permissions.canDeleteUser')) return false;

    var sel = this.get('selection');
    if(!sel) return false;

    return true;

  }.property('selection').cacheable(),

  contentStatusDidChange: function(status){
    // console.log("DEBUG: usersController " + status);
    if (status & SC.Record.READY){
      Tasks.usersLoadSuccess();
    }
    else if (status & SC.Record.ERROR){
      Tasks.dataLoadFailure();
    }
  }
  
});