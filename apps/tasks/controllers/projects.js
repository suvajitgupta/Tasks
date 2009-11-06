/** 
  This is the controller for the Projects master list

  @extends SC.ArrayController
  @author Suvajit Gupta
*/
/*globals CoreTasks Tasks sc_require */
sc_require('mixins/status_changed');

Tasks.projectsController = SC.ArrayController.create(Tasks.StatusChanged,
/** @scope Tasks.projectsController.prototype */ {
  
  allowsMultipleSelection: NO,
  allowsEmptySelection: NO,
  
  isAddable: function() {
    
    var currentUser = CoreTasks.get('currentUser');
    // FIXME: [SG] Beta: see why this doesn't recompute after logout or role change via User Manager
    // console.log("DEBUG: in isAddable() for user: " + currentUser);
    if(!currentUser || currentUser.get('role') !== CoreTasks.USER_ROLE_MANAGER) return false;
    
    return true;
    
  }.property('CoreTasks.currentUser.role').cacheable(),
  
  isDeletable: function() {
    
    var currentUser = CoreTasks.get('currentUser');
    // FIXME: [SG] Beta: see why this doesn't recompute after logout or role change via User Manager
    // console.log("DEBUG: in isAddable() for user: " + currentUser);
    if(!currentUser || currentUser.get('role') !== CoreTasks.USER_ROLE_MANAGER) return false;
    
    var sel = this.get('selection');
    if(!sel) return false;
    
    var selectedProject = sel.firstObject();
    if(!selectedProject) return false;
    
    var selectedProjectName = selectedProject.get('name');
    if (selectedProjectName === CoreTasks.ALL_TASKS_NAME.loc() || selectedProjectName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) return false;
    
    return true;
    
  }.property('selection').cacheable(),
  
  contentStatusDidChange: function(status){
    // console.log("DEBUG: projectsController " + status);
    if (status & SC.Record.READY){
      Tasks.projectsLoadSuccess();
    }
    else if (status & SC.Record.ERROR){
      Tasks.dataLoadFailure();
    }
  },

  editNewProject: function(project){
    var listView = Tasks.getPath('mainPage.mainPane.projectsList');
    var idx = listView.get('content').indexOf(project);
    var listItem = listView.itemViewForContentIndex(idx);
    if(listItem) listItem.beginEditing();
  }

});
