// ==========================================================================
// Project: Tasks
// Copyright: 2009 Eloqua Limited
// ==========================================================================

sc_require('models/record');

Tasks.consts.NEW_TASK_NAME = "_NewTask".loc();

// Types:
Tasks.consts.TASK_TYPE_FEATURE = "_Feature".loc(); // default
Tasks.consts.TASK_TYPE_BUG = "_Bug".loc();
Tasks.consts.TASK_TYPE_OTHER = "_Other".loc();

// Priorities:
Tasks.consts.TASK_PRIORITY_HIGH = "_High".loc();
Tasks.consts.TASK_PRIORITY_MEDIUM = "_Medium".loc(); // default
Tasks.consts.TASK_PRIORITY_LOW = "_Low".loc();

// Development status:
Tasks.consts.TASK_STATUS_PLANNED = "_Planned".loc(); // default
Tasks.consts.TASK_STATUS_ACTIVE = "_Active".loc();
Tasks.consts.TASK_STATUS_DONE = "_Done".loc();
Tasks.consts.TASK_STATUS_AT_RISK = "_AtRisk".loc();

// Validation status:
Tasks.consts.TASK_VALIDATION_NOT_TESTED = "_NotTested".loc(); // default
Tasks.consts.TASK_VALIDATION_PASSED = "_Passed".loc();
Tasks.consts.TASK_VALIDATION_FAILED = "_Failed".loc();

/**
 * The task model.
 *
 * TODO: Add more descriptive docs.
 *
 * @extends Tasks.Record
 * @author Suvajit Gupta
 * @author Sean Eidemiller
 */
Tasks.Task = Tasks.Record.extend({

  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.NEW_TASK_NAME }),
  description: SC.Record.attr(String),

  type: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: Tasks.consts.TASK_TYPE_FEATURE,
    allowed: [
      Tasks.consts.TASK_TYPE_FEATURE,
      Tasks.consts.TASK_TYPE_BUG,
      Tasks.consts.TASK_TYPE_OTHER
    ]
  }),

  priority: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: Tasks.consts.TASK_PRIORITY_MEDIUM,
    allowed: [
      Tasks.consts.TASK_PRIORITY_HIGH,
      Tasks.consts.TASK_PRIORITY_MEDIUM,
      Tasks.consts.TASK_PRIORITY_LOW
    ]
  }),

  status: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: Tasks.consts.TASK_STATUS_PLANNED,
    allowed: [
      Tasks.consts.TASK_STATUS_PLANNED,
      Tasks.consts.TASK_STATUS_ACTIVE,
      Tasks.consts.TASK_STATUS_DONE,
      Tasks.consts.TASK_STATUS_AT_RISK
    ]
   }),

  validation: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: Tasks.consts.TASK_VALIDATION_NOT_TESTED,
    allowed: [
      Tasks.consts.TASK_VALIDATION_NOT_TESTED,
      Tasks.consts.TASK_VALIDATION_PASSED,
      Tasks.consts.TASK_VALIDATION_FAILED
    ]
  }),

  effort: SC.Record.attr(String),
  submitter: SC.Record.attr('Tasks.User'),
  assignee: SC.Record.attr('Tasks.User'),

  displayName: function() {
    var name = this.get('name');
    var effort = this.get('effort');
    var ret = name;
    if (effort) ret += ' {' + effort + '}';
    return ret;
  }.property('name', 'effort').cacheable()

});
