// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks CoreTasks sc_require*/

/** 

  Task details editor.
  
  @extends SC.View
  @author Suvajit Gupta
*/
sc_require('views/task_editor_helper');
sc_require('views/task_editor_overview');
sc_require('views/task_editor_description');

Tasks.TaskEditorView = SC.View.extend(
/** @scope Tasks.TaskEditorView.prototype */ {
  
  task: null,
  titleBarHeight: 40,
  minWidth: 725,
  minHeight: 310,
  
  _computeTaskPosition: function(task) {
    var tasks = Tasks.getPath('tasksController.arrangedObjects');
    var idx = tasks.indexOf(task);
    if(idx === -1) return null;
    var len = tasks.get('length');
    var groupIndexes = tasks.contentGroupIndexes(null, tasks);
    var tasksCount = 0, groupsBeforeTaskCount = 0;
    for (var i = 0; i < len; i++) {
      if (groupIndexes.contains(i)) {
        if(i < idx) groupsBeforeTaskCount++;
      }
      else {
        tasksCount++;
      }
    }
    var current = idx-groupsBeforeTaskCount+1;
    // console.log('len=' + len + ', idx=' + idx + '; current=' + current + ', total=' + tasksCount);
    return { current: current, total: tasksCount };
  },
  
  _preEditing: function() {
    var task = this.get('task');
    // console.log('DEBUG: preEditing task: ' + task.get('name'));
    var editor = this.get('editor');
    var position = this._computeTaskPosition(task);
    var positionLabel = position? (position.current + "_of".loc() + position.total) : '';
    editor.setPath('positionLabel.value', positionLabel);
    editor.setPath('idLabel.value', "_Task".loc() + ' ' + task.get('displayId'));
    this._watches = CoreTasks.getTaskWatches(task);
    this._watching = CoreTasks.isCurrentUserWatchingTask(task);
    editor.setPath('watchingCheckbox.value', this._watching? true : false);
    editor.setPath('watchersButton.title', '' + this._watches.length);
    editor.setPath('watchersButton.isEnabled', this._watches.length > 0);
    this.setPath('overviewView.nameField.value', task.get('name'));
    var that = this;
    if(Tasks.getPath('tasksController.isEditable')) {
      this.invokeLater(function() { that.getPath('overviewView.nameField').becomeFirstResponder(); }, 400);
    }
    this.setPath('overviewView.typeField.value', task.get('type'));
    this.setPath('overviewView.priorityField.value', task.get('priority'));
    this.setPath('overviewView.statusField.value', task.get('developmentStatus'));
    this.setPath('overviewView.validationField.value', task.get('validation'));
    this.setPath('overviewView.effortField.value', task.get('effort'));
    this.setPath('overviewView.projectField.value', task.get('projectValue'));
    this.setPath('overviewView.submitterField.value', task.get('submitterValue'));
    this.setPath('overviewView.assigneeField.value', task.get('assigneeValue'));
    this.setPath('descriptionView.descriptionField.value', task.get('description'));
    if(!Tasks.isMobile) {
      editor.setPath('createdAtLabel.value', task.get('displayCreatedAt'));
      editor.setPath('updatedAtLabel.value', task.get('displayUpdatedAt'));
    }
  },
  
  _postEditing: function() {
    Tasks.commentsController.set('selection', '');
    var task = this.get('task');
    // console.log('DEBUG: postEditing task: ' + task.get('name'));
    var editor = this.get('editor');
    var name = this.getPath('overviewView.nameField.value');
    if(/^\s*$/.test(name) || name === CoreTasks.NEW_TASK_NAME.loc()) {
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
      task.setIfChanged('type', this.getPath('overviewView.typeField.value'));
      task.setIfChanged('priority', this.getPath('overviewView.priorityField.value'));
      task.setIfChanged('developmentStatus', this.getPath('overviewView.statusField.value'));
      task.setIfChanged('validation', this.getPath('overviewView.validationField.value'));
      task.setIfChanged('effortValue', this.getPath('overviewView.effortField.value'));
      task.setIfChanged('projectValue', this.getPath('overviewView.projectField.value'));
      task.setIfChanged('submitterValue', this.getPath('overviewView.submitterField.value'));
      task.setIfChanged('assigneeValue', this.getPath('overviewView.assigneeField.value'));
      task.setIfChanged('displayName', name);
      var description = CoreTasks.stripDescriptionPrefixes(this.getPath('descriptionView.descriptionField.value'));
      task.setIfChanged('description', description);
    }
    if(CoreTasks.get('needsSave')) Tasks.assignmentsController.computeTasks();
  },
  
  popup: function(task) {
    if(Tasks.get('panelOpen') === Tasks.TASK_EDITOR) {
      this._postEditing();
    }
    else {
      Tasks.statechart.sendEvent('showTaskEditor');
      Tasks.setPath('mainPage.tasksSceneView.nowShowing', 'taskEditor');
      Tasks.set('panelOpen', Tasks.TASK_EDITOR);
    }
    this.set('task', task);
    this._preEditing();
    // reselect task since selection is lost when tasks list slides out of view
    this.invokeLast(function() { Tasks.tasksController.selectObject(task); });
  },
  
  close: function() {
    Tasks.set('panelOpen', null);
    this._postEditing();
    if(Tasks.get('autoSave') && !CoreTasks.get('isSaving')) Tasks.saveChanges();
    Tasks.setPath('mainPage.tasksSceneView.nowShowing', 'tasksList');
    this.invokeLater(function() { Tasks.getPath('mainPage.tasksListView').becomeFirstResponder(); }, 400);
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
     contentView: SC.ScrollView.design({
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
   Tasks.getPath('mainPage.tasksListView').selectPreviousItem();
   SC.RunLoop.end();
   this.set('task', Tasks.tasksController.getPath('selection.firstObject'));
   this._preEditing();
 },
 
 gotoNextTask: function() {
   this._postEditing();
   SC.RunLoop.begin();
   Tasks.getPath('mainPage.tasksListView').selectNextItem();
   SC.RunLoop.end();
   this.set('task', Tasks.tasksController.getPath('selection.firstObject'));
   this._preEditing();
 },
  
 editComment: function() {
   var commentsListView = this.editor.splitView.bottomRightView.commentsList.contentView;
   var commentView = commentsListView.itemViewForContentIndex(0);
   SC.run(function() { commentsListView.scrollToContentIndex(0); });
   commentView.editDescription();
 },
  
 childViews: 'editor'.w(),
 
 editor: SC.View.design({
   
   childViews: ((Tasks.isMobile? 'tabView ' : 'positionLabel overviewView splitView separatorView createdAtLabel updatedAtLabel watchingCheckbox watchersButton ') + 'idLabel showTasksListButton gotoPreviousTaskButton gotoNextTaskButton').w(),
   classNames: ['task-editor'],

   idLabel: SC.LabelView.design({
     layout: { left: 0, right: 0, top: 0, height: 24 },
     classNames: 'task-title'.w()
   }),
   
   showTasksListButton: SC.View.design(SCUI.SimpleButton, {
     layout: { top: 2, left: 10, width: 32, height: 20 },
     classNames: ['back-icon'],
     toolTip: "_ShowTasksList".loc(),
     action: 'showTasksList'
    }),

   gotoPreviousTaskButton: SC.View.design(SCUI.SimpleButton, {
     layout: { top: 2, right: 48, width: 24, height: 20 },
     classNames: ['previous-icon'],
     toolTip: "_GotoPreviousTask".loc(),
     action: 'gotoPreviousTask',
     isEnabledBinding: SC.Binding.transform(function(value, binding) {
                                              var task = value.getPath('firstObject');
                                              var tasks = Tasks.getPath('tasksController.arrangedObjects');
                                              if(!tasks) return false;
                                              var idx = tasks.indexOf(task);
                                              var groupIndexes = tasks.contentGroupIndexes(null, tasks);
                                              for (--idx; idx >= 0; idx--) {
                                                if (!groupIndexes.contains(idx)) return true;
                                              }
                                              return false;
                                            }).from('Tasks*tasksController.selection')
   }),
   gotoNextTaskButton: SC.View.design(SCUI.SimpleButton, {
     layout: { top: 2, right: 10, width: 24, height: 20 },
     classNames: ['next-icon'],
     toolTip: "_GotoNextTask".loc(),
     action: 'gotoNextTask',
     isEnabledBinding: SC.Binding.transform(function(value, binding) {
                                              var task = value.getPath('firstObject');
                                              var tasks = Tasks.getPath('tasksController.arrangedObjects');
                                              if(!tasks) return false;
                                              var idx = tasks.indexOf(task);
                                              var len = tasks.get('length') - 1;
                                              if(idx === len) return false;
                                              return true;
                                            }).from('Tasks*tasksController.selection')
   }),

   positionLabel: Tasks.isMobile? null : SC.LabelView.design({
     layout: { width: 100, right: 85, top: 5, height: 16 },
     textAlign: SC.ALIGN_RIGHT
   }),
   
   tabView: Tasks.isMobile? SC.TabView.design({
     layout: { left: 1, right: 1, bottom: 2, top: 35 },
     itemTitleKey: 'title',
     itemValueKey: 'value',
     items: [
       { title: "_Overview".loc(), value: 'Tasks.taskEditorOverviewView' },
       { title: "_Description".loc(),  value: 'Tasks.taskEditorDescriptionView' }
     ],
     nowShowing: 'Tasks.taskEditorOverviewView'
   }) : null,
   
   overviewView: Tasks.isMobile? null : Tasks.TaskEditorOverviewView.design(),
   
   splitView: Tasks.isMobile? null : SC.SplitView.design({
     layout: { top: 165, left: 10, bottom: 40, right: 10 },
     layoutDirection: SC.LAYOUT_VERTICAL,
     defaultThickness: Tasks.isMobile? 0.99 : 0.5,
     topLeftMinThickness: 75,
     bottomRightMinThickness: 75,
     
     topLeftView: Tasks.TaskEditorDescriptionView.design(),
     
     bottomRightView: Tasks.isMobile? SC.View.design() : SC.View.design({
       classNames: ['comments-view'],
       childViews: 'commentButton commentImage commentsList'.w(),
       mouseDown: function() {
         Tasks.commentsController.set('selection', '');
       },
       commentButton: SC.ButtonView.design({
         layout: { top: 8, centerX: 0, height: 24, width: 90 },
         title: "_Comment".loc(),
         action: 'addComment',
         toolTip: "_CommentTooltip".loc()
       }),
       commentImage: SC.ImageView.design({
         layout: { top: -1, centerX: 50, height: 16, width: 16 },
         value: 'comment-icon'
       }),
       commentsList: SC.ScrollView.design({
         layout: { top: 35, left: 0, right: 0, bottom: 0 },
           hasHorizontalScroller: NO, // disable horizontal scrolling
           contentView: SC.StackedView.design({
            contentBinding: 'Tasks.commentsController.arrangedObjects',
            classNames: ['comments-list'],
            selectionBinding: 'Tasks.commentsController.selection',
            allowDeselectAll: YES,
            exampleView: Tasks.CommentItemView
          })
        })
     })
   }),
   
   separatorView: Tasks.isMobile? null : SC.View.design({
     layout: { left: 5, right: 5, height: 2, bottom: 33 },
     classNames: [ 'separator']
   }),

   createdAtLabel: Tasks.isMobile? null : SC.LabelView.design({
     layout: { left: 10, bottom: 10, height: 17, width: 250 },
     classNames: [ 'date-time'],
     textAlign: SC.ALIGN_LEFT
   }),
   updatedAtLabel: Tasks.isMobile? null : SC.LabelView.design({
     layout: { right: 10, bottom: 10, height: 17, width: 250 },
     classNames: [ 'date-time'],
     textAlign: SC.ALIGN_RIGHT
   }),

   watchingCheckbox: Tasks.isMobile? null : SC.CheckboxView.design({
     layout: { centerX: -35, bottom: 10, height: 16, width: 80 },
     title: "_Watch".loc()
   }),
   watchersButton: Tasks.isMobile? null : SC.ButtonView.design({
     layout: { centerX: 35, bottom: 6, height: 24, width: 80 },
     icon: 'watches-icon',
     fontWeight: SC.BOLD_WEIGHT,
     action: 'showWatchers',
     toolTip: "_TaskWatchersTooltip".loc()
   })
   
  }),
  
  overviewView: Tasks.isMobile? Tasks.taskEditorOverviewView : SC.outlet('editor.overviewView'),
  descriptionView: Tasks.isMobile? Tasks.taskEditorDescriptionView : SC.outlet('editor.splitView.topLeftView'),
  commentsList: SC.outlet('editor.splitView.bottomRightView.commentsList.contentView'),
  commentButton: SC.outlet('editor.splitView.bottomRightView.commentButton'),

  keyDown: function(event) {
    var ret = NO, commandCode = event.commandCodes();
    // console.log('DEBUG: hotkey "' + commandCode[0] + '" pressed');
    if (commandCode[0] === 'return' || commandCode[0] === 'escape') {
      Tasks.statechart.sendEvent('showTasksList');
    }
    else if (commandCode[0] === 'ctrl_='){  // control_equals
      Tasks.statechart.sendEvent('addTask');
    }
    else if (commandCode[0] === 'ctrl_shift_+'){  // control shift plus
      Tasks.duplicateTask();
    }
    return NO;
  }
  
});