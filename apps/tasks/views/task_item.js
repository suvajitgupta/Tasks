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
  displayProperties: 'showHover'.w(),
  
  /** @private
    Add explicit hover class - using this to avoid problems on iPad.
  */  
  mouseEntered: function(event) {
    this.set('showHover', YES);
    return YES;
  },

  /** @private
    Remove explicit hover class - using this to avoid problems on iPad.
  */  
  mouseExited: function(event) {
    this.set('showHover', NO);
    return YES;
  },

  /** @private
    If user holds touch for a bit on iPad, start the task editor.
  */  
  _timer: null,
  _startEditing: function() {
    if(this._timer) {
      this._timer.invalidate();
      this._timer = null;
    }
    Tasks.getPath('mainPage.taskEditor').popup(this.get('content'));
  },
  touchStart: function(event) {
    // console.log('DEBUG: touch start on task item: ' + this.getPath('content.name'));
    Tasks.tasksController.selectObject(this.get('content'));
    if (this._timer) this._timer.invalidate();
    this._timer = this.invokeLater(this._startEditing, 500);
    this.mouseDown(event);
    return YES;
  },
  touchEnd: function(event) {
    // console.log('DEBUG: touch end on task item: ' + this.getPath('content.name'));
    this._timer.invalidate();
    this._timer = null;
    return YES;
  },
  
  /** @private
    When mouse clicked on appropirate parts launch editor.
  */  
  mouseDown: function(event) {
    
    // console.log('DEBUG: mouse down on task item: ' + this.getPath('content.name'));
    
    // See what user clicked on an popup editor accordingly
    var target = event.target;
    if (target.nodeType === 3) target = target.parentNode; // for text nodes on iPad
    var classes = target.className;
    // See if left clicked on task id, hover pencil, or task icon
    // console.log('DEBUG: classes = "' + classes + '"');
    if ((!event.which || event.which === 1) &&
        (classes.match(/task-id/) || classes.match(/task-margin/) || classes.match(/task-icon/))) {
      this._startEditing();
    }
    
    return NO; // so that drag-n-drop can work!
    
  },
  
  inlineEditorWillBeginEditing: function(inlineEditor) {
    if(Tasks.editorPoppedUp === Tasks.TASK_EDITOR) {
      inlineEditor.discardEditing();
    }
    else if(!Tasks.tasksController.isEditable()) {
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
    
    // console.log('DEBUG: Task render(' + firstTime + '): ' + content.get('displayName'));
    sc_super();
    
    // Put a dot before tasks that were created or updated recently
    if(content.get('isRecentlyUpdated')) {
      context = context.begin('div').addClass('recently-updated').attr({
        title: "_RecentlyUpdatedTooltip".loc(),
        alt: "_RecentlyUpdatedTooltip".loc()
      }).end();
    }

    var priority = content.get('priority');
    context.addClass('task-item');
    if(Tasks.softwareMode) context.addClass('task-type-displayed');
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
    if (this.get('showHover')) {
      context.addClass('hover'); 
    } else {
      context.removeClass('hover');
    }
    
    var editingTooltip = "_ClickToViewEditDetailsTooltip".loc();
    var idTooltip = "_TaskIdTooltip".loc();
    if(Tasks.softwareMode) idTooltip += "_TaskValidationTooltip".loc();
    var submitterUser = content.get('submitter');
    if (submitterUser) idTooltip += ("_SubmitterTooltip".loc() + '%@ (%@)'.fmt(submitterUser.get('name'), submitterUser.get('loginName')));
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
    var taskIdClass = 'task-id';
    if(CoreTasks.isCurrentUserWatchingTask(content) === CoreTasks.TASK_WATCH_ON) taskIdClass += ' watched-task';
    context = context.begin('div').addClass('task-margin').attr('title', editingTooltip).attr('alt', editingTooltip).
                begin('div').addClass(taskIdClass).addClass(validationClass).
                text(displayId).attr('title', idTooltip).attr('alt', idTooltip).end().end();
      
    switch(content.get('developmentStatus')){
      case CoreTasks.STATUS_PLANNED:
        context.addClass('status-planned');
        break;
      case CoreTasks.STATUS_ACTIVE:
        context.addClass('status-active');
        break;
      case CoreTasks.STATUS_DONE:
        context.addClass('status-done');
        break;          
      case CoreTasks.STATUS_RISKY:
        context.addClass('status-risky');
        break;          
    }
    
    // Indicate which items have a description
    var description = SC.RenderContext.escapeHTML(content.get('description'));
    if(description) {
      description = description.replace(/\"/g, '\'');
      context = context.begin('div').addClass('description-icon')
                  .attr({'title': description,'alt': description}).end();
    }
    
  },

  renderIcon: function(context, icon){
    if(!SC.none(icon)) {
      var content = this.get('content');
      var taskTooltip = "_Type".loc() + ' ' + content.get('type').loc();
      context.begin('img').addClass('icon').addClass(icon).attr('src', SC.BLANK_IMAGE_URL)
            .attr('title', taskTooltip).attr('alt', taskTooltip).end();
    }
  },
  
  renderCount: function(context, count) {
    var content = this.get('content');
    if(content && count) {
      var status = content.get('developmentStatus'), doneEffortRange = false;
      if(status === CoreTasks.STATUS_DONE && count.match(/\-/)) doneEffortRange = true;
  
      var effortTooltip = "_TaskEffortTooltip".loc() + (doneEffortRange? "_DoneEffortRangeWarning".loc() : '');
      context.push('<span class="count' + (doneEffortRange? ' doneEffortRangeWarning' : '') + '" title="' + effortTooltip + '">');
      context.push('<span class="inner">').push(count).push('</span></span>');
    }
  },
  
  contentPropertyDidChange: function() {
    if(Tasks.editorPoppedUp === Tasks.TASK_EDITOR) return;
    sc_super();
  }  
  
});

Tasks.TaskItemView.mixin(/** @scope Tasks.TaskItemView */ {
  
  buildContextMenu: function() {
    
    var ret = [], needsSeparator = false;
    
    var sel = Tasks.tasksController.get('selection');
    var selectedTasksCount = sel? sel.get('length') : 0;
    
    if(Tasks.tasksController.get('isAddable')) {
      needsSeparator = true;
      ret.push({
        title: "_Add".loc(),
        icon: 'add-icon',
        isEnabled: YES,
        action: 'addTask'
      });
    }
    
    if(selectedTasksCount === 1 && Tasks.tasksController.get('isAddable')) {
      needsSeparator = true;
      ret.push({
        title: "_Duplicate".loc(),
        icon: 'duplicate-icon',
        isEnabled: YES,
        action: 'duplicateTask'
      });
    }
    
    if(Tasks.tasksController.get('isDeletable')) {
      needsSeparator = true;
      ret.push({
        title: "_Delete".loc(),
        icon: 'delete-icon',
        isEnabled: YES,
        action: 'deleteTask'
      });
    }
    
    if(Tasks.tasksController.isEditable()) {
      if(needsSeparator) {
        ret.push({
          isSeparator: YES
        });
      }
      needsSeparator = true;
      if(Tasks.softwareMode) {
        var type = Tasks.tasksController.get('type');
        ret.push({
          title: CoreTasks.TASK_TYPE_FEATURE.loc(),
          icon: 'task-icon-feature',
          isEnabled: YES,
          checkbox: type === CoreTasks.TASK_TYPE_FEATURE,
          action: 'setTypeFeature'
        });
        ret.push({
          title: CoreTasks.TASK_TYPE_BUG.loc(),
          icon: 'task-icon-bug',
          isEnabled: YES,
          checkbox: type === CoreTasks.TASK_TYPE_BUG,
          action: 'setTypeBug'
        });
        ret.push({
          title: CoreTasks.TASK_TYPE_OTHER.loc(),
          icon: 'task-icon-other',
          isEnabled: YES,
          checkbox: type === CoreTasks.TASK_TYPE_OTHER,
          action: 'setTypeOther'
        });
        ret.push({
          isSeparator: YES
        });
      }
      
      var priority = Tasks.tasksController.get('priority');
      ret.push({
        title: '<span class=task-priority-high>' + CoreTasks.TASK_PRIORITY_HIGH.loc() + '</span>',
        icon: 'no-icon',
        isEnabled: YES,
        checkbox: priority === CoreTasks.TASK_PRIORITY_HIGH,
        action: 'setPriorityHigh'
      });
      ret.push({
        title: '<span class=task-priority-medium>' + CoreTasks.TASK_PRIORITY_MEDIUM.loc() + '</span>',
        icon: 'no-icon',
        isEnabled: YES,
        checkbox: priority === CoreTasks.TASK_PRIORITY_MEDIUM,
        action: 'setPriorityMedium'
      });
      ret.push({
        title: '<span class=task-priority-low>' + CoreTasks.TASK_PRIORITY_LOW.loc() + '</span>',
        icon: 'no-icon',
        isEnabled: YES,
        checkbox: priority === CoreTasks.TASK_PRIORITY_LOW,
        action: 'setPriorityLow'
      });
      ret.push({
        isSeparator: YES
      });

      var developmentStatus = Tasks.tasksController.get('developmentStatusWithValidation');
      ret.push({
        title: '<span class=status-planned>' + CoreTasks.STATUS_PLANNED.loc() + '</span>',
        icon: 'no-icon',
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_PLANNED,
        action: 'setDevelopmentStatusPlanned'
      });
      ret.push({
        title: '<span class=status-active>' + CoreTasks.STATUS_ACTIVE.loc() + '</span>',
        icon: 'no-icon',
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_ACTIVE,
        action: 'setDevelopmentStatusActive'
      });
      ret.push({
        title: '<span class=status-done>' + CoreTasks.STATUS_DONE.loc() + '</span>',
        icon: 'no-icon',
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_DONE,
        action: 'setDevelopmentStatusDone'
      });
      ret.push({
        title: '<span class=status-risky>' + CoreTasks.STATUS_RISKY.loc() + '</span>',
        icon: 'no-icon',
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_RISKY,
        action: 'setDevelopmentStatusRisky'
      });

      if(Tasks.softwareMode && developmentStatus === CoreTasks.STATUS_DONE) {
        ret.push({
          isSeparator: YES
        });
        var validation = Tasks.tasksController.get('validation');
        ret.push({
          title: '<span class=task-validation-untested>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</span>',
          icon: 'no-icon',
          isEnabled: YES,
          checkbox: validation === CoreTasks.TASK_VALIDATION_UNTESTED,
          action: 'setValidationUntested'
        });
        ret.push({
          title: '<span class=task-validation-passed>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</span>',
          icon: 'no-icon',
          isEnabled: YES,
          checkbox: validation === CoreTasks.TASK_VALIDATION_PASSED,
          action: 'setValidationPassed'
        });
        ret.push({
          title: '<span class=task-validation-failed>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</span>',
          icon: 'no-icon',
          isEnabled: YES,
          checkbox: validation === CoreTasks.TASK_VALIDATION_FAILED,
          action: 'setValidationFailed'
        });
      }
      
    }
    
    if(selectedTasksCount > 0) {
      if(needsSeparator) {
        ret.push({
          isSeparator: YES
        });
      }
      needsSeparator = true;
      var taskWatch = Tasks.tasksController.get('watch');
      // console.log('DEBUG: selection watch=' + taskWatch);
      if(taskWatch !== CoreTasks.TASK_WATCH_ON) {
        ret.push({
          title: "_Watch".loc(),
          icon: 'watch-icon',
          isEnabled: YES,
          action: 'watchTask'
        });
      }
      if(taskWatch !== CoreTasks.TASK_WATCH_OFF) {
        ret.push({
          title: "_Unwatch".loc(),
          icon: 'unwatch-icon',
          isEnabled: YES,
          action: 'unwatchTask'
        });
      }
    }
    
    return ret;
    
  }
  
});