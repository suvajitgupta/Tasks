// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks */

/** @class

  A user 

  @extends Tasks.Record
  @version 0.1
*/

Tasks.User.MANAGER = "Manager";
Tasks.User.DEVELOPER = "Developer";
Tasks.User.TESTER = "Tester";


Tasks.User = Tasks.Record.extend(
/** @scope Tasks.User.prototype */ {

  loginName: SC.Record.attr(String),
  authToken: SC.Record.attr(Number),
  role: SC.Record.attr(String),
  preferences: SC.Record.attr(Object)

}) ;
