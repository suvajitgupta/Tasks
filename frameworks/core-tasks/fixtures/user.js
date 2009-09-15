/*globals CoreTasks sc_require */

sc_require('models/user');

/**
 * Creates a sampling of users covering all available roles.
 */
CoreTasks.User.FIXTURES = [

  { id: 1,
  name: "Suvajit Gupta",
  role: CoreTasks.USER_ROLE_MANAGER,
  loginName: "SG" },
  
  { id: 2,
  name: "Sean Eidemiller",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "SE" },

  { id: 3,
  name: "Josh Holt",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "JH2" },

  { id: 4,
  name: "Brandon Blatnick",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "BB" },

  { id: 5,
  name: "Mike Ball",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "MB" },

  { id: 7,
  name: "SproutCore",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "SC" },

  { id: 8,
  name: "Matt Grantham",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "MG" },

  { id: 9,
  name: "Bill Mosteller",
  role: CoreTasks.USER_ROLE_TESTER,
  loginName: "BM" }

];
