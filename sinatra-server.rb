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
#require 'persevere_adapter'
require 'json'
require 'sha1'

#-----------------------------------------------------------------------------
# MODELS
#
DataMapper.setup(:default, "sqlite3://#{Dir.pwd}/Tasks.sqlite3")

# Using Persevere Adapter... (the adapter had to heavily modified -- we should not go this route yet.)
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
  
  attr_accessor :password
  
  property  :id,              Serial
  property  :name,            Text,   :nullable =>  false  
  property  :loginName,       Text,   :nullable =>  false  
  property  :role,            String, :default => '_Guest'
  property  :email,           Text 
  #property  :password,        Text
  property  :hashed_password, String, :writer => :protected
  property  :preferences,     Json
  property  :authToken,       String
  property  :createdAt,       Integer
  property  :updatedAt,       Integer
  property  :salt,            String, :writer => :protected
  
  def self.authenticate(loginName, password)
    current_user = first(:loginName => loginName) # Emable this later so that I user can login in with their email address || first(:email => login_name_or_email)
    return nil if current_user.nil? || User.encrypt(password, current_user.salt) != current_user.hashed_password
    current_user
  end
  
  def self.encrypt(password, token)
    Digest::SHA1.hexdigest(password + token)
  end
  
  # Set the user's password, producing a salt if necessary
  def password=(pass)
    @password = pass
    self.salt = (1..12).map{(rand(26)+65).chr}.join if !self.salt
    self.hashed_password = User.encrypt(@password, self.salt)
  end
  
  
  def url
    "user/#{self.id}"    
  end
  
  def to_json()
    ret = {}
    self.attributes.each do |k,v|
      # We used to return a url for the id it seems that we do not now.
      # ret[k] = k.to_s == "id" ? self.url : v unless k.to_s == "password"
      ret[k] = v unless k.to_s == "password" || k.to_s == "hashed_password" || k.to_s == "salt"
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
      # We used to return a url for the id it seems that we do not now.
      # ret[k] = k.to_s == "id" ? self.url : v
      ret[k] = v
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
	property  :effort,             String
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
      # We used to return a url for the id it seems that we do not now.
      # ret[k] = k.to_s == "id" ? self.url : v
      ret[k] = v
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

helpers do
  
  def login_required
    if session[:user]
      return true
    elsif request.env['REQUEST_PATH'] =~ /(\.json|\.xml)$/ && request.env['HTTP_USER_AGENT'] !~ /Mozilla/
        @auth ||= Rack::Auth::Basic::Request.new(request.env)
        if @auth.provided? && @auth.basic? && @auth.credentials && User.authenticate(@auth.credentials.first, @auth.credentials.last)
          session[:user] = User.first(:loginName => @auth.credentials.first).id
          return true
        else
          status 401
          halt("401 Unauthorized") rescue throw(:halt, "401 Unauthorized")
        end
    else
      session[:return_to] = request.fullpath
      redirect '/'
      pass rescue throw :pass
    end
  end
  
  def current_user
    User.get(session[:user])
  end
  
end

#-----------------------------------------------------------------------------
# URL MAP HELPERS 
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

def json_login(route, options={})
  post(route, options) do
    record = {}
    # parse JSON request body or halt with 404
    opts = User.parse_json(request.body.read, 'post') rescue nil
    halt 404, "Invalid JSON" if opts.nil?
    
    puts "In JSON LOGIN login:[#{opts[:loginName]}], pass:[#{opts[:password]}]"
    
    # Attempt to authenticate the user
    record = User.authenticate(opts[:loginName], opts[:password]) rescue nil
    
    # Repond with error 404 or JSON
    halt 404, "User not authenticated" if record.nil?
    content_type "application/javascript"
    session[:user] = record.id
    session[:authToken] = record.salt
    record.to_json
  end
end

#-----------------------------------------------------------------------------
# Configuration Options
#
set :sessions, true
set :port, 4567

#-----------------------------------------------------------------------------
# ROUTES
#
# REGEX VERSIONS -------------------------------------------------------------
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

# NAMED PARAM VERSIONS -------------------------------------------------------

# LOGIN
json_login      '/tasks-server/login'

# Fetch all records for a model
json_get_list   '/tasks-server/:model'

# Fetch one record for a model:id
json_get_single '/tasks-server/:model/:id'

# Save a record for a model type
json_post       '/tasks-server/:model'

# Update a record for a model type:id
json_put        '/tasks-server/:model/:id'

# Delete a record for a model type:id
json_delete     '/tasks-server/:model/:id'