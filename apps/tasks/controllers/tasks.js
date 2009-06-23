// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

	This is the controller for the Tasks detail list, driven by the selected Project
	
  @extends SC.TreeController
	@author Joshua Holt
	@author Suvajit Gupta
*/
Tasks.tasksController = SC.TreeController.create(
/** @scope Tasks.tasksController.prototype */ {

  contentBinding: 'Tasks.assignmentsController.assignments',
  treeItemIsGrouped: YES,

	addTask: function() {

    // Create a new task, with a default title.  
		var store = Tasks.get('store');
    var task = store.createRecord(Tasks.Task, {
      description: 'Untitled'
    });
    store.commitRecords();
    this.addObject(task); // FIXME: Do we have to manually add to the controller or should the store notify?

    var listView = Tasks.getPath('mainPage.mainPane.middleView.contentView');
    listView.select(listView.length - 1); //FIXME: don't hard code the index    

    //FIXME: Begin editing newly created item.
    //itemView.beginEditing();
	},
	
	delTask: function() {
	
		//get the selected tasks
		var sel = this.get('selection');
    if (sel && sel.length > 0) {
  		var store = Tasks.get('store');

  		//pass the guids to be destroyed
      var keys = sel.firstObject().get('guid');
  		store.destroyRecords(Tasks.Task, [keys]);
  		//commit the operation to send the request to the server
  		store.commitRecords();
    }
	},
	
	hasSelection: function() {
		var sel = this.get('selection');
		return (sel !== null) && (sel.get('length') > 0);
	}.property('selection'),
	
  summary: function() { // TODO: I18N strings
    var len = this.get('length'), sel = this.get('selection'), ret ;

    if (len && len > 0) {
      ret = len === 1 ? "1 task" : "%@ tasks".fmt(len);
    } else ret = "No tasks";
    
    if (sel && sel > 0) {
      ret = ret + " (%@ selected)".fmt(sel.get('length'));
    }
    return ret ;
  }.property('length', 'selection').cacheable()

});
