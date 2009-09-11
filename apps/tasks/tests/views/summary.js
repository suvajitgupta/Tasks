/*globals Tasks sc_require module test ok equals */

/**
 * Tasks Summary View unit tests.
 *
 * @author Mike Ball
 * @author Suvajit Gupta
 */

// TODO: [SG] update unit test - view has changed

var pane = SC.ControlTestPane.design()
  .add("none", Tasks.SummaryView, {
    value: 0
  })
  .add("one", Tasks.SummaryView, {
    value: 1
  })
  .add("many", Tasks.SummaryView, {
    value: 15
  });
pane.show(); // add a test to show the test pane
window.pane = pane ;

// ..........................................................
// Summary View Tests
// 
module("Tasks.SummaryView tests", pane.standardSetup());
test("no items", function(){
  var view = pane.view('none');
  ok(view, 'view should render');
  equals(view.$().get(0).innerHTML, 'No tasks', 'displays the correct test');
});

test("one item", function(){
  var view = pane.view('one');
  equals(view.$().get(0).innerHTML, '1 task', 'displays the correct test');
  
});

test("many items", function(){
  var view = pane.view('many');
  equals(view.$().get(0).innerHTML, '15 tasks', 'displays the correct test');
  
});

