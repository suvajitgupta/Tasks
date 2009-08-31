// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  Used as exampleView for task information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks._decriptionPaneTimer = null;

Tasks.TaskItemView = SC.ListItemView.extend(
/** @scope Tasks.TaskItemView.prototype */ {
  
  content: null,
  _descriptionPane: null,
  _decriptionPaneTimer: null,
  
  /** @private
    Remove the active class on mouseOut if mouse is down.
  */  
  mouseExited: function(evt) {
    if(Tasks._decriptionPaneTimer) {
      Tasks._decriptionPaneTimer.invalidate();
      Tasks._decriptionPaneTimer = null;
      if(this._descriptionPane) this._descriptionPane.remove();
    }
    return YES;
  },

  /** @private
    If mouse was down and we renter the button area, set the active state again.
  */  
  mouseEntered: function(evt) {
    Tasks._decriptionPaneTimer = SC.Timer.schedule({
      target: this,
      action: function() {
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
        this._descriptionPane.popup(layer, SC.PICKER_POINTER);
      },
      interval: 1000
    });
    return YES;
  },
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
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
      
    }

    sc_super();
  }
  
});
