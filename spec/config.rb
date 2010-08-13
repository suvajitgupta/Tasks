# Tasks/Lebowski login tests
# Author: Mike Ramsey, Suvajit Gupta

App.define 'mainPane', 'mainPage.mainPane', MainPane


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
App.define 'login_panel', 'loginPage.panel', PanelPane
App.define 'signup_panel', 'signupPage.mainPane', PanelPane
App.define 'main_pane', 'mainPage.mainPane', MainPane
App.define 'actions_button', 'main_pane.topBarView.actionsButton', ButtonView

App['login_panel'].define 'user_name_field', 'contentView.loginNameField', TextFieldView
App['login_panel'].define 'password_field', 'contentView.passwordField', TextFieldView
App['login_panel'].define 'login_button', 'contentView.loginButton', ButtonView
App['login_panel'].define 'login_err_msg', 'contentView.loginErrorMessageLabel', LabelView 
App['login_panel'].define 'guest_signup_button', 'contentView.guestSignupButton', ButtonView

App['signup_panel'].define 'signup_prompt', 'contentView.signupPrompt', LabelView
App['signup_panel'].define 'signup_button', 'contentView.signupButton', ButtonView
App['signup_panel'].define 'cancel_button', 'contentView.cancelButton', ButtonView
App['signup_panel'].define 'fullNameLabel', 'contentView.userInformation.fullNameLabel', LabelView
App['signup_panel'].define 'fullNameField', 'contentView.userInformation.fullNameField', TextFieldView
App['signup_panel'].define 'loginNameLabel', 'contentView.userInformation.loginNameLabel', LabelView
App['signup_panel'].define 'loginNameField', 'contentView.userInformation.loginNameField', TextFieldView
App['signup_panel'].define 'roleLabel', 'contentView.userInformation.roleLabel', LabelView
App['signup_panel'].define 'roleField', 'contentView.userInformation.roleField', 'SC.SelectButtonView' # was SelectFieldView 
App['signup_panel'].define 'emailLabel', 'contentView.userInformation.emailLabel', LabelView
App['signup_panel'].define 'emailField', 'contentView.userInformation.emailField', TextFieldView
App['signup_panel'].define 'passwordLabel', 'contentView.userInformation.passwordLabel', LabelView
App['signup_panel'].define 'passwordField', 'contentView.userInformation.passwordField', TextFieldView