// ==========================================================================
// Project:   Tasks.reallocationController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

/** @class

  This is the delegate for the project list view.

  @extends SC.Object
  @author Brandon Blatnick
  @author Suvajit Gupta
*/
Tasks.reallocationController = SC.Object.create(SC.CollectionViewDelegate,
/** @scope Tasks.reallocationController.prototype */ {
  
  // ..........................................................
  // DRAGGING
  //
  collectionViewValidateDragOperation: function(view, drag, op, proposedInsertionIndex, proposedDropOperation) {
    // don't allow dropping on by default
    return (proposedDropOperation & SC.DROP_ON) ? op : SC.DRAG_NONE ;
  },
  
  // ..........................................................
  // DROP TARGET SUPPORT
  // 

  collectionViewComputeDragOperations: function(view, drag, proposedDragOperations) {
    if (drag.hasDataType(Tasks.Task)) {
      return SC.DRAG_MOVE;
    }
    else {
      return SC.DRAG_REORDER;
    }
  },
  
  /**
    Called if the user actually drops on the view.
  */
  collectionViewPerformDragOperation: function(view, drag, dragOp, idx, dropOp) {
    
    if (dragOp & SC.DRAG_REORDER) return SC.DRAG_MOVE; // disallow reorder
    
    var tasks = drag.dataForType(Tasks.Task),
        content   = view.get('content'),
        len       = view.get('length'),
        source    = drag.get('source'),
        ret       = SC.DRAG_NONE;
    
    // only if data is available from drag
    if (!tasks) return ret;
        
    // if we can move, then remove tasks from the old project and add to the new project
    if (!(dragOp & SC.DRAG_MOVE)) ret = SC.DRAG_COPY;
    else {
      var targetProject = content.objectAt(idx);
      if (targetProject !== CoreTasks.get('allTasksProject')) {
        tasks.forEach(function(task) {
          task.set('projectId', targetProject.get('id'));
        }, this);
      }
      ret = SC.DRAG_MOVE;
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
      // TODO: [SG] see how to keep selected project highlighted after user cancels deletion via Del key
      return Tasks.deleteProject();
    }
    return NO;
  }
  
});