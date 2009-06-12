// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks */

/** @class

  A single task 

  @extends Tasks.Record
  @version 0.1
*/

// Task types
Tasks.Task.FEATURE = "Feature";
Tasks.Task.BUG = "Bug";
Tasks.Task.OTHER = "Other";

// Task priorities
Tasks.Task.HIGH = "High";
Tasks.Task.MEDIUM = "Medium";
Tasks.Task.LOW = "Low";


Tasks.Task.PLANNED = "Planned";
Tasks.Task.ACTIVE = "Active";
Tasks.Task.DONE = "Done";
Tasks.Task.AT_RISK = "AtRisk";

Tasks.Task.NOT_TESTED = "NotTested";
Tasks.Task.PASSED = "Passed";
Tasks.Task.FAILED = "Failed";


Tasks.Task = Tasks.Record.extend(
/** @scope Tasks.Task.prototype */ {

  type: SC.Record.attr(String),
  description: SC.Record.attr(String),
  effort: SC.Record.attr(Number),
  priority: SC.Record.attr(String),
  validation: SC.Record.attr(String),
  submitter: SC.Record.attr(String),
  assignee: SC.Record.attr(String),

  task: function() {
    var name = this.get('name');
		var effort = this.get('effort');
		var ret = name;
    if (effort) ret += " {" + effort + "}";
	  return ret;
  }.property('name', 'effort').cacheable()

}) ;
