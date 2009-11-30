// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks sc_require */
sc_require('mixins/localized_label');

/** 

  Used as groupExampleView for assignee information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.AssigneeItemView = SC.ListItemView.extend(Tasks.LocalizedLabel,
/** @scope Tasks.AssigneeItemView.prototype */ {
  
  mouseDown: function(event) {
    if(Tasks.assignmentsController.get('displayMode') === Tasks.DISPLAY_MODE_TEAM) {
      var loginNameMatches = this.getPath('content.displayName').match(/\((.+)\)/);
      Tasks.assignmentsController.set('assigneeSelection', loginNameMatches[1]);
    }
    else sc_super();
  },
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(content) {
      
      context.addClass('assignee-item');
      
      var tasksCount = content.get('tasksCount');
      var assigneeTooltip = "_Has".loc() + tasksCount + "_Tasks".loc();
      
      var loadingTooltip = '';
      var loading = content.get('loading');
      if(loading) {
        if(loading === CoreTasks.USER_NOT_LOADED) {
          loadingTooltip = "_AssigneeNotLoaded".loc();
          context.addClass('assignee-not-loaded');
        }
        else if(loading === CoreTasks.USER_UNDER_LOADED) {
          loadingTooltip = "_AssigneeUnderLoaded".loc();
          context.addClass('assignee-under-loaded');
        }
        else if(loading === CoreTasks.USER_PROPERLY_LOADED) {
          loadingTooltip = "_AssigneeProperlyLoaded".loc();
          context.addClass('assignee-properly-loaded');
        }
        else if(loading === CoreTasks.USER_OVER_LOADED) {
          loadingTooltip = "_AssigneeOverloaded".loc();
          context.addClass('assignee-over-loaded');
        }
      }
      
      if (Tasks.assignmentsController.get('displayMode') === Tasks.DISPLAY_MODE_TEAM) {
        var riskyTasksCount = content.get('riskyTasksCount');
        var failedTasksCount = content.get('failedTasksCount');
        if(riskyTasksCount > 0 || failedTasksCount > 0) {
          var riskyTooltip = "_Has".loc() + riskyTasksCount + ' ' + "_Risky".loc() +
                             ' & ' + failedTasksCount + ' ' + "_Failed".loc() + "_Tasks".loc();
          context.begin('div').addClass('sc-view').addClass('assignee-red-flag').begin('img').attr({
            src: SC.BLANK_IMAGE_URL,
            title: riskyTooltip,
            alt: riskyTooltip
          }).addClass('red-flag-icon').end().end();
        }
      }
      
      assigneeTooltip += (loadingTooltip + '_AssigneeEffortTooltip'.loc());
      context.attr('title', assigneeTooltip);
      context.attr('alt', assigneeTooltip);
      
    }
    sc_super();
  }
  
});