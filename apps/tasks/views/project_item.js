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
    
    var that = this;
    var content = this.get('content');
    if(!content.get('id')) return sc_super();

    this.set('isSystemProject', CoreTasks.isSystemProject(content));
    
    var classes = event.target.className;
    if (classes.match('project-icon-no-tasks') || classes.match('project-icon-has-tasks') ||
        classes.match('count') || classes.match('inner')) {
      var layer = this.get('layer');
      this._editorPane = SC.PickerPane.create({
        
        layout: { width: 740, height: 265 },
        _timeLeft: null,
        
        // Avoid popup panel coming up on other items while it is up already
        popup: function() {
          sc_super();
          Tasks.editorPoppedUp = true;
          if(that.get('isSystemProject')) return;
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
        },
        
        contentView: SC.View.design({
          layout: { left: 0, right: 0, top: 0, bottom: 0},
          childViews: [
          
            SC.LabelView.design({
              layout: { top: 10, left: 10, height: 17, width: 100 },
              value: "_TimeLeft:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 10, left: 75, width: 80, height: 20 },
              isEnabledBinding: 'CoreTasks.permissions.canEditProject',
              valueBinding: SC.binding('.content.timeLeftValue', this)
            }),
            SC.LabelView.design({
              layout: { top: 13, left: 160, height: 50, right: 10 },
              escapeHTML: NO,
              classNames: [ 'onscreen-help'],
              value: "_TimeLeftOnscreenHelp".loc()
            }),
            
            SC.LabelView.design({
              layout: { top: 40, left: 10, height: 17, width: 100 },
              value: "_Description:".loc()
            }),
            SC.TextFieldView.design({
              layout: { top: 65, left: 10, right: 10, bottom: 25 },
              hint: "_DescriptionHint".loc(),
              isTextArea: YES,
              isEnabledBinding: 'CoreTasks.permissions.canEditProject',
              valueBinding: SC.binding('.content.description', this)
            }),
            SC.LabelView.design({
              layout: { left:10, bottom: 5, height: 17, width: 250 },
              classNames: [ 'date-time'],
              textAlign: SC.ALIGN_LEFT,
              valueBinding: SC.binding('.content.displayCreatedAt', this)
            }),
            SC.LabelView.design({
              layout: { right:10, bottom: 5, height: 17, width: 250 },
              classNames: [ 'date-time'],
              textAlign: SC.ALIGN_RIGHT,
              valueBinding: SC.binding('.content.displayUpdatedAt', this)
            })
            
          ]
        })
      }).popup(this, SC.PICKER_MENU);
      if(this._editorPane) this._editorPane.popup(layer, SC.PICKER_POINTER);
    }
    else { // popup context menu
      var pane = SCUI.ContextMenuPane.create({
        contentView: SC.View.design({}),
        layout: { width: 150, height: 0 },
        itemTitleKey: 'title',
        itemIconKey: 'icon',
        itemIsEnabledKey: 'isEnabled',
        itemTargetKey: 'target',
        itemActionKey: 'action',
        itemSeparatorKey: 'isSeparator',
        items: this._buildContextMenu(that.get('isSystemProject'))
      });
      pane.popup(this, event); // pass in the mouse event so the pane can figure out where to put itself
    }
    return NO;
  },
  
  _buildContextMenu: function(isSystemProject) {
    
    var ret = [];
    
    if(CoreTasks.getPath('permissions.canAddProject')) {
      ret.push({
        title: "_Add".loc(),
        icon: 'add-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'addProject'
      });
    }
    
    if(!isSystemProject && CoreTasks.getPath('permissions.canAddProject')) {
      ret.push({
        title: "_Duplicate".loc(),
        icon: 'project-duplicate-icon',
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
    
    ret.push({
      title: "_ShowStatistics".loc(),
      icon: sc_static('blank'),
      isEnabled: YES,
      target: 'Tasks',
      action: 'projectStatistics'
    });
    
    return ret;
    
  },
  
  inlineEditorWillBeginEditing: function(inlineEditor) {
    if(!CoreTasks.getPath('permissions.canEditProject')) {
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
    sc_super();
    if(finalValue.indexOf('{') >= 0) { // if effort was specified inline, redraw got load balancing recalculation
      Tasks.assignmentsController.showAssignments();
    }
  },
  
  renderIcon: function(context, icon){
    var content = this.get('content');
    var projectTooltip = '';
    if(!CoreTasks.isSystemProject(content)) projectTooltip = "_ProjectEditorTooltip".loc();
    context.begin('img').addClass('icon').addClass(icon).attr('src', SC.BLANK_IMAGE_URL)
          .attr('title', projectTooltip).attr('alt', projectTooltip).end();
  },
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(!content) return;
    // console.log('DEBUG-ON: Project render(' + firstTime + '): ' + content.get('displayName'));
    sc_super();
    
    var projectTooltip = '';
    if(content.get('id')) {
      context.addClass('project-item');
      var tasks = content.get('tasks');
      if(tasks) {
        projectTooltip += "_Has".loc() + tasks.get('length') + "_tasks".loc();
      }
      if (CoreTasks.isSystemProject(content)) projectTooltip += ('; ' + "_SystemProject".loc());
      else if(content.get('displayTimeLeft')) projectTooltip += ('; ' + "_ProjectTimeLeftTooltip".loc());
      if(projectTooltip !== '') {
        context.attr('title', projectTooltip);
        context.attr('alt', projectTooltip);
      }
    }

  }
});
