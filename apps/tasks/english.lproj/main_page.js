// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks sc_require */
sc_require('views/welcome');
sc_require('views/summary');
sc_require('views/task');
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
      layout: { top: 0, left: 0, right: 0, height: 42 },
      backgroundColor: '#DDD',
      borderStyle: SC.BORDER_BOTTOM,
      childViews: [
      
      SC.LabelView.design({
        layout: { centerY: 0, height: 35, left: 2, width: 35 },
        classNames: ['tasks-logo']
      }),
      
      SC.LabelView.design({
        layout: { centerY: 5, height: 30, left: 45, width: 115 },
        fontWeight: SC.BOLD_WEIGHT,
        controlSize: SC.LARGE_CONTROL_SIZE,
        value: "_Tasks".loc() + " v" + Tasks.VERSION
      }),
      
      Tasks.WelcomeView.design({
        layout: { centerY: 0, height: 30, left: 160, width: 110 },
        textAlign: SC.ALIGN_RIGHT,
        controlSize: SC.TINY_CONTROL_SIZE,
        valueBinding: 'Tasks.user'
      }),
      
      SC.ButtonView.design({
        layout: { centerY: 0, height: 24, left: 270, width: 55 },
        title: "_User:".loc(),
        titleMinWidth: 0,
        toolTip: 'Manage Users',
        target: 'Tasks',
        action: 'openUserManager'
      }),
      
      SC.SelectFieldView.design({
        layout: { centerY: 0, height: 24, left: 335, width: 150 },
        nameKey: 'name',
        localize: YES,
        emptyName: "_All Users".loc(), // FIXME: [JH2] fix empty line after this item in dropdown
        objects: Tasks.User.FIXTURES, // TODO: [JH2] bind to a User Controller that pulls users from store
        valueBinding: 'Tasks.assignmentsController.assigneeSelection'
      }),
      
      SC.TextFieldView.design({
        layout: { centerY: 0, height: 16, left: 500, width: 250 },
        hint: "_SearchHint".loc(),
        valueBinding: 'Tasks.assignmentsController.searchFilter'
      }),
      
      SC.ButtonView.design({
        layout: { centerY: 0, height: 24, right: 210, width: 60 },
        title:  "_Import".loc(),
        titleMinWidth: 0,
        toolTip: 'Import Projects/Tasks from a file',
        target: 'Tasks',
        action: 'importData'
      }),

      SC.ButtonView.design({
        layout: { centerY: 0, height: 24, right: 145, width: 60 },
        title:  "_Export".loc(),
        titleMinWidth: 0,
        toolTip: 'Export Projects/Tasks to a file',
        target: 'Tasks',
        action: 'exportData'
      }),
      
      SC.ButtonView.design({
        layout: { centerY: 0, height: 24, right: 80, width: 60 },
        title: "_Save".loc(),
        titleMinWidth: 0,
        // TODO: [SG] add isEnabledBinding to track changes,
        toolTip: 'Save Projects/Tasks',
        target: 'Tasks',
        action: 'saveData'
      }),
      
      SC.ButtonView.design({
        layout: { centerY: 0, height: 24, right: 40, width: 30 },
        title: "?",
        titleMinWidth: 0,
        toolTip: 'Help',
        target: 'Tasks',
        action: 'showHelp'
      }),
      
      SC.ButtonView.design({
        layout: { centerY: 0, height: 24, right: 5, width: 30 },
        title: "X",
        titleMinWidth: 0,
        toolTip: 'Exit',
        target: 'Tasks',
        action: 'exit'
      })
      
      ]
      
    }),
    
    middleView: SC.SplitView.design({
      layout: { top: 42, bottom: 42, left: 0, right: 0 },
      defaultThickness: 100,
      topLeftMaxThickness: 250,
      topLeftMinThickness: 200,
      
      topLeftView: SC.ScrollView.design({
        hasHorizontalScroller: NO,
        borderStyle: SC.BORDER_GRAY,

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

        contentView: SC.SourceListView.design({
          contentValueKey: 'displayName',
          contentBinding: 'Tasks.tasksController.arrangedObjects',
          selectionBinding: 'Tasks.tasksController.selection',
          hasContentIcon: YES,
          contentIconKey: 'icon',
          contentValueEditable: true,
          canReorderContent: true,
          canDeleteContent: true,
          destroyOnRemoval: YES,
          exampleView: Tasks.TaskView
        })
      })
    }),
    
    projectsList: SC.outlet('middleView.topLeftView.childViews.0.contentView'),
    tasksList: SC.outlet('middleView.bottomRightView.childViews.0.contentView'),
    
    bottomView: SC.View.design(SC.Border, {
      layout: { bottom: 0, left: 0, right: 0, height: 42 },
      childViews: 'projectsToolbarView tasksToolbarView'.w(),
      backgroundColor: '#DDD',
      borderStyle: SC.BORDER_TOP,
      
      projectsToolbarView: SC.View.design({
        layout: { top: 0, left: 0, bottom: 0, width: 250 },
        childViews: [
        
        SC.ButtonView.design({
          layout: { centerY: 0, left: 5, height: 24, width: 30 },
          title: "+",
          titleMinWidth: 0,
          toolTip: 'Add Project',
          target: 'Tasks',
          action: 'addProject'
        }),

        SC.ButtonView.design({
          layout: { centerY: 0, left: 40, height: 24, width: 30 },
          title: "-",
          titleMinWidth: 0,
          isEnabledBinding: 'Tasks.projectsController.hasSelection',
          toolTip: 'Delete Project',
          target: 'Tasks',
          action: 'deleteProject'
        }),
        
        Tasks.SummaryView.design({
          layout: { centerY: 2, left: 110, height: 24, width: 90 },
          valueBinding: 'Tasks.assignmentsController.length'
        })
        
        ]
        
      }),
      
      tasksToolbarView: SC.View.design({
        layout: { top: 0, left: 260, bottom: 0, right: 0 },
        childViews: [

        SC.ButtonView.design({
          layout: { centerY: 0, height: 24, left: 5, width: 30 },
          title:  "+",
          titleMinWidth: 0,
          toolTip: 'Add Task',
          target: 'Tasks',
          action: 'addTask'
        }),

        SC.ButtonView.design({
          layout: { centerY: 0, height: 24, left: 40, width: 30 },
          title:  "-",
          titleMinWidth: 0,
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          toolTip: 'Delete Task',
          target: 'Tasks',
          action: 'deleteTask'
        }),
        
        SC.SeparatorView.design({
          layoutDirection: SC.LAYOUT_VERTICAL,
          layout: { top: 5, bottom: 5, left: 85, width: 4 }
        }),

        SC.RadioView.design({
          layout: { centerY: 2, height: 21, left: 105, width: 180 },
          escapeHTML: NO,
          items: [
            { title: '<span class=tasks-priority-high>' + Tasks.TASK_PRIORITY_HIGH + '</span>&nbsp;',
              value: Tasks.TASK_PRIORITY_HIGH },
            { title: '<span class=tasks-priority-medium>' + Tasks.TASK_PRIORITY_MEDIUM + '</span>&nbsp;',
              value: Tasks.TASK_PRIORITY_MEDIUM },
            { title: '<span class=tasks-priority-low>' + Tasks.TASK_PRIORITY_LOW + '</span>&nbsp;',
              value: Tasks.TASK_PRIORITY_LOW }
          ],
          itemTitleKey: 'title',
          itemValueKey: 'value',
          valueBinding: 'Tasks.taskController.priority',
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          layoutDirection: SC.LAYOUT_HORIZONTAL
        }),
        
        SC.SeparatorView.design({
          layoutDirection: SC.LAYOUT_VERTICAL,
          layout: { top: 5, bottom: 5, left: 275, width: 4 }
        }),

        SC.RadioView.design({
          layout: { centerY: 2, height: 21, left: 295, width: 240 },
          escapeHTML: NO,
          items: [
            { title: '<span class=tasks-status-planned>' + Tasks.TASK_STATUS_PLANNED + '</span>&nbsp;',
              value: Tasks.TASK_STATUS_PLANNED },
            { title: '<span class=tasks-status-active>' + Tasks.TASK_STATUS_ACTIVE + '</span>&nbsp;',
              value: Tasks.TASK_STATUS_ACTIVE },
            { title: '<span class=tasks-status-done>' + Tasks.TASK_STATUS_DONE + '</span>&nbsp;',
              value: Tasks.TASK_STATUS_DONE },
            { title: '<span class=tasks-status-risky>' + Tasks.TASK_STATUS_RISKY + '</span>&nbsp;',
              value: Tasks.TASK_STATUS_RISKY }
          ],
          itemTitleKey: 'title',
          itemValueKey: 'value',
          valueBinding: 'Tasks.taskController.status',
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          layoutDirection: SC.LAYOUT_HORIZONTAL
        }),
        
        SC.SeparatorView.design({
          layoutDirection: SC.LAYOUT_VERTICAL,
          layout: { top: 5, bottom: 5, left: 535, width: 4 }
        }),

        SC.RadioView.design({
          layout: { centerY: 2, height: 21, left: 555, width: 220 },
          escapeHTML: NO,
          items: [
            { title: '<span class=tasks-validation-untested>' + Tasks.TASK_VALIDATION_UNTESTED + '</span>&nbsp;',
              value: Tasks.TASK_VALIDATION_UNTESTED },
            { title: '<span class=tasks-validation-passed>' + Tasks.TASK_VALIDATION_PASSED + '</span>&nbsp;',
              value: Tasks.TASK_VALIDATION_PASSED },
            { title: '<span class=tasks-validation-failed>' + Tasks.TASK_VALIDATION_FAILED + '</span>&nbsp;',
              value: Tasks.TASK_VALIDATION_FAILED }
          ],
          itemTitleKey: 'title',
          itemValueKey: 'value',
          valueBinding: 'Tasks.taskController.validation',
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          layoutDirection: SC.LAYOUT_HORIZONTAL
        })
        
        ]
        
      })
      
    })
  })
});
