// ==========================================================================
// Project:   Tasks
// ==========================================================================
/**

  "Tasks" - an agile project management tool
  
  @extends SC.Object
  @author Suvajit Gupta
  @version 0.1
*/
/*globals Tasks sc_require */
sc_require('statechart');

Tasks = SC.Object.create(SC.Statechart,
  /** @scope Tasks.prototype */ {

  NAMESPACE: 'Tasks',
  VERSION: '0.3',
});

// TODO: [SG] switch to MIT license
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
