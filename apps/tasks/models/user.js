// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks sc_require */

sc_require('models/record');

/** @class

  A user 

  @extends Tasks.Record
  @version 0.1
*/

Tasks.User = Tasks.Record.extend(
/** @scope Tasks.User.prototype */ {

  loginName: SC.Record.attr(String),
  role: SC.Record.attr(String), // valid values below
  preferences: SC.Record.attr(Object), // key:value pairs
  authToken: SC.Record.attr(String)

});

// TODO: use these for enums or a mixin?
Tasks.User.MANAGER = "Manager";
Tasks.User.DEVELOPER = "Developer";
Tasks.User.TESTER = "Tester";
