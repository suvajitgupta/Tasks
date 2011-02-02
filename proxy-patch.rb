require 'net/http'
require 'net/https'

RootCA = '/etc/ssl/certs'

module SC
  module Rack 
     
    # Rack application proxies requests as needed for the given project. 
    class Proxy 
       
      def initialize(project) 
        @project = project
        @proxies = project.buildfile.proxies
      end 
       
      def call(env)        
        url = env['PATH_INFO']
        
        @proxies.each do |proxy, value|
          if url.match(/^#{Regexp.escape(proxy.to_s)}/)
            return handle_proxy(value, proxy.to_s, env)
          end
        end
        
        return [404, {}, "not found"]
      end
      
      def handle_proxy(proxy, proxy_url, env)
        origin_host = env['SERVER_NAME'] # capture the origin host for cookies
        http_method = env['REQUEST_METHOD'].to_s.downcase
        url = env['PATH_INFO']
        params = env['QUERY_STRING']
        
        # collect headers...
        headers = {}
        env.each do |key, value|
          next unless key =~ /^HTTP_/
          next if key =~/^HTTP_ACCEPT_ENCODING/ # we can't proxy gzip'd or zip'd stuff
          key = key.gsub(/^HTTP_/,'').downcase.sub(/^\w/){|l| l.upcase}.gsub(/_(\w)/){|l| "-#{$1.upcase}"} # remove HTTP_, dasherize and titleize
          headers[key] = value
        end
        
        # Rack documentation says CONTENT_TYPE and CONTENT_LENGTH aren't prefixed by HTTP_
        headers['Content-Type'] = env['CONTENT_TYPE'] if env['CONTENT_TYPE']
        headers['Content-Length'] = env['CONTENT_LENGTH'] if env['CONTENT_LENGTH']
        
        http_host, http_port = proxy[:to].split(':')
        http_port = '443' if http_port.nil? and proxy[:https]
        http_port = '80' if http_port.nil?
        
        # added 4/23/09 per Charles Jolley, corrects problem
        # when making requests to virtual hosts
        headers['Host'] = "#{http_host}:#{http_port}"
        
        if proxy[:url]
          url = url.sub(/^#{Regexp.escape proxy_url}/, proxy[:url])
        end
        
        http_path = [url]
        http_path << params if params && params.size>0
        http_path = http_path.join('?')
        
        response = nil
        no_body_method = %w(delete get copy head move options trace)
        
        # headers.each do |key, value|
        #   SC.logger << "   #{key}: #{value}\n"
        # end
        
        if proxy[:username] and proxy[:password]
          SC.logger << "Using basic HTTP authentication\n"
          headers['Authorization'] = 'Basic ' + ["#{proxy[:username]}:#{proxy[:password]}"].pack('m').strip
        end
        if proxy[:https]
          # custom
          headers['COOKIE'] = $cookies[http_host] if $cookies
          SC.logger << "The Cookie is: #{headers['COOKIE']} for #{http_host}\n"
          headers.delete("HOST")
          
          
          SC.logger << "Sending HTTPS request\n"
          http = ::Net::HTTP.new(http_host, http_port)
          http.use_ssl = true
          if File.directory? RootCA
            http.ca_path = RootCA
            http.verify_mode = OpenSSL::SSL::VERIFY_PEER
            http.verify_depth = 5
          else
            http.verify_mode = OpenSSL::SSL::VERIFY_NONE
          end
          http.start do |http|
            if no_body_method.include?(http_method)
              response = http.send(http_method, http_path, headers)
            else
              http_body = env['rack.input'].gets || ''
              response = http.send(http_method, http_path, http_body, headers)
            end
          end
          SC.logger << "~ PROXY: #{http_method.upcase} #{response.code} #{url} -> https://#{http_host}:#{http_port}#{http_path}\n"
        else
          ::Net::HTTP.start(http_host, http_port) do |http|
            if no_body_method.include?(http_method)
              response = http.send(http_method, http_path, headers)
            else
              http_body = env['rack.input'].gets || ''
              response = http.send(http_method, http_path, http_body, headers)
            end
          end
          SC.logger << "~ PROXY: #{http_method.upcase} #{response.code} #{url} -> http://#{http_host}:#{http_port}#{http_path}\n"
        end
        
        body = response.body
        
        body = "[]" if body == nil
        
        # display and construct specific response headers
        response_headers = {}
        ignore_headers = ['transfer-encoding', 'keep-alive', 'connection'] 
        $cookies = {} unless $cookies
        response.each do |key, value|
          next if ignore_headers.include?(key.downcase)
          # If this is a cookie, strip out the domain.  This technically may
          # break certain scenarios where services try to set cross-domain
          # cookies, but those services should not be doing that anyway...
          if key.downcase == 'set-cookie'
            value.gsub!(/domain=[^\;]+\;? ?/,'') 
            value.gsub!(/expires=[^\;]+\;? ?/,'')
            value.gsub!(/path=[^\;]+\;? ?/,'')
            value.gsub!(/secure; HttpOnly, /,'')
            $cookies[http_host] = value #get the cookie for other sessions
          end
          # Location headers should rewrite the hostname if it is included.
          value.gsub!(/^https?:\/\/#{http_host}(:[0-9]+)?\//, "http://#{http_host}/") if key.downcase == 'location'
          
          SC.logger << "   #{key}: #{value}\n"
          response_headers[key] = value
        end

        return [response.code, ::Rack::Utils::HeaderHash.new(response_headers), [body]]
      end 
    end 
  end 
end
