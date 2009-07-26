/*globals Tasks sc_require */

sc_require('models/user');

/**
 * Creates a sampling of users covering all available roles.
 */
Tasks.User.FIXTURES = [

  { id: 1,
  name: "Pointy Haired Boss",
  role: Tasks.USER_ROLE_MANAGER,
  loginName: "bigboss" },

  { id: 2,
  name: "Antimatter Dilbert",
  role: Tasks.USER_ROLE_DEVELOPER,
  loginName: "cyberpunk" },

  { id: 3,
  name: "Amber Dextrous",
  role: Tasks.USER_ROLE_DEVELOPER,
  loginName: "hacker" },

  { id: 4,
  name: "Larry A. Dinosaur",
  role: Tasks.USER_ROLE_TESTER,
  loginName: "enemy1" }

];
