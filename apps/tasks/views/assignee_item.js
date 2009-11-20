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
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(content) {
      
      context.addClass('assignee-item');
      
      var tasksCount = 0;
      var tasks = content.get('treeItemChildren');
      if (tasks) tasksCount = tasks.get('length');
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
      
      if(content.get('risky') === true) {
        context.begin('div').addClass('sc-view').addClass('assignee-red-flag').begin('img').attr({
          src: SC.BLANK_IMAGE_URL,
          title: "_RiskyTooltip".loc(),
          alt: "_RiskyTooltip".loc()
        }).addClass('red-flag-icon').end().end();
      }
      
      assigneeTooltip += (loadingTooltip + '_AssigneeEffortTooltip'.loc());
      context.attr('title', assigneeTooltip);
      context.attr('alt', assigneeTooltip);
      
    }
    sc_super();
  }
  
});