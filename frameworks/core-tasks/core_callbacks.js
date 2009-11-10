sc_require('core');

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

    // TODO: [SE] find some way to indicate which function is being invoked w/o displaying the source code in its entirety.

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
