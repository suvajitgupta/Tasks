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
    var description = this.get('description');
    var assignee = this.get('assignee');
		var estimate = this.get('estimate');
		var ret = description;
    if (assignee) ret += " [" + assignee + "]";
    if (estimate) ret += " {" + estimate + "}";
	  return ret;
  }.property('description', 'assignee').cacheable()

}) ;
