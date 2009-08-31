/** 
  This is the controller for the Projects master list

  @extends SC.ArrayController
  @author Suvajit Gupta
*/
/*globals CoreTasks Tasks */

Tasks.projectsController = SC.ArrayController.create(
/** @scope Tasks.projectsController.prototype */ {
  
  allowsMultipleSelection: NO,
  allowsEmptySelection: NO,
  
  isDeletable: function() {
    var sel = this.get('selection');
    // TODO
    if(!sel) return false;
    var selectedProject = sel.firstObject();
    if(!selectedProject) return false;
    var selectedProjectName = selectedProject.get('name');
    if (selectedProjectName === CoreTasks.INBOX_NAME || selectedProjectName === CoreTasks.ALL_TASKS_NAME) {
      return false;
    }
    return this.hasSelection();
  }.property('selection').cacheable()
  
});
