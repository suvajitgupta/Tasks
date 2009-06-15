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
  priority: SC.Record.attr(String),
  status: SC.Record.attr(String),
  validation: SC.Record.attr(String),
  effort: SC.Record.attr(Number),
  submitter: SC.Record.attr(String),
  assignee: SC.Record.attr(String),
	// TODO: how to set default values?

  task: function() {
    var name = this.get('name');
		var effort = this.get('effort');
		var ret = name;
    if (effort) ret += " {" + effort + "}";
	  return ret;
  }.property('name', 'effort').cacheable()

});

Tasks.Task.mixin({ // valid values & defaults
  
  // types
  FEATURE: "Feature", // default
  BUG: "Bug",
  OTHER: "Other",

  // priorities
  HIGH: "High",
  MEDIUM: "Medium", // default
  LOW: "Low",

  // development status
	PLANNED: "Planned", // default
  ACTIVE: "Active",
  DONE: "Done",
  AT_RISK: "AtRisk",

  // validation status
  NOT_TESTED: "NotTested", // default
  PASSED: "Passed",
  FAILED: "Failed"
  
});
