// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks CoreTasks */

/** 

  Task details editor.
  
  @extends SC.View
  @author Suvajit Gupta
*/
Tasks.taskEditorHelper = SC.Object.create({
  
  listTypes: function() {
     var ret = [];
     ret.push({ name: CoreTasks.TASK_TYPE_FEATURE, value: CoreTasks.TASK_TYPE_FEATURE, icon: 'task-icon-feature' });
     ret.push({ name: CoreTasks.TASK_TYPE_BUG, value: CoreTasks.TASK_TYPE_BUG, icon: 'task-icon-bug' });
     ret.push({ name: CoreTasks.TASK_TYPE_OTHER, value: CoreTasks.TASK_TYPE_OTHER, icon: 'task-icon-other' });
     return ret;
  },

  listPriorities: function() {
     var ret = [];
     ret.push({ name: '<span class=task-priority-high>' + CoreTasks.TASK_PRIORITY_HIGH.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_HIGH });
     ret.push({ name: '<span class=task-priority-medium>' + CoreTasks.TASK_PRIORITY_MEDIUM.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_MEDIUM });
     ret.push({ name: '<span class=task-priority-low>' + CoreTasks.TASK_PRIORITY_LOW.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_LOW });
     return ret;
  },

  listStatuses: function() {
     var ret = [];
     ret.push({ name: '<span class=status-planned>' + CoreTasks.STATUS_PLANNED.loc() + '</span>', value: CoreTasks.STATUS_PLANNED });
     ret.push({ name: '<span class=status-active>' + CoreTasks.STATUS_ACTIVE.loc() + '</span>', value: CoreTasks.STATUS_ACTIVE });
     ret.push({ name: '<span class=status-done>' + CoreTasks.STATUS_DONE.loc() + '</span>', value: CoreTasks.STATUS_DONE });
     ret.push({ name: '<span class=status-risky>' + CoreTasks.STATUS_RISKY.loc() + '</span>', value: CoreTasks.STATUS_RISKY });
     return ret;
  },

  listValidations: function() {
     var ret = [];
     ret.push({ name: '<span class=task-validation-untested>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_UNTESTED });
     ret.push({ name: '<span class=task-validation-passed>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_PASSED });
     ret.push({ name: '<span class=task-validation-failed>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_FAILED });
     return ret;
  },

  _usersCountBinding: SC.Binding.oneWay('Tasks.usersController*arrangedObjects.length'),
  _listUsers: function() {
    // console.log('DEBUG: _listUsers');
    var usersList = Tasks.usersController.get('content');
    var ret1 = [], ret2 = [];
    if(usersList) {
      var users = usersList.toArray();
      for(var i=0, len = users.get('length'); i < len; i++) {
        var user = users.objectAt(i);
        ret1.push(user);
        if(user.get('role') !== CoreTasks.USER_ROLE_GUEST) ret2.push(user);
      }
      var unassigned = { id: 0, displayName: "_Unassigned".loc(), icon: 'no-icon' };
      ret1.push(unassigned);
      ret2.push(unassigned);
    }
    this.set('usersList', ret1);
    this.set('nonGuestsList', ret2);
  }.observes('_usersCount'),
  usersList: null,
  nonGuestsList: null,

  _projectsCountBinding: SC.Binding.oneWay('Tasks.projectsController*arrangedObjects.length'),
  _listProjects: function() {
    // console.log('DEBUG: _listProjects');
    var projectsList = Tasks.projectsController.get('content');
    var ret = [];
    if(projectsList) {
      ret = projectsList.toArray();
      // Remove system projects from list since you cannot assign to them
      var idx = ret.indexOf(CoreTasks.get('allTasksProject'));
      if(idx !== -1) ret.splice(idx, 1);
      idx = ret.indexOf(CoreTasks.get('unassignedTasksProject'));
      if(idx !== -1) ret.splice(idx, 1);
      idx = ret.indexOf(CoreTasks.get('unallocatedTasksProject'));
      if(idx !== -1) {
        ret.splice(idx, 1);
        ret.push({ id: 0, icon: CoreTasks.getPath('unallocatedTasksProject.icon'), displayName: "_UnallocatedTasks".loc() });
      }
    }
    this.set('projectsList', ret);
  }.observes('_projectsCount'),
  projectsList: null
  
});

Tasks.TaskEditorView = SC.View.extend(
/** @scope Tasks.TaskEditorView.prototype */ {
  
  task: null,
  titleBarHeight: 40,
  minWidth: 725,
  minHeight: 310,
  
  _preEditing: function() {
    var task = this.get('task');
    // console.log('DEBUG: preEditing task: ' + task.get('name'));
    var editor = this.get('editor');
    editor.setPath('idLabel.value', "_Task".loc() + ' ' + task.get('displayId'));
    this._watches = CoreTasks.getTaskWatches(task);
    this._watching = CoreTasks.isCurrentUserWatchingTask(task);
    editor.setPath('watchingCheckbox.value', this._watching? true : false);
    editor.setPath('watchersButton.title', '' + this._watches.length);
    editor.setPath('watchersButton.isEnabled', this._watches.length > 0);
    editor.setPath('nameField.value', task.get('name'));
    if(Tasks.getPath('tasksController.isEditable')) {
      this.invokeLater(function() { Tasks.getPath('mainPage.taskEditor.editor.nameField').becomeFirstResponder(); }, 400);
    }
    editor.setPath('typeField.value', task.get('type'));
    editor.setPath('priorityField.value', task.get('priority'));
    editor.setPath('statusField.value', task.get('developmentStatus'));
    editor.setPath('validationField.value', task.get('validation'));
    editor.setPath('effortField.value', task.get('effort'));
    editor.setPath('projectField.value', task.get('projectValue'));
    editor.setPath('submitterField.value', task.get('submitterValue'));
    editor.setPath('assigneeField.value', task.get('assigneeValue'));
    editor.setPath('splitView.topLeftView.contentView.descriptionField.value', task.get('description'));
    editor.setPath('createdAtLabel.value', task.get('displayCreatedAt'));
    editor.setPath('updatedAtLabel.value', task.get('displayUpdatedAt'));
  },
  
  _postEditing: function() {
    Tasks.commentsController.set('selection', '');
    var task = this.get('task');
    // console.log('DEBUG: postEditing task: ' + task.get('name'));
    var editor = this.get('editor');
    if(editor.getPath('nameField.value') === CoreTasks.NEW_TASK_NAME.loc()) {
      task.destroy(); // blow away unmodified new task
    }
    else {
      var shouldWatch = editor.getPath('watchingCheckbox.value');
      if(this._watching && !shouldWatch) {
        var watch = CoreTasks.getCurrentUserTaskWatch(task);
        SC.RunLoop.begin();
        if(watch) watch.destroy();
        SC.RunLoop.end();
      }
      else if(!this._watching && shouldWatch) {
        SC.RunLoop.begin();
        CoreTasks.createRecord(CoreTasks.Watch, { taskId: task.get('id'), userId: CoreTasks.getPath('currentUser.id') });
        SC.RunLoop.end();
      }
      task.setIfChanged('type', editor.getPath('typeField.value'));
      task.setIfChanged('priority', editor.getPath('priorityField.value'));
      task.setIfChanged('developmentStatus', editor.getPath('statusField.value'));
      task.setIfChanged('validation', editor.getPath('validationField.value'));
      task.setIfChanged('effortValue', editor.getPath('effortField.value'));
      task.setIfChanged('projectValue', editor.getPath('projectField.value'));
      task.setIfChanged('submitterValue', editor.getPath('submitterField.value'));
      task.setIfChanged('assigneeValue', editor.getPath('assigneeField.value'));
      task.setIfChanged('displayName', editor.getPath('nameField.value'));
      task.setIfChanged('description',  editor.getPath('splitView.topLeftView.contentView.descriptionField.value'));
    }
  },
  
  _statusDidChange: function() {
    var editor = this.get('editor');
    var status = editor.getPath('statusField.value');
    var isDone = (status === CoreTasks.STATUS_DONE);
    editor.setPath('validationField.isEnabled', isDone);
    if(!isDone) editor.setPath('validationField.value', CoreTasks.TASK_VALIDATION_UNTESTED);
  }.observes('.editor.statusField*value'),
  
  popup: function(task) {
    if(Tasks.mainPage.getPath('mainPane.tasksSceneView.nowShowing') == 'taskEditor') {
      this._postEditing();
    }
    else {
      Tasks.statechart.sendEvent('showTaskEditor');
      Tasks.setPath('mainPage.mainPane.tasksSceneView.nowShowing', 'taskEditor');
      Tasks.set('panelOpen', Tasks.TASK_EDITOR);
    }
    this.set('task', task);
    this._preEditing();
    // reselect task since selection is lost when tasksList slides out of view
    this.invokeLast(function() { Tasks.tasksController.selectObject(task); });
  },
  
  close: function() {
    Tasks.set('panelOpen', null);
    this._postEditing();
    if(CoreTasks.get('autoSave') && !CoreTasks.get('isSaving')) Tasks.saveChanges();
    Tasks.setPath('mainPage.mainPane.tasksSceneView.nowShowing', 'tasksList');
    this.invokeLater(function() { Tasks.mainPage.tasksList.contentView.becomeFirstResponder(); }, 400);
  },
  
 showWatchers: function() {
   var store = CoreTasks.get('store');
   this._watchers = [];
   var watchesCount = this._watches.length;
   for(var i = 0; i < watchesCount; i++) {
     var watch = this._watches[i];
     var watcher = store.find(CoreTasks.User, watch.get('userId'));
     // console.log('Watcher: ' + watcher.get('name'));
     if(watcher) this._watchers.push(watcher);
   }
   var pane = SC.PickerPane.create({
     layout: { width: 272, height: 100 },
     contentView: SC.ScrollView.extend({
       contentView: SC.ListView.design({
         contentValueKey: 'displayName',
         content: this._watchers.sort(Tasks.nameAlphaSort),
         localize: YES,
         rowHeight: 24,
         hasContentIcon: YES,
         contentIconKey: 'icon',
         isSelectable: NO,
         isEditable: NO
       })
     })
   });
   pane.popup(this.getPath('editor.watchersButton'), SC.PICKER_POINTER);
 },
 
 gotoPreviousTask: function() {
   this._postEditing();
   SC.RunLoop.begin();
   Tasks.mainPage.getPath('tasksList.contentView').selectPreviousItem();
   SC.RunLoop.end();
   this.set('task', Tasks.tasksController.getPath('selection.firstObject'));
   this._preEditing();
 },
 
 gotoNextTask: function() {
   this._postEditing();
   SC.RunLoop.begin();
   Tasks.mainPage.getPath('tasksList.contentView').selectNextItem();
   SC.RunLoop.end();
   this.set('task', Tasks.tasksController.getPath('selection.firstObject'));
   this._preEditing();
 },
  
 editComment: function() {
   var commentsList = Tasks.mainPage.getPath('taskEditor.editor.splitView.bottomRightView.commentsList.contentView');
   var commentView = commentsList.itemViewForContentIndex(0);
   // FIXME: [SC] scrolling to top of comments list doesn't always work in SC
   SC.run(function() { commentsList.scrollToContentIndex(0); });
   commentView.editDescription();
 },
  
 childViews: 'editor'.w(),
 
 editor: SC.View.design({
   
   childViews: 'idLabel showTasksListButton gotoPreviousTaskButton gotoNextTaskButton nameLabel nameField typeLabel typeField priorityLabel priorityField statusLabel statusField validationLabel validationField effortLabel effortField effortHelpLabel submitterLabel submitterField projectLabel projectField assigneeLabel assigneeField splitView separatorView createdAtLabel updatedAtLabel watchingCheckbox watchersButton'.w(),
   classNames: ['task-editor'],

   idLabel: SC.LabelView.design({
     layout: { left: 0, right: 0, top: 0, height: 24 },
     classNames: ['title-bar']
   }),
   
   showTasksListButton: SC.View.design(SCUI.SimpleButton, {
     layout: { top: 2, left: 10, width: 32, height: 19 },
     classNames: ['back-icon'],
     toolTip: "_ShowTasksList".loc(),
     action: 'showTasksList'
    }),

   gotoPreviousTaskButton: SC.View.design(SCUI.SimpleButton, {
     layout: { top: 3, centerX: -80, width: 17, height: 17 },
     classNames: ['previous-icon'],
     toolTip: "_GotoPreviousTask".loc(),
     action: 'gotoPreviousTask',
     isEnabledBinding: SC.Binding.transform(function(value, binding) {
                                              var task = value.getPath('firstObject');
                                              var tasksList = Tasks.getPath('tasksController.arrangedObjects');
                                              if(!tasksList) return false;
                                              var idx = tasksList.indexOf(task);
                                              var indexes = tasksList.contentGroupIndexes(null, tasksList);
                                              for (--idx; idx >= 0; idx--) {
                                                if (!indexes.contains(idx)) return true;
                                              }
                                              return false;
                                            }).from('Tasks*tasksController.selection')
   }),
   gotoNextTaskButton: SC.View.design(SCUI.SimpleButton, {
     layout: { top: 3, centerX: 80, width: 17, height: 17 },
     classNames: ['next-icon'],
     toolTip: "_GotoNextTask".loc(),
     action: 'gotoNextTask',
     isEnabledBinding: SC.Binding.transform(function(value, binding) {
                                              var task = value.getPath('firstObject');
                                              var tasksList = Tasks.getPath('tasksController.arrangedObjects');
                                              if(!tasksList) return false;
                                              var idx = tasksList.indexOf(task);
                                              var len = tasksList.get('length') - 1;
                                              if(idx === len) return false;
                                              return true;
                                            }).from('Tasks*tasksController.selection')
   }),

   nameLabel: SC.LabelView.design({
     layout: { top: 40, left: 0, height: 24, width: 55 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Name".loc()
   }),
   nameField: SC.TextFieldView.design({
     layout: { top: 39, left: 60, right: 10, height: 24 },
     isEnabledBinding: 'Tasks.tasksController.isEditable'
   }),

   typeLabel: SC.LabelView.design({
     layout: { top: 74, left: 0, height: 24, width: 55 },
     isVisibleBinding: 'Tasks.softwareMode',
     textAlign: SC.ALIGN_RIGHT,
     value: "_Type".loc()
   }),
   typeField: SC.SelectButtonView.design({
     layout: { top: 72, left: 60, height: 24, width: 120 },
     classNames: ['square'],
     localize: YES,
     isVisibleBinding: 'Tasks.softwareMode',
     isEnabledBinding: 'Tasks.tasksController.isEditable',
     objects: Tasks.taskEditorHelper.listTypes(),
     nameKey: 'name',
     valueKey: 'value',
     iconKey: 'icon',
     toolTip: "_TypeTooltip".loc()
   }),

   priorityLabel: SC.LabelView.design({
     layout: { top: 74, left: 170, height: 24, width: 55 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Priority".loc()
   }),
   priorityField: SC.SelectButtonView.design({
     layout: { top: 72, left: 230, height: 24, width: 120 },
     classNames: ['square'],
     localize: YES,
     isEnabledBinding: 'Tasks.tasksController.isEditable',
     objects: Tasks.taskEditorHelper.listPriorities(),
     nameKey: 'name',
     valueKey: 'value',
     toolTip: "_PriorityTooltip".loc()
   }),

   statusLabel: SC.LabelView.design({
     layout: { top: 74, right: 285, height: 24, width: 50 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Status".loc()
   }),
   statusField: SC.SelectButtonView.design({
     layout: { top: 72, right: 190, height: 24, width: 120 },
     classNames: ['square'],
     localize: YES,
     isEnabledBinding: 'Tasks.tasksController.isEditable',
     objects: Tasks.taskEditorHelper.listStatuses(),
     nameKey: 'name',
     valueKey: 'value',
     toolTip: "_StatusTooltip".loc()
   }),

   validationLabel: SC.LabelView.design({
     layout: { top: 74, right: 105, height: 24, width: 70 },
     textAlign: SC.ALIGN_RIGHT,
     isVisibleBinding: 'Tasks.softwareMode',
     value: "_Validation".loc()
   }),
   validationField: SC.SelectButtonView.design({
     layout: { top: 72, right: 10, height: 24, width: 120 },
     classNames: ['square'],
     localize: YES,
     isVisibleBinding: 'Tasks.softwareMode',
     objects: Tasks.taskEditorHelper.listValidations(),
     nameKey: 'name',
     valueKey: 'value',
     toolTip: "_ValidationTooltip".loc()
   }),

   effortLabel: SC.LabelView.design({
     layout: { top: 111, left: 0, height: 24, width: 55 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Effort:".loc()
   }),
   effortField: SC.TextFieldView.design({
     layout: { top: 109, left: 60, width: 95, height: 24 },
     isEnabledBinding: 'Tasks.tasksController.isEditable'
   }),
   effortHelpLabel: SC.LabelView.design({
     layout: { top: 109, left: 160, height: 30, width: 235 },
     escapeHTML: NO,
     classNames: [ 'onscreen-help'],
     value: "_EffortOnscreenHelp".loc()
   }),

   projectLabel: SC.LabelView.design({
     layout: { top: 148, left: 0, height: 24, width: 55 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Project:".loc()
   }),
   projectField: SCUI.ComboBoxView.design({
     layout: { top: 146, left: 60, width: 270, height: 24 },
     objectsBinding: SC.Binding.oneWay('Tasks.taskEditorHelper*projectsList'),
     nameKey: 'displayName',
     valueKey: 'id',
     iconKey: 'icon',
     isEnabledBinding: 'Tasks.tasksController.isReallocatable'
   }),

   submitterLabel: SC.LabelView.design({
     layout: { top: 111, right: 285, height: 24, width: 75 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Submitter:".loc()
   }),
   submitterField: SCUI.ComboBoxView.design({
     layout: { top: 109, right: 10, width: 272, height: 24 },
     objectsBinding: SC.Binding.oneWay('Tasks.taskEditorHelper*usersList'),
     nameKey: 'displayName',
     valueKey: 'id',
     iconKey: 'icon',
     isEnabledBinding: 'Tasks.tasksController.isEditable'
   }),

   assigneeLabel: SC.LabelView.design({
     layout: { top: 148, right: 285, height: 24, width: 75 },
     textAlign: SC.ALIGN_RIGHT,
     value: "_Assignee:".loc()
   }),
   assigneeField: SCUI.ComboBoxView.design({
     layout: { top: 146, right: 10, width: 272, height: 24 },
     objectsBinding: SC.Binding.oneWay('Tasks.taskEditorHelper*nonGuestsList'),
     nameKey: 'displayName',
     valueKey: 'id',
     iconKey: 'icon',
     isEnabledBinding: 'Tasks.tasksController.isEditable'
   }),

   splitView: SC.SplitView.design({
     layout: { top: 179, left: 10, bottom: 40, right: 10 },
     layoutDirection: SC.LAYOUT_VERTICAL,
     defaultThickness: 0.5,
     topLeftMinThickness: 75,
     bottomRightMinThickness: 75,
     
     topLeftView: SC.ScrollView.design({
       hasHorizontalScroller: NO, // disable horizontal scrolling
       contentView: SC.View.design({
         childViews: 'descriptionLabel descriptionField'.w(),
         descriptionLabel: SC.LabelView.design({
           layout: { top: 0, left: 0, height: 17, width: 100 },
           icon: 'description-icon',
           value: "_Description:".loc()
         }),
         descriptionField: SC.TextFieldView.design({
           layout: { top: 23, left: 0, right: 0, bottom: 5 },
           hint: "_DescriptionHint".loc(),
           maxLength: 500000,
           isTextArea: YES,
           isEnabled: YES,
           isEnabledBinding: 'Tasks.tasksController.isEditable'
         })
       })
     }),
     
     bottomRightView: SC.View.design({
       classNames: ['comments-view'],
       childViews: 'commentButton commentsList'.w(),
       commentButton: SC.ButtonView.design({
         layout: { top: 5, centerX: 0, height: 24, width: 90 },
         title: "_Comment".loc(),
         action: 'addComment',
         toolTip: "_CommentTooltip".loc()
       }),
       commentsList: SC.ScrollView.design({
         layout: { top: 35, left: 0, right: 0, bottom: 0 },
           hasHorizontalScroller: NO, // disable horizontal scrolling
           contentView: SC.StackedView.design({
            contentBinding: 'Tasks.commentsController.arrangedObjects',
            classNames: ['comments-list'],
            selectionBinding: 'Tasks.commentsController.selection',
            exampleView: Tasks.CommentItemView
          })
        })
     })
   }),
   
   separatorView: SC.View.design({
     layout: { left: 5, right: 5, height: 2, bottom: 33 },
     classNames: [ 'separator']
   }),

   createdAtLabel: SC.LabelView.design({
     layout: { left: 10, bottom: 10, height: 17, width: 250 },
     classNames: [ 'date-time'],
     textAlign: SC.ALIGN_LEFT
   }),
   updatedAtLabel: SC.LabelView.design({
     layout: { right: 10, bottom: 10, height: 17, width: 250 },
     classNames: [ 'date-time'],
     textAlign: SC.ALIGN_RIGHT
   }),

   watchingCheckbox: SC.CheckboxView.design({
     layout: { centerX: -35, bottom: 10, height: 16, width: 80 },
     title: "_Watch".loc()
   }),
   watchersButton: SC.ButtonView.design({
     layout: { centerX: 35, bottom: 6, height: 24, width: 80 },
     icon: 'watches-icon',
     fontWeight: SC.BOLD_WEIGHT,
     action: 'showWatchers',
     toolTip: "_TaskWatchersTooltip".loc()
   })
   
  }),
  
  commentButton: SC.outlet('editor.splitView.bottomRightView.commentButton'),

  keyDown: function(event) {
    var ret = NO, commandCode = event.commandCodes();
    // console.log('DEBUG: hotkey "' + commandCode[0] + '" pressed');
    if (commandCode[0] === 'return' || commandCode[0] === 'escape') {
      Tasks.statechart.sendEvent('showTasksList');
      return YES;
    }
    else if (commandCode[0] === 'ctrl_='){  // control_equals
      Tasks.addTask();
      ret = YES;
    }
    else if (commandCode[0] === 'ctrl_shift_+'){  // control shift plus
      Tasks.duplicateTask();
      ret = YES;
    }
    return NO;
  }
  
});