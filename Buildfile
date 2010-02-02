config :scui, :required => [:foundation, :calendar, :dashboard, :drawing, :linkit]
config :'core-tasks', :required => [:sproutcore]
config :tasks, :required => [:'core-tasks', :sproutcore, :scui],:title=>"Demo:Tasks"

# Local Persevere back end - prod instance
proxy '/tasks-server', :to => 'localhost:8088', :protocol => 'http'

# Local Persevere back end - test instance
# proxy '/tasks-server', :to => 'localhost:8089', :protocol => 'http'