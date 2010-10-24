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
  
  displayProperties: ['displayName', 'displayCountDown', 'description'],
  
  _listStatuses: function() {
     var ret = [];
     ret.push({ name: '<span class=status-planned>' + CoreTasks.STATUS_PLANNED.loc() + '</span>', value: CoreTasks.STATUS_PLANNED });
     ret.push({ name: '<span class=status-active>' + CoreTasks.STATUS_ACTIVE.loc() + '</span>', value: CoreTasks.STATUS_ACTIVE });
     ret.push({ name: '<span class=status-done>' + CoreTasks.STATUS_DONE.loc() + '</span>', value: CoreTasks.STATUS_DONE });
     return ret;
  },

  /** @private
    If mouse was down over Description Icon open the editor.
  */  
  mouseDown: function(event) {
    
    // console.log('DEBUG: mouse down on project item: ' + this.getPath('content.name'));

    var content = this.get('content');
    if(!content.get('id')) return sc_super();

    this.set('isSystemProject', CoreTasks.isSystemProject(content));
    
    // See what user clicked on an popup editor accordingly
    var classes = event.target.className;
    // console.log('DEBUG: classes = "' + classes + '"');
    if(classes.indexOf("project-icon") !== -1 || classes.indexOf("inner") !== -1 || classes.indexOf("count") !== -1 || classes.indexOf("description-icon") !== -1) {
      var sel = Tasks.getPath('projectsController.selection');
      var singleSelect = (sel && sel.get('length') === 1);

      if ((!event.which || event.which === 1) && singleSelect && classes !== "") { // left click with one project selected and didn't click on the inline editable name
        this.popupEditor();
      }
    }

    return NO;
  },
  
  popupEditor: function() {
    var layer = this.get('layer');
    this._project = this.get('content');
    this._newProject = (this._project.get('name') === CoreTasks.NEW_PROJECT_NAME.loc())? this._project : null;
    var that = this;
    
    this._editorPane = SCUI.ModalPane.create({
      
      titleBarHeight: 40,
      title: "_Project".loc() + ' ' + that.getPath('content.displayId'),
      minWidth: 700,
      minHeight: 240,
      layout: { centerX:0, centerY: 0, width: 700, height: 315 },
      _timeLeft: null,
      _activatedAt: null,
      
      // Avoid popup panel coming up for system projects
      popup: function() {
        if(that.get('isSystemProject')) return;
        this.append();
        if(!Tasks.get('editorPoppedUp')) Tasks.set('editorPoppedUp', Tasks.PROJECT_EDITOR);
        this._timeLeft = that.getPath('content.timeLeft');
        this._activatedAt = that.getPath('content.activatedAt');
        if(CoreTasks.getPath('permissions.canUpdateProject')) {
          this.getPath('contentView.nameField').becomeFirstResponder();
        }
      },
      remove: function() {
        sc_super();
        if(Tasks.get('editorPoppedUp') === Tasks.PROJECT_EDITOR) Tasks.set('editorPoppedUp', null);
        var content = that.get('content');
        var cv = this.get('contentView');
        content.setIfChanged('displayName', cv.getPath('nameField.value'));
        content.setIfChanged('timeLeftValue', cv.getPath('timeLeftField.value'));
        content.setIfChanged('activatedAtValue',  cv.getPath('activatedAtField.date'));
        content.setIfChanged('description',  cv.getPath('descriptionField.value'));
        if(Tasks.sourcesRedrawNeeded) Tasks.projectsController.showSources();
        // If timeLeft or activatedAt has changed, recalculate load balancing
        if(this._timeLeft !== that.getPath('content.timeLeft') ||
           this._activatedAt !== that.getPath('content.activatedAt')) {
          Tasks.assignmentsController.showAssignments();
        }
        var newProject = that.get('_newProject');
        if(newProject && newProject.get('name') === CoreTasks.NEW_PROJECT_NAME.loc()) {
          newProject.destroy(); // blow away unmodified new project
          Tasks.projectsController.selectObject(CoreTasks.get('allTasksProject'));
        }
        if(CoreTasks.get('autoSave')) Tasks.saveData();
        this.destroy();
      },
      
      contentView: SC.View.design({
        layout: { left: 0, right: 0, top: 0, bottom: 0},
        childViews: 'nameLabel nameField  statusLabel statusField timeLeftLabel timeLeftField timeLeftHelpLabel activatedAtLabel activatedAtField descriptionLabel descriptionField createdAtLabel updatedAtLabel closeButton'.w(),
      
        nameLabel: SC.LabelView.design({
          layout: { top: 6, left: 10, height: 24, width: 60 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Name".loc()
        }),
        nameField: SC.TextFieldView.design({
          layout: { top: 5, left: 75, right: 200, height: 24 },
          isEnabledBinding: 'CoreTasks.permissions.canUpdateProject',
          value: that.getPath('content.name')
        }),
        
        statusLabel: SC.LabelView.design({
          layout: { top: 7, right: 113, height: 24, width: 50 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Status".loc()
        }),
        statusField: SC.SelectButtonView.design({
          layout: { top: 5, right: 10, height: 24, width: 125 },
          classNames: ['square'],
          localize: YES,
          isEnabledBinding: 'CoreTasks.permissions.canUpdateProject',
          objects: this._listStatuses(),
          nameKey: 'name',
          valueKey: 'value',
          valueBinding: SC.binding('.content.developmentStatusValue', this),
          toolTip: "_StatusTooltip".loc()
        }),

        timeLeftLabel: SC.LabelView.design({
          layout: { top: 40, left: 10, height: 24, width: 60 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_TimeLeft:".loc()
        }),
        timeLeftField: SC.TextFieldView.design({
          layout: { top: 37, left: 75, width: 80, height: 24 },
          isEnabledBinding: 'CoreTasks.permissions.canUpdateProject',
          value: that.getPath('content.timeLeft')
        }),
        timeLeftHelpLabel: SC.LabelView.design({
          layout: { top: 45, left: 165, height: 20, width: 330 },
          escapeHTML: NO,
          classNames: [ 'onscreen-help'],
          value: "_TimeLeftOnscreenHelp".loc()
        }),

        activatedAtLabel: SC.LabelView.design({
          layout: { top: 40, right: 113, height: 24, width: 100 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Activated:".loc()
        }),
        // FIXME: [SG/JL] allow SCUI.DatePickerView popup picker height to be adjustable, not hardcoded to 255
        activatedAtField: SCUI.DatePickerView.design({
          layout: { top: 37, right: 10, height: 24, width: 100 },
          dateFormat: CoreTasks.DATE_FORMAT,
          hint: "_ChooseDate".loc(),
          isEnabledBinding: 'CoreTasks.permissions.canUpdateProject',
          date: that.getPath('content.activatedAtValue')
        }),

        descriptionLabel: SC.LabelView.design({
          layout: { top: 70, left: 10, height: 17, width: 100 },
          icon: 'description-icon',
          value: "_Description:".loc()
        }),
        descriptionField: SC.TextFieldView.design({
          layout: { top: 95, left: 10, right: 10, bottom: 65 },
          hint: "_DescriptionHint".loc(),
          maxLength: 500000,
          isTextArea: YES,
          isEnabledBinding: 'CoreTasks.permissions.canUpdateProject',
          value: that.getPath('content.description')
        }),
        
        createdAtLabel: SC.LabelView.design({
          layout: { left: 10, bottom: 45, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_LEFT,
          valueBinding: SC.binding('.content.displayCreatedAt', this)
        }),
        updatedAtLabel: SC.LabelView.design({
          layout: { right: 10, bottom: 45, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_RIGHT,
          valueBinding: SC.binding('.content.displayUpdatedAt', this)
        }),

        closeButton: SC.ButtonView.design({
          layout: { bottom: 10, right: 20, width: 80, height: 24 },
          isDefault: YES,
          title: "_Close".loc(),
          action: 'remove'
        })
          
      })
    });
    if(this._editorPane) this._editorPane.popup(layer);
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
    
    
    // Put a dot before non-system projects that were created or updated recently
    if(!CoreTasks.isSystemProject(content) && content.get('isRecentlyUpdated')) {
      context = context.begin('div').addClass('recently-updated').attr({
        title: "_RecentlyUpdatedTooltip".loc(),
        alt: "_RecentlyUpdatedTooltip".loc()
      }).end();
    }

    var projectTooltip = '';
    if(content.get('id')) context.addClass('project-item');

    // Indicate which items have a description
    var description = SC.RenderContext.escapeHTML(content.get('description'));
    if(description) {
      description = description.replace(/\"/g, '\'');
      context = context.begin('div').addClass('description-icon')
                  .attr({'title': description,'alt': description}).end();
    }
    
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
        target: 'Tasks',
        action: 'addProject'
      });
    }
    
    if(Tasks.projectsController.getPath('selection.length') === 1 &&
      CoreTasks.getPath('permissions.canCreateProject')) {
      ret.push({
        title: "_Duplicate".loc(),
        icon: 'duplicate-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'duplicateProject'
      });
    }

    if(CoreTasks.getPath('permissions.canDeleteProject')) {
      ret.push({
        title: "_Delete".loc(),
        icon: 'delete-icon',
        isEnabled: YES,
        target: 'Tasks',
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
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_PLANNED,
        target: 'Tasks.projectsController',
        action: 'setDevelopmentStatusPlanned'
      });
      ret.push({
        title: '<span class=status-active>' + CoreTasks.STATUS_ACTIVE.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_ACTIVE,
        target: 'Tasks.projectsController',
        action: 'setDevelopmentStatusActive'
      });
      ret.push({
        title: '<span class=status-done>' + CoreTasks.STATUS_DONE.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_DONE,
        target: 'Tasks.projectsController',
        action: 'setDevelopmentStatusDone'
      });

    }
    
    return ret;
    
  }
  
});