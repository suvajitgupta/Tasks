/*globals CoreTasks sc_require */
sc_require('models/record');

CoreTasks.TASK_WATCH_ON = 1;
CoreTasks.TASK_WATCH_OFF = 0;

/**
 * The watch model.
 *
 * @extends CoreTasks.Record
 * @author Suvajit Gupta
 */
CoreTasks.Watch = CoreTasks.Record.extend({

  recordType: SC.Record.attr(String), // CHANGED: [SG] since record type isn't polymorphic on IE
  init: function() { this.writeAttribute('recordType', 'Watch', true); sc_super(); },

  /**
   * Refers to task being watched.
   */
  taskId: SC.Record.attr(Number),

  /**
   * Refers to user who is watching.
   */
  userId: SC.Record.attr(Number)

});

CoreTasks.Watch.mixin(/** @scope CoreTasks.Watch */ {
  
  resourcePath: 'watch'
  
});