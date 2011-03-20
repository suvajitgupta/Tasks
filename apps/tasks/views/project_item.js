// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI */
sc_require('mixins/localized_label');

/** 

  Used as exampleView for project information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.ProjectItemView = SC.ListItemView.extend(Tasks.LocalizedLabel,
/** @scope Tasks.ProjectItemView.prototype */ {
  
  displayProperties: ['displayName', 'displayCountDown', 'description', 'showHover'],
  
  /** @private
    Add explicit hover class - using this to avoid problems on iPad.
  */  
  mouseEntered: function(evt) {
    this.set('showHover', YES);
    return YES;
  },

  /** @private
    Remove explicit hover class - using this to avoid problems on iPad.
  */  
  mouseExited: function(evt) {
    this.set('showHover', NO);
    return YES;
  },

  /** @private
    If user holds touch for a bit on iPad, start the task editor.
  */  
  _timer: null,
  _startEditing: function() {
    if(this._timer) {
      this._timer.invalidate();
      this._timer = null;
    }
    Tasks.projectEditorPage.popup(this.get('content'));
  },
  touchStart: function(event) {
    // console.log('DEBUG: touch start on project item: ' + this.getPath('content.name'));
    Tasks.projectsController.selectObject(this.get('content'));
    if (this._timer) this._timer.invalidate();
    this._timer = this.invokeLater(this._startEditing, 500);
    this.mouseDown(event);
    return YES;
  },
  touchEnd: function(event) {
    // console.log('DEBUG: touch end on project item: ' + this.getPath('content.name'));
    if (this._timer) {
      this._timer.invalidate();
      this._timer = null;
    }
    return YES;
  },
  
  /** @private
    When mouse clicked on appropirate parts launch editor.
  */  
  mouseDown: function(event) {
    
    // console.log('DEBUG: mouse down on project item: ' + this.getPath('content.name'));

    var content = this.get('content');
    if(!content.get('id')) return sc_super(); // skip group items (they don't have 'id's)
    this.set('isSystemProject', CoreTasks.isSystemProject(content)); // cache for use later
    
    // See what user clicked on an popup editor accordingly
    var target = event.target;
    if (target.nodeType === 3) target = target.parentNode; // for text nodes on iPad
    var classes = target.className;
    // See if left clicked on hover pencil or project icon with one project selected 
    // console.log('DEBUG: classes = "' + classes + '"');
    if (!this.get('isSystemProject') && (!event.which || event.which === 1) &&
        (classes.match(/project-margin/) || classes.match(/project-icon/) ||
         classes.match(/count/) || classes.match(/inner/)  || classes.match(/description-icon/))) {
      this._startEditing();
    }
    else if(Tasks.isMobile) Tasks.statechart.sendEvent('showTasksList');

    return NO; // so that drag-n-drop can work!
    
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
    if(finalValue !== this._name && CoreTasks.getProjectByName(finalValue)) {
      console.error('There is already a project with this name');
      this.set('isEditing', NO) ;
      this.displayDidChange();
    }
    else {
      sc_super();
      // if timeLeft or activatedAt was specified inline, redraw got load balancing recalculation
      if(finalValue.indexOf('{') >= 0 || finalValue.indexOf('<')  >= 0) {
        Tasks.assignmentsController.computeTasks();
      }
      if(Tasks.get('autoSave')) Tasks.saveChanges();
    }
  },
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(!content) return;
    // console.log('DEBUG: Project render(' + firstTime + '): ' + content.get('displayName'));
    sc_super();
    
    var projectTooltip = '';
    if(content.get('id')) context.addClass('project-item' + (Tasks.isMobile? ' mobile' : ''));
    var isSystemProject = CoreTasks.isSystemProject(content);
    if(!isSystemProject) {
      var editingTooltip = "_ClickToViewEditDetailsTooltip".loc();
      context = context.begin('div').addClass('project-margin').attr('title', editingTooltip).attr('alt', editingTooltip).end();
    }
    if (this.get('showHover')) {
      context.addClass('hover'); 
    } else {
      context.removeClass('hover');
    }
    
    if(!Tasks.isMobile) {
      
      // Put a dot before non-system projects that were created or updated recently
      if(!isSystemProject && content.get('isRecentlyUpdated')) {
        context = context.begin('div').addClass('recently-updated').attr({
          title: "_RecentlyUpdatedTooltip".loc(),
          alt: "_RecentlyUpdatedTooltip".loc()
        }).end();
      }

      // Indicate which items have a description
      var description = SC.RenderContext.escapeHTML(content.get('description'));
      if(description) {
        description = description.replace(/\"/g, '\'');
        context = context.begin('div').addClass('description-icon')
                    .attr({'title': description,'alt': description}).end();
      }

    }

  },

  renderIcon: function(context, icon) {
    // console.log('DEBUG: ProjectItem.render() icon=' + icon);
    if(!SC.none(icon)) {
      var content = this.get('content');
      var projectTooltip = "_Has".loc() + content.getPath('tasks.length') + "_tasks".loc();
      context.begin('img').addClass('icon').addClass(icon).attr('src', SC.BLANK_IMAGE_URL)
        .attr('title', projectTooltip).attr('alt', projectTooltip).end();
    }
  },
  
  renderCount: function(context, count) {
    if(count) {
      // Show time left for project
      context.push('<span class="count" title="' + "_ProjectCountdownTooltip".loc() + '">');
      context.push('<span class="inner">').push(count).push('</span></span>');
    }
  }
  
});

Tasks.ProjectItemView.mixin(/** @scope Tasks.ProjectItemView */ {

  buildContextMenu: function() {
    
    var ret = [];
    // if(!content.get('id')) return ret; // group item
    
    // Ensure there are no system projects selected before creating context menu
    var sel = Tasks.projectsController.get('selection');
    var len = sel? sel.length() : 0;
    var context = {};
    for (var i = 0; i < len; i++) {
      var project = sel.nextObject(i, null, context);
      if (CoreTasks.isSystemProject(project)) return ret;
    }
    
    if(CoreTasks.getPath('permissions.canCreateProject')) {
      ret.push({
        title: "_Add".loc(),
        icon: 'add-icon',
        isEnabled: YES,
        action: 'addProject'
      });
    }
    
    if(Tasks.projectsController.getPath('selection.length') === 1 &&
      CoreTasks.getPath('permissions.canCreateProject')) {
      ret.push({
        title: "_Duplicate".loc(),
        icon: 'duplicate-icon',
        isEnabled: YES,
        action: 'duplicateProject'
      });
    }

    if(CoreTasks.getPath('permissions.canDeleteProject')) {
      ret.push({
        title: "_Delete".loc(),
        icon: 'delete-icon',
        isEnabled: YES,
        action: 'deleteProject'
      });
    }
    
    if(CoreTasks.getPath('permissions.canUpdateProject')) {

      ret.push({
        isSeparator: YES
      });

      var developmentStatus = Tasks.projectsController.get('developmentStatus');
      ret.push({
        title: '<span class=status-planned>' + CoreTasks.STATUS_PLANNED.loc() + '</span>',
        icon: 'no-icon',
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_PLANNED,
        action: 'setDevelopmentStatusPlanned'
      });
      ret.push({
        title: '<span class=status-active>' + CoreTasks.STATUS_ACTIVE.loc() + '</span>',
        icon: 'no-icon',
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_ACTIVE,
        action: 'setDevelopmentStatusActive'
      });
      ret.push({
        title: '<span class=status-done>' + CoreTasks.STATUS_DONE.loc() + '</span>',
        icon: 'no-icon',
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_DONE,
        action: 'setDevelopmentStatusDone'
      });

    }
    
    return ret;
    
  }
  
});