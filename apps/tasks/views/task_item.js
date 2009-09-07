// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  Used as exampleView for task information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
  @author Joshua Holt
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
      context.addClass('task-item');
      switch(priority){
        case CoreTasks.TASK_PRIORITY_HIGH:
          context.addClass('task-priority-high');
          break;
        case CoreTasks.TASK_PRIORITY_MEDIUM:
          context.addClass('task-priority-medium');
          break;
        case CoreTasks.TASK_PRIORITY_LOW:
          context.addClass('task-priority-low');
          break;          
      }
      
      var status = content.get('status');
      switch(status){
        case CoreTasks.TASK_STATUS_PLANNED:
          context.addClass('task-status-planned');
          break;
        case CoreTasks.TASK_STATUS_ACTIVE:
          context.addClass('task-status-active');
          break;
        case CoreTasks.TASK_STATUS_DONE:
          context.addClass('task-status-done');
          break;          
        case CoreTasks.TASK_STATUS_RISKY:
          context.addClass('task-status-risky');
          break;          
      }
      
      var validation = content.get('validation');
      switch(validation){
        case CoreTasks.TASK_VALIDATION_UNTESTED:
          context.addClass('task-validation-untested');
          break;
        case CoreTasks.TASK_VALIDATION_PASSED:
          context.addClass('task-validation-passed');
          break;
        case CoreTasks.TASK_VALIDATION_FAILED:
          context.addClass('task-validation-failed');
          break;          
      }
      if (content.get('description')) {
        hasDescription = YES;
      }
      context = context.begin('div').addClass('sc-view').addClass('task-description');
      context = context.begin('img').attr({
        src: SC.BLANK_IMAGE_URL,
        title: "_DescriptionTooltip".loc(),
        alt: "_DescriptionTooltip".loc()
      }).addClass('description-editor');
      if (hasDescription) {
        context.addClass('task-has-description-icon-16');
      }else{
        context.addClass('task-no-description-icon-16');
      }
      context = context.end();
      context = context.end();
      
      var submitterUser = content.get('submitter');
      if (submitterUser) {
        var submitter = "_SubmitterHover".loc() + '%@ (%@)'.fmt(submitterUser.get('name'), submitterUser.get('loginName'));
        context.attr('title', submitter);
        context.attr('alt', submitter);
      }
    }
  }
  
});
