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

  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.User.NEW_USER }),
  loginName: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.User.NEW_LOGIN }),
  role: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.User.DEVELOPER }), 
  preferences: SC.Record.attr(Object), // key:value pairs
  authToken: SC.Record.attr(String)

});

Tasks.User.NEW_USER = "First Last";
Tasks.User.NEW_LOGIN = "first.last";

// roles:
Tasks.User.MANAGER = "Manager";
Tasks.User.DEVELOPER = "Developer"; // default
Tasks.User.TESTER = "Tester";
