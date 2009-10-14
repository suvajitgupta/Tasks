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
  // orderBy: 'name',
  
  isDeletable: function() {
    
    var sel = this.get('selection');
    if(!sel) return false;
    
    var selectedProject = sel.firstObject();
    if(!selectedProject) return false;
    
    var selectedProjectName = selectedProject.get('name');
    if (selectedProjectName === CoreTasks.ALL_TASKS_NAME.loc() || selectedProjectName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) return false;
    
    return true;
    
  }.property('selection').cacheable()
  
});
