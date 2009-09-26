/*globals CoreTasks sc_require */
sc_require('models/record');

CoreTasks.USER_UNASSIGNED = '_Unassigned';
CoreTasks.NEW_USER_NAME = '_FirstLast';
CoreTasks.NEW_USER_LOGIN_NAME = '_Initials';


// Roles:
CoreTasks.USER_ROLE_MANAGER = '_Manager';
CoreTasks.USER_ROLE_DEVELOPER = '_Developer'; // default
CoreTasks.USER_ROLE_TESTER = '_Tester';
CoreTasks.roles = [ CoreTasks.USER_ROLE_MANAGER, CoreTasks.USER_ROLE_DEVELOPER, CoreTasks.USER_ROLE_TESTER ];


// Loading:
CoreTasks.USER_NOT_LOADED = 1;
CoreTasks.USER_UNDER_LOADED = 2;
CoreTasks.USER_PROPERLY_LOADED = 3;
CoreTasks.USER_OVER_LOADED = 4;

/**
 * The user model.
 *
 * @extends CoreTasks.Record
 * @author Suvajit Gupta
 * @author Sean Eidemiller
 */
CoreTasks.User = CoreTasks.Record.extend({

  /**
   * The full name of the user.
   */
  name: SC.Record.attr(String, { isRequired: YES, defaultValue: CoreTasks.NEW_USER_NAME }),

  /**
   * The login name of the user.
   */
  loginName: SC.Record.attr(String, { isRequired: YES, defaultValue: CoreTasks.NEW_USER_LOGIN_NAME }),

  /**
   * The role of the user (see below for allowed values).
   */
  role: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: CoreTasks.USER_ROLE_DEVELOPER,
    allowed: [
      CoreTasks.USER_ROLE_MANAGER, 
      CoreTasks.USER_ROLE_DEVELOPER,
      CoreTasks.USER_ROLE_TESTER
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
    return '%@ (%@)'.fmt(name, loginName);
  }.property('name', 'loginName').cacheable()

});

CoreTasks.User.mixin(/** @scope CoreTasks.User */ {
  callbacks: SC.Object.create(),
  resourcePath: 'user'
});

CoreTasks.User.NEW_USER_HASH = {
  name: CoreTasks.NEW_USER_NAME,
  loginName: CoreTasks.NEW_USER_LOGIN_NAME,
  role: CoreTasks.USER_ROLE_DEVELOPER
};
