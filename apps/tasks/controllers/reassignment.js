// ==========================================================================
// Project:   Tasks.reassignmentController
// ==========================================================================
/*globals Tasks */

/** @class

  This is the delegate for the task detail view.

  @extends SC.Object
  @author Brandon Blatnick
*/
Tasks.reassignmentController = SC.Object.create(SC.CollectionViewDelegate,
/** @scope Tasks.reassignmentController.prototype */ {
  
  // ..........................................................
  // DRAG SOURCE SUPPORT
  // 
  
  /**
    When dragging, add an Task data type to the drag.
  */
  collectionViewDragDataTypes: function(view) {
    return [Tasks.Task];
  },
  
  /**
    If the requested dataType is tasks, provide the currently selected
    tasks.  Otherwise return null.
  */
  collectionViewDragDataForType: function(view, drag, dataType) {
    var ret=null, sel;
    
    if (dataType === Tasks.Task) {
      sel = view.get('selection');
      ret = [];
      if (sel) sel.forEach(function(x) { ret.push(x); }, this);
    }
    
    return ret ;
  },
  
  // ..........................................................
  // DROP TARGET SUPPORT
  // 

  /**
    Called if the user actually drops on the view.  Since we are dragging to and from
    the same view, let the CollectionView handle the actual reorder by returning SC.DRAG_NONE.
    If the drop target is the first index (before the unassign branch) do nothing by returning
    SC.DRAG_MOVE.
  */
  collectionViewPerformDragOperation: function(view, drag, dragOp, idx, dropOp) {
    
    // tells the CollectionView to do nothing
    // TODO: [BB] don't allow the first item in list to be draggable
    if (idx === 0) return SC.DRAG_MOVE;
    
    // Extract tasks to drag
    var tasks = drag.dataForType(Tasks.Task);

    // Get assignee of item before drag location
    var content   = view.get('content');
    var targetAssignee = content.objectAt(idx-1).get('assignee');
    
    // Set dragged tasks' assignee to new assignee
    tasks.forEach(function(task) {
      if (task.get('assignee') !== targetAssignee) {
        var targetAssigneeId = targetAssignee === null? null : targetAssignee.get('id');
        // console.log('Reassigning to: ' + (targetAssignee? targetAssignee.get('name') : 'Unassigned') + ' of Id: ' + targetAssigneeId);
        task.set('assigneeId', targetAssigneeId);
      }
    }, this);
    
    // Redraw tasks list after reassignments are complete
    Tasks.assignmentsController.showAssignments();
    return SC.DRAG_NONE;
  },
  
  /**
    Called by the collection view to delete the selected items.
    
    @param {SC.CollectionView} view collection view
    @param {SC.IndexSet} indexes the items to delete
    @returns {Boolean} YES if the deletion was a success.
  */
  collectionViewDeleteContent: function(view, content, indexes) {
    if (content && (SC.typeOf(content.destroyAt) === SC.T_FUNCTION || SC.typeOf(content.removeAt) === SC.T_FUNCTION)) {
      Tasks.deleteTask();
      return YES;
    }
    return NO;
  }
  
});
