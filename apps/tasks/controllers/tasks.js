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
  
  isAddable: function() {
    
    if(Tasks.assignmentsController.get('displayMode') === Tasks.DISPLAY_MODE_TEAM) return false;
    
    if(!CoreTasks.getPath('permissions.canAddTask')) return false;
    
    return true;
    
  }.property('selection').cacheable(),
  
  isEditable: function() {
    
    if(!CoreTasks.getPath('permissions.canEditTask')) return false;
    
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    
    return true;
    
  }.property('selection').cacheable(),
  
  isDeletable: function() {
    
    if(Tasks.assignmentsController.get('displayMode') === Tasks.DISPLAY_MODE_TEAM) return false
    if(!CoreTasks.getPath('permissions.canDeleteTask')) return false;
    
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    
    return true;
    
  }.property('selection').cacheable(),
  
  isValidatable: function() {
    
    if(!CoreTasks.getPath('permissions.canEditTask')) return false;
    
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    
    var selectedTask = sel.firstObject();
    if(!selectedTask) return false;
    return selectedTask.get('developmentStatus') === CoreTasks.TASK_STATUS_DONE;
    
  }.property('selection').cacheable(),
  
  type: function(key, value) {
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    var firstType = null;
    if (value !== undefined) {
      sel.forEach(function(task) {
        var type = task.get('type');
        if(type !== value) task.set('type', value);
      });
    } else {
      sel.forEach(function(task) {
        var type = task.get('type');
        if(!firstType) firstType = value = type;
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
    var firstPriority = null;
    if (value !== undefined) {
      sel.forEach(function(task) {
        var priority = task.get('priority');
        if(priority !== value) task.set('priority', value);
      });
    } else {
      sel.forEach(function(task) {
        var priority = task.get('priority');
        if(!firstPriority) firstPriority = value = priority;
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
    var firstDevelopmentStatusWithValidation = null;
    if (value !== undefined) {
      sel.forEach(function(task) {
        var developmentStatusWithValidation = task.get('developmentStatusWithValidation');
        if(developmentStatusWithValidation !== value) task.set('developmentStatusWithValidation', value);
      });
    } else {
      sel.forEach(function(task) {
        var developmentStatusWithValidation = task.get('developmentStatusWithValidation');
        if(!firstDevelopmentStatusWithValidation) firstDevelopmentStatusWithValidation = value = developmentStatusWithValidation;
        else if(developmentStatusWithValidation !== firstDevelopmentStatusWithValidation) value = null;
      });
    }
    return value;
  }.property('selection').cacheable(),
  
  setDevelopmentStatusPlanned: function() {
    this.developmentStatusWithValidation('developmentStatusWithValidation', CoreTasks.TASK_STATUS_PLANNED);
  },
  
  setDevelopmentStatusActive: function() {
    this.developmentStatusWithValidation('developmentStatusWithValidation', CoreTasks.TASK_STATUS_ACTIVE);
  },
  
  setDevelopmentStatusDone: function() {
    this.developmentStatusWithValidation('developmentStatusWithValidation', CoreTasks.TASK_STATUS_DONE);
  },
  
  setDevelopmentStatusRisky: function() {
    this.developmentStatusWithValidation('developmentStatusWithValidation', CoreTasks.TASK_STATUS_RISKY);
  },
  
  validation: function(key, value) {
    var sel = this.get('selection');
    if(!sel || sel.get('length') === 0) return false;
    var firstValidation = null;
    if (value !== undefined) {
      sel.forEach(function(task) {
        var validation = task.get('validation');
        if(validation !== value) task.set('validation', value);
      });
    } else {
      sel.forEach(function(task) {
        var validation = task.get('validation');
        if(!firstValidation) firstValidation = value = validation;
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
  
  editNewTask: function(task){
    var listView = Tasks.getPath('mainPage.mainPane.tasksList');
    var idx = listView.get('content').indexOf(task);
    var listItem = listView.itemViewForContentIndex(idx);
    if(listItem) listItem.beginEditing();
  }

});
