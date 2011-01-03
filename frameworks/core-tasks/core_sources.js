/*globals CoreTasks sc_require SCUDS */

/**
 * An extension of the SC.DataSource class that acts as a proxy between the data store and the
 * remote server, while also providing record caching via the browser's local storage mechanism.
 *
 * @extends SC.DataSource
 * @author Sean Eidemiller
 */
CoreTasks.CachingRemoteDataSource = SC.DataSource.extend({

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
        action: "create%@".fmt(recordType.toString().split('.')[1]),
        notify: CoreTasks.get('shouldNotify')
      };
    }

    // Set the created-at and updated-at times on the data hash.
    dataHash.createdAt = dataHash.updatedAt = SC.DateTime.create().get('milliseconds');

    // Remove the ID from the data hash (Persevere doesn't like it).
    delete dataHash.id;
    delete dataHash.tasks;

    // Build the request and send it off to the server.
    CoreTasks.REQUEST_POST.set(
      'address', CoreTasks.getFullResourcePath(recordType.resourcePath, null, queryParams));
    CoreTasks.REQUEST_POST.notify(this, this._createCompleted, {
        store: store,
        storeKey: storeKey,
        recordType: recordType
      }
    ).send(dataHash);

    return YES;
  },

  _createCompleted: function(response, params) {
    var results, store = params.store;

    if (SC.ok(response) && SC.ok(results = response.get('body'))) {
      var recordType = params.recordType;

      // Request was successful; response should be a JSON object that may require normalization.
      var recordHash = this._normalizeResponse(results);

      // Invoke the success callback on the store.
      params.store.dataSourceDidComplete(params.storeKey, recordHash, recordHash.id, YES);

      // Save record to local storage if enabled.
      if (CoreTasks.get('useLocalStorage')) {
        var recordTypeStr = SC.browser.msie ? recordType._object_className : recordType.toString();
        var adapter = SCUDS.LocalStorageAdapterFactory.getAdapter(recordTypeStr);
        this._saveRecordsToCache([params.storeKey], adapter);
      }

    } else if (response.status === 401) {
      SC.Logger.warn("Attempted to update: [%@:%@]: %@".fmt(
        params.recordType, params.id, this._buildError(response)));
      store.writeStatus(params.storeKey, SC.Record.READY_CLEAN);
      store.refreshRecord(params.recordType, params.id, params.storeKey);
      store.dataHashDidChange(params.storeKey);
    } else {
      // Request failed; invoke the error callback.
      var error = this._buildError(response);
      SC.Logger.error('Error creating record [%@]: %@'.fmt(params.recordType, error));
      store.dataSourceDidError(params.storeKey, error);
    }
  },

  /**
   * Updates a single record.
   *
   * @param {SC.Store} store The store on behalf of which the update request is made.
   * @param {Number} storeKey The store key of the record to update.
   *
   * @returns {Boolean} YES
   */
  updateRecord: function(store, storeKey) {
    var dataHash = store.readDataHash(storeKey);
    var recordType = store.recordTypeFor(storeKey);
    var id = store.idFor(storeKey);

    var queryParams = {
      UUID: CoreTasks.getPath('currentUser.id'),
      ATO: CoreTasks.getPath('currentUser.authToken'),
      action: "update%@".fmt(recordType.toString().split('.')[1]),
      notify: CoreTasks.get('shouldNotify')
    };

    // Make sure the ID is valid.
    if (!this._isValidIdType(id)) {
      SC.Logger.error('Error updating record [%@]: Invalid ID type.'.fmt(recordType));
      store.dataSourceDidError(storeKey, CoreTasks.ERROR_INVALID_ID_TYPE);
      return YES;
    }

    // Set the updated-at time on the data hash.
    dataHash.updatedAt = SC.DateTime.create().get('milliseconds');
    delete dataHash.tasks;

    // Build the request and send it off to the server.
    CoreTasks.REQUEST_PUT.set('address',
      CoreTasks.getFullResourcePath(recordType.resourcePath, id, queryParams));
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
    var results, recordTypeStr, adapter, store = params.store, recordType = params.recordType;

    if (SC.ok(response) && SC.ok(results = response.get('body'))) {
      // Request was successful; response should be a JSON object that may require normalization.
      var recordHash = this._normalizeResponse(results);

      // Invoke the success callback on the store.
      params.store.dataSourceDidComplete(params.storeKey, recordHash, recordHash.id, YES);

      // Save record to local storage if enabled.
      if (CoreTasks.get('useLocalStorage')) {
        recordTypeStr = SC.browser.msie ? recordType._object_className : recordType.toString();
        adapter = SCUDS.LocalStorageAdapterFactory.getAdapter(recordTypeStr);
        this._saveRecordsToCache([params.storeKey], adapter);
      }

    } else if (response.status === 404) {
      // Not found on server, so must have been deleted; remove record from store.
      store.removeDataHash(params.storeKey, SC.Record.DESTROYED_CLEAN);
      store.dataHashDidChange(params.storeKey);

      // Remove record from local storage if enabled.
      if (CoreTasks.get('useLocalStorage')) {
        recordTypeStr = SC.browser.msie ? recordType._object_className : recordType.toString();
        adapter = SCUDS.LocalStorageAdapterFactory.getAdapter(recordTypeStr);
        adapter.remove(params.id);
      }

    } else {
      // Request failed; invoke the error callback.
      var error = this._buildError(response);
      SC.Logger.error('Error updating record [%@:%@]: %@'.fmt(params.recordType, params.id, error));
      store.dataSourceDidError(params.storeKey, error);
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
    var dataHash = store.readDataHash(storeKey);
    var recordType = store.recordTypeFor(storeKey);
    var id = store.idFor(storeKey);

    var queryParams = {
      UUID: CoreTasks.getPath('currentUser.id'),
      ATO: CoreTasks.getPath('currentUser.authToken'),
      action: "delete%@".fmt(recordType.toString().split('.')[1]),
      notify: CoreTasks.get('shouldNotify')
    };

    // Make sure the ID is valid.
    if (!this._isValidIdType(id)) {
      SC.Logger.log('Error deleting record [%@]: Invalid ID type.'.fmt(recordType));
      store.dataSourceDidError(storeKey, CoreTasks.ERROR_INVALID_ID_TYPE);
      return YES;
    }

    // Set the status on the data hash to "deleted" (soft delete).
    dataHash.status = 'deleted';

    // Set the updated-at time on the data hash.
    dataHash.updatedAt = SC.DateTime.create().get('milliseconds');

    // Build the request and send it off to the server.
    CoreTasks.REQUEST_PUT.set(
      'address', CoreTasks.getFullResourcePath(recordType.resourcePath, id, queryParams));
    CoreTasks.REQUEST_PUT.notify(this, this._destroyCompleted, {
        store: store,
        storeKey: storeKey,
        recordType: recordType,
        id: id
      }
    ).send(dataHash);

    return YES;
  },

  _destroyCompleted: function(response, params) {
    var results, recordTypeStr, adapter, store = params.store, recordType = params.recordType;

    if (SC.ok(response) && SC.ok(results = response.get('body'))) {
      if (response.status === 200 || response.status === 204) {
        // Successful deletion; invoke the destroy callback on the store.
        store.dataSourceDidDestroy(params.storeKey);

        // Remove record from local storage if enabled.
        if (CoreTasks.get('useLocalStorage')) {
          recordTypeStr = SC.browser.msie ? recordType._object_className : recordType.toString();
          adapter = SCUDS.LocalStorageAdapterFactory.getAdapter(recordTypeStr);
          adapter.remove(params.id);
        }

      } else {
        // This should never happen, but just in case...
        SC.Logger.error('Error deleting record [%@:%@]: Unexpected server response: %@'.fmt(
          recordType, params.id, response.status));
        store.dataSourceDidError(params.storeKey, CoreTasks.ERROR_UNEXPECTED_RESPONSE);
      }

    } else {
      if (response.status === 404) {
        // Not found on server; remove from the store.
        store.removeDataHash(params.storeKey, SC.Record.DESTROYED_CLEAN);
        store.dataHashDidChange(params.storeKey);

        // Remove record from local storage if enabled.
        if (CoreTasks.get('useLocalStorage')) {
          recordTypeStr = SC.browser.msie ? recordType._object_className : recordType.toString();
          adapter = SCUDS.LocalStorageAdapterFactory.getAdapter(recordTypeStr);
          adapter.remove(params.id);
        }

      } else if (response.status === 401) {
        SC.Logger.warn("Attempted to update: [%@:%@]: %@".fmt(
          recordType, params.id, this._buildError(response)));
        store.writeStatus(params.storeKey, SC.Record.READY_CLEAN);
        store.refreshRecord(recordType, params.id, params.storeKey);
        store.dataHashDidChange(params.storeKey);
      } else { 
        // Request failed; invoke the error callback.
        var error = this._buildError(response);
        SC.Logger.error('Error deleting record [%@:%@]: %@'.fmt(recordType, params.id, error));
        store.dataSourceDidError(params.storeKey, error);
      }
    }
  },

  /**
   * Loads all cached records from the local storage.
   *
   * This is useful, for example, if you want to preload all records from the cache as the app is
   * loading.
   */
  loadCachedRecords: function(invokeLater) {
    // Hard-coded for now...
    var cacheableRecordTypes = [
      'CoreTasks.Project', 'CoreTasks.Task', 'CoreTasks.User', 'CoreTasks.Watch', 'CoreTasks.Comment'
    ];

    for (var i = 0, len = cacheableRecordTypes.length; i < len; i++) {
      if (invokeLater !== NO) {
        this.invokeLater(this._tryLoadRecordsFromCache, undefined, cacheableRecordTypes[i]);
      } else {
        this._tryLoadRecordsFromCache(cacheableRecordTypes[i], NO);
      }
    }

    this._loadedCachedRecords = YES;
  },

  cancel: function(store, storeKeys) {
    return NO;
  },

  /*
   * Loading the cached records can be tricky because the record type prototype may not be defined
   * if this method is called during initialization of the app.  If that's the case, try again
   * after a short period of time (ex. 200ms).
   *
   */
  // TODO: [SE] Give up after a certain number of attempts and note that there was an error during cached record load?
  _tryLoadRecordsFromCache: function(recordTypeStr, invokeLater) {
    // Get the actual record type prototype.
    var recordType = SC.objectForPropertyPath(recordTypeStr);

    if (recordType) {
      // Prototype is defined; able to load records into store.
      if (invokeLater !== NO) {
        this.invokeLater(this._loadRecordsFromCache, undefined, recordType, recordTypeStr);
      } else {
        this._loadRecordsFromCache(recordType, recordTypeStr);
      }

    } else {
      // Prototype isn't defined; make another attempt later on.
      if (invokeLater !== NO) {
        this.invokeLater(this._tryLoadRecordsFromCache, 200, recordTypeStr);
      } else {
        this._tryLoadRecordsFromCache(recordTypeStr, NO);
      }
    }
  },

  /*
   * Gets the deserialized record hashes from the cache (local storage) and loads them into the
   * store.
   */
  _loadRecordsFromCache: function(recordType, recordTypeStr) {
    CoreTasks.store.loadRecords(recordType, this._getHashesFromCache(recordTypeStr));
  },

  /*
   * Gets the hashes for a given record type from the local storage cache.
   */
  _getHashesFromCache: function(recordTypeStr) {
    // Short-circuit if we've already retrieved the records for the given record type. 
    if (!this._retrievedFromCache) {
      this._retrievedFromCache = [recordTypeStr];
    } else if (this._retrievedFromCache.indexOf(recordTypeStr) < 0) {
      this._retrievedFromCache.push(recordTypeStr);
    } else {
      return [];
    }

    // Otherwise, get the record hashes from the local storage adapter.
    return SCUDS.LocalStorageAdapterFactory.getAdapter(recordTypeStr).getAll();
  },

  /*
   * Saves record hashes corresponding to the given store keys to the local storage cache.
   */
  _saveRecordsToCache: function(keys, adapter) {
    var normalizedHashes = [];

    for (var i = 0, len = keys.length; i < len; i++) {
      normalizedHashes[i] = CoreTasks.store.readDataHash(keys[i]);
    }

    adapter.save(normalizedHashes);
  },

  /*
   * Normalizes the response hash by stripping the prefix before the id returned from the
   * Persevere server.
   */
  _normalizeResponse: function(hash) {
    if (hash && hash.id) {
      var id = hash.id;
      if (id && SC.typeOf(id) === SC.T_STRING) hash.id = id.replace(/^.*\//, '') * 1;
    }

    return hash;
  },

  _normalizeResponseArray: function(hashes) {
    var ret = hashes ? hashes : [];
    var len = hashes.length;

    for (var i = 0; i < len; i++) {
      this._normalizeResponse(hashes[i]);
    }

    return ret;
  },

  /*
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
    // TODO: [SE] investigate changes to SC ToT request/response API since response.get('errorObject') is sometimes null
    var error = response.get('errorObject') || SC.Object.create();
    var xhr = response.get('rawRequest');
    error.set('description', xhr.statusText);
    error.set('label', 'Request Error');
    error.set('code', xhr.status);
    return error;
  }

});
