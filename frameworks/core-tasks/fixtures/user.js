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
  loginName: "enemy1" },

  { id: 5,
  name: "Suvajit Gupta",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "SG" },
  
  { id: 6,
  name: "Sean Eidemiller",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "SE" },

  { id: 7,
  name: "Josh Holt",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "JH2" },

  { id: 8,
  name: "Mike Ball",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "MB" },

  { id: 9,
  name: "Brandon Blatnick",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "BB" },

  { id: 10,
  name: "Erich Ocean",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "EO" },

  { id: 11,
  name: "Evin Grano",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "EG" },

  { id: 12,
  name: "SproutCore",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "SC" },

  { id: 13,
  name: "Matt Grantham",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "MG" },

  { id: 14,
  name: "Mo Taher",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "MT" },

  { id: 15,
  name: "Dimitri Colomvakos",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "DC" },

  { id: 16,
  name: "Bill Mosteller",
  role: CoreTasks.USER_ROLE_TESTER,
  loginName: "BM" }

];
