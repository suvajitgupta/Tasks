// ==========================================================================
// Project:   Tasks.tasksController
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks */

/** @class

  (Document Your Controller Here)

  @extends SC.ArrayController
*/
Tasks.tasksController = SC.ArrayController.create(
/** @scope Tasks.tasksController.prototype */ {

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

/*
    // Now, we need to get the item view for the new task from the list view.
    // Since the the task list has not yet had a chance to update with the new
    // content, we do this the next runloop.

    // Find the list view from the page.
    var listView = Tasks.getPath('mainPage.mainPane.middleView.contentView');
    var itemView = listView.itemViewForContent(task);

    // Begin editing on the found itemView.
    itemView.beginEditing();
*/
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
	
  summary: function() {
    var len = this.get('length'), sel = this.get('selection'), ret ;

    if (len && len > 0) {
      ret = len === 1 ? "1 task" : "%@ tasks".fmt(len);
    } else ret = "No tasks";
    
    if (sel && sel > 0) {
      ret = ret + " (%@ selected)".fmt(sel.get('length'));
    }
    return ret ;
  }.property('length', 'selection').cacheable()

}) ;
