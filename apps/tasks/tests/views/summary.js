/*globals Tasks sc_require module test ok equals */

/**
 * Tasks Summary View unit tests.
 *
 * @author Suvajit Gupta
 */
// http://localhost:4400/tasks/en/current/tests/views/summary.html

sc_require('core');
sc_require('views/summary'); 


var noSelection = SC.Object.create({ length: 0 });
var singleSelection = SC.Object.create({ length: 1 });

var pane = SC.ControlTestPane.design()
  .add('null', Tasks.SummaryView, {
    layout: { top: 0, height: 16, width: 250, left: 0 }
  })
  .add('empty', Tasks.SummaryView, {
    layout: { top: 0, height: 16, width: 250, left: 0 },
    assignmentsSummary: "0 assignees and 0 tasks",
    projectsSelection: noSelection,
    tasksSelection: noSelection
  })
  .add('tasks', Tasks.SummaryView, {
    layout: { top: 0, height: 16, width: 250, left: 0 },
    assignmentsSummary: "3 assignees and 12 tasks",
    projectsSelection: singleSelection,
    tasksSelection: singleSelection
  })
  .add('team', Tasks.SummaryView, {
    layout: { top: 0, height: 16, width: 250, left: 0 },
    assignmentsSummary: "3 assignees and 2 red flags",
    projectsSelection: singleSelection,
    tasksSelection: singleSelection
  });
  
pane.show(); // add a test to show the test pane
window.pane = pane;

// ..........................................................
// Summary View Tests
// 
module("Tasks.SummaryView tests", pane.standardSetup());

test("startup", function(){
  var view = pane.view('null');
  ok(view, 'view should render');
  equals(view.$().get(0).innerHTML, '', 'Null summary');
});

test("empty", function(){
  var view = pane.view('empty');
  equals(view.$().get(0).innerHTML, '0 assignees and 0 tasks displayed, 0 projects and 0 tasks selected', 'Empty summary');
});


test("TASKS display mode", function(){
  var view = pane.view('tasks');
  equals(view.$().get(0).innerHTML, '3 assignees and 12 tasks displayed, 1 projects and 1 tasks selected', 'Sample TASKS display mode summary');
});

test("TEAM display mode", function(){
  var view = pane.view('team');
  equals(view.$().get(0).innerHTML, '3 assignees and 2 red flags displayed, 1 projects and 1 tasks selected', 'Sample TEAM display mode summary');
});