// ==========================================================================
// Tasks.graphicalstatisticsView
// ==========================================================================
/*globals Tasks Sai */

Tasks.AXIS_COLOR = '#666';

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Shows statistics graphically
  
*/
Tasks.graphicalStatisticsView = SC.View.create({
  
  layout: { top: 15, left: 10, right: 10, bottom: 5 },
  childViews: 'tasksStatistics teamStatistics'.w(),
  
  statisticsBinding: SC.Binding.oneWay('Tasks.statisticsController.statistics'),
  displayProperties: ['statistics'],
  
  tasksStatistics: SC.View.design({
    childViews: 'priorityStatisticsChart typeStatisticsChart statusStatisticsChart'.w(),
    isVisible: NO,
    priorityStatisticsChart: Sai.BarChartView.design({
      layout: { top: 0, left: 0, width: 200, bottom: 0 },
      dataAttrs: { horizontal: NO, barWidth: 25, colors: ['black', 'gray', 'darkGray'] }
    }),
    typeStatisticsChart: Sai.BarChartView.design({
      layout: { top: 0, left: 200, width: 200, bottom: 0 },
      dataAttrs: { horizontal: NO, barWidth: 25, colors: ['gold', 'red', 'gray'] },
      isVisibleBinding: SC.Binding.oneWay('Tasks.softwareMode')
    }),
    statusStatisticsChart: Sai.BarChartView.design({
      layout: { top: 0, left: 400, width: 220, bottom: 0 },
      dataAttrs: { horizontal: NO, barWidth: 25, colors: ['black', 'blue', 'green', 'red'] }
    })
  }),
  
  teamStatistics: SC.View.design({
    childViews: 'loadingStatisticsChart'.w(),
    isVisible: NO,
    // TODO: [SG] use pie chart to show assignee loading distribution
    loadingStatisticsChart: Sai.BarChartView.design({
      dataAttrs: { horizontal: YES, barWidth: 20, colors: ['gray', 'green', 'blue', 'red'] } 
    })
  }),
  
  render: function(context, firstTime) {
    var stats = this.get('statistics');
    if(stats && stats.tasksCount > 0) {
      if(Tasks.assignmentsController.get('displayMode') === Tasks.DISPLAY_MODE_TASKS) {
        this.setPath('tasksStatistics.isVisible', YES);
        this.setPath('teamStatistics.isVisible', NO);
        this.setPath('tasksStatistics.priorityStatisticsChart.data', [ stats.highCount, stats.mediumCount, stats.lowCount ]);
        this.setPath('tasksStatistics.priorityStatisticsChart.xaxis', { color: Tasks.AXIS_COLOR, labelAttrs: {offset: -5, fontSize: '9'},
                      labels: [ "_High".loc(), "_Medium".loc(), "_Low".loc() ] });
        // FIXME: [GD] fix axis autoscaling & min/max override capability in Sai
        this.setPath('tasksStatistics.priorityStatisticsChart.yaxis', { autoscale: YES, min: 0, max: stats.tasksCount,
                                                                        color: Tasks.AXIS_COLOR, labelAttrs: {offset: -5, fontSize: '9'}, buffer: 0.2, labels: YES,
                     step: this._computeRange(this.getPath('tasksStatistics.priorityStatisticsChart.data')) });
        this.setPath('tasksStatistics.typeStatisticsChart.data', [ stats.featureCount, stats.bugCount, stats.otherCount ]);
        this.setPath('tasksStatistics.typeStatisticsChart.xaxis', { color: Tasks.AXIS_COLOR, labelAttrs: {offset: -5, fontSize: '9'},
                     labels: [ "_Feature".loc(), "_Bug".loc(), "_Other".loc() ] });
        this.setPath('tasksStatistics.typeStatisticsChart.yaxis', { autoscale: YES, min: 0, max: stats.tasksCount,
                                                                    color: Tasks.AXIS_COLOR, labelAttrs: {offset: -5, fontSize: '9'}, buffer: 0.2, labels: YES,
                     step: this._computeRange(this.getPath('tasksStatistics.typeStatisticsChart.data')) });
        this.setPath('tasksStatistics.statusStatisticsChart.data', [ stats.plannedCount, stats.activeCount, stats.doneCount, stats.riskyCount ]);
        this.setPath('tasksStatistics.statusStatisticsChart.xaxis', { color: Tasks.AXIS_COLOR, labelAttrs: {offset: -5, fontSize: '9'},
                      labels: [ "_Planned".loc(), "_Active".loc(), "_Done".loc(), "_Risky".loc() ] });
        this.setPath('tasksStatistics.statusStatisticsChart.yaxis', { autoscale: YES, min: 0, max: stats.tasksCount,
                                                                      color: Tasks.AXIS_COLOR, labelAttrs: {offset: -5, fontSize: '9'}, buffer: 0.2, labels: YES,
                     step: this._computeRange(this.getPath('tasksStatistics.statusStatisticsChart.data')) });
      }
      else { // displayMode === Tasks.DISPLAY_MODE_TEAM
        this.setPath('tasksStatistics.isVisible', NO);
        this.setPath('teamStatistics.isVisible', YES);
        this.setPath('teamStatistics.loadingStatisticsChart.data',
                     [ stats.notLoadedAssigneesCount, stats.underloadedAssigneesCount, stats.properlyLoadedAssigneesCount, stats.overloadedAssigneesCount ]);
        this.setPath('teamStatistics.loadingStatisticsChart.yaxis', { color: Tasks.AXIS_COLOR, labelAttrs: {offset: -5, fontSize: '11'}, buffer: 0.15,
                     labels: [ "_AssigneeNotLoaded".loc(), "_AssigneeUnderLoaded".loc(), "_AssigneeProperlyLoaded".loc(), "_AssigneeOverloaded".loc() ] });
        this.setPath('teamStatistics.loadingStatisticsChart.xaxis', { color: Tasks.AXIS_COLOR, labelAttrs: {offset: -5, fontSize: '9'}, buffer: 0.1, labels: YES,
                     step: this._computeRange(this.getPath('teamStatistics.loadingStatisticsChart.data')) });
      }
    }
    sc_super();
  },
  
  _computeRange: function(values) {
    var max = Math.max.apply(null, values);
    var range = Math.floor(max/5);
    if(range === 0) range = 1;
    // console.log('DEBUG: computeRange() values=' + values + ', max=' + max + ', range=' + range);
    return range;
  }

});
