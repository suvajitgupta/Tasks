// ==========================================================================
// Project:   Tasks.projectsListDelegate
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

/** @class

  This is the delegate for the project list view.

  @extends SC.Object
  @author Brandon Blatnick
  @author Suvajit Gupta
*/
Tasks.projectsListDelegate = SC.Object.create(SC.CollectionViewDelegate,
/** @scope Tasks.projectsListDelegate.prototype */ {
  
  // ..........................................................
  // DRAG SOURCE SUPPORT
  // 
  
  /**
    When dragging, add Task data type to the drag.
  */
  collectionViewDragDataTypes: function(view) {
    return [CoreTasks.Project];
  },
  
  /**
    If the requested dataType is a Project, provide the currently selected projects.  Otherwise return null.
  */
  collectionViewDragDataForType: function(view, drag, dataType) {
    var ret=null, sel;
    if (dataType === CoreTasks.Project) {
      sel = view.get('selection');
      ret = [];
      if (sel) sel.forEach(function(x) { ret.push(x); }, this);
    }
    return ret;
  },
  
  // ..........................................................
  // DRAGGING
  //
  collectionViewValidateDragOperation: function(view, drag, op, proposedInsertionIndex, proposedDropOperation) {
    // only allow dropping on of tasks
    if(drag.hasDataType(CoreTasks.Task)) return (proposedDropOperation & SC.DROP_ON) ? op : SC.DRAG_NONE;
    return op;
  },
  
  // ..........................................................
  // DROP TARGET SUPPORT
  // 
  collectionViewComputeDragOperations: function(view, drag, proposedDragOperations) {
    if (drag.hasDataType(CoreTasks.Project) || drag.hasDataType(CoreTasks.Task)) {
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
    
    var ret = SC.DRAG_MOVE;
    var content = view.get('content');
    
    if(drag.hasDataType(CoreTasks.Project)) {
      
      if(CoreTasks.getPath('currentUser.role') !== CoreTasks.USER_ROLE_MANAGER) {
        console.warn('You do not have permission to modify the status of projects');
        return ret;
      }

      // tells the CollectionView to do nothing
      if (idx < 0) return ret;

      // Extract projects to drag
      var projects = drag.dataForType(CoreTasks.Project);
      if(!projects) return ret;

      // Get status of item before drop location
      var dropLocation = content.objectAt(idx);
      if(CoreTasks.isSystemProject(dropLocation) || !dropLocation) return ret;
      var targetStatus = dropLocation.get('developmentStatus');
      if(SC.none(targetStatus)) return ret;

      // Set dragged projects' status to new status
      projects.forEach(function(project) {
        if (project.get('developmentStatus') !== targetStatus) {
          // console.log('Changing status of project "' + project.get('name') + '" to: ' + targetStatus.loc());
          project.set('developmentStatus', targetStatus);
          ret = SC.DRAG_MOVE;
        }
      }, this);

    }
    else if(drag.hasDataType(CoreTasks.Task)) {
    
      if(CoreTasks.getPath('currentUser.role') === CoreTasks.USER_ROLE_GUEST) {
        console.warn('You do not have permission to reallocate tasks');
        return SC.DRAG_MOVE;
      }
      if (dragOp & SC.DRAG_REORDER) return SC.DRAG_MOVE; // disallow reorder
    
      var tasks = drag.dataForType(CoreTasks.Task);
    
      // only if data is available from drag
      if (!tasks) return ret;
        
      // if we can move, then remove tasks from the old project and add to the new project
      if (!(dragOp & SC.DRAG_MOVE)) ret = SC.DRAG_COPY;
      else {
        var targetProject = content.objectAt(idx);
        if (targetProject.get('id') && targetProject !== CoreTasks.get('allTasksProject') && targetProject !== CoreTasks.get('unassignedTasksProject')) {
          tasks.forEach(function(task) {
            var targetProjectId = (targetProject === CoreTasks.get('unallocatedTasksProject')? null : targetProject.get('id'));
            // console.log('Reallocating task "' + task.get('name') + '" to project "' + targetProject.get('name'));
            task.set('projectId', targetProjectId);
            ret = SC.DRAG_MOVE;
          }, this);
        }
      }       
    }
    

    if(ret === SC.DRAG_MOVE) {
      if(CoreTasks.get('autoSave')) Tasks.saveData();
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