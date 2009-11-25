/*globals CoreTasks */

/**
 * The core object of the Tasks framework.
 *
 * @author Sean Eidemiller
 */
CoreTasks = SC.Object.create({
  
  needsSave: NO,
  
  // The main data store and record sets.
  store: SC.Store.create({
    
    recordDidChange: function(recordType, id, storeKey, key) {
      sc_super() ; // MUST COME FIRST
      
      if (storeKey === undefined) storeKey = recordType.storeKeyFor(id);
      var status = this.readStatus(storeKey), K = SC.Record;
      
      if (status & K.RECORD_DIRTY || status & K.READY_NEW || 
          status & K.DESTROYED_DIRTY) {
        // console.log('got a dirty record') ;
        CoreTasks.set('needsSave', YES) ;
      }
    },
    
    destroyRecord: function(recordType, id, storeKey) {
      sc_super() ;
      CoreTasks.set('needsSave', YES) ;
    }
    
  }),
  allUsers: null,
  allTasks: null,
  allProjects: null,

  /**
   * Clear all data from store.
   *
   */
  clearData: function() {
    
    this.allTasksProject = this.unallocatedTasksProject = null;
    
    if(this.allUsers) {
      this.allUsers.destroy();
      this.allUsers = null;
    }
    
    if(this.allTasks) {
      this.allTasks.destroy();
      this.allTasks = null;
    }
    
    if(this.allProjects) {
      this.allProjects.destroy();
      this.allProjects = null;
    }
    
    if(this.store) this.store.reset();
    
    this.set('needsSave', NO) ;
    
  },
  
  /**
   * Get user for a given loginName (if it exists).
   *
   * @param {String} user's login name.
   * @returns {Object} user record, if matching one exists, or null.
   */
  getUser: function(loginName) {
    if (!this.allUsers) return null;
    var usersCount = this.allUsers.get('length');
    var matchingUser = null;
    for(var i = 0; i < usersCount; i++) {
      var user = this.allUsers.objectAt(i);
      if(user.get('loginName') === loginName) {
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
  getUsers: function(string) {
    if (!this.allUsers) return [];
    var usersCount = this.allUsers.get('length');
    var namePattern = new RegExp(string);
    var matchingUsers = [];
    for(var i = 0; i < usersCount; i++) {
      var user = this.allUsers.objectAt(i);
      if(user.get('loginName') === string || user.get('name').match(namePattern)) {
        matchingUsers.push(user);
      }
    }
    return matchingUsers;
  },

  /**
   * Get project for a given name (if it exists).
   *
   * @param {String} project name.
   * @returns {Object) return project of given name if it exists, null otherwise.
   */
  getProject: function(name) {
    if (!this.allProjects) return null;
    var projectsCount = this.allProjects.get('length');
    var matchingProject = null;
    for(var i = 0; i < projectsCount; i++) {
      var project = this.allProjects.objectAt(i);
      if(project.get('name') === name) {
        matchingProject = project;
        break;
      }
    }
    return matchingProject;
  },
  
  // The resource path format for the remote server.
  _resourcePathFormat: 'tasks-server/%@%@%@',

  /*
   * The various modes related to the save mechanism.
   */
  MODE_NOT_SAVING: 0x0001,
  MODE_SAVING: 0x0002,
  MODE_SAVING_USERS: 0x0102,
  MODE_SAVING_PROJECTS: 0x0202,
  MODE_SAVING_TASKS: 0x0302,

  // The current save mode.
  saveMode: 0x0001,

  // The record currently being saved (only used by the save mechanism).
  recordBeingSaved: null,

  // The logged in user.
  currentUser: null,
  
  // Stores access control rights for current user.
  permissions: SC.Object.create({
    canAddProject: NO,
    canEditProject: NO,
    canDeleteProject: NO,
    canAddTask: NO,
    canEditTask: NO,
    canDeleteTask: NO,
    canImportData: NO,
    canAddUser: NO,
    canDeleteUser: NO
  }),
  
  // Sets appropriate permissions based on current user's role
  setPermissions: function() {
    if(!this.currentUser) return;
    switch(this.currentUser.get('role')) {
      case CoreTasks.USER_ROLE_MANAGER:
        this.permissions.set('canAddProject', YES);
        this.permissions.set('canEditProject', YES);
        this.permissions.set('canDeleteProject', YES);
        this.permissions.set('canAddTask', YES);
        this.permissions.set('canEditTask', YES);
        this.permissions.set('canDeleteTask', YES);
        this.permissions.set('canImportData', YES);
        this.permissions.set('canAddUser', YES);
        this.permissions.set('canDeleteUser', YES);
        break;
      case CoreTasks.USER_ROLE_DEVELOPER:
      case CoreTasks.USER_ROLE_TESTER:
        this.permissions.set('canAddProject', NO);
        this.permissions.set('canEditProject', NO);
        this.permissions.set('canDeleteProject', NO);
        this.permissions.set('canAddTask', YES);
        this.permissions.set('canEditTask', YES);
        this.permissions.set('canDeleteTask', YES);
        this.permissions.set('canImportData', YES);
        this.permissions.set('canAddUser', NO);
        this.permissions.set('canDeleteUser', NO);
        break;
      case CoreTasks.USER_ROLE_GUEST:
        this.permissions.set('canAddProject', NO);
        this.permissions.set('canEditProject', NO);
        this.permissions.set('canDeleteProject', NO);
        this.permissions.set('canAddTask', NO);
        this.permissions.set('canEditTask', NO);
        this.permissions.set('canDeleteTask', NO);
        this.permissions.set('canImportData', NO);
        this.permissions.set('canAddUser', NO);
        this.permissions.set('canDeleteUser', NO);
        break;
    }
  },

  /**
   * A special project where all tasks for all projects are grouped.
   *
   * This project exists outside of the store because we don't want it to be persisted.
   */
  allTasksProject: null,

  /**
   * A special project where all unallocated tasks are grouped.
   *
   * This project exists outside of the store because we don't want it to be persisted.
   */
  unallocatedTasksProject: null,

  /**
   * Creates a new record in the store.
   *
   * @param {CoreTasks.Record} recordType The type of the record.
   * @param {Hash} dataHash An optional data hash to seed the new record.
   */
  createRecord: function(recordType, dataHash) {
    if (!dataHash) dataHash = {};

    // Assign the new record a negative integer ID (will be overwritten upon persistence to the
    // server, but certain SC mechanisms require that all records have a primary key).
    if (dataHash.id === undefined) {
      dataHash.id = dataHash._id = this._currentRecordId;
      this._currentRecordId--;
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
    return this.get('saveMode') & CoreTasks.MODE_SAVING;
  }.property('saveMode').cacheable(),

  /*
   * Store key arrays of all dirty records, used by the save mechanism to ensure that records are
   * persisted in the correct order.
   *
   * This is less than ideal, but it works.
   */
  _dirtyUsers: [],
  _dirtyProjects: [],
  _dirtyTasks: [],

  /**
   * Persists all new and modified records to the store.
   *
   * Persistence must occur in a precise order to maintain entity associations.
   */
  saveChanges: function() {
    if (this.get('saveMode') & CoreTasks.MODE_SAVING) {
      throw 'Error saving data: Save already in progress.';
    }

    var store = this.get('store'), key, recType, recStatus, records, len, i;

    // Make our intentions known.
    this.set('saveMode', CoreTasks.MODE_SAVING);

    // Clear the arrays just in case.
    this._dirtyUsers = [];
    this._dirtyProjects = [];
    this._dirtyTasks = [];

    // Get the store keys of the two "special" projects that we never want to persist.
    var allTasksProjectKey = this.getPath('allTasksProject.storeKey');
    var unallocatedTasksProjectKey = this.getPath('unallocatedTasksProject.storeKey');

    // Build separate arrays for all dirty records.
    var dirtyRecordKeys = store.changelog;
    len = dirtyRecordKeys ? dirtyRecordKeys.length : 0;

    for (i = 0; i < len; i++) {
      key = dirtyRecordKeys[i];
      recStatus = store.peekStatus(key);
      recType = store.recordTypeFor(key);

      // Short-circuit if status is CLEAN (you can't always trust the changelog).
      if (recStatus & SC.Record.CLEAN && recStatus !== SC.Record.READY_NEW) continue;

      switch (recType) {
        case CoreTasks.User:
          this._dirtyUsers.pushObject(key);
          break;
        case CoreTasks.Project:
          if (key !== allTasksProjectKey && key !== unallocatedTasksProjectKey) {
            this._dirtyProjects.pushObject(key);
          }

          break;
        case CoreTasks.Task:
          this._dirtyTasks.pushObject(key);
          break;
      }
    }

    // Now start by persisting all of the dirty users, but only if there are any.
    len = this._dirtyUsers.length;

    if (len > 0) {
      this._saveUsers();
      return;
    }

    // If there were no dirty users, persist the dirty projects.
    len = this._dirtyProjects.length;

    if (len > 0) {
      this._saveProjects();
      return;
    }

    // If there were no dirty users or projects, persist the dirty tasks.
    len = this._dirtyTasks.length;

    if (len > 0) {
      this._saveTasks();
      return; 
    }

    // Apparently there was nothing to persist, which shouldn't ever happen.
    console.log('Nothing new to save.');
    this.set('saveMode', CoreTasks.MODE_NOT_SAVING);
    this.set('needsSave', NO) ;
  },

  _saveUsers: function() {
    if (this._dirtyUsers && this._dirtyUsers.length > 0) {
      var userKey = this._dirtyUsers.objectAt(0);
      var user = this.get('store').materializeRecord(userKey);
      this.set('recordBeingSaved', user);
      this.addObserver('recordBeingSaved.status', this, this._userSaveRecordDidChange);
      if (user) user.commit(); 
    } else {
      // Start saving dirty projects.
      this._saveProjects();
    }
  },

  _saveProjects: function() {
    if (this._dirtyProjects && this._dirtyProjects.length > 0) {
      var projectKey = this._dirtyProjects.objectAt(0);
      var project = this.get('store').materializeRecord(projectKey);
      this.set('recordBeingSaved', project);
      this.addObserver('recordBeingSaved.status', this, this._projectSaveRecordDidChange);
      if (project) project.commit(); 
    } else {
      // Start saving dirty tasks.
      this._saveTasks();
    }
  },

  _saveTasks: function() {
    if (this._dirtyTasks && this._dirtyTasks.length > 0) {
      var taskKey = this._dirtyTasks.objectAt(0);
      var task = this.get('store').materializeRecord(taskKey);
      this.set('recordBeingSaved', task);
      this.addObserver('recordBeingSaved.status', this, this._taskSaveRecordDidChange);
      if (task) task.commit(); 
    } else {
      // We're done.
      this.removeObserver('recordBeingSaved.status', this, this._taskSaveRecordDidChange);

      this.set('recordBeingSaved', null);
      this.set('saveMode', CoreTasks.MODE_NOT_SAVING);
      this.set('needsSave', NO) ;

      this._dirtyUsers = [];
      this._dirtyProjects = [];
      this._dirtyTasks = [];
    }
  },

  _userSaveRecordDidChange: function() {
    var user = this.get('recordBeingSaved');

    if (user && this.get('isSaving')) {
      var status = user.get('status');

      if (status & SC.Record.READY || status === SC.Record.DESTROYED_CLEAN) {
        // Save was successful; remove the current observer.
        this.removeObserver('recordBeingSaved.status', this, this._userSaveRecordDidChange);

        SC.RunLoop.begin();

        // Update the now-disassociated assigned tasks.
        var tasks = user.get('disassociatedAssignedTasks');

        if (tasks && SC.instanceOf(tasks, SC.RecordArray)) {
          tasks.forEach(function(task) {
            task.writeAttribute('assigneeId', user.readAttribute('id'));
          });
        }

        // Update the now-disassociated submitted tasks.
        tasks = user.get('disassociatedSubmittedTasks');

        if (tasks && SC.instanceOf(tasks, SC.RecordArray)) {
          tasks.forEach(function(task) {
            task.writeAttribute('submitterId', user.readAttribute('id'));
          });
        }

        SC.RunLoop.end();

        // Continue saving dirty users, if there are any left.
        this._dirtyUsers.removeObject(user.get('storeKey'));
        var nextUserKey = this._dirtyUsers.objectAt(0);

        if (nextUserKey) {
          // Add a new observer and commit.
          var nextUser = this.get('store').materializeRecord(nextUserKey);
          this.set('recordBeingSaved', nextUser);
          this.addObserver('recordBeingSaved.status', this, this._userSaveRecordDidChange);
          nextUser.commit();
        } else {
          // Safe to start committing projects.
          this._saveProjects();
        }

      } else if (status & SC.Record.ERROR) {
        // Save failed.
      this.removeObserver('recordBeingSaved.status', this, this._userSaveRecordDidChange);

        this.set('recordBeingSaved', null);
        this.set('saveMode', CoreTasks.MODE_NOT_SAVING);
        this.set('needsSave', NO) ;

        this._dirtyUsers = [];
        this._dirtyProjects = [];
        this._dirtyTasks = [];
        throw 'Error saving data: Failed to save at least one user.';
      }
    }
  },

  _projectSaveRecordDidChange: function() {
    var project = this.get('recordBeingSaved');

    if (project && this.get('isSaving')) {
      var status = project.get('status');

      if (status & SC.Record.READY || status === SC.Record.DESTROYED_CLEAN) {
        // Save was successful; remove the current observer.
        this.removeObserver('recordBeingSaved.status', this, this._projectSaveRecordDidChange);

        // Update the now-disassociated tasks.
        SC.RunLoop.begin();
        var tasks = project.get('disassociatedTasks');

        if (tasks && SC.instanceOf(tasks, SC.RecordArray)) {
          tasks.forEach(function(task) {
            task.writeAttribute('projectId', project.readAttribute('id'));
          });
        }

        SC.RunLoop.end();

        // Continue saving dirty projects, if there are any left.
        this._dirtyProjects.removeObject(project.get('storeKey'));
        var nextProjectKey = this._dirtyProjects.objectAt(0);

        if (nextProjectKey) {
          // Add a new observer and commit.
          var nextProject = this.get('store').materializeRecord(nextProjectKey);
          this.set('recordBeingSaved', nextProject);
          this.addObserver('recordBeingSaved.status', this, this._projectSaveRecordDidChange);
          nextProject.commit();
        } else {
          // Safe to start committing tasks.
          this._saveTasks();
        }

      } else if (status & SC.Record.ERROR) {
        // Save failed.
        this.removeObserver('recordBeingSaved.status', this, this._projectSaveRecordDidChange);

        this.set('recordBeingSaved', null);
        this.set('saveMode', CoreTasks.MODE_NOT_SAVING);
        this.set('needsSave', NO) ;

        this._dirtyUsers = [];
        this._dirtyProjects = [];
        this._dirtyTasks = [];
        throw 'Error saving data: Failed to save at least one project.';
      }
    }
  },

  _taskSaveRecordDidChange: function() {
    var task = this.get('recordBeingSaved');

    if (task && this.get('isSaving')) {
      var status = task.get('status');

      if (status & SC.Record.READY || status === SC.Record.DESTROYED_CLEAN) {
        // Save was successful; remove the current observer.
        this.removeObserver('recordBeingSaved.status', this, this._taskSaveRecordDidChange);

        // Continue saving dirty tasks, if there are any left.
        this._dirtyTasks.removeObject(task.get('storeKey'));
        var nextTaskKey = this._dirtyTasks.objectAt(0);

        if (nextTaskKey) {
          // Add a new observer and commit.
          var nextTask = this.get('store').materializeRecord(nextTaskKey);
          this.set('recordBeingSaved', nextTask);
          this.addObserver('recordBeingSaved.status', this, this._taskSaveRecordDidChange);
          nextTask.commit();
        } else {
          // We're done.
          this.removeObserver('recordBeingSaved.status', this, this._taskSaveRecordDidChange);

          this.set('recordBeingSaved', null);
          this.set('saveMode', CoreTasks.MODE_NOT_SAVING);
          this.set('needsSave', NO) ;

          this._dirtyUsers = [];
          this._dirtyProjects = [];
          this._dirtyTasks = [];
        }

      } else if (status & SC.Record.ERROR) {
        // Save failed.
        this.removeObserver('recordBeingSaved.status', this, this._taskSaveRecordDidChange);

        this.set('recordBeingSaved', null);
        this.set('saveMode', CoreTasks.MODE_NOT_SAVING);
        this.set('needsSave', NO) ;

        this._dirtyUsers = [];
        this._dirtyProjects = [];
        this._dirtyTasks = [];
        throw 'Error saving data: Failed to save at least one task.';
      }
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
   * @param (String) time in days or hours
   * @returns {String) return time with unit appended.
   */
  displayTime: function(time) {
    if(SC.none(time)) return null;
    var lastChar = time[time.length-1];
    return time + ((lastChar === 'd' || lastChar === 'h')? '' : 'd');
  },
  
  /**
   * Extract time unit (if specified).
   *
   * @param (String) time in days or hours
   * @returns {String) return time unit (if specified) or the empty string ''.
   */
  getTimeUnit: function(time) {
    if(SC.none(time)) return '';
    var lastChar = time[time.length-1];
    return (lastChar === 'd' || lastChar === 'h')? lastChar : '';
  },
  
  /**
   * Convert time into days using time unit if available (assumed 'd' otherwise)
   *
   * @param (String) time in days or hours
   */
  convertTimeToDays: function(time) {
    if(SC.none(time)) return 0;
    var lastChar = time[time.length-1];
    var ret;
    if(lastChar === 'd') ret = time.slice(0, time.length-1); // already in days, remove time unit
    else if(lastChar === 'h') ret = time.slice(0, time.length-1)/8; // asssumes 8h days, convert, remove time unit
    else ret = time; // already number of days
    return parseFloat(parseFloat(ret, 10).toFixed(3));
  },

  // Used to assign all newly-created records with a negative ID.
  // Note: this counter may run out of integers if the client is left running for a long time.
  _currentRecordId: -1

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
