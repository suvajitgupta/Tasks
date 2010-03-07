// ==========================================================================
// Tasks.projectController
// ==========================================================================
/*globals Tasks CoreTasks escape*/

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

  _contentTasksDidChange: function() {
    this.propertyDidChange('displayTasks');
  },
  
  _updateDisplayTaskObserving: function() {
    var content = this.get('content'),
        observing = this._displayTaskObserving;
     
    // Tear down old observers
    if (observing) {
      observing.forEach(function(tasks) {
        tasks.removeObserver('[]', this, this._contentTasksDidChange);
      }, this);
    }
  
    // Set up new observers
    observing = this._displayTaskObserving = [];
    content.forEach(function(project) {
      var tasks = project.get('tasks');
      observing.push(tasks);
      tasks.addObserver('[]', this, this._contentTasksDidChange);
    }, this);
     
  }.observes('content'),
  
  _contentDidChange: function() { // set URL route when a single project is selected
    if(this.getPath('content.length') !== 1) return;

    var last = this._project,
        cur = this.get('content');

    if (cur && cur.firstObject) cur = cur.firstObject();
    if (last !== cur) {
      // console.log('DEBUG: Switching to project: ' + cur.get('name'));
      Tasks.deselectTasks();
      if(cur) {
        this._project = cur;
        // FIXME: [SC] Beta: see why setting a route causes 2 calls, making project names with percents to cause escaping errors
        SC.routes.set('location', '#project&name=' + escape(cur.get('name')));
      }
    }
  }.observes('content')
  
});
