/*globals CoreTasks sc_require */
sc_require('core');

CoreTasks.ERROR_UNEXPECTED_RESPONSE = SC.$error('Unexpected response.', 'Request Error');
CoreTasks.ERROR_INVALID_ID_TYPE = SC.$error('Invalid ID type.', 'Request Error');

/**
 * An extension of the SC.DataSource class that acts as a proxy between the data store and the
 * remote server.
 *
 * @extends SC.DataSource
 * @author Sean Eidemiller
 */
CoreTasks.PersevereDataSource = SC.DataSource.extend({

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

    // Increase the max number of concurrent XHRs to 20 (default is 2).
    SC.Request.manager.set('maxRequests', 20);
  },

  /**
   * Fetches a list of records from the server and loads them into the given store.
   *
   * @param {SC.Store} store The store on behalf of which the fetch request is made.
   * @param {SC.Query} query The query from which the request should be generated.
   *
   * @returns {Boolean} YES
   */
  fetch: function(store, query) {
    // Do some sanity checking first to make sure everything is in order.
    if (!query || !SC.instanceOf(query, SC.Query)) {
      throw 'Error retrieving records: Invalid query.';
    }

    var recordType = query.get('recordType');

    if (!recordType || !SC.typeOf(recordType) === SC.T_FUNCTION) {
      throw 'Error retrieving records: Invalid record type.';
    }

    var resourcePath = recordType.resourcePath;

    if (!resourcePath) {
      throw 'Error retrieving records: Unable to retrieve resource path from record type.';
    }

    // Build the request and send it off to the server.
    // console.trace();
    console.log('Retrieving %@ records from server...'.fmt(recordType));

    var path = CoreTasks.getFullResourcePath(resourcePath, null, query.get('queryParams'));
    this._getRequest.set('address', path);
    this._getRequest.notify(this, this._fetchCompleted, { query: query, store: store }).send();

    return YES;
  },

  _fetchCompleted: function(request, params) {
    var response = request.response();
    var query = params.query;
    var store = params.store;

    if (SC.$ok(response)) {
      var recordType = query.get('recordType');

      /*
       * The request was successful, meaning that the server returned either 200 or 204.  A 204
       * indicates that the call succeeded but there were no matching records.
       *
       * If we got a 204, then response will be an XHR (that's how SC.Request.response() works).
       *
       * If we got a 200, then response will be an array of JSON-formatted records.
       */
      if (SC.typeOf(response) === SC.T_STRING) {
        var records = this._normalizeResponseArray(response);

        // Load the records into the store and invoke the callback.
        console.log('Retrieved %@ matching %@ records.'.fmt(records.length, recordType));

        store.loadRecords(recordType, records);
        store.dataSourceDidFetchQuery(query);
  
      } else if (this._isXHR(response) && response.status === 204) { 
        // No matching records.
        console.log('No matching %@ records.'.fmt(recordType));

        // Load an empty array into the store and invoke the callback.
        store.loadRecords(recordType, []);
        store.dataSourceDidFetchQuery(query);

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

  _retrieveCompleted: function(request, params) {
    var response = request.response();

    if (SC.$ok(response)) {
      // Request was successful; response should be a JSON object that may require normalization
      var recordHash = this._normalizeResponse(response);

      // Invoke the success callback on the store.
      params.store.dataSourceDidComplete(params.storeKey, recordHash, recordHash.id);

    } else {
      // Request failed; invoke the error callback.
      var error = this._buildError(response);
      console.log('Error retrieving record [%@:%@]: %@'.fmt(params.recordType, params.id, error));
      params.store.dataSourceDidError(params.storeKey, error);
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

    // Set the created-at time on the data hash.
    dataHash.createdAt = SC.DateTime.create().get('milliseconds');

    // Remove the ID from the data hash (Persevere doesn't like it).
    delete dataHash.id;
    delete dataHash.tasks;

    // Build the request and send it off to the server.
    console.log('Creating new %@ record on server...'.fmt(recordType));

    this._postRequest.set('address', CoreTasks.getFullResourcePath(recordType.resourcePath));
    this._postRequest.notify(this, this._createCompleted, {
        store: store,
        storeKey: storeKey,
        recordType: recordType
      }
    ).send(dataHash);

    return YES;
  },

  _createCompleted: function(request, params) {
    var response = request.response();

    if (SC.$ok(response)) {
      // Request was successful; response should be a JSON object that may require normalization.
      var recordHash = this._normalizeResponse(response);

      // Invoke the success callback on the store.
      params.store.dataSourceDidComplete(params.storeKey, recordHash, recordHash.id);

    } else {
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

    this._putRequest.set('address', CoreTasks.getFullResourcePath(recordType.resourcePath, id));
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

    if (SC.$ok(response)) {
      // Request was successful; response should be a JSON object that may require normalization.
      var recordHash = this._normalizeResponse(response);

      // Invoke the success callback on the store.
      params.store.dataSourceDidComplete(params.storeKey, recordHash, recordHash.id);

    } else {
      // Request failed; invoke the error callback.
      var error = this._buildError(response);
      console.log('Error updating record [%@:%@]: %@'.fmt(params.recordType, params.id, error));
      params.store.dataSourceDidError(params.storeKey, error);
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

    // Make sure the ID is valid.
    if (!this._isValidIdType(id)) {
      console.log('Error deleting record [%@]: Invalid ID type.'.fmt(recordType));
      store.dataSourceDidError(storeKey, CoreTasks.ERROR_INVALID_ID_TYPE);
      return YES;
    }

    // Build the request and send it off to the server.
    console.log('Deleting %@:%@ on server...'.fmt(recordType, id));

    this._delRequest.set('address', CoreTasks.getFullResourcePath(recordType.resourcePath, id));
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
    /*
     * There's a bug in SC.Request that causes a JS error if isJSON is set to true and the response
     * body is empty (and it will be if the deletion is successful).  Work around this by verifying
     * that the response body is *not* empty before calling response().
     */
    var response = request.get('rawResponse');

    if (SC.typeOf(response) === SC.T_STRING) {
      if (response !== "") {
        // Safe to call response() function.
        response = request.response();
      }
    }

    if (SC.$ok(response)) {
      /*
       * The request was successful, meaning that the server returned either 200 or 204.
       *
       * A 204 indicates that the record was successfully deleted and that there's no content in
       * the body of the response.
       *
       * A 200 indicates that the record was successfully deleted and that the record in the
       * response body should be used to replace the record that was deleted (in the store).
       */
      if (this._isXHR(response)) {
        // Branch on the status.
        switch (response.status) {
          case 204:
            // Invoke the destroy callback on the store.
            params.store.dataSourceDidDestroy(params.storeKey);
            break;

          case 200:
            // Convert the response to a hash.
            var hash = SC.json.decode(response.responseText);

            // Normalize if necessary and rewrite the record hash in the main store.
            var normalizedHash = this._normalizeResponse(hash);
            params.store.dataSourceDidComplete(params.storeKey, normalizedHash, hash.id);
            break;

          default:
            // This would be odd, but just in case...
            console.log('Error deleting record [%@:%@]: Unexpected server response.'.fmt(
              params.recordType, params.id));
            params.store.dataSourceDidError(params.storeKey, CoreTasks.ERROR_UNEXPECTED_RESPONSE);
        }

      } else {
        // This should never happen, but just in case...
        console.log('Error deleting record [%@:%@]: Unexpected server response.'.fmt(
          params.recordType, params.id));
        params.store.dataSourceDidError(params.storeKey, CoreTasks.ERROR_UNEXPECTED_RESPONSE);
      }

    } else {
      // Request failed; invoke the error callback.
      var error = this._buildError(response);
      console.log('Error deleting record [%@:%@]: %@'.fmt(params.recordType, params.id, error));
      params.store.dataSourceDidError(params.storeKey, error);
    }
  },

  cancel: function(store, storeKeys) {
    return NO;
  },

  /**
   * TODO: [SE] document how server response is normalized
   */
  _normalizeResponse: function(hash) {
    // HACK: [SE] Browsers running in OS X get a string and not a hash, so we have to convert it.
    if (SC.typeOf(hash) === SC.T_STRING) {
      // HACK: [SE] Also, for some reason, JSON.parse() doesn't like the parentheses that Persevere
      // uses to enclose its responses to POST requests, but only in browsers running on OS X.
      if (hash.indexOf("(") === 0) {
        var tempHash = hash;
        hash = tempHash.slice(1, -1);
      }

      hash = SC.json.decode(hash);
    }

    var id = hash.id;
    if (id && SC.typeOf(id) === SC.T_STRING) hash.id = id.replace(/^.*\//, '') * 1;
    return hash;
  },

  /**
   * TODO: [SE] document how server response array is normalized
   */
  _normalizeResponseArray: function(hashes) {
    // HACK: [SE] Browsers running in OS X get a string and not a hash, and they don't like the
    // format of the string that Persevere sends over the wire. We have to do some <sigh>
    // massaging to get it to work.
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
   * Builds a more specific Request Error from a generic SC.Error object.
   *
   * @param {SC.Error} error
   *
   * @returns {SC.Error}
   */
  _buildError: function(error) {
    var request = error.get('request');
    error.set('description', request.statusText);
    error.set('label', 'Request Error');
    error.set('code', request.status);
    return error;
  },

  /**
   * Determines whether or not the given object is an XHR (or equivalent).
   *
   * This is useful because (for cross-browser compatibility reasons) we can't simply use
   * SC.instanceOf(obj, XMLHttpRequest).
   *
   * @param {Object} obj The object to check.
   *
   * @returns {Boolean} YES if the object appears to be an XHR; NO otherwise.
   */
  _isXHR: function(obj) {
    return (obj && obj.send && obj.open && SC.typeOf(obj.send) == SC.T_FUNCTION);
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
 * NOTE: This class is currently broken.
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
  CoreTasks.get('store').from(CoreTasks.PersevereDataSource.create());
  console.log('Initialized remote Persevere data source.');
} else {
  // Use the fixtures data source.
  CoreTasks.get('store').from(CoreTasks.FixturesDataSource.create());
  console.log('Initialized fixtures data source.');
}
