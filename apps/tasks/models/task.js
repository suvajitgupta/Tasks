// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks sc_require */

sc_require('models/record');

/** @class

  A single task 

  @extends Tasks.Record
  @version 0.1
*/

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

});

Tasks.Task.mixin({
  
  // Task types
  FEATURE: "Feature",
  BUG: "Bug",
  OTHER: "Other",

  // Task priorities
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",

  PLANNED: "Planned",
  ACTIVE: "Active",
  DONE: "Done",
  AT_RISK: "AtRisk",

  NOT_TESTED: "NotTested",
  PASSED: "Passed",
  FAILED: "Failed"
  
});
