/**
 * 
 */
package org.persvr.remote;
 
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.EventListener;
import java.util.HashMap;
import java.util.HashSet;
import java.util.TreeSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.Persevere;
import org.persvr.data.GlobalData;
import org.persvr.data.Identification;
import org.persvr.data.JsonPath;
import org.persvr.data.ObjectId;
import org.persvr.data.ObjectPath;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableArray;
import org.persvr.data.QueryCollection;
import org.persvr.data.Transaction;
import org.persvr.datasource.DataSource;
import org.persvr.rpc.RPCMessage;
import org.persvr.rpc.RPCResponse;
import org.persvr.rpc.RPCall;
import org.persvr.security.UserSecurity;
import org.persvr.util.JSON;
import org.persvr.util.JsponEncoding;
/**
 * This class represents a client connection/session and which is used for caching purposes.
 * @author Kris Zyp
 *
 */
public class Client extends EventStream { 
	public static final boolean LOG_ALL_OUTPUT = false;
	
	Map<Long, Transaction> transactions= new HashMap<Long, Transaction>();
	
	public static void addSerializer(DataSerializer serializer) {
		serializers.add(0,serializer);
		defaultSerializer = serializer;
	}
	public synchronized void commitTransaction(Long transactionId){
		transactions.get(transactionId).commit();
	}
	public synchronized void setOpenTransaction(Long transactionId, Transaction transaction){
		transactions.put(transactionId, transaction);
	}
	
	public synchronized void clearOpenTransaction(Long transactionId){
		transactions.remove(transactionId);
		markTransactionProcessed(transactionId);
	}
	
	public synchronized void startOrEnterTransaction(Long sequenceId, Long transactionId){
		Transaction existingTransaction = transactions.get(transactionId);
		if(existingTransaction!=null){
			existingTransaction.enterTransaction(sequenceId);
		}else{
			transactions.put(transactionId, Transaction.startTransaction(sequenceId, transactionId));
		}
	}
	
	private Client(){
		// a no transaction connection for the server
	}
	public Client(String connectionId) {
		this.connectionId = connectionId;
	}

	public IndividualRequest getIndividualRequest(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
		return new IndividualRequest(httpRequest, httpResponse);
	} 
	public static long DELAY_REQUEST_THRESHOLD = 7000;
	public static long CONSIDERATION_THRESHOLD = 2 * DELAY_REQUEST_THRESHOLD; 
	public static long SEPARATE_REQUEST_THRESHOLD = 4000;
	public static final int STRING_TIME_WEIGHT = 2; // The higher this value the more restrictive about including long strings
	public static long HISTORIC_FACTOR = 5;
	public boolean authorizationVerified = false;
	static class PostResponse {
		public StringWriter writer = new StringWriter();
		public Map headers = new HashMap();
		boolean finished = false;
	}
	static Scriptable arrayPrototype = ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Array");
	static Scriptable objectPrototype = ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Object");
	static Scriptable functionPrototype = ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Function");
	public static class TimedRequest {

		long requestTime;
		String requestedObject;
		public TimedRequest(String requestedObject, long requestTime) {
			this.requestTime = requestTime;
			this.requestedObject = requestedObject;
		}
	}
	static DataSerializer defaultSerializer;
	DataSerializer connectionDefaultSerializer = defaultSerializer;
	private String authorization;
	public static class ObjectFetchRequest {
		Persistable object;
		List<String> fields;
		void addField(String field) {
			if (fields == null) 
				fields = new ArrayList<String>();
			fields.add(field);
		}
		@Override
		public int hashCode() {
			return object.hashCode();
		}
	}
	public interface RequestFinishListener extends EventListener {
		public void onFinish();
	}
	//TODO: This should be it's own class, not inner
	public class IndividualRequest implements DataSerializer.Request {
		List<String>[] accessLevels = new List[7];
        boolean includeToSourceString = false;
        boolean includeServerMethods = true;
        boolean possibleUnauthorizedGet = false;
        String requestedIndexId = null;
        HttpServletRequest httpRequest;
        HttpServletResponse httpResponse;
        // this indicates that the client initiated portion of the request has been made, any further calls can trigger notifications
        public boolean performedClientInitiatedCall = false;
		IndividualRequest(String locale) {
			this.locale = locale;
		}
		List<RequestFinishListener> listeners = new ArrayList();
		public void addFinishListener(RequestFinishListener listener){
			listeners.add(listener);
		}
		public void finish(){
			for (RequestFinishListener listener : listeners)
				listener.onFinish();
			threadClient.remove();
		}
		IndividualRequest(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
			this.httpResponse = httpResponse;
			if (httpRequest != null) {
				this.httpRequest = httpRequest;
				if (PersevereFilter.getParameter(httpRequest,"Include-ToString-Source") != null)
					includeToSourceString = "true".equals(PersevereFilter.getParameter(httpRequest,"Include-ToString-Source"));;
				if (PersevereFilter.getParameter(httpRequest,"Server-Methods") != null)
					includeServerMethods = "true".equals(PersevereFilter.getParameter(httpRequest,"Server-Methods"));
				String acceptType = PersevereFilter.getParameterFromQueryString(httpRequest,"Accept");
				if (acceptType == null) {
					acceptType = PersevereFilter.getHeader(httpRequest,"Accept");
				}

				for (DataSerializer possibleSerializer : serializers) {
					connectionDefaultSerializer = serializer = possibleSerializer;
					if (serializer.match(acceptType))
						break;
				}

			}
			
		}
		Object requestRoot;
		Set<Persistable> parentSet = new HashSet<Persistable>();
		String locale;
		public Client getConnection() {
			return Client.this;
		}
		public String idString(Identification id) {
			return id.toString(requestedSource,requestedSubPath);
		}
		
		public int[] getIndexRange(List obj){
			int startingIndex = 0;
			boolean sizeEstimated = obj instanceof QueryCollection;
			int endIndex;
			int size;
			String range;
			if (requestRoot == obj && 
				// do the HTTP range check 
						(range = PersevereFilter.getHeader(httpRequest,"Range")) != null && range.startsWith("items=")) {
				range = range.substring(6);
				String[] parts = range.split("-");
				startingIndex = "".equals(parts[0])?0:Integer.parseInt(parts[0]);
				if(parts.length == 1 || "Infinity".equals(parts[1])){
					endIndex = size = (sizeEstimated ? (int) ((QueryCollection)obj).estimatedSize(0) : obj.size());
				}
				else{
					endIndex = Integer.parseInt(parts[1])+1;	
				}
				
				endIndex = Math.min((size = sizeEstimated ? (int) ((QueryCollection)obj).estimatedSize(endIndex) : obj.size()), endIndex);
				httpResponse.setHeader("Content-Range", "items " + startingIndex+ "-" + (endIndex-1)+ "/" + size);
				httpResponse.setStatus(206);
				if (startingIndex > size)
					throw new RequestedRangeNotSatisfiable("The request start of the range " + startingIndex + " was beyond the number of items in this collection");
				if (startingIndex >= endIndex && startingIndex > 0)
					throw new RequestedRangeNotSatisfiable("The request start of the range " + startingIndex + " was greater than the end of the range " + (endIndex-1) );
			}
			else
				 endIndex = (sizeEstimated ? (int) ((QueryCollection)obj).estimatedSize(0) : obj.size()) + startingIndex;
			return new int[]{startingIndex,endIndex};
		}
		public void setRequestedPath(String requestedPath,Identification id) {
			int slashIndex = requestedPath.indexOf('/');
			if (slashIndex > -1) {
		        requestedSource = id.getSource();
		        requestedPath = requestedPath.substring(requestedSource.getId().length() +1);
		        int lastSlash = requestedPath.lastIndexOf('/');
		        if (lastSlash > -1){
					int bracketIndex = requestedPath.indexOf('[');
					if(bracketIndex == -1 || bracketIndex > lastSlash){

						requestedSubPath = requestedPath.substring(0,lastSlash+1);
			        }
				}
			}

		}
		DataSource requestedSource;
		String requestedSubPath;
		public Object requestData(String requestedPath, boolean put) {
			synchronized (Client.this) {
					long ifModifiedSince = 0;
					if (httpRequest != null) {
						String changesSinceString = PersevereFilter.getParameter(httpRequest,"changesSince");
						if (changesSinceString != null)
							ifModifiedSince = Long.parseLong(changesSinceString);
						locale = PersevereFilter.getHeader(httpRequest,"Accept-Language");
					}
					Persistable object = null; 
			        //Id requestedId = new Id(requestedObject); // removes the leading underscore
			        //requestedId.source = sourceURL;
					String field = null;
			        Object value = null; 
						Identification id = Identification.idForString(requestedPath);
						value = getClientSideObject(requestedPath);
						if(value != null){
							object = (Persistable) value;
						}
						else{
							if (id instanceof ObjectId || id instanceof JsonPath){
								if(id instanceof ObjectId){
									value = put ? ((ObjectId)id).getOrCreateTarget() : ((ObjectId)id).getTarget(); // We can't use getOrCreateTarget or else it would create objects on GETs
								}
								else {
									value = ((Identification<Object>)id).getTarget();
								}
								if (value instanceof Persistable){
									object = (Persistable)value;
								}
							}
							else {
								object = ((ObjectPath)id).getSecondToLastTarget();
								field = ((ObjectPath)id).getLastPath().toString();
								value = id.getTarget();
							}
						}
						setRequestedPath(requestedPath,id);
					

				if (value != null)
					return value;
				return object;
			}
		}
		
 


		/*public void sendDeclaration(Id instance, Id basis) {
			output("{id:\"" + instance + "\"}\n");
		}*/
		
		/* This writes out any objects that need updating.  This is to output a value in the JSON object */
		@Deprecated // TODO: remove this
		public String outputWaitingData() { 
			synchronized (clientObjectsChangeIdNeeded) {
				StringBuffer output = new StringBuffer();

				output.append("{data:");
				output.append(JsponEncoding.makeList(clientObjectsChangeIdNeeded.entrySet(), new JsponEncoding.ItemHandler() {
					public String handleItem(Object object) {
						Map.Entry<String,Persistable> clientObject = (Map.Entry<String,Persistable>) object; 
						Persistable obj = clientObject.getValue();
						shouldSerialize(obj);
						return "{aliasId:\"" + clientObject.getKey() + "\",id:\"" + obj.getId() +"\"}"; 
					}
				}));
				output.append("}");
				clientObjectsChangeIdNeeded.clear();
				return output.toString();
			}
		}
		DataSerializer serializer = connectionDefaultSerializer;
		public String serialize(Object value) {
			requestRoot = value;
			headers.put("Content-Type", serializer.getContentType());
			StringWriter writer = new StringWriter();
			serializer.serialize(value,this, writer);
			return writer.toString();
		}
		public void writeWaitingRPCs() {
			RPCMessage message = dispatchNextMessages();
			Object id = message.getId();
			Persistable result = Persevere.newObject();
			result.put("id", result, id);
			if (message instanceof RPCall) {
				result.put("object",result,((RPCall) message).getTarget());
				result.put("method",result,((RPCall) message).getFunctionName());
				result.put("params",result,new PersistableArray(((RPCall) message).getParameters()));
			}
			else if (message instanceof RPCResponse) {
				result.put("result",result,((RPCResponse) message).getResult());
				result.put("error",result,((RPCResponse) message).getError());
			}
			else
				throw new RuntimeException("Unknown RPC message: " + message);
			
			DataSerializer.serialize(result, getCurrentObjectResponse().getHttpRequest().getHeader("Accept"));
		}

	    public HttpSession getSession() {
	    	return httpSession;
	    }
	    public void sendMessage(RPCMessage message) {
	    	synchronized(this) {
		    	if (messages == null)
		    		messages = new ArrayList<RPCMessage>(1);
	    	}
    		messages.add(message);
	    }

	    public boolean shouldSerialize(Persistable obj) {
	    	ObjectId objId = obj.getId();
	    	if (objId.source == requestedSource || requestedSource == null || objId.subObjectId == null || objId.source == null || objId.hidden()){
		    	int level = obj.getAccessLevel();
		    	String id = idString(obj.getId());
		    	List<String> sameLevel =accessLevels[level]; 
		    	if (sameLevel == null)
		    		sameLevel = accessLevels[level] = new ArrayList<String>();
		    	sameLevel.add(id);
		    	return true;	    	
	    	}
	    	return false;
	    }
		Map getAccessLevels() {
			Map jsonAccessLevels = new HashMap();
			int mostCommonLevel = -1;
			int numberInMostCommon = 0;
			for (int i = 0; i < 7; i++ ) {
				List<String> sameLevel = accessLevels[i];
				if (sameLevel != null && sameLevel.size() > numberInMostCommon) {
					numberInMostCommon = sameLevel.size();
					mostCommonLevel = i;
				}
			}
			if (numberInMostCommon > 0)
				jsonAccessLevels.put("default", mostCommonLevel);
			
			for (int i = 0; i < 7; i++ ) 
				if (i != mostCommonLevel)
				{
					List<String> sameLevel = accessLevels[i];
					if (sameLevel != null) 
						for (String key : sameLevel)
							jsonAccessLevels.put(key, i);
				}
			
			return jsonAccessLevels;
		}
		public Map<String,String> headers = new HashMap<String,String>();
		public Map<String,String> getHeaders() {
			headers.put("username", UserSecurity.getUserName());
			//TODO: Only include this info for interested clients
			headers.put("Access-Level", JSON.serialize(getAccessLevels()));
			return headers;
		}
		public HttpServletRequest getHttpRequest() {
			return httpRequest;
		}
		public HttpServletResponse getHttpResponse() {
			return httpResponse;
		}
		public void setHttpResponse(HttpServletResponse httpResponse) {
			this.httpResponse = httpResponse;
		}
		public boolean getFeature(SerializerFeature feature) {
			if(feature==SerializerFeature.IncludeServerMethods)
				return includeServerMethods;
			if(feature==SerializerFeature.IncludeToStringSource)
				return includeToSourceString;
			return false;
		}

	}
	
	Map<String,Persistable> clientSideObjects; 
	Map<String,Persistable> clientObjectsChangeIdNeeded = new HashMap<String,Persistable>(0);
	public void changeClientSideObject(Persistable oldObject, Persistable newObject) {
		if(clientSideObjects != null)
			for (Entry<String,Persistable> entry : clientSideObjects.entrySet()) 
				if (entry.getValue() == oldObject)
					entry.setValue(newObject);
		
	}
	public void removeClientSideObject(String id) {
		if(clientSideObjects != null)
			clientSideObjects.remove(id);
	}
	public Persistable clientSideObject(String id,Persistable newObject) {
		synchronized (clientObjectsChangeIdNeeded) {
			if(clientSideObjects == null)
				clientSideObjects = new HashMap<String,Persistable>();
			Persistable value = clientSideObjects.get(id);
			if (value != null) {
				clientObjectsChangeIdNeeded.put(id,value);
				return value;
			}
			value = newObject;
			ObjectId.insertObjectForId(id,value);
			clientSideObjects.put(id,value);
			clientObjectsChangeIdNeeded.put(id,value);
			return value;			
		}
	}
	public Persistable getClientSideObject(String id) {
		synchronized (clientObjectsChangeIdNeeded) {
			if(clientSideObjects == null)
				return null;
			return clientSideObjects.get(id);
		}
	}
	
	
	/** This section is for the connection */
    HttpSession httpSession;
    //public String webappContextPath;
    
    /*public void setWebsiteIdentification(String path) {
        websiteIdentification = path;         
    }*/
    public void setSession(HttpSession session) { 
        this.httpSession = session;
    }
    public HttpSession getSession() {
    	return httpSession;
    }

	private TreeSet<Long> unprocessedSequenceIds = new TreeSet<Long>();
	private Long maxSequenceId = new Long(0);
	private Long maxTransactionId = new Long(0);
	
	public synchronized void addSequenceId(Long newSequenceId){
		if(maxSequenceId==0 || newSequenceId == maxSequenceId+1){
			maxSequenceId = newSequenceId;
		}else{
			unprocessedSequenceIds.add(newSequenceId);
		}
		while(unprocessedSequenceIds.contains(maxSequenceId+1)){
			unprocessedSequenceIds.remove(maxSequenceId+1);
			maxSequenceId++;
		}
		notifyAll();
	}
	
	public void runUnblockedTransactions(){
		List<Transaction> transactionsToCommit = new ArrayList<Transaction>();
		//copy the list
		for(Transaction t : transactions.values()){
			transactionsToCommit.add(t);
		}
		//try to commit everything in sequence
		for(Transaction t : transactionsToCommit){
//			if(t.canCommit()) System.out.println("Committing unblocked transaction: "+ t.getLabel());
			t.commitIfReady();
		}
	}
	
	public synchronized boolean isConsistentToSequenceId(Long sequenceId){
		return maxSequenceId >= sequenceId;
	}
	
	public synchronized boolean isConsistentToTransactionId(Long transactionId){
		return transactionId == maxTransactionId+1;
	}
	
	private synchronized void markTransactionProcessed(Long transactionId){
		if(transactionId != maxTransactionId+1){
			throw new RuntimeException("Trasaction processed out of order");
		}
		maxTransactionId = transactionId;
	}
	
	
    public static ThreadLocal<IndividualRequest> threadClient = new ThreadLocal<IndividualRequest>();
    static {
    	// we use the private no transaction constructor or it will trigger an unfinished transaction during startup
    	threadClient.set(new Client().getIndividualRequest(null,null));
    }
    /** This registers which website we are using for this particular user, which affects the users data and possibly the user table that is used */
    public static void registerThisConnection(IndividualRequest individualRequest) {
    	threadClient.set(individualRequest);
    }
    
   
    public static IndividualRequest getCurrentObjectResponse() { 
    	return threadClient.get();
    }
    List<RPCMessage> messages;

    
    private RPCMessage dispatchNextMessages() {
    	synchronized(this) {
	    	if (messages == null || messages.isEmpty())
	    		return null;
	    	return messages.remove(0);
    	}
    }
    /**
     * This allows a new thread to use an client connection, for the purposes of maintaining security, making RPCs, and so forth
     * @param thread
     */
    public void adoptThread(Thread thread) {
    	IndividualRequest request = new IndividualRequest((HttpServletRequest) null,null);
    	// the client initiated action was already performed by the parent thread, any future action was not client initiated 
    	request.performedClientInitiatedCall = true;
    	threadClient.set(request);
    	//TODO: Need to do something about the locale
    }
	public String getAuthorization() {
		return authorization;
	}
	public void setAuthorization(String authorization) {
		this.authorization = authorization;
	}

	public static List<DataSerializer> serializers = new ArrayList<DataSerializer>();
	public Object getAuthorizedUser() {
		return authorizedUser;
	}
	public void setAuthorizedUser(Object authorizedUser) {
		this.authorizedUser = authorizedUser;
	}

}