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
    context.push('<center>' + "_Welcome".loc() + '<br>' + CoreTasks.getPath('user.loginName') + ' !</center>');
    var name = CoreTasks.getPath('user.name');
    context.attr('title', name);
    context.attr('alt', name);
  }
  
});
