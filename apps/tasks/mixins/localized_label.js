// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  A mixin to localize labels
  
	@author Suvajit Gupta
*/
Tasks.localizedLabel = {
  
  renderLabel: function(context, label) {
    context.push('<label>', label? label.loc() : '', '</label>') ;
  }

};
