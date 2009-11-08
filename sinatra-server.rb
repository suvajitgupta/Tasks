#-----------------------------------------------------------------------------
# A Sinatra Server for the SproutCore Tasks Manager.
# @Author Joshua Holt [JH2]
# @Version preBeta
# @Since preBeta
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# REQUIRES
#
require 'rubygems'
require 'sinatra'
require 'dm-core'
require 'dm-validations'
require 'dm-timestamps'
require 'dm-types'
require 'persevere_adapter'
require 'json'

#-----------------------------------------------------------------------------
# MODELS
#
DataMapper.setup(:default, "sqlite3://#{Dir.pwd}/Tasks.sqlite3")

# Using Persevere Adapter... (let's see how it works --- the adapter had to heavily modified)
# DataMapper.setup(:default, {
#   :adapter => 'persevere',
#   :host => 'localhost',
#   :port => '8088',
#   :path => '/tasks-server'
# })

# USE TOKYO CABINET WHEN it's more stable
# DataMapper.setup(:default,
#     :adapter  => 'tokyo_cabinet',
#     :database => 'tc',
#     :path     => File.dirname(__FILE__)
# )

class User
  include DataMapper::Resource

  property  :id,            Serial
  property  :name,          Text,   :nullable =>  false  
  property  :loginName,     Text,   :nullable =>  false  
  property  :role,          String, :default => '_Guest'
  property  :email,         Text #,   :nullable =>  false -- NOT IMPLEMENTED IN ALL AREAS
  property  :password,      Text #,   :nullable =>  false -- NOT IMPLEMENTED IN ALL AREAS
  property  :preferences,   Json
  property  :authToken,     Text
  property  :createdAt,     Integer
  property  :updatedAt,     Integer
  
  def url
    "user/#{self.id}"    
  end
  
  def to_json()
    ret = {}
    self.attributes.each do |k,v|
      ret[k] = k.to_s == "id" ? self.url : v unless k.to_s == "password"
    end
    ret.to_json()
  end
  
  # @required = [:name, :loginName, :password, :email] -- waiting impelmentation
  @required = [:name, :loginName, :role]
  @required_for_update = [:name, :loginName]
  
  def self.parse_json(body, requestMethod)
    json = JSON.parse(body)
    ret = {}
    json.each {|k,v| ret[k.to_sym] = v unless k == 'id' || k == '_id' }
    if requestMethod === 'update'
      return nil if @required_for_update.find { |r| ret[r].nil? }
    else
      return nil if @required.find { |r| ret[r].nil? }
    end
    ret
  end
end

class Project
  include DataMapper::Resource
  
  property  :id,          Serial
  property  :name,        Text, :nullable => false
  property  :description, Text
  property  :'timeLeft',  Integer
  #property  :tasks,       Json
  property  :createdAt,   Integer
  property  :updatedAt,   Integer
  
  def url
    "project/#{self.id}"
  end
  
  def to_json()
    ret = {}
    self.attributes.each do |k,v|
      ret[k] = k.to_s == "id" ? self.url : v
    end
    ret.to_json()
  end
  
  @required = [:name]
  
  def self.parse_json(body, requestMethod)
    json = JSON.parse(body)
    ret = {}
    json.each {|k,v| ret[k.to_sym] = v unless k == 'id' || k == '_id' }
    return nil if @required.find { |r| ret[r].nil? }
    ret
  end
  
end

class Task
  include DataMapper::Resource
  
  property  :id,                 Serial
  property  :name,               Text,   :nullable => false
  property  :description,        Text
  property  :projectId,          Integer
	property  :priority,           String, :default => '_Medium'
	property  :effort,             Integer
	property  :submitterId,        String
	property  :assigneeId,         String
	property  :type,               String, :default => '_Other'
	property  :developmentStatus,  String, :default => '_Planned'
	property  :validation,         String, :default => '_Untested'
  property  :createdAt,          Integer
  property  :updatedAt,          Integer
  
  def url
    "task/#{self.id}"
  end
  
  def to_json()
    ret = {}
    self.attributes.each do |k,v|
      ret[k] = k.to_s == "id" ? self.url : v
    end
    ret.to_json()
  end
  
  @required = [:name]
  
  def self.parse_json(body, requestMethod)
    json = JSON.parse(body)
    ret = {}
    json.each {|k,v| ret[k.to_sym] = v unless k == 'id' || k == '_id' }
    return nil if @required.find { |r| ret[r].nil? }
    ret
  end
  
end

DataMapper.auto_upgrade!

#-----------------------------------------------------------------------------
# HELPERS
#
def json_get_list(route, options={})
  get(route, options) do 
    # var used to hold the list of model_instances from the DB
    list = []
    modelType = params[:model]
    # Determine the model and Find all records.
    case modelType
      when 'user' then    list = User.all
      when 'task' then    list = Task.all
      when 'project' then list = Project.all
    end
    
    content_type "application/javascript"
    list.length > 0 ? Array(list).to_json : [].to_json
      
  end
end

def json_get_single(route, options={})
  get(route, options) do
    
    # holds the desired model instance
    mobj = {}
    modelType = params[:model]
    modelId   = params[:id]
    # Determine Which model class we need to search and set mobj
    case modelType
      when 'user' then    mobj = User.get(modelId)    rescue nil
      when 'task' then    mobj = Task.get(modelId)    rescue nil
      when 'project' then mobj = Project.get(modelId) rescue nil
    end
    
    # Repond with error 404 or JSON
    halt 404, "#{modelType[modelId]} not found" if mobj.nil?
    content_type "application/javascript"
    mobj.to_json
    
  end
end

def json_post(route, options={})
  post(route, options) do 
    
    opts = {}
    newRecord = {}
    modelType = params[:model]
    
    case modelType
      when 'user' then    opts = User.parse_json(request.body.read, 'post')     rescue nil
      when 'task' then    opts = Task.parse_json(request.body.read, 'post')     rescue nil
      when 'project' then opts = Project.parse_json(request.body.read, 'post')  rescue nil
    end
    
    halt 404, "Invalid JSON" if opts.nil?
    
    case modelType
      when 'user' then newRecord    = User.new(opts)
      when 'task' then newRecord    = Task.new(opts)
      when 'project' then newRecord = Project.new(opts)
    end
    
    halt(500, "Could not save #{modelType}" ) unless newRecord.save
    
    response['Location'] = newRecord.url
    response.status = 201
    newRecord.to_json
    
  end
end

def json_put(route, options={})
  put(route, options) do
    
    record = {}
    opts = {}
    modelType = params[:model]
    modelId   = params[:id]
    
    case modelType
      when 'user' then    record = User.get(modelId)    rescue nil
      when 'task' then    record = Task.get(modelId)    rescue nil
      when 'project' then record = Project.get(modelId) rescue nil
    end
    
    halt(404, 'Not Found') if record.nil?

    case modelType
      when 'user' then    opts = User.parse_json(request.body.read, 'update')     rescue nil
      when 'task' then    opts = Task.parse_json(request.body.read, 'update')     rescue nil
      when 'project' then opts = Project.parse_json(request.body.read, 'update')  rescue nil
    end
    
    halt 404, "Invalid JSON" if opts.nil?
    
    halt(500, "Could not update #{modelType}" ) unless record.update(opts)

    response['Content-Type'] = "application/javascript"
    record.to_json
    
  end
end

def json_delete(route, options={})
  delete(route, options) do
    
    record = {}
    modelType = params[:model]
    modelId   = params[:id]
    
    case modelType
      when 'user' then  record = User.get(modelId)    rescue nil
      when 'task' then    record = Task.get(modelId)    rescue nil
      when 'project' then record = Project.get(modelId) rescue nil
    end
    
    record.destroy unless record.nil?
    
  end
end

#-----------------------------------------------------------------------------
# ROUTES
#
# REGEX VERSIONS
#
# json_get_list   %r{/tasks-server/([\w]+)$}
# 
# json_get_single %r{/tasks-server/([\w]+)/([\w+])$}
# 
# json_post       %r{/tasks-server/([\w]+)}
# 
# json_put        %r{/tasks-server/([\w]+)/([\w+])$}
# 
# json_delete     %r{/tasks-server/([\w]+)/([\w+])$}

# NAMED PARAM VERSIONS
#
json_get_list   '/tasks-server/:model'

json_get_single '/tasks-server/:model/:id'

json_post       '/tasks-server/:model'

json_put        '/tasks-server/:model/:id'

json_delete     '/tasks-server/:model/:id'