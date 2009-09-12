// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  Used as exampleView for project information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.ProjectItemView = SC.ListItemView.extend(
/** @scope Tasks.ProjectItemView.prototype */ {
  
  // FIXME: [SG] remove this after CollectionView localization is added back
  renderLabel: function(context, label) {
    context.push('<label>', label? label.loc() : '', '</label>') ;
  },

  render: function(context, firstTime) {

    var content = this.get('content');
    if(content) {

      var projectName = content.get('name');
      if (projectName === CoreTasks.ALL_TASKS_NAME || projectName === CoreTasks.UNALLOCATED_TASKS_NAME) context.addClass('reserved-project-item');
      else context.addClass('regular-project-item');

      var tasksCountTooltip = content.get('tasks').get('length') + "_Tasks".loc();
      context.attr('title', tasksCountTooltip);
      context.attr('alt', tasksCountTooltip);

    }
    sc_super();
  }
  
});
