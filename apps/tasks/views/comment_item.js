// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI sc_static */
sc_require('mixins/localized_label');

/** 

  Used as exampleView for project information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.CommentItemView = SC.ListItemView.extend(
/** @scope Tasks.CommentItemView.prototype */ {
  
  childViews: 'userLabel createdAtLabel descriptionLabel'.w(),
  
  userLabel: SC.LabelView.design({
    layout: { left: 5, top: 0, height: 17, width: 250 },
    classNames: [ 'submitter-user'],
    textAlign: SC.ALIGN_LEFT
  }),
  
  createdAtLabel: SC.LabelView.design({
    layout: { right: 5, top: 0, height: 17, width: 250 },
    classNames: [ 'date-time'],
    textAlign: SC.ALIGN_RIGHT
  }),
  
  descriptionLabel: SC.LabelView.design({
    layout: { left: 5, top: 20, bottom: 5, right: 5 },
    classNames: [ 'description'],
    escapeHTML: NO,
    textAlign: SC.ALIGN_LEFT
  }),
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(!content) return;
    // console.log('DEBUG: Comment render(' + firstTime + '): ' + content.get('description'));
    
    var user = CoreTasks.store.find(CoreTasks.User, content.get('userId'));
    if(user) this.setPath('userLabel.value', user.get('displayName'));
    var createdAt = content.get('createdAt');
    if(createdAt) this.setPath('createdAtLabel.value', "_Posted:".loc() + createdAt.toFormattedString(CoreTasks.TIME_DATE_FORMAT));
    this.setPath('descriptionLabel.value', content.get('description').replace(/\n/g, '<br>'));
    this.renderChildViews(context, firstTime);
    
  }

});