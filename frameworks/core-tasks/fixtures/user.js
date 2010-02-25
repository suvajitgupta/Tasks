/*globals CoreTasks sc_require */

sc_require('models/user');

CoreTasks.User.FIXTURES = [
  { id: 1, loginName: "mgr", name: "Manager User", role: "_Manager" },
  { id: 2, loginName: "dev", name: "Developer User", role: "_Developer" },
  { id: 3, loginName: "tst", name: "Tester User", role: "_Tester" },
  { id: 4, loginName: "guest", name: "Guest User", role: "_Guest" }
];