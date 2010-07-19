App = Application.new \
        :app_root_path => "/tasks",
        :app_name => "Tasks",
        :app_server_port => 4400
        
App.start do |app|
  app['isLoaded'] == true
end

App.window.move_to 1, 1 # Have a slight offset for Firefox so that the window will actually be moved
App.window.resize_to 1024, 768

require 'config'
require 'login'