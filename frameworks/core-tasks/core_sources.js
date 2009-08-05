sc_require('core');
sc_require('core_callbacks');

/**
 * An extension of the SC.DataSource class that acts as a proxy between the data store and the
 * remote server.
 *
 * @extends SC.DataSource
 * @author Sean Eidemiller
 */
CoreTasks.RemoteDataSource = SC.DataSource.extend({

  init: function() {
    sc_super();

    // Define the headers.
    var contentTypeHeader = 'Content-Type';
    var contentType = 'application/json';
    var acceptHeader = 'Accept';
    var accept = 'application/json, text/javascript, application/xml, text/xml, text/html, */*';

    // Initialize the request objects.
    this._getRequest = SC.Request.create({ type: 'GET', isJSON: YES })
      .header(contentTypeHeader, contentType).header(acceptHeader, accept);

    this._postRequest = SC.Request.create({ type: 'POST', isJSON: YES })
      .header(contentTypeHeader, contentType).header(acceptHeader, accept);

    this._putRequest = SC.Request.create({ type: 'PUT', isJSON: YES })
      .header(contentTypeHeader, contentType).header(acceptHeader, accept);

    this._delRequest = SC.Request.create({ type: 'DELETE', isJSON: YES })
      .header(contentTypeHeader, contentType).header(acceptHeader, accept);

    // Increase the max number of concurrent XHRs to 5 (default is 2).
    SC.Request.manager.set('maxRequests', 5);
  },

  /**
   * Fetches a list of records from the server and loads them into the given store.
   *
   * Valid paramaters (in the params hash):
   *  successCallback: Function to invoke on success.
   *  failureCallback: Function to invoke on failure.
   *  queryParams: Hash of query parameters to be appended to the URL.
   *
   * @param {SC.Store} store The store on behalf of which the fetch request is made.
   * @param {CoreTasks.Record | SC.Query} fetchKey
   * @param {Hash} params Additional parameters (optional).
   *
   * @returns {Array} An array of store keys.
   */
  fetch: function(store, fetchKey, params) {
    var ret = [];

    if (fetchKey) {
      // If we got an SC.Query, simply return it (SC.Store already did the work for us). I'm not
      // sure why it even bothers to call fetch(), but it does.
      if (SC.instanceOf(fetchKey, SC.Query)) {
        return fetchKey;
      }

      // Assume that the fetch key is a record type and get the plural resource path from the
      // corresponding record.
      var resourcePath = fetchKey.resourcePath;

      if (!resourcePath) {
        console.log('Error fetching records: Unable to retrieve resource path from record type.');
        return ret;
      }

      // Build the request and send it off to the server.
      var path = CoreTasks.getFullResourcePath(
        resourcePath, null, params ? params.queryParams : null);

      // HACK: [SE] Persevere needs an extra slash before the resource on list-based calls,
      // otherwise you get "unconventional" IDs in the response JSON.
      this._getRequest.set('address', path);

      var requestParams = SC.merge({
          store: store,
          storeKeys: ret,
          recordType: fetchKey
        }, params ? params : {});

      this._getRequest.notify(this, this._fetchCompleted, requestParams).send();

    } else {
      console.log('Error fetching records: Fetch key is undefined or null.');
    }

    return ret;
  },

  _fetchCompleted: function(request, params) {
    var response = request.response();

    if (response.kindOf ? response.kindOf(SC.Error) : false) {
      console.log('Error fetching records from server.');

      // Invoke the failure callback (may not be defined).
      CoreTasks.invokeCallback(params.failureCallback);

    } else {
      // The response object should be an array of JSON objects that need to be loaded into the
      // store.  First, however, we have to normalize the stupid ID format that Persevere uses.
      var storeKeys = params.store.loadRecords(
        params.recordType, this._normalizeResponseArray(response));
      params.storeKeys.replace(0, 0, storeKeys);

      // Invoke the success callback (may not be defined).
      CoreTasks.invokeCallback(params.successCallback, storeKeys);
    }
  },

  /**
   * Retrieves a single record.
   *
   * @param {SC.Store} store The store on behalf of which the retrieval request is made.
   * @param {Array} storeKey The store key of the record.
   * @param {Hash} params Additional parameters (optional).
   *
   * @returns {Boolean} YES if handled; otherwise NO.
   */
  retrieveRecord: function(store, storeKey, params) {
    var record = store.materializeRecord(storeKey);
    var recordType = store.recordTypeFor(storeKey);
    var id = store.idFor(storeKey);
    
    var idType = SC.typeOf(id);

    if (idType === SC.T_NUMBER || idType === SC.T_STRING){
      // Build the request and send it off to the server.
      var path = CoreTasks.getFullResourcePath(
        recordType.resourcePath, id, record.get('queryParams'));

      this._getRequest.set('address', path);
      this._getRequest.notify(this, this._retrieveCompleted, {
          store: store,
          storeKey: storeKey,
          recordType: recordType,
          id: id
        }
      ).send();

    } else {
      // The ID shouldn't be anything other than a string or number.
      console.log('Error retrieving record [%@]: Invalid ID type: %@'.fmt(recordType, idType));
    }

    return YES;
  },

  _retrieveCompleted: function(request, params) {
    var response = request.response();
    var callback;

    if (response.kindOf ? response.kindOf(SC.Error) : false) {
      console.log('Error retrieving record [%@:%@]'.fmt(params.recordType, params.id));

      // Set the failure callback.
      callback = CoreTasks.getCallback(
        'get', 'failure', params.recordType, response.get('request'));

    } else {
      // Load the record into the store.
      var normalizedResponse = this._normalizeResponse(response);
      params.store.dataSourceDidComplete(params.storeKey, normalizedResponse, params.id);

      // Set the success callback.
      callback = CoreTasks.getCallback('get', 'success', params.recordType);
    }

    // Invoke the callback (may not be defined, but that's okay), passing along the store key in
    // case it's needed.
    CoreTasks.invokeCallback(callback, params.storeKey);
  },

  /**
   * Creates a single record.
   *
   * @param {SC.Store} store The store on behalf of which the creation request is made.
   * @param {Array} storeKey The store key of the new record.
   * @param {Hash} params Additional parameters (optional).
   *
   * @returns {Boolean} YES if handled; otherwise NO.
   */
  createRecord: function(store, storeKey, params) {
    var dataHash = store.readDataHash(storeKey);
    var recordType = store.recordTypeFor(storeKey);
    var resourcePath = recordType.resourcePath;

    // Build the request and send it off to the server.
    this._postRequest.set('address', CoreTasks.getFullResourcePath(resourcePath));
    this._postRequest.notify(this, this._createCompleted, SC.merge({
        store: store,
        storeKey: storeKey,
        recordType: recordType
      }, params ? params : {})).send(dataHash);

    return YES;
  },

  _createCompleted: function(request, params) {
    var response = request.response();
    var callback;

    if (response.kindOf ? response.kindOf(SC.Error) : false) {
      console.log('Error creating record [%@]'.fmt(params.recordType));

      // Set the failure callback.
      callback = params.failureCallback;

    } else {
      // Load the record into the store.
      var normalizedResponse = this._normalizeResponse(response);
      params.store.dataSourceDidComplete(params.storeKey, normalizedResponse, normalizedResponse.id);

      // Set the success callback.
      callback = params.successCallback;
    }

    // Invoke the callback (may not be defined, but that's okay), passing along the store key in
    // case it's needed.
    CoreTasks.invokeCallback(callback, params.storeKey);
  },

  /**
   * Updates a single record.
   *
   * @param {SC.Store} store The store on behalf of which the update request is made.
   * @param {Array} storeKey The store key of the record to update.
   *
   * @returns {Boolean} YES if handled; otherwise NO.
   */
  updateRecord: function(store, storeKey) {
    var dataHash = store.readDataHash(storeKey);
    var recordType = store.recordTypeFor(storeKey);
    var resourcePath = recordType.resourcePath;
    var id = store.idFor(storeKey);

    // Build the request and send it off to the server.
    this._putRequest.set('address', CoreTasks.getFullResourcePath(resourcePath, id));
    this._putRequest.notify(this, this._updateCompleted, {
        store: store,
        storeKey: storeKey,
        recordType: recordType,
        id: id
      }
    ).send(dataHash);

    return YES;
  },

  _updateCompleted: function(request, params) {
    var response = request.response();
    var callback;

    if (response.kindOf ? response.kindOf(SC.Error) : false) {
      console.log('Error updating record [%@:%@]'.fmt(params.recordType, params.id));

      // Set the failure callback.
      callback = CoreTasks.getCallback(
        'put', 'failure', params.recordType, response.get('request'));

    } else {
      // Load the record into the store.
      var normalizedResponse = this._normalizeResponse(response);
      params.store.dataSourceDidComplete(params.storeKey, normalizedResponse, params.id);

      // Set the success callback.
      callback = CoreTasks.getCallback('put', 'success', params.recordType);
    }

    // Invoke the callback (may not be defined, but that's okay), passing along the record hash in
    // case it's needed.
    CoreTasks.invokeCallback(callback, normalizedResponse);
  },

  /**
   * Destroys (deletes) a single record.
   *
   * @param {SC.Store} store The store on behalf of which the destroy request is made.
   * @param {Array} storeKey The store key of the record to delete.
   *
   * @returns {Boolean} YES if handled; otherwise NO.
   */
  destroyRecord: function(store, storeKey) {
    var recordType = store.recordTypeFor(storeKey);
    var resourcePath = recordType.resourcePath;
    var id = store.idFor(storeKey);

    // Build the request and send it off to the server.
    this._delRequest.set('address', CoreTasks.getFullResourcePath(resourcePath, id));
    this._delRequest.notify(this, this._destroyCompleted, {
        store: store,
        storeKey: storeKey,
        recordType: recordType,
        id: id
      }
    ).send();

    return YES;
  },

  _destroyCompleted: function(request, params) {
    // There's a bug in SC.Request that causes a JS error if isJSON is set to true and the response
    // body is empty (and it will be if the deletion is successful).  Work around this by verifying
    // that the response body is *not* empty before calling response().
    var response = request.get('rawResponse');

    if (SC.typeOf(response) === SC.T_STRING) {
      if (response !== "") {
        // Safe to call response() function.
        response = request.response();
      }
    }
    
    var callback;

    if (response.kindOf ? response.kindOf(SC.Error) : false) {
      console.log('Error deleting record [%@:%@]'.fmt(params.recordType, params.id));

      // Get the callback.
      callback = CoreTasks.getCallback(
        'delete', 'failure', params.recordType, response.get('request'));
        
      // Get the JSON returned from the server, because it may be a deletion conflict.
      var json = null;
      var xhr = response.get('request');

      if (xhr && xhr.responseText) json = SC.json.decode(xhr.responseText);

      // Invoke the callback (with the JSON if present).
      if (json) {
        CoreTasks.invokeCallback(callback, json);
      } else {
        CoreTasks.invokeCallback(callback);
      }

    } else {
      // Remove the record from the store.
      params.store.dataSourceDidDestroy(params.storeKey);

      // Invoke the success callback.
      callback = CoreTasks.getCallback('delete', 'success', params.recordType);
      CoreTasks.invokeCallback(callback);
    }
  },

  cancel: function(store, storeKeys) {
    // TODO: [SE] Implement cancel functionality, if/when necessary.
    return NO;
  },

  /**
   * TODO: [SE] Document this.
   */
  _normalizeResponse: function(hash) {
    var id = hash.id;
    if (id && SC.typeOf(id) === SC.T_STRING) hash.id = id.replace(/^.*\//, '') * 1;
    return hash;
  },

  /**
   * TODO: [SE] Document this.
   */
  _normalizeResponseArray: function(hashes) {
    debugger;
    // HACK: [SE] Browsers running in OS X get a string and not a hash, and they don't like the
    // format of the string that Persevere sends over the wire. We have to do some <sigh>
    // massagaing to get it to work.
    if (SC.typeOf(hashes) === SC.T_STRING) {
      // The first 4 characters of a JSON array returned by Persevere are "{}&&", which confuses the
      // JSON.parse() function; strip them out.
      var hashString = hashes.slice(4);
      hashes = SC.json.decode(hashString);
    }

    var ret = hashes ? hashes : [];

    var len = hashes.length;
    for (var i = 0; i < len; i++) {
      this._normalizeResponse(hashes[i]);

      /*
      var id = hashes[i].id;
      if (id) hashes[i].id = id.replace(/^.*\//, '');
      */
    }

    return ret;
  }

});

/**
 * An extension of the SC.FixturesDataSource class that provides functionality specific
 * to Tasks.
 *
 * We need support for queries, but the FixturesWithQueriesDataSource class is kinda broken (lots
 * of bugs). Therefore, we implement query support in this custom implementation of
 * FixturesDataSource instead.
 *
 * @extends SC.FixturesDataSource
 * @author Sean Eidemiller
 */
CoreTasks.FixturesDataSource = SC.FixturesDataSource.extend({

  fetch: function(store, fetchKey, params) {
    // If we got an SC.Query, simply return it (SC.Store already did the work for us). I'm not
    // sure why it even bothers to call fetch(), but it does.
    if (SC.instanceOf(fetchKey, SC.Query)) return fetchKey;

    var ret = arguments.callee.base.apply(this,arguments);

    // Assume success.
    if (params) CoreTasks.invokeCallback(params.successCallback);

    return ret;
  },

  retrieveRecord: function(store, storeKey, params) {
    var ret = [];

    // Notify the store that the data source completed.
    store.dataSourceDidComplete(storeKey, this.fixtureForStoreKey(store, storeKey),
      store.idFor(storeKey));

    ret.push(storeKey);

    // Assume success.
    if (params) CoreTasks.invokeCallback(params.successCallback, storeKey);

    return ret;
  },

  createRecord: function(store, storeKey, params) {
    // Notify the store that the data source completed.
    var recordHash = store.readDataHash(storeKey);
    store.dataSourceDidComplete(storeKey, recordHash, store.idFor(storeKey));

    // Assume success.
    if (params) CoreTasks.invokeCallback(params.successCallback, storeKey);

    return YES;
  },

  updateRecord: function(store, storeKey, params) {
    // Notify the store that the data source completed.
    store.dataSourceDidComplete(storeKey);

    // Assume success.
    if (params) CoreTasks.invokeCallback(params.successCallback, storeKey);

    return YES;
  },

  destroyRecord: function(store, storeKey, params) {
    arguments.callee.base.apply(this,arguments);

    // Assume success.
    if (params) CoreTasks.invokeCallback(params.successCallback, storeKey);

    return YES;
  }

});

// Register one of the data sources with the store, depending on operating mode.
if (CoreTasks.get('mode') === CoreTasks.get('ONLINE_MODE')) {
  // Use the remote data source.
  CoreTasks.get('store').from(CoreTasks.RemoteDataSource.create());
  console.log('Initialized remote data source.');
} else {
  // Use the fixtures data source.
  CoreTasks.get('store').from(CoreTasks.FixturesDataSource.create());
  console.log('Initialized fixtures data source.');
}
