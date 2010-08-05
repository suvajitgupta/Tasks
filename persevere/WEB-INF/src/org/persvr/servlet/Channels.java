package org.persvr.servlet;

import java.io.IOException;
import java.util.Date;
import java.util.Enumeration;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Undefined;
import org.persvr.data.GlobalData;
import org.persvr.data.Identification;
import org.persvr.data.ObjectId;
import org.persvr.data.ObservedCall;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.remote.Client;
import org.persvr.remote.DataSerializer;
import org.persvr.remote.EventStream;
import org.persvr.remote.InnerResponse;
import org.persvr.remote.PersevereFilter;
import org.persvr.remote.Client.IndividualRequest;
import org.persvr.remote.EventStream.EventCallback;
import org.persvr.remote.EventStream.Notification;
import org.persvr.security.User;
import org.persvr.util.JSON;

import org.mozilla.javascript.Function;

/**
 * This is an HTTP Channels implementation that provides HTTP tunneling for duplex 
 * Comet-style RESTful communication. This will utilize Jetty continuations if
 * available so that thread blocking is not necessary. If Jetty is not available,
 * thread blocking (which is less efficient) will be used to keep the connection open.
 * If you are using Tomcat, you should use the TomcatChannels servlet.
 * @author Kris
 *
 */
@SuppressWarnings("serial")
public class Channels extends HttpServlet {

	public final static int COMET_TIMEOUT = 60 * 60 * 1000; // TODO: we could make this configurable


	static boolean jettyContinuations = false;
	static {
		try {
			// must keep the full class names in there so we can conditionally try to use Jetty continuations, and not fail on class load (due to imports)
			jettyContinuations = org.mortbay.util.ajax.Continuation.class != null;
		} catch (NoClassDefFoundError e) {
			// this means that we are not using Jetty :(. Have to use thread blocking instead.
		}

	}

	/**
	 * Suspend the current request using whatever technology is available (preferably without blocking threads)
	 * @param eventStreamer
	 * @param activeStream
	 * @param request
	 * @param stream
	 * @return
	 * @throws IOException
	 */
	protected Notification suspend(final EventStream eventStreamer, 
			final HttpServletRequest request) throws IOException {
		if (jettyContinuations) {
			// must keep the full class names in there so we can conditionally try to use Jetty continuations, and not fail on class load (due to imports)
			request.setAttribute("org.persvr.suspended", true);
			final org.mortbay.util.ajax.Continuation continuation = org.mortbay.util.ajax.ContinuationSupport.getContinuation(request, null);
			EventCallback callback = new EventCallback() {

				public void onEvent() throws IOException {
					request.setAttribute("org.persvr.suspended", false);
					continuation.resume();
				}

			};
			eventStreamer.addCallback(callback);

			continuation.suspend(request.getSession().getMaxInactiveInterval() * 500); // half the session timeout 
			return null;
		}

		return eventStreamer.take(1000000000);

	}


	/**
	 * Determine if streaming is available based on proxy indications and user agent string
	 * @param request
	 * @return
	 */
	@SuppressWarnings("unchecked")
	protected boolean isHttpStreamAcceptable(HttpServletRequest request) {			
		Enumeration headers = request.getHeaderNames();
		while (headers.hasMoreElements()) {
			String headerName = (String) headers.nextElement();
			if (headerName.toLowerCase().startsWith("x-forwarded")) // if it is going through a proxy, we can't trust the streaming to work
				return false;
		}
		if (request.getHeader("xdomainrequest") != null) // IE8's XDomainRequest supports streaming!
			return true;
		String userAgent = request.getHeader("User-Agent");
		return userAgent != null && (userAgent.indexOf("Firefox") > -1 || userAgent.indexOf("Safari") > -1); // and these guys support streaming
	}
	protected CometSerializer getCometSerializer(HttpServletRequest request) {
		String acceptType = PersevereFilter.getParameterFromQueryString(request,"http-Accept");
		boolean canStream = acceptType == null && isHttpStreamAcceptable(request);
		if (acceptType == null) {
			acceptType = PersevereFilter.getHeader(request,"Accept");
		}
		CometSerializer serializer;
		if (acceptType != null)// && acceptType.indexOf("application/rest+json") > -1)  // application/rest+json check
			serializer = new JsonChannels();
		else if (acceptType != null && acceptType.indexOf("application/http") > -1)  // application/http check
			serializer = new TunnelingHttpChannels();
		else 
			serializer = new HttpChannels();		
		serializer.setStreamingAvailable(canStream);
		serializer.setRequest(request);
		return serializer;
	}

	static int BYTES_SENT_THRESHOLD = 200000; // after this many bytes are sent, the connection is reset, so there is not excessive memory consumption on the client


	/**
	 * Send a notification that another simultaneous connection is being established 
	 * @author Kris
	 *
	 */
	static class ConnectionConflict extends Notification {

		@Override
		public ObservedCall getCall() {
			return new ObservedCall(ObjectId.idForString("root"),"connection-conflict",null,null);
		}

		@Override
		public String getPathInfo() {
			return "root";
		}
		
	}


	protected EventStream getEventStream(HttpServletRequest req) throws IOException {
		Client stream;
		String createConnectionId = PersevereFilter.getParameter(req,"Create-Client-Id");
		String connectionId;
		if (createConnectionId == null) {
			connectionId = req.getRemoteAddr() + PersevereFilter.getParameter(req,"Client-Id");
			if (connectionId == null) 
				throw new RuntimeException("You must include a Client-Id or Create-Client-Id header");
			stream = EventStream.streams.get(connectionId);
			if (stream == null || !stream.started)
				return null; // referring to a connection id that has been initialized yet
		}
		else { // create a new client id
			connectionId = req.getRemoteAddr() + createConnectionId;
			// else we are picking up connection that was initialized by subscription request
			synchronized(EventStream.streams){
				stream = EventStream.streams.get(connectionId);
				if (stream == null) {
					Object user = Client.getCurrentObjectResponse().getConnection().authorizedUser;
					EventStream.streams.put(connectionId, stream = new Client(connectionId));
					stream.authorizedUser = user; 
				}
			}
			if(!stream.started){
				// call the onConnect function
				Scriptable global = GlobalData.getGlobalScope();
				Function onConnect = (Function) global.get("onConnect", global);
				onConnect.call(PersevereContextFactory.getContext(), global, global, new Object[]{ stream });
			}
			stream.started = true;
		}
		return stream;
	}
	public static class ConnectionConflictException extends RuntimeException {
		
	}
	protected boolean sendEvent(Notification notification, EventStream eventStreamer, CometSerializer serializer)
			throws IOException {
		do {
			if (notification instanceof ConnectionConflict)
				throw new ConnectionConflictException();
			eventStreamer.bytesSent += serializer.sendNotification(notification, (Client) eventStreamer, eventStreamer.bytesSent == 0);
			//((InnerResponse) response).resetResponse();
		} while (serializer.supportsMultiple() && eventStreamer.eventAvailable() && (notification = eventStreamer.take(0)) != null);
		if (!serializer.isStreamingAvailable() || eventStreamer.bytesSent > BYTES_SENT_THRESHOLD ) {
			serializer.sendEnd();
			//activeStream.close();
			eventStreamer.bytesSent = 0;
			eventStreamer.removeCallback();
			return true;
		}
		return false;
	}
	String prefix;
	@Override
	protected void service(final HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		// set the prefix
		if(prefix == null){
			prefix = req.getContextPath();
			if (!"/".equals(prefix))
				prefix = prefix + "/";
		}
		//boolean streamingSupported = isHttpStreamAcceptable(req);
		CometSerializer serializer = getCometSerializer(req);
		serializer.setResponse(resp);
		final EventStream eventStream = getEventStream(req);
		if (eventStream == null) {
			resp.setStatus(404); // The client id was not found
			resp.getOutputStream().print("The client ID was not found");
			return;
		}
		Notification notification = eventStream.eventAvailable() ? eventStream.take(0) : null; 
		if (notification != null) { // we are resuming
			try {
				if (sendEvent(notification, eventStream, serializer))
					return; // done
				else {
					org.mortbay.util.ajax.Continuation continuation = org.mortbay.util.ajax.ContinuationSupport.getContinuation(req, null); 
					if (continuation.isResumed())
						continuation.suspend(req.getSession().getMaxInactiveInterval() * 500); // suspend again
					else
						notification = suspend(eventStream, req);
					continuation.suspend(req.getSession().getMaxInactiveInterval() * 500); // suspend again
				}
				throw new RuntimeException("Continuation failed");
			}
			catch (ConnectionConflictException e) {
				resp.setStatus(409);
			}
			catch (IOException e) {
				//e.printStackTrace();
				eventStream.finished();
			}
			return;
		}

		if (req.getHeader("xdomainrequest") == null) {
			// if it is not IE8, we do not want to have multiple connections
			HttpSession session = req.getSession(true);
			Client otherConnection = (Client) session.getAttribute("org.persvr.channel");
			if (otherConnection != null && otherConnection != eventStream) {
				//TODO: Send reconnect advice
				otherConnection.fire(new ConnectionConflict()); // if there is another connection, we need to notify it
			}
			session.setAttribute("org.persvr.channel",eventStream);
		}
		else
			resp.setHeader("XDomainRequestAllowed", "1"); // allow this so we can support streaming in IE8
		
		//final ServletOutputStream outStream = resp.getOutputStream();
//		System.err.println("eventStream.ping" + eventStream.pingCallback);
		boolean writtenTo = false;
		while (!writtenTo || serializer.isStreamingAvailable() || eventStream.eventAvailable()) {

			notification = suspend(eventStream, req); // implementation specific handling
			if (notification == null) // if the suspend returns null, the suspend will resume the operation 
				return;
			serializer.sendNotification(notification, (Client) eventStream,!writtenTo);
			writtenTo = true;
//			System.err.println("flushed connection");
			//outStream.flush(); // flush before waiting again
		}
//		System.err.println("closed connection");
		//outStream.close();
	}
	interface CometSerializer {
		void setResponse(HttpServletResponse response);
		void setRequest(HttpServletRequest request);
		int sendNotification(Notification notification, Client connection,boolean first) throws IOException;
		boolean isStreamingAvailable();
		boolean supportsMultiple();
		void setStreamingAvailable(boolean streamingAllowed);
		void sendEnd() throws IOException;
	}
	class TunnelingHttpChannels implements CometSerializer {
		public boolean supportsMultiple() {
			return true;
		}
		boolean streamingAllowed;
		public boolean isStreamingAvailable() {
			return streamingAllowed;
		}
		HttpServletResponse response;
		HttpServletRequest request;
		public void setRequest(HttpServletRequest request) {
			this.request = request;
		}
		public int sendNotification(Notification notification, Client connection,boolean first) throws IOException {
			String pathInfo = notification.getPathInfo();
			InnerResponse innerResponse = new InnerResponse(prefix + pathInfo); 
    		ObservedCall call = notification.getCall();
    		innerResponse.setHeader("Event", call.getMethod());
    		IndividualRequest request = connection.getIndividualRequest(null, response);
    		request.setRequestedPath(pathInfo, Identification.idForString(pathInfo));
    		Object target = call.getContent();
    		String output;
			if (target == Scriptable.NOT_FOUND || target == Undefined.instance){
				innerResponse.setStatus(204);
				output ="";
			}
			else
				output = request.serialize(target);
			innerResponse.setHeader("Last-Modified", "" + new Date()); // TODO: This should come from the transaction
			innerResponse.getOutputStream().print(output);
			String message = innerResponse.asString();
			response.getOutputStream().print(message);
			response.getOutputStream().flush();
			return message.length();
		}

		public void sendEnd() throws IOException {
		}

		public void setResponse(HttpServletResponse response) {
			this.response = response;
			response.setContentType("application/http");		
		}

		public void setStreamingAvailable(boolean streamingAllowed) {
			this.streamingAllowed = streamingAllowed;
		}
		
	}
	class HttpChannels implements CometSerializer {
		public boolean isStreamingAvailable() {
			return false;
		}
		public boolean supportsMultiple() {
			return false;
		}
		HttpServletResponse response;
		HttpServletRequest request;
		public void setRequest(HttpServletRequest request) {
			this.request = request;
		}

		public int sendNotification(Notification notification, Client connection,boolean first) throws IOException {
			String pathInfo = notification.getPathInfo();
    		ObservedCall call = notification.getCall();
    		response.setHeader("Event", call.getMethod());
    		response.setHeader("Content-Location", prefix + pathInfo);
    		IndividualRequest request = connection.getIndividualRequest(null, response);
    		request.setRequestedPath(pathInfo, Identification.idForString(pathInfo));
//			target = PersevereServlet.handleRange(range, target, since,response);
			String output = request.serialize(call.getContent());
			response.setHeader("Last-Modified", "" + new Date()); // TODO: This should come from the transaction
    		response.getOutputStream().print(output);
    		response.getOutputStream().flush();
    		return 0;
		}

		public void setResponse(HttpServletResponse response) {
			this.response = response;
		}

		public void setStreamingAvailable(boolean streamingAllowed) {
		}
		public void sendEnd() throws IOException {
		}
		
	}
	class JsonChannels implements CometSerializer {
		boolean streamingAllowed;
		public boolean isStreamingAvailable() {
			return streamingAllowed;
		}
		public boolean supportsMultiple() {
			return true;
		}

		HttpServletResponse response;
		HttpServletRequest request;
		public void setRequest(HttpServletRequest request) {
			this.request = request;
		}

		public int sendNotification(Notification notification, Client connection,boolean first) throws IOException {
			String pathInfo = notification.getPathInfo();
    		ObservedCall call = notification.getCall();
    		ServletOutputStream outStream = response.getOutputStream();
    		outStream.print(first ? "[" : ",");
    		outStream.print("{\"event\":"+JSON.quote(call.getMethod()) + ",\"source\":" + JSON.quote(prefix + pathInfo));
    		IndividualRequest request = connection.getIndividualRequest(null, response);
    		Client.registerThisConnection(request);
    		request.setRequestedPath(pathInfo, Identification.idForString(pathInfo));
//			target = PersevereServlet.handleRange(range, target, since,response);
    		Object content = call.getContent();
    		if (content != Undefined.instance) {
	    		outStream.print(",\"result\":");
	    		try{
	    			DataSerializer.serialize(content, this.request.getHeader("Accept"), false);
	    		}
	    		catch(RuntimeException e) {
	    			outStream.print(JSON.quote(e.getMessage()));
	    		}
	    		//outStream.print(output);
    		}
    		outStream.print("}");
			response.getOutputStream().flush();
    		return 1000;
		}
		public void sendEnd() throws IOException {
			response.getOutputStream().print("]");
		}

		public void setResponse(HttpServletResponse response) {
			response.setContentType("application/rest+json");
			this.response = response;
		}

		public void setStreamingAvailable(boolean streamingAllowed) {
			this.streamingAllowed = streamingAllowed;
		}
		
	}
}
