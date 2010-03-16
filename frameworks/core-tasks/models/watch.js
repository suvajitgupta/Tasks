/*globals CoreTasks sc_require */
sc_require('models/record');

/**
 * The watch model.
 *
 * @extends CoreTasks.Record
 * @author Suvajit Gupta
 */
CoreTasks.Watch = CoreTasks.Record.extend({

  /**
   * Refers to task being watched.
   */
  taskId: SC.Record.attr(Number),

  /**
   * Refers to user who is watching.
   */
  userId: SC.Record.attr(Number)

});