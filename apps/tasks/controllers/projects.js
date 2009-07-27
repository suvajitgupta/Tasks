/*globals Tasks */

/** 
  This is the controller for the Projects master list

  @extends SC.ArrayController
  @author Suvajit Gupta
*/
Tasks.projectsController = SC.ArrayController.create(
/** @scope Tasks.projectsController.prototype */ {
  
  allowsMultipleSelection: NO,
  allowsEmptySelection: NO,
  
  getTasksByProjectId: function(projectId){
    if(!projectId) return;
    var q = SC.Query.create({
      recordType: CoreTasks.Project,
      conditions: "id = '%@'".fmt(projectId)      
    });
    var project = CoreTasks.get('store').findAll(q).firstObject();
    var tasks = project.get('tasks');
    return tasks;
  }
  
});
