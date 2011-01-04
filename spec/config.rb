# Tasks/Lebowski login tests
# Author: Mike Ramsey, Suvajit Gupta

App.define_path 'mainPane', 'mainPage.mainPane', MainPane


USER_NAME = "SA"
PASSWORD = ""
USER_ROLE = "manager"
NEW_PROJECT_DEFAULT_NAME = "new project"
NEW_TASK_DEFAULT_NAME = "new task"
NEWUSERLOGINNAME = "euser"
NEWUSERFULLNAME = "Eager N. User"
DEVELOPERUSERNAME = "Douglas Developer"
IMPORTNEWTASK = "Fred
- Imported: Feature: Medium Priority, Planned {2d} <SA> [DD] $Feature 
| This is a description of the first imported task
| This is the second line of the first tasks description there are no special characters"


App.define_framework 'core_tasks', 'CoreTasks'

App.define_path 'main_pane', 'mainPage.mainPane', MainPane
App.define_path 'actions_button', 'main_pane.topBarView.actionsButton', ButtonView

App.define_path 'login_panel', 'loginPage.panel', PanelPane
App.define_paths_for 'login_panel' do |path|
  path.define_path 'user_name_field', 'contentView.loginNameField', TextFieldView
  path.define_path 'password_field', 'contentView.passwordField', TextFieldView
  path.define_path 'login_button', 'contentView.loginButton', ButtonView
  path.define_path 'login_err_msg', 'contentView.loginErrorMessageLabel', LabelView 
  path.define_path 'guest_signup_button', 'contentView.guestSignupButton', ButtonView
end

App.define_path 'signup_panel', 'signupPane', PanelPane
App.define_paths_for 'signup_panel' do |path|
  path.define_path 'signup_prompt', 'contentView.signupPrompt', LabelView
  path.define_path 'signup_button', 'contentView.signupButton', ButtonView
  path.define_path 'cancel_button', 'contentView.cancelButton', ButtonView
  path.define_path 'fullNameLabel', 'contentView.userInformation.fullNameLabel', LabelView
  path.define_path 'fullNameField', 'contentView.userInformation.fullNameField', TextFieldView
  path.define_path 'loginNameLabel', 'contentView.userInformation.loginNameLabel', LabelView
  path.define_path 'loginNameField', 'contentView.userInformation.loginNameField', TextFieldView
  path.define_path 'roleLabel', 'contentView.userInformation.roleLabel', LabelView
  path.define_path 'roleField', 'contentView.userInformation.roleField', 'SC.SelectButtonView' # was SelectFieldView 
  path.define_path 'emailLabel', 'contentView.userInformation.emailLabel', LabelView
  path.define_path 'emailField', 'contentView.userInformation.emailField', TextFieldView
  path.define_path 'passwordLabel', 'contentView.userInformation.passwordLabel', LabelView
  path.define_path 'passwordField', 'contentView.userInformation.passwordField', TextFieldView
end
