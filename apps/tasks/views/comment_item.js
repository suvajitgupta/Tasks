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

Tasks.CommentItemView = SC.View.extend(SC.Control,
/** @scope Tasks.CommentItemView.prototype */ {
  
  useStaticLayout: YES,
  displayProperties: 'showHover description'.w(),
  showHover: SC.platform.touch,
  description: null,
  
  /** @private
    Add explicit hover class - using this to avoid problems on iPad.
  */  
  mouseEntered: function(event) {
    this.set('showHover', YES);
    return YES;
  },

  /** @private
    Remove explicit hover class - using this to avoid problems on iPad.
  */  
  mouseExited: function(event) {
    this.set('showHover', NO);
    return YES;
  },

  useStaticLayout: YES,
  childViews: 'commentHeaderLabel editButton deleteButton descriptionLabel'.w(),
  
  commentHeaderLabel: SC.LabelView.design({
    layout: { left: 0, right: 0, top: 0, height: 17 },
    classNames: [ 'comment-header'],
    icon: 'comment-icon',
    escapeHTML: NO
  }),
  
  editButton: SC.View.design(SCUI.SimpleButton, {
    layout: { right: 45, width: 16, top: 2, height: 16 },
    classNames: ['edit-comment-icon'],
    toolTip: "_EditComment".loc(),
    mouseDown: function() {
      sc_super();
      Tasks.commentsController.selectObject(this.getPath('parentView.content'));
      this.get('parentView').editDescription();
      return YES;
    }
  }),
  
  deleteButton: SC.View.design(SCUI.SimpleButton, {
    layout: { right: 15, width: 16, top: 2, height: 16 },
    classNames: ['delete-comment-icon'],
    toolTip: "_DeleteComment".loc(),
    mouseDown: function() {
      sc_super();
      this.getPath('parentView.content').destroy();
      return YES;
    }
  }),
  
  descriptionLabel: SC.LabelView.design({
    useStaticLayout: YES,
    classNames: [ 'comment-description'],
    tagName: 'pre',
    doubleClick: function() {
      if(this.get('isEditable')) this.get('parentView').editDescription();
    }
  }),
  
  contentPropertyDidChange: function(target, key) {
    if (this.owner && this.owner.updateHeight) this.owner.updateHeight();
  },
  
  editDescription: function() {
    var that = this;
    var pane = SC.PickerPane.create({
      layout: { width: 700, height: 120 },
      contentView: SC.View.design({
        childViews: 'descriptionField'.w(),
        classNames: [ 'comment-editor'],
        descriptionField: SC.TextFieldView.design({
          layout: { left: 5, right: 5, top: 5, bottom: 5 },
          classNames: [ 'comment-description'],
          isTextArea: YES,
          valueBinding: 'Tasks.commentsController.selection.firstObject.description'
        })
      }),
      remove: function() {
        sc_super();
        var comment = that.get('content');
        var description = comment.get('description');
        console.log("'" + description + "'");
        if(description === CoreTasks.NEW_COMMENT_DESCRIPTION.loc()) comment.destroy();
        else that.set('description', description);
      }
    });
    pane.popup(this, SC.PICKER_POINTER);
    pane.getPath('contentView.descriptionField').becomeFirstResponder();
  },
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    // console.log('DEBUG: Comment render(' + firstTime + '): ' + content.get('description'));
    if(!content) return;
    
    var isCurrentUserComment = content.get('userId') === CoreTasks.getPath('currentUser.id');
    var showHover = this.get('showHover');
    this.setPath('editButton.isVisible', showHover && isCurrentUserComment);
    this.setPath('deleteButton.isVisible', showHover && isCurrentUserComment);
    this.setPath('descriptionLabel.isEditable', isCurrentUserComment);
    
    var user = CoreTasks.store.find(CoreTasks.User, content.get('userId'));
    var commentHeader = '';
    if(user) commentHeader += (user.get('displayName') + '&nbsp;');
    var createdAt = content.get('createdAt');
    if(createdAt) commentHeader += ('<span class="date-time">' + "_commented".loc() + Tasks.getTimeAgo(createdAt) + '</span>');
    this.setPath('commentHeaderLabel.value', commentHeader);
    this.setPath('descriptionLabel.value', content.get('description'));
    this.renderChildViews(context, firstTime);
    
  }

});