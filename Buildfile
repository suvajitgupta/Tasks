config :scui, :required => [:foundation, :calendar, :dashboard, :drawing, :linkit]
config :'core-tasks', :required => [:sproutcore]
# config :tasks, :required => [:'core-tasks', :sproutcore, :scui],:title=>"Tasks:Dev"
# config :tasks, :required => [:'core-tasks', :sproutcore, :scui],:title=>"Tasks:Demo"
# config :tasks, :required => [:'core-tasks', :sproutcore, :scui],:title=>"Tasks:Greenhouse"
config :tasks, :required => [:'core-tasks', :sproutcore, :scui],:title=>"Tasks:SproutCore"

# Local Persevere back end - prod instance
proxy '/tasks-server', :to => 'localhost:8088', :protocol => 'http'

# Local Persevere back end - test instance
# proxy '/tasks-server', :to => 'localhost:8089', :protocol => 'http'

# Local GAE back end - prod instance
# proxy '/tasks-server', :to => 'localhost:8091', :protocol => 'http'
