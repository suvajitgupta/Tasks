require 'proxy-patch'

config :'core-tasks', :required => [:sproutcore]
config :tasks, :required => [:'core-tasks', :sproutcore]

# JOH2's GAE backend - under development
#proxy '/tasks-server', :to => 'tasks-sc.appspot.com', :protocol => 'http'

# Local Persevere back end - prod instance
#proxy '/tasks-server', :to => 'localhost:8088', :protocol => 'http'

# Local Persevere back end - test instance
proxy '/tasks-server', :to => 'localhost:8089', :protocol => 'http'
