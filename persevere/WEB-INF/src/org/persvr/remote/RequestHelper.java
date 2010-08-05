/*
 * RequestHelper.java
 *
 * Created on August 28, 2005, 11:00 PM
 *
 * To change this basis, choose Tools | Options and locate the basis under
 * the Source Creation and Management node. Right-click the basis and choose
 * Open. You can then make changes to the basis in the Source Editor.
 */

package org.persvr.remote;



import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.security.auth.login.LoginException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.binary.Base64;
import org.mozilla.javascript.NativeObject;
import org.persvr.Persevere;
import org.persvr.data.FunctionUtils;
import org.persvr.data.Identification;
import org.persvr.data.ObjectId;
import org.persvr.data.PersistableObject;
import org.persvr.remote.Client.IndividualRequest;
import org.persvr.security.SystemPermission;
import org.persvr.security.User;
import org.persvr.security.UserSecurity;
import org.persvr.data.Query;
/**
 *
 * @author Kris Zyp
 * RequestHelper performs the necessary request and response setup to facilitate JSPON objects being transferred
 * to and from the server and JSPON client.
 */
public class RequestHelper extends JsonReceiver {
	public static final int DEFAULT_LOGIN_TIME_LENGTH = 604800; // one week, TODO: get this value from the database

	Client connection;
	/** Creates a new instance of RequestHelper */
	HttpServletRequest request;
	HttpServletResponse response;

	static boolean multiLingual = false;
	/**
	 * This takes the request parameters that come from the browser and string values and converts them to
	 * objects and primitives using JSPON conversion
	 * @return A map of the parameters with their correct objects as values
	 */
	public Map<String,Object> getParametersAsObjects() {
        Map<String,Object> parameters = new HashMap<String,Object>();
        Enumeration<String> parameterNames = request.getParameterNames();
        String name;
        try {
	        while (parameterNames.hasMoreElements()) {
	            name = parameterNames.nextElement();
	            parameters.put(name,convertParameterValueToObject(new String(request.getParameter(name).getBytes("ISO-8859-1"),"UTF8")));
	        }
        }
        catch (UnsupportedEncodingException e) {
        	throw new RuntimeException(e);
        }
        
        return parameters;
	}
	public NativeObject getParametersAndHeadersAsJsObject() {
		NativeObject parameters = Persevere.newObject();
        
        Enumeration headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
        	String name = (String) headerNames.nextElement();
            parameters.put(name,parameters,request.getHeader(name));
        }
        if (request.getQueryString() != null)
	        try {
				// _MUST NOT_ read the body (getInputStream) or call getParameter, because that destroys it for later use
				for (String nameValueStr : request.getQueryString().split("&")) { // parse the query string
					String[] nameValue = nameValueStr.split("=",2);
					if (nameValue.length == 2)
						parameters.put(URLDecoder.decode(nameValue[0],"UTF-8"), parameters, URLDecoder.decode(nameValue[1],"UTF-8"));
				}
	        }
	        catch (UnsupportedEncodingException e) {
	        	throw new RuntimeException(e);
	        }

        return parameters;
	}

	/**
	 * This converts a string value to an object using JSPON conversion. For instance the string:<br>
	 * <code>{"id":"3"}</code><br>
	 * Should return the object with id of 3.
	 * @param parameterValue string JSPON representation of the object
	 * @return The object converted from JSPON
	 */
	public Object convertParameterValueToObject(String parameterValue) {
		return convertJsonStringToObject(parameterValue);
	}
	Object convertWithKnownId(String jsponString,Identification<? extends Object> id) {
		Object value = parseJsponString(jsponString);
		if (value instanceof List) {
			List array = (List) value;
			Object target = id.getTarget();
			List targetList;			
			if(target instanceof List && !(id instanceof Query)){
				targetList = (List) target;
				targetList.clear();
			}
			else
				targetList = Persevere.newArray();
	    	for (int i = 0; i < array.size(); i++) {
	    		Object item = array.get(i);
	    		item = convertParsedToObject(item); 
					targetList.add(item);
	    	}
	    	return targetList;
		}
		if (value instanceof JSONFunction) {
			boolean authorizedForFullScripting = UserSecurity.hasPermission(SystemPermission.javaScriptCoding);
			if (!authorizedForFullScripting)
				throw new RuntimeException("You do not have sufficient priviledge to create functions, and untrusted scripts are not implementd yet");

			return FunctionUtils.createFunction(((JSONFunction)value).toString(),"new function");
		}
		if (value instanceof Map)
			return convertIdIfNeeded(idFromJSPONObject((Map) value,id instanceof ObjectId ? (ObjectId) id : null, true));
		
		 return convertJsonStringToObject(jsponString);
	}
	public String outputWaitingResponse() throws IOException {
        IndividualRequest requestHandler = Client.getCurrentObjectResponse();
        return requestHandler.outputWaitingData();

	}
	public RequestHelper(HttpServletRequest request,HttpServletResponse response) {
		this.request = request;
		this.response = response;
		setupRequestAndResponse();
	}
	private String getHost() {
		String referer = request.getHeader("Referer"); // don't allow parameters here!
		if (referer == null || referer.startsWith("file:") || referer.indexOf('/',8) == -1)
			return null;
		return referer.substring(referer.indexOf('/')+2,referer.indexOf('/',8)); // strip off the path and protocol
	}
	public void authorizeCookieAuthentication(){
		HttpSession session = request.getSession(false);
		if(session == null)
			return;
		Object user = session.getAttribute("user");
		if(user != null){
			UserSecurity.registerThisThread(user);
		}
	}
	private void setupRequestAndResponse(){
		//if WML response.setContentType("text/vnd.wap.wml");
		PersistableObject.enableSecurity(true);
		
		String clientId = PersevereFilter.getParameter(request,"Client-Id");
		boolean explicitClientId = clientId != null;
		HttpSession session = clientId == null ? request.getSession(false) : request.getSession();
		if(session == null){
			if(PersevereFilter.getHeader(request, "Transaction") != null ||
					PersevereFilter.getHeader(request, "Seq-Id") != null)
			session = request.getSession();
		}
			
		clientId = (clientId == null ? session == null ? "" : session.getId() : request.getRemoteAddr() + clientId);
		synchronized(EventStream.streams){
			connection = EventStream.streams.get(clientId);
			
			if (connection == null) { 
				connection = new Client(clientId);
				if(session != null){
					EventStream.streams.put(clientId, connection);
					List<Client> connections = (List<Client>) session.getAttribute(Client.class.toString());
					if (connections == null){
						connections = new ArrayList<Client>(1);
						session.setAttribute(Client.class.toString(), connections);
					}
					connections.add(connection);
					connection.setSession(session);
				}
			}
		}
		Client.registerThisConnection(connection.getIndividualRequest(request, response));
		// we use the connections user if we have an explict client id and we are using cookie based authentication
        Object user = explicitClientId && connection.getAuthorization() == null ? connection.getAuthorizedUser() : null;
        String authorization = PersevereFilter.getHeader(request,"Authorization"); // in case the client specificies a session
		if (authorization != null) {
			if(session != null)
				session.setAttribute("user", null);
			user = connection.getAuthorizedUser();
			if (!authorization.equals(connection.getAuthorization()))				
				try {
					if(authorization.startsWith("Basic ")){
						// Using Basic authentication (the right way)
						authorization = new String(Base64.decodeBase64(authorization.substring(6).getBytes())); 
					} // users can just input the authorization in plain text to make things easier

					String[] tokens = authorization.split(":", 2);
					String username = tokens[0];
					String password = tokens.length == 1 && authorization.endsWith(":") ? "" : tokens[1];
					user = UserSecurity.authenticate(username, password);
					connection.setAuthorizedUser(user);
					connection.setAuthorization(authorization);
				}
				catch (LoginException e) { // if it fails silently go to the public user
					throw new SecurityException(e);
				}
				catch (IndexOutOfBoundsException e) {
					throw new SecurityException("Authorization must be in the form Basic base64encoded(user:password)");
				}
		}
		UserSecurity.registerThisThread(user);
		if (authorization == null) {
			String referrer = request.getHeader("Referer");
			// this must be against the real request (not a wrapper) for security
			if(request.getHeader("Client-Id") != null || request.getHeader("Seq-Id") != null || 
					(referrer != null && !"GET".equals(request.getMethod()) // Referer headers can be forged to the same origin if a link is followed that then redirects back to the origin site 
							&& referrer.indexOf(request.getHeader("Host") + '/') > 0) ||
					(!"POST".equals(request.getMethod()) && !"GET".equals(request.getMethod()))){
				// this verifies the request was made by a same-origin authorized user
				connection.authorizationVerified = true;
				authorizeCookieAuthentication();
			}
			else {
				if(request.getMethod() == "GET"){
					// this could be authorized later in PersevereFilter once we know there is no explicit method
					connection.getCurrentObjectResponse().possibleUnauthorizedGet = true;
				}
				if (clientId.equals(PersevereFilter.getParameterFromQueryString(request,"client_id")) && connection.authorizationVerified)
					authorizeCookieAuthentication();
			}
			
		}


		if (multiLingual) {
			response.setHeader("Vary","Accept-Language");
		}

	}
		
	
	
	
	
	
	void clearSessionAttributes(HttpSession session) {
		System.err.println("The data was changed we should be reloading all parameters");
		Enumeration enumer = session.getAttributeNames();
		while (enumer.hasMoreElements())
			session.removeAttribute((String) enumer.nextElement());
		
	}
	Client getClientConnection() {
		return connection;
	}
	
	boolean pageNotFound = false;
	public HttpServletRequest getRequest() {
		return request;
	}
	public HttpServletResponse getResponse() {
		return response;
	}
	
}
