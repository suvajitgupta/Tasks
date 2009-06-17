// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks sc_require */

sc_require('models/record');

/** @class

  A Tasks project 

  @extends Tasks.Record
  @version 0.1
	@author Suvajit Gupta
	@author Joshua Holt
*/

Tasks.consts.NEW_PROJECT_NAME = "_NewProject".loc();

Tasks.Project = Tasks.Record.extend(
/** @scope Tasks.Project.prototype */ {

  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.NEW_PROJECT_NAME }),
  timeLeft: SC.Record.attr(Number), // the amount of time left before Project completion, used for load balancing
  
  projectIcon: function() {
    return 'sc-icon-folder-16';
  }.property().cacheable(),
  
  tasks: function() {
    var q = SC.Query.create({ conditions: "projectID = %@".fmt(this.get('id')), recordType: Tasks.Task});
    var collection = Tasks.store.findAll(q);
    return collection;
  }.property('tasks').cacheable(),
  
  user: function(){
    var user = Tasks.User.find(Tasks.store, this.get('assignee'));
    return user.get('name');
  }.property('assignee').cacheable()
  
});
