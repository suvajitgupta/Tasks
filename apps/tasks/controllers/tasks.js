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

    var listView = Tasks.getPath('mainPage.mainPane.middleView.contentView');
		listView.set('selection',task);
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
		var store = Tasks.get('store');

		//pass the guids to be destroyed
		store.destroyRecords(Tasks.Task, sel.get('guid'));
		//commit the operation to send the request to the server
		store.commitRecords();

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
