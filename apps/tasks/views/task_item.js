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
  _editorPane: null,

  /** @private
    If mouse was down over Description Icon open the editor.
  */  
  mouseDown: function(evt) {
    var clsNames = evt.target.className.split(' ');
    if (clsNames.length > 0 && clsNames[0] === 'task-editor') {
      var layer = this.get('layer');
      this._editorPane = SC.PickerPane.create({
        
        layout: { width: 500, height: 150 },
        contentView: SC.View.design({
          layout: { left: 0, right: 0, top: 0, bottom: 0},
          childViews: [
          
            SC.LabelView.design({
              layout: { top: 10, left: 10, height: 17, width: 80 },
              value: "_Submitter:".loc()
            }),
            SC.SelectFieldView.design({
              layout: { top: 10, left: 80, width: 150, height: 22 },
              objectsBinding: SC.Binding.transform(function(value, binding) {
                 return value.toArray();
              }).from('Tasks.usersController.content'),
              nameKey: 'displayName',
              valueKey: 'id',
              valueBinding: SC.binding('.content.submitterID',this)
            }),

            SC.LabelView.design({
              layout: { top: 10, right: 145, height: 17, width: 80 },
              value: "_Assignee:".loc()
            }),
            SC.SelectFieldView.design({
              layout: { top: 10, right: 10, width: 150, height: 20 },
              objectsBinding: SC.Binding.transform(function(value, binding) {
                 return value.toArray();
              }).from('Tasks.usersController.content'),
              nameKey: 'displayName',
              valueKey: 'id',
              valueBinding: SC.binding('.content.assigneeID',this)
            }),

            SC.LabelView.design({
              layout: { top: 42, left: 10, height: 17, width: 100 },
              value: "_Description:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 65, left: 10, right: 10, bottom: 10 },
              isTextArea: YES,
              valueBinding: SC.binding('.content.description', this)
            })
            
          ]
        })
      });
      this._editorPane.popup(evt.target.parentNode, SC.PICKER_POINTER);
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
        title: "_EditorTooltip".loc(),
        alt: "_EditorTooltip".loc()
      }).addClass('task-editor');
      if (hasDescription) {
        context.addClass('task-icon-with-description');
      }else{
        context.addClass('task-icon-no-description');
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
