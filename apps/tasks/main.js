// ==========================================================================
// Project:   Tasks
// ==========================================================================
/*globals Tasks */

// This is the function that will start your app running.  The default
// implementation will load any fixtures you have created then instantiate
// your controllers and awake the elements on your page.
//
// As you develop your application you will probably want to override this.
// See comments for some pointers on what to do next.
//
/** @class

  @version 0.1
	@author Suvajit Gupta
*/

Tasks.main = function main() {

	console.log("Tasks started at: %@".fmt(new Date()));
	
	// Enter the statechart.
	// TODO: branch on Tasks "mode" (single-user/local, multi-user/Tasks server or other server)
  Tasks.goState('a', 1);

};

function main() { Tasks.main(); }
