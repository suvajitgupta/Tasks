// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  Task filter search controls.
  
  @extends SC.View
  @author Suvajit Gupta
*/

Tasks.FilterSearchView = SC.View.extend({
  
  layout: { centerY: 0, height: 30, right: 0, width: 280 },
  
  childViews: 'filterPanelButton filterCancelButton tasksSearchField tasksSearchCancelButton'.w(),

  filterPanelButton: SC.ButtonView.design({
    layout: { centerY: 0, height: 24, right: 223, width: 50 },
    titleMinWidth: 0,
    icon: 'filter-icon',
    classNames: ['dark'],
    toolTip: "_FilterTooltip".loc(),
    action: 'showTasksFilter',
    isEnabledBinding: SC.Binding.not('Tasks.mainPageHelper*panelOpen')
  }),
  filterCancelButton: SC.View.design(SC.Control, { // Filter cancel button
    layout: { centerY: 0, height: 16, right: 218, width: 16 },
    isVisible: NO,
    classNames: ['filter-cancel-icon'],
    touchStart: function() {
      this.mouseDown();
    },
    mouseDown: function() {
      if(Tasks.mainPageHelper.get('panelOpen')) return;
      Tasks.filterSearchController.clearAttributeFilterCriteria();
      Tasks.assignmentsController.computeTasks();
    },
    isVisibleBinding: SC.Binding.oneWay('Tasks.filterSearchController.isAttributeFilterEnabled').bool(),
    isEnabledBinding: SC.Binding.not('Tasks.mainPageHelper*panelOpen')
  }),

  tasksSearchField: SC.TextFieldView.design({
    layout: { centerY: 1, height: 25, right: 10, width: 200 },
    classNames: ['search-bar'],
    hint: "_TasksSearchHint".loc(),
    renderMixin: function(context, firstTime) { // Used custom tooltip rendering to avoid escaping by SCUI.Toolip
      context.attr('title', "_TasksSearchTooltip".loc()) ;
    },
    valueBinding: 'Tasks.filterSearchController.tasksSearch',
    isEnabledBinding: SC.Binding.not('Tasks.mainPageHelper*panelOpen')
  }),
  tasksSearchCancelButton: SC.View.design(SC.Control, { // Tasks Search cancel button
    layout: { centerY: 0, height: 16, right: 16, width: 16 },
    isVisible: NO,
    classNames: ['filter-cancel-icon'],
    touchStart: function() {
      this.mouseDown();
    },
    mouseDown: function() {
      if(Tasks.mainPageHelper.get('panelOpen')) return;
      Tasks.filterSearchController.set('tasksSearch', '');
    },
    isVisibleBinding: SC.Binding.oneWay('Tasks.filterSearchController.tasksSearch').bool(),
    isEnabledBinding: SC.Binding.not('Tasks.mainPageHelper*panelOpen')
  })

});