config :scui, :required => [:foundation, :calendar, :dashboard, :drawing, :linkit]
config :'core-tasks', :required => [:sproutcore]
config :tasks, :required => [:'core-tasks', :sproutcore, :scui]

# JH2's GAE backend - under development (needs to be updated to latest)
# proxy '/tasks-server', :to => 'tasks-sc.appspot.com', :protocol => 'http'

# Local Persevere back end - prod instance
proxy '/tasks-server', :to => 'localhost:8088', :protocol => 'http'

# Local Persevere back end - test instance
# proxy '/tasks-server', :to => 'localhost:8089', :protocol => 'http'

# Sinatra Proxy
# proxy '/tasks-server', :to => 'localhost:4567', :protocol => 'http'
