/**
 * The core object of the Tasks framework.
 *
 * @author Sean Eidemiller
 */
/*globals CoreTasks */
 
CoreTasks = SC.Object.create({

  // The main data store.
  store: SC.Store.create(),

  // The resource path format for the remote server.
  _resourcePathFormat: 'tasks-server/%@%@%@',

  /*
   * The various modes of operation.
   *
   * OFFLINE_MODE: Entities are retrieved from and persisted to internal fixtures.
   * ONLINE_MODE: Entities are retrieved from and persisted to an actual, external server.
   */
  OFFLINE_MODE: 0,
  ONLINE_MODE: 1,

  // The current mode of operation.
  // TODO: [SE] set Tasks application mode via URL.
  mode: null,

  // The logged in user.
  user: null,

  /**
   * A special 'allTasks' project where all tasks for all projects are grouped.
   *
   * This project exists outside of the store because we don't want it to be persisted.
   */
  allTasks: null,

  /**
   * A special 'unallocatedTasks' project where all unallocated tasks are grouped.
   *
   * This project exists outside of the store because we don't want it to be persisted.
   */
  unallocatedTasks: null,

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
      dataHash.id = this._currentRecordId;
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
   * Get user record corresponding to specified loginName.
   *
   * @param {String} user's login name.
   * @returns {Object} user record, if macthing one exists, or null.
   */
  getUser: function(loginName) {
    var users = CoreTasks.get('store').findAll(SC.Query.create({
      recordType: CoreTasks.User, 
      conditions: 'loginName = %@',
      parameters: [loginName]
    }));
    if(!users) return null;
    return users.objectAt(0);
  },

  /**
   * Check project of a given name.
   *
   * @param {String} project name.
   * @returns {Object) return project of given name if it exists, null otherwise.
   */
  getProject: function(projectName) {
    var projects = CoreTasks.get('store').findAll(SC.Query.create({
      recordType: CoreTasks.Project, 
      conditions: 'name = %@',
      parameters: [projectName]
    }));
    if(!projects) return null;
    return projects.objectAt(0);
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
  // TODO: [SE] Reset the counter so that we don't run out of integers if the client is left
  // running for a very long time.
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

// Set the mode of operation.
//CoreTasks.set('mode', CoreTasks.get('OFFLINE_MODE'));
CoreTasks.set('mode', CoreTasks.get('ONLINE_MODE'));
