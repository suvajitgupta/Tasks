// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  Tasks bottom bar.
  
  @extends SC.View
  @author Suvajit Gupta
*/
sc_require('views/display_mode_button');
sc_require('views/summary');

Tasks.TasksBottomBarView = SC.View.extend({

  classNames: ['transparent'],
  
  layout: { bottom: 0, height: 35, left: 0, right: 0 },
  
  childViews: ((Tasks.isMobile? 'displayModeButton ' : 'summaryView serverMessageLabel saveButton ') + 'addTaskButton deleteTaskButton refreshButton').w(),

  addTaskButton: SC.ButtonView.design({
    layout: { centerY: 0, left: 5, height: 24, width: 32 },
    classNames: ['dark'],
    titleMinWidth: 0,
    icon: 'add-icon',
    toolTip: "_AddTaskTooltip".loc(),
    isVisibleBinding: 'CoreTasks.permissions.canCreateTask',
    isEnabledBinding: 'Tasks.tasksController.isAddable',
    action: 'addTask'
  }),
  deleteTaskButton: SC.ButtonView.design(SCUI.Permissible,{
    layout: { centerY: 0, left: 47, height: 24, width: 32 },
    classNames: ['dark'],
    titleMinWidth: 0,
    icon: 'delete-icon',
    toolTip: "_DeleteTaskTooltip".loc(),
    isVisibleBinding: 'CoreTasks.permissions.canDeleteTask',
    isEnabledBinding: SC.Binding.and('Tasks.tasksController.isDeletable', 'Tasks.tasksController.notGuestOrGuestSubmittedTasks'),
    isPermittedBinding: 'Tasks.tasksController.notGuestOrGuestSubmittedTasks',
    action: 'deleteTask'
  }),

  displayModeButton: Tasks.isMobile? Tasks.DisplayModeButtonView.design({
    layout: { centerX: 10, centerY: 0, height: 24, width: 55 }
  }) : null,

  summaryView: Tasks.isMobile? null : Tasks.SummaryView.design({
    layout: { centerY: 0, height: 18, left: 90, width: 400 },
    panelOpenBinding: SC.Binding.oneWay('Tasks*panelOpen'),
    assignmentsSummaryBinding: SC.Binding.oneWay('Tasks.assignmentsController.assignmentsSummary'),
    projectsSelectionBinding: SC.Binding.oneWay('Tasks.projectsController.selection'),
    tasksSelectionBinding: SC.Binding.oneWay('Tasks.tasksController.selection')
  }),

  serverMessageLabel: Tasks.isMobile? null : SC.LabelView.design({
    layout: { centerY: 0, height: 18, right: Tasks.isMobile? 55 : 95, width: 200 },
    classNames: 'bottom-bar-label transparent'.w(),
    escapeHTML: NO,
    icon: '',
    textAlign: SC.ALIGN_RIGHT,
    value: ''
  }),

  saveButton: Tasks.isMobile? null : SC.ButtonView.design({
    layout: { centerY: 0, right: 53, height: 24, width: 32 },
    classNames: ['dark'],
    titleMinWidth: 0,
    icon: 'save-icon',
    toolTip: "_SaveTooltip".loc(),
    isEnabledBinding: 'CoreTasks.needsSave',
    isVisibleBinding: SC.Binding.not('Tasks.autoSave'),
    action: 'save'
  }),
  refreshButton: SC.ButtonView.design({
    layout: { centerY: 0, right: 10, height: 24, width: 32 },
    classNames: ['dark'],
    titleMinWidth: 0,
    icon: 'refresh-icon',
    toolTip: "_RefreshTooltip".loc(),
    action: 'refresh',
    isEnabledBinding: SC.Binding.transform(function(value, binding) {
                                             return value === ''; // when not saving, shown via progress icon
                                           }).from('Tasks.mainPage.serverMessageLabel.icon')
  })

});
