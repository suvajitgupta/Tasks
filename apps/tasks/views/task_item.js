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
  
  _listUsers: function() {
    return SC.Binding.transform(function(value, binding) {
       return value.toArray();
    }).from('Tasks.usersController.content');
  },

  /** @private
    If mouse was down over Description Icon open the editor.
  */  
  mouseDown: function(evt) {
    var clsNames = evt.target.className.split(' ');
    if (clsNames.length > 0 && clsNames[0] === 'task-editor') {
      var layer = this.get('layer');
      var that = this;
      this._editorPane = SC.PickerPane.create({
        
        layout: { width: 500, height: 200 },
        
        poppedUp: false,
        // TODO: [JH2] make the begin/end property changes work
        popup: function() {
          if(this.poppedUp) return;
          this.poppedUp = true;
          sc_super();
          that.get('content').beginPropertyChanges();
        },
        remove: function() {
          this.poppedUp = false;
          that.get('content').endPropertyChanges();
          sc_super();
        },
        
        contentView: SC.View.design({
          layout: { left: 0, right: 0, top: 0, bottom: 0},
          childViews: [
          
            SC.LabelView.design({
              layout: { top: 10, left: 10, height: 17, width: 80 },
              value: "_Submitter:".loc()
            }),
            SC.SelectFieldView.design({
              layout: { top: 10, left: 80, width: 150, height: 22 },
              objectsBinding: this._listUsers(),
              nameKey: 'displayName',
              valueKey: 'id',
              valueBinding: SC.binding('.content.submitterID', this)
            }),

            SC.LabelView.design({
              layout: { top: 10, right: 145, height: 17, width: 80 },
              value: "_Assignee:".loc()
            }),
            SC.SelectFieldView.design({
              layout: { top: 10, right: 10, width: 150, height: 20 },
              objectsBinding: this._listUsers(),
              nameKey: 'displayName',
              valueKey: 'id',
              valueBinding: SC.binding('.content.assigneeID', this)
            }),

            SC.LabelView.design({
              layout: { top: 47, left: 10, height: 17, width: 100 },
              value: "_Effort:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 47, left: 55, width: 80, height: 16 },
              valueBinding: SC.binding('.content.effort', this)
              // TODO: [SG] only allow valid values for effort
            }),
            SC.LabelView.design({
              layout: { top: 47, left: 145, height: 17, width: 30 },
              value: "_Days".loc()
            }),
            SC.LabelView.design({
              layout: { top: 45, left: 190, height: 30, right: 10 },
              classNames: [ 'onscreen-help'],
              value: "_EffortOnscreenHelp".loc()
            }),

            SC.LabelView.design({
              layout: { top: 75, left: 10, height: 17, width: 100 },
              value: "_Description:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 98, left: 10, right: 10, bottom: 10 },
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
    if(!content) return;
    
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
    
    var idTooltip = "_IdTooltip".loc();
    var validationClass = null;
    var validation = content.get('validation');
    switch(validation){
      case CoreTasks.TASK_VALIDATION_UNTESTED:
        validationClass = 'task-validation-untested';
        break;
      case CoreTasks.TASK_VALIDATION_PASSED:
        validationClass = 'task-validation-passed';
        break;
      case CoreTasks.TASK_VALIDATION_FAILED:
        validationClass = 'task-validation-failed';
        break;          
    }
    context = context.begin('div').addClass('task-id').addClass(validationClass).text(content.get('id')).attr('title', idTooltip).attr('alt', idTooltip).end();
      
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
    
    var hasDescription = NO;
    if (content.get('description')) hasDescription = YES;
    context = context.begin('div').addClass('sc-view').addClass('task-description');
    context = context.begin('img').attr({
      src: SC.BLANK_IMAGE_URL,
      title: "_EditorTooltip".loc(),
      alt: "_EditorTooltip".loc()
    }).addClass('task-editor');
    if (hasDescription) {
      context.addClass('task-icon-has-description');
    } else {
      context.addClass('task-icon-no-description');
    }
    context = context.end();
    context = context.end();

    var taskTooltip = "_TaskTooltip".loc();
    var submitterUser = content.get('submitter');
    if (submitterUser) {
      taskTooltip += ("_SubmitterTooltip".loc() + '%@ (%@)'.fmt(submitterUser.get('name'), submitterUser.get('loginName')));
    }
    context.attr('title', taskTooltip);
    context.attr('alt', taskTooltip);

  }
  
});
