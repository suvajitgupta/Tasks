// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks sc_require */

/** @class

  @version 0.1
	@author Suvajit Gupta
*/

sc_require('models/user');

Tasks.User.FIXTURES = [

	{ id: 1,
	name: "Manager1",
	role: Tasks.USER_ROLE_MANAGER,
	loginName: "mgr1" },

	{ id: 2,
	name: "Developer1",
	role: Tasks.USER_ROLE_DEVELOPER,
	loginName: "dev1" },

	{ id: 3,
	name: "Developer2",
	role: Tasks.USER_ROLE_DEVELOPER,
	loginName: "dev" },

	{ id: 4,
	name: "Tester1",
	role: Tasks.USER_ROLE_TESTER,
	loginName: "tst1" }

];
