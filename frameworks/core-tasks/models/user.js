/*globals CoreTasks sc_require */
sc_require('models/record');

CoreTasks.USER_UNASSIGNED = '_Unassigned';
CoreTasks.NEW_USER_NAME = '_FirstLast';
CoreTasks.NEW_USER_LOGIN_NAME = '_Initials';


// Roles:
CoreTasks.USER_ROLE_MANAGER = '_Manager';
CoreTasks.USER_ROLE_DEVELOPER = '_Developer'; // default
CoreTasks.USER_ROLE_TESTER = '_Tester';
CoreTasks.USER_ROLE_GUEST = '_Guest'; // I added this as a role type that would allow viewing && commenting status only [JH2]
CoreTasks.roles = [ CoreTasks.USER_ROLE_MANAGER, CoreTasks.USER_ROLE_DEVELOPER, CoreTasks.USER_ROLE_TESTER, CoreTasks.USER_ROLE_GUEST ];


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
      CoreTasks.USER_ROLE_TESTER,
      CoreTasks.USER_ROLE_GUEST
    ]
  }),
  
  /**
    The email address of the user.
  */
  emailAddress: SC.Record.attr(String),
  
  /**
    The password for the user. {SHA1-ified}
  */
  password: SC.Record.attr(String),

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
  }.property('name', 'loginName').cacheable(),

  /**
   * A read-only computed property that returns the list of tasks assigned to this user
   * before it was first persisted.
   *
   * @returns {SC.RecordArray} An array of tasks.
   */
  disassociatedAssignedTasks: function() {
    // Create the query if necessary.
    if (!this._disassociatedAssignedTasksQuery) {
      this._disassociatedAssignedTasksQuery = SC.Query.create({ recordType: CoreTasks.Task });
    }

    // Narrow the conditions.
    this._disassociatedAssignedTasksQuery.set('conditions', 'assigneeId = %@');
    this._disassociatedAssignedTasksQuery.set('parameters', [this.get('_id')]);

    // Execute the query and return the results.
    return this.get('store').findAll(this._disassociatedAssignedTasksQuery);
  }.property('_id').cacheable(),

  /**
   * A read-only computed property that returns the list of tasks submitted by this user
   * before it was first persisted.
   *
   * @returns {SC.RecordArray} An array of tasks.
   */
  disassociatedSubmittedTasks: function() {
    // Create the query if necessary.
    if (!this._disassociatedSubmittedTasksQuery) {
      this._disassociatedSubmittedTasksQuery = SC.Query.create({ recordType: CoreTasks.Task });
    }

    // Narrow the conditions.
    this._disassociatedSubmittedTasksQuery.set('conditions', 'submitterId = %@');
    this._disassociatedSubmittedTasksQuery.set('parameters', [this.get('_id')]);

    // Execute the query and return the results.
    return this.get('store').findAll(this._disassociatedSubmittedTasksQuery);
  }.property('_id').cacheable()

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

// Register the appropriate callbacks.
CoreTasks.registerCallback(
  CoreTasks.User, 'post', 'success', CoreTasks.userCreated.bind(CoreTasks));

CoreTasks.registerCallback(
  CoreTasks.User, 'put', 'success', CoreTasks.userUpdated.bind(CoreTasks));
