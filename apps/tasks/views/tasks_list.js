// Project: Tasks 
// ==========================================================================
/*globals Tasks sc_require*/
/** 

  Scrollable Projects List view.
  
  @extends SC.ScrollView
  @author Suvajit Gupta
*/
sc_require('views/list');
sc_require('views/assignee_item');
sc_require('views/project_item');

Tasks.TasksListView = SC.ScrollView.extend({
    
  contentView: Tasks.ListView.design({
    
    classNames: ['tasks-pane'],
    contentValueKey: 'displayName',
    contentUnreadCountKey: 'displayEffort',
    contentBinding: SC.Binding.oneWay('Tasks.tasksController.arrangedObjects'),
    selectionBinding: 'Tasks.tasksController.selection',
    localize: YES,
    rowHeight: 24,
    hasContentIcon: Tasks.softwareMode || Tasks.isMobile,
    contentIconKey: 'icon',
    exampleView: Tasks.TaskItemView,
    groupExampleView: Tasks.AssigneeItemView,
    isEditable: YES,
    allowDeselectAll: YES,
    canEditContent: YES,
    canReorderContent: YES,
    canDeleteContent: YES,
    destroyOnRemoval: YES,
    selectOnMouseDown: YES,
    delegate: Tasks.tasksController,

    firstHeaderRowHeight: 32,
    headerRowHeight: 40,
    rowDelegate: function() {
      return this;
    }.property().cacheable(),
    customRowHeightIndexes: function() {
      return SC.IndexSet.create(0, this.get('length'));
    }.property('length').cacheable(),
    contentIndexRowHeight: function(view, content, idx) {
      // All header rows (except first one) should use headerRowHeight
      var isGroup = this.get('contentDelegate').contentIndexIsGroup(this, content, idx);
      if(isGroup) return idx === 0? this.get('firstHeaderRowHeight') : this.get('headerRowHeight');
      else return this.get('rowHeight');
    },
    _contentDidChange: function() { // Force TasksList indexes to be recomputed when content changes
      var len = this.getPath('content.length');
      // console.log('DEBUG: recomputing TasksList row heights with length=' + len);
      this.rowHeightDidChangeForIndexes(SC.IndexSet.create(0, len));
    }.observes('content'),

    selectionEvent: null,
    mouseDown: function(event) {
      var ret = sc_super();
      if(event.which === 3) { // right click
        this.set('selectionEvent', event);
        this.invokeLast('popupContextMenu');
      }
      return ret;
    },
    popupContextMenu: function() {
      var items = Tasks.TaskItemView.buildContextMenu();
      if(items.length > 0) {
        var pane = SCUI.ContextMenuPane.create({
          contentView: SC.View.design({}),
          layout: { width: 180, height: 0 },
          escapeHTML: NO,
          itemTitleKey: 'title',
          itemIconKey: 'icon',
          itemIsEnabledKey: 'isEnabled',
          itemTargetKey: 'target',
          itemActionKey: 'action',
          itemSeparatorKey: 'isSeparator',
          itemCheckboxKey: 'checkbox',
          items: items        
        });
        pane.popup(this, this.get('selectionEvent')); // pass in the mouse event so the pane can figure out where to put itself
      }
    },

    /* Helper image display logic:
        No projects selected - "select project" helper
      	Single project selected:
      	  if project has no tasks:
      		  addTask enabled - "add tasks tasks" helper
        		else - "display mode" helper
        	else project has tasks
    		    if no tasks filtering through - "adjust filter" helper
      	Multiple projects selected
      		if projec
      		ts have tasks:
      		  if no tasks filtering through - "adjust filter" helper
  	*/
    render: function(context, firstTime) {
      
      // console.log('DEBUG: TasksList render() loginTime=' + Tasks.get('loginTime'));

      sc_super();
      if(Tasks.get('loginTime')) return;
      var sel = Tasks.projectsController.get('selection');
      var selectedProjectsCount = sel? sel.get('length') : 0;
      if(selectedProjectsCount === 0) { // No projects selected
        context.addClass('helper-select-project');
        return;
      }
      else if(selectedProjectsCount === 1) { // Single project selected
        if(sel.getPath('firstObject.tasks.length') === 0) { // Project has no tasks
          if(Tasks.tasksController.isAddable()) context.addClass('helper-add-tasks');
          else if(Tasks.assignmentsController.get('displayMode') === Tasks.DISPLAY_MODE_TEAM) context.addClass('helper-display-mode');
          return;
        }
        else { // Project has tasks
          if(this.getPath('content.length') === 0) { // No tasks filtering through
            context.addClass('helper-adjust-filter');
            return;
          }
        }
      }
      else { // Multiple projects selected
        var tasksCount = 0;
        var ctx = {};
        for (var i = 0; i < selectedProjectsCount; i++) {
          var project = sel.nextObject(i, null, ctx);
          tasksCount += project.getPath('tasks.length');
        }
        if(tasksCount > 0) { // Projects have tasks
          if(this.getPath('content.length') === 0) { // No tasks filtering through
            context.addClass('helper-adjust-filter');
            return;
          }
        }
      }

      // Remove helper images (if any) and render tasks
      context.removeClass('helper-add-tasks');
      context.removeClass('helper-display-mode');
      context.removeClass('helper-adjust-filter');
    },
    
    // Hotkeys - be careful to avoid conflicts with browser shortcuts!
    keyDown: function(event) {
      var ret = NO, commandCode = event.commandCodes();
      // console.log('DEBUG: hotkey "' + commandCode[0] + '" pressed');
      if(commandCode[0] === 'ctrl_left' && Tasks.mainPageHelper.get('showProjectsList')) {
        Tasks.mainPageHelper.set('showProjectsList', NO);
        ret = YES;
      }
      else if(commandCode[0] === 'ctrl_right' && !Tasks.mainPageHelper.get('showProjectsList')) {
        Tasks.mainPageHelper.set('showProjectsList', YES);
        ret = YES;
      }
      else if(commandCode[0] === 'left') {
        Tasks.getPath('mainPage.projectsListView').becomeFirstResponder();
        ret = YES;
      }
      else if(commandCode[0] === 'right') {
        var sel = Tasks.getPath('tasksController.selection');
        var singleSelect = (sel && sel.get('length') === 1);
        if(singleSelect) {
          var task = sel.get('firstObject');
          if(task) Tasks.taskEditorView.popup(task);
        }
        ret = YES;
      }
      else if(commandCode[0] === 'ctrl_='){  // control equals
        Tasks.statechart.sendEvent('addTask');
        ret = YES;
      }
      else if(commandCode[0] === 'ctrl_shift_=' || commandCode[0] === 'ctrl_shift_+') {  // control shift equals (Safari) or plus (Firefox)
        Tasks.statechart.sendEvent('duplicateTask');
        ret = YES;
      }
      else {
        ret = sc_super();
      }
      return ret;
    }

  })
  
});
