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
    if (drag.hasDataType(CoreTasks.Task)) {
      return SC.DRAG_MOVE;
    }
    else {
      return SC.DRAG_NONE;
    }
  },
  
  /**
    Called if the user actually drops on the view.
  */
  collectionViewPerformDragOperation: function(view, drag, dragOp, idx, dropOp) {
    
    if(CoreTasks.getPath('currentUser.role') === CoreTasks.USER_ROLE_GUEST) {
      console.warn('You do not have permission to reallocate task(s)');
      return SC.DRAG_MOVE;
    }
    if (dragOp & SC.DRAG_REORDER) return SC.DRAG_MOVE; // disallow reorder
    
    var tasks = drag.dataForType(CoreTasks.Task),
        content   = view.get('content'),
        ret       = SC.DRAG_NONE;
    
    // only if data is available from drag
    if (!tasks) return ret;
        
    // if we can move, then remove tasks from the old project and add to the new project
    if (!(dragOp & SC.DRAG_MOVE)) ret = SC.DRAG_COPY;
    else {
      var targetProject = content.objectAt(idx);
      if (targetProject.get('id') && targetProject !== CoreTasks.get('allTasksProject')) {
        tasks.forEach(function(task) {
          var targetProjectId = (targetProject === CoreTasks.get('unallocatedTasksProject')? null : targetProject.get('id'));
          // console.log('Reallocating to: ' + targetProject.get('name') + ' of ID: ' + targetProjectId);
          task.set('projectId', targetProjectId);
          ret = SC.DRAG_MOVE;
        }, this);
      }
    }       
  
    if(ret === SC.DRAG_MOVE) {
      if(!Tasks.get('manualSave')) Tasks.saveData();
    }
    return ret;
  },

  /**
    Called by the collection view to delete the selected items.
    
    @param {SC.CollectionView} view collection view
    @param {SC.IndexSet} indexes the items to delete
  */
  collectionViewDeleteContent: function(view, content, indexes) {
    if (content && (SC.typeOf(content.destroyAt) === SC.T_FUNCTION || SC.typeOf(content.removeAt) === SC.T_FUNCTION)) {
      Tasks.deleteProject();
    }
    return NO;
  }
  
});