// ==========================================================================
// Project:   Tasks - mainPage
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks */

/** @namespace

	This page describes the main user interface for the Tasks application.
	
  @extends SC.Object
	@author Suvajit Gupta
*/

Tasks.mainPage = SC.Page.design({

  mainPane: SC.MainPane.design({
		
		childViews: 'topView middleView bottomView'.w(),
    
    topView: SC.View.design(SC.Border, {
      layout: { top: 0, left: 0, right: 0, height: 41 },
      childViews: 'labelView summaryView'.w(),
      borderStyle: SC.BORDER_BOTTOM,
      
      labelView: SC.LabelView.design({
        layout: { centerY: 0, height: 24, left: 8, width: 200 },
        controlSize: SC.LARGE_CONTROL_SIZE,
        fontWeight: SC.BOLD_WEIGHT,
        value: "_Tasks".loc()
      }),
      
      summaryView: SC.LabelView.design({
        layout: { centerY: 0, height: 18, left: 20, right: 20 },
        textAlign: SC.ALIGN_RIGHT,
        
        valueBinding: "Tasks.tasksController.summary"
      })
    }),
    
    middleView: SC.SplitView.design({
      layout: { top: 42, bottom: 42, left: 0, right: 0 },
      defaultThickness: 225,
      topLeftMaxThickness: 250,
      topLeftMinThickness: 200,
      
      topLeftView: SC.ScrollView.design({
        hasHorizontalScroller: NO,
        borderStyle: SC.BORDER_GRAY,
        backgroundColor: 'blue',

        contentView: SC.SourceListView.design({
          contentValueKey: 'title',
          contentBinding: 'Tasks.projectsTreeController.arrangedObjects',
          selectionBinding: 'Tasks.projectsTreeController.selection',
          //contentCheckboxKey: "isDone",
          hasContentIcon: YES,
          contentIconKey:  "projectIcon",
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
          contentValueKey: 'name',
          contentBinding: 'Tasks.tasksController.arrangedObjects',
          selectionBinding: 'Tasks.tasksController.selection',
          contentCheckboxKey: "isDone",
          contentValueEditable: true,
          canReorderContent: true,
          canDeleteContent: true,
          destroyOnRemoval: YES
        })
      })
    }),
    
    bottomView: SC.View.design(SC.Border, {
      layout: { bottom: 0, left: 0, right: 0, height: 41 },
      childViews: 'addButton delButton'.w(),
      borderStyle: SC.BORDER_TOP,
      
      addButton: SC.ButtonView.design({
        layout: { centerY: 0, height: 21, left: 8, width: 80 },
        title:  "Add",
				target: 'Tasks.tasksController',
				action: 'addTask'
      }),

      delButton: SC.ButtonView.design({
        layout: { centerY: 0, height: 21, left: 120, width: 80 },
        title:  "Delete",
				isEnabled: 'Tasks.tasksController.hasSelection',
				target: 'Tasks.tasksController',
				action: 'delTask'
      })

    })
  })

});
