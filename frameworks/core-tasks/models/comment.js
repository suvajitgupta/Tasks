/*globals CoreTasks sc_require */
sc_require('models/record');

CoreTasks.NEW_COMMENT_DESCRIPTION = '_NewComment';

/**
 * The comment model.
 *
 * @extends CoreTasks.Record
 * @author Suvajit Gupta
 */
CoreTasks.Comment = CoreTasks.Record.extend({

  recordType: SC.Record.attr(String), // CHANGED: [SG] since record type isn't polymorphic on IE
  init: function() { this.writeAttribute('recordType', 'Comment', true); sc_super(); },

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