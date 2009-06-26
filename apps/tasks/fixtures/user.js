// ==========================================================================
// Project:   Tasks
// ==========================================================================
/*globals Tasks sc_require */

/** @class

  @version 0.1
	@author Suvajit Gupta
*/

sc_require('models/user');

Tasks.User.FIXTURES = [

	{ id: 1,
	name: "Pointy-Haired Boss",
	role: Tasks.USER_ROLE_MANAGER,
	loginName: "bigboss" },

	{ id: 2,
	name: "Dilbert",
	role: Tasks.USER_ROLE_DEVELOPER,
	loginName: "cyberpunk" },

	{ id: 3,
	name: "Asok",
	role: Tasks.USER_ROLE_DEVELOPER,
	loginName: "hacker" },

	{ id: 4,
	name: "Larry",
	role: Tasks.USER_ROLE_TESTER,
	loginName: "tst1" }

];
