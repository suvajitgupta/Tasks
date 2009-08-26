// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  Display number of Tasks in selected Project.
  
  @extends SC.View
  @author Suvajit Gupta
*/

Tasks.SummaryView = SC.View.extend(
/** @scope Tasks.SummaryView.prototype */ {
  
  value: '',

  displayProperties: ['value'],
  
  render: function(context, firstTime) {

    var len = this.get('value'), ret;
    // console.log('#Tasks: ' + len); // TODO: [SG] see why this is being called so many times at startup

    switch(len) {
      case 0: 
        ret = "Selected project has no tasks";
        break;
      case 1:
        ret = "Selected project has 1 task";
        break;
      default:
        ret = "Selected project has %@ tasks".fmt(len);
        break;
    }
    
    // display value
    context.push(ret);
    
  }
  
});
