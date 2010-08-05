package org.persvr.remote;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import javax.servlet.http.HttpServletResponse;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.persvr.data.GlobalData;
import org.persvr.data.ObjectId;
import org.persvr.data.ObservedCall;
import org.persvr.data.PersistableObject;
import org.persvr.data.PropertyChangeSetListener;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.remote.Client.IndividualRequest;
import org.persvr.security.UserSecurity;


/**
 * This represents a stream of events. You can subscribe to the event stream with addCallback and 
 * publish events with the fire method.
 * @author Kris
 *
 */
public abstract class EventStream implements PropertyChangeSetListener {
	EventCallback callback;
	public Object authorizedUser;

	HttpServletResponse response;
	public static Map<String, Client> streams = new HashMap<String, Client>();
	public static int getConnectionCount(){
		int connectionCount = 0;
		synchronized(streams){
			for(Client client : streams.values()){
				if(client.callback != null)
					connectionCount++;
			}
		}
		return connectionCount;
	}
	protected boolean finished = false;
	/**
	 * This is how often we ping the connection, in seconds. This SHOULD NOT be necessary, but I haven't determined how to detect a connection close in Jetty yet
	 */
	static final int CONNECTION_MONITOR_INTERVAL = 30;

	Map<Map<ObjectId, Set<String>>, Map<String,String>> readSetToHeaders = new HashMap<Map<ObjectId, Set<String>>, Map<String,String>>();
	public void addSubscription(Map<String,String> headers) {
		readSetToHeaders.put(PersistableObject.getReadSet(),headers);
	}
	public void removeSubscription(Map<String,String> headers) {
		String pathInfo = headers.get("__pathInfo__");
		Set<Map<ObjectId, Set<String>>> removalSet = new HashSet<Map<ObjectId, Set<String>>>();
 		for (Entry<Map<ObjectId, Set<String>>, Map<String,String>> entry : readSetToHeaders.entrySet())  {
			if (pathInfo.equals(entry.getValue().get("__pathInfo__")))
				removalSet.add(entry.getKey());
		}
 		for (Map<ObjectId, Set<String>> readSet : removalSet)
 			readSetToHeaders.remove(readSet);
	}
	/**
	 * Adds a callback to will be called when a notification is sent through this event stream
	 * @param callback
	 */
	public synchronized void addCallback(EventCallback callback) { 
		this.callback = callback;
		Notification response;
		if ((response= notificationQueue.peek()) != null) { 
			try {
				fire(null);
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}
	}
	public boolean isConnected(){
		return callback != null;
	}
	/**
	 * Indicates an event is available on this stream
	 * @return
	 */
	public boolean eventAvailable() {
		return notificationQueue.peek() != null;
	}
	public synchronized void removeCallback() {
		this.callback = null;
	}
/*	List<EventStream> subStreams = new LinkedList(); // this is to keep a strong reference to substreams, so event listeners can be added to and strong references can be maintained 
	public void addSubEventStream(EventStream eventStream) {
		subStreams.add(eventStream);
		eventStream.addCallback(new EventCallback() {// direct all the event streams through a single one
			public void onEvent(InnerResponse response) throws IOException {
				EventStream.this.fire(response);
			}
		});
	}*/
	@Override
	public String toString() {
		// TODO Auto-generated method stub
		return super.toString() + "list ";// + subStreams;
	}
	BlockingQueue<Notification> notificationQueue = new LinkedBlockingQueue<Notification>();
	public Notification take(int timeoutInSeconds) {
		try{ 
			return notificationQueue.poll(timeoutInSeconds,TimeUnit.SECONDS);
		} catch (InterruptedException e) {
			throw new RuntimeException(e);
		}
	}
	public interface EventCallback{
		void onEvent() throws IOException;
	}
	/** A call notification combined with necessary request context information
	 * @author Kris
	 */
	public static class Notification {
		Map<String,String> headers;
		ObservedCall call;
		String pathInfo;
		public Map<String, String> getHeaders() {
			return headers;
		}
		public ObservedCall getCall() {
			return call;
		}
		public String getPathInfo() {
			return pathInfo;
		}
	}
	/**
	 * this is called by notification system and adds an event to the stream. This is expected
	 * to be a new thread and will adapt to current thread
	 */ 
	public void propertyChange(List<ObservedCall> evts) {
		if (finished) // if it is finished it should be gc'ed soon, but until then, we don't want it doing anything
			return;
		UserSecurity.registerThisThread(authorizedUser);
		IndividualRequest request = Client.getCurrentObjectResponse();
		((Client)this).adoptThread(Thread.currentThread());
		boolean channelFound = false;
		// we map the resource changes here, so each resource only fires once
		List<Notification> updatedResources = new ArrayList<Notification>();
		for (ObservedCall evt : evts) {
			if (evt.getExcludedClient() != this) { // if it is an event that we caused, we don't need to fire a notification
				Notification notification = new Notification();
				notification.call = evt;
				/*for (Entry<Map<ObjectId, Set<String>>, Map<String,String>> entry : readSetToHeaders.entrySet()){
					Map<ObjectId, Set<String>> readSet = entry.getKey();
					Set<String> propertySet = readSet.get(evt.getSourceId());
					if (propertySet != null) {
						Map<String,String> headers = entry.getValue();
						notification.headers = headers;
						if (propertySet == FullSet.instance && !((Persistable)evt.getSource() instanceof List)) {
							String pathInfo = evt.getSourceId().toString();
							notification.pathInfo = pathInfo;
							updatedResources.add(notification); // TODO: I think we can just addd this directly to the notificationQueue
						}
						else {
							channelFound = true;
							String pathInfo = headers.get("__pathInfo__");
							notification.pathInfo = pathInfo;
							updatedResources.add(notification);
						}
						break;
					}
				}*/
				if (!channelFound) {
					notification.headers = new HashMap<String,String>();
					String pathInfo = evt.getSourceId().toString();
					notification.pathInfo = pathInfo;
					updatedResources.add(notification);
				}
			}			
		}
		if(notificationQueue.size() > 100){
			notificationQueue.clear();
		}
		// go through each resource now
		for (Notification notification: updatedResources) {
			notificationQueue.add(notification);
//			createResponse(entry.getKey(), notification.call);
			notification.headers.put("__now__", new Date().getTime() + "");
			/*if (!(response instanceof InnerResponse)) {
				finished = true;
				return;
			}*/
		}
		try {
			synchronized(this) { // inlined from fire
				if (callback != null && notificationQueue.peek() != null)
					callback.onEvent();
			}
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
		Client.threadClient.set(request);
		
	}
/*	protected void createResponse(String pathInfo, ObservedCall call) {
		try {
			response = response == null || response instanceof InnerResponse ? 
					new InnerResponse('/' + pathInfo) : response; // TODO: not sure if this is how we want to do the slash prefix 
    		if (!(response instanceof InnerResponse))
    			response.setStatus(202);
    		response.setHeader("Event", call.getMethod());
    		IndividualRequest request = ((ClientConnection)this).getIndividualRequest(null);
    		request.setRequestedPath(pathInfo, Identification.idForString(pathInfo));
//			target = PersevereServlet.handleRange(range, target, since,response);
			String output = request.getValueString(call.getContent(),true);
			response.setHeader("Last-Modified", "" + new Date()); // TODO: This should come from the transaction
    		response.getOutputStream().print(output);
		} catch (IOException e) {
			e.printStackTrace();
		}
		responseQueue.add(response instanceof InnerResponse ? (InnerResponse) response : new InnerResponse(null));	

	}*/

	public void setResponse(HttpServletResponse response) {
		this.response = response;
	}
	public boolean started = false;
	public String connectionId;
	public int bytesSent = 0;


	public void finished() {
		//System.err.println("finished "+ connectionId);		
		finished = true;
		synchronized(streams){
			streams.remove(connectionId);// remove the stream, this should make it gc-able.
		}
		Scriptable global = GlobalData.getGlobalScope();
		Function onDisconnect = (Function) global.get("onDisconnect", global);

		if(started){
			
			onDisconnect.call(PersevereContextFactory.getContext(), global, global, new Object[]{ this });
		}
	}


	public synchronized void fire(Notification response) throws IOException {
		try {
			if (response != null)
				notificationQueue.add(response);
			synchronized(this) {
				if (callback != null && (response = notificationQueue.peek()) != null)
					callback.onEvent();
			}
		} catch (IOException e) {
			Log log = LogFactory.getLog(EventStream.class);
			log.info("unable to send event ", e);
			finished();
		}
	}




}
