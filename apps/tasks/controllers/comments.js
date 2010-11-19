//============================================================================
// Tasks.commentsController
//============================================================================
/*globals Tasks CoreTasks */

/**

  This is the Comments Controller to track comments for task being viewed/edited
  
  @extends SC.ArrayController
  @author Suvajit Gupta
*/

Tasks.commentsController = SC.ArrayController.create(
  /** @scope Tasks.commentsController.prototype */ {
    
    allowsMultipleSelection: NO,

    tasksSelectionBinding: SC.Binding.oneWay('Tasks.tasksController.selection'),
    _tasksSelectionDidChange: function() {
      var len = this.getPath('tasksSelection.length');
      // console.log('DEBUG: Tasks selection has count = ' + len);
      if(len === 1) this._updateContent();
    }.observes('tasksSelection'),
    
    commentsCountBinding: SC.Binding.oneWay('CoreTasks.allComments.length'),
    _commentsDidChange: function() {
      // console.log('DEBUG: Comments count changed to ' + CoreTasks.getPath('allComments.length'));
      this._updateContent();
    }.observes('commentsCount'),
    
    _updateContent: function() {
      // console.log('DEBUG: updating comments controller content');
      if(Tasks.get('editorPoppedUp') === Tasks.TASK_EDITOR) {
        var task = this.getPath('tasksSelection.firstObject');
        if(task) this.set('content', CoreTasks.getTaskComments(task));
      }
    }
    
});