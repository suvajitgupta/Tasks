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
    classNames: [ 'submitter-user']
  }),
  
  createdAtLabel: SC.LabelView.design({
    layout: { centerX: 0, top: 0, height: 17, width: 250 },
    classNames: [ 'date-time'],
    textAlign: SC.ALIGN_CENTER
  }),
  
  descriptionLabel: SC.LabelView.design({
    layout: { left: 0, right: 0, top: 20, bottom: 10 },
    classNames: [ 'description'],
    isInlineEditorMultiline: YES,
    escapeHTML: NO,
    inlineEditorDidEndEditing: function(inlineEditor, finalValue) {
      sc_super();
      var comment = this.getPath('parentView.content');
      comment.setIfChanged('description', finalValue);
    }    
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