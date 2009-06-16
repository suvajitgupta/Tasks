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
*/

Tasks.NEW_TASK_NAME = "New Task";

// types:
Tasks.TASK_TYPE_FEATURE = "Feature"; // default
Tasks.TASK_TYPE_BUG = "Bug";
Tasks.TASK_TYPE_OTHER = "Other";

// priorities:
Tasks.TASK_PRIORITY_HIGH = "High";
Tasks.TASK_PRIORITY_MEDIUM = "Medium"; // default
Tasks.TASK_PRIORITY_LOW = "Low";

// development status:
Tasks.TASK_STATUS_PLANNED = "Planned"; // default
Tasks.TASK_STATUS_TASK_STATUS_ACTIVE = "Active";
Tasks.TASK_STATUS_DONE = "Done";
Tasks.TASK_STATUS_AT_RISK = "AtRisk";

// validation status:
Tasks.TASK_VALIDATION_NOT_TESTED = "NotTested"; // default
Tasks.TASK_VALIDATION_PASSED = "Passed";
Tasks.TASK_VALIDATION_FAILED = "Failed";

Tasks.Task = Tasks.Record.extend(
/** @scope Tasks.Task.prototype */ {

  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.NEW_TASK_NAME }),
  type: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.TASK_TYPE_FEATURE }),
  description: SC.Record.attr(String),
  priority: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.TASK_PRIORITY_MEDIUM }),
  status: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.TASK_STATUS_PLANNED }),
  validation: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.TASK_VALIDATION_NOT_TESTED }),
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
