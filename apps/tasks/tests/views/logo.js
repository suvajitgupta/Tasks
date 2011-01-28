/*globals Tasks sc_require module test ok equals */

/**
 * Tasks View unit tests.
 *
 * @author Suvajit Gupta
 */
/*globals htmlbody */
// http://localhost:4400/tasks/en/current/tests/views/logo.html

htmlbody('<style> .wrapper { background-color: #3D3D3D; } </style>');

var pane = SC.ControlTestPane.design()
  .add('Tasks small/tooltip', Tasks.LogoView, {
    layout: { left: 0, width: 104, centerY: 0, height: 27 },
    logo: "tasks-logo-small",
    toolTip: "Show Tasks credits",
    version: "1.5"
  })
  .add('Tasks large/no tooltip', Tasks.LogoView, {
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


