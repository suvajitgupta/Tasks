/*globals CoreTasks sc_require */
sc_require('models/record');


/**
 * The comment model.
 *
 * @extends CoreTasks.Record
 * @author Suvajit Gupta
 */
CoreTasks.Comment = CoreTasks.Record.extend({

  /**
   * Refers to task commented upon.
   */
  taskId: SC.Record.attr(Number),

  /**
   * Refers to user who commented.
   */
  userId: SC.Record.attr(Number)

});

CoreTasks.Comment.mixin(/** @scope CoreTasks.Comment */ {
  
  callbacks: SC.Object.create(),
  resourcePath: 'comment'
  
});