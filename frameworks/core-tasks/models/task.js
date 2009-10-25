/*globals CoreTasks sc_require */

sc_require('models/record');

CoreTasks.NEW_TASK_NAME = '_NewTask';

// Types:
CoreTasks.TASK_TYPE_FEATURE = '_Feature'; // default
CoreTasks.TASK_TYPE_BUG = '_Bug';
CoreTasks.TASK_TYPE_OTHER = '_Other';

CoreTasks.taskTypeWeights = {};
CoreTasks.taskTypeWeights[CoreTasks.TASK_TYPE_FEATURE] = 3;
CoreTasks.taskTypeWeights[CoreTasks.TASK_TYPE_BUG] = 2;
CoreTasks.taskTypeWeights[CoreTasks.TASK_TYPE_OTHER] = 1;


// Priorities:
CoreTasks.TASK_PRIORITY_HIGH = '_High';
CoreTasks.TASK_PRIORITY_MEDIUM = '_Medium'; // default
CoreTasks.TASK_PRIORITY_LOW = '_Low';

CoreTasks.taskPriorityWeights = {};
CoreTasks.taskPriorityWeights[CoreTasks.TASK_PRIORITY_HIGH] = 3;
CoreTasks.taskPriorityWeights[CoreTasks.TASK_PRIORITY_MEDIUM] = 2;
CoreTasks.taskPriorityWeights[CoreTasks.TASK_PRIORITY_LOW] = 1;


// Development status:
CoreTasks.TASK_STATUS_PLANNED = '_Planned'; // default
CoreTasks.TASK_STATUS_ACTIVE = '_Active';
CoreTasks.TASK_STATUS_DONE = '_Done';
CoreTasks.TASK_STATUS_RISKY = '_Risky';

CoreTasks.taskStatusWeights = {};
CoreTasks.taskStatusWeights[CoreTasks.TASK_STATUS_RISKY] = 4;
CoreTasks.taskStatusWeights[CoreTasks.TASK_STATUS_ACTIVE] = 3;
CoreTasks.taskStatusWeights[CoreTasks.TASK_STATUS_PLANNED] = 2;
CoreTasks.taskStatusWeights[CoreTasks.TASK_STATUS_DONE] = 1;


// Validation status:
CoreTasks.TASK_VALIDATION_UNTESTED = '_Untested'; // default
CoreTasks.TASK_VALIDATION_PASSED = '_Passed';
CoreTasks.TASK_VALIDATION_FAILED = '_Failed';

CoreTasks.taskValidationWeights = {};
CoreTasks.taskValidationWeights[CoreTasks.TASK_VALIDATION_FAILED] = 3;
CoreTasks.taskValidationWeights[CoreTasks.TASK_VALIDATION_UNTESTED] = 2;
CoreTasks.taskValidationWeights[CoreTasks.TASK_VALIDATION_PASSED] = 1;


/**
 * The task model.
 *
 * A task represent an atomic unit of work to be done by someone.  They are grouped in projects.
 *
 * @extends CoreTasks.Record
 * @author Suvajit Gupta
 * @author Sean Eidemiller
 */
CoreTasks.Task = CoreTasks.Record.extend({

  /**
   * A one-line summary of the task.
   */
  name: SC.Record.attr(String, { isRequired: YES, defaultValue: CoreTasks.NEW_TASK_NAME }),

  /**
   * A back-pointer to the project that this task belongs to.
   */
  projectId: SC.Record.attr(Number),

  /**
   * The type of the task (see below for possible values).
   */
  type: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: CoreTasks.TASK_TYPE_OTHER,
    allowed: [
      CoreTasks.TASK_TYPE_FEATURE,
      CoreTasks.TASK_TYPE_BUG,
      CoreTasks.TASK_TYPE_OTHER
    ]
  }),

  /**
   * The proiority of the task (HIGH indicates task must be completed, LOW ones are not used for effort subtotals).
   */
  priority: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: CoreTasks.TASK_PRIORITY_MEDIUM,
    allowed: [
      CoreTasks.TASK_PRIORITY_HIGH,
      CoreTasks.TASK_PRIORITY_MEDIUM,
      CoreTasks.TASK_PRIORITY_LOW
    ]
  }),

  /**
   * The development status of the task (see below for allowed values).
   */
  statusString: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: CoreTasks.TASK_STATUS_PLANNED,
    allowed: [
      CoreTasks.TASK_STATUS_PLANNED,
      CoreTasks.TASK_STATUS_ACTIVE,
      CoreTasks.TASK_STATUS_DONE,
      CoreTasks.TASK_STATUS_RISKY
    ]
   }),

  developmentStatus: function(key, value){
     var currentStatus = this.get('statusString');
     if (value && currentStatus !== value) {
       this.set('statusString', value);
       if(value !== CoreTasks.TASK_STATUS_DONE) this.set('validation', CoreTasks.TASK_VALIDATION_UNTESTED)
     }
     else {
       return currentStatus;
     }
   }.property('statusString').cacheable(),

  /**
   * The validation status of the task (see below for allowed values).
   */
  validation: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: CoreTasks.TASK_VALIDATION_UNTESTED,
    allowed: [
      CoreTasks.TASK_VALIDATION_UNTESTED,
      CoreTasks.TASK_VALIDATION_PASSED,
      CoreTasks.TASK_VALIDATION_FAILED
    ]
  }),

  /**
   * The effort of the task (can start with an estimate and end with the actual).
   */
  effort: SC.Record.attr(String),
  
  /**
   * Append unit of time after effort.
   */
  displayEffort: function() {
    return CoreTasks.displayTime(this.get('effort'));
  }.property('effort').cacheable(),
  
  /**
    We are using this computed property so that we can buffer changes to 
    the effort field of a task. [JH2]
    
    --- Solves a jumpy text area/text field when connected to a binding. [JH2]
  */
  effortValue: function(key, value){
    if (value !== undefined) {
      if(value === '') {
        this.writeAttribute('effort', null);
      }
      else {
        var effort = CoreTasks.Task.parseEffort('{' + value + '}');
        if(effort) {
          this.writeAttribute('effort', effort);
          value = effort;
        }
      }
    }
    else {
      value = this.get('effort');
    }
    return value;
  }.property('effort').cacheable(),

  /**
   * The user who creates the task.
   */
  submitterId: SC.Record.attr(Number),

  submitter: function(key, value) {
    if (value !== undefined) {
      if (value && value.get) this.writeAttribute('submitterId', value.get('id'));
    } else {
      var id = this.get('submitterId');
      if (id) {
        value = CoreTasks.store.find(CoreTasks.User, id);
      } else {
        value = null;
      }
    }

    return value;

  }.property('submitterId').cacheable(),

  /**
  * The user who is assigned to complete the task.
   */
  assigneeId: SC.Record.attr(Number),
  
  assignee: function(key, value){
    if (value !== undefined) {
      if (value && value.get) this.writeAttribute('assigneeId', value.get('id'));
    } else {
      var id = this.get('assigneeId');
      if (id) {
        value = CoreTasks.store.find(CoreTasks.User, id);
      } else {
        value = null;
      }
    }

    return value;

  }.property('assigneeId').cacheable(),

  /**
   * The path to the icon associated with a task.
   */
  icon: function() {
    switch (this.get('type')){
      case CoreTasks.TASK_TYPE_FEATURE:
        return 'task-icon-feature';
      case CoreTasks.TASK_TYPE_BUG:
        return 'task-icon-bug';
      case CoreTasks.TASK_TYPE_OTHER:
        return 'task-icon-other';
    }
  }.property('type').cacheable(),

  /**
   * A string summarizing key facets of the Task for display.
   */
  displayName: function(key, value) {
    
    if (value !== undefined) {
      
      var taskHash = CoreTasks.Task.parse(value, false);
      // console.log("PARSED TASK: " + JSON.stringify(taskHash));
      
      if(taskHash.priority) {
        this.propertyWillChange('priority');
        this.writeAttribute('priority', taskHash.priority);
        this.propertyDidChange('priority');
      }
      
      this.propertyWillChange('name');
      this.writeAttribute('name', taskHash.name);
      this.propertyDidChange('name');
      
      if(taskHash.effort) {
        this.propertyWillChange('effort');
        this.writeAttribute('effort', taskHash.effort);
        this.propertyDidChange('effort');
      }
      
      if(taskHash.submitterId) {
        this.propertyWillChange('submitterId');
        var submitterUser = CoreTasks.getUser(taskHash.submitterId);
        if (!submitterUser) console.log('Task Editing Error - no such submitter: ' + taskHash.submitterId);
        else this.writeAttribute('submitterId', submitterUser.get('id'));
        this.propertyDidChange('submitterId');
      }
      
      if(taskHash.assigneeId) {
        this.propertyWillChange('assigneeId');
        var assigneeUser = CoreTasks.getUser(taskHash.assigneeId);
        if (!assigneeUser) console.log('Task Editing Error - no such assignee: ' + taskHash.assigneeId);
        else this.writeAttribute('assigneeId', assigneeUser.get('id'));
        this.propertyDidChange('assigneeId');
      }
      
      if(taskHash.type) {
        this.propertyWillChange('type');
        this.writeAttribute('type', taskHash.type);
        this.propertyDidChange('type');
      }
      
      if(taskHash.status) {
        this.propertyWillChange('statusString');
        if(this.get('statusString') !== taskHash.status && taskHash.status !== CoreTasks.TASK_STATUS_DONE) this.writeAttribute('validation', CoreTasks.TASK_VALIDATION_UNTESTED);
        this.writeAttribute('statusString', taskHash.status);
        this.propertyDidChange('statusString');
      }
      
      if(taskHash.validation) {
        if(taskHash.validation !== CoreTasks.TASK_VALIDATION_UNTESTED && this.readAttribute('statusString') !== CoreTasks.TASK_STATUS_DONE) {
          console.log('Task Editing Error - validation of Passed/Failed only possible for status Done');
        }
        else {
          this.propertyWillChange('validation');
          this.writeAttribute('validation', taskHash.validation);
          this.propertyDidChange('validation');
        }
      }

    } else {
      return this.get('name');
    }
    
  }.property('name').cacheable()  ,

  /**
  * Export a task's attributes.
  * @returns {String) return a string with the tasks' data exported in it.
  */
  exportData: function() {
    
    var ret = '', val, user;
    
    switch(this.get('priority')) {
      case CoreTasks.TASK_PRIORITY_HIGH: val = '^'; break;
      case CoreTasks.TASK_PRIORITY_MEDIUM: val = '-'; break;
      case CoreTasks.TASK_PRIORITY_LOW: val = 'v'; break;
    }
    ret += val + ' ';
    
    ret += this.get('name');
    var effort = this.get('effort');
    if(effort) ret += (' {' + CoreTasks.displayTime(effort) + '}');
    
    user = this.get('submitter');
    if (user) ret += ' <' + user.get('loginName') + '>';
    
    user = this.get('assignee');
    if (user) ret += ' [' + user.get('loginName') + ']';
    
    val = this.get('type');
    if(val !== CoreTasks.TASK_TYPE_OTHER) ret += ' $' + val.loc();
    
    val = this.get('statusString');
    if(val !== CoreTasks.TASK_STATUS_PLANNED) ret += ' @' + val.loc();
    
    val = this.get('validation');
    if(val !== CoreTasks.TASK_VALIDATION_UNTESTED)ret += ' %' + val.loc();
    
    if(this.get('id' > 0)) ret += ' ' + this.get('displayId');
    
    val = this.get('description');
    if(val) {
      var lines = val.split('\n');
      for (var j = 0; j < lines.length; j++) {
        ret += '\n| ' + lines[j];
      }
    }
    
    ret += '\n';
    return ret;
    
  }
  
});

CoreTasks.Task.mixin(/** @scope CoreTasks.Task */ {
  
  callbacks: SC.Object.create(),
  resourcePath: 'task',
  
  /**
   * Parse a lstring and extract effort from it.
   *
   * @param {String} string to extract effort from.
   * @returns {String} Task effort (number or range).
   */
  parseEffort: function(line) {
    var taskEffort = null;
    var taskEffortMatches = /\{(\d+\.\d+-\d+\.\d+|\d+\.\d+-\d+|\d+-\d+\.\d+|\d+-\d+|\d+\.\d+|\d+)(|d|h)\}/.exec(line);
    if(taskEffortMatches) {
      taskEffort = taskEffortMatches[1];
      if(taskEffortMatches[2]) taskEffort += taskEffortMatches[2];
    }
    return taskEffort;
  },

  /**
   * Parse a line of text and extract parameters from it.
   *
   * @param {String} string to extract parameters from.
   * @param (Boolean) optional parameter to specify if defaults are to be filled in
   * @returns {Object} Hash of parsed parameters.
   */
  parse: function(line, fillDefaults) {

    if (fillDefaults === undefined) filldefaults = true;
    
    // extract priority based on bullet, if one
    var hasBullet = false;
    var taskPriority = fillDefaults? CoreTasks.TASK_PRIORITY_MEDIUM : null;
    if (line.charAt(0) === '^') {
      taskPriority = CoreTasks.TASK_PRIORITY_HIGH;
      hasBullet = true;
    } else if (line.charAt(0) === '-') {
      taskPriority = CoreTasks.TASK_PRIORITY_MEDIUM;
      hasBullet = true;
    } else if (line.charAt(0) === 'v') {
      taskPriority = CoreTasks.TASK_PRIORITY_LOW;
      hasBullet = true;
    }
    var taskLine = hasBullet? line.slice(2) : line;
    
    // extract task name
    var taskNameMatches = /(^[^\{<\[\$@%]+)/.exec(taskLine);
    var taskName = taskLine;
    if (taskNameMatches) {
      taskName = taskNameMatches[1].replace(/\s+$/, '');
    }
    
    // extract task effort
    var taskEffort = CoreTasks.Task.parseEffort(taskLine);
           
    // extract task assignee
    var taskAssignee = null;
    var taskAssigneeMatches = /\[([\w]+)\]/.exec(taskLine);
    if(taskAssigneeMatches) {
      taskAssignee = taskAssigneeMatches[1];
    }
    
    // extract task submitter
    var taskSubmitter = null;
    var taskSubmitterMatches = /\<([\w]+)\>/.exec(taskLine);
    if(taskSubmitterMatches) {
      taskSubmitter = taskSubmitterMatches[1];
    }
    
    // TODO: [SG] check for valid values during importing of task type/status/validation
    
    // extract task type
    var taskTypeMatches = /\$([\w]+)/.exec(taskLine);
    var taskType = fillDefaults? CoreTasks.TASK_TYPE_OTHER : null;
    if(taskTypeMatches) {
      taskType = '_' + taskTypeMatches[1];
    }
    
    // extract task status
    var taskStatusMatches = /@([\w]+)/.exec(taskLine);
    var taskStatus = fillDefaults? CoreTasks.TASK_STATUS_PLANNED : null;
    if(taskStatusMatches) {
      taskStatus = '_' + taskStatusMatches[1];
    }
    
    // extract task validation
    var taskValidationMatches = /%([\w]+)/.exec(taskLine);
    var taskValidation = fillDefaults? CoreTasks.TASK_VALIDATION_UNTESTED : null;
    if(taskValidationMatches) {
      taskValidation = '_' + taskValidationMatches[1];
    }
    
    return {
      name: taskName,
      priority: taskPriority,
      effort: taskEffort,
      assigneeId: taskAssignee,
      submitterId: taskSubmitter,
      type: taskType,
      statusString: taskStatus,
      validation: taskValidation
    };
  }
  
});

CoreTasks.Task.NEW_TASK_HASH = {
  name: CoreTasks.NEW_TASK_NAME
};
