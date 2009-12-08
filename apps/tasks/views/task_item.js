// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks SCUI sc_static */

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
        
        layout: { width: 550, height: 230 },
        
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
              layout: { top: 10, left: 80, width: 175, height: 22 },
              objectsBinding: this._listUsers(),
              nameKey: 'displayName',
              valueKey: 'id',
              isEnabledBinding: 'CoreTasks.permissions.canEditTask',
              valueBinding: SC.binding('.content.submitterValue', this)
            }),

            SC.LabelView.design({
              layout: { top: 10, right: 190, height: 17, width: 80 },
              textAlign: SC.ALIGN_RIGHT,
              value: "_Assignee:".loc()
            }),
            SC.SelectFieldView.design({
              layout: { top: 10, right: 10, width: 175, height: 20 },
              objectsBinding: this._listUsers(),
              nameKey: 'displayName',
              valueKey: 'id',
              isEnabledBinding: 'CoreTasks.permissions.canEditTask',
              valueBinding: SC.binding('.content.assigneeValue', this)
            }),

            SC.LabelView.design({
              layout: { top: 47, left: 10, height: 17, width: 100 },
              value: "_Effort:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 47, left: 55, width: 80, height: 20 },
              isEnabledBinding: 'CoreTasks.permissions.canEditTask',
              valueBinding: SC.binding('.content.effortValue', this)
            }),
            SC.LabelView.design({
              layout: { top: 35, left: 145, height: 50, width: 125 },
              escapeHTML: NO,
              classNames: [ 'onscreen-help'],
              value: "_EffortOnscreenHelp".loc()
            }),
            
            SC.LabelView.design({
              layout: { top: 47, right: 190, height: 17, width: 80 },
              textAlign: SC.ALIGN_RIGHT,
              value: "_Project:".loc()
            }),
            SC.SelectFieldView.design({
              layout: { top: 47, right: 10, width: 175, height: 20 },
              objectsBinding: this._listProjects(),
              nameKey: 'displayName',
              valueKey: 'id',
              isEnabledBinding: 'CoreTasks.permissions.canEditTask',
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
              isEnabledBinding: 'CoreTasks.permissions.canEditTask',
              valueBinding: SC.binding('.content.description', this)
            })
            
          ]
        })
      });
      this._editorPane.popup(layer, SC.PICKER_POINTER);
    }
    else { // popup context menu
      var pane = SCUI.ContextMenuPane.create({
        contentView: SC.View.design({}),
        layout: { width: 170, height: 0 },
        escapeHTML: NO,
        itemTitleKey: 'title',
        itemIconKey: 'icon',
        itemIsEnabledKey: 'isEnabled',
        itemTargetKey: 'target',
        itemActionKey: 'action',
        itemSeparatorKey: 'isSeparator',
        items: this._buildContextMenu()        
      });
      pane.popup(this, event); // pass in the mouse event so the pane can figure out where to put itself
    }
    return NO;
  },
  
  _buildContextMenu: function() {
    
    var ret = [];
    ret.push({
      title: "_Add".loc(),
      icon: 'add-icon',
      isEnabled: CoreTasks.getPath('permissions.canAddTask'),
      target: 'Tasks',
      action: 'addTask'
    });
    ret.push({
      title: "_Duplicate".loc(),
      icon: 'task-duplicate-icon',
      isEnabled: CoreTasks.getPath('permissions.canAddTask'),
      target: 'Tasks',
      action: 'duplicateTask'
    });
    ret.push({
      title: "_Delete".loc(),
      icon: 'delete-icon',
      isEnabled: CoreTasks.getPath('permissions.canDeleteTask'),
      target: 'Tasks',
      action: 'deleteTask'
    });
    ret.push({
      isSeparator: YES
    });
    
    var status = this.get('content').get('developmentStatus');
    if(status !== CoreTasks.TASK_STATUS_PLANNED) {
      ret.push({
        title: '<span class=task-status-planned>' + CoreTasks.TASK_STATUS_PLANNED.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        target: 'Tasks.tasksController',
        action: 'setStatusPlanned'
      });
    }
    if(status !== CoreTasks.TASK_STATUS_ACTIVE) {
      ret.push({
        title: '<span class=task-status-active>' + CoreTasks.TASK_STATUS_ACTIVE.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        target: 'Tasks.tasksController',
        action: 'setStatusActive'
      });
    }
    if(status !== CoreTasks.TASK_STATUS_DONE) {
      ret.push({
        title: '<span class=task-status-done>' + CoreTasks.TASK_STATUS_DONE.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        target: 'Tasks.tasksController',
        action: 'setStatusDone'
      });
    }
    if(status !== CoreTasks.TASK_STATUS_RISKY) {
      ret.push({
        title: '<span class=task-status-risky>' + CoreTasks.TASK_STATUS_RISKY.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        target: 'Tasks.tasksController',
        action: 'setStatusRisky'
      });
    }
    ret.push({
      isSeparator: YES
    });
    
    if(status === CoreTasks.TASK_STATUS_DONE) {
      var validation = this.get('content').get('validation');
      if(validation !== CoreTasks.TASK_VALIDATION_UNTESTED) {
        ret.push({
          title: '<span class=task-validation-untested>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          target: 'Tasks.tasksController',
          action: 'setValidationUntested'
        });
      }
      if(validation !== CoreTasks.TASK_VALIDATION_PASSED) {
        ret.push({
          title: '<span class=task-validation-passed>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          target: 'Tasks.tasksController',
          action: 'setValidationPassed'
        });
      }
      if(validation !== CoreTasks.TASK_VALIDATION_FAILED) {
      ret.push({
          title: '<span class=task-validation-failed>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          target: 'Tasks.tasksController',
          action: 'setValidationFailed'
        });
      }
      ret.push({
        isSeparator: YES
      });
    }
    
    ret.push({
      title: "_CopyID/Name".loc(),
      icon: sc_static('blank'),
      isEnabled: YES,
      target: 'Tasks',
      action: 'copyTaskIDName'
    });
    ret.push({
      title: "_CopyLink".loc(),
      icon: sc_static('blank'),
      isEnabled: YES,
      target: 'Tasks',
      action: 'copyTaskLink'
    });
    return ret;
  },
  
  inlineEditorWillBeginEditing: function(inlineEditor) {
    if(!CoreTasks.getPath('permissions.canEditTask')) {
      console.log('Error: you do not have permission to edit a task');
      inlineEditor.discardEditing();
    }
  },
  
  render: function(context, firstTime) {
    
    sc_super();
    var content = this.get('content');
    if(!content) return;
    
    context.addClass((this.get('contentIndex') % 2 === 0)? 'even-item' : 'odd-item');
    
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
    
    var idTooltip = "_TaskIdTooltip".loc();
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
    context = context.begin('div').addClass('task-id').addClass(validationClass).
                text(displayId).attr('title', idTooltip).attr('alt', idTooltip).end();
      
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
      title: "_TaskEditorTooltip".loc(),
      alt: "_TaskEditorTooltip".loc()
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
      taskTooltip += ("_SubmitterTooltip".loc() + '%@ (%@)'.fmt(submitterUser.get('name'), submitterUser.get('loginName')));
    }
    if(content.get('displayEffort')) {
      if(taskTooltip !== '')  taskTooltip += '; ';
      taskTooltip += "_TaskEffortTooltip".loc();
    }
    if(taskTooltip !== '') {
      context.attr('title', taskTooltip);
      context.attr('alt', taskTooltip);
    }

  }
  
});
