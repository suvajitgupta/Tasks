/**
 * State to handle task manager actions
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals CoreTasks Tasks Ki */

Tasks.TaskManagerState = Ki.State.extend({
  
  initialSubstate: 'ready',
  
  // Initial state from which task management actions are handled
  ready: Ki.State.design({
    
    addTask: function() {
      this._createTask(false);
    },

    duplicateTask: function() {
      this._createTask(true);
    },

    /**
     * Create a new task in tasks detail list and start editing it.
     *
     * @param {Boolean} flag to indicate whether to make a duplicate of selected task.
     */
    _createTask: function(duplicate) {

      if(!Tasks.tasksController.isAddable()) {
        console.warn('This is the wrong display mode or you do not have permission to add or duplicate a task');
        return;
      }

      // Create a new task with the logged in user as the default submitter/assignee within selected project, if one.
      var userId = CoreTasks.getPath('currentUser.id');
      var taskHash = SC.merge({ 'submitterId': userId }, SC.clone(CoreTasks.Task.NEW_TASK_HASH));
      taskHash.name = taskHash.name.loc();
      if(Tasks.getPath('projectsController.selection.firstObject') !== CoreTasks.get('unassignedTasksProject') &&
         CoreTasks.getPath('currentUser.role') !== CoreTasks.USER_ROLE_GUEST) {
           taskHash.assigneeId = userId;
      }
      var sel = Tasks.projectsController.getPath('selection');
      var project = (sel && sel.get('length' === 1))? sel.get('firstObject') : null;
      if (project && CoreTasks.isSystemProject(project)) {
        taskHash.projectId = project.get('id');
      }

      // Get selected task (if one) and copy its project/assignee/type/priority to the new task.
      var tc = Tasks.get('tasksController');
      sel = tc.get('selection');
      if (sel && sel.length() > 0) {
        var selectedTask = sel.firstObject();
        if (SC.instanceOf(selectedTask, CoreTasks.Task)) {
          taskHash.projectId = selectedTask.get('projectId');
          var assigneeUser = selectedTask.get('assignee');
          taskHash.assigneeId = (assigneeUser && assigneeUser.get('role') !== CoreTasks.USER_ROLE_GUEST)? assigneeUser.get('id') : null;
          taskHash.type = selectedTask.get('type');
          taskHash.priority = selectedTask.get('priority');
          if(duplicate) {
            taskHash.name = selectedTask.get('name') + "_Copy".loc();
            taskHash.effort = selectedTask.get('effort');
            taskHash.description = selectedTask.get('description');
            taskHash.developmentStatus = selectedTask.get('developmentStatus');
            taskHash.validation = selectedTask.get('validation');
          }
        }
      }
      else { // No selected task, add task to currently selected, non-system, project (if one).
        if(duplicate) {
          console.warn('You must have a task selected to duplicate it');
          return;
        }
        var selectedProject = Tasks.projectsController.getPath('selection.firstObject');
        if (!CoreTasks.isSystemProject(selectedProject)) {
          taskHash.projectId = Tasks.getPath('projectController.id');
        }
      }

      // Create, select, and begin editing new task.
      var task = CoreTasks.createRecord(CoreTasks.Task, taskHash);
      tc.selectObject(task);
      Tasks.getPath('mainPage.taskEditor').popup(task);

    },

    /**
     * Delete selected tasks, asking for confirmation first.
     */
    deleteTask: function() {

      if(!Tasks.tasksController.isDeletable()) {
        console.warn('This is the wrong display mode or you do not have permission to delete a task');
        return;
      }

      var ac = Tasks.get('assignmentsController');      
      var tc = Tasks.get('tasksController');
      var sel = tc.get('selection');
      var len = sel? sel.length() : 0;
      if (len > 0) {

        // Confirm deletion operation
        SC.AlertPane.warn("_Confirmation".loc(), "_TaskDeletionConfirmation".loc(), "_TaskDeletionConsequences".loc(), "_Yes".loc(), "_No".loc(), null,
        SC.Object.create({
          alertPaneDidDismiss: function(pane, status) {
            if(status === SC.BUTTON1_STATUS) {
              if(Tasks.mainPage.getPath('mainPane.tasksSceneView.nowShowing') == 'taskEditor') Tasks.getPath('mainPage.taskEditor').close();
              var context = {};
              for (var i = 0; i < len; i++) {
                // Get and delete each selected task.
                var task = sel.nextObject(i, null, context);
                task.destroy();
              }
              Tasks.tasksController.selectFirstTask();
              if(CoreTasks.get('autoSave')) Tasks.saveData();
            }
          }
          })
        );

      }
    },

    setTypeFeature: function() {
      Tasks.tasksController.set('type', CoreTasks.TASK_TYPE_FEATURE);
    },

    setTypeBug: function() {
      Tasks.tasksController.set('type', CoreTasks.TASK_TYPE_BUG);
    },

    setTypeOther: function() {
      Tasks.tasksController.set('type', CoreTasks.TASK_TYPE_OTHER);
    },

    setPriorityHigh: function() {
      Tasks.tasksController.set('priority', CoreTasks.TASK_PRIORITY_HIGH);
    },

    setPriorityMedium: function() {
      Tasks.tasksController.set('priority', CoreTasks.TASK_PRIORITY_MEDIUM);
    },

    setPriorityLow: function() {
      Tasks.tasksController.set('priority', CoreTasks.TASK_PRIORITY_LOW);
    },

    setDevelopmentStatusPlanned: function() {
      Tasks.tasksController.set('developmentStatusWithValidation', CoreTasks.STATUS_PLANNED);
    },

    setDevelopmentStatusActive: function() {
      Tasks.tasksController.set('developmentStatusWithValidation', CoreTasks.STATUS_ACTIVE);
    },

    setDevelopmentStatusDone: function() {
      Tasks.tasksController.set('developmentStatusWithValidation', CoreTasks.STATUS_DONE);
    },

    setDevelopmentStatusRisky: function() {
      Tasks.tasksController.set('developmentStatusWithValidation', CoreTasks.STATUS_RISKY);
    },

    setValidationUntested: function() {
      Tasks.tasksController.set('validation', CoreTasks.TASK_VALIDATION_UNTESTED);
    },

    setValidationPassed: function() {
      Tasks.tasksController.set('validation', CoreTasks.TASK_VALIDATION_PASSED);
    },

    setValidationFailed: function() {
      Tasks.tasksController.set('validation', CoreTasks.TASK_VALIDATION_FAILED);
    },
    
    watchTask: function() {
      var tc = Tasks.get('tasksController');
      var sel = tc.get('selection');
      var len = sel? sel.length() : 0;
      if (len > 0) {
        var currentUserId = CoreTasks.getPath('currentUser.id');
        var context = {};
        for (var i = 0; i < len; i++) {
          // Get and watch each selected task.
          var task = sel.nextObject(i, null, context);
          if(!CoreTasks.isCurrentUserWatchingTask(task)) {
            CoreTasks.createRecord(CoreTasks.Watch, { taskId: task.get('id'), userId: currentUserId });
          }
        }
        if(CoreTasks.get('autoSave')) Tasks.saveData();
      }
    },

    unwatchTask: function() {
      var tc = Tasks.get('tasksController');
      var sel = tc.get('selection');
      var len = sel? sel.length() : 0;
      if (len > 0) {
        var context = {};
        for (var i = 0; i < len; i++) {
          // Get and unwatch each selected task.
          var task = sel.nextObject(i, null, context);
          var watch = CoreTasks.getCurrentUserTaskWatch(task);
          if(watch) watch.destroy();
        }
        if(CoreTasks.get('autoSave')) Tasks.saveData();
      }
    },

    displayTasksFilter: function() {
      this.gotoState('taskFilter');
    },

    editTask: function() {
      this.gotoState('taskEditor');
    }

  }),
  
  // State to manipulate task filter
  taskFilter: Ki.State.design({

    enterState: function() {
      Tasks.filterSearchController.openPanel();
    },

    setAttributeFilterAll: function() {
      Tasks.filterSearchController.clearAttributeFilterCriteria();
    },

    setAttributeFilterShowstoppers: function() {
      Tasks.filterSearchController.set('attributeFilterCriteria', Tasks.attributeFilterShowstoppers.slice(0));
    },

    setAttributeFilterTroubled: function() {
      Tasks.filterSearchController.set('attributeFilterCriteria', Tasks.attributeFilterTroubled.slice(0));
    },

    setAttributeFilterUnfinished: function() {
      Tasks.filterSearchController.set('attributeFilterCriteria', Tasks.attributeFilterUnfinished.slice(0));
    },

    setAttributeFilterUnvalidated: function() {
      Tasks.filterSearchController.set('attributeFilterCriteria', Tasks.attributeFilterUnvalidated.slice(0));
    },

    setAttributeFilterCompleted: function() {
      Tasks.filterSearchController.set('attributeFilterCriteria', Tasks.attributeFilterCompleted.slice(0));
    },

    cancel: function() {
      Tasks.filterSearchController.restoreAttributeFilterCriteria();
      this.gotoState('loggedIn.taskManager.ready');
    },

    apply: function() {
      if(Tasks.recomputeTasksNeeded) Tasks.assignmentsController.computeTasks();
      this.gotoState('loggedIn.taskManager.ready');
    },

    exitState: function() {
      Tasks.filterSearchController.closePanel();
    }
    
  }),
  
  // State to edit task details
  taskEditor: Ki.State.design({

    close: function() {
      this.gotoState('loggedIn.taskManager.ready');
    },

    gotoPreviousTask: function() {
      Tasks.mainPage.taskEditor.gotoPreviousTask();
    },

    gotoNextTask: function() {
      Tasks.mainPage.taskEditor.gotoNextTask();
    },

    addComment: function() {
      var tc = Tasks.get('tasksController');
      var sel = tc.get('selection');
      var len = sel? sel.length() : 0;
      if (len === 1) {
        var currentUserId = CoreTasks.getPath('currentUser.id');
        var task = tc.getPath('selection.firstObject');
        var now = SC.DateTime.create().get('milliseconds');
        SC.RunLoop.begin();
        var comment = CoreTasks.createRecord(CoreTasks.Comment, { taskId: task.get('id'), userId: currentUserId,
                                             createdAt: now, updatedAt: now, description: CoreTasks.NEW_COMMENT_DESCRIPTION.loc() });
        SC.RunLoop.end();
        Tasks.commentsController.selectObject(comment);
        Tasks.mainPage.taskEditor.editComment();
      }
    },
    
    deleteComment: function() {
      var comment = Tasks.commentsController.getPath('selection.firstObject');
      if(comment) {
        // Confirm deletion operation
        SC.AlertPane.warn("_Confirmation".loc(), "_CommentDeletionConfirmation".loc(), null, "_Yes".loc(), "_No".loc(), null,
          SC.Object.create({
            alertPaneDidDismiss: function(pane, status) {
              if(status === SC.BUTTON1_STATUS) comment.destroy();
            }
          })
        );
      }
    },

    exitState: function() {
      Tasks.mainPage.taskEditor.close();
    }
    
  })
  
});
