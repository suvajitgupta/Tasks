config :'core-tasks', :required => [:sproutcore, :'scuds/utils', :'scuds/local']

# Customizable "Installation Title" appearing in the browser tab (if it contains the phrase "ToDo" it will automatically make Tasks run in "ToDos" mode)
# To customize, uncomment the next line and comment the line after that
# config :tasks, :required => [:'core-tasks', :ki, :'scui/foundation', :'scui/calendar', :'sai/graphs'],:title=>"<InstallationTitle>"
config :tasks, :required => [:'core-tasks', :ki, :'scui/foundation', :'scui/calendar', :'sai/graphs'],:title=>"Tasks:Dev"
# config :tasks, :required => [:'core-tasks', :ki, :'scui/foundation', :'scui/calendar', :'sai/graphs'],:title=>"Tasks:Demo"
# config :tasks, :required => [:'core-tasks', :ki, :'scui/foundation', :'scui/calendar', :'sai/graphs'],:title=>"ToDos:SproutCore"
# config :tasks, :required => [:'core-tasks', :ki, :'scui/foundation', :'scui/calendar', :'sai/graphs'],:title=>"ToDos:Eloqua"


# Local GAE server: uncomment line after next & replace 8091 with port of GAE application; then comment 4th line after next
# Run 'rm -rf tmp' and restart 'sc-server --port 4400' after swtiching to GAE server
# proxy '/tasks-server', :to => 'localhost:8091', :protocol => 'http'
# Local Persevere server (prod instance)
proxy '/tasks-server', :to => 'localhost:8088', :protocol => 'http'
# Local Persevere server (test instance)
# proxy '/tasks-server', :to => 'localhost:8089', :protocol => 'http'

