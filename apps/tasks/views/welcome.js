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
    context.push("_Welcome".loc() + CoreTasks.getPath('user.name') + ' (' + CoreTasks.getPath('user.loginName') + ')');
    var loginTime = "_LoginSince".loc() + CoreTasks.get('loginTime').format('hh:mm:ss a MMM dd, yyyy');
    context.attr('title', loginTime);
    context.attr('alt', loginTime);
  }
  
});
