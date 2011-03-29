// Project: Tasks 
// ==========================================================================
/*globals Tasks CoreTasks*/
/** 

  Tasks editor helper.
  
  @extends SC.Object
  @author Suvajit Gupta
*/

Tasks.taskEditorHelper = SC.Object.create({
  
  types: function() {
     var ret = [];
     ret.push({ name: CoreTasks.TASK_TYPE_FEATURE, value: CoreTasks.TASK_TYPE_FEATURE, icon: 'task-icon-feature' });
     ret.push({ name: CoreTasks.TASK_TYPE_BUG, value: CoreTasks.TASK_TYPE_BUG, icon: 'task-icon-bug' });
     ret.push({ name: CoreTasks.TASK_TYPE_OTHER, value: CoreTasks.TASK_TYPE_OTHER, icon: 'task-icon-other' });
     return ret;
  },

  priorities: function() {
     var ret = [];
     ret.push({ name: '<span class=task-priority-high>' + CoreTasks.TASK_PRIORITY_HIGH.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_HIGH });
     ret.push({ name: '<span class=task-priority-medium>' + CoreTasks.TASK_PRIORITY_MEDIUM.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_MEDIUM });
     ret.push({ name: '<span class=task-priority-low>' + CoreTasks.TASK_PRIORITY_LOW.loc() + '</span>', value: CoreTasks.TASK_PRIORITY_LOW });
     return ret;
  },

  statuses: function() {
     var ret = [];
     ret.push({ name: '<span class=status-planned>' + CoreTasks.STATUS_PLANNED.loc() + '</span>', value: CoreTasks.STATUS_PLANNED });
     ret.push({ name: '<span class=status-active>' + CoreTasks.STATUS_ACTIVE.loc() + '</span>', value: CoreTasks.STATUS_ACTIVE });
     ret.push({ name: '<span class=status-done>' + CoreTasks.STATUS_DONE.loc() + '</span>', value: CoreTasks.STATUS_DONE });
     ret.push({ name: '<span class=status-risky>' + CoreTasks.STATUS_RISKY.loc() + '</span>', value: CoreTasks.STATUS_RISKY });
     return ret;
  },

  validations: function() {
     var ret = [];
     ret.push({ name: '<span class=task-validation-untested>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_UNTESTED });
     ret.push({ name: '<span class=task-validation-passed>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_PASSED });
     ret.push({ name: '<span class=task-validation-failed>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</span>', value: CoreTasks.TASK_VALIDATION_FAILED });
     return ret;
  },

  _usersCountBinding: SC.Binding.oneWay('Tasks.usersController*arrangedObjects.length'),
  _listUsers: function() {
    // console.log('DEBUG: _listUsers');
    var users = Tasks.usersController.get('content');
    var ret1 = [], ret2 = [];
    if(users) {
      users = users.toArray();
      for(var i=0, len = users.get('length'); i < len; i++) {
        var user = users.objectAt(i);
        ret1.push(user);
        if(user.get('role') !== CoreTasks.USER_ROLE_GUEST) ret2.push(user);
      }
      var unassigned = { id: 0, displayName: "_Unassigned".loc(), icon: 'no-icon' };
      ret1.push(unassigned);
      ret2.push(unassigned);
    }
    this.set('users', ret1);
    this.set('nonGuestsList', ret2);
  }.observes('_usersCount'),
  users: null,
  nonGuestsList: null,

  _projectsCountBinding: SC.Binding.oneWay('Tasks.projectsController*arrangedObjects.length'),
  _listProjects: function() {
    // console.log('DEBUG: _listProjects');
    var projects = Tasks.projectsController.get('content');
    var ret = [];
    if(projects) {
      ret = projects.toArray();
      // Remove system projects from list since you cannot assign to them
      var idx = ret.indexOf(CoreTasks.get('allTasksProject'));
      if(idx !== -1) ret.splice(idx, 1);
      idx = ret.indexOf(CoreTasks.get('unassignedTasksProject'));
      if(idx !== -1) ret.splice(idx, 1);
      idx = ret.indexOf(CoreTasks.get('unallocatedTasksProject'));
      if(idx !== -1) {
        ret.splice(idx, 1);
        ret.push({ id: 0, icon: CoreTasks.getPath('unallocatedTasksProject.icon'), displayName: "_UnallocatedTasks".loc() });
      }
    }
    this.set('projects', ret);
  }.observes('_projectsCount'),
  projects: null
  
});
