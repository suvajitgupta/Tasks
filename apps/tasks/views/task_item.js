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
  
  // FIXME: [SG] Beta: decide how to handle null value of task.submitterId/assigneeId/projectId
  _listUsers: function() {
    return SC.Binding.transform(function(value, binding) {
       var ret = value.toArray();
       ret.push({ id: '0', displayName: "_Unassigned".loc() });
       return ret;
    }).from('Tasks.usersController.content');
  },

  _listProjects: function() {
    return SC.Binding.transform(function(value, binding) {
      
       var ret = value.toArray();
       
       var idx = ret.indexOf(CoreTasks.get('allTasksProject'));
       if(idx !== -1) ret.splice(idx, 1);
       idx = ret.indexOf(CoreTasks.get('unallocatedTasksProject'));
       if(idx !== -1) ret.splice(idx, 1);
       
       ret.push({ id: '0', displayName: "_Unallocated".loc() });
       return ret;
       
    }).from('Tasks.projectsController.content');
  },

  /** @private
    If mouse was down over Description Icon open the editor.
  */  
  mouseDown: function(event) {
    var classes = event.target.className;
    if (classes.match('task-editor') || classes.match('task-description') || classes.match('count') || classes.match('inner')) {
      var layer = this.get('layer');
      var that = this;
      this._editorPane = SC.PickerPane.create({
        
        layout: { width: 500, height: 200 },
        
        // Avoid popup panel coming up on other items while it is up already
        poppedUp: false,
        popup: function() {
          if(this.poppedUp) return;
          this.poppedUp = true;
          sc_super();
        },
        remove: function() {
          this.poppedUp = false;
          sc_super();
        },
        
        didBecomeKeyPaneFrom: function(pane) {
          sc_super();
          var content = that.get('content');
          content.beginEditing();
          content.beginPropertyChanges();
        },
        didLoseKeyPaneTo: function(pane) {
          sc_super();
          var content = that.get('content');
          content.endEditing();
          content.endPropertyChanges();
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
              valueBinding: SC.binding('.content.submitterValue', this)
            }),

            SC.LabelView.design({
              layout: { top: 10, right: 165, height: 17, width: 80 },
              textAlign: SC.ALIGN_RIGHT,
              value: "_Assignee:".loc()
            }),
            SC.SelectFieldView.design({
              layout: { top: 10, right: 10, width: 150, height: 20 },
              objectsBinding: this._listUsers(),
              nameKey: 'displayName',
              valueKey: 'id',
              valueBinding: SC.binding('.content.assigneeValue', this)
            }),

            SC.LabelView.design({
              layout: { top: 47, left: 10, height: 17, width: 100 },
              value: "_Effort:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 47, left: 55, width: 80, height: 16 },
              valueBinding: SC.binding('.content.effortValue', this)
            }),
            SC.LabelView.design({
              layout: { top: 35, left: 145, height: 50, width: 125 },
              escapeHTML: NO,
              classNames: [ 'onscreen-help'],
              value: "_EffortOnscreenHelp".loc()
            }),
            
            SC.LabelView.design({
              layout: { top: 47, right: 165, height: 17, width: 80 },
              textAlign: SC.ALIGN_RIGHT,
              value: "_Project:".loc()
            }),
            SC.SelectFieldView.design({
              layout: { top: 47, right: 10, width: 150, height: 20 },
              objectsBinding: this._listProjects(),
              nameKey: 'displayName',
              valueKey: 'id',
              valueBinding: SC.binding('.content.projectValue', this)
            }),

            SC.LabelView.design({
              layout: { top: 75, left: 10, height: 17, width: 100 },
              value: "_Description:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 98, left: 10, right: 10, bottom: 10 },
              hint: "_DescriptionHint".loc(),
              isTextArea: YES,
              valueBinding: SC.binding('.content.description', this)
            })
            
          ]
        })
      });
      this._editorPane.popup(layer, SC.PICKER_POINTER);
    }
    return NO;
  },
  
  render: function(context, firstTime) {
    
    sc_super();
    var content = this.get('content');
    if(!content) return;
    
    context.addClass((this.get('contentIndex') % 2 === 0)? 'even' : 'odd');
    
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
    var displayId = content.get('displayId');
    context = context.begin('div').addClass('task-id').addClass(validationClass).text(displayId).attr('title', idTooltip).attr('alt', idTooltip).end();
      
    var status = content.get('developmentStatus');
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

    var taskTooltip = '';
    var submitterUser = content.get('submitter');
    if (submitterUser) {
      taskTooltip += ("_SubmitterTooltip".loc() + '%@ (%@)'.fmt(submitterUser.get('name'), submitterUser.get('loginName')) + '; ');
    }
    taskTooltip += "_TaskEffortTooltip".loc();
    context.attr('title', taskTooltip);
    context.attr('alt', taskTooltip);

  }
  
});
