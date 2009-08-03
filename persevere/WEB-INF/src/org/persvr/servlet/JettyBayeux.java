package org.persvr.servlet;

import java.io.IOException;
import java.util.List;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;

import org.mortbay.cometd.AbstractBayeux;
import org.mortbay.cometd.BayeuxService;
import org.mortbay.cometd.ChannelId;
import org.mortbay.cometd.ClientImpl;
import org.mortbay.cometd.Transport;
import org.mortbay.cometd.continuation.ContinuationBayeux;
import org.mortbay.cometd.continuation.ContinuationCometdServlet;
import org.mortbay.util.ajax.JSON;
import org.mozilla.javascript.Function;
import org.persvr.data.GlobalData;
import org.persvr.data.Identification;
import org.persvr.data.ObservablePersistable;
import org.persvr.data.ObservedCall;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableObject;
import org.persvr.data.PropertyChangeSetListener;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.remote.Client;
import org.persvr.remote.Client.IndividualRequest;

import org.cometd.Bayeux;
import org.cometd.Channel;
import org.cometd.Message;
/**
 * Persevere utilization of Jetty's Bayeux implementation
 * @author Kris
 *
 */
public class JettyBayeux extends ContinuationCometdServlet {
	ServletConfig servletConfig;
	/**
	 * Our implementation of Jetty's Bayuex
	 * @author Kris
	 *
	 */
	static class RestChannelsBayeux extends ContinuationBayeux {
		RestChannelsBayeux(){
			super();
		    _transports=new JSON.Literal("[\"rest-channels\",\""+Bayeux.TRANSPORT_LONG_POLL+ "\",\""+Bayeux.TRANSPORT_CALLBACK_POLL+"\"]");
		}
		/**
		 * Appends a * on channel names that end with a slash
		 */
	    @Override
		public ChannelId getChannelId(String id) {
	    	return super.getChannelId(id.endsWith("/") ? id + "*" : id);
		}

		/**
		 * Appends a * on channel names that end with a slash
		 */
	    @Override
		public Channel getChannel(String id, boolean create)
	    {
	    	return super.getChannel(id.endsWith("/") ? id + "*" : id,create);
	    }
	    /**
	     * Publishes an event
	     * @param channel
	     * @param data
	     * @throws IOException
	     */
	    public void internalPublish(String channel, Object data) throws IOException {
	    	super.doPublish(getChannelId(channel), null, data, null);
	    }
	    /**
	     * Intercepts all messages sent from the client
	     */
		@Override
		public String handle(ClientImpl client, Transport transport, Message message) throws IOException {
			if (!message.getChannel().startsWith("/meta")){
				// These are published messages
				Persistable target = (Persistable) Identification.idForString((String) message.getChannel()).getTarget();
				Function messageFunc = (Function) target.get("message");
				messageFunc.call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), target, new Object[]{message.getData()});
				// don't actually publish it, let Persevere handle it
				return null;
			}
			if (message.getChannel().startsWith("/meta/subscribe")){
				// A subscription request, we just need to make sure the global listener
				//	object is subscribed to the given resource
				String id = (String) message.get("subscription");
				while (id.endsWith("*")){
					id = id.substring(0, id.length() - 1);
				}
				Object target = Identification.idForString(id).getTarget();
				if (target instanceof ObservablePersistable)
					((ObservablePersistable) target).subscribe();
				PersistableObject.addListener(jettyBayeuxRestListener);
			} 
			return super.handle(client, transport, message);
		}
		
	}
	/**
	 * Get our impl
	 */
	@Override
	protected AbstractBayeux newBayeux() {
		return new RestChannelsBayeux();
	}
	/**
	 * Initialize the Bayeux server
	 */
	@Override
	public void init() throws ServletException {
		super.init();
		AbstractBayeux bayeux=(AbstractBayeux)getServletContext().getAttribute(Bayeux.DOJOX_COMETD_BAYEUX);
		new PersevereService(bayeux);
	}
	/**
	 * Listen for events that go through the message handler
	 * @author Kris
	 *
	 */
	public static class RestListener implements PropertyChangeSetListener {

		public void propertyChange(List<ObservedCall> evt) {
			for(ObservedCall call : evt){
				if ("MESSAGE".equalsIgnoreCase(call.getMethod())){
					try {
			    		IndividualRequest request = new Client(null).getIndividualRequest(null, null);
						((RestChannelsBayeux)bayeux).internalPublish("/" + call.getSourceId(), new JSON.Literal(request.serialize(call.getContent())));
					} catch (IOException e) {
						throw new RuntimeException(e);
					}
				}
			}
		}
		
	}
	static RestListener jettyBayeuxRestListener = new RestListener();
	static Bayeux bayeux;
	/**
	 * Initialize and save a reference to Bayeux
	 *
	 */
	public static class PersevereService extends BayeuxService {
		
		public PersevereService(Bayeux bayeuxArg) {
			super(bayeuxArg, "persevere");
			bayeux = bayeuxArg;
		}
	}
	@Override
	public ServletConfig getServletConfig() {
		return servletConfig;
	}
}