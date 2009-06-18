// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks sc_require */

sc_require('models/record');

/** @class

  A Tasks project record

  @extends Tasks.Record
  @version 0.1
	@author Suvajit Gupta
*/

Tasks.consts.NEW_PROJECT_NAME = "_NewProject".loc();

Tasks.Project = Tasks.Record.extend(
/** @scope Tasks.Project.prototype */ {

  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.NEW_PROJECT_NAME }),
  timeLeft: SC.Record.attr(Number), // the amount of time left before Project completion, used for load balancing
	tasks: SC.Record.toMany('Tasks.Task'),
  
  icon: function() {
    return 'sc-icon-folder-16';
  }.property().cacheable(),
  
  displayName: function() {
    var name = this.get('name');
		var timeLeft = this.get('timeLeft');
		var ret = name;
    if (timeLeft) ret += ' {' + timeLeft + '}';
	  return ret;
  }.property('name', 'timeLeft').cacheable()
  
  
  
});
