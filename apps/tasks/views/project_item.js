// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks sc_require*/
sc_require('mixins/localized_label');

/** 

  Used as exampleView for project information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.ProjectItemView = SC.ListItemView.extend(Tasks.LocalizedLabel,
/** @scope Tasks.ProjectItemView.prototype */ {
  
  inlineEditorWillBeginEditing: function(inlineEditor) {
    var projectName = inlineEditor.value;
    if (projectName === CoreTasks.ALL_TASKS_NAME.loc() || projectName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) inlineEditor.discardEditing();
  },
  
  render: function(context, firstTime) {
    var content = this.get('content');
    if(content) {
      var projectName = content.get('name');
      if (projectName === CoreTasks.ALL_TASKS_NAME.loc() || projectName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) context.addClass('reserved-project-item');
      else context.addClass('regular-project-item');

      var tasks = content.get('tasks');
      if(tasks) {
        var projectTooltip = "_Has".loc() + tasks.get('length') + "_Tasks".loc();
        if(content.get('displayTimeLeft')) projectTooltip += ('; ' + "_ProjectTimeLeftTooltip".loc());
        context.attr('title', projectTooltip);
        context.attr('alt', projectTooltip);
      }
    }
    sc_super();
  }
  
});
