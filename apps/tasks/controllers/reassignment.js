// ==========================================================================
// Project:   Tasks.reassignmentController
// ==========================================================================
/*globals Tasks CoreTasks */

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
    When dragging, add Task data type to the drag.
  */
  collectionViewDragDataTypes: function(view) {
    return [CoreTasks.Task];
  },
  
  /**
    If the requested dataType is a Task, provide the currently selected tasks.  Otherwise return null.
  */
  collectionViewDragDataForType: function(view, drag, dataType) {
    var ret=null, sel;
    if (dataType === CoreTasks.Task) {
      sel = view.get('selection');
      ret = [];
      if (sel) sel.forEach(function(x) { ret.push(x); }, this);
    }
    return ret;
  },
  
  // ..........................................................
  // DROP TARGET SUPPORT
  // 
  collectionViewComputeDragOperations: function(view, drag, proposedDragOperations) {
    if (drag.hasDataType(CoreTasks.Task)) {
      return SC.DRAG_MOVE;
    }
    else {
      return SC.DRAG_NONE;
    }
  },
  
  /**
    Called if the user actually drops on the view.  Since we are dragging to and from
    the same view, let the CollectionView handle the actual reorder by returning SC.DRAG_NONE.
    If the drop target is the first index (before the unassign branch) do nothing by returning
    SC.DRAG_MOVE.
  */
  collectionViewPerformDragOperation: function(view, drag, dragOp, idx, dropOp) {
    
    var ret = SC.DRAG_MOVE;
    
    if(!Tasks.tasksController.isEditable()) {
      console.warn('You do not have permission to reassign or reallocate task(s) here');
      return ret;
    }
    
    // tells the CollectionView to do nothing
    if (idx < 0) return ret;
    
    // Extract tasks to drag
    var tasks = drag.dataForType(CoreTasks.Task);
    if(!tasks) return ret;

    // Get assignee of item before drag location
    var content   = view.get('content');
    var targetAssignee = content.objectAt(idx).get('assignee');
    
    // Set dragged tasks' assignee to new assignee
    tasks.forEach(function(task) {
      if (task.get('assignee') !== targetAssignee) {
        var targetAssigneeId = targetAssignee === null? null : targetAssignee.get('id');
        // console.log('Reassigning to: ' + (targetAssignee? targetAssignee.get('name') : 'Unassigned') + ' of Id: ' + targetAssigneeId);
        task.set('assigneeId', targetAssigneeId);
        ret = SC.DRAG_NONE;
      }
    }, this);
    
    // Redraw tasks list after reassignments are complete
    if(ret === SC.DRAG_NONE) {
      if(!Tasks.get('manualSave')) Tasks.saveData();
      Tasks.assignmentsController.showAssignments();
    }
    return ret;
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
