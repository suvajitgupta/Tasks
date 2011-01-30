/*globals CoreTasks Tasks sc_require module test ok equals */

/**
 * Tasks ProjectItemView unit tests.
 *
 * @author Suvajit Gupta
 */
// http://localhost:4400/tasks/en/current/tests/views/project_item.html

var emptySystemProject = SC.Object.create({ id: 1, displayName: "Empty System Project", icon: 'empty-system-project-icon', tasks: [] });
var systemProject = SC.Object.create({ id: 2, displayName: "System Project", icon: 'system-project-icon', tasks: [] });
var emptyRegularProject = SC.Object.create({ id: 3, displayName: "Empty Regular Project with Description", icon: 'empty-project-icon', description: "Sample description", tasks: [] });
var regularProject = SC.Object.create({ id: 4, displayName: "Regular, Recently Modified, Project", icon: 'project-icon', displayCountDown: "5d", isRecentlyUpdated: YES, tasks: [ "1" ] });

var pane = SC.ControlTestPane.design({ classNames: [ 'projects-pane' ] })
  .add('emptySystemProject', Tasks.ProjectItemView, {
    contentValueKey: 'displayName',
    contentUnreadCountKey: 'displayCountDown',
    hasContentIcon: YES,
    contentIconKey: 'icon',
    layout: { left: 0, right: 0, height: 24 },
    classNames: [ 'sc-collection-item' ],
    content: emptySystemProject
  })
  .add('systemProject', Tasks.ProjectItemView, {
    contentValueKey: 'displayName',
    contentUnreadCountKey: 'displayCountDown',
    hasContentIcon: YES,
    contentIconKey: 'icon',
    layout: { left: 0, right: 0, height: 24 },
    classNames: [ 'sc-collection-item' ],
    content: systemProject
  })
  .add('emptyRegularProjectWithDescription', Tasks.ProjectItemView, {
    contentValueKey: 'displayName',
    contentUnreadCountKey: 'displayCountDown',
    hasContentIcon: YES,
    contentIconKey: 'icon',
    layout: { left: 0, right: 0, height: 24 },
    classNames: [ 'sc-collection-item' ],
    content: emptyRegularProject
  })
  .add('regularRecentlyModifiedProject', Tasks.ProjectItemView, {
    contentValueKey: 'displayName',
    contentUnreadCountKey: 'displayCountDown',
    hasContentIcon: YES,
    contentIconKey: 'icon',
    layout: { left: 0, right: 0, height: 24 },
    classNames: [ 'sc-collection-item' ],
    content: regularProject
  });
pane.show(); // add a test to show the test pane
window.pane = pane ;

// ..........................................................
// Summary View Tests
// 
module("Tasks.ProjectItemView tests", pane.standardSetup());
