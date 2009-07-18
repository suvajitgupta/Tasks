/*globals Tasks sc_require */
sc_require('models/record');

Tasks.NEW_USER_NAME = "_FirstLast".loc();
Tasks.NEW_USER_LOGIN = "_first.last".loc();
Tasks.USER_UNASSIGNED = "_Unassigned".loc();

// Roles:
Tasks.USER_ROLE_MANAGER = "_Manager".loc();
Tasks.USER_ROLE_DEVELOPER = "_Developer".loc(); // default
Tasks.USER_ROLE_TESTER = "_Tester".loc();

/**
 * The user model.
 *
 * @extends Tasks.Record
 * @author Suvajit Gupta
 * @author Sean Eidemiller
 */
Tasks.User = Tasks.Record.extend({

  /**
   * The full name of the user (ex. "John Doe").
   */
  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.NEW_USER_NAME }),

  /**
   * The login name of the user (ex. "jdoe").
   */
  loginName: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.NEW_USER_LOGIN }),

  /**
   * The role of the user (see below for allowed values).
   */
  role: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: Tasks.USER_ROLE_DEVELOPER,
    allowed: [
      Tasks.USER_ROLE_MANAGER, 
      Tasks.USER_ROLE_DEVELOPER,
      Tasks.USER_ROLE_TESTER
    ]
  }), 

  /**
   * key:value pairs storing the user's preferences.
   */
  preferences: SC.Record.attr(Object),
 
  /**
   * A string token to store the authentication token after successful login.
   */
  authToken: SC.Record.attr(String),
  
  /**
   * The path to the icon associated with a user.
   */
  icon: function() {
    return 'sc-icon-user-16';
  }.property().cacheable(),

  /**
   * A string summarizing key facets of the Task for display.
   */
  displayName: function() {
    var name = this.get('name');
    var loginName = this.get('loginName');
    return "%@ (%@)".fmt(name, loginName);
  }.property('name', 'loginName').cacheable()

});
