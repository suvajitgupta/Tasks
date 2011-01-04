/**
 * State to handle project manager actions
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals Tasks Ki */

Tasks.ProjectManagerState = Ki.State.extend({
  
  initialSubstate: 'ready',
  
  // Initial state from which project management actions are handled
  ready: Ki.State.design()  
  
});
