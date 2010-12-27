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

Tasks.usersController = SC.ArrayController.create(
  /** @scope Tasks.usersController.prototype */ {
  
  userSearch: null,
  editableUsersCount: 0,

  roles: null,
  _computeRoles: function() {

    // console.log('DEBUG: _computeRoles()');
    var nodes = [], managerRoles = [], developerRoles = [], testerRoles = [], guestRoles = [];
    var user, users = this.get('arrangedObjects');
    if(users) {
      var editableUsers = []; // based on role, only current user or all users are available in User Manager
      var currentUser = CoreTasks.get('currentUser');
      if(!currentUser) currentUser = CoreTasks.getUserByLoginName(Tasks.get('loginName')); // at startup time
      if(currentUser) {
        var isCurrentUserAManager = (currentUser.get('role') === CoreTasks.USER_ROLE_MANAGER);
        if(isCurrentUserAManager) {
          var userSearch = this.get('userSearch');
          if(userSearch === null || userSearch === '') {
            editableUsers = users;
          }
          else {
            try {
              editableUsers = [];
              var userSearchPattern = new RegExp(userSearch, 'i');
              var emailSearch = (userSearch.indexOf('@') != -1);
              var numUsers = users.get('length');
              for (var j=0; j<numUsers; j++) {
                user = users.objectAt(j);
                if(emailSearch) {
                  if(userSearchPattern.exec(user.get('email'))) editableUsers.push(user);
                }
                else {
                  if(userSearchPattern.exec(user.get('name')) || userSearchPattern.exec(user.get('loginName'))) editableUsers.push(user);
                }
              }
            } catch(e) {}
          }
        }
        else {
          editableUsers.push(currentUser);
        }
        // console.log('DEBUG: _computeRoles() currentUser=' + currentUser.get('name') + ', #editableUsers=' + editableUsers.get('length'));
      }

      var len = editableUsers.get('length');
      this.set('editableUsersCount', len);
      for (var i = 0; i < len; i++) {
        user = editableUsers.objectAt(i);
        switch(user.get('role')) {
          case CoreTasks.USER_ROLE_MANAGER: managerRoles.push(user); break;
          case CoreTasks.USER_ROLE_DEVELOPER: developerRoles.push(user); break;
          case CoreTasks.USER_ROLE_TESTER: testerRoles.push(user); break;
          case CoreTasks.USER_ROLE_GUEST: guestRoles.push(user); break;
        }
      }
      if(isCurrentUserAManager || managerRoles.get('length') > 0) {
        nodes.push(SC.Object.create({ displayName: managerRoles.length + ' ' + CoreTasks.USER_ROLE_MANAGER.loc() + 's',
                   role: CoreTasks.USER_ROLE_MANAGER, treeItemChildren: managerRoles, treeItemIsExpanded: YES }));
      }
      if(isCurrentUserAManager || developerRoles.get('length') > 0) {
        var groupTitle = Tasks.softwareMode? CoreTasks.USER_ROLE_DEVELOPER.loc() : "_User".loc();
        nodes.push(SC.Object.create({ displayName: developerRoles.length + ' ' +  groupTitle + 's',
                   role: CoreTasks.USER_ROLE_DEVELOPER, treeItemChildren: developerRoles, treeItemIsExpanded: YES }));
      }
      if(Tasks.softwareMode && (isCurrentUserAManager || testerRoles.get('length') > 0)) {
        nodes.push(SC.Object.create({ displayName: testerRoles.length + ' ' + CoreTasks.USER_ROLE_TESTER.loc() + 's',
                   role: CoreTasks.USER_ROLE_TESTER, treeItemChildren: testerRoles, treeItemIsExpanded: YES }));
      }
      if(isCurrentUserAManager || guestRoles.get('length') > 0) {
        nodes.push(SC.Object.create({ displayName: guestRoles.length + ' ' + CoreTasks.USER_ROLE_GUEST.loc() + 's',
                   role: CoreTasks.USER_ROLE_GUEST, treeItemChildren: guestRoles, treeItemIsExpanded: YES }));
      }
    }

    this.set('roles', SC.Object.create({ treeItemChildren: nodes, treeItemIsExpanded: YES }));

  }.observes('[]', 'userSearch'),

  usersCount: function() {
    return this.getPath('editableUsersCount') + "_DisplayedUsers".loc() + this.getPath('selection.length') + "_selected".loc();
  }.property('editableUsersCount', 'selection').cacheable(),

  isDeletable: function() {

    if(!CoreTasks.getPath('permissions.canDeleteUser')) return false;

    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    
    var selectedUser = sel.get('firstObject');
    if(selectedUser === CoreTasks.get('currentUser')) return false; // can't delete yourself!

    return true;

  }.property('selection').cacheable(),
  
  role: function(key, value) {
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    if (value !== undefined) {
      sel.forEach(function(user) {
        var role = user.get('role');
        if(role !== value) user.set('role', value);
      });
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    } else {
      var firstRole = null;
      sel.forEach(function(user) {
        var role = user.get('role');
        if(!firstRole) firstRole = value = role;
        else if(role !== firstRole) value = null;
      });
    }
    return value;
  }.property('selection').cacheable(),
  
  setRoleManager: function() {
    this.role('role', CoreTasks.USER_ROLE_MANAGER);
  },
  
  setRoleDeveloper: function() {
    this.role('role', CoreTasks.USER_ROLE_DEVELOPER);
  },
  
  setRoleTester: function() {
    this.role('role', CoreTasks.USER_ROLE_TESTER);
  },
  
  setRoleGuest: function() {
    this.role('role', CoreTasks.USER_ROLE_GUEST);
  }
    
});