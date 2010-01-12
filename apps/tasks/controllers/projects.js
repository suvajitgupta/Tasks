// ==========================================================================
// Tasks.projectsController
// ==========================================================================
/*globals CoreTasks Tasks SCUI */
/** 
  This is the controller for all Projects

  @extends SC.ArrayController
  @author Suvajit Gupta
*/

Tasks.projectsController = SC.ArrayController.create(SCUI.StatusChanged,
/** @scope Tasks.projectsController.prototype */ {
  
  allowsMultipleSelection: NO,
  
  sources: null,
  
  showSources: function() {
    
    // console.log('DEBUG: sources()');
    Tasks.sourcesRedrawNeeded = true;
    if(Tasks.editorPoppedUp) return;
    
    var nodes = [], tasksSources = [], projectsSources = [];
    var projects = this.get('arrangedObjects');
    if(projects) {
      var len = projects.get('length');
      for (var i = 0; i < len; i++) {
        var project = projects.objectAt(i);
        if(CoreTasks.isSystemProject(project)) tasksSources.push(project);
        else projectsSources.push(project);
      }
      nodes.push(SC.Object.create({ displayName: "_System".loc(), treeItemChildren: tasksSources, treeItemIsExpanded: YES }));
      nodes.push(SC.Object.create({ displayName: "_Projects".loc(), treeItemChildren: projectsSources.sort(function(a,b) {
        var aName = a.get('name');
        var bName = b.get('name');
        if(aName === bName) return 0;
        else return aName > bName? 1 : -1;
      }), treeItemIsExpanded: YES }));
    }
    
    this.set('sources', SC.Object.create({ treeItemChildren: nodes, treeItemIsExpanded: YES }));
    Tasks.sourcesRedrawNeeded = false;
    
  }.observes('[]'),
  
  isDeletable: function() {
    
    if(!CoreTasks.getPath('permissions.canDeleteProject')) return false;
    
    var sel = this.get('selection');
    if(!sel) return false;
    
    var selectedProject = sel.firstObject();
    if(!selectedProject) return false;
    
    if (CoreTasks.isSystemProject(selectedProject)) return false;
    
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
