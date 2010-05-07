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

Tasks.ProjectItemView = SC.ListItemView.extend(Tasks.LocalizedLabel,
/** @scope Tasks.ProjectItemView.prototype */ {
  
  displayProperties: ['displayName', 'displayTimeLeft'],
  
  /** @private
    If mouse was down over Description Icon open the editor.
  */  
  mouseDown: function(event) {
    
    // console.log('DEBUG: mouse down on project item: ' + this.getPath('content.name'));

    var that = this;
    var content = this.get('content');
    if(!content.get('id')) return sc_super();

    this.set('isSystemProject', CoreTasks.isSystemProject(content));
    
    // See what user clicked on
    var classes = event.target.className;
    // console.log('DEBUG: classes = "' + classes + '"');
    var sel = Tasks.getPath('projectsController.selection');
    var singleSelect = (sel && sel.get('length') === 1);
    
    if (singleSelect && classes !== "") { // one project selected and didn't click on the inline editable name
      var layer = this.get('layer');
      this._editorPane = SC.PickerPane.create({
        
        layout: { width: 740, height: 265 },
        _timeLeft: null,
        
        // Avoid popup panel coming up for system projects
        popup: function() {
          if(that.get('isSystemProject')) return;
          sc_super();
          Tasks.editorPoppedUp = true;
          this._timeLeft = that.getPath('content.timeLeft');
        },
        remove: function() {
          sc_super();
          Tasks.editorPoppedUp = false;
          if(Tasks.sourcesRedrawNeeded) {
            Tasks.projectsController.showSources();
          }
          if(this._timeLeft !== that.getPath('content.timeLeft')) { // if timeLeft has changed, redraw got load balancing recalculation
            Tasks.assignmentsController.showAssignments();
          }
          if(CoreTasks.get('autoSave')) Tasks.saveData();
        },
        
        contentView: SC.View.design({
          layout: { left: 0, right: 0, top: 0, bottom: 0},
          childViews: 'timeLeftLabel timeLeftField timeLeftHelpLabel descriptionLabel descriptionField createdAtLabel updatedAtLabel'.w(),
        
          timeLeftLabel: SC.LabelView.design({
            layout: { top: 10, left: 10, height: 17, width: 100 },
            value: "_TimeLeft:".loc()
          }),
          timeLeftField: SC.TextFieldView.design({
            layout: { top: 10, left: 75, width: 80, height: 20 },
            isEnabledBinding: 'CoreTasks.permissions.canUpdateProject',
            valueBinding: SC.binding('.content.timeLeftValue', this)
          }),
          timeLeftHelpLabel: SC.LabelView.design({
            layout: { top: 13, left: 160, height: 50, right: 10 },
            escapeHTML: NO,
            classNames: [ 'onscreen-help'],
            value: "_TimeLeftOnscreenHelp".loc()
          }),
          
          descriptionLabel: SC.LabelView.design({
            layout: { top: 40, left: 10, height: 17, width: 100 },
            icon: 'description-icon',
            value: "_Description:".loc()
          }),
          descriptionField: SC.TextFieldView.design({
            layout: { top: 65, left: 10, right: 10, bottom: 25 },
            hint: "_DescriptionHint".loc(),
            isTextArea: YES,
            isEnabledBinding: 'CoreTasks.permissions.canUpdateProject',
            valueBinding: SC.binding('.content.description', this)
          }),
          
          createdAtLabel: SC.LabelView.design({
            layout: { left:10, bottom: 5, height: 17, width: 250 },
            classNames: [ 'date-time'],
            textAlign: SC.ALIGN_LEFT,
            valueBinding: SC.binding('.content.displayCreatedAt', this)
          }),
          updatedAtLabel: SC.LabelView.design({
            layout: { right:10, bottom: 5, height: 17, width: 250 },
            classNames: [ 'date-time'],
            textAlign: SC.ALIGN_RIGHT,
            valueBinding: SC.binding('.content.displayUpdatedAt', this)
          })
            
        })
      });
      if(this._editorPane) this._editorPane.popup(layer, SC.PICKER_POINTER);
    }
    else { // popup context menu
      var items = this._buildContextMenu(that.get('isSystemProject'));
      if(items.length > 0) {
        var pane = SCUI.ContextMenuPane.create({
          contentView: SC.View.design({}),
          layout: { width: 125, height: 0 },
          itemTitleKey: 'title',
          itemIconKey: 'icon',
          itemIsEnabledKey: 'isEnabled',
          itemTargetKey: 'target',
          itemActionKey: 'action',
          itemSeparatorKey: 'isSeparator',
          items: items
        });
        pane.popup(this, event); // pass in the mouse event so the pane can figure out where to put itself
      }
    }
    return NO;
  },
  
  _buildContextMenu: function(isSystemProject) {
    
    var ret = [];
    
    if(CoreTasks.getPath('permissions.canCreateProject')) {
      ret.push({
        title: "_Add".loc(),
        icon: 'add-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'addProject'
      });
    }
    
    if(Tasks.projectsController.getPath('selection.length') === 1 &&
      !isSystemProject && CoreTasks.getPath('permissions.canCreateProject')) {
      ret.push({
        title: "_Duplicate".loc(),
        icon: 'duplicate-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'duplicateProject'
      });
    }
    
    if(!isSystemProject && CoreTasks.getPath('permissions.canDeleteProject')) {
      ret.push({
        title: "_Delete".loc(),
        icon: 'delete-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'deleteProject'
      });
    }
    
    return ret;
    
  },
  
  inlineEditorWillBeginEditing: function(inlineEditor) {
    this._name = this.getPath('content.name');
    if(!CoreTasks.getPath('permissions.canUpdateProject')) {
      console.warn('You do not have permission to edit a project');
      inlineEditor.discardEditing();
    }
    else {
      if(this.get('isSystemProject')) {
        console.warn('You cannot edit a system project');
        inlineEditor.discardEditing();
      }
    }
  },
  
  inlineEditorDidEndEditing: function(inlineEditor, finalValue) {
    if(finalValue !== this._name && CoreTasks.getProject(finalValue)) {
      console.error('There is already a project with this name');
      this.set('isEditing', NO) ;
      this.displayDidChange();
    }
    else {
      sc_super();
      if(finalValue.indexOf('{') >= 0) { // if effort was specified inline, redraw got load balancing recalculation
        Tasks.assignmentsController.showAssignments();
      }
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    }
  },
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(!content) return;
    // console.log('DEBUG: Project render(' + firstTime + '): ' + content.get('displayName'));
    sc_super();
    
    var isSystemProject = CoreTasks.isSystemProject(content);
    
    // Put a dot before non-system projects that were created or updated recently
    if(!isSystemProject && content.get('isRecentlyUpdated')) {
      context = context.begin('img').addClass('recently-updated').attr({
        src: SC.BLANK_IMAGE_URL,
        title: "_RecentlyUpdatedTooltip".loc(),
        alt: "_RecentlyUpdatedTooltip".loc()
      }).end();
    }

    var projectTooltip = '';
    if(content.get('id')) context.addClass('project-item');

  },

  renderIcon: function(context, icon){
    if(!SC.none(icon)) {
      var content = this.get('content');
      var projectTooltip = "_Has".loc() + content.getPath('tasks.length') + "_tasks".loc();
      context.begin('img').addClass('icon').addClass(icon).attr('src', SC.BLANK_IMAGE_URL)
            .attr('title', projectTooltip).attr('alt', projectTooltip).end();
    }
  },
  
  renderCount: function(context, count) {
    if(count) {
      var timeLeftTooltip = "_ProjectTimeLeftTooltip".loc();
      context.push('<span class="count" title="' + timeLeftTooltip + '">');
      context.push('<span class="inner">').push(count).push('</span></span>');
    }
  }
  
});
