// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks sc_require */
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
      borderStyle: SC.BORDER_BOTTOM,
      childViews: [
      
      SC.LabelView.design({
        layout: { centerY: 0, height: 35, left: 2, width: 40 },
        classNames: ['tasks-logo']
      }),
      
      SC.LabelView.design({
        layout: { centerY: 0, height: 30, left: 55, width: 150 },
        controlSize: SC.LARGE_CONTROL_SIZE,
        fontWeight: SC.BOLD_WEIGHT,
        value: "_Tasks".loc() + " v" + Tasks.VERSION
      }),
      
      Tasks.SummaryView.design({ // TODO: [SG] make this a hover over on Tasks label
        layout: { centerY: 0, height: 20, left: 185, width: 100 },
        valueBinding: 'Tasks.projectsController.length'
      }),

      SC.ButtonView.design({
        layout: { centerY: 0, height: 21, right: 10, width: 55 },
        title: "Save",
        titleMinWidth: 0,
        // TODO: add isEnabledBinding to track changes,
        target: 'Tasks',
        action: 'saveData'
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
    
    // for use in selecting first project at starup
    projectsList: SC.outlet('middleView.topLeftView.childViews.0.contentView'),
    
    bottomView: SC.View.design(SC.Border, {
      layout: { bottom: 0, left: 0, right: 0, height: 41 },
      childViews: 'projectsToolbarView tasksToolbarView'.w(),
      borderStyle: SC.BORDER_TOP,
      
      projectsToolbarView: SC.View.design({
        layout: { top: 0, left: 0, bottom: 0, width: 250 },
        childViews: [
        
        SC.ButtonView.design({
          layout: { centerY: 0, left: 15, height: 21, width: 30 },
          title: "+",
          titleMinWidth: 0,
          target: 'Tasks',
          action: 'addProject'
        }),

        SC.ButtonView.design({
          layout: { centerY: 0, left: 50, height: 21, width: 30 },
          title: "-",
          titleMinWidth: 0,
          isEnabledBinding: 'Tasks.projectsController.hasSelection',
          target: 'Tasks',
          action: 'deleteProject'
        }),

        SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 100, width: 55 },
          title:  "_Import".loc(),
          titleMinWidth: 0,
          target: 'Tasks',
          action: 'importData'
        }),

        SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 160, width: 55 },
          title:  "_Export".loc(),
          titleMinWidth: 0,
          target: 'Tasks',
          action: 'exportData'
        })
        
        ]
        
      }),
      
      tasksToolbarView: SC.View.design({
        layout: { top: 0, left: 265, bottom: 0, right: 0 },
        childViews: [

        SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 7, width: 30 },
          title:  "+",
          titleMinWidth: 0,
          target: 'Tasks',
          action: 'addTask'
        }),

        SC.ButtonView.design({
          layout: { centerY: 0, height: 21, left: 42, width: 30 },
          title:  "-",
          titleMinWidth: 0,
          isEnabledBinding: 'Tasks.tasksController.hasSelection',
          target: 'Tasks',
          action: 'deleteTask'
        }),
        
        SC.RadioView.design({
          layout: { centerY: 0, height: 21, left: 110, width: 180 },
          escapeHTML: NO,
          items: [
            { title: '<span class=tasks-priority-high>' + Tasks.TASK_PRIORITY_HIGH + '</span>',
              value: Tasks.TASK_PRIORITY_HIGH },
            { title: '<span class=tasks-priority-medium>' + Tasks.TASK_PRIORITY_MEDIUM + '</span>',
              value: Tasks.TASK_PRIORITY_MEDIUM },
            { title: '<span class=tasks-priority-low>' + Tasks.TASK_PRIORITY_LOW + '</span>',
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
          layout: { top: 5, bottom: 5, left: 280, width: 4 }
        }),

        SC.RadioView.design({
          layout: { centerY: 0, height: 21, left: 300, width: 240 },
          escapeHTML: NO,
          items: [
            { title: '<span class=tasks-status-planned>' + Tasks.TASK_STATUS_PLANNED + '</span>',
              value: Tasks.TASK_STATUS_PLANNED },
            { title: '<span class=tasks-status-active>' + Tasks.TASK_STATUS_ACTIVE + '</span>',
              value: Tasks.TASK_STATUS_ACTIVE },
            { title: '<span class=tasks-status-done>' + Tasks.TASK_STATUS_DONE + '</span>',
              value: Tasks.TASK_STATUS_DONE },
            { title: '<span class=tasks-status-risky>' + Tasks.TASK_STATUS_RISKY + '</span>',
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
          layout: { top: 5, bottom: 5, left: 540, width: 4 }
        }),

        SC.RadioView.design({
          layout: { centerY: 0, height: 21, left: 560, width: 220 },
          escapeHTML: NO,
          items: [
            { title: '<span class=tasks-validation-untested>' + Tasks.TASK_VALIDATION_UNTESTED + '</span>',
              value: Tasks.TASK_VALIDATION_UNTESTED },
            { title: '<span class=tasks-validation-passed>' + Tasks.TASK_VALIDATION_PASSED + '</span>',
              value: Tasks.TASK_VALIDATION_PASSED },
            { title: '<span class=tasks-validation-failed>' + Tasks.TASK_VALIDATION_FAILED + '</span>',
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
