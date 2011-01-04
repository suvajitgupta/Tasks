// ==========================================================================
// Tasks.projectsController
// ==========================================================================
/*globals CoreTasks Tasks SCUI */
/** 
  This is the controller for all Projects

  @extends SC.ArrayController
  @author Suvajit Gupta
*/

Tasks.projectsController = SC.ArrayController.create(
/** @scope Tasks.projectsController.prototype */ {
  
  sources: null,
  _computeSources: function() {
    
    var projects = this.get('arrangedObjects');
    // console.log('DEBUG: _computeSources() projects: ' + projects.getEach('name'));
    
    var nodes = [], systemProjects = [], doneProjects = [], activeProjects = [], plannedProjects = [];
    if(projects) {
      var len = projects.get('length');
      for (var i = 0; i < len; i++) {
        var project = projects.objectAt(i);
        if(CoreTasks.isSystemProject(project)) systemProjects.push(project);
        else {
          switch(project.get('developmentStatus')) {
            case CoreTasks.STATUS_DONE:
              doneProjects.push(project);
              break;
            case CoreTasks.STATUS_ACTIVE:
              activeProjects.push(project);
              break;
            case CoreTasks.STATUS_PLANNED:
              plannedProjects.push(project);
              break;
            default:
              console.error('Project: "' + project.get('name') + '" with illegal development status ' + project.get('developmentStatus'));
              break;
          }
        }
      }
      nodes.push(SC.Object.create({ displayName: systemProjects.length + ' ' + "_System".loc() + ' ' + "Projects".loc(), treeItemChildren: systemProjects,
                 treeItemIsExpanded: YES }));
      nodes.push(SC.Object.create({ displayName: activeProjects.length + ' ' + CoreTasks.STATUS_ACTIVE.loc() + ' ' + "Projects".loc(),
                 developmentStatus: CoreTasks.STATUS_ACTIVE, treeItemChildren: activeProjects, treeItemIsExpanded: YES }));
      nodes.push(SC.Object.create({ displayName: plannedProjects.length + ' ' + CoreTasks.STATUS_PLANNED.loc() + ' ' + "Projects".loc(),
                 developmentStatus: CoreTasks.STATUS_PLANNED, treeItemChildren: plannedProjects, treeItemIsExpanded: YES }));
      nodes.push(SC.Object.create({ displayName: doneProjects.length + ' ' + CoreTasks.STATUS_DONE.loc() + ' ' + "Projects".loc(),
                 developmentStatus: CoreTasks.STATUS_DONE, treeItemChildren: doneProjects, treeItemIsExpanded: NO }));
    }

    this.set('sources', SC.Object.create({ treeItemChildren: nodes, treeItemIsExpanded: YES }));
    
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
  
  developmentStatus: function(key, value) {
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    if (value !== undefined) {
      sel.forEach(function(task) {
        var developmentStatus = task.get('developmentStatus');
        if(developmentStatus !== value) task.set('developmentStatus', value);
      });
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    } else {
      var firstDevelopmentStatus = null;
      sel.forEach(function(task) {
        var developmentStatus = task.get('developmentStatus');
        if(!firstDevelopmentStatus) firstDevelopmentStatus = value = developmentStatus;
        else if(developmentStatus !== firstDevelopmentStatus) value = null;
      });
    }
    return value;
  }.property('selection').cacheable(),
  
  setDevelopmentStatusPlanned: function() {
    Tasks.projectsController.set('developmentStatus', CoreTasks.STATUS_PLANNED);
  },
  
  setDevelopmentStatusActive: function() {
    Tasks.projectsController.set('developmentStatus', CoreTasks.STATUS_ACTIVE);
  },
  
  setDevelopmentStatusDone: function() {
    Tasks.projectsController.set('developmentStatus', CoreTasks.STATUS_DONE);
  },
  
  /**
   * Force recomputation of project countDowns where needed
   */
  refreshCountdowns: function() {
    // console.log('DEBUG: refreshCountdowns() at: ' + SC.DateTime.create().toFormattedString(CoreTasks.DATE_FORMAT));
    this.forEach(function(project){
      if(!SC.none(project.get('timeLeft')) && !SC.none(project.get('activatedAtValue'))) {
        // console.log('DEBUG: refreshing countDown for project: ' + project.get('name'));
        project.notifyPropertyChange('countDown');
      }
    }, Tasks.projectsController);
  }
  
});

// Tasks.projectsController.addProbe('sources');
