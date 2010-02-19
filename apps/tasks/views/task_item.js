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
    
    // console.log('DEBUG: mouse down on task item: ' + this.getPath('content.name'));
    
    // Get selection to update before context menu uses selection
    SC.RunLoop.begin();
    var pv = this.parentView;
    pv.set('taskClickedOn', true);
    pv.mouseDown(event);
    SC.RunLoop.end();
    
    // See what user clicked on
    var classes = event.target.className;
    if (classes.match('task-editor') || classes.match('task-description') || classes.match('count') || classes.match('inner')) {
      var layer = this.get('layer');
      var that = this;
      this._editorPane = SC.PickerPane.create({
        
        layout: { width: 740, height: 300 },
        
        // Avoid popup panel coming up on other items while it is up already
        popup: function() {
          sc_super();
          Tasks.editorPoppedUp = true;
        },
        remove: function() {
          sc_super();
          Tasks.editorPoppedUp = false;
          that.get('content').setIfChanged('description', that._editorPane.getPath('contentView.childViews').objectAt(10).get('value'));
          if(Tasks.assignmentsRedrawNeeded) {
            Tasks.assignmentsController.showAssignments();
          }
          if(CoreTasks.get('autoSave')) Tasks.saveData();
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
              isEnabledBinding: 'Tasks.tasksController.isEditable',
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
              isEnabledBinding: 'Tasks.tasksController.isEditable',
              valueBinding: SC.binding('.content.assigneeValue', this)
            }),

            SC.LabelView.design({
              layout: { top: 47, left: 10, height: 17, width: 100 },
              value: "_Effort:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 47, left: 55, width: 80, height: 20 },
              isEnabledBinding: 'Tasks.tasksController.isEditable',
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
              isEnabledBinding: 'Tasks.tasksController.isReallocatable',
              valueBinding: SC.binding('.content.projectValue', this)
            }),

            SC.LabelView.design({
              layout: { top: 75, left: 10, height: 17, width: 100 },
              value: "_Description:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 98, left: 10, right: 10, bottom: 25 },
              hint: "_DescriptionHint".loc(),
              isTextArea: YES,
              isEnabled: YES,
              value: that.getPath('content.description')
            }),
            SC.LabelView.design({
              layout: { left:10, bottom: 5, height: 17, width: 250 },
              classNames: [ 'date-time'],
              textAlign: SC.ALIGN_LEFT,
              valueBinding: SC.binding('.content.displayCreatedAt', this)
            }),
            SC.LabelView.design({
              layout: { right:10, bottom: 5, height: 17, width: 250 },
              classNames: [ 'date-time'],
              textAlign: SC.ALIGN_RIGHT,
              valueBinding: SC.binding('.content.displayUpdatedAt', this)
            })
            
          ]
        })
      });
      this._editorPane.popup(layer, SC.PICKER_POINTER);
    }
    else { // popup context menu
      var pane = SCUI.ContextMenuPane.create({
        contentView: SC.View.design({}),
        layout: { width: 190, height: 0 },
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
    
    return NO; // so that drag-n-drop can work!
    
  },
  
  mouseUp: function(event){
    return sc_super();
  },
  
  _buildContextMenu: function() {
    
    var ret = [], needsSeparator = false;
    
    var sel = Tasks.tasksController.get('selection');
    var selectedTasksCount = sel? sel.get('length') : 0;
    if(selectedTasksCount === 1 && Tasks.tasksController.isAddable()) {
      needsSeparator = true;
      ret.push({
        title: "_Add".loc(),
        icon: 'add-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'addTask'
      });
      ret.push({
        title: "_Duplicate".loc(),
        icon: 'task-duplicate-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'duplicateTask'
      });
    }
    
    if(selectedTasksCount > 0 && Tasks.tasksController.isDeletable()) {
      needsSeparator = true;
      ret.push({
        title: "_Delete".loc(),
        icon: 'delete-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'deleteTask'
      });
    }
    
    if (needsSeparator) {
        ret.push({
        isSeparator: YES
      });
    }
    
    needsSeparator = false;
    if(Tasks.tasksController.isEditable()) {
      needsSeparator = true;
      if(Tasks.softwareMode) {
        var type = Tasks.tasksController.get('type');
        if(type !== CoreTasks.TASK_TYPE_FEATURE) {
          ret.push({
            title: '<span class=task-type-feature>' + CoreTasks.TASK_TYPE_FEATURE.loc() + '</span>',
            icon: 'task-icon-feature',
            isEnabled: YES,
            target: 'Tasks.tasksController',
            action: 'setTypeFeature'
          });
        }
        if(type !== CoreTasks.TASK_TYPE_BUG) {
          ret.push({
            title: '<span class=task-type-bug>' + CoreTasks.TASK_TYPE_BUG.loc() + '</span>',
            icon: 'task-icon-bug',
            isEnabled: YES,
            target: 'Tasks.tasksController',
            action: 'setTypeBug'
          });
        }
        if(type !== CoreTasks.TASK_TYPE_OTHER) {
          ret.push({
            title: '<span class=task-type-other>' + CoreTasks.TASK_TYPE_OTHER.loc() + '</span>',
            icon: 'task-icon-other',
            isEnabled: YES,
            target: 'Tasks.tasksController',
            action: 'setTypeOther'
          });
        }
        ret.push({
          isSeparator: YES
        });
      }
      
      var priority = Tasks.tasksController.get('priority');
      if(priority !== CoreTasks.TASK_PRIORITY_HIGH) {
        ret.push({
          title: '<span class=task-priority-high>' + CoreTasks.TASK_PRIORITY_HIGH.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          target: 'Tasks.tasksController',
          action: 'setPriorityHigh'
        });
      }
      if(priority !== CoreTasks.TASK_PRIORITY_MEDIUM) {
        ret.push({
          title: '<span class=task-priority-medium>' + CoreTasks.TASK_PRIORITY_MEDIUM.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          target: 'Tasks.tasksController',
          action: 'setPriorityMedium'
        });
      }
      if(priority !== CoreTasks.TASK_PRIORITY_LOW) {
        ret.push({
          title: '<span class=task-priority-low>' + CoreTasks.TASK_PRIORITY_LOW.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          target: 'Tasks.tasksController',
          action: 'setPriorityLow'
        });
      }
      ret.push({
        isSeparator: YES
      });

      var developmentStatus = Tasks.tasksController.get('developmentStatusWithValidation');
      if(developmentStatus !== CoreTasks.TASK_STATUS_PLANNED) {
        ret.push({
          title: '<span class=task-status-planned>' + CoreTasks.TASK_STATUS_PLANNED.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          target: 'Tasks.tasksController',
          action: 'setDevelopmentStatusPlanned'
        });
      }
      if(developmentStatus !== CoreTasks.TASK_STATUS_ACTIVE) {
        ret.push({
          title: '<span class=task-status-active>' + CoreTasks.TASK_STATUS_ACTIVE.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          target: 'Tasks.tasksController',
          action: 'setDevelopmentStatusActive'
        });
      }
      if(developmentStatus !== CoreTasks.TASK_STATUS_DONE) {
        ret.push({
          title: '<span class=task-status-done>' + CoreTasks.TASK_STATUS_DONE.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          target: 'Tasks.tasksController',
          action: 'setDevelopmentStatusDone'
        });
      }
      if(developmentStatus !== CoreTasks.TASK_STATUS_RISKY) {
        ret.push({
          title: '<span class=task-status-risky>' + CoreTasks.TASK_STATUS_RISKY.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          target: 'Tasks.tasksController',
          action: 'setDevelopmentStatusRisky'
        });
      }

      if(Tasks.softwareMode && developmentStatus === CoreTasks.TASK_STATUS_DONE) {
        ret.push({
          isSeparator: YES
        });
        var validation = Tasks.tasksController.get('validation');
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
      }
    }
    
    if(selectedTasksCount === 1) {
      if(needsSeparator) {
        ret.push({
          isSeparator: YES
        });
      }
      ret.push({
        title: "_CopyID/Name".loc(),
        icon: 'task-id-name-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'copyTaskIDName'
      });
      ret.push({
        title: "_CopyLinkLocation".loc(),
        icon: 'task-link-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'copyTaskLink'
      });
    }
  
    return ret;
    
  },
  
  inlineEditorWillBeginEditing: function(inlineEditor) {
    if(!Tasks.tasksController.isEditable()) {
      console.warn('You do not have permission to edit tasks here');
      inlineEditor.discardEditing();
    }
  },
  
  inlineEditorDidEndEditing: function(inlineEditor, finalValue) {
    sc_super();
    if(CoreTasks.get('autoSave')) Tasks.saveData();
  },
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(!content) return;
    // console.log('DEBUG-ON: Task render(' + firstTime + '): ' + content.get('displayName'));
    sc_super();
    
    // Put a dot before tasks that were created or updated recently
    if(content.get('isRecentlyUpdated')) {
      context = context.begin('img').addClass('recently-updated').attr({
        src: SC.BLANK_IMAGE_URL,
        title: "_RecentlyUpdatedTooltip".loc(),
        alt: "_RecentlyUpdatedTooltip".loc()
      }).end();
    }

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
      
    switch(content.get('developmentStatus')){
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
    var taskTooltip = (hasDescription? "_Has".loc() : ("_No".loc() + ' ')) + "_description".loc();
    var submitterUser = content.get('submitter');
    if (submitterUser) {
      taskTooltip += ('; ' + "_SubmitterTooltip".loc() + '%@ (%@)'.fmt(submitterUser.get('name'), submitterUser.get('loginName')));
    }
    taskTooltip += "_ClickToEdit".loc();
    context = context.begin('div').addClass('sc-view').addClass('task-description');
    context = context.begin('img').attr({
      src: SC.BLANK_IMAGE_URL,
      title: taskTooltip,
      alt: taskTooltip
    }).addClass('task-editor');
    context.addClass(hasDescription? 'task-icon-has-description' : 'task-icon-no-description');
    context = context.end();
    context = context.end();

  },

  renderCount: function(context, count) {
    if(count) {
      var effortTooltip = "_TaskEffortTooltip".loc() + "_ClickToEdit".loc();
      context.push('<span class="count" title="' + effortTooltip + '">');
      context.push('<span class="inner">').push(count).push('</span></span>');
    }
  },
  
  contentPropertyDidChange: function() {
    if(Tasks.editorPoppedUp) return;
    sc_super();
  }  
  
});
