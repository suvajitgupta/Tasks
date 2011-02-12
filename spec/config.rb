# Tasks/Lebowski login tests
# Author: Mike Ramsey, Suvajit Gupta

App.define_path 'mainPane', 'mainPage.mainPane', MainPane


USER_NAME = "SA"
PASSWORD = ""
USER_ROLE = "Manager"
NEWUSERLOGINNAME = "guest"
NEWUSERFULLNAME = "Guest User"

App.define_framework 'core_tasks', 'CoreTasks'

App.define_path 'login_panel', 'loginPage.panel', PanelPane
App.define_paths_for 'login_panel' do |path|
  path.define_path 'login_name_field', 'contentView.loginNameField', TextFieldView
  path.define_path 'password_field', 'contentView.passwordField', TextFieldView
  path.define_path 'signin_button', 'contentView.signinButton', ButtonView
  path.define_path 'login_error_message_label', 'contentView.loginErrorMessageLabel', LabelView 
  path.define_path 'guest_signup_button', 'contentView.guestSignupButton', ButtonView
end

App.define_path 'signup_panel', 'signupPane', PanelPane
App.define_paths_for 'signup_panel' do |path|
  path.define_path 'signup_prompt', 'contentView.signupPrompt', LabelView
  path.define_path 'signup_button', 'contentView.signupButton', ButtonView
  path.define_path 'cancel_button', 'contentView.cancelButton', ButtonView
  path.define_path 'full_name_label', 'contentView.userInformation.fullNameLabel', LabelView
  path.define_path 'full_name_field', 'contentView.userInformation.fullNameField', TextFieldView
  path.define_path 'login_name_label', 'contentView.userInformation.loginNameLabel', LabelView
  path.define_path 'login_name_field', 'contentView.userInformation.loginNameField', TextFieldView
  path.define_path 'role_label', 'contentView.userInformation.roleLabel', LabelView
  path.define_path 'role_field', 'contentView.userInformation.roleField', 'SC.SelectButtonView' # was SelectFieldView 
  path.define_path 'email_label', 'contentView.userInformation.emailLabel', LabelView
  path.define_path 'email_field', 'contentView.userInformation.emailField', TextFieldView
  path.define_path 'password_label', 'contentView.userInformation.passwordLabel', LabelView
  path.define_path 'password_field', 'contentView.userInformation.passwordField', TextFieldView
end

App.define_path 'main_pane', 'mainPage.mainPane', MainPane
App.define_path 'actions_button', 'main_pane.masterDetailView.detailView.topToolbar.actionsButton', ButtonView