/*globals CoreTasks sc_require */
sc_require('models/record');

CoreTasks.USER_UNASSIGNED = '_Unassigned';
CoreTasks.NEW_USER_NAME = '_FirstLast';
CoreTasks.NEW_USER_LOGIN_NAME = '_Initials';
CoreTasks.USER_NONE = "none"; // used to specify unassigned user via task inline editing

// Roles:
CoreTasks.USER_ROLE_MANAGER = '_Manager';
CoreTasks.USER_ROLE_DEVELOPER = '_Developer'; // default
CoreTasks.USER_ROLE_TESTER = '_Tester';
CoreTasks.USER_ROLE_GUEST = '_Guest';

CoreTasks.roles = [
  CoreTasks.USER_ROLE_MANAGER,
  CoreTasks.USER_ROLE_DEVELOPER,
  CoreTasks.USER_ROLE_TESTER,
  CoreTasks.USER_ROLE_GUEST
];

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
  email: SC.Record.attr(String),
  
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
    var name = this.get('name').loc();
    var loginName = this.get('loginName').loc();
    return '%@ (%@)'.fmt(name, loginName);
  }.property('name', 'loginName').cacheable(),
  
  /**
   * Export a user's attributes.
   *
   * @returns {String) A string with the user's data exported in it.
   */
  exportData: function() {
    return "{ name: '" + this.get('name') + "', loginName: '" + this.get('loginName') + "', role: '" + this.get('role') + "', password: '' }\n";
  },
  
  /**
   * Custom destroy to clean out task submitter/assignee for this user.
   */
  destroy: function() {
    sc_super();

    var id = this.get('id');
    var store = this.get('store');
    
    var submittedTasksQuery = SC.Query.local(CoreTasks.Task, "submitterId=%@".fmt(id));
    submittedTasksQuery.set('initialServerFetch', NO);
    var submittedTasks = store.find(submittedTasksQuery);
    if (submittedTasks) {
      submittedTasks.forEach(function(task) {
        task.set('submitterId', null);
      });
      submittedTasks.destroy();
      submittedTasksQuery = null;
    }
    
    var assignedTasksQuery = SC.Query.local(CoreTasks.Task, "assigneeId=%@".fmt(id));
    assignedTasksQuery.set('initialServerFetch', NO);
    var assignedTasks = store.find(assignedTasksQuery);
    if (assignedTasks) {
      assignedTasks.forEach(function(task) {
        task.set('assigneeId', null);
      });
      assignedTasks.destroy();
      assignedTasksQuery = null;
    }
    
  },
  
  /**
   * A read-only computed property that returns the list of tasks assigned to this user
   * before it was first persisted.
   *
   * @returns {SC.RecordArray} An array of tasks.
   */
  disassociatedAssignedTasks: function() {
    // Create the query if necessary.
    if (!this._disassociatedAssignedTasksQuery) {
      this._disassociatedAssignedTasksQuery = SC.Query.local(CoreTasks.Task, "assigneeId=%@".fmt(this.get('_id')));
      this._disassociatedAssignedTasksQuery.set('initialServerFetch', NO);
    }

    // Execute the query and return the results.
    return this.get('store').find(this._disassociatedAssignedTasksQuery);
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
      this._disassociatedSubmittedTasksQuery = SC.Query.local(CoreTasks.Task, "submitterId=%@".fmt(this.get('_id')));
      this._disassociatedSubmittedTasksQuery.set('initialServerFetch', NO);
    }

    // Execute the query and return the results.
    return this.get('store').find(this._disassociatedSubmittedTasksQuery);
  }.property('_id').cacheable()

});

CoreTasks.User.mixin(/** @scope CoreTasks.User */ {
  callbacks: SC.Object.create(),
  resourcePath: 'user',

  /**
   * Authenticates a user given a password hash.
   */
  authenticate: function(loginName, passwordHash, params) {
    if (!params) throw 'Error authenticating user: Missing success/failure callbacks.';

    params.queryParams = {
      loginName: "'%@'".fmt(loginName),
      password: "'%@'".fmt(passwordHash)
    };

    // Send the request off to the server.
    CoreTasks.executeTransientGet(CoreTasks.User.resourcePath, undefined, params);
  }

});

CoreTasks.User.NEW_USER_HASH = {
  name: CoreTasks.NEW_USER_NAME,
  loginName: CoreTasks.NEW_USER_LOGIN_NAME,
  role: CoreTasks.USER_ROLE_DEVELOPER,
  password: ''
};
