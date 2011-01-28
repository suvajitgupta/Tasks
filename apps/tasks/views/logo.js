// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks sc_static */

/** 

  Display Tasks logo and version.
  
  @extends SC.View
  @author Suvajit Gupta
*/

Tasks.LogoView = SC.View.extend(
/** @scope Tasks.LogoView.prototype */ {
  
  logo: '',
  toolTip: '',
  version: '',
  displayProperties: ['logo', 'toolTip', 'version'],
  
  render: function(context, firstTime) {
    // console.log('DEBUG: LogoView.render()');
    sc_super();
    context = context.addClass(this.get('logo'));
    var toolTip = this.get('toolTip');
    if(toolTip !== '') context = context.attr({'title': toolTip,'alt': toolTip});
    context = context.push('<span class="tasks-version">' + this.get('version') + '</span>');
  }

});