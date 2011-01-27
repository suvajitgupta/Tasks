/*globals Tasks sc_require module test ok equals */

/**
 * Tasks View unit tests.
 *
 * @author Suvajit Gupta
 */

var pane = SC.ControlTestPane.design()
  .add('null', Tasks.LogoView, {
    layout: { left: 115, width: 145, centerY: 0, height: 27 }
  })
  .add('null', Tasks.LogoView, {
    layout: { left: 78, width: 145, centerY: 0, height: 27 }
  });
pane.show(); // add a test to show the test pane
window.pane = pane ;

// ..........................................................
// Summary View Tests
// 
module("Tasks.LogoView tests", pane.standardSetup());


