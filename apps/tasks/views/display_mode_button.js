// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  Tasks display mode button view.
  
  @extends SC.View
  @author Suvajit Gupta
*/
Tasks.DisplayModeButtonView = SC.ButtonView.extend({
  classNames: ['dark'],
  titleMinWidth: 0,
  toolTip: "_DisplayModeTooltip".loc(),
  isEnabledBinding: SC.Binding.not('Tasks.mainPageHelper*panelOpen'),
  titleBinding: SC.Binding.transform(function(value, binding) {
                                       return value? "_TEAM".loc() : "_TASKS".loc();
                                     }).from('Tasks.assignmentsController*displayMode'),
  action: function() { // toggle display mode
    Tasks.assignmentsController.set('displayMode', !Tasks.assignmentsController.get('displayMode'));
  }
})
