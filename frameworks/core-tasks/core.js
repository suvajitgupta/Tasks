/**
 * The core object of the Tasks framework.
 *
 * @author Sean Eidemiller
 * @author Suvajit Gupta
 */
/*globals CoreTasks SCUDS */

CoreTasks = SC.Object.create({
  
  /**
   * Make localized string start with uppercase letter and be lowercase afterwards
   */
  normalizeLocalizedString: function(str) {
    if(SC.empty(str) || str.length < 3 || str[0] !== '_') return str; // nothing to do
    return '_' + str[1].toUpperCase() + str.slice(2).toLowerCase();
  },
  
  // Customizable "Use Local Storage": if set to true records will be cached in browser's local storage database
  useLocalStorage: true,
  
  // Customizable "Send Notifications": if set to true email notifications will be send from Server for 'notable' events
  sendNotifications: true,
  
  /*
   * Tasks data source types
   */
  REMOTE_DATA_SOURCE: 0x0001,
  FIXTURES_DATA_SOURCE: 0x0002,
  dataSourceType: 0x0001,
  
  /*
   * Arrays of all records in the store.
   */
  allUsers: null,
  allTasks: null,
  allProjects: null,
  allWatches: null,
  allComments: null,

  /*
   * System projects ("virtual" projects created at runtime and not persisted).
   */
  allTasksProject: null,
  unallocatedTasksProject: null,
  unassignedTasksProject: null,

  /*
   * The resource path format for the remote server.
   */
  _resourcePathFormat: 'tasks-server/%@%@%@',

  /*
   * Used to assign all newly-created records with a negative ID.
   *
   * Note: This counter may run out of integers if the client is left running for a long time.
   *
   * TODO: [SG] revert to negative numbers once SC.Query is able to parse them correctly.
   */
  MAX_RECORD_ID: 100000000,
  _currentRecordId: 100000000,
  //_currentRecordId: -1,

  /**
   * Initializes the CoreTasks object.
   */
  init: function() {
    // Don't use localStorage for fixtures or iPad or IE.
    // console.log('DEBUG: CoreTasks init()');
    if (this.get('dataSourceType') === this.FIXTURES_DATA_SOURCE || SC.platform.touch || SC.browser.msie) this.useLocalStorage = false;
  },

  /**
   * Initializes the main store with the given data source.
   */
  initStore: function() {
    
    // console.log('DEBUG: initStore() store=', this.get('store'));
    if(SC.none(this.get('store'))) { // not already initialized

      // Create the appropriate data source.
      var dataSource;
      if (CoreTasks.get('dataSourceType') === CoreTasks.REMOTE_DATA_SOURCE) {
        dataSource = CoreTasks.CachingRemoteDataSource.create();
        SC.Logger.log('Using caching remote data source.');
      }
      else { // FIXTURES_DATA_SOURCE
        dataSource = SC.FixturesDataSource.create();
        SC.Logger.log('Using fixtures data source.');
      }

      // Create the store itself.
      var store = CoreTasks.Store.create();
      store.set('dataSource', dataSource);

      // Load data from local storage.
      if (dataSource.loadCachedRecords) {
        dataSource.loadCachedRecords();
      }

      this.set('store', store);
      
    }
  },

  needsSave: false, // dirty bit to track if a save is needed
  
  /**
   * Check if a loginName is reserved or in use already.
   *
   * @param {Object} user whose loginName to be checked.
   * @returns {Boolean} true if valid, false otherwise.
   */
  isLoginNameValid: function(specifiedUser) {
    var loginName = specifiedUser.get('loginName');
    if (loginName.toLowerCase() === CoreTasks.USER_NONE) return false;
    
    if (!this.allUsers) return true;
    var usersCount = this.allUsers.get('length');
    for (var i = 0; i < usersCount; i++) {
      var user = this.allUsers.objectAt(i);
      if (user == specifiedUser) continue;
      if (user.get('loginName') === loginName) return false;
    }

    return true;
  },

  /**
   * Get user for a given loginName (if it exists).
   *
   * @param {String} user's login name.
   * @returns {Object} user record, if matching one exists, or null.
   */
  getUserByLoginName: function(loginName) {
    if (!this.allUsers) return null;
    var usersCount = this.allUsers.get('length');
    var matchingUser = null;
    for (var i = 0; i < usersCount; i++) {
      var user = this.allUsers.objectAt(i);
      if (user.get('loginName') === loginName) {
        matchingUser = user;
        break;
      }
    }
    return matchingUser;
  },

  /**
   * Get users whose login or full name matches a given string.
   *
   * @param {String} string to match loginName exactly or name partially.
   * @returns {Array} array of user records, if matching ones exist, or empty array.
   */
  getUsersMatchingName: function(name) {
    if (!this.allUsers) return [];
    var matchingUsers = [];
    try {
      var namePattern = new RegExp(name);
      var usersCount = this.allUsers.get('length');
      for (var i = 0; i < usersCount; i++) {
        var user = this.allUsers.objectAt(i);
        if (user.get('loginName') === name || user.get('name').match(namePattern)) {
          matchingUsers.push(user);
        }
      }
    } catch (e) {}
    return matchingUsers;
  },

  /**
   * Get project for a given id (if it exists).
   *
   * @param {String} project id.
   * @returns {Object) return project of given id if it exists, null otherwise.
   */
  getProjectById: function(projectId) {
    if (!this.allProjects) return null;
    var projectsCount = this.allProjects.get('length');
    var matchingProject = null;
    projectId = parseInt(projectId, 10);
    for (var i = 0; i < projectsCount; i++) {
      var project = this.allProjects.objectAt(i);
      if (project.get('id') === projectId) {
        matchingProject = project;
        break;
      }
    }
    return matchingProject;
  },

  /**
   * Get project for a given name (if it exists).
   *
   * @param {String} project name.
   * @returns {Object) return project of given name if it exists, null otherwise.
   */
  getProjectByName: function(name) {
    if (!this.allProjects) return null;
    var projectsCount = this.allProjects.get('length');
    var matchingProject = null;
    for (var i = 0; i < projectsCount; i++) {
      var project = this.allProjects.objectAt(i);
      if (project.get('name') === name) {
        matchingProject = project;
        break;
      }
    }
    return matchingProject;
  },
  
  /**
   * Check if current user is watching a given task.
   *
   * @param {Object} task.
   * @returns {Boolean} CoreTasks.TASK_WATCH_ON if watching, CoreTasks.TASK_WATCH_OFF otherwise.
   */
  isCurrentUserWatchingTask: function(task) {
    if (this.allWatches) {
      var currentUserId = this.getPath('currentUser.id');
      var taskId = task.get('id');
      var watchesCount = this.allWatches.get('length');
      for (var i = 0; i < watchesCount; i++) {
        var watch = this.allWatches.objectAt(i);
        if (watch.get('userId') !== currentUserId) continue;
        if (watch.get('taskId') === taskId) return CoreTasks.TASK_WATCH_ON;
      }
    }
    return CoreTasks.TASK_WATCH_OFF;
  },

  isCurrentUserAManager: function() {
    return this.getPath('currentUser.role') === CoreTasks.USER_ROLE_MANAGER;
  }.property('currentUser').cacheable(),

  /**
   * Check if any user is watching a given task.
   *
   * @param {Object} task.
   * @returns {Boolean} CoreTasks.TASK_WATCH_ON if watching, CoreTasks.TASK_WATCH_OFF otherwise.
   */
  isAnyUserWatchingTask: function(task) {
    if (this.allWatches) {
      var taskId = task.get('id');
      var watchesCount = this.allWatches.get('length');
      for (var i = 0; i < watchesCount; i++) {
        var watch = this.allWatches.objectAt(i);
        if (watch.get('taskId') === taskId) return CoreTasks.TASK_WATCH_ON;
      }
    }
    return CoreTasks.TASK_WATCH_OFF;
  },

  /**
   * Get watch for current user on a given task.
   *
   * @param {Object} task.
   * @returns {Object} watch (if exists), or null (if not).
   */
  getCurrentUserTaskWatch: function(task) {
    if (this.allWatches)  {
      var currentUserId = this.getPath('currentUser.id');
      var taskId = task.get('id');
      var watchesCount = this.allWatches.get('length');
      for (var i = 0; i < watchesCount; i++) {
        var watch = this.allWatches.objectAt(i);
        if (watch.get('userId') !== currentUserId) continue;
        if (watch.get('taskId') === taskId) return watch;
      }
    }
    return null;
  },

  /**
   * Get watches for a given task.
   *
   * @param {Object} task.
   * @returns {Array} watches (may be empty).
   */
  getTaskWatches: function(task) {
    var ret = [];
    if (this.allWatches)  {
      var taskId = task.get('id');
      var watchesCount = this.allWatches.get('length');
      for (var i = 0; i < watchesCount; i++) {
        var watch = this.allWatches.objectAt(i);
        if (watch.get('taskId') === taskId) ret.push(watch);
      }
    }
    return ret;
  },

  /**
   * Get comments for a given task.
   *
   * @param {Object} task.
   * @returns {Array} comments (may be empty) sorted most recent first.
   */
  getTaskComments: function(task) {
    var ret = [];
    if (this.allComments)  {
      var taskId = task.get('id');
      var commentsCount = this.allComments.get('length');
      for (var i = 0; i < commentsCount; i++) {
        var comment = this.allComments.objectAt(i);
        if (comment.get('taskId') === taskId) ret.push(comment);
      }
    }
    return ret.sort(function(a,b) {
      var aDate = a.get('createdAt').get('milliseconds');
      var bDate = b.get('createdAt').get('milliseconds');
      if (aDate === bDate) return 0;
      else return aDate > bDate? -1 : 1;
    }
    );
  },

  /*
   * The currently-logged-in user.
   */
  currentUser: null,

  /*
   * Permissions for the currently-logged-in user.
   */
  permissions: SC.Object.create({
    canCreateProject: NO,
    canUpdateProject: NO,
    canDeleteProject: NO,
    canCreateTask: NO,
    canUpdateTask: NO,
    canDeleteTask: NO,
    canCreateUser: NO,
    canUpdateUserRole: NO,
    canDeleteUser: NO
  }),

  // FIXME: [SG] enforce all permissions on GAE Server as well (e.g., Guests shouldn't be able to update/delete others' tasks)
  /**
   * Sets appropriate permissions based on the current user's role.
   */
  // TODO: [SG] make currentUser permission setting happen automatically in CoreTasks, instead of Tasks having to call setPermissions()
  setPermissions: function() {
    if (!this.currentUser) return;

    switch (this.currentUser.get('role')) {
      case CoreTasks.USER_ROLE_MANAGER:
        this.permissions.set('canCreateProject', YES);
        this.permissions.set('canUpdateProject', YES);
        this.permissions.set('canDeleteProject', YES);
        this.permissions.set('canCreateTask', YES);
        this.permissions.set('canUpdateTask', YES);
        this.permissions.set('canDeleteTask', YES);
        this.permissions.set('canCreateUser', YES);
        this.permissions.set('canUpdateUserRole', YES);
        this.permissions.set('canDeleteUser', YES);
        break;
      case CoreTasks.USER_ROLE_DEVELOPER:
      case CoreTasks.USER_ROLE_TESTER:
        this.permissions.set('canCreateProject', NO);
        this.permissions.set('canUpdateProject', NO);
        this.permissions.set('canDeleteProject', NO);
        this.permissions.set('canCreateTask', YES);
        this.permissions.set('canUpdateTask', YES);
        this.permissions.set('canDeleteTask', YES);
        this.permissions.set('canCreateUser', NO);
        this.permissions.set('canUpdateUserRole', NO);
        this.permissions.set('canDeleteUser', NO);
        break;
      case CoreTasks.USER_ROLE_GUEST:
        this.permissions.set('canCreateProject', NO);
        this.permissions.set('canUpdateProject', NO);
        this.permissions.set('canDeleteProject', NO);
        this.permissions.set('canCreateTask', YES);
        this.permissions.set('canUpdateTask', YES);
        this.permissions.set('canDeleteTask', YES);
        this.permissions.set('canCreateUser', NO);
        this.permissions.set('canUpdateUserRole', NO);
        this.permissions.set('canDeleteUser', NO);
        break;
    }
  },

  /**
   * See if project is a system project.
   *
   * @param {Object} project to check.
   * @returns {Boolean} true if system project, false otherwise.
   */
  isSystemProject: function(project) {
    return project === CoreTasks.get('allTasksProject') ||
           project === CoreTasks.get('unallocatedTasksProject') ||
           project === CoreTasks.get('unassignedTasksProject');
  },

  /**
   * Creates a new record in the store.
   *
   * @param {CoreTasks.Record} recordType The type of the record.
   * @param {Hash} dataHash An optional data hash to seed the new record.
   */
  createRecord: function(recordType, dataHash) {
    // console.log('DEBUG: createRecord(): ' + recordType);
    if (!dataHash) dataHash = {};

    // Assign the new record a negative integer ID (will be overwritten upon persistence to the
    // server, but certain SC mechanisms require that all records have a primary key).
    if (dataHash.id === undefined) {
      dataHash.id = dataHash._id = this._currentRecordId;
      // TODO: [SC] remove hack once SC.Query is able to parse negative numbers
      // this._currentRecordId--;
      this._currentRecordId++;
    }

    // Check to see if the record defines a createRecord function (if it does, call it).
    if (recordType.createRecord) {
      return recordType.createRecord(recordType, dataHash);
    } else {
      // Otherwise, call createRecord on the store.
      return this.get('store').createRecord(recordType, dataHash);
    }
  },

  /**
   * A read-only computed property that returns true if a save is currently in progress; false
   * otherwise.
   *
   * @returns {Boolean}
   */
  isSaving: function() {
    return (this._saveDelegate && this._saveDelegate.saveInProgress);
  }.property(),

  /**
   * Persists all new and modified records to the store.
   *
   * Persistence must occur in a precise order to maintain entity associations.
   */
  saveChanges: function() {
    if (CoreTasks.get('dataSourceType') === CoreTasks.FIXTURES_DATA_SOURCE) { // nothing to do in fixtures mode.
      this.set('needsSave', NO);
      return;
    }

    // Initialize the save delegate if necessary.
    if (!this._saveDelegate) {
      this._saveDelegate = CoreTasks.RemoteSaveDelegate.create({
        saveSuccessCallback: this._saveSuccessCallback.bind(this),
        saveFailureCallback: this._saveFailureCallback.bind(this)
      });
    }

    if (this._saveDelegate.saveInProgress === YES) {
      SC.Logger.error('Error saving data: Save already in progress.');
      return;
    }

    var store = this.get('store'), key, recType, recStatus, records, len, i;

    // Get the store keys of the system projects that we don't want to persist.
    var allKey = this.getPath('allTasksProject.storeKey');
    var unallocatedKey = this.getPath('unallocatedTasksProject.storeKey');
    var unassignedKey = this.getPath('unassignedTasksProject.storeKey');

    // Get all the dirty records from the store.
    var dirtyRecordKeys = store.changelog;
    len = dirtyRecordKeys ? dirtyRecordKeys.length : 0;

    if (len === 0) {
      // Apparently there was nothing to persist.
      SC.Logger.debug('Nothing new to save.');
      this.set('needsSave', NO);
    }

    var dirtyUsers = [];
    var dirtyProjects = [];
    var dirtyTasks = [];
    var dirtyWatches = [];
    var dirtyComments = [];

    for (i = 0; i < len; i++) {
      key = dirtyRecordKeys[i];
      recStatus = store.peekStatus(key);
      recType = store.recordTypeFor(key);

      // Short-circuit if status is CLEAN (you can't always trust the changelog).
      if (recStatus & SC.Record.CLEAN && recStatus !== SC.Record.READY_NEW) continue;

      switch (recType) {
        case CoreTasks.User:
          dirtyUsers.push(key);
          break;
        case CoreTasks.Project:
          if (key !== allKey && key !== unallocatedKey && key !== unassignedKey) {
            dirtyProjects.push(key);
          }
          break;
        case CoreTasks.Task:
          dirtyTasks.push(key);
          break;
        case CoreTasks.Watch:
          dirtyWatches.push(key);
          break;
        case CoreTasks.Comment:
          // HA! Dirty comments...
          dirtyComments.push(key);
          break;
      }
    }

    // Build the array of type objects used by the save delegate.
    var types = [
      {
        type: CoreTasks.User,
        order: 1,
        storeKeys: dirtyUsers,
        postSaveFunction: this._userSaved.bind(this),
        abortOnError: YES
      },
      {
        type: CoreTasks.Project,
        order: 2,
        storeKeys: dirtyProjects,
        postSaveFunction: this._projectSaved.bind(this),
        abortOnError: YES
      },
      {
        type: CoreTasks.Task,
        storeKeys: dirtyTasks,
        postSaveFunction: this._taskSaved.bind(this)
      },
      {
        type: CoreTasks.Watch,
        storeKeys: dirtyWatches
      },
      {
        type: CoreTasks.Comment,
        storeKeys: dirtyComments
      }
    ];

    // Pass control to the save delegate.
    this._saveDelegate.save(types);
  },

  _userSaved: function(user) {
    if (!user) return;

    SC.RunLoop.begin();
    var userId = user.readAttribute('id');

    // Update the now-disassociated assigned tasks.
    var tasks = user.get('disassociatedAssignedTasks');
    if (tasks && SC.instanceOf(tasks, SC.RecordArray)) {
      tasks.forEach(function(task) {
        task.writeAttribute('assigneeId', userId);
      });
    }

    // Update the now-disassociated submitted tasks.
    tasks = user.get('disassociatedSubmittedTasks');
    if (tasks && SC.instanceOf(tasks, SC.RecordArray)) {
      tasks.forEach(function(task) {
        task.writeAttribute('submitterId', userId);
      });
    }

    SC.RunLoop.end();
  },

  _projectSaved: function(project) {
    if (!project) return;

    SC.RunLoop.begin();
    var projectId = project.readAttribute('id');
    
    // Update the now-disassociated tasks.
    var tasks = project.get('disassociatedTasks');
    if (tasks && SC.instanceOf(tasks, SC.RecordArray)) {
      tasks.forEach(function(task) {
        task.writeAttribute('projectId', projectId);
      });
    }

    SC.RunLoop.end();
  },

  _taskSaved: function(task) {
    if (!task) return;

    SC.RunLoop.begin();
    var taskId = task.readAttribute('id');
    
    // Update the now-disassociated watches.
    var watches = task.get('disassociatedWatches');
    if (watches && SC.instanceOf(watches, SC.RecordArray)) {
      watches.forEach(function(watch) {
        watch.writeAttribute('taskId', taskId);
      });
    }

    // Update the now-disassociated comments.
    var comments = task.get('disassociatedComments');
    if (comments && SC.instanceOf(comments, SC.RecordArray)) {
      comments.forEach(function(comment) {
        comment.writeAttribute('taskId', taskId);
      });
    }

    SC.RunLoop.end();
  },

  _saveSuccessCallback: function() {
    this.set('needsSave', NO);
  },

  _saveFailureCallback: function(errorRecordType) {
    if (errorRecordType !== undefined) {
      if (this.dataSaveErrorCallback) this.dataSaveErrorCallback(errorRecordType);
    }
  },

  /**
   * Computes the full path component of the URL given a resource name and an optional ID.
   *
   * @param {String} resourceName The name of the resource (ex. 'project').
   * @param {String} id The ID of the entity (optional).
   * @param {Hash} queryParams Query parameters to append (optional).
   *
   * @returns {String} The full path component of the URL.
   */
  getFullResourcePath: function(resourceName, id, queryParams) {
    var params = '';
    id = id ? '/' + id : '';

    if (queryParams) {
      var i = 0;

      for (var key in queryParams) {
        if (queryParams.hasOwnProperty(key)) {
          params += '%@%@=%@'.fmt(i === 0 ? '?' : '&', key, queryParams[key]);
          i++;
        }
      }
    }

    return this._resourcePathFormat.fmt(resourceName, id, params);
  },

  /**
   * Display time with 'd' appended if no time unit present.
   *
   * @param (String) timeString in days or hours
   * @returns {String) return time with unit appended.
   */
  displayTime: function(timeString) {
    if (SC.none(timeString)) return null;
    var lastChar = timeString[timeString.length-1];
    var displayTime = parseFloat(parseFloat(timeString, 10).toFixed(3));
    var idx = timeString.indexOf('-'); // see if time is a range
    if (idx !== -1) { // a range
      var max = parseFloat(parseFloat(timeString.slice(idx+1), 10).toFixed(3));
      displayTime += ('-' + max);
    }
    return displayTime + ((lastChar === 'd' || lastChar === 'h')? lastChar : 'd');
  },
  
  /**
   * Extract time unit (if specified).
   *
   * @param (String) time in days or hours
   * @returns {String) return time unit (if specified) or the empty string ''.
   */
  getTimeUnit: function(time) {
    if (SC.none(time)) return '';
    var lastChar = time[time.length-1];
    return (lastChar === 'd' || lastChar === 'h') ? lastChar : '';
  },
  
  /**
   * Convert time into days using time unit if available (assumed 'd' otherwise)
   *
   * @param (String) time in days or hours
   */
  convertTimeToDays: function(time) {
    if (SC.none(time)) return 0;
    var lastChar = time[time.length-1];
    var ret;
    if (lastChar === 'd') ret = time.slice(0, time.length-1); // already in days, remove time unit
    else if (lastChar === 'h') ret = time.slice(0, time.length-1)/8; // asssumes 8h days, convert, remove time unit
    else ret = time; // already number of days
    return parseFloat(parseFloat(ret, 10).toFixed(3));
  },
  
  /**
   * Returns a nicely formatted "how long ago" for a given time.
   *
   * @param (SC.DateTime) time which to format
   * @returns {String) formatted version.
   */
  getTimeAgo: function(then) {
    var time, now = SC.DateTime.create();
    var minutes = (now.get('milliseconds') - then.get('milliseconds')) / 60000;
    if(Math.round(minutes) <= 1) time = "_justNow".loc();
    else if(minutes < 60) time = (Math.round(minutes) + "_minutesAgo".loc());
    else {
      var hours = minutes / 60;
      if(hours < 2) time = "_oneHourAgo".loc();
      else if(hours < 24) time = (Math.round(hours) + "_hoursAgo".loc());
      else {
        var days = hours / 24;
        if(days < 2) time = "_yesterday".loc();
        else if (days < 30) time = (Math.round(days) + "_daysAgo".loc());
        else time = then.toFormattedString(CoreTasks.DATE_FORMAT);
      }
    }
    return time;
  }

});

/**
 * A delegate that handles the rather complicated business of saving dirty records to the remote
 * server.
 *
 * Complicated because the order in which persistence occurs is important...
 */
CoreTasks.RemoteSaveDelegate = SC.Object.extend({

  /**
   * YES if save currently in progress.
   */
  saveInProgress: NO,

  /**
   * The record currently being saved.
   */
  recordBeingSaved: null,

  /**
   * The function to invoke if the entire save operation fails.
   */
  saveFailureCallback: null,

  /**
   * The function to invoke if the entire save operation succeeds.
   */
  saveSuccessCallback: null,

  /*
   * Internal machineary.
   */
  _store: null,

  /**
   * Initializes the save delegate.
   */
  init: function() {
    this.reset();
  },

  /**
   * Saves a bunch of records to the server.
   *
   * Takes one argument (types); an array of objects that should look like the following...
   *
   * { order: <int>, storeKeys: [<int>], postSaveFunction: <function>, abortOnError: <bool> }
   *
   * order: The order in which the type should be saved (optional).
   * storeKeys: An array of store keys of dirty records for the corresponding type.
   * postSaveFunction: A function to invoke on successful save of each record (optional).
   * abortOnError: Boolean indicating error strategy; YES means abort entire save operation
   *   (optional).
   */
  save: function(types) {
    SC.Logger.debug('Initiating save operation...');

    if (SC.typeOf(types) !== SC.T_ARRAY) {
      SC.Logger.warn('Error saving records: Invalid types array.');
      return;
    }

    // Reset everything, just in case.
    this.reset();

    // This would be retarded, but you never know.
    if (types.length === 0) return;

    // Make our intentions known.
    this.saveInProgress = YES;

    // Sort the types array by order.
    types.sort(function(a, b) {
      var aHasOrder = (SC.typeOf(a.order) === SC.T_NUMBER);
      var bHasOrder = (SC.typeOf(b.order) === SC.T_NUMBER);

      if (!aHasOrder && !bHasOrder) {
        return 0;
      } else if (!aHasOrder && bHasOrder) {
        return 1;
      } else if (aHasOrder && !bHasOrder) {
        return -1;
      } else {
        return (a.order - b.order);
      }
    });

    // Kick shit off.
    this._typesBeingSaved = types;
    this._currentTypeBeingSaved = this._typesBeingSaved.shift();
    this._getNextDirtyKeyAndCommit();
  },

  /**
   * Resets the save delegate.
   */
  reset: function() {
    this.recordBeingSaved = null;
    this.saveInProgress = NO;
    this.saveFailureCallback = null;
    this._typesBeingSaved = null;
    this._currentTypeBeingSaved = null;

    if (!this._store) this._store = CoreTasks.get('store');
  },

  _recordBeingSavedDidChange: function() {
    var rec = this.get('recordBeingSaved');

    if (rec && this.saveInProgress === YES) {
      var status = rec.get('status');

      if (status & SC.Record.READY || status === SC.Record.DESTROYED_CLEAN) {
        this.removeObserver('recordBeingSaved.status', this, this._recordBeingSavedDidChange);

        // Execute post-save function.
        var func = this._currentTypeBeingSaved.postSaveFunction;
        if (SC.typeOf(func) === SC.T_FUNCTION) func(rec);

        // Continue saving dirty records, if there are any left.
        this._getNextDirtyKeyAndCommit();

      } else if (status & SC.Record.ERROR) {
        this.removeObserver('recordBeingSaved.status', this, this._recordBeingSavedDidChange);

        // Save failed; revert record to pre-commit state.
        SC.Logger.error('Error saving record: %@'.fmt(rec));
        if (rec.revertState) rec.revertState();

        // Abort if requested.
        if (this._currentTypeBeingSaved.abortOnError === YES) {
          SC.Logger.error('Aborting save operation.');
          this.reset();

          if (SC.typeOf(this.saveFailureCallback) === SC.T_FUNCTION) {
            this.saveFailureCallback(this._currentTypeBeingSaved.type);
          }

        } else {
          this._getNextDirtyKeyAndCommit();
        }
      }
    }
  },

  _getNextDirtyKeyAndCommit: function() {
    var nextDirtyKey = this._currentTypeBeingSaved.storeKeys.shift();

    if (nextDirtyKey) {
      // Add a new observer and commit.
      var nextDirtyRec = this._store.materializeRecord(nextDirtyKey);

      if (nextDirtyRec && nextDirtyRec.commit) {
        this.set('recordBeingSaved', nextDirtyRec);
        this.addObserver('recordBeingSaved.status', this, this._recordBeingSavedDidChange);
        nextDirtyRec.commit();
      } else {
        // Something weird happened.
        SC.Logger.error('Error saving record: Failed to materialize from store key.');

        if (this._currentTypeBeingSaved.abortOnError === YES) {
          SC.Logger.error('Aborting save operation.');
          this.reset();

          if (SC.typeOf(this.saveFailureCallback) === SC.T_FUNCTION) {
            this.saveFailureCallback(this._currentTypeBeingSaved.type);
          }

        } else {
          this._getNextDirtyKeyAndCommit();
        }
      }

    } else {
      // Done with the current record type; move on to the next one (if there is a next one).
      this._currentTypeBeingSaved = this._typesBeingSaved.shift();

      if (!this._currentTypeBeingSaved) {
        // We're done; everyhting saved.
        SC.Logger.debug('Save completed successfully.');
         this.reset();
        if (SC.typeOf(this.saveSuccessCallback) === SC.T_FUNCTION) this.saveSuccessCallback();
      } else {
        // Not done yet.
        this._getNextDirtyKeyAndCommit();
      }
    }
  }
  
});

CoreTasks.Store = SC.Store.extend({

  /**
   * Overrides loadRecord() to purge soft-deleted records.
   */
  loadRecord: function(recordType, dataHash, id) {
    if (!dataHash) return null;

    if (dataHash.status === "deleted") {
      var sk = this.storeKeyExists(recordType, id);
      if (!SC.none(sk)) {
        SC.RunLoop.begin();
        this.pushDestroy(recordType, id, sk);
        SC.RunLoop.end();
      }

      return null;
    }

    return sc_super();
    
  },
  
  createRecord: function(recordType, dataHash, id) {
    var ret = sc_super();
    CoreTasks.set('needsSave', YES);
    return ret;
  },
    
  recordDidChange: function(recordType, id, storeKey, key) {
    var ret = sc_super(); // MUST COME FIRST
      
    if (storeKey === undefined) storeKey = recordType.storeKeyFor(id);
    var status = this.readStatus(storeKey), K = SC.Record;
      
    if (status & K.RECORD_DIRTY || status & K.READY_NEW || 
        status & K.DESTROYED_DIRTY) {
      CoreTasks.set('needsSave', YES);
    }

    return ret;
  },
    
  destroyRecord: function(recordType, id, storeKey) {
    var ret = sc_super();
    CoreTasks.set('needsSave', YES);
    return ret;
  }
  
});

// Add the bind() function to the Function prototype.
SC.mixin(Function.prototype, {

  /**
   * This bind method was ported from the prototype for use in the AJAX callbacks.
   *
   *  Function#bind(object[, args...]) -> Function
   *  - object (Object): The object to bind to.
   *
   *  Wraps the function in another, locking its execution scope to an object
   *  specified by `object`.
   */
  bind: function (context) {
    var slice = Array.prototype.slice;

    var update = function(array, args) {
      var arrayLength = array.length, length = args.length;
      while (length--) array[arrayLength + length] = args[length];
      return array;
    };

    var merge = function(array, args) {
      array = slice.call(array, 0);
      return update(array, args);
    };

    if (arguments.length < 2 && SC.none(arguments[0])) return this;
    var __method = this, args = slice.call(arguments, 1);

    return function() {
      var a = merge(args, arguments);
      // var a = args.concat(arguments);
      return __method.apply(context, a);
    };
  }
    
});

// Date/Time formats.
CoreTasks.DATE_FORMAT = '%b %d, %Y';
CoreTasks.TIME_DATE_FORMAT = '%I:%M %p ' + CoreTasks.DATE_FORMAT;

// Request headers.
CoreTasks.HEADER_CONTENT_TYPE = 'Content-Type';
CoreTasks.HEADER_VALUE_CONTENT_TYPE = 'application/json';
CoreTasks.HEADER_ACCEPT = 'Accept';
CoreTasks.HEADER_VALUE_ACCEPT = 'application/json';

// Reusable SC.Request objects.
CoreTasks.REQUEST_GET = SC.Request.create({ type: 'GET', isJSON: YES })
  .header(CoreTasks.HEADER_CONTENT_TYPE, CoreTasks.HEADER_VALUE_CONTENT_TYPE)
  .header(CoreTasks.HEADER_ACCEPT, CoreTasks.HEADER_VALUE_ACCEPT);

CoreTasks.REQUEST_POST = SC.Request.create({ type: 'POST', isJSON: YES })
  .header(CoreTasks.HEADER_CONTENT_TYPE, CoreTasks.HEADER_VALUE_CONTENT_TYPE)
  .header(CoreTasks.HEADER_ACCEPT, CoreTasks.HEADER_VALUE_ACCEPT);

CoreTasks.REQUEST_PUT = SC.Request.create({ type: 'PUT', isJSON: YES })
  .header(CoreTasks.HEADER_CONTENT_TYPE, CoreTasks.HEADER_VALUE_CONTENT_TYPE)
  .header(CoreTasks.HEADER_ACCEPT, CoreTasks.HEADER_VALUE_ACCEPT);

CoreTasks.REQUEST_DELETE = SC.Request.create({ type: 'DELETE', isJSON: YES })
  .header(CoreTasks.HEADER_CONTENT_TYPE, CoreTasks.HEADER_VALUE_CONTENT_TYPE)
  .header(CoreTasks.HEADER_ACCEPT, CoreTasks.HEADER_VALUE_ACCEPT);

// Request errors.
CoreTasks.ERROR_UNEXPECTED_RESPONSE = SC.$error('Unexpected response.', 'Request Error');
CoreTasks.ERROR_INVALID_ID_TYPE = SC.$error('Invalid ID type.', 'Request Error');
