package org.persvr.servlet;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.catalina.CometEvent;
import org.apache.catalina.CometProcessor; 
import org.persvr.remote.Client;
import org.persvr.remote.EventStream;
import org.persvr.remote.InnerResponse;
import org.persvr.remote.PersevereFilter;
import org.persvr.remote.RequestHelper;
import org.persvr.remote.EventStream.Notification;



@SuppressWarnings("serial")
public class TomcatChannels extends Channels implements CometProcessor {

	public void event(CometEvent event) throws IOException, ServletException {
		HttpServletRequest request = event.getHttpServletRequest();
		HttpServletResponse response = event.getHttpServletResponse();
		
		if (event.getEventType() == CometEvent.EventType.BEGIN) {
			request.setAttribute("org.persvr.tomcatcomet", true);
			// need to call this to get the user registered
			new RequestHelper(request,response); // must register this connection
			event.setTimeout(COMET_TIMEOUT);
			// don't do anything yet, wait until read
			doPost(request,event.getHttpServletResponse());

		}			
		else if (event.getEventType() == CometEvent.EventType.READ) {
			//doPost(event.getHttpServletRequest(),event.getHttpServletResponse());
		}
		else if (event.getEventType() == CometEvent.EventType.END) {
			EventStream eventStream = getEventStream(request);
			
			if (eventStream != null && request.getAttribute("org.persvr.sent") == null){ // the connection was closed,
				System.err.println("connection closed by client " + request);
				eventStream.finished();
			}
			if (!eventStream.started) {
				event.getHttpServletResponse().setStatus(200);
				eventStream.started = true;
			}

			event.close();
		}
		else 
			event.close();
		
	}
/*	protected void setPingHandler(MonitoredEventStream eventStream) {
		eventStream.setPingCallback(new EventCallback() { // this is how we can monitor the connection for the time being
			public void onEvent() throws IOException {
				// we don't need to do anything, because Tomcat will notify on closed connections
			}
		});
	}*/

	@Override
	public Notification suspend(final EventStream eventStream,final HttpServletRequest request) throws IOException {
		if (request.getAttribute("org.persvr.tomcatcomet") == null) {
			return super.suspend(eventStream, request);
		}
		else {
			final String clientId = PersevereFilter.getParameter(request,"Client-Id"); // can only get the connection id on the first time through
			if (clientId == null) {
				throw new RuntimeException("You must include a Client-Id header");
			}
			final CometSerializer serializer = getCometSerializer(request);
			eventStream.addCallback(new EventStream.EventCallback() {
	
				public synchronized void onEvent()  throws IOException{
					final EventStream eventStream = (Client) request.getSession().getAttribute(clientId);

					
					
					Notification notification= eventStream.eventAvailable() ? eventStream.take(0) : null; 
					if (notification != null) { // we are resuming
						try {
							
							if (sendEvent(notification, eventStream, serializer)) {
								System.err.println("connection closed by server" + request);
								request.setAttribute("org.persvr.sent", true);
							}
						}
						catch (IOException e) {
							e.printStackTrace();
							eventStream.finished();
						}
					}
				}
				
			});
		}
		return null;
	}


}
