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
  name: "Mike Ball",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "MB" },

  { id: 5,
  name: "Brandon Blatnick",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "BB" },

  { id: 6,
  name: "Erich Ocean",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "EO" },

  { id: 7,
  name: "Evin Grano",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "EG" },

  { id: 8,
  name: "SproutCore",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "SC" },

  { id: 9,
  name: "Matt Grantham",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "MG" },

  { id: 10,
  name: "Mo Taher",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "MT" },

  { id: 11,
  name: "Dimitri Colomvakos",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "DC" },

  { id: 12,
  name: "Bill Mosteller",
  role: CoreTasks.USER_ROLE_TESTER,
  loginName: "BM" },

  { id: 13,
  name: "Jonathan Lewis",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "JL" },

  { id: 14,
  name: "Sebastian Feher",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "SF2" },

  { id: 15,
  name: "Fred Sakr",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "FS" },

  { id: 16,
  name: "Michael Scrivo",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "MS" },

  { id: 17,
  name: "Scott Hill",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "SH" },

  { id: 18,
  name: "Andrew Robinson",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "AWR" },

  { id: 19,
  name: "Michael Cohen",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "MC" },

  { id: 20,
  name: "Michael Harris",
  role: CoreTasks.USER_ROLE_DEVELOPER,
  loginName: "MH" }

];
