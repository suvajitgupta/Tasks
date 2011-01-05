/**
 * A state to manage interactions of a logged in user.
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals Tasks Ki */

Tasks.LoggedInState = Ki.State.extend({
  
  substatesAreConcurrent: YES,
  
  enterState: function() {
    Tasks.loadData();
    Tasks.getPath('mainPage.mainPane.projectsList').becomeFirstResponder();
  },
  
  // State to handle globally available actions
  globals: Ki.State.plugin('Tasks.GlobalsState'),
  
  // State to handle project manager actions
  projectManager: Ki.State.plugin('Tasks.ProjectManagerState'),
  
  // State to handle task manager actions
  taskManager: Ki.State.plugin('Tasks.TaskManagerState'),
  
  exitState: function() {
    Tasks.getPath('mainPage.mainPane').remove();
  }
  
});
