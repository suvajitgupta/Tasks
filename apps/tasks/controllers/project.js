// ==========================================================================
// Tasks.projectController
// ==========================================================================
/*globals Tasks CoreTasks */

/** 

  This controller tracks the selected Project in the master list

  @extends SC.ObjectController
	@author Joshua Holt
	@author Suvajit Gupta
*/
Tasks.projectController = SC.ObjectController.create(
/** @scope Tasks.projectController.prototype */ {
  
  contentBinding: SC.Binding.oneWay('Tasks.projectsController.selection'),
  
  /*
   * Extract all tasks in selected projects - to be grouped by assignmentsController for display in tasks list
   */
  assignments: function() {
    // console.log('DEBUG: assignments()');
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

  /*
   * Tasks associated with selected projects chnaged.
   * As a result, force refresh of anything bound to 'assignments' above.
   */
  _tasksDidChange: function() {
    this.propertyDidChange('assignments');
  },
  
  /*
   * Update observers on tasks for selected projects.
   * If any of these tasks change ensure '_tasksDidChange()' is called.
   */
  _updateTasksSetObservers: function() {
    var content = this.get('content'),
        tasksSet = this._tasksSet;
    // console.log('DEBUG: _updateTasksSetObservers() old tasks set length = ' + (tasksSet? tasksSet.length : 'none'));
        
    // Remove old observers
    if (tasksSet) {
      tasksSet.forEach(function(tasks) {
        tasks.removeObserver('[]', this, this._tasksDidChange);
      }, this);
    }
  
    // Set up new observers
    tasksSet = this._tasksSet = [];
    content.forEach(function(project) {
      var tasks = project.get('tasks');
      // console.log('DEBUG: _updateTasksSetObservers() adding observers for project = ' + project.get('name'));
      tasksSet.push(tasks);
      tasks.addObserver('[]', this, this._tasksDidChange);
    }, this);
     
  }.observes('content'),
  
  /*
   * Set URL route when a single project is selected
   */
  _projectSelectionDidChange: function() {
    if(this.getPath('content.length') !== 1) return;

    var last = this._project,
        cur = this.get('content');

    if (cur && cur.firstObject) cur = cur.firstObject();
    if (last !== cur) {
      // console.log('DEBUG: projectSelectionDidChange() project: ' + cur.get('name'));
      Tasks.tasksController.deselectTasks();
      if(Tasks.mainPage.getPath('mainPane.tasksSceneView.nowShowing') == 'taskEditor') Tasks.statechart.sendEvent('showTasksList');
      this._project = cur;
      var oldRoute = '#' + SC.routes.get('location');
      var newRoute = CoreTasks.isSystemProject(cur)? '' : ('#select&projectId=#' + cur.get('id'));
      if(newRoute !== oldRoute) SC.routes.set('location', newRoute);
    }
  }.observes('content')
  
});
