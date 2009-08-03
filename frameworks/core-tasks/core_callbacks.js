sc_require('core');
sc_require('models/record');

CoreTasks.mixin({

  /**
   * Invokes the given callback function
   *
   * @param {Function} callback The callback function to invoke.
   */
  invokeCallback: function(callback) {
    if (!callback) return;

    if (SC.typeOf(callback) !== SC.T_FUNCTION) {
      throw 'Error invoking callback: Callback is not a function.';
    }

    // TODO: [SE] Find some way to indicate which function is being invoked w/o displaying the
    // source code in its entirety.

    // There may be additional arguments that need to be passed along.
    if (arguments.length > 1) {
      // Convert arguments to actual array.
      var args = Array.prototype.slice.call(arguments);

      // Remove the 'callback' parameter (don't want to pass that along).
      args.shift();

      CoreTasks.invokeLaterWithArgs(callback, args);

    } else {
      // No extra arguments; just call invokeLater().
      callback.invokeLater();
    }
  },

  /**
   * Returns the callback for the given method, status and record type.
   *
   * @param {String} method The HTTP method ('get' | 'post' | 'put' | 'delete').
   * @param {String} status The generalized status of the request ('success' | 'failure').
   * @param {CoreTasks.Record} recordType The type of the record.
   * @param {XMLHttpRequest} request The raw XMLHttpRequest returned by the server.
   *
   * @returns {Function} A callback function, or null if there's no registerd callback for the
   *   given context.
   */
  getCallback: function(method, status, recordType, request) {
    var callback = null;

    if (request && request.status) {
      // Check for specific HTTP status callback on record type.
      callback = recordType.callbacks ?
        recordType.callbacks['%@.%@'.fmt(method, request.status)] : null;

      if (!callback) {
        // Check for generalized status callback on record type.
        callback = recordType.callbacks ?
          recordType.callbacks['%@.%@'.fmt(method, status)] : null;

        if (!callback) {
          // Check for specific HTTP status callback in default callbacks.
          // callback = CoreTasks.Record.defaultCallbacks['%@.%@'.fmt(method, request.status)];

          if (!callback) {
            // Check for generailzed status callback in default callbacks.
            // callback = CoreTasks.Record.defaultCallbacks['%@.%@'.fmt(method, status)];
          }
        }
      }

    } else {
      // Check for generalized status callback on record type.
      callback = recordType.callbacks ?
        recordType.callbacks['%@.%@'.fmt(method, status)] : null;

      if (!callback) {
        // Check for generalized status callback in default callbacks.
        // callback = CoreTasks.Record.defaultCallbacks['%@.%@'.fmt(method, status)];
      }
    }

    // The callback may be null at this point, but that's okay (CoreTasks.invokeCallback() will
    // return immediatley in that case).
    return callback;
  },

  /**
   * Registers a callback with a given record type to be invoked on response from the server (data
   * source, actually).
   *
   * This is how we funnel callbacks from the client through to the CoreTasks data source(s).
   *
   * @param {CoreTasks.Record} recordType The type of record with which the callback should be
   *    registered.
   * @param {String} method The HTTP method of the request ('get' | 'post' | 'put' | 'delete').
   * @param {String} status The status of the request that should trigger the callback (can either
   *    be an HTTP status code or the 'success' string).
   * @param {Function} callback The callback function to be invoked.
   */
  registerCallback: function(recordType, method, status, callback) {
    if (recordType.callbacks) {
      if (this._validMethods.indexOf(method) === -1) {
        console.log('Error registering callback: Invalid method: %@'.fmt(method));
        return;
      }

      // The key in the callbacks object has the format "<method>.<status>"
      recordType.callbacks['%@.%@'.fmt(method, status)] = callback;

    } else {
      console.log('Error registering callback: Record type does not define callbacks array.');
    }
  },

  /**
   * Registers a callback with the list of default callbacks to be invoked on response from the
   * server (data source, actually).
   *
   * This is how we funnel callbacks from the client through to the CoreTasks data source(s).
   *
   * @param {String} method The HTTP method of the request ('get' | 'post' | 'put' | 'delete').
   * @param {String} status The status of the request that should trigger the callback (can either
   *    be an HTTP status code or the 'success' string).
   * @param {Function} callback The callback function to be invoked.
   */
  registerDefaultCallback: function(method, status, callback) {
    if (this._validMethods.indexOf(method) === -1) {
      console.log('Error registering default callback: Invalid method: %@'.fmt(method));
      return;
    }

    // The key in the callbacks object has the format "<method>.<status>"
    CoreTasks.Record.defaultCallbacks['%@.%@'.fmt(method, status)] = callback;
  },

  _validMethods: ['get', 'post', 'put', 'delete'],

  /**
   * Schedules a function for execution using SC.Timer.
   *
   * I've found that invokeLater() doesn't quite work in the way that we need it to, so I wrote
   * this function instead.
   *
   * @param {Function} func The function to execute.
   * @param {Array} args An array of arguments to pass along to the function.
   */
  invokeLaterWithArgs: function(func, args) {
    var f = function() { return func.apply(null, args); };
    return SC.Timer.schedule({ action: f, interval: 1 });
  }

});
