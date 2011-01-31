/*globals CoreTasks Tasks sc_require module test ok equals */

/**
 * Tasks TaskItemView unit tests.
 *
 * @author Suvajit Gupta
 */
// http://localhost:4400/tasks/en/current/tests/views/task_item.html

var task = SC.Object.create({ displayId: "#100", displayName: "Task", icon: 'task-icon-feature', priority: CoreTasks.TASK_PRIORITY_HIGH, type: CoreTasks.TASK_TYPE_FEATURE, developmentStatus: CoreTasks.STATUS_DONE, validation: CoreTasks.TASK_VALIDATION_PASSED, displayEffort: "4-5d", isRecentlyUpdated: YES, description: "Sample description" });

var pane = SC.ControlTestPane.design({ classNames: [ 'tasks-pane' ] })
  .add('task', Tasks.TaskItemView, {
    contentValueKey: 'displayName',
    contentUnreadCountKey: 'displayEffort',
    hasContentIcon: YES,
    contentIconKey: 'icon',
    layout: { left: 0, right: 0, height: 24 },
    classNames: [ 'sc-collection-item' ],
    content: task
  });
pane.show(); // add a test to show the test pane
window.pane = pane ;

// ..........................................................
// Summary View Tests
// 
module("Tasks.TaskItemView tests", pane.standardSetup());
