sc_require('core_callbacks');

/**
 * A mixin on CoreTasks that defines all of the functions that handle requests to the server NOT
 * made on behalf of the store (not directly, at least).  Functions that ARE made on behalf of the
 * store are routed through the data source instead.
 *
 * TODO: [SE] find a better name for this file (core_server doesn't seem right).
 *
 * @author Sean Eidemiller
 */
CoreTasks.mixin({

  /**
   * Issues a transient POST request to the server, meaning that the JSON in the response is not
   * loaded into the store (at least not directly).
   *
   * This is useful for things like plain-text email generation.
   *
   * @param {String} resourcePath The resource path to POST to.
   * @param {Hash} dataHash The hash to send as the body of the request.
   * @param {Hash} params An optional set of parameters.
   */
  executeTransientPost: function(resourcePath, dataHash, params) {
    // Do some sanity checking on the resource path.
    if (!resourcePath || SC.typeOf(resourcePath) !== SC.T_STRING || resourcePath.trim() === '') {
      console.log('Error issuing request: Resource path is invalid.');
      if (params && params.failureCallback) CoreTasks.invokeCallback(params.failureCallback);
      return;
    }

    // Build the request and send it off to the server.
    var path = CoreTasks.getFullResourcePath(resourcePath, null, params.queryParams);
    CoreTasks.REQUEST_POST.set('address', path);
    CoreTasks.REQUEST_POST.notify(this, this._transientRequestCompleted, params).send(dataHash);
  },

  /**
   * Issues a transient PUT request to the server, meaning that the JSON in the response is not
   * loaded into the store (at least not directly).
   *
   * @param {String} resourcePath The resource path to PUT to.
   * @param {Hash} dataHash The hash to send as the body of the request.
   * @param {Hash} params An optional set of parameters.
   */
  executeTransientPut: function(resourcePath, dataHash, params) {
    // Do some sanity checking on the resource path.
    if (!resourcePath || SC.typeOf(resourcePath) !== SC.T_STRING || resourcePath.trim() === '') {
      console.log('Error issuing request: Resource path is invalid.');
      if (params && params.failureCallback) CoreTasks.invokeCallback(params.failureCallback);
      return;
    }

    // Build the request and send it off to the server.
    var path = CoreTasks.getFullResourcePath(resourcePath, null, params.queryParams);
    CoreTasks.REQUEST_PUT.set('address', path);
    CoreTasks.REQUEST_PUT.notify(this, this._transientRequestCompleted, params).send(dataHash);
  },

  /**
   * Issues a transient GET request to the server, meaning that the JSON in the response is not
   * loaded into the store.
   *
   * @param {String} resourcePath The resource path to GET.
   * @param {String|Number} id The ID of the record (optional).
   * @param {Hash} params An optional set of parameters.
   */
  executeTransientGet: function(resourcePath, id, params) {
    // Do some sanity checking on the resource path.
    if (!resourcePath || SC.typeOf(resourcePath) !== SC.T_STRING || resourcePath.trim() === '') {
      console.log('Error issuing request: Resource path is invalid.');
      if (params && params.failureCallback) CoreTasks.invokeCallback(params.failureCallback);
      return;
    }

    // Build the request and send it off to the server.
    var path = CoreTasks.getFullResourcePath(resourcePath, id, params.queryParams);
    CoreTasks.REQUEST_GET.set('address', path);
    CoreTasks.REQUEST_GET.notify(this, this._transientRequestCompleted, params).send();
  },

  /**
   * Issues a transient DELETE request to the server, meaning that the JSON in the response (if
   * any) is not loaded into the store (at least not directly).
   *
   * @param {String} resourcePath The resource path to DELETE to.
   * @param {Hash} dataHash The hash to send as the body of the request.
   * @param {Hash} params An optional set of parameters.
   */
  executeTransientDelete: function(resourcePath, dataHash, params) {
    // Do some sanity checking on the resource path.
    if (!resourcePath || SC.typeOf(resourcePath) !== SC.T_STRING || resourcePath.trim() === '') {
      console.log('Error issuing request: Resource path is invalid.');
      if (params && params.failureCallback) CoreTasks.invokeCallback(params.failureCallback);
      return;
    }

    // Build the request and send it off to the server.
    var path = CoreTasks.getFullResourcePath(resourcePath, null, params.queryParams);
    CoreTasks.REQUEST_DELETE.set('address', path);
    CoreTasks.REQUEST_DELETE.notify(this, this._transientRequestCompleted, params).send(dataHash);
  },

  _transientRequestCompleted: function(request, params) {
    var response = request.response();

    if (response.kindOf ? response.kindOf(SC.Error) : false) {
      console.log('Error retrieving search results from server.');

      // Invoke the failure callback (may not be defined).
      CoreTasks.invokeCallback(params.failureCallback);

    } else {
      // Make sure we actually got something.
      var normalizedResponse = this._normalizeResponseArray(response);

      if (normalizedResponse.length > 0) {
        // Invoke the success callback (may not be defined).
        CoreTasks.invokeCallback(params.successCallback, normalizedResponse);
      } else {
        // Invoke the no-matching-records callback (or the success callback if it doesn't exist).
        if (params.noMatchingRecordsCallback) {
          CoreTasks.invokeCallback(params.noMatchingRecordsCallback);
        } else {
          CoreTasks.invokeCallback(params.successCallback, normalizedResponse);
        }
      }
    }
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
  }

});
