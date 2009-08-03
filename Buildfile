config :'core-tasks', :required => [:sproutcore]
config :tasks, :required => [:'core-tasks', :sproutcore]

proxy '/tasks-server', :to => 'localhost:8080', :protocol => 'http'
