App = Application.new \
        :app_root_path => "/tasks",
        :app_name => "Tasks",
        :app_server_port => 4400
        
App.start do |app|
  app['isLoaded'] == true
end

App.window.move_to 1, 1 # Have a slight offset for Firefox so that the window will actually be moved
App.window.resize_to 1024, 768

App.define 'loginPanel', 'loginPage.panel', PanelPane
App['loginPanel'].define 'loginNameField', 'contentView.loginNameField', TextFieldView
App['loginPanel'].define 'passwordField', 'contentView.passwordField', TextFieldView
App['loginPanel'].define 'loginButton', 'contentView.loginButton', ButtonView

App.define 'mainPane', 'mainPage.mainPane', MainPane

describe "Login Test" do
  
  before(:all) do
    @login_panel = App['loginPanel']
  end
  
  it "will confirm the login panel exists" do
    @login_panel.should be_visible_in_window
  end
  
  it "will login as Suvajit and confirm main screen is visible" do
    @login_panel['loginNameField'].type 'SG'
    @login_panel['passwordField'].type ''
    @login_panel['loginButton'].click
    
    App.wait_until do |app|
      app['mainPane.isPaneAttached']
    end
  end
  
end