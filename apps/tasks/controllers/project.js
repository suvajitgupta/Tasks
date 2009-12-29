// ==========================================================================
// Tasks.projectController
// ==========================================================================
/*globals Tasks */

/** 

  This controller tracks the selected Project in the master list

  @extends SC.ObjectController
	@author Joshua Holt
	@author Suvajit Gupta
*/
Tasks.projectController = SC.ObjectController.create(
/** @scope Tasks.projectController.prototype */ {
  
  contentBinding: 'Tasks.projectsController.selection',
  contentBindingDefault: SC.Binding.single(),
  
  _contentDidChange: function() { // when a new project is selected
    var last = this._project,
        cur = this.get('content');
    
    if (cur && cur.firstObject) cur = cur.firstObject();
    if (last !== cur) {
      // console.log('Switching to project: ' + cur.get('name'));
      Tasks.deselectTasks();
      this._project = cur;
      SC.routes.set('location', '#project&name=' + cur.get('name'));
    }
  }.observes('content')
  
});
