// ==========================================================================
// Tasks.projectController
// ==========================================================================
/*globals Tasks CoreTasks*/

/** 

  This controller tracks the selected Project in the master list

  @extends SC.ObjectController
	@author Joshua Holt
	@author Suvajit Gupta
*/
Tasks.projectController = SC.ObjectController.create(
/** @scope Tasks.projectController.prototype */ {
  
  contentBinding: 'Tasks.projectsController.selection',
  
  displayTasks: function() {
    // console.log('DEBUG: displayTasks()');
    var ret = [];
    var sel = this.get('content');
    var len = sel? sel.length() : 0;
    if (len > 0) {
      var context = {};
      for (var i = 0; i < len; i++) {
        var project = sel.nextObject(i, null, context);
        // console.log('DEBUG: project: ' + project.get('name') + ', tasks: ' + project.get('tasks').getEach('name'));
        if(project === CoreTasks.get('allTasksProject')) return project.get('tasks');
        ret.pushObjects(project.get('tasks'));
      }
    }
    return ret;
  }.property('content').cacheable(),

  _contentDidChange: function() { // set URL route when a single project is selected
    if(this.getPath('content.length') !== 1) return;

    var last = this._project,
        cur = this.get('content');

    if (cur && cur.firstObject) cur = cur.firstObject();
    if (last !== cur) {
      // console.log('Switching to project: ' + cur.get('name'));
      Tasks.deselectTasks();
      if(cur) {
        this._project = cur;
        SC.routes.set('location', '#project&name=' + cur.get('name'));
      }
    }
  }.observes('content')
  
});
