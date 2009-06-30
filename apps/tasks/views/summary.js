// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  A textual summary of what is displayed in the Tasks application.
  
  @extends SC.View
  @author Suvajit Gupta
*/

Tasks.SummaryView = SC.View.extend(
/** @scope Tasks.SummaryView.prototype */ {
  
  value: '',

  displayProperties: ['value'],
  
  render: function(context, firstTime) {

    var len = this.get('value') - 1, ret;

    switch(len) {
      case 0: 
        ret = "No projects";
        break;
      case 1:
        ret = "1 project";
        break;
      default:
        ret = "%@ projects".fmt(len);
        break;
    }
    
    // display value
    context.push(ret);
    
  }
  
});
