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
require 'json'

#-----------------------------------------------------------------------------
# USED TO SET CONTENT TYPE
#
mime :json, "application/json"

#-----------------------------------------------------------------------------
# MODELS
#
DataMapper.setup(:default, "sqlite3://#{Dir.pwd}/Tasks.sqlite3")

class User
  include DataMapper::Resource

  property  :id,              Serial
  property  :name,            Text,   :nullable =>  false  
  property  :'loginName',     Text,   :nullable =>  false  
  property  :role,            Enum[:Manager, :Developer, :Tester, :Guest], :default => :Guest
  property  :'emailAddress',  Text,   :nullable =>  false
  property  :password,        Text,   :nullable =>  false
  property  :preferences,     Text
  property  :'authToken',     Text
  property  :created_at,      DateTime
  property  :updated_at,      DateTime
  
  def url
    "user/#{self.id}"    
  end
  
  def to_json(*a)
    ret = {}
    self.attributes.each do |k,v|
      ret[k] = k.to_s == "id" ? self.url : v unless k.to_s == "password"
    end
    ret.to_json(*a)
  end
  
  @required = [:name, :'loginName', :password, :'emailAddress']
  
  def self.parse_json(body)
    json = JSON.parse(body)
    ret = { :name => json['name'], :'loginName' => json['loginName'], 
            :password => json['password'], :'emailAddress' => json['emailAddress'] }            
    return nil if @required.find { |r| ret[r].nil? }
    ret
  end
end

class Project
  include DataMapper::Resource
  
  property :id,         Serial
  property :name,       Text, :nullable => false
  property :'timeLeft', Integer
  property :tasks,      Text
  
  def url
    "project/#{self.id}"
  end
  
  def to_json(*a)
    ret = {}
    self.attributes.each do |k,v|
      ret[k] = k.to_s == "id" ? self.url : v
    end
    ret.to_json(*a)
  end
  
  @required = [:name]
  
  def self.parse_json(body)
    json = JSON.parse(body)
    ret = { :name => json['name'] }
    return nil if @required.find { |r| ret[r].nil? }
    ret
  end
  
end

class Task
  include DataMapper::Resource
  
  property  :id,           Serial
  property  :name,         Text, :nullable => false
	property  :priority,     Enum[:HIGH, :MEDIUM, :LOW], :default => :MEDIUM
	property  :effort,       Integer
	property  :submitter,    Integer
	property  :assignee,     Integer
	property  :type,         Enum[:Feature,  :Bug,     :Other],          :default  => :Other
	property  :status,       Enum[:Planned,  :Active,  :Done,  :Risky],  :default  => :Planned
	property  :validation,   Enum[:Untested, :Passed,  :Failed],         :default  => :Untested
	property  :description,  Text
	property  :created_at,   DateTime, :default  => DateTime.now
  property  :updated_at,   DateTime, :default  => DateTime.now
  
  def url
    "task/#{self.id}"
  end
  
  def to_json(*a)
    ret = {}
    self.attributes.each do |k,v|
      ret[k] = k.to_s == "id" ? self.url : v
    end
    ret.to_json(*a)
  end
  
  @required = [:name]
  
  def self.parse_json(body)
    json = JSON.parse(body)
    ret = {:name => json['name']}
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
    
    # Determine the model and Find all records.
    case params[:captures].first
      when 'user':    list = User.all
      when 'task':    list = Task.all
      when 'project': list = Project.all
    end
    
    content_type :json
    Array(list).to_json
      
  end
end

def json_get_single(route, options={})
  get(route, options) do
    
    # holds the desired model instance
    mobj = {}
    modelType = params[:captures].first
    modelId   = params[:captures][1]
    # Determine Which model class we need to search and set mobj
    case modelType
      when 'user':    mobj = User.get(modelId)    rescue nil
      when 'task':    mobj = Task.get(modelId)    rescue nil
      when 'project': mobj = Project.get(modelId) rescue nil
    end
    
    # Repond with error 404 or JSON
    halt 404, "#{modelType[modelId]} not found" if mobj.nil?
    content_type :json
    mobj.to_json
    
  end
end

def json_post(route, options={})
  post(route, options) do 
    
    opts = {}
    newRecord = {}
    modelType = params[:captures].first
    
    case modelType
      when 'user':    opts = User.parse_json(request.body.read)     rescue nil
      when 'task':    opts = Task.parse_json(request.body.read)     rescue nil
      when 'project': opts = Project.parse_json(request.body.read)  rescue nil
    end
    
    halt 404, "Invalid JSON" if opts.nil?
    
    case modelType
      when 'user': newRecord    = User.new(opts)
      when 'task': newRecord    = Task.new(opts)
      when 'project': newRecord = Project.new(opts)
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
    modelType = params[:captures].first
    modelId   = params[:captures][1]
    
    case modelType
      when 'user':    record = User.get(modelId)    rescue nil
      when 'task':    record = Task.get(modelId)    rescue nil
      when 'project': record = Project.get(modelId) rescue nil
    end
    
    halt(404, 'Not Found') if record.nil?

    case modelType
      when 'user':    opts = User.parse_json(request.body.read)     rescue nil
      when 'task':    opts = Task.parse_json(request.body.read)     rescue nil
      when 'project': opts = Project.parse_json(request.body.read)  rescue nil
    end
    
    halt 404, "Invalid JSON" if opts.nil?
    
    halt(500, "Could not update #{modelType}" ) unless record.update(opts)

    response['Content-Type'] = :json
    record.to_json
    
  end
end

def json_delete(route, options={})
  delete(route, options) do
    
    record = {}
    modelType = params[:captures].first
    modelId   = params[:captures][1]
    
    case modelType
      when 'user':    record = User.get(modelId)    rescue nil
      when 'task':    record = Task.get(modelId)    rescue nil
      when 'project': record = Project.get(modelId) rescue nil
    end
    
    record.destroy unless record.nil?
    
  end
end

#-----------------------------------------------------------------------------
# ROUTES
#
json_get_list   %r{/tasks-server/([\w]+)$}

json_get_single %r{/tasks-server/([\w]+)/([\w+])$}

json_post       %r{/tasks-server/([\w]+)}

json_put        %r{/tasks-server/([\w]+)/([\w+])$}

json_delete     %r{/tasks-server/([\w]+)/([\w+])$}