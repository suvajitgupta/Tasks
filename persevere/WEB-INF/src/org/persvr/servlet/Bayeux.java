package org.persvr.servlet;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.persvr.remote.Client;
import org.persvr.remote.RequestHelper;
import org.persvr.remote.EventStream.Notification;
import org.persvr.util.JSON;
/**
 * Bayeux implementation for Persevere
 * @author Kris
 *
 */
public class Bayeux extends Channels { // inherit some of the comet capabilities of Channels
	static Servlet jettyServlet;
	static {
		try {
			// test to see if the Jetty Bayeux implementation is available
			jettyServlet = new JettyBayeux();
		} catch (NoClassDefFoundError e) {
			
		}
	}
	@Override
	protected void service(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		final RequestHelper requestHelper = new RequestHelper((HttpServletRequest)request,(HttpServletResponse)response);
		if (jettyServlet != null) {
			// use the Jetty Bayeux implementation if available
			jettyServlet.service(request, response);
			return;
		}
		response.setContentType("application/json");
		Object json = JSON.parse(request.getParameter("message"));
			Client eventStream = null;
			if (json instanceof HashMap) {
				List array = new ArrayList();
				array.add(json);
				json = array;
			}
			List array = (List) json;
			boolean respondImmediately = false;
			for (int i = 0;i < array.size(); i++) {
				Map obj = (Map) array.get(i);
				String channel = (String) obj.get("channel");
				String clientId = (String) requestHelper.getRequest().getSession().getAttribute("clientId");
				if (clientId != null) {
					obj.put("clientId", clientId);
					eventStream = (Client) request.getSession().getAttribute(clientId);
				}
				obj.remove("ext");
				if (channel.startsWith("/meta")) {
					obj.put("successful", true);
					if (channel.equals("/meta/handshake")) {
						obj.put("authSuccessful", true);
						clientId = Math.random() + "";
						request.getSession().setAttribute(clientId,eventStream = new Client(clientId));
						eventStream.connectionId = clientId;
						requestHelper.getRequest().getSession().setAttribute("clientId", clientId);
						obj.put("clientId", clientId);
						Map advice = new HashMap();
						advice.put("reconnect", "retry");
						obj.put("advice", advice);
						List connectionTypes = new ArrayList();
						connectionTypes.add("rest-channels");
						obj.put("supportedConnectionTypes", connectionTypes);
						respondImmediately = true;
					}
					else if (channel.equals("/meta/connect")) {
						obj.put("error","");
						Map advice = new HashMap();
						advice.put("reconnect", "retry");
						obj.put("advice", advice);
					}
					else if (channel.equals("/meta/disconnect")) {
						respondImmediately = true;
					}
					else if (channel.equals("/meta/subscribe")) {
						//TODO: Need to implement this copying from PersevereFilter
					}
					else if (channel.equals("/meta/unsubscribe")) {
						//TODO: Need to implement this
					}
					else
						throw new RuntimeException("Unknown meta channel");
				}
				else {
					// publish event
					List target = (List) Client.getCurrentObjectResponse().requestData(channel, false);
					Object appendingItem = requestHelper.convertJsonStringToObject(obj.get("instances").toString());
					target.add(appendingItem);
				}
			}
			ServletOutputStream outStream = response.getOutputStream();
			if (respondImmediately) {
				outStream.print(JSON.serialize(array.toString()));
			}
			else {
				if (eventStream == null)
					throw new RuntimeException("No connection was found");
				Notification notification = suspend(eventStream,request); // implementation specific handling
				if (notification == null) // if the suspend returns null, the suspend will resume the operation 
					return;
				
				sendEvent(notification, eventStream, getCometSerializer(request));
			}
	}
	@Override
	public void init() throws ServletException {
		if (jettyServlet != null) {
			((JettyBayeux) jettyServlet).servletConfig = getServletConfig();
			try {
				// test to see if the Jetty Bayeux implementation is available
				((JettyBayeux)jettyServlet).init();
			} catch (NoClassDefFoundError e) {
				jettyServlet = null;
			}
			// use the Jetty Bayeux implementation if available
			return;
		}
	}

}
