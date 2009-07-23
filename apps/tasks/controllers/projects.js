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
      recordType: Tasks.Project,
      conditions: "id = '%@'".fmt(projectId)      
    });
    var project = Tasks.store.findAll(q).firstObject();
    var tasks = project.get('tasks');
    return tasks;
  }
  
});
