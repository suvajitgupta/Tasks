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

Tasks.tasksController = SC.TreeController.create(
/** @scope Tasks.tasksController.prototype */ {

  contentBinding: 'Tasks.assignmentsController.assignedTasks',
  allowsEmptySelection: YES,
  treeItemIsGrouped: YES,
  
  isGuestInSystemProject: function() {
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
    if(!this.isGuestInSystemProject()) return false;
    return true;
  }.property('content').cacheable(),
  
  isEditable: function() {
    
    if(!CoreTasks.getPath('permissions.canUpdateTask')) return false;
    if(!this.isGuestInSystemProject()) return false;

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
    if(!this.isGuestInSystemProject()) return false;
    
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
  
  setTypeFeature: function() {
    this.type('type', CoreTasks.TASK_TYPE_FEATURE);
  },
  
  setTypeBug: function() {
    this.type('type', CoreTasks.TASK_TYPE_BUG);
  },
  
  setTypeOther: function() {
    this.type('type', CoreTasks.TASK_TYPE_OTHER);
  },
  
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
  
  setPriorityHigh: function() {
    this.priority('priority', CoreTasks.TASK_PRIORITY_HIGH);
  },
  
  setPriorityMedium: function() {
    this.priority('priority', CoreTasks.TASK_PRIORITY_MEDIUM);
  },
  
  setPriorityLow: function() {
    this.priority('priority', CoreTasks.TASK_PRIORITY_LOW);
  },
  
  developmentStatusWithValidation: function(key, value) {
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    if (value !== undefined) {
      sel.forEach(function(task) {
        var developmentStatusWithValidation = task.get('developmentStatusWithValidation');
        if(developmentStatusWithValidation !== value) task.set('developmentStatusWithValidation', value);
      });
      // check for edior popped up in just this case since this method is called to trigger validation button enablement/disablement
      if(!Tasks.editorPoppedUp && CoreTasks.get('autoSave')) Tasks.saveData();
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
  
  setDevelopmentStatusPlanned: function() {
    this.developmentStatusWithValidation('developmentStatusWithValidation', CoreTasks.STATUS_PLANNED);
  },
  
  setDevelopmentStatusActive: function() {
    this.developmentStatusWithValidation('developmentStatusWithValidation', CoreTasks.STATUS_ACTIVE);
  },
  
  setDevelopmentStatusDone: function() {
    this.developmentStatusWithValidation('developmentStatusWithValidation', CoreTasks.STATUS_DONE);
  },
  
  setDevelopmentStatusRisky: function() {
    this.developmentStatusWithValidation('developmentStatusWithValidation', CoreTasks.STATUS_RISKY);
  },
  
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
  
  setValidationUntested: function() {
    this.validation('validation', CoreTasks.TASK_VALIDATION_UNTESTED);
  },
  
  setValidationPassed: function() {
    this.validation('validation', CoreTasks.TASK_VALIDATION_PASSED);
  },
  
  setValidationFailed: function() {
    this.validation('validation', CoreTasks.TASK_VALIDATION_FAILED);
  },
  
  _watchCount: null,
  _watchCountDidChange: function() {
    this.set('_watchCount', CoreTasks.getPath('allWatches.length'));
    Tasks.assignmentsController.showAssignments();
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
  
  editNewTask: function(task){
    var listView = Tasks.getPath('mainPage.mainPane.tasksList');
    var idx = listView.get('content').indexOf(task);
    // console.log('DEBUG: tasksController.editNewTask at index: ' + idx);
    var listItem = listView.itemViewForContentIndex(idx);
    if(listItem) listItem.popupEditor();
  }

});
