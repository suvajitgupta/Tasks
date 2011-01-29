/*globals Tasks sc_require module test ok equals htmlbody */

/**
 * Tasks AssigneeView unit tests.
 *
 * @author Suvajit Gupta
 */
// http://localhost:4400/tasks/en/current/tests/views/logo.html

htmlbody('<style> .wrapper { background-color: #3D3D3D; } </style>');

var sampleToolTip = "Some tooltip";

var pane = SC.ControlTestPane.design()
  .add('small', Tasks.LogoView, {
    layout: { left: 0, width: 104, centerY: 0, height: 27 },
    logo: "tasks-logo-small",
    toolTip: sampleToolTip,
    version: "1.5"
  })
  .add('large', Tasks.LogoView, {
    layout: { left: 0, width: 185, centerY: 0, height: 56 },
    logo: "tasks-logo-large",
    version: "Beta"
  });
pane.show(); // add a test to show the test pane
window.pane = pane ;

// ..........................................................
// Summary View Tests
// 
module("Tasks.LogoView tests", pane.standardSetup());

test('Tasks Small Logo with a tooltip', function(){
  var view = pane.view('small');
  ok(view, 'view should render');
  equals(view.get('toolTip'), sampleToolTip, 'Has tooltip');
});

test('Tasks Large Logo without a tooltip', function(){
  var view = pane.view('large');
  ok(view, 'view should render');
  equals(view.get('toolTip'), '', 'Does not have a tooltip');
});
