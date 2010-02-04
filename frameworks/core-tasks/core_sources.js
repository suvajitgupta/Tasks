/*globals CoreTasks sc_require */
sc_require('core');

/**
 * An extension of the SC.DataSource class that acts as a proxy between the data store and the
 * remote server.
 *
 * @extends SC.DataSource
 * @author Sean Eidemiller
 */
CoreTasks.PersevereDataSource = SC.DataSource.extend({

  /**
   * Fetches a list of records from the server and loads them into the given store.
   *
   * @param {SC.Store} store The store on behalf of which the fetch request is made.
   * @param {SC.Query} query The query from which the request should be generated.
   *
   * @returns {Boolean}
   */
  fetch: function(store, query) {
    // Do some sanity checking first to make sure everything is in order.
    if (!query || !SC.instanceOf(query, SC.Query)) {
      throw 'Error retrieving records: Invalid query.';
    }

    // Check to see if we should skip the initial fetch.
    if (query.get('initialServerFetch') === NO) return NO;

    // Get the record type and resource path.
    var recordType = query.get('recordType');

    if (!recordType || !SC.typeOf(recordType) === SC.T_FUNCTION) {
      throw 'Error retrieving records: Invalid record type.';
    }

    var resourcePath = recordType.resourcePath;

    if (!resourcePath) {
      throw 'Error retrieving records: Unable to retrieve resource path from record type.';
    }

    // Build the request and send it off to the server.
    console.log('Retrieving %@ records from server...'.fmt(recordType));

    var path = CoreTasks.getFullResourcePath(resourcePath, null, query.get('queryParams'));
    CoreTasks.REQUEST_GET.set('address', path);
    CoreTasks.REQUEST_GET.notify(this, this._fetchCompleted, { query: query, store: store }).send();

    return YES;
  },

  _fetchCompleted: function(response, params) {
    var results;
    var query = params.query;
    var store = params.store;

    if (SC.ok(response) && SC.ok(results = response.get('body'))) {
      var recordType = query.get('recordType');
      var status = response.get('status');
      var xhr;

      if (SC.typeOf(results) === SC.T_ARRAY) {
        if (results.length > 0) {
          // Got an array of records; normalize if necessary.
          var records = this._normalizeResponseArray(results);

          // Load the records into the store and invoke the callback.
          console.log('Retrieved %@ matching %@ records.'.fmt(records.length, recordType));
          store.loadRecords(recordType, records);

          if(!CoreTasks.loginTime) {
            // Identify/remove any records that have been deleted on server but exist in the store
            var idsOnServer = [];
            for(var i = 0, len = records.length; i < len; i++) {
              idsOnServer[i] = '' + records[i].id;
            }
            var idsInStore = recordType.storeKeysById();
            var deletedStoreKeys = [];
            for(var id in idsInStore) {
              if(id > 0 && idsOnServer.indexOf(id) < 0) {
                deletedStoreKeys.push(idsInStore[id]);
              }
            }
            SC.RunLoop.begin();
            for(var j = 0, n = deletedStoreKeys.length; j < n; j++) {
              var storeKey = deletedStoreKeys[j];
              store.removeDataHash(storeKey, SC.Record.DESTROYED_CLEAN);
              store.dataHashDidChange(storeKey);
            }
            SC.RunLoop.end();
          }

          store.dataSourceDidFetchQuery(query);
        } else {
          // No matching records.
          console.log('No matching %@ records.'.fmt(recordType));

          // Load an empty array into the store and invoke the callback.
          store.loadRecords(recordType, []);
          store.dataSourceDidFetchQuery(query);
        }

      } else {
        // Should never get here, but just in case...
        console.log('Error retrieving records: Unexpected server response.');
        store.dataSourceDidErrorQuery(query, CoreTasks.ERROR_UNEXPECTED_RESPONSE);
      }

    } else {
      // Request failed; invoke the error callback.
      var error = this._buildError(response);
      console.log('Error retrieving records: %@'.fmt(error));
      store.dataSourceDidErrorQuery(query, error);
    }
  },

  /**
   * Creates a single record.
   *
   * @param {SC.Store} store The store on behalf of which the creation request is made.
   * @param {Number} storeKey The store key of the new record.
   *
   * @returns {Boolean} YES
   */
  createRecord: function(store, storeKey) {
    var dataHash = store.readDataHash(storeKey);
    var recordType = store.recordTypeFor(storeKey);
    var queryParams = {};
    if (CoreTasks.get('currentUser')) {
      queryParams = {
        UUID: CoreTasks.getPath('currentUser.id'),
        ATO: CoreTasks.getPath('currentUser.authToken'),
        action: "create%@".fmt(recordType._object_className.split('.')[1])
      };
    }
    // Set the created-at time on the data hash.
    dataHash.createdAt = SC.DateTime.create().get('milliseconds');

    // Remove the ID from the data hash (Persevere doesn't like it).
    delete dataHash.id;
    delete dataHash.tasks;

    // Build the request and send it off to the server.
    console.log('Creating new %@ record on server...'.fmt(recordType));

    CoreTasks.REQUEST_POST.set('address', CoreTasks.getFullResourcePath(recordType.resourcePath, null, queryParams));
    CoreTasks.REQUEST_POST.notify(this, this._createCompleted, {
        store: store,
        storeKey: storeKey,
        recordType: recordType
      }
    ).send(dataHash);

    return YES;
  },

  _createCompleted: function(response, params) {
    var results;
    var store = CoreTasks.get('store');
    if (SC.ok(response) && SC.ok(results = response.get('body'))) {
      // Request was successful; response should be a JSON object that may require normalization.
      var recordHash = this._normalizeResponse(results);

      // Invoke the success callback on the store.
      params.store.dataSourceDidComplete(params.storeKey, recordHash, recordHash.id);

    } else if(response.status === 401) {
      console.log("Attempted to update: [%@:%@]: %@".fmt(params.recordType, params.id, this._buildError(response)));
      store.writeStatus(params.storeKey, SC.Record.READY_CLEAN);
      store.refreshRecord(params.recordType, params.id, params.storeKey);
      store.dataHashDidChange(params.storeKey);
    }
    else {
      // Request failed; invoke the error callback.
      var error = this._buildError(response);
      console.log('Error creating record [%@]: %@'.fmt(params.recordType, error));
      params.store.dataSourceDidError(params.storeKey, error);
    }
  },

  /**
   * Updates a single record.
   *
   * @param {SC.Store} store The store on behalf of which the update request is made.
   * @param {Number} storeKey The store key of the record to update.
   *
   * @returns {Boolean} YES if handled
   */
  updateRecord: function(store, storeKey) {
    var dataHash = store.readDataHash(storeKey);
    var recordType = store.recordTypeFor(storeKey);
    var id = store.idFor(storeKey);
    var queryParams = {
      UUID: CoreTasks.getPath('currentUser.id'),
      ATO: CoreTasks.getPath('currentUser.authToken'),
      action: "update%@".fmt(recordType._object_className.split('.')[1])
    };
    // Make sure the ID is valid.
    if (!this._isValidIdType(id)) {
      console.log('Error updating record [%@]: Invalid ID type.'.fmt(recordType));
      store.dataSourceDidError(storeKey, CoreTasks.ERROR_INVALID_ID_TYPE);
      return YES;
    }

    // Set the updated-at time on the data hash.
    dataHash.updatedAt = SC.DateTime.create().get('milliseconds');
    delete dataHash.tasks;

    // Build the request and send it off to the server.
    console.log('Updating %@:%@ on server...'.fmt(recordType, id));

    CoreTasks.REQUEST_PUT.set('address', CoreTasks.getFullResourcePath(recordType.resourcePath, id, queryParams));
    CoreTasks.REQUEST_PUT.notify(this, this._updateCompleted, {
        store: store,
        storeKey: storeKey,
        recordType: recordType,
        id: id
      }
    ).send(dataHash);

    return YES;
  },

  _updateCompleted: function(response, params) {
    var results;
    var store = CoreTasks.get('store');
    if (SC.ok(response) && SC.ok(results = response.get('body'))) {
      // Request was successful; response should be a JSON object that may require normalization.
      var recordHash = this._normalizeResponse(results);

      // Invoke the success callback on the store.
      params.store.dataSourceDidComplete(params.storeKey, recordHash, recordHash.id);

    } else {
      if(response.status === 404) { // not found on server, record must have been deleted
        // delete record in the store
        store.removeDataHash(params.storeKey, SC.Record.DESTROYED_CLEAN);
        store.dataHashDidChange(params.storeKey);
      } else if(response.status === 401) {
        console.log("Attempted to update: [%@:%@]: %@".fmt(params.recordType, params.id, this._buildError(response)));
        store.writeStatus(params.storeKey, SC.Record.READY_CLEAN);
        store.refreshRecord(params.recordType, params.id, params.storeKey);
        store.dataHashDidChange(params.storeKey);
      }
      else { // Request failed; invoke the error callback.
        var error = this._buildError(response);
        console.log('Error updating record [%@:%@]: %@'.fmt(params.recordType, params.id, error));
        params.store.dataSourceDidError(params.storeKey, error);
      }
    }
  },

  /**
   * Destroys (deletes) a single record.
   *
   * @param {SC.Store} store The store on behalf of which the destroy request is made.
   * @param {Number} storeKey The store key of the record to delete.
   *
   * @returns {Boolean} YES
   */
  destroyRecord: function(store, storeKey) {
    var recordType = store.recordTypeFor(storeKey);
    var id = store.idFor(storeKey);
    var queryParams = {
      UUID: CoreTasks.getPath('currentUser.id'),
      ATO: CoreTasks.getPath('currentUser.authToken'),
      action: "delete%@".fmt(recordType._object_className.split('.')[1])
    };
    // Make sure the ID is valid.
    if (!this._isValidIdType(id)) {
      console.log('Error deleting record [%@]: Invalid ID type.'.fmt(recordType));
      store.dataSourceDidError(storeKey, CoreTasks.ERROR_INVALID_ID_TYPE);
      return YES;
    }

    // Build the request and send it off to the server.
    console.log('Deleting %@:%@ on server...'.fmt(recordType, id));

    CoreTasks.REQUEST_DELETE.set(
      'address', CoreTasks.getFullResourcePath(recordType.resourcePath, id, queryParams));
    CoreTasks.REQUEST_DELETE.notify(this, this._destroyCompleted, {
        store: store,
        storeKey: storeKey,
        recordType: recordType,
        id: id
      }
    ).send();

    return YES;
  },

  _destroyCompleted: function(response, params) {
    var results;

    if (SC.ok(response) && SC.ok(results = response.get('body'))) {
      if (response.status === 200 || response.status === 204) { // successfully deleted
        // Invoke the destroy callback on the store.
        params.store.dataSourceDidDestroy(params.storeKey);
      } else { // This should never happen, but just in case...
        console.log('Error deleting record [%@:%@]: Unexpected server response: %@'.fmt(
          params.recordType, params.id, response.status));
        params.store.dat200aSourceDidError(params.storeKey, CoreTasks.ERROR_UNEXPECTED_RESPONSE);
      }
    } else {
      if(response.status === 404) { // not found on server, record must have been deleted
        // delete record in the store
        var store = CoreTasks.get('store');
        store.removeDataHash(params.storeKey, SC.Record.DESTROYED_CLEAN);
        store.dataHashDidChange(params.storeKey);
      } else if(response.status === 401) {
        console.log("Attempted to update: [%@:%@]: %@".fmt(params.recordType, params.id, this._buildError(response)));
        store.writeStatus(params.storeKey, SC.Record.READY_CLEAN);
        store.refreshRecord(params.recordType, params.id, params.storeKey);
        store.dataHashDidChange(params.storeKey);
      }
      else { // Request failed; invoke the error callback.
        var error = this._buildError(response);
        console.log('Error deleting record [%@:%@]: %@'.fmt(params.recordType, params.id, error));
        params.store.dataSourceDidError(params.storeKey, error);
      }
    }
  },

  cancel: function(store, storeKeys) {
    return NO;
  },

  /**
   * TODO: [SE] document how server response is normalized
   */
  _normalizeResponse: function(hash) {
    if (hash && hash.id) {
      var id = hash.id;
      if (id && SC.typeOf(id) === SC.T_STRING) hash.id = id.replace(/^.*\//, '') * 1;
    }

    return hash;
  },

  /**
   * TODO: [SE] document how server response array is normalized
   */
  _normalizeResponseArray: function(hashes) {
    var ret = hashes ? hashes : [];
    var len = hashes.length;

    for (var i = 0; i < len; i++) {
      this._normalizeResponse(hashes[i]);
    }

    return ret;
  },

  /**
   * Determines whether or not a given ID is valid.
   *
   * @param {Number|String} The ID to validate.
   *
   * @returns {Boolean} YES if the ID is a string or number; NO otherwise.
   */
  _isValidIdType: function(id) {
    if (id) {
      var idType = SC.typeOf(id);
      return (idType === SC.T_STRING || idType === SC.T_NUMBER);
    } else {
      return NO;
    }
  },

  /**
   * Builds a more specific request error from an SC.XHRResponse object.
   *
   * @param {SC.XHRResponse} response
   *
   * @returns {SC.Error}
   */
  _buildError: function(response) {
    var error = response.get('errorObject');
    var xhr = response.get('rawRequest');
    error.set('description', xhr.statusText);
    error.set('label', 'Request Error');
    error.set('code', xhr.status);
    return error;
  }

});

// Create the main store with the Persevere data source.
CoreTasks.get('store').from(CoreTasks.PersevereDataSource.create());
console.log('Initialized remote Persevere data source.');
