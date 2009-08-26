// ==========================================================================
// Project:   Tasks.reallocationController
// ==========================================================================
/*globals Tasks */

/** @class

  This is the delegate for the project list view.

  @extends SC.Object
  @author Brandon Blatnick
  @author Suvajit Gupta
*/
Tasks.reallocationController = SC.Object.create(SC.CollectionViewDelegate,
/** @scope Tasks.reallocationController.prototype */ {

  /**
    Called if the user actually drops on the view.
  */
  collectionViewPerformDragOperation: function(view, drag, dragOp, idx, dropOp) {
    
    alert('hi');
    /*
    // tells the CollectionView to do nothing
    // TODO: [BB] Probably a better way to do this.  Shouldn't even allow the first position to be draggable.
    if (idx === 0) return SC.DRAG_MOVE; 
    var content = view.get('content');
    var data = drag.dataForType(view.get('reorderDataType')) ;
    
    // get assignee of item before drag location
    var newAssignee = content.objectAt(idx-1).get('assignee');

    // get each object
    var objects = [];
    var shift = 0;
    data.indexes.forEach(function(i) {  
      objects.push(content.objectAt(i-shift));
      shift++;
      if (i < idx) idx--;
      if (i === idx) idx--;
    }, this);
    
    objects.forEach(function(task) {
      task.assignee = newAssignee; // avoid calling observers while in transition
    }, this);
    Tasks.assignmentsController.showAssignments();
    
    return SC.DRAG_NONE;
    */
  }
});