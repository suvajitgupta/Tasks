// ==========================================================================
// Tasks.tasksController
// ==========================================================================
/*globals CoreTasks Tasks */
/** 
  This is the controller for the Tasks detail list, driven by the selected Project
  
  @extends SC.TreeController
  @author Joshua Holt
  @author Suvajit Gupta
*/

Tasks.tasksController = SC.TreeController.create(SC.CollectionViewDelegate,
/** @scope Tasks.tasksController.prototype */ {

  contentBinding: SC.Binding.oneWay('Tasks.assignmentsController.tasks'),
  allowsEmptySelection: YES,
  treeItemIsGrouped: YES,
  
  /**
   * Deselect all tasks.
   */
  deselectTasks: function() {
    Tasks.tasksController.set('selection', '');
  },
  
  /**
   * Select first task, if one.
   */
  selectFirstTask: function() {
    var firstTask = Tasks.getPath('tasksController.arrangedObjects').objectAt(1);
    if(firstTask) Tasks.tasksController.selectObject(firstTask);
  },
  
  isGuestInSystemProjectOrNonGuest: function() {
    if(CoreTasks.getPath('currentUser.role') === CoreTasks.USER_ROLE_GUEST) {
      if(Tasks.projectsController.getPath('selection.length') !== 1) return false;
      var selectedProject = Tasks.projectsController.getPath('selection.firstObject');
      if(!CoreTasks.isSystemProject(selectedProject)) return false;
    }
    return true;
  }.property('content').cacheable(),
  
  isAddable: function() {
    if(Tasks.projectsController.getPath('selection.length') !== 1) return false;
    if(Tasks.assignmentsController.get('displayMode') === Tasks.DISPLAY_MODE_TEAM) return false;
    if(!CoreTasks.getPath('permissions.canCreateTask')) return false;
    if(!this.isGuestInSystemProjectOrNonGuest()) return false;
    return true;
  }.property('content').cacheable(),
  
  isEditable: function() {
    
    if(!CoreTasks.getPath('permissions.canUpdateTask')) return false;
    if(!this.isGuestInSystemProjectOrNonGuest()) return false;

    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    
    if((CoreTasks.getPath('currentUser.role') === CoreTasks.USER_ROLE_GUEST) && !this.areUserSubmittedTasks()) return false;

    return true;
    
  }.property('selection').cacheable(),
  
  isReallocatable: function() {
    if(CoreTasks.getPath('currentUser.role') === CoreTasks.USER_ROLE_GUEST) return false;
    return this.isEditable();
  }.property('isEditable').cacheable(),
  
  isDeletable: function() {
    
    if(Tasks.assignmentsController.get('displayMode') === Tasks.DISPLAY_MODE_TEAM) return false;
    if(!CoreTasks.getPath('permissions.canDeleteTask')) return false;
    if(!this.isGuestInSystemProjectOrNonGuest()) return false;
    
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    
    if((CoreTasks.getPath('currentUser.role') === CoreTasks.USER_ROLE_GUEST) && !this.areUserSubmittedTasks()) return false;
    
    return true;
    
  }.property('selection').cacheable(),
  
  isValidatable: function() {
    return this.get('isEditable') && this.get('developmentStatusWithValidation') === CoreTasks.STATUS_DONE;
  }.property('isEditable', 'developmentStatusWithValidation').cacheable(),

  notGuestOrGuestSubmittedTasks: function() {
    if(CoreTasks.getPath('currentUser.role') !== CoreTasks.USER_ROLE_GUEST || this.get('areUserSubmittedTasks')) return true;
    return false;
  }.property('areUserSubmittedTasks').cacheable(),
  
  areUserSubmittedTasks: function() {

    var sel = this.get('selection');
    if(!sel) return true;
    var len = sel.get('length');
    if(len === 0) return true;
    var userId = CoreTasks.getPath('currentUser.id');
    var context = {};
    for (var i = 0; i < len; i++) {
      var task = sel.nextObject(i, null, context);
      var submitterId = task.get('submitterId');
      if(userId !== submitterId) return false;
    }
    return true;
    
  }.property('selection').cacheable(),
  
  areUserAssignedTasks: function() {

    var sel = this.get('selection');
    if(!sel) return true;
    var len = sel.get('length');
    if(len === 0) return true;
    var userId = CoreTasks.getPath('currentUser.id');
    var context = {};
    for (var i = 0; i < len; i++) {
      var task = sel.nextObject(i, null, context);
      var assigneeId = task.get('assigneeId');
      if(userId !== assigneeId) return false;
    }
    return true;
    
  }.property('selection').cacheable(),
  
  type: function(key, value) {
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    if (value !== undefined) {
      sel.forEach(function(task) {
        var type = task.get('type');
        if(type !== value) task.set('type', value);
      });
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    } else {
      var firstType = null;
      sel.forEach(function(task) {
        var type = task.get('type');
        if(firstType === null) firstType = value = type;
        else if(type !== firstType) value = null;
      });
    }
    return value;
  }.property('selection').cacheable(),
  
  priority: function(key, value) {
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    if (value !== undefined) {
      sel.forEach(function(task) {
        var priority = task.get('priority');
        if(priority !== value) task.set('priority', value);
      });
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    } else {
      var firstPriority = null;
      sel.forEach(function(task) {
        var priority = task.get('priority');
        if(firstPriority === null) firstPriority = value = priority;
        else if(priority !== firstPriority) value = null;
      });
    }
    return value;
  }.property('selection').cacheable(),
  
  developmentStatusWithValidation: function(key, value) {
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    if (value !== undefined) {
      sel.forEach(function(task) {
        var developmentStatusWithValidation = task.get('developmentStatusWithValidation');
        if(developmentStatusWithValidation !== value) task.set('developmentStatusWithValidation', value);
      });
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    } else {
      var firstDevelopmentStatusWithValidation = null;
      sel.forEach(function(task) {
        var developmentStatusWithValidation = task.get('developmentStatusWithValidation');
        if(firstDevelopmentStatusWithValidation === null) firstDevelopmentStatusWithValidation = value = developmentStatusWithValidation;
        else if(developmentStatusWithValidation !== firstDevelopmentStatusWithValidation) value = null;
      });
    }
    return value;
  }.property('selection').cacheable(),
  
  validation: function(key, value) {
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    if (value !== undefined) {
      sel.forEach(function(task) {
        var validation = task.get('validation');
        if(validation !== value) task.set('validation', value);
      });
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    } else {
      var firstValidation = null;
      sel.forEach(function(task) {
        var validation = task.get('validation');
        if(firstValidation === null) firstValidation = value = validation;
        else if(validation !== firstValidation) value = null;
      });
    }
    return value;
  }.property('selection').cacheable(),
  
  _watchCount: null,
  _watchCountDidChange: function() {
    this.set('_watchCount', CoreTasks.getPath('allWatches.length'));
    Tasks.assignmentsController.computeTasks();
    // console.log('DEBUG: _watchCountDidChange to ' + this.get('_watchCount'));
  }.observes('CoreTasks.allWatches.[]'),
  watch: function() {
    // console.log('DEBUG: tasksController.watch()');
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    var value, firstWatch = null;
    sel.forEach(function(task) {
      var taskWatch = CoreTasks.isCurrentUserWatchingTask(task);
      // console.log('DEBUG: task: "' + task.get('name') + '" watch=' + taskWatch);
      if(firstWatch === null) firstWatch = value = taskWatch;
      else if(taskWatch !== firstWatch) value = null;
    });
    return value;
  }.property('selection', '_watchCount').cacheable(),
  
  _updateClippyDetails: function() {
    var clippyDetails = Tasks.mainPageHelper.get('clippyDetails');
    if(clippyDetails) {
      var ret = '';
      var sel = this.get('selection');
      if(sel && sel.get('length') > 0) {
        sel.forEach(function(task) {
          ret += (task.get('displayId') + ' ' + task.get('displayName') + '\n');
        });
      }
      clippyDetails.innerHTML = ret;
    }
  }.observes('selection'),
  
  
  // ..........................................................
  // DRAG SOURCE SUPPORT
  // 
  
  /**
    When dragging, add Task data type to the drag.
  */
  collectionViewDragDataTypes: function(view) {
    return [CoreTasks.Task];
  },
  
  /**
    If the requested dataType is a Task, provide the currently selected tasks.  Otherwise return null.
  */
  collectionViewDragDataForType: function(view, drag, dataType) {
    var ret=null, sel;
    if (dataType === CoreTasks.Task) {
      sel = view.get('selection');
      ret = [];
      if (sel) sel.forEach(function(x) { ret.push(x); }, this);
    }
    return ret;
  },
  
  // ..........................................................
  // DROP TARGET SUPPORT
  // 
  collectionViewComputeDragOperations: function(view, drag, proposedDragOperations) {
    if (drag.hasDataType(CoreTasks.Task)) {
      return SC.DRAG_MOVE;
    }
    else {
      return SC.DRAG_NONE;
    }
  },
  
  /**
    Called if the user actually drops on the view.  Since we are dragging to and from
    the same view, let the CollectionView handle the actual reorder by returning SC.DRAG_NONE.
    If the drop target is the first index (before the unassign branch) do nothing by returning
    SC.DRAG_MOVE.
  */
  collectionViewPerformDragOperation: function(view, drag, dragOp, idx, dropOp) {
    
    var ret = SC.DRAG_MOVE;
    
    if(!Tasks.tasksController.isEditable()) {
      console.warn('You do not have permission to reassign or reallocate tasks here');
      return ret;
    }
    
    // tells the CollectionView to do nothing
    if (idx < 0) return ret;
    
    // Extract tasks to drag
    var tasks = drag.dataForType(CoreTasks.Task);
    if(!tasks) return ret;

    // Get assignee of item before drop location
    var content = view.get('content');
    var targetAssignee = content.objectAt(idx).get('assignee');
    
    // Set dragged tasks' assignee to new assignee
    tasks.forEach(function(task) {
      if (task.get('assignee') !== targetAssignee) {
        var targetAssigneeId = targetAssignee === null? null : targetAssignee.get('id');
        // console.log('Reassigning task "' + task.get('name') + '" to: ' + (targetAssignee? targetAssignee.get('name') : 'Unassigned'));
        task.set('assigneeId', targetAssigneeId);
        ret = SC.DRAG_NONE;
      }
    }, this);
    
    if(ret === SC.DRAG_NONE) {
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    }
    
    return ret;
  },
  
  /**
    Called by the collection view to delete the selected items.
    
    @param {SC.CollectionView} view collection view
    @param {SC.IndexSet} indexes the items to delete
    @returns {Boolean} YES if the deletion was a success.
  */
  collectionViewDeleteContent: function(view, content, indexes) {
    if (content && (SC.typeOf(content.destroyAt) === SC.T_FUNCTION || SC.typeOf(content.removeAt) === SC.T_FUNCTION)) {
      Tasks.statechart.sendEvent('deleteTask');
      return YES;
    }
    return NO;
  }

});
