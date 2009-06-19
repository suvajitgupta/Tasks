// ==========================================================================
// Project: Tasks
// Copyright: 2009 Eloqua Limited
// ==========================================================================
sc_require('models/record');

Tasks.consts.NEW_USER_NAME = "_FirstLast".loc();
Tasks.consts.NEW_USER_LOGIN = "_first.last".loc();
Tasks.consts.USER_UNASSIGNED = "_Unassigned".loc();

// Roles:
Tasks.consts.USER_ROLE_MANAGER = "_Manager".loc();
Tasks.consts.USER_ROLE_DEVELOPER = "_Developer".loc(); // default
Tasks.consts.USER_ROLE_TESTER = "_Tester".loc();

/**
 * The user model.
 *
 * TODO: Add more descriptive docs.
 *
 * @extends Tasks.Record
 * @author Suvajit Gupta
 * @author Sean Eidemiller
 */
Tasks.User = Tasks.Record.extend({

  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.NEW_USER_NAME }),
  loginName: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.NEW_USER_LOGIN }),

  role: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: Tasks.consts.USER_ROLE_DEVELOPER,
    allowed: [
      Tasks.consts.USER_ROLE_MANAGER, 
      Tasks.consts.USER_ROLE_DEVELOPER,
      Tasks.consts.USER_ROLE_TESTER
    ]
  }), 

  preferences: SC.Record.attr(Object), // key:value pairs
  authToken: SC.Record.attr(String),
  
  displayName: function() {
    var name = this.get('name');
    var loginName = this.get('loginName');
    var ret = name;
    if (loginName) ret += ' (' + loginName + ')';
    return ret;
  }.property('name', 'loginName').cacheable()

});
