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
  
  roles: null,

  showRoles: function() {

    var isManager = false, nodes = [], managerRoles = [], developerRoles = [], testerRoles = [], guestRoles = [];
    var users = this.get('arrangedObjects');
    if(users) {
      var editableUsers = []; // based on role, only current user or all users are available in User Manager
      var currentUser = CoreTasks.get('currentUser');
      if(!currentUser) currentUser = CoreTasks.getUser(Tasks.get('loginName')); // at startup time
      if(currentUser) {
        if(currentUser.get('role') === CoreTasks.USER_ROLE_MANAGER) {
          isManager = true;
          editableUsers = users;
        }
        else {
          editableUsers.push(currentUser);
        }
        // console.log('DEBUG: showRoles() currentUser=' + currentUser.get('name') + ', #editableUsers=' + editableUsers.get('length'));
      }

      var len = editableUsers.get('length');
      for (var i = 0; i < len; i++) {
        var user = editableUsers.objectAt(i);
        switch(user.get('role')) {
          case CoreTasks.USER_ROLE_MANAGER: managerRoles.push(user); break;
          case CoreTasks.USER_ROLE_DEVELOPER: developerRoles.push(user); break;
          case CoreTasks.USER_ROLE_TESTER: testerRoles.push(user); break;
          case CoreTasks.USER_ROLE_GUEST: guestRoles.push(user); break;
        }
      }
      if(isManager || managerRoles.get('length') > 0) {
        nodes.push(SC.Object.create({ displayName: managerRoles.length + ' ' + CoreTasks.USER_ROLE_MANAGER.loc() + 's',
                   role: CoreTasks.USER_ROLE_MANAGER, treeItemChildren: managerRoles, treeItemIsExpanded: YES }));
      }
      if(isManager || developerRoles.get('length') > 0) {
        nodes.push(SC.Object.create({ displayName: developerRoles.length + ' ' + CoreTasks.USER_ROLE_DEVELOPER.loc() + 's',
                   role: CoreTasks.USER_ROLE_DEVELOPER, treeItemChildren: developerRoles, treeItemIsExpanded: YES }));
      }
      if(isManager || testerRoles.get('length') > 0) {
        nodes.push(SC.Object.create({ displayName: testerRoles.length + ' ' + CoreTasks.USER_ROLE_TESTER.loc() + 's',
                   role: CoreTasks.USER_ROLE_TESTER, treeItemChildren: testerRoles, treeItemIsExpanded: YES }));
      }
      if(isManager || guestRoles.get('length') > 0) {
        nodes.push(SC.Object.create({ displayName: guestRoles.length + ' ' + CoreTasks.USER_ROLE_GUEST.loc() + 's',
                   role: CoreTasks.USER_ROLE_GUEST, treeItemChildren: guestRoles, treeItemIsExpanded: YES }));
      }
    }

    this.set('roles', SC.Object.create({ treeItemChildren: nodes, treeItemIsExpanded: YES }));

  }.observes('[]'),

  usersCount: function() {
    return this.get('length') + "_Users".loc();
  }.property('[]').cacheable(),

  isDeletable: function() {

    if(!CoreTasks.getPath('permissions.canDeleteUser')) return false;

    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    
    var selectedUser = sel.get('firstObject');
    if(selectedUser === CoreTasks.get('currentUser')) return false; // can't delete yourself!

    return true;

  }.property('selection').cacheable(),
  
  contentStatusDidChange: function(status){
    // console.log('DEBUG: usersController ' + status);
    if (status & SC.Record.READY){
      Tasks.usersLoadSuccess();
    }
    else if (status & SC.Record.ERROR){
      Tasks.dataLoadFailure();
    }
  }
  
});