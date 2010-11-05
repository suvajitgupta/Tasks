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