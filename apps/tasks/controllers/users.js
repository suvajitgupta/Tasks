//============================================================================
// Tasks.usersController
//============================================================================
/*globals Tasks CoreTasks SCUI */

/**

  This is the Users Controller to track all users loaded into Tasks
  
  @extends SC.ArrayController
  @author Joshua HoltV
  @version preBeta
  @since preBeta

*/

Tasks.usersController = SC.ArrayController.create(SCUI.StatusChanged,
  /** @scope Tasks.usersController.prototype */ {
  
  usersCount: function() {
    return this.get('length') + "_Users".loc();
  }.property('[]').cacheable(),

  isDeletable: function() {

    if(!CoreTasks.getPath('permissions.canDeleteUser')) return false;

    var sel = this.get('selection');
    if(!sel) return false;
    
    var selectedUser = sel.get('firstObject');
    if(selectedUser === CoreTasks.get('currentUser')) return false; // can't delete yourself!

    return true;

  }.property('selection').cacheable(),
  
  editableUsers: [], // based on role, only current user or all users are available in User Manager
  
  contentStatusDidChange: function(status){
    // console.log("DEBUG: usersController " + status);
    if (status & SC.Record.READY){
      var currentUser = CoreTasks.getUser(Tasks.loginName);
      if(currentUser) {
        if(currentUser.get('role') === CoreTasks.USER_ROLE_MANAGER) {
          this.set('editableUsers', this.arrangedObjects);
        }
        else {
          this.set('editableUsers', [ currentUser ]);
        }
      }
      // console.log("DEBUG: role of " + currentUser.get('role') + " should see #users = " + this.getPath('editableUsers.length'));
      Tasks.usersLoadSuccess();
    }
    else if (status & SC.Record.ERROR){
      Tasks.dataLoadFailure();
    }
  }
  
});