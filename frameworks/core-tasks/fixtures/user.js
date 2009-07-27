/*globals CoreTasks sc_require */

sc_require('models/user');

/**
 * Creates a sampling of users covering all available roles.
 */
CoreTasks.User.FIXTURES = [

  { id: 1,
  name: "Pointy Haired Boss",
  role: CoreTasks.USER_ROLE_MANAGER,
  loginName: "bigboss" },

  { id: 2,
  name: "Antimatter Dilbert",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "cyberpunk" },

  { id: 3,
  name: "Amber Dextrous",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "hacker" },

  { id: 4,
  name: "Larry A. Dinosaur",
  role: CoreTasks.USER_ROLE_TESTER,
  loginName: "enemy1" }

];
