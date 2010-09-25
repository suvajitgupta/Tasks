# Tasks/Lebowski login tests
# Author: Mike Ramsey, Suvajit Gupta

App = MainApplication.new \
        :app_root_path => "/tasks",
        :app_name => "Tasks",
        :app_server_port => 4400,
        :browser => :safari
        
App.start do |app|
  app['isLoaded'] == true
  # app.driver.run_script "window.ononbeforeunload = null"
end

App.move_to 1, 1 # Have a slight offset for Firefox so that the window will actually be moved
App.resize_to 1024, 768

require 'config'
require 'login'