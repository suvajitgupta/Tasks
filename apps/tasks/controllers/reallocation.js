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
      var currentProject = Tasks.projectController.content.firstObject();
      var newProject = content.objectAt(idx);
      
      tasks.forEach(function(task) {
        if (currentProject !== CoreTasks.get('allTasks')) {
          currentProject.removeTask(task);
        }
        newProject.addTask(task);
      }, this);
      
      ret = SC.DRAG_MOVE;
    }       
  
    return ret;
  }
});