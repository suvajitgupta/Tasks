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
    If the drag data includes tasks, then we can accept a move or copy
    from most locations.  If the dragSource is another collection view sharing
    the same delegate, then we know how to do a move, so allow that.  
    Otherwise, just allow a copy.
  */
  collectionViewComputeDragOperations: function(view, drag, proposedDragOperations) {
    if (drag.hasDataType(Tasks.Task)) {
      var source = drag.get('source');
      if (source && source.delegate === this) return SC.DRAG_MOVE;
      else return SC.DRAG_COPY;
    } else return SC.DRAG_NONE;
  },
  
  /**
    Called if the user actually drops on the view.  Since we are dragging to and from
    the same view, let the CollectionView handle the actual reorder by returning SC.DRAG_NONE.
    If the drop target is the first index (before the unassign branch) do nothing be returning
    SC.DRAG_MOVE.
  */
  collectionViewPerformDragOperation: function(view, drag, dragOp, idx, dropOp) {
    
    // tells the CollectionView to do nothing
    // TODO: [BB] Probably a better way to do this.  Shouldn't even allow the first position to be draggable.
    if (idx === 0) {
      return SC.DRAG_MOVE; 
    }
    
    var content = view.get('content');
    
    // get assignee of item before drag location
    var newAssignee = content.objectAt(idx-1).get('assignee');
    
    var data = drag.dataForType(view.get('reorderDataType')) ;

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
      task.set('assignee', newAssignee);
    }, this);
    
    return SC.DRAG_NONE;
  }
});
