// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks sc_require */

sc_require('models/record');

/** @class

  A Tasks task 

  @extends Tasks.Record
  @version 0.1
	@author Suvajit Gupta
*/

Tasks.consts.NEW_TASK_NAME = "New Task";

// types:
Tasks.consts.TASK_TYPE_FEATURE = "Feature"; // default
Tasks.consts.TASK_TYPE_BUG = "Bug";
Tasks.consts.TASK_TYPE_OTHER = "Other";

// priorities:
Tasks.consts.TASK_PRIORITY_HIGH = "High";
Tasks.consts.TASK_PRIORITY_MEDIUM = "Medium"; // default
Tasks.consts.TASK_PRIORITY_LOW = "Low";

// development status:
Tasks.consts.TASK_STATUS_PLANNED = "Planned"; // default
Tasks.consts.TASK_STATUS_TASK_STATUS_ACTIVE = "Active";
Tasks.consts.TASK_STATUS_DONE = "Done";
Tasks.consts.TASK_STATUS_AT_RISK = "AtRisk";

// validation status:
Tasks.consts.TASK_VALIDATION_NOT_TESTED = "NotTested"; // default
Tasks.consts.TASK_VALIDATION_PASSED = "Passed";
Tasks.consts.TASK_VALIDATION_FAILED = "Failed";

Tasks.Task = Tasks.Record.extend(
/** @scope Tasks.Task.prototype */ {

  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.NEW_TASK_NAME }),
  type: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.TASK_TYPE_FEATURE }),
  description: SC.Record.attr(String),
  priority: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.TASK_PRIORITY_MEDIUM }),
  status: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.TASK_STATUS_PLANNED }),
  validation: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.TASK_VALIDATION_NOT_TESTED }),
  effort: SC.Record.attr(Number),
  submitter: SC.Record.attr(String),
  assignee: SC.Record.attr(String),

  task: function() {
    var name = this.get('name');
		var effort = this.get('effort');
		var ret = name;
    if (effort) ret += " {" + effort + "}";
	  return ret;
  }.property('name', 'effort').cacheable()

});
