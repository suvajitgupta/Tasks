// ==========================================================================
// Project:   Tasks
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/**

  "Tasks" - an agile project management tool
  
  @extends SC.Object
  @author Suvajit Gupta
  @version 0.1
*/
/*globals Tasks sc_require */
sc_require('statechart');

Tasks = SC.Object.create(SC.Statechart,
  /** @scope Tasks.prototype */ {

  NAMESPACE: 'Tasks',
  VERSION: 'Beta',
  
  /**
   * Deselect all tasks.
   */
  deselectTasks: function() {
    Tasks.taskController.set('content', '');
  }
  
});

/**
  A Standard Binding transform to localize a string in a binding.
*/
SC.Binding.toLocale = function() {
  return this.transform(function(value, binding) {
    var returnValue = '';
    if (SC.typeOf(value) === SC.T_STRING) {
      returnValue = "%@".fmt(value).loc();
    }
    return returnValue;
  });
};