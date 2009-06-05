// ==========================================================================
// Project:   Tasks.Task
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks */

/** @class

  A single task on the todo list

  @extends SC.Record
  @version 0.1
*/
Tasks.Task = SC.Record.extend(
/** @scope Tasks.Task.prototype */ {

  isDone: SC.Record.attr(Boolean),
  description: SC.Record.attr(String),
  assignee: SC.Record.attr(String),
  estimate: SC.Record.attr(String),

  task: function() {
    var description = this.get('summary');
		var effort = this.get('effort');
		var ret = description;
    if (effort) ret += " {" + effort + "}";
	  return ret;
  }.property('summary', 'effort').cacheable()

}) ;
