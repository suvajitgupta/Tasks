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
*/

Tasks.NEW_PROJECT_NAME = "New Project";

Tasks.Project = Tasks.Record.extend(
/** @scope Tasks.Project.prototype */ {

  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.NEW_PROJECT_NAME }),
  timeLeft: SC.Record.attr(Number), // the amount of time left before Project completion, used for load balancing
  tasks: SC.Record.attr(Array) // an array of Task ids in the Project

});
