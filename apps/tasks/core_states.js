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
    // var user = prompt('Login name:'); // TODO: replace with proper Login dialog
    var user = 'bigboss';
    if (user !== null && user !== '') {
      Tasks.login(user, 'password'); // TODO: pass actual password input by user
    }
  },

  // Authentication
  goStateA2: function(){
    // TODO: implement
  },

  // Data Loading
  goStateA3: function(){
    // TODO: implement
    Tasks.getPath('mainPage.mainPane').append();
  },

  // Project/Task Management
  goStateA4: function(){
    // Instantiate Views
   // 
    
    // Select first project at startupi 
    Tasks.getPath('mainPage.mainPane').get('projectsList').select(0);
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
