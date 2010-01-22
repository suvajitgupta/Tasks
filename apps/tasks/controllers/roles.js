// ==========================================================================
// Tasks.rolesController
// ==========================================================================
/*globals Tasks CoreTasks */
/** 
  This is the controller for the User Manager source list view
  
  @extends SC.TreeController
  @author Suvajit Gupta
*/

// FIXME: [SC] Beta: get Firefox/Chrome drop events delivered to popped up Settings panel instead of SourceListViews underneath

Tasks.rolesController = SC.TreeController.create(SC.CollectionViewDelegate,
/** @scope Tasks.rolesController.prototype */ {
  
  contentBinding: 'Tasks.usersController.roles',
  allowsEmptySelection: YES,
  treeItemIsGrouped: YES,
  
  // ..........................................................
  // DRAG SOURCE SUPPORT
  // 
  
  /**
    When dragging, add User data type to the drag.
  */
  collectionViewDragDataTypes: function(view) {
    return [CoreTasks.User];
  },
  
  /**
    If the requested dataType is a User, provide the currently selected user.  Otherwise return null.
  */
  collectionViewDragDataForType: function(view, drag, dataType) {
    var ret=null, sel;
    if (dataType === CoreTasks.User) {
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
    if (drag.hasDataType(CoreTasks.User)) {
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
    
    if(!CoreTasks.permissions.get('canEditUserRole')) {
      console.warn('You do not have permission to change user role');
      return ret;
    }
    
    // tells the CollectionView to do nothing
    if (idx < 0) return ret;
    
    // Extract tasks to drag
    var users = drag.dataForType(CoreTasks.User);
    if(!users) return ret;

    // Get assignee of item before drag location
    var content   = view.get('content');
    var targetRole = content.objectAt(idx).get('role');
    
    // Set dragged tasks' assignee to new assignee
    users.forEach(function(user) {
      if (user.get('role') !== targetRole) {
        // console.log('Changing role of: ' + user.get('name') + ' to ' + targetRole);
        user.set('role', targetRole);
        ret = SC.DRAG_NONE;
      }
    }, this);
    
    // Redraw users list after role changes are complete
    if(ret === SC.DRAG_NONE) {
      if(Tasks.get('autoSave')) Tasks.saveData();
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
      Tasks.deleteUser();
      return YES;
    }
    return NO;
  }
  
});
