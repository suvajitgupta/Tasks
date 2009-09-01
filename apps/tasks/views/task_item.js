// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  Used as exampleView for task information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.TaskItemView = SC.ListItemView.extend(
/** @scope Tasks.TaskItemView.prototype */ {
  
  content: null,
  _descriptionPane: null,

  /** @private
    If mouse was down over Description Icon open the editor.
  */  
  mouseDown: function(evt) {
    var clsNames = evt.target.className.split(' ');
    if (clsNames.length > 0 && clsNames[0] === 'description-editor') {
      var layer = this.get('layer');
      this._descriptionPane = SC.PickerPane.create({
        layout: { width: 500, height: 200 },
        contentView: SC.View.design({
          layout: { left: 0, right: 0, top: 0, bottom: 0},
          childViews: [
            SC.LabelView.design({
              layout: { top: 2, height: 17, left: 2, width: 100 },
              value: "_Description:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 24, left: 5, right: 5, bottom: 5 },
              isTextArea: YES,
              valueBinding: SC.binding('.content.description', this)
            })
          ]
        })
      });
      this._descriptionPane.popup(evt.target.parentNode, SC.PICKER_POINTER);
    }
    return NO;
  },
  
  render: function(context, firstTime) {
    sc_super();
    var content = this.get('content');
    var hasDescription = NO;
    if(content && content.get('name')){ // a task node, not an assignee node
      
      var priority = content.get('priority');
      switch(priority){
        case CoreTasks.TASK_PRIORITY_HIGH:
          context.addClass('task-bg-mid');
          context.addClass('tasks-priority-high');
          break;
        case CoreTasks.TASK_PRIORITY_MEDIUM:
          context.addClass('task-bg-mid');
          context.addClass('tasks-priority-medium');
          break;
        case CoreTasks.TASK_PRIORITY_LOW:
          context.addClass('task-bg-mid');
          context.addClass('tasks-priority-low');
          break;          
      }
      
      var status = content.get('status');
      switch(status){
        case CoreTasks.TASK_STATUS_PLANNED:
          context.addClass('tasks-status-planned');
          break;
        case CoreTasks.TASK_STATUS_ACTIVE:
          context.addClass('tasks-status-active');
          break;
        case CoreTasks.TASK_STATUS_DONE:
          context.addClass('tasks-status-done');
          break;          
        case CoreTasks.TASK_STATUS_RISKY:
          context.addClass('tasks-status-risky');
          break;          
      }
      
      var validation = content.get('validation');
      switch(validation){
        case CoreTasks.TASK_VALIDATION_UNTESTED:
          context.addClass('tasks-validation-untested');
          break;
        case CoreTasks.TASK_VALIDATION_PASSED:
          context.addClass('tasks-validation-passed');
          break;
        case CoreTasks.TASK_VALIDATION_FAILED:
          context.addClass('tasks-validation-failed');
          break;          
      }
      if (content.get('description')) {
        hasDescription = YES;
      }
      context = context.begin('div').addClass('sc-view').addClass('task-description');
      context = context.begin('img').attr({
        src: SC.BLANK_IMAGE_URL,
        title: "_edit description".loc(),
        alt: ''
      }).addClass('description-editor');
      if (hasDescription) {
        context.removeClass('sc-icon-document-24');
        context.addClass('task-has-description-icon-24');
      }else{
        context.removeClass('task-has-description-icon-24');
        context.addClass('sc-icon-document-24');
      }
      context = context.end();
      context = context.end();
    }
  }
  
});
