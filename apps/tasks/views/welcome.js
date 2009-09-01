// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  A welcome message for the currently logged on user.
  
  @extends SC.LabelView
  @author Suvajit Gupta
*/

Tasks.WelcomeView = SC.LabelView.extend(
/** @scope Tasks.WelcomeView.prototype */ {
  
  render: function(context, firstTime) {
    context.push("<center>Welcome".loc() + '<br>' + CoreTasks.getPath('user.loginName') + ' !</center>');
  }
  
});
