// ==========================================================================
// Project:   Tasks.reassignmentController
// ==========================================================================
/*globals Tasks */

/** @class

  This is the delegate for the task detail view.

  @extends SC.Object
  @author Brandon Blatnick
*/
// FIXME: [BB] Fix spurious box-like ghost view with task while dragging
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
    // TODO: [BB] Probably a better way to do this.  Shouldn't even allow the first position to be draggable.
    if (idx === 0) return SC.DRAG_MOVE; 

    var tasks = drag.dataForType(Tasks.Task),
    content   = view.get('content'),
    len       = view.get('length'),
    source    = drag.get('source'),
    ret       = SC.DRAG_NONE;
  
    // get assignee of item before drag location
    var newAssignee = content.objectAt(idx-1).get('assignee');
    
    tasks.forEach(function(task) {
      if (task.get('assignee') !== newAssignee) {
        task.set('assignee', newAssignee);
      }
    }, this);
    Tasks.assignmentsController.showAssignments();
    return SC.DRAG_NONE;
  },
  
  /**
    Called by the collection view to actually delete the selected items.
    
    The default behavior will use standard array operators to delete the 
    indexes from the array.  You can implement this method to provide your own 
    deletion method.
    
    If you simply want to control the items to be deleted, you should instead
    implement collectionViewShouldDeleteItems().  This method will only be 
    called if canDeleteContent is YES and collectionViewShouldDeleteIndexes()
    returns a non-empty index set
    
    @param {SC.CollectionView} view collection view
    @param {SC.IndexSet} indexes the items to delete
    @returns {Boolean} YES if the deletion was a success.
  */
  collectionViewDeleteContent: function(view, content, indexes) {
    if (!content) return NO ;
    //TODO: refactor to call 
    if (SC.typeOf(content.destroyAt) === SC.T_FUNCTION) {
      Tasks.deleteTask();
      content.destroyAt(indexes);
      return YES ;
      
    } else if (SC.typeOf(content.removeAt) === SC.T_FUNCTION) {
      Tasks.deleteTask();
      content.removeAt(indexes);
      return YES;
      
    } else return NO ;
  }
});
