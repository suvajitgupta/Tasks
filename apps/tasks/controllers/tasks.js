/** 
  This is the controller for the Tasks detail list, driven by the selected Project
  
  @extends SC.TreeController
  @author Joshua Holt
  @author Suvajit Gupta
*/
/*globals CoreTasks Tasks */

Tasks.tasksController = SC.TreeController.create(
/** @scope Tasks.tasksController.prototype */ {

  contentBinding: 'Tasks.assignmentsController.assignedTasks',
  treeItemIsGrouped: YES,
  
  isAddable: function() {
    return this._isAllTasksProjectSelected();
  }.property('selection').cacheable(),

  isDeletable: function() {
    var sel = this.get('selection');
    if(!sel) return false;
    var selectedTask = sel.firstObject();
    if(!selectedTask) return false;
    return this._isAllTasksProjectSelected();
  }.property('selection').cacheable(),
  
  isValidatable: function() {
    var sel = this.get('selection');
    if(!sel) return false;
    var selectedTask = sel.firstObject();
    if(!selectedTask) return false;
    return selectedTask.get('status') === CoreTasks.TASK_STATUS_DONE;
  }.property('selection').cacheable(),
  
  _isAllTasksProjectSelected: function() {
    var selectedProjectName = Tasks.projectController.getPath('content.firstObject.name');
    if (selectedProjectName === CoreTasks.ALL_TASKS_NAME.loc()) return false;
    return true;
  }

});
