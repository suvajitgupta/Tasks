/*globals Tasks sc_require module test ok equals */

/**
 * Tasks Summary View unit tests.
 *
 * @author Suvajit Gupta
 */
sc_require('core');
sc_require('views/summary'); 

var pane = SC.ControlTestPane.design()
  .add('SummaryView', Tasks.SummaryView, {
    layout: { top: 0, height: 16, width: 150, right: 0 },
    classNames: ['status-bar-label'],
    projectsCount: 0,
    tasksTree: null
  });
pane.show(); // add a test to show the test pane
window.pane = pane;

// ..........................................................
// Summary View Tests
// 
module("Tasks.SummaryView tests", pane.standardSetup());
test("no items", function(){
  var view = pane.view('SummaryView');
  ok(view, 'view should render');
  equals(view.$().get(0).innerHTML, 'Displaying -2 projects, ', 'summary at startup');
});