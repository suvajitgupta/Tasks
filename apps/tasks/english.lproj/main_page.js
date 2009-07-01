// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */
require('views/summary');
require('views/task');
/** @namespace

  This page describes the main user interface for the Tasks application.
  
  @extends SC.Object
  @author Suvajit Gupta
  @author Joshua Holt
*/

Tasks.mainPage = SC.Page.design({

  mainPane: SC.MainPane.design({
    
    childViews: 'topView middleView bottomView'.w(),
    
    topView: SC.View.design(SC.Border, {
      layout: { top: 0, left: 10, right: 0, height: 42 },
      childViews: 'appIconView appTitleView summaryView'.w(),
      borderStyle: SC.BORDER_BOTTOM,
      
      appIconView: SC.LabelView.design({
        layout: { centerY: 0, height: 40, left: 2, width: 200 },
        classNames: ['tasks-logo']
      }),
      
      appTitleView: SC.LabelView.design({
        layout: { top: 8, height: 40, left: 55, width: 200 },
        controlSize: SC.LARGE_CONTROL_SIZE,
        fontWeight: SC.BOLD_WEIGHT,
        value: "_Tasks".loc() + " v" + Tasks.VERSION
      }),
      
      summaryView: Tasks.SummaryView.design({ // TODO: make this a hover over on Tasks label?
        layout: { top: 12, height: 40, left: 185, width: 100 },
        valueBinding: 'Tasks.projectsController.length'
      })
    }),
    
    middleView: SC.SplitView.design({
      layout: { top: 42, bottom: 42, left: 0, right: 0 },
      defaultThickness: 100,
      topLeftMaxThickness: 250,
      topLeftMinThickness: 200,
      
      topLeftView: SC.ScrollView.design({
        hasHorizontalScroller: NO,
        borderStyle: SC.BORDER_GRAY,
        backgroundColor: 'blue',

        contentView: SC.ListView.design({
          contentValueKey: 'displayName',
          contentBinding: 'Tasks.projectsController.arrangedObjects',
          selectionBinding: 'Tasks.projectsController.selection',
          hasContentIcon: YES,
          contentIconKey:  'icon',
          contentValueEditable: true,
          canReorderContent: true,
          canDeleteContent: true,
          destroyOnRemoval: YES
        })
      }),
      
      bottomRightView: SC.ScrollView.design({
        hasHorizontalScroller: NO,
        borderStyle: SC.BORDER_GRAY,
        backgroundColor: 'blue',

        contentView: SC.SourceListView.design({
          classNames: 'task-source-list'.w(),
          contentValueKey: 'displayName',
          contentBinding: 'Tasks.tasksController.arrangedObjects',
          selectionBinding: 'Tasks.tasksController.selection',
          hasContentIcon: YES,   // TODO: figure out how to display icons for Assignee (User).
          contentIconKey: 'icon',
          contentValueEditable: true,
          canReorderContent: true,
          canDeleteContent: true,
          destroyOnRemoval: YES,
          exampleView: Tasks.TaskView
        })
      })
    }),
    
    // for use in selecting first project at starup
    projectsList: SC.outlet('middleView.topLeftView.childViews.0.contentView'),
    
    bottomView: SC.View.design(SC.Border, {
      layout: { bottom: 0, left: 0, right: 0, height: 41 },
      childViews: 'projectsToolbarView tasksToolbarView'.w(),
      borderStyle: SC.BORDER_TOP,
      
      projectsToolbarView: SC.View.design({
        layout: { top: 0, left: 0, bottom: 0, width: 250 },
        childViews: 'addProjectButtonView deleteProjectButtonView importButtonView exportButtonView'.w(),
        
        addProjectButtonView: SC.ButtonView.design({
          layout: { centerY: 0, left: 15, height: 21, width: 30 },
          title: "+",
          titleMinWidth: 0,
          target: 'Tasks',
          action: 'addProject'
        }),

        deleteProjectButtonView: SC.ButtonView.design({
          layout: { centerY: 0, left: 50, height: 21, width: 30 },
          title: "-",
          titleMinWidth: 0,
          isEnabledBinding: 'Tasks.projectsController.hasSelection',
          target: 'Tasks',
          action: 'deleteProject'
        }),

        importButtonView: SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 100, width: 55 },
          title:  "_Import".loc(),
          titleMinWidth: 0,
          target: 'Tasks',
          action: 'importData'
        }),

        exportButtonView: SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 160, width: 55 },
          title:  "_Export".loc(),
          titleMinWidth: 0,
          target: 'Tasks',
          action: 'exportData'
        })
        
      }),
      
      tasksToolbarView: SC.View.design({
        layout: { top: 0, left: 265, bottom: 0, right: 0 },
        childViews: 'addTaskButtonView deleteTaskButtonView taskPriorityView taskStatusView taskValidationView'.w(), 

        addTaskButtonView: SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 7, width: 30 },
          title:  "+",
          titleMinWidth: 0,
          target: 'Tasks',
          action: 'addTask'
        }),

        deleteTaskButtonView: SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 42, width: 30 },
          title:  "-",
          titleMinWidth: 0,
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          target: 'Tasks',
          action: 'deleteTask'
        }),
        
        taskPriorityView: SC.RadioView.design({
          layout: { centerY: 0, height: 21, left: 150, width: 180 },
          escapeHTML: NO,
          items: [
            { title: '<span class=tasks-priority-high>' + Tasks.TASK_PRIORITY_HIGH + '</span>', value: Tasks.TASK_PRIORITY_HIGH },
            { title: '<span class=tasks-priority-medium>' + Tasks.TASK_PRIORITY_MEDIUM + '</span>', value: Tasks.TASK_PRIORITY_MEDIUM },
            { title: '<span class=tasks-priority-low>' + Tasks.TASK_PRIORITY_LOW + '</span>', value: Tasks.TASK_PRIORITY_LOW }
          ],
          itemTitleKey: 'title',
          itemValueKey: 'value',
          valueBinding: 'Tasks.taskController.priority',
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          layoutDirection: SC.LAYOUT_HORIZONTAL
        }),
        
        taskStatusView: SC.RadioView.design({
          layout: { centerY: 0, height: 21, left: 360, width: 240 },
          escapeHTML: NO,
          items: [
            { title: '<span class=tasks-status-planned>' + Tasks.TASK_STATUS_PLANNED + '</span>', value: Tasks.TASK_STATUS_PLANNED },
            { title: '<span class=tasks-status-active>' + Tasks.TASK_STATUS_ACTIVE + '</span>', value: Tasks.TASK_STATUS_ACTIVE },
            { title: '<span class=tasks-status-done>' + Tasks.TASK_STATUS_DONE + '</span>', value: Tasks.TASK_STATUS_DONE },
            { title: '<span class=tasks-status-risky>' + Tasks.TASK_STATUS_RISKY + '</span>', value: Tasks.TASK_STATUS_RISKY }
          ],
          itemTitleKey: 'title',
          itemValueKey: 'value',
          valueBinding: 'Tasks.taskController.status',
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          layoutDirection: SC.LAYOUT_HORIZONTAL
        }),
        
        taskValidationView: SC.RadioView.design({
          layout: { centerY: 0, height: 21, left: 660, width: 220 },
          escapeHTML: NO,
          items: [
            { title: '<span class=tasks-validation-untested>' + Tasks.TASK_VALIDATION_UNTESTED + '</span>', value: Tasks.TASK_VALIDATION_UNTESTED },
            { title: '<span class=tasks-validation-passed>' + Tasks.TASK_VALIDATION_PASSED + '</span>', value: Tasks.TASK_VALIDATION_PASSED },
            { title: '<span class=tasks-validation-failed>' + Tasks.TASK_VALIDATION_FAILED + '</span>', value: Tasks.TASK_VALIDATION_FAILED }
          ],
          itemTitleKey: 'title',
          itemValueKey: 'value',
          valueBinding: 'Tasks.taskController.validation',
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          layoutDirection: SC.LAYOUT_HORIZONTAL
        })
        
      })
      
    })
  })
});
