/*globals CoreTasks Tasks sc_require module test ok equals */

/**
 * Tasks AssigneeItemView unit tests.
 *
 * @author Suvajit Gupta
 */
// http://localhost:4400/tasks/en/current/tests/views/assignee_item.html

var overloadedUser = SC.Object.create({ displayName: "Suvajit Gupta (SG)", displayEffort: "5 tasks left", finishedEffort: "1 tasks finished", tasksCount: 10, loading: CoreTasks.USER_OVER_LOADED });
var properlyloadedUser = SC.Object.create({ displayName: "Josh Holt (JH2)", displayEffort: "4 tasks left", finishedEffort: "2 tasks finished", tasksCount: 4, loading: CoreTasks.USER_PROPERLY_LOADED });
var underloadedUser = SC.Object.create({ displayName: "Sean Eidemiller (SE)", displayEffort: "2 tasks left", finishedEffort: "3 tasks finished", tasksCount: 3, loading: CoreTasks.USER_UNDER_LOADED });
var notLoadedUser = SC.Object.create({ displayName: "Unassigned", tasksCount: 0, loading: CoreTasks.USER_NOT_LOADED });

var pane = SC.ControlTestPane.design({ classNames: [ 'tasks-pane-inner' ] })
  .add('OverloadedUser', Tasks.AssigneeItemView, {
    disclosureState: SC.BRANCH_CLOSED,
    contentValueKey: 'displayName',
    contentUnreadCountKey: 'displayEffort',
    layout: { left: 0, right: 0, height: 24 },
    classNames: [ 'sc-collection-item', 'sc-group-item' ],
    content: overloadedUser
  })
  .add('ProperlyLoadedUser', Tasks.AssigneeItemView, {
    disclosureState: SC.BRANCH_CLOSED,
    contentValueKey: 'displayName',
    contentUnreadCountKey: 'displayEffort',
    layout: { left: 0, right: 0, height: 24 },
    classNames: [ 'sc-collection-item', 'sc-group-item' ],
    content: properlyloadedUser
  })
  .add('UnderLoadedUser', Tasks.AssigneeItemView, {
    disclosureState: SC.BRANCH_CLOSED,
    contentValueKey: 'displayName',
    contentUnreadCountKey: 'displayEffort',
    layout: { left: 0, right: 0, height: 24 },
    classNames: [ 'sc-collection-item', 'sc-group-item' ],
    content: underloadedUser
  })
  .add('NotLoadedUser', Tasks.AssigneeItemView, {
    disclosureState: SC.BRANCH_CLOSED,
    contentValueKey: 'displayName',
    contentUnreadCountKey: 'displayEffort',
    layout: { left: 0, right: 0, height: 24 },
    classNames: [ 'sc-collection-item', 'sc-group-item' ],
    content: notLoadedUser
  });
pane.show(); // add a test to show the test pane
window.pane = pane ;

// ..........................................................
// Summary View Tests
// 
module("Tasks.AssigneeItemView tests", pane.standardSetup());
