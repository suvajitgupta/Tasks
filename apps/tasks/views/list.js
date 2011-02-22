// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals Tasks */

/** 

  ListView that supports toggling group items.
  
  @extends SC.List
  @author Suvajit Gupta
*/

Tasks.ListView = SC.ListView.extend(
/** @scope Tasks.ListView.prototype */ {
  
  // TODO: [SC] fix ListView to not use isSelected to indicate drop target - this causes selected items to appear unselected (delete next 2 functions when fixed)
  showInsertionPoint: function(itemView, dropOperation) {
    
    var view = this._insertionPointView;
    if (!view) {
      view = this._insertionPointView = this.get('insertionPointView').create();
    }
    
    var index  = itemView.get('contentIndex'),
        len    = this.get('length'),
        layout = SC.clone(itemView.get('layout')),
        level  = itemView.get('outlineLevel'),
        indent = itemView.get('outlineIndent') || 0,
        group;

    // show item indented if we are inserting at the end and the last item
    // is a group item.  This is a special case that should really be 
    // converted into a more general protocol.
    if ((index >= len) && index>0) {
      group = this.itemViewForContentIndex(len-1);
      if (group.get('isGroupView')) {
        level = 1;
        indent = group.get('outlineIndent');
      }
    }
    
    if (SC.none(level)) level = -1;
    
    if (dropOperation & SC.DROP_ON) {
      this.hideInsertionPoint();
      itemView.$().addClass('drop-target');
      this._lastDropOnView = itemView;
    } else {

      if (this._lastDropOnView) {
        this._lastDropOnView.$().removeClass('drop-target');
        this._lastDropOnView = null;
      }
      
      if (dropOperation & SC.DROP_AFTER) layout.top += layout.height;
      
      layout.height = 2;
      layout.right  = 0;
      layout.left   = ((level+1) * indent) + 12;
      delete layout.width;

      view.set('layout', layout);
      this.appendChild(view);
    }
  },
  
  hideInsertionPoint: function() {
    if (this._lastDropOnView) {
      this._lastDropOnView.$().removeClass('drop-target');
      this._lastDropOnView = null;
    }
    
    var view = this._insertionPointView;
    if (view) view.removeFromParent().destroy();
    this._insertionPointView = null;
  },

  toggle: function(index) {
    var del     = this.get('contentDelegate'),
        content = this.get('content');
    var state = del.contentIndexDisclosureState(this, content, index);
    if (state === SC.BRANCH_CLOSED) {
      del.contentIndexExpand(this,content,index);
    }
    else if (state === SC.BRANCH_OPEN) {
      del.contentIndexCollapse(this,content,index);
    } 
  }
    
});