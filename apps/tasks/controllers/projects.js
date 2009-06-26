// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

	This is the controller for the Projects master list

  @extends SC.ArrayController
	@author Suvajit Gupta
*/
Tasks.projectsController = SC.ArrayController.create(
/** @scope Tasks.projectsController.prototype */ {
  
  allowsMultipleSelection: NO,
  allowsEmptySelection: NO,
  
  summary: function() { // TODO: switch to a hover over
	
    var len = this.get('length'), ret;

    if (len && len > 0) {
      ret = len === 1? "1 project" : "%@ projects".fmt(len);
    } else ret = "No projects";
    
    return '(' + ret + ')';
  }.property('length').cacheable(),

  addProject: function() {
    // Create a new project with a default name
		// TODO: add new project right after selected item    

		var store = Tasks.get('store');
    var task = store.createRecord(Tasks.Project, {
      name: Tasks.NEW_PROJECT_NAME
    });
    store.commitRecords();
    this.addObject(task); // TODO: Why do we have to manually add to the controller instead of store notifying?

    var listView = Tasks.getPath('mainPage.mainPane.middleView.topLeftView.contentView');
		var idx = listView.length - 1; // get index of new project in list
		// TODO: get index of new project whereever it is in the list, don't assume it is at the end
		listView.select(idx);

    // Begin editing newly created item.
    var itemView = listView.itemViewForContentIndex(idx);
		itemView.beginEditing(); // TODO: make this work
	},
	
  deleteProject: function() {
		//get the selected tasks
		var sel = this.get('selection');
    if (sel && sel.length > 0) {
  		var store = Tasks.get('store');

  		//pass the guids to be destroyed
      var keys = sel.firstObject().get('guid');
  		store.destroyRecords(Tasks.Project, [keys]);
  		//commit the operation to send the request to the server
  		store.commitRecords();
			// TODO: what to do to remove the project from the ListView and clear the selection?
    }
	},
	
  importData: function() { // TODO: implement
		alert ('Not implemented!');
	},
	
	exportData: function() {

	  // TODO: refactor this code to Tasks model?  can this be done given that the Task is being accessed as a "rec"?
	
		var val, task, user, data = "# Tasks data export at " + new Date().format('MMM dd, yyyy hh:mm:ssa') + '\n\n';
		
    this.forEach(function(rec){
					var tasks = rec.get('tasks');
					var len = tasks.get('length');
				 	data += rec.get('displayName') + ': # ' + len + ' tasks\n';
					for (var i = 0; i < len; i++) {
						task = tasks.objectAt(i);
						switch(task.get('priority')) {
							case Tasks.TASK_PRIORITY_HIGH: val = '^'; break;
							case Tasks.TASK_PRIORITY_MEDIUM: val = '-'; break;
							case Tasks.TASK_PRIORITY_LOW: val = 'v'; break;
						}
						data += val + ' ';
						data += task.get('displayName');
						user = task.get('submitter');
						if (user) data += ' <' + user.get('name') + '>';
						user = task.get('assignee');
						if (user) data += ' [' + user.get('name') + ']';
						val = task.get('type');
						if(val != Tasks.TASK_TYPE_OTHER)	data += ' $' + val;
						val = task.get('status');
						if(val != Tasks.TASK_STATUS_PLANNED)	data += ' @' + val;
						val = task.get('validation');
						if(val != Tasks.TASK_VALIDATION_NOT_TESTED)	data += ' %' + val;
						val = task.get('description');
						if(val) data += '\n' + val;
						data += '\n';
					}
					data += '\n';
      }, this);
		
		console.log(data);
	}
  
});
