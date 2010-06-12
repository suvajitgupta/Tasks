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

(function() {
  // FIXME: [SG] remove when switching to SC TOT where logicalAnd() has been replaced with and()
  if (SC.Binding.logicalAnd) {
    SC.Binding.and = SC.Binding.logicalAnd;
  }
  else if (SC.Binding.and) {
    SC.Binding.logicalAnd = SC.Binding.and;
  }
})();

Tasks = SC.Object.create(SC.Statechart,
  /** @scope Tasks.prototype */ {

  NAMESPACE: 'Tasks',
  VERSION: 'Beta',
  isLoaded: NO, // for Lebowski
  
  /**
   * Deselect all tasks.
   */
  deselectTasks: function() {
    Tasks.tasksController.set('selection', '');
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

// if software mode set to false, works as a simple To Do list (Task Type/Validation are not available through GUI)
Tasks.softwareMode = document.title.match(/todo/i)? false: true;