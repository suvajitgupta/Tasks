package org.persvr.datasource;


import java.io.IOException;
import java.io.InputStream;
import java.util.AbstractList;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;

import org.apache.commons.httpclient.HttpException;
import org.apache.commons.httpclient.HttpMethod;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.httpclient.methods.PutMethod;
import org.apache.commons.io.IOUtils;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Undefined;
import org.persvr.data.DataSourceHelper;
import org.persvr.data.DataSourceManager;
import org.persvr.data.GlobalData;
import org.persvr.data.Identification;
import org.persvr.data.LazyPropertyId;
import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableArray;
import org.persvr.data.PersistableClass;
import org.persvr.data.PersistableObject;
import org.persvr.data.Query;
import org.persvr.data.QueryArray;
import org.persvr.data.TargetRetriever;
import org.persvr.data.Version;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.remote.Client;
import org.persvr.remote.JsponSender;
import org.persvr.remote.Client.IndividualRequest;
import org.persvr.util.JSON;
import org.persvr.util.JSONParser.JSONException;
public class HttpJsonSource extends AbstractJsonSource implements WritableDataSource, RemoteDataSource, ChangeableData {
	boolean trusted;
	@Override
	public boolean isTrusted() {
		return trusted;
	}
	public HttpJsonSource(){
		defaultCacheLength = 100;
	}
	Object queryPage(Scriptable xhr, String query) throws IOException {
		Object parsedJson = JSON.parse(getTextFromXhr(xhr));
		handleRemoteSchema(xhr, query);
		Object result = convertJsonToJavaScript(parsedJson, query);
		if(result instanceof TargetRetriever)
			result = ((TargetRetriever)result).getTarget();
		return result;
	}
	final static int PAGE_SIZE = 100;
	public Object query(String query) throws IOException {
		return query(query, true);
	}
	public Object query(final String query, boolean wrapQueries) throws IOException {
		final String targetUrl = computeUrl(query);
		Object result = null;
		Scriptable xhr = null;
		if(wrapQueries){
			xhr = makeRequest("GET", targetUrl, null, 0, PAGE_SIZE - 1);
			result = queryPage(xhr, query);
		}
		if((result instanceof List && ((List)result).size()==PAGE_SIZE) || !wrapQueries){
			List lazyResultList = new AbstractList<Object>(){
				Map<Long, List<Object>> pages = new WeakHashMap<Long, List<Object>>();
				Long lastPageIndex;
				long size = -1;
				List<Object> setPage(List<Object> result, long pageIndex, Scriptable xhr) {
					if(xhr != null){
						String contentRange = (String) ((Function)xhr.get("getResponseHeader", xhr)).call(PersevereContextFactory.getContext(),global, xhr, new Object[]{"Content-Range"});
						size = Long.parseLong(contentRange.substring(contentRange.indexOf('/') + 1));
						lastPageIndex = (long) pageIndex;
						pages.put(lastPageIndex, (List<Object>) result);
					}
					return this;
				}
				@Override
				public Object get(int index) {
					lastPageIndex = (long) index / PAGE_SIZE;
					List<Object> page = pages.get(lastPageIndex);
					if(page == null){
						try {
							Scriptable xhr = makeRequest("GET", targetUrl, null, lastPageIndex.intValue() * PAGE_SIZE, (int) lastPageIndex.intValue() * PAGE_SIZE + PAGE_SIZE - 1);
							List<Object> result = (List<Object>) queryPage(xhr, query);
							setPage(page = result, lastPageIndex, xhr);
						} catch (IOException e) {
							return e.getMessage();
						}
					}
					return page.get(index % PAGE_SIZE);
				}

				@Override
				public int size() {
					if(size == -1){
						// fetch something to trigger a request that provides the size
						get(0);
					}
					return (int) size;
				}
				
			}.setPage((List<Object>)result, 0, xhr);
			return wrapQueries ? new QueryArray(lazyResultList) : lazyResultList;
		}
		return result;
	}
	String computeUrl(String id){
		if (id.toLowerCase().startsWith("http:/") || id.toLowerCase().startsWith("https:/"))
			return id;
		return sourceUrl + id;
	}
	@Override
	protected void setJson(String resourceName, String json) throws Exception {
		String url = computeUrl(resourceName);
		//TODO: This needs to be able to handle RPCs
		Scriptable xhr = makeRequest("PUT", url, json, 0, 0);
		Object parsedJson = JSON.parse(getTextFromXhr(xhr));
		handleRemoteSchema(xhr, resourceName);

		convertJsonToJavaScript(parsedJson, resourceName);
	}
	protected void newJson(String json) throws Exception {
		//TODO: This needs to be able to handle RPCs
		Scriptable xhr = makeRequest("POST", sourceUrl, json, 0, 0);
		String response = getTextFromXhr(xhr);

		ObjectId objId = ObjectId.idForObject(this, sourceUrl);
		synchronized(objId){
			mapJson(DataSourceHelper.initializeObject(objId), JSON.parse(response), sourceUrl);
		}
	}
	protected Object mapJson(PersistableInitializer initializer, final Object object, final String objectId) {
		// the id might resolve differently after downloading a class
		ObjectId objId = ObjectId.idForObject(this, objectId);
		Identification newId = Identification.idForString(getId() + '/' + objectId);

		if(newId instanceof ObjectId && objId.source != newId.source){
			objId.source = newId.source;
			objId.subObjectId = newId.subObjectId;
			return ((HttpJsonSource)newId.source).mapJson(initializer, object, newId.subObjectId);
		}

		super.mapJson(initializer, object, objectId);
		return initializer.getInitializingObject();
	}
  	//TODO: need an individual connection for each host
  	IndividualRequest serverRequest = null;
  	//new ClientConnection("server request").getIndividualRequest(null); // Be careful about reintroducing this, it will start a transaction for the current thread which makes the whole thread act in this transaction, and not immediate
  	
	@Override
	protected Object getJson(String objectId) throws HttpException, IOException{
		String targetUrl = computeUrl(objectId);
		if (targetUrl.length() < 8)
			return new ArrayList();
		GetMethod method = new GetMethod(targetUrl);
		Scriptable xhr = makeRequest("GET", targetUrl, null, 0, 0);
		handleRemoteSchema(xhr, objectId);

		return JSON.parse(getTextFromXhr(xhr));
	}
	static long rpcId = 1;

	public Object executeRPC(ObjectId target, String methodName, Object[] args){
		// fire off a JSON-RPC request
	  	PostMethod method = new PostMethod(target.toString());
		Persistable request = new PersistableObject();
		request.put("id", request, rpcId++);
		
		request.put("method",request, methodName);
		request.put("params",request, new PersistableArray(args));
		Client.IndividualRequest clientRequest = new Client("server-request").getIndividualRequest(null, null);
		clientRequest.setRequestedPath(target.toString(), target);
		String jsonRpcMessage = clientRequest.serialize(request);
	  	method.setRequestBody(jsonRpcMessage);
	  	try {
			int statusCode = GlobalData.httpClient.executeMethod(method);
			Map<String, Object> response = (Map<String, Object>) JSON.parse(IOUtils.toString(method.getResponseBodyAsStream()));
			
			Object result = response.get("result");
			if(result == null || result == Undefined.instance) {
				Object error = response.get("error");
				if (error != null || error == Undefined.instance)
					throw new RuntimeException(error.toString());
				return result;
			}
			else {
				result = convertJsonToJavaScript(result, target.toString());
				if (result instanceof TargetRetriever)
					result = ((TargetRetriever)result).getTarget();
				return result;
			}
			
		} catch (Exception e) {
			throw ScriptRuntime.constructError("Error", e.getMessage());
		}
	}
	Map loadingSources = new HashMap();
	private void handleRemoteSchema(Scriptable xhr, String url){
		url = getId() + '/' + url;
		String tableUrl = url.substring(0, url.lastIndexOf('/'));

		String contentType = (String) ((Function)xhr.get("getResponseHeader", xhr)).call(PersevereContextFactory.getContext(),global, xhr, new Object[]{"Content-Type"});
		String schemaUrl = null;
		if(contentType != null){
			String[] contentTypeParts = contentType.split(";\\s*");
			contentType = contentTypeParts[0];
			for(String part : contentTypeParts){
				if(part.startsWith("schema")){
					schemaUrl = part.split("=")[1];
				}
			}
		}
		if(schemaUrl != null) {
			if(DataSourceManager.getSource(tableUrl) == null && loadingSources.get(tableUrl) == null){
				loadingSources.put(tableUrl, true);
				Persistable schemaForData = (Persistable) Identification.idForRelativeString(url, schemaUrl).getTarget();
				// use a transaction to make the class not really run
				PersistableClass classForData = new PersistableClass();
				classForData.persist = false;  
				for(Map.Entry<String,Object> entry : schemaForData.entrySet(0)){
					classForData.put(entry.getKey(), classForData, entry.getValue());
				}
				try {
					Map config = new HashMap();
					config.put("name", tableUrl);
					config.put("sourceClass", getClass().getName());
					config.put("hidden", true);
					DataSourceManager.initSource(config,null, classForData, "");
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		}

	}
	static Scriptable global = GlobalData.getGlobalScope();
	private String getTextFromXhr(Scriptable xhr){
		int statusCode = (Integer) xhr.get("status", xhr);
		if (statusCode >= 300) 
			return "{error: " + statusCode+"}";
		return (String) xhr.get("responseText", xhr);
		
	}
	/**
	 * Make a HTTP request to the server, this can be a GET or a POST. This does RPC handling associated with requests 
	 * @param method
	 * @return
	 * @throws HttpException
	 * @throws IOException
	 * @throws JSONException
	 */
	private Scriptable makeRequest(String method, String url, String body, long start, long end) throws HttpException, IOException {
		//client.setConnectionTimeout(1);
		//Client.registerThisConnection(serverRequest);
		
		Context cx = PersevereContextFactory.getContext();
		return (Scriptable) ((Function) global.get("remoteRequest", global)).
				call(cx, global, global, new Object[]{method, url, body, start, end});
	}
	String sourceUrl;
	public void initParameters(Map<String,Object> parameters) {
		if(Boolean.TRUE.equals(parameters.get("trusted"))){
			trusted = true;
		}
		this.sourceUrl = (String) parameters.get("sourceUrl");
		if(this.sourceUrl == null)
			this.sourceUrl = getId();
		if(!this.sourceUrl.endsWith("/"))
			this.sourceUrl += '/';
		
	}
	public Object getFieldValue(LazyPropertyId valueId) throws Exception {
		return convertJsonToJavaScript(getJson(valueId.toString()),valueId.toString());		
	}
	ThreadLocal<String> currentUrl;
	String JSPON_URL_TOKEN = "/jspon/";
	@Override
	public ObjectId idFromJSPONObject(Map object, ObjectId defaultId, boolean mustMatchId)  {
		
    	try {
			ObjectId targetId;
			String key;
			String sourceUrl = currentUrl.get();
			Date changesSince=null;
			if (object.containsKey("id")) {
				targetId = ObjectId.idForString(sourceUrl + object.remove("id")); // TODO: Just get the string and do the initialization in array or method
			}
			else
				targetId = null;
			synchronized(targetId){
				PersistableInitializer initializer = DataSourceHelper.initializeObject(targetId);
				for (Map.Entry<String,Object> entry : ((Map<String,Object>)object).entrySet()) {
					key = entry.getKey();  // TODO: This needs to be limited to alteration lists, so we don't get a conflict with fields that start with c$.  This may need to be identified on the client side
					Object value = entry.getValue();
					if (key.startsWith("client/")) // This is a client id alteration which needs be changed a 
					{
						key = Client.getCurrentObjectResponse().getConnection().clientSideObject(key,createInitialObject(object)).getId().toString();
					}
	/*    		if ("update".equals(key)) {
						//if ("delete".equals(value))
							//return ERASURE_ENTITY;
						if (value instanceof Map)
							updateList((PersistableList) targetId.getTarget(),(Map) value);
					}
					else {*/
						value = idOrValueFromJSON(value, null);
						if (value == NOT_READY_FIELD)
							value = new LazyPropertyId(targetId,key);
	/*	    		if (key.equals(FUNCTION_CODE_KEY)) {
							value = functionCompression((String) value);
							}
	*/	    		if ("array".equals(key)) {
						}
						else if (targetId != null) {
							try {
			    				initializer.setProperty(key, value);
				    			
							}
							catch (Exception e) {
								e.printStackTrace();
							}
						}
					//}
				}
/*				Map accessLevels = (Map) getThreadValue(ACCESS_LEVEL_MAP_KEY);
				if (accessLevels != null) {
					//Object accessObject = accessLevels.opt(targetId.toString().substring(sourceUrl.length()));
					//if (accessObject == null)
						//accessObject = accessLevels.opt("default");
					//Logger.getLogger(HttpJsponSource.class.toString()).info("client access " + accessObject);
	//    		initializer.setAcl();
				}*/
				initializer.finished();
			}
/*		if (parentValue != null) // we will do it at the end so that if it is an append list entry it can be done without security problems
				target.set(GlobalData.PARENT_FIELD, parentValue);*/
			return targetId;
		} catch (NumberFormatException e) {
			throw new RuntimeException(e);
		} catch (JSONException e) {
			throw new RuntimeException(e);
		}
	}
	class JsponNewObjectPersister implements NewObjectPersister {
		public ObjectId getParent() {
			return null;
		}
		public boolean reloadFromSource() {
			return false;
		}
		public Object getAcl() {
			return null;
		}

		ObjectId id;
		Map object;
		JsponNewObjectPersister(ObjectId id,Map object) {
			this.id = id;
			this.object = object;
		}
		public void finished() throws Exception {
		}

		public String getObjectId() {
			return id.getSubObjectId();
		}

		public WritableDataSource getSource() {
			return (WritableDataSource) id.getSource();
		}
		
		public boolean isHiddenId() {
			return true;
		}
		public void initializeAsFunction(String functionBody) throws Exception {
			object.put("function", functionBody);
		}

		public void initializeAsList(List values) throws Exception {
			List array = new ArrayList();
			object.put("array",array);
			for (Object value : values)
				array.add(recordValueAsJSON(value));
		}

		public void recordProperty(String name, Object value) throws Exception {
			object.put(name, recordValueAsJSON(value));
		}

		public void start() throws Exception {
		}
		
	}
	Object recordValueAsJSON(Object value) throws Exception {
		if (value instanceof ObjectId) {
			Map valueJSON = new HashMap();
        	((ObjectId)value).persistIfNeeded(new JsponNewObjectPersister(((ObjectId)value),valueJSON));
        	valueJSON.put("id", ((ObjectId)value).getSubObjectId());
        	return valueJSON;
		}
		if (value instanceof Date) {
			value = "\"@" + ((Date) value).getTime() + "@\"";
		}
		return value;
	}
	Map setupTransferObject(String objectId) {
		Map putObject = new HashMap();
		putObject.put("id",objectId);
		Map updateObject = new HashMap();
		updateObject.put("changesSince", JsponSender.objectToString(new Date()));
		putObject.put("update",updateObject);
		return putObject;
	}
	public void recordDelete(String objectId) throws Exception {
		
	}
	class ListInitializerAdapter implements PersistableInitializer{
		public void setVersion(Version version) {
			throw new UnsupportedOperationException("Not implemented yet");
		}
		public void setLastModified(Date lastModified) {
		}

		Collection list;
		public void finished() {
		}

		public Persistable getInitializingObject() {
			return null;
		}

		public void initializeList(Collection list) {
			this.list = list;
		}

		public void setParent(ObjectId objectToInheritFrom) {
		}

		public void setProperty(String name, Object value, int attributes) {
		}

		public void setProperty(String name, Object value) {
		}
		
	}
	public Collection<Object> query(Query query) throws Exception {
		if(("http:".equals(getId()) || "https:".equals(getId())) && query.subObjectId.length() == 0)
			return new ArrayList();
		Object results = query(query.subObjectId, false);
		if(!(results instanceof Collection))
			throw new RuntimeException("Queries must return arrays");
		return (Collection<Object>) results; 
		
	}
	public static String slurp(InputStream in) throws IOException {
		StringBuffer out = new StringBuffer();
		byte[] b = new byte[4096];
		for (int n; (n = in.read(b)) != -1;) {
			out.append(new String(b, 0, n));
		}
		return out.toString();
	}
	public boolean doesObjectNeedUpdating(String id) {
		return true;
	}

}
