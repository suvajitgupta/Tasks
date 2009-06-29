/*globals Tasks sc_require */

sc_require('models/record');

Tasks.NEW_TASK_NAME = "_NewTask".loc();

// Types:
Tasks.TASK_TYPE_FEATURE = "_Feature".loc(); // default
Tasks.TASK_TYPE_BUG = "_Bug".loc();
Tasks.TASK_TYPE_OTHER = "_Other".loc();

// Priorities:
Tasks.TASK_PRIORITY_HIGH = "_High".loc();
Tasks.TASK_PRIORITY_MEDIUM = "_Medium".loc(); // default
Tasks.TASK_PRIORITY_LOW = "_Low".loc();

// Development status:
Tasks.TASK_STATUS_PLANNED = "_Planned".loc(); // default
Tasks.TASK_STATUS_ACTIVE = "_Active".loc();
Tasks.TASK_STATUS_DONE = "_Done".loc();
Tasks.TASK_STATUS_RISKY = "_AtRisk".loc();

// Validation status:
Tasks.TASK_VALIDATION_UNTESTED = "_Untested".loc(); // default
Tasks.TASK_VALIDATION_PASSED = "_Passed".loc();
Tasks.TASK_VALIDATION_FAILED = "_Failed".loc();

/**
 * The task model.
 *
 * A task represent an atomic unit of work to be done by someone.  They are grouped in projects.
 *
 * @extends Tasks.Record
 * @author Suvajit Gupta
 * @author Sean Eidemiller
 */
Tasks.Task = Tasks.Record.extend({

  /**
   * A one-line summary of the task (ex. "Widget: Add a nifty feature").
   */
  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.NEW_TASK_NAME }),

  /**
   * Multi-line comments about the task (may be release notes for a feature or steps to reproduce a bug)
   */
  description: SC.Record.attr(String),

  /**
   * The type of the task (see below for possible values).
   */
  type: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: Tasks.TASK_TYPE_OTHER,
    allowed: [
      Tasks.TASK_TYPE_FEATURE,
      Tasks.TASK_TYPE_BUG,
      Tasks.TASK_TYPE_OTHER
    ]
  }),

  /**
   * The proiority of the task (HIGH indicates task must be completed, LOW ones are not used for effort subtotals).
   */
  priority: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: Tasks.TASK_PRIORITY_MEDIUM,
    allowed: [
      Tasks.TASK_PRIORITY_HIGH,
      Tasks.TASK_PRIORITY_MEDIUM,
      Tasks.TASK_PRIORITY_LOW
    ]
  }),

  /**
   * The development status of the task (see below for allowed values).
   */
  status: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: Tasks.TASK_STATUS_PLANNED,
    allowed: [
      Tasks.TASK_STATUS_PLANNED,
      Tasks.TASK_STATUS_ACTIVE,
      Tasks.TASK_STATUS_DONE,
      Tasks.TASK_STATUS_RISKY
    ]
   }),

  /**
   * The validation status of the task (see below for allowed values).
   */
  validation: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: Tasks.TASK_VALIDATION_UNTESTED,
    allowed: [
      Tasks.TASK_VALIDATION_UNTESTED,
      Tasks.TASK_VALIDATION_PASSED,
      Tasks.TASK_VALIDATION_FAILED
    ]
  }),

  /**
   * The effort of the task (can start with an estimate and end with the actual).
   */
  effort: SC.Record.attr(String),

  /**
   * The user who creates the task.
   */
  submitter: SC.Record.attr('Tasks.User'),

  /**
  * The user who is assigned to complete the task.
   */
  assignee: SC.Record.attr('Tasks.User'),

  /**
   * The path to the icon associated with a task.
   */
  icon: function() { // TODO: get better icons
		switch (this.get('type')){
			case Tasks.TASK_TYPE_FEATURE:
	    	return 'tasks-icon-feature';
      case Tasks.TASK_TYPE_BUG:
    		return 'tasks-icon-bug';
      case Tasks.TASK_TYPE_OTHER:
    		return 'sc-icon-options-16';
		}
  }.property('type').cacheable(),

  /**
   * A string summarizing key facets of the Task for display.
   */
  displayName: function() {
    var name = this.get('name');
    var effort = this.get('effort');
    var ret = name;
    if (effort) ret += ' {' + effort + '}';
    return ret;
  }.property('name', 'effort').cacheable()

});
