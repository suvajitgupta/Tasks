// ==========================================================================
// Project:   Tasks - mainPage
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
      layout: { top: 0, left: 0, right: 0, height: 41 },
      childViews: 'iconView labelView summaryView'.w(),
      borderStyle: SC.BORDER_BOTTOM,
      
      iconView: SC.LabelView.design({
        layout: { centerY: 0, height: 40, left: 8, width: 200 },
        classNames: ['tasks-logo']
      }),
      
      labelView: SC.LabelView.design({
        layout: { top: 10, height: 40, left: 60, width: 200 },
        controlSize: SC.LARGE_CONTROL_SIZE,
        fontWeight: SC.BOLD_WEIGHT,
        value: "_Tasks".loc() + " v" + Tasks.VERSION
      }),
      
      summaryView: SC.LabelView.design({ // TODO: make this a hover over on Tasks label
        layout: { top: 10, height: 40, right: 10, width: 200 },
        textAlign: SC.ALIGN_RIGHT,
				valueBinding: 'Tasks.tasksController.summary'
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
      childViews: 'exportButton addProjectButton delProjectButton addTaskButton delTaskButton'.w(),
      borderStyle: SC.BORDER_TOP,
      
      exportButton: SC.ButtonView.design({
        layout: { centerY: 0, height: 21, left: 8, width: 75 },
        title:  "_Export".loc(),
				target: 'Tasks.projectsController',
				action: 'exportData'
      }),
      
      addProjectButton: SC.ButtonView.design({
        layout: { centerY: 0, left: 88, height: 21, width: 75 },
        title: "+",
        controlSize: SC.SMALL_CONTROL_SIZE,
        target: 'Tasks.projectsController',
        action: '' //TODO: Wire up action to add a project to the list
      }),
      
      delProjectButton: SC.ButtonView.design({
        layout: { centerY: 0, left: 168, height: 21, width: 75 },
        title: "-",
        controlSize: SC.SMALL_CONTROL_SIZE,
        target: 'Tasks.projectsController',
        action: '' //TODO: Wire up action to delete a project from the list
      }),
      
      addTaskButton: SC.ButtonView.design({
        layout: { centerY: 0, height: 21, left: 250, width: 75 }, // TODO: make button small
        title:  "+",
        controlSize: SC.SMALL_CONTROL_SIZE, 
				target: 'Tasks.tasksController',
				action: 'addTask'
      }),

      delTaskButton: SC.ButtonView.design({
        layout: { centerY: 0, height: 21, left: 330, width: 75 }, // make button small
        title:  "-",
				isEnabled: 'Tasks.tasksController.hasSelection', // TODO: kill this since a Project will always be selected in master list?
				controlSize: SC.SMALL_CONTROL_SIZE,
				target: 'Tasks.tasksController',
				action: 'delTask'
      })

    })
  })

});
