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
    
    bottomView: SC.View.design(SC.Border, {
      layout: { bottom: 0, left: 0, right: 0, height: 41 },
      childViews: 'projectsToolbarView tasksToolbarView'.w(),
      borderStyle: SC.BORDER_TOP,
      
      projectsToolbarView: SC.View.design({
        layout: { top: 0, left: 0, bottom: 0, width: 250 },
        childViews: 'addProjectButtonView deleteProjectButtonView importButtonView exportButtonView'.w(),
        
        addProjectButtonView: SC.ButtonView.design({
          layout: { centerY: 0, left: 8, height: 21, width: 30 },
          title: "+",
          titleMinWidth: 0,
          fontSize: 10,
          target: 'Tasks',
          action: 'addProject'
        }),

        deleteProjectButtonView: SC.ButtonView.design({
          layout: { centerY: 0, left: 43, height: 21, width: 30 },
          title: "-",
          titleMinWidth: 0,
          isEnabledBinding: 'Tasks.projectsController.hasSelection',
          fontSize: 10,
          target: 'Tasks',
          action: 'deleteProject'
        }),

        importButtonView: SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 88, width: 55 },
          title:  "_Import".loc(),
          titleMinWidth: 0,
          fontSize: 10,
          target: 'Tasks',
          action: 'importData'
        }),

        exportButtonView: SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 148, width: 55 },
          title:  "_Export".loc(),
          titleMinWidth: 0,
          fontSize: 10,
          target: 'Tasks',
          action: 'exportData'
        })
        
      }),
      
      tasksToolbarView: SC.View.design({
        layout: { top: 0, left: 265, bottom: 0, right: 0 },
        childViews: 'addTaskButtonView deleteTaskButtonView taskPriorityView taskStatusView taskValidationView'.w(), 

        addTaskButtonView: SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 0, width: 30 },
          title:  "+",
          titleMinWidth: 0,
          fontSize: 10,
          target: 'Tasks',
          action: 'addTask'
        }),

        deleteTaskButtonView: SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 35, width: 30 },
          title:  "-",
          titleMinWidth: 0,
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          fontSize: 10,
          target: 'Tasks',
          action: 'deleteTask'
        }),
        
        taskPriorityView: SC.RadioView.design({
          layout: { centerY: 0, height: 21, left: 150, width: 180 },
          items: [Tasks.TASK_PRIORITY_HIGH, Tasks.TASK_PRIORITY_MEDIUM, Tasks.TASK_PRIORITY_LOW],
          valueBinding: 'Tasks.tasksController.selection.priority',
          fontSize: 10,
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          layoutDirection: SC.LAYOUT_HORIZONTAL
        }),
        
        taskStatusView: SC.RadioView.design({
          layout: { centerY: 0, height: 21, left: 360, width: 240 },
          items: [Tasks.TASK_STATUS_PLANNED, Tasks.TASK_STATUS_ACTIVE, Tasks.TASK_STATUS_DONE, Tasks.TASK_STATUS_RISKY],
          valueBinding: 'Tasks.tasksController.selection.status',
          fontSize: 10,
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          layoutDirection: SC.LAYOUT_HORIZONTAL
        }),
        
        taskValidationView: SC.RadioView.design({
          layout: { centerY: 0, height: 21, left: 660, width: 200 },
          items: [Tasks.TASK_VALIDATION_UNTESTED, Tasks.TASK_VALIDATION_PASSED, Tasks.TASK_VALIDATION_FAILED],
          valueBinding: 'Tasks.tasksController.selection.validation',
          fontSize: 10,
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          layoutDirection: SC.LAYOUT_HORIZONTAL
        })
        
      })
      
    })
  })
});
