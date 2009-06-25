/**
 * A mixin that defines all of the state transitions.
 *
 * @author Sean Eidemiller
 * @author Suvajit Gupta
 */
/*globals Tasks sc_require */
sc_require('core');

Tasks.mixin({
	
  // Login
  goStateA1: function(){
		// TODO: switch to SC View/Controller for login page
		var user = prompt('Login name:');
		if (user !== null && user !== '') {
			Tasks.login(user);
		}
  },

  // Authentication
  goStateA2: function(){
		// TODO: implement
  },

  // Data Loading
  goStateA3: function(){
		// TODO: implement
  },

  // Project/Task Management
  goStateA4: function(){
	  // Set the content property on your primary controller.
	  // This will make your app come alive!
	  var projects = Tasks.store.findAll(Tasks.Project);
	  Tasks.projectsController.set('content', projects);

	  // Instantiate Your Views
	  // The default code here will make the mainPane for your application visible
	  // on screen.  If you app gets any level of complexity, you will probably 
	  // create multiple pages and panes.  
	  Tasks.getPath('mainPage.mainPane').append();
  }

});

// ============================================================================
// Tasks -- A simplified task manager built with the SproutCore framework
// Copyright (C) 2009 Suvajit Gupta
//
// This program is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option)
// any later version.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
// more details.
//
// You should have received a copy of the GNU General Public License along
// with this program.  If not, see <http://www.gnu.org/licenses/>.
// ============================================================================
