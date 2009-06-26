// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

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
      childViews: 'iconView labelView summaryView'.w(),
      borderStyle: SC.BORDER_BOTTOM,
      
      iconView: SC.LabelView.design({
        layout: { centerY: 0, height: 40, left: 2, width: 200 },
        classNames: ['tasks-logo']
      }),
      
      labelView: SC.LabelView.design({
        layout: { top: 8, height: 40, left: 55, width: 200 },
        controlSize: SC.LARGE_CONTROL_SIZE,
        fontWeight: SC.BOLD_WEIGHT,
        value: "_Tasks".loc() + " v" + Tasks.VERSION
      }),
      
      summaryView: SC.LabelView.design({ // TODO: make this a hover over on Tasks label
        layout: { top: 10, height: 40, left: 165, width: 100 },
				valueBinding: 'Tasks.projectsController.summary'
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
          destroyOnRemoval: YES
        })
      })
    }),
    
    bottomView: SC.View.design(SC.Border, {
      layout: { bottom: 0, left: 0, right: 0, height: 41 },
      childViews: 'addProjectButton delProjectButton importButton exportButton addTaskButton delTaskButton'.w(),
      borderStyle: SC.BORDER_TOP,
      
      addProjectButton: SC.ButtonView.design({
        layout: { centerY: 0, left: 8, height: 21, width: 30 },
        title: "+",
        titleMinWidth: 0,
        fontSize: 10,
        target: 'Tasks.projectsController',
        action: 'addProject'
      }),
      
      delProjectButton: SC.ButtonView.design({
        layout: { centerY: 0, left: 43, height: 21, width: 30 },
        title: "-",
        titleMinWidth: 0,
				isEnabledBinding: 'Tasks.projectsController.hasSelection',
        fontSize: 10,
        target: 'Tasks.projectsController',
        action: 'delProject'
      }),
      
      importButton: SC.ButtonView.design({
        layout: { centerY: 0, height: 21, left: 88, width: 50 },
        title:  "_Import".loc(),
        titleMinWidth: 0,
				target: 'Tasks.projectsController',
				action: 'importData'
      }),
      
      exportButton: SC.ButtonView.design({
        layout: { centerY: 0, height: 21, left: 148, width: 50 },
        title:  "_Export".loc(),
        titleMinWidth: 0,
				target: 'Tasks.projectsController',
				action: 'exportData'
      }),
      
      addTaskButton: SC.ButtonView.design({
        layout: { centerY: 0, height: 21, left: 253, width: 30 },
        title:  "+",
        titleMinWidth: 0,
        fontSize: 10,
				target: 'Tasks.tasksController',
				action: 'addTask'
      }),

      delTaskButton: SC.ButtonView.design({
        layout: { centerY: 0, height: 21, left: 288, width: 30 },
        title:  "-",
        titleMinWidth: 0,
				isEnabledBinding: 'Tasks.tasksController.hasSelection',
				fontSize: 10,
				target: 'Tasks.tasksController',
				action: 'delTask'
      })

    })
  })

});
