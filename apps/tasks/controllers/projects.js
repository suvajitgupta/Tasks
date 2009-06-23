// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** @class

  @extends SC.ArrayController
	@author Joshua Holt
	@author Suvajit Gupta
*/
Tasks.projectsController = SC.ArrayController.create(
/** @scope Tasks.projectsController.prototype */ {
  
  allowsMultipleSelection: NO,
  allowsEmptySelection: NO,
  
  nodes: function() {
    var projects = [];
    this.forEach(function(rec){
        projects.push(SC.Object.create({ displayName: rec.get('displayName'), icon: rec.get('icon'), tasks: rec.get('tasks') }));
      }, this);
    return SC.Object.create({ treeItemChildren:
      	[SC.Object.create({ displayName: 'Projects', treeItemChildren: projects, treeItemIsExpanded: YES})],
				treeItemIsExpanded: YES });
    
  }.property('[]').cacheable(),
  
  exportData: function() {
		var val, task, user, data = "# Tasks data export at " + new Date().format('MMM dd, yyyy hh:mm:ssa') + '\n\n';
		
    this.forEach(function(rec){
					var tasks = rec.get('tasks');
					var len = tasks.get('length');
				 	data += rec.get('displayName') + ': #' + len + ' tasks\n';
					for (var i = 0; i < len; i++) {
						task = tasks.objectAt(i);
						switch(task.get('priority')) {
							case Tasks.consts.TASK_PRIORITY_HIGH: val = '^'; break;
							case Tasks.consts.TASK_PRIORITY_MEDIUM: val = '-'; break;
							case Tasks.consts.TASK_PRIORITY_LOW: val = 'v'; break;
						}
						data += val + ' ';
						data += task.get('displayName');
						user = task.get('submitter');
						if (user) data += ' <' + user.get('name') + '>';
						user = task.get('assignee');
						if (user) data += ' [' + user.get('name') + ']';
						val = task.get('type');
						if(val != Tasks.consts.TASK_TYPE_OTHER)	data += ' $' + val;
						val = task.get('status');
						if(val != Tasks.consts.TASK_STATUS_PLANNED)	data += ' @' + val;
						val = task.get('validation');
						if(val != Tasks.consts.TASK_VALIDATION_NOT_TESTED)	data += ' %' + val;
						val = task.get('description');
						if(val) data += '\n' + val;
						data += '\n';
					}
					data += '\n';
      }, this);
		
		console.log(data);
	}
  
});
