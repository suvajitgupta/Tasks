// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks sc_require */

sc_require('models/record');

/** @class

  A Tasks user 

  @extends Tasks.Record
  @version 0.1
	@author Suvajit Gupta
*/

Tasks.consts.NEW_USER_NAME = "First Last";
Tasks.consts.NEW_USER_LOGIN = "first.last";

// roles:
Tasks.consts.USER_ROLE_MANAGER = "Manager";
Tasks.consts.USER_ROLE_DEVELOPER = "Developer"; // default
Tasks.consts.USER_ROLE_TESTER = "Tester";

Tasks.User = Tasks.Record.extend(
/** @scope Tasks.User.prototype */ {

  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.NEW_USER_NAME }),
  loginName: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.NEW_USER_LOGIN }),
  role: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.USER_ROLE_DEVELOPER }), 
  preferences: SC.Record.attr(Object), // key:value pairs
  authToken: SC.Record.attr(String)

});
