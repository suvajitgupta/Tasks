package org.persvr.remote;

import java.util.List;

import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

/**
 * Clean up for our connections
 * @author Kris
 *
 */
public class SessionListener implements HttpSessionListener {

	public void sessionCreated(HttpSessionEvent arg0) {
	}

	public void sessionDestroyed(HttpSessionEvent event) {
		List<Client> connections = (List<Client>) event.getSession().getAttribute(Client.class.toString());
		
		if (connections != null)
			for(Client connection : connections)
				if (connection.getSession() == event.getSession())
					connection.finished();
			
	}

}
