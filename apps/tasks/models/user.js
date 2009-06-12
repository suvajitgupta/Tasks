// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks */

sc_require('models/record');

/** @class

  A user 

  @extends Tasks.Record
  @version 0.1
*/

Tasks.User = Tasks.Record.extend(
/** @scope Tasks.User.prototype */ {

  loginName: SC.Record.attr(String),
  authToken: SC.Record.attr(String),
  role: SC.Record.attr(String),
  preferences: SC.Record.attr(Object)

});

Tasks.User.MANAGER = "Manager";
Tasks.User.DEVELOPER = "Developer";
Tasks.User.TESTER = "Tester";
