// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  A workaround view so we can actually use SC.DROP_ON
  
  @extends SC.ListView
  @author Brandon Blatnick
*/

Tasks.ProjectsListView = SC.ListView.extend(
/** @scope Tasks.ProjectsListView.prototype */ {
  
  _computeDropOperationState: function(drag, evt, dragOp) {
    
    // get the insertion index for this location.  This can be computed
    // by a subclass using whatever method.  This method is not expected to
    // do any data valdidation, just to map the location to an insertion 
    // index.
    var loc    = this.convertFrameFromView(drag.get('location'), null),
        dropOp = SC.DROP_BEFORE,
        del    = this.get('selectionDelegate'),
        canReorder = this.get('canReorderContent'),
        objects, content, isPreviousInDrag, isNextInDrag, len;
    
    // STEP 1: Try with a DROP_ON option -- send straight to delegate if 
    // supported by view.
    
    // get the computed insertion index and possibly drop operation.
    // prefer to drop ON.
    var source = drag.get('source');
    var insertOp = SC.DROP_ON;
    if (source === this) {
      insertOp = SC.DROP_BEFORE;
    }
    var idx = this.insertionIndexForLocation(loc, insertOp) ;
    if (SC.typeOf(idx) === SC.T_ARRAY) {
      dropOp = idx[1] ; // order matters here
      idx = idx[0] ;
    }
    
    // if the return drop operation is DROP_ON, then just check it with the
    // delegate method.  If the delegate method does not support dropping on,
    // then it will return DRAG_NONE, in which case we will try again with
    // drop before.
    if (dropOp === SC.DROP_ON) {
      
      // Now save the insertion index and the dropOp.  This may be changed by
      // the collection delegate.
      this.set('proposedInsertionIndex', idx) ;
      this.set('proposedDropOperation', dropOp) ;
      dragOp = del.collectionViewValidateDragOperation(this, drag, dragOp, idx, dropOp) ;
      idx = this.get('proposedInsertionIndex') ;
      dropOp = this.get('proposedDropOperation') ;
      this._dropInsertionIndex = this._dropOperation = null ;

      // The delegate is OK with a drop on also, so just return.
      if (dragOp !== SC.DRAG_NONE) return [idx, dropOp, dragOp] ;
        
      // The delegate is NOT OK with a drop on, try to get the insertion
      // index again, but this time prefer SC.DROP_BEFORE, then let the 
      // rest of the method run...
      else {
        dropOp = SC.DROP_BEFORE ;
        idx = this.insertionIndexForLocation(loc, SC.DROP_BEFORE) ;
        if (SC.typeOf(idx) === SC.T_ARRAY) {
          dropOp = idx[1] ; // order matters here
          idx = idx[0] ;
        }
      }
    }
    
    // if this is a reorder drag, set the proposed op to SC.DRAG_REORDER and
    // validate the insertion point.  This only works if the insertion point
    // is DROP_BEFORE or DROP_AFTER.  DROP_ON is not handled by reordering 
    // content.
    if ((idx >= 0) && canReorder && (dropOp !== SC.DROP_ON)) {
      
      objects = drag.dataForType(this.get('reorderDataType')) ;
      if (objects) {
        content = this.get('content') ;
        
        // if the insertion index is in between two items in the drag itself, 
        // then this is not allowed.  Either use the last insertion index or 
        // find the first index that is not in between selections.  Stop when
        // we get to the beginning.
        if (dropOp === SC.DROP_BEFORE) {
          isPreviousInDrag = objects.indexes.contains(idx-1);
          isNextInDrag     = objects.indexes.contains(idx);
        } else {
          isPreviousInDrag = objects.indexes.contains(idx);
          isNextInDrag     = objects.indexes.contains(idx-1);
        }
        
        if (isPreviousInDrag && isNextInDrag) {
          if (SC.none(this._lastInsertionIndex)) {
            if (dropOp === SC.DROP_BEFORE) {
              while ((idx >= 0) && objects.indexes.contains(idx)) idx--;
            } else {
              len = content ? content.get('length') : 0;
              while ((idx < len) && objects.indexes.contains(idx)) idx++;
            }
          } else idx = this._lastInsertionIndex ;
        }
        
        // If we found a valid insertion point to reorder at, then set the op
        // to custom DRAG_REORDER.
        if (idx >= 0) dragOp = SC.DRAG_REORDER ;
      }
    }
    
    // Now save the insertion index and the dropOp.  This may be changed by
    // the collection delegate.
    this.set('proposedInsertionIndex', idx) ;
    this.set('proposedDropOperation', dropOp) ;
    dragOp = del.collectionViewValidateDragOperation(this, drag, dragOp, idx, dropOp) ;
    idx = this.get('proposedInsertionIndex') ;
    dropOp = this.get('proposedDropOperation') ;
    this._dropInsertionIndex = this._dropOperation = null ;
    
    // return generated state
    return [idx, dropOp, dragOp] ;
  },
  
  insertionIndexForLocation: function(loc, dropOperation) { 
    var indexes = this.contentIndexesInRect(loc),
        index   = indexes.get('min'),
        len     = this.get('length'),
        min, max, diff, clevel, cindent, plevel, pindent, itemView;

    // if there are no indexes in the rect, then we need to either insert
    // before the top item or after the last item.  Figure that out by 
    // computing both.
    if (SC.none(index) || index<0) {
      if ((len===0) || (loc.y <= this.rowOffsetForContentIndex(0))) index = 0;
      else if (loc.y >= this.rowOffsetForContentIndex(len)) index = len;
    }

    // figure the range of the row the location must be within.
    min = this.rowOffsetForContentIndex(index);
    max = min + this.rowHeightForContentIndex(index);
    
    // now we know which index we are in.  if dropOperation is DROP_ON, figure
    // if we can drop on or not.
    if (dropOperation == SC.DROP_ON) {
      // editable size - reduce height by a bit to handle dropping
      if (this.get('isEditable')) diff=Math.min(Math.floor((max-min)*0.2),5);
      else diff = 0;
      
      // if we're inside the range, then DROP_ON
      if (loc.y >= (min+diff) || loc.y <= (max+diff)) {
        return [index, SC.DROP_ON];
      }
    }
    else {
      dropOperation = SC.DROP_BEFORE;
    }
    
    // ok, now if we are in last 10px, go to next item.
    if ((index<len) && (loc.y >= max-10)) index++;
    
    // finally, let's decide if we want to actually insert before/after.  Only
    // matters if we are using outlining.
    if (index>0) {
      itemView = this.itemViewForContentIndex(index);
      clevel   = itemView ? itemView.get('outlineLevel') : 0;
      cindent  = (itemView ? itemView.get('outlineIndent') : 0) || 0;
      cindent  *= clevel;
      
      itemView = this.itemViewForContentIndex(index);
      pindent  = (itemView ? itemView.get('outlineIndent') : 0) || 0;
      plevel   = itemView ? itemView.get('outlineLevel') : 0;
      pindent  *= plevel;

      // if indent levels are different, then try to figure out which level 
      // it should be on.
      if ((clevel !== plevel) && (cindent !== pindent)) {
        // use most inner indent as boundary
        if (((pindent > cindent) && (loc.x >= pindent)) ||
            ((pindent < cindent) && (loc.x <= cindent))) {
          index-- ;
          dropOperation = SC.DROP_AFTER;
        }
      }
    }

    return [index, dropOperation];
  }
});
