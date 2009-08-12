// ==========================================================================
// Tasks.ExportDataController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for the import data pane.
*/
Tasks.exportDataController = SC.ObjectController.create(
/** @scope Orion.ExportDataController.prototype */ {

   /**
    * Export data to external text file.
    */
    exportData: function() {
    var val, task, user;
    var data = "# Tasks data export at " + new Date().format('MMM dd, yyyy hh:mm:ssa') + '\n\n';
    var pc = Tasks.get('projectsController');

    pc.forEach(function(rec){
          if (rec.get('name') === CoreTasks.ALL_TASKS_NAME) return;
          var tasks = rec.get('tasks');
          var len = tasks.get('length');
          if(rec.get('name') !== CoreTasks.INBOX_NAME) {
            data += rec.get('displayName') + '\n';
          }
          for (var i = 0; i < len; i++) {
            task = tasks.objectAt(i);
            switch(task.get('priority')) {
              case CoreTasks.TASK_PRIORITY_HIGH: val = '^'; break;
              case CoreTasks.TASK_PRIORITY_MEDIUM: val = '-'; break;
              case CoreTasks.TASK_PRIORITY_LOW: val = 'v'; break;
            }
            data += val + ' ';
            data += task.get('displayName');
            user = task.get('submitter');
            if (user) data += ' <' + user.get('name') + '>';
            user = task.get('assignee');
            if (user) data += ' [' + user.get('name') + ']';
            val = task.get('type');
            if(val !== CoreTasks.TASK_TYPE_OTHER)  data += ' $' + val;
            val = task.get('status');
            if(val !== CoreTasks.TASK_STATUS_PLANNED)  data += ' @' + val;
            val = task.get('validation');
            if(val !== CoreTasks.TASK_VALIDATION_UNTESTED)  data += ' %' + val;
            val = task.get('description');
            if(val) {
              var lines = val.split('\n');
              for (var j = 0; j < lines.length; j++) {
                data += '\n| ' + lines[j];
              }
            }
            data += '\n';
          }
          data += '\n';
      }, pc);
    
    console.log(data);
  }
  
});
