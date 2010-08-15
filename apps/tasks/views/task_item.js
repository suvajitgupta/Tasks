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

Tasks.TASK_EDITOR = 2; // used to indicate which editor is popped up

Tasks.TaskItemView = SC.ListItemView.extend(
/** @scope Tasks.TaskItemView.prototype */ {
  
  content: null,
  
  _listTypes: function() {
     var ret = [];
     ret.push({ name: CoreTasks.TASK_TYPE_FEATURE, value: CoreTasks.TASK_TYPE_FEATURE, icon: 'task-icon-feature' });
     ret.push({ name: CoreTasks.TASK_TYPE_BUG, value: CoreTasks.TASK_TYPE_BUG, icon: 'task-icon-bug' });
     ret.push({ name: CoreTasks.TASK_TYPE_OTHER, value: CoreTasks.TASK_TYPE_OTHER, icon: 'task-icon-other' });
     return ret;
  },

  _listPriorities: function() {
     var ret = [];
     ret.push({ name: '<span class=task-priority-high>' + CoreTasks.TASK_PRIORITY_HIGH.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_HIGH });
     ret.push({ name: '<span class=task-priority-medium>' + CoreTasks.TASK_PRIORITY_MEDIUM.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_MEDIUM });
     ret.push({ name: '<span class=task-priority-low>' + CoreTasks.TASK_PRIORITY_LOW.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_LOW });
     return ret;
  },

  _listStatuses: function() {
     var ret = [];
     ret.push({ name: '<span class=status-planned>' + CoreTasks.STATUS_PLANNED.loc() + '</span>', value: CoreTasks.STATUS_PLANNED });
     ret.push({ name: '<span class=status-active>' + CoreTasks.STATUS_ACTIVE.loc() + '</span>', value: CoreTasks.STATUS_ACTIVE });
     ret.push({ name: '<span class=status-done>' + CoreTasks.STATUS_DONE.loc() + '</span>', value: CoreTasks.STATUS_DONE });
     ret.push({ name: '<span class=status-risky>' + CoreTasks.STATUS_RISKY.loc() + '</span>', value: CoreTasks.STATUS_RISKY });
     return ret;
  },

  _listValidations: function() {
     var ret = [];
     ret.push({ name: '<span class=task-validation-untested>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_UNTESTED });
     ret.push({ name: '<span class=task-validation-passed>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_PASSED });
     ret.push({ name: '<span class=task-validation-failed>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_FAILED });
     return ret;
  },

  _listUsers: function(excludeGuests) {
    return SC.Binding.transform(function(value, binding) {
       var users = value.toArray();
       var ret = [];
       for(var i=0, len = users.get('length'); i < len; i++) {
         var user = users.objectAt(i);
         if(!excludeGuests || user.get('role') !== CoreTasks.USER_ROLE_GUEST) ret.push(user);
       }
       ret.push({ id: '0', displayName: "_Unassigned".loc(), icon: sc_static('blank') });
       return ret;
    }).from('Tasks.usersController.content');
  },

  _listProjects: function() {
    return SC.Binding.transform(function(value, binding) {
      
       var ret = value.toArray();
       
       // Remove system projects from list since you cannot assign to them
       var idx = ret.indexOf(CoreTasks.get('allTasksProject'));
       if(idx !== -1) ret.splice(idx, 1);
       idx = ret.indexOf(CoreTasks.get('unassignedTasksProject'));
       if(idx !== -1) ret.splice(idx, 1);
       idx = ret.indexOf(CoreTasks.get('unallocatedTasksProject'));
       if(idx !== -1) {
         ret.splice(idx, 1);
         ret.push({ id: '0', icon: CoreTasks.getPath('unallocatedTasksProject.icon'), displayName: "_UnallocatedTasks".loc() });
       }
       
       return ret;
       
    }).from('Tasks.projectsController.content');
  },
  
  /** @private
    If mouse was down over Description icon or effort badge popup the editor.
  */  
  mouseDown: function(event) {
    
    // console.log('DEBUG: mouse down on task item: ' + this.getPath('content.name'));
    
    // See what user clicked on an popup editor accordingly
    var classes = event.target.className;
    // console.log('DEBUG: classes = "' + classes + '"');
    if(classes.indexOf("task-id ") !== -1 || classes.indexOf("task-icon") !== -1 || classes.indexOf("inner") !== -1 ||
       classes.indexOf("count") !== -1 || classes.indexOf("description-icon") !== -1) {
      var sel = Tasks.getPath('tasksController.selection');
      var singleSelect = (sel && sel.get('length') === 1);
    
      if ((!event.which || event.which === 1) && singleSelect && classes !== "") { // left click with one task selected and didn't click on the inline editable name
        this.popupEditor(this.get('content'));
      }
    }
    
    return NO; // so that drag-n-drop can work!
    
  },
  
  mouseUp: function(event){
    return sc_super();
  },
  
  popupEditor: function(task) {
    var layer = this.get('layer');
    var that = this;
    this._task = task;
    this._editorPane = SCUI.ModalPane.create({
      
      titleBarHeight: 40,
      title: "_TaskDetails".loc(),
      minWidth: 725,
      minHeight: 310,
      layout: { centerX:0, centerY: 0, width: 725, height: 370 },
      
      _preEditing: function() {
        var task = that.get('_task');
        var cv = this.get('contentView');
        cv.setPath('idLabel.value', task.get('displayId'));
        var name = task.get('name');
        cv.setPath('nameField.value', name);
        var copyPattern = new RegExp("_Copy".loc() + '$');
        if((name === CoreTasks.NEW_TASK_NAME.loc() || copyPattern.exec(name)) && Tasks.getPath('tasksController.isEditable')) {
          this.getPath('contentView.nameField').becomeFirstResponder();
        }
        cv.setPath('typeField.value', task.get('type'));
        cv.setPath('priorityField.value', task.get('priority'));
        cv.setPath('statusField.value', task.get('developmentStatus'));
        cv.setPath('validationField.value', task.get('validation'));
        cv.setPath('effortField.value', task.get('effort'));
        cv.setPath('projectField.value', task.get('projectValue'));
        cv.setPath('submitterField.value', task.get('submitterValue'));
        cv.setPath('assigneeField.value', task.get('assigneeValue'));
        cv.setPath('descriptionField.value', task.get('description'));
        cv.setPath('createdAtLabel.value', task.get('displayCreatedAt'));
        cv.setPath('updatedAtLabel.value', task.get('displayUpdatedAt'));
      },
      _postEditing: function() {
        var task = that.get('_task');
        var cv = this.get('contentView');
        task.setIfChanged('displayName', cv.getPath('nameField.value'));
        task.setIfChanged('type', cv.getPath('typeField.value'));
        task.setIfChanged('priority', cv.getPath('priorityField.value'));
        task.setIfChanged('developmentStatus', cv.getPath('statusField.value'));
        task.setIfChanged('validation', cv.getPath('validationField.value'));
        task.setIfChanged('effortValue', cv.getPath('effortField.value'));
        task.setIfChanged('projectValue', cv.getPath('projectField.value'));
        task.setIfChanged('submitterValue', cv.getPath('submitterField.value'));
        task.setIfChanged('assigneeValue', cv.getPath('assigneeField.value'));
        task.setIfChanged('description',  cv.getPath('descriptionField.value'));
      },
      _statusDidChange: function() {
        var cv = this.get('contentView');
        var status = cv.getPath('statusField.value');
        // console.log('_statusDidChange() to ' + status.loc());
        var isDone = (status === CoreTasks.STATUS_DONE);
        cv.setPath('validationField.isEnabled', isDone);
        if(!isDone) cv.setPath('validationField.value', CoreTasks.TASK_VALIDATION_UNTESTED);
      }.observes('.contentView.statusField*value'),
      
      // Avoid popup panel coming up on other items while it is up already
      popup: function() {
        this.append();
        Tasks.editorPoppedUp = Tasks.TASK_EDITOR;
        this._preEditing();
      },
      remove: function() {
        sc_super();
        Tasks.editorPoppedUp = null;
        this._postEditing();
        this.destroy();
        if(Tasks.assignmentsRedrawNeeded) Tasks.assignmentsController.showAssignments();
        if(CoreTasks.get('autoSave')) Tasks.saveData();
     },
      
      previousTask: function() {
        this._postEditing();
        SC.RunLoop.begin();
        Tasks.mainPage.getPath('mainPane.tasksList').selectPreviousItem();
        SC.RunLoop.end();
        that._task = Tasks.tasksController.getPath('selection.firstObject');
        this._preEditing();
      },
      nextTask: function() {
        this._postEditing();
        SC.RunLoop.begin();
        Tasks.mainPage.getPath('mainPane.tasksList').selectNextItem();
        SC.RunLoop.end();
        that._task = Tasks.tasksController.getPath('selection.firstObject');
        this._preEditing();
      },
      
      contentView: SC.View.design({
        layout: { left: 0, right: 0, top: 0, bottom: 0},
        childViews: 'nameLabel nameField typeLabel typeField priorityLabel priorityField statusLabel statusField validationLabel validationField effortLabel effortField effortHelpLabel projectLabel projectField submitterLabel submitterField assigneeLabel assigneeField descriptionLabel descriptionField createdAtLabel updatedAtLabel idLabel previousButton nextButton closeButton'.w(),
      
        nameLabel: SC.LabelView.design({
          layout: { top: 6, left: 0, height: 24, width: 55 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Name".loc()
        }),
        nameField: SC.TextFieldView.design({
          layout: { top: 5, left: 60, right: 10, height: 24 },
          isEnabledBinding: 'Tasks.tasksController.isEditable'
        }),
        
        typeLabel: SC.LabelView.design({
          layout: { top: 40, left: 0, height: 24, width: 55 },
          isVisibleBinding: 'Tasks.softwareMode',
          textAlign: SC.ALIGN_RIGHT,
          value: "_Type".loc()
        }),
        typeField: SC.SelectButtonView.design({
          layout: { top: 38, left: 60, height: 24, width: 120 },
          classNames: ['square'],
          localize: YES,
          isVisibleBinding: 'Tasks.softwareMode',
          isEnabledBinding: 'Tasks.tasksController.isEditable',
          objects: this._listTypes(),
          nameKey: 'name',
          valueKey: 'value',
          iconKey: 'icon',
          toolTip: "_TypeTooltip".loc()
        }),
   
        priorityLabel: SC.LabelView.design({
          layout: { top: 40, left: 170, height: 24, width: 55 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Priority".loc()
        }),
        priorityField: SC.SelectButtonView.design({
          layout: { top: 38, left: 230, height: 24, width: 120 },
          classNames: ['square'],
          localize: YES,
          isEnabledBinding: 'Tasks.tasksController.isEditable',
          objects: this._listPriorities(),
          nameKey: 'name',
          valueKey: 'value',
          toolTip: "_PriorityTooltip".loc()
        }),
                  
        statusLabel: SC.LabelView.design({
          layout: { top: 40, right: 285, height: 24, width: 50 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Status".loc()
        }),
        statusField: SC.SelectButtonView.design({
          layout: { top: 38, right: 190, height: 24, width: 120 },
          classNames: ['square'],
          localize: YES,
          isEnabledBinding: 'Tasks.tasksController.isEditable',
          objects: this._listStatuses(),
          nameKey: 'name',
          valueKey: 'value',
          toolTip: "_StatusTooltip".loc()
        }),

        validationLabel: SC.LabelView.design({
          layout: { top: 40, right: 105, height: 24, width: 70 },
          textAlign: SC.ALIGN_RIGHT,
          isVisibleBinding: 'Tasks.softwareMode',
          value: "_Validation".loc()
        }),
        validationField: SC.SelectButtonView.design({
          layout: { top: 38, right: 10, height: 24, width: 120 },
          classNames: ['square'],
          localize: YES,
          isVisibleBinding: 'Tasks.softwareMode',
          objects: this._listValidations(),
          nameKey: 'name',
          valueKey: 'value',
          toolTip: "_ValidationTooltip".loc()
        }),

        effortLabel: SC.LabelView.design({
          layout: { top: 77, left: 0, height: 24, width: 55 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Effort:".loc()
        }),
        effortField: SC.TextFieldView.design({
          layout: { top: 75, left: 60, width: 95, height: 24 },
          isEnabledBinding: 'Tasks.tasksController.isEditable'
        }),
        effortHelpLabel: SC.LabelView.design({
          layout: { top: 75, left: 160, height: 30, width: 225 },
          escapeHTML: NO,
          classNames: [ 'onscreen-help'],
          value: "_EffortOnscreenHelp".loc()
        }),
        
        projectLabel: SC.LabelView.design({
          layout: { top: 114, left: 0, height: 24, width: 55 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Project:".loc()
        }),
        // projectField: SCUI.ComboBoxView.design({
        projectField: SC.SelectFieldView.design({
          layout: { top: 112, left: 60, width: 270, height: 24 },
          objectsBinding: this._listProjects(),
          nameKey: 'displayName',
          valueKey: 'id',
          iconKey: 'icon',
          isEnabledBinding: 'Tasks.tasksController.isReallocatable'
        }),

        submitterLabel: SC.LabelView.design({
          layout: { top: 77, right: 285, height: 24, width: 75 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Submitter:".loc()
        }),
        // submitterField: SCUI.ComboBoxView.design({
        submitterField: SC.SelectFieldView.design({
          layout: { top: 75, right: 10, width: 272, height: 24 },
          objectsBinding: this._listUsers(false),
          nameKey: 'displayName',
          valueKey: 'id',
          iconKey: 'icon',
          isEnabledBinding: 'Tasks.tasksController.isEditable'
        }),

        assigneeLabel: SC.LabelView.design({
          layout: { top: 114, right: 285, height: 24, width: 75 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Assignee:".loc()
        }),
        // assigneeField: SCUI.ComboBoxView.design({
        assigneeField: SC.SelectFieldView.design({
          layout: { top: 112, right: 10, width: 272, height: 24 },
          objectsBinding: this._listUsers(true),
          nameKey: 'displayName',
          valueKey: 'id',
          iconKey: 'icon',
          isEnabledBinding: 'Tasks.tasksController.isEditable'
        }),

        descriptionLabel: SC.LabelView.design({
          layout: { top: 145, left: 10, height: 17, width: 100 },
          icon: 'description-icon',
          value: "_Description:".loc()
        }),
        descriptionField: SC.TextFieldView.design({
          layout: { top: 168, left: 10, right: 10, bottom: 65 },
          hint: "_DescriptionHint".loc(),
          isTextArea: YES,
          isEnabled: YES
        }),
        
        createdAtLabel: SC.LabelView.design({
          layout: { left: 10, bottom: 45, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_LEFT
        }),
        updatedAtLabel: SC.LabelView.design({
          layout: { right: 10, bottom: 45, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_RIGHT
        }),

        idLabel: SC.LabelView.design({
          layout: { left: 10, bottom: 15, height: 17, width: 100 },
          textAlign: SC.ALIGN_LEFT
        }),
        previousButton: SC.ButtonView.design({
          layout: { bottom: 10, centerX: -17, width: 32, height: 24 },
          classNames: ['dark'],
          titleMinWidth: 0,
          icon: 'previous-icon',
          toolTip: "_ShowPreviousTask".loc(),
          action: 'previousTask',
          isEnabledBinding: SC.Binding.transform(function(value, binding) {
                                                   var task = value.getPath('firstObject');
                                                   var idx = Tasks.tasksController.get('arrangedObjects').indexOf(task);
                                                   if(idx === 1) return false;
                                                   return true;
                                                 }).from('Tasks.tasksController*selection')
        }),
        nextButton: SC.ButtonView.design({
          layout: { bottom: 10, centerX: 17, width: 32, height: 24 },
          classNames: ['dark'],
          titleMinWidth: 0,
          icon: 'next-icon',
          toolTip: "_ShowNextTask".loc(),
          action: 'nextTask',
          isEnabledBinding: SC.Binding.transform(function(value, binding) {
                                                   var task = value.getPath('firstObject');
                                                   var idx = Tasks.tasksController.get('arrangedObjects').indexOf(task);
                                                   var max = Tasks.tasksController.getPath('arrangedObjects.length') - 1;
                                                   if(idx === max) return false;
                                                   return true;
                                                 }).from('Tasks.tasksController*selection')
        }),

        closeButton: SC.ButtonView.design({
          layout: { bottom: 10, right: 20, width: 80, height: 24 },
          isDefault: YES,
          title: "_Close".loc(),
          action: 'remove'
        })
          
      })
    });
    if(this._editorPane) this._editorPane.popup(layer);
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
    context = context.begin('div').addClass(taskIdClass).addClass(validationClass).
                text(displayId).attr('title', idTooltip).attr('alt', idTooltip).end();
      
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
    if(Tasks.editorPoppedUp) return;
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
        target: 'Tasks',
        action: 'addTask'
      });
    }
    
    if(selectedTasksCount === 1 && Tasks.tasksController.get('isAddable')) {
      needsSeparator = true;
      ret.push({
        title: "_Duplicate".loc(),
        icon: 'duplicate-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'duplicateTask'
      });
    }
    
    if(Tasks.tasksController.get('isDeletable')) {
      needsSeparator = true;
      ret.push({
        title: "_Delete".loc(),
        icon: 'delete-icon',
        isEnabled: YES,
        target: 'Tasks',
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
          target: 'Tasks.tasksController',
          action: 'setTypeFeature'
        });
        ret.push({
          title: CoreTasks.TASK_TYPE_BUG.loc(),
          icon: 'task-icon-bug',
          isEnabled: YES,
          checkbox: type === CoreTasks.TASK_TYPE_BUG,
          target: 'Tasks.tasksController',
          action: 'setTypeBug'
        });
        ret.push({
          title: CoreTasks.TASK_TYPE_OTHER.loc(),
          icon: 'task-icon-other',
          isEnabled: YES,
          checkbox: type === CoreTasks.TASK_TYPE_OTHER,
          target: 'Tasks.tasksController',
          action: 'setTypeOther'
        });
        ret.push({
          isSeparator: YES
        });
      }
      
      var priority = Tasks.tasksController.get('priority');
      ret.push({
        title: '<span class=task-priority-high>' + CoreTasks.TASK_PRIORITY_HIGH.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: priority === CoreTasks.TASK_PRIORITY_HIGH,
        target: 'Tasks.tasksController',
        action: 'setPriorityHigh'
      });
      ret.push({
        title: '<span class=task-priority-medium>' + CoreTasks.TASK_PRIORITY_MEDIUM.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: priority === CoreTasks.TASK_PRIORITY_MEDIUM,
        target: 'Tasks.tasksController',
        action: 'setPriorityMedium'
      });
      ret.push({
        title: '<span class=task-priority-low>' + CoreTasks.TASK_PRIORITY_LOW.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: priority === CoreTasks.TASK_PRIORITY_LOW,
        target: 'Tasks.tasksController',
        action: 'setPriorityLow'
      });
      ret.push({
        isSeparator: YES
      });

      var developmentStatus = Tasks.tasksController.get('developmentStatusWithValidation');
      ret.push({
        title: '<span class=status-planned>' + CoreTasks.STATUS_PLANNED.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_PLANNED,
        target: 'Tasks.tasksController',
        action: 'setDevelopmentStatusPlanned'
      });
      ret.push({
        title: '<span class=status-active>' + CoreTasks.STATUS_ACTIVE.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_ACTIVE,
        target: 'Tasks.tasksController',
        action: 'setDevelopmentStatusActive'
      });
      ret.push({
        title: '<span class=status-done>' + CoreTasks.STATUS_DONE.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_DONE,
        target: 'Tasks.tasksController',
        action: 'setDevelopmentStatusDone'
      });
      ret.push({
        title: '<span class=status-risky>' + CoreTasks.STATUS_RISKY.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_RISKY,
        target: 'Tasks.tasksController',
        action: 'setDevelopmentStatusRisky'
      });

      if(Tasks.softwareMode && developmentStatus === CoreTasks.STATUS_DONE) {
        ret.push({
          isSeparator: YES
        });
        var validation = Tasks.tasksController.get('validation');
        ret.push({
          title: '<span class=task-validation-untested>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          checkbox: validation === CoreTasks.TASK_VALIDATION_UNTESTED,
          target: 'Tasks.tasksController',
          action: 'setValidationUntested'
        });
        ret.push({
          title: '<span class=task-validation-passed>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          checkbox: validation === CoreTasks.TASK_VALIDATION_PASSED,
          target: 'Tasks.tasksController',
          action: 'setValidationPassed'
        });
        ret.push({
          title: '<span class=task-validation-failed>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</span>',
          icon: sc_static('blank'),
          isEnabled: YES,
          checkbox: validation === CoreTasks.TASK_VALIDATION_FAILED,
          target: 'Tasks.tasksController',
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
          target: 'Tasks',
          action: 'watchTask'
        });
      }
      if(taskWatch !== CoreTasks.TASK_WATCH_OFF) {
        ret.push({
          title: "_Unwatch".loc(),
          icon: 'unwatch-icon',
          isEnabled: YES,
          target: 'Tasks',
          action: 'unwatchTask'
        });
      }
    }
    
    return ret;
    
  }
  
});