// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks sc_require*/

/** 

  A specialized SourceListView that deselects all items if you click on an empty area.
  
  @extends SC.SourceListView
  @author Suvajit Gupta
*/

Tasks.SourceListView = SC.SourceListView.extend(
/** @scope Tasks.SourceListView.prototype */ {
  
  taskClickedOn: false, // HACK: [SG] set in TaskItemView - working around strange timing delays in selection changing after clicks
  mouseDown: function(evt) {
    var taskClickedOn = this.get('taskClickedOn');
    var itemView = this.itemViewForEvent(evt);
    // console.log('Tasks.SourceListView mouse down, taskClickedOn=' + taskClickedOn + ', itemView=' + itemView);
    if(!itemView && taskClickedOn) {
      this.set('taskClickedOn', false);
      return YES;
    }
    var contentIndex = itemView? itemView.get('contentIndex') : -1;
    if (contentIndex === -1) {
      // if left-click with no selected itemView, de-select
      if (evt && evt.which === 1) {
        SC.RunLoop.begin();
        this.set('selection', '');
        SC.RunLoop.end();
      }
    }
    return sc_super();
  }
  
});
