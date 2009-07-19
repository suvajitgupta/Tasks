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
    console.log('#Tasks: ' + len);

    switch(len) {
      case 0: 
        ret = "No tasks";
        break;
      case 1:
        ret = "1 task";
        break;
      default:
        ret = "%@ tasks".fmt(len);
        break;
    }
    
    // display value
    context.push(ret);
    
  }
  
});
