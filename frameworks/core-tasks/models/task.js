/*globals CoreTasks sc_require */

sc_require('models/record');

CoreTasks.NEW_TASK_NAME = "_NewTask".loc();

// Types:
CoreTasks.TASK_TYPE_FEATURE = "_Feature".loc(); // default
CoreTasks.TASK_TYPE_BUG = "_Bug".loc();
CoreTasks.TASK_TYPE_OTHER = "_Other".loc();

// Priorities:
CoreTasks.TASK_PRIORITY_HIGH = "_High".loc();
CoreTasks.TASK_PRIORITY_MEDIUM = "_Medium".loc(); // default
CoreTasks.TASK_PRIORITY_LOW = "_Low".loc();

// Development status:
CoreTasks.TASK_STATUS_PLANNED = "_Planned".loc(); // default
CoreTasks.TASK_STATUS_ACTIVE = "_Active".loc();
CoreTasks.TASK_STATUS_DONE = "_Done".loc();
CoreTasks.TASK_STATUS_RISKY = "_Risky".loc();

// Validation status:
CoreTasks.TASK_VALIDATION_UNTESTED = "_Untested".loc(); // default
CoreTasks.TASK_VALIDATION_PASSED = "_Passed".loc();
CoreTasks.TASK_VALIDATION_FAILED = "_Failed".loc();

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
   * A one-line summary of the task (ex. "Widget: Add a nifty feature").
   */
  name: SC.Record.attr(String, { isRequired: YES, defaultValue: CoreTasks.NEW_TASK_NAME }),

  /**
   * Multi-line comments about the task (may be release notes for a feature or steps to reproduce a bug)
   */
  description: SC.Record.attr(String),

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
  status: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: CoreTasks.TASK_STATUS_PLANNED,
    allowed: [
      CoreTasks.TASK_STATUS_PLANNED,
      CoreTasks.TASK_STATUS_ACTIVE,
      CoreTasks.TASK_STATUS_DONE,
      CoreTasks.TASK_STATUS_RISKY
    ]
   }),

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
   * The user who creates the task.
   */
  submitter: SC.Record.attr('CoreTasks.User'),

  /**
  * The user who is assigned to complete the task.
   */
  assignee: SC.Record.attr('CoreTasks.User'),

  /**
   * The path to the icon associated with a task.
   */
  icon: function() { // TODO: [MG] get better icons
    switch (this.get('type')){
      case CoreTasks.TASK_TYPE_FEATURE:
        return 'tasks-icon-feature';
      case CoreTasks.TASK_TYPE_BUG:
        return 'tasks-icon-bug';
      case CoreTasks.TASK_TYPE_OTHER:
        return 'sc-icon-options-16';
    }
  }.property('type').cacheable(),

  /**
   * A string summarizing key facets of the Task for display.
   */
  displayName: function(key, value) {
    if (value !== undefined) {
      this.propertyWillChange('name');
      this.writeAttribute('name', value);
      this.propertyDidChange('name');
    } else {
      var name = this.get('name');
      var effort = this.get('effort');
      var ret = name;
      if (effort) ret += ' {' + effort + '}';
      return ret;
    }
  }.property('name', 'effort').cacheable()

});

CoreTasks.Task.mixin(/** @scope CoreTasks.Task */ {
  callbacks: SC.Object.create(),
  resourcePath: 'task'
});
