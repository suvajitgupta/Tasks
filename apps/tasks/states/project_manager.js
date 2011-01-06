/**
 * State to handle project manager actions
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals CoreTasks Tasks Ki */

Tasks.ProjectManagerState = Ki.State.extend({
  
  initialSubstate: 'ready',
  
  // Initial state from which project management actions are handled
  ready: Ki.State.design({
    
    addProject: function() {
      this._createProject(false);
    },

    duplicateProject: function() {
      this._createProject(true);
    },

    /**
     * Create a new project in projects master list and start editing it.
     *
     * @param {Boolean} flag to indicate whether to make a duplicate of selected task.
     */
    _createProject: function(duplicate) {

      if(!CoreTasks.getPath('permissions.canCreateProject')) {
        console.warn('You do not have permission to add or duplicate a project');
        return;
      }

      var projectHash = SC.clone(CoreTasks.Project.NEW_PROJECT_HASH);
      projectHash.name = projectHash.name.loc();
      if(duplicate) {
        var selectedProject = Tasks.projectsController.getPath('selection.firstObject');
        if (!selectedProject) {
          console.warn('You must have a project selected to duplicate it');
          return;
        }
        projectHash.name = selectedProject.get('name') + "_Copy".loc();
        projectHash.description = selectedProject.get('description');
        projectHash.timeLeft = selectedProject.get('timeLeft');
        projectHash.developmentStatus = selectedProject.get('developmentStatus');
      }

      // Create, select, and begin editing new project.
      var project = CoreTasks.createRecord(CoreTasks.Project, projectHash);
      Tasks.projectsController.selectObject(project);
      Tasks.projectEditorPage.popup(project);

    },

    deleteProject: function() {

      if(!CoreTasks.getPath('permissions.canDeleteProject')) {
        console.warn('You do not have permission to delete a project');
        return;
      }

      var sel = Tasks.projectsController.get('selection');
      var len = sel? sel.length() : 0;
      if (len > 0) {

        // Confirm deletion operation
        SC.AlertPane.warn("_Confirmation".loc(), "_ProjectDeletionConfirmation".loc(), "_ProjectDeletionConsequences".loc(), "_Yes".loc(), "_No".loc(), null,
          SC.Object.create({
            alertPaneDidDismiss: function(pane, status) {
              if(status === SC.BUTTON1_STATUS) {
                var context = {};
                for (var i = 0; i < len; i++) {
                  // Get and delete each selected (non-system) project.
                  var project = sel.nextObject(i, null, context);
                  if (CoreTasks.isSystemProject(project)) {
                    console.warn('You cannot delete a system project');
                  }
                  else {
                    // Reset default project if it is deleted
                    if(project === Tasks.get('defaultProject')) Tasks.set('defaultProject', CoreTasks.get('allTasksProject'));
                    project.destroy();
                  }
                }
                // Select the default project
                Tasks.projectsController.selectObject(Tasks.get('defaultProject'));
                if(CoreTasks.get('autoSave')) Tasks.saveData();
              }
            }
          })
        );

      }
    },

    setDevelopmentStatusPlanned: function() {
      Tasks.projectsController.set('developmentStatus', CoreTasks.STATUS_PLANNED);
    },

    setDevelopmentStatusActive: function() {
      Tasks.projectsController.set('developmentStatus', CoreTasks.STATUS_ACTIVE);
    },

    setDevelopmentStatusDone: function() {
      Tasks.projectsController.set('developmentStatus', CoreTasks.STATUS_DONE);
    },
    
    editProject: function() {
      this.gotoState('projectEditor');
    }

  }),
  
  // State to edit project details
  projectEditor: Ki.State.design({

    close: function() {
      this.gotoState('loggedIn.projectManager.ready');
    },

    exitState: function() {
      Tasks.getPath('projectEditorPage.panel').remove();
    }
    
  })
    
});
