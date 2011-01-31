/*globals CoreTasks Tasks sc_require module test ok equals */

/**
 * Users UserItemView unit tests.
 *
 * @author Suvajit Gupta
 */
// http://localhost:4400/users/en/current/tests/views/user_item.html

var user = SC.Object.create({ displayName: "User", icon: 'user-role-developer', password: "password", isRecentlyUpdated: YES });

var pane = SC.ControlTestPane.design({ classNames: [ 'users-pane' ] })
  .add('user', Tasks.UserItemView, {
    contentValueKey: 'displayName',
    hasContentIcon: YES,
    contentIconKey: 'icon',
    layout: { left: 0, right: 0, height: 24 },
    classNames: [ 'sc-collection-item' ],
    content: user
  });
pane.show(); // add a test to show the test pane
window.pane = pane ;

// ..........................................................
// Summary View Tests
// 
module("Users.UserItemView tests", pane.standardSetup());
