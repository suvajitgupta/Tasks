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
  
  isValidatable: function() {
    var sel = this.get('selection');
    if(!sel) return false;
    var selectedTask = sel.firstObject();
    if(!selectedTask) return false;
    return selectedTask.get('status') === CoreTasks.TASK_STATUS_DONE;
  }.property('selection').cacheable(),
  
  editNewTask: function(task){
    var listView = Tasks.getPath('mainPage.mainPane.tasksList');
    var idx = listView.get('content').indexOf(task);
    var listItem = listView.itemViewForContentIndex(idx);
    if(listItem) listItem.beginEditing();
  }

});
