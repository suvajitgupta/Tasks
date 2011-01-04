/**
 * State to handle task manager actions
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals Tasks Ki */

Tasks.TaskManagerState = Ki.State.extend({
  
  initialSubstate: 'ready',
  
  // Initial state from which task management actions are handled
  ready: Ki.State.design()  
  
});
