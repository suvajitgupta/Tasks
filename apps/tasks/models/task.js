// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks sc_require */

sc_require('models/record');

/** @class

  A Tasks task record

  @extends Tasks.Record
  @version 0.1
	@author Suvajit Gupta
*/

Tasks.consts.NEW_TASK_NAME = "_NewTask".loc();

// types:
Tasks.consts.TASK_TYPE_FEATURE = "_Feature".loc(); // default
Tasks.consts.TASK_TYPE_BUG = "_Bug".loc();
Tasks.consts.TASK_TYPE_OTHER = "_Other".loc();

// priorities:
Tasks.consts.TASK_PRIORITY_HIGH = "_High".loc();
Tasks.consts.TASK_PRIORITY_MEDIUM = "_Medium".loc(); // default
Tasks.consts.TASK_PRIORITY_LOW = "_Low".loc();

// development status:
Tasks.consts.TASK_STATUS_PLANNED = "_Planned".loc(); // default
Tasks.consts.TASK_STATUS_TASK_STATUS_ACTIVE = "_Active".loc();
Tasks.consts.TASK_STATUS_DONE = "_Done".loc();
Tasks.consts.TASK_STATUS_AT_RISK = "_AtRisk".loc();

// validation status:
Tasks.consts.TASK_VALIDATION_NOT_TESTED = "_NotTested".loc(); // default
Tasks.consts.TASK_VALIDATION_PASSED = "_Passed".loc();
Tasks.consts.TASK_VALIDATION_FAILED = "_Failed".loc();

Tasks.Task = Tasks.Record.extend(
/** @scope Tasks.Task.prototype */ {

  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.NEW_TASK_NAME }),
  type: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.TASK_TYPE_FEATURE }),
  description: SC.Record.attr(String),
  priority: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.TASK_PRIORITY_MEDIUM }),
  status: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.TASK_STATUS_PLANNED }),
  validation: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.TASK_VALIDATION_NOT_TESTED }),
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
