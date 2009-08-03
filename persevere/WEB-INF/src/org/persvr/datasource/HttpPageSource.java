package org.persvr.datasource;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

import org.apache.commons.httpclient.Header;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.HttpMethod;
import org.apache.commons.httpclient.MultiThreadedHttpConnectionManager;
import org.apache.commons.httpclient.methods.GetMethod;
import org.persvr.data.DataSourceHelper;
import org.persvr.data.LazyPropertyId;
import org.persvr.data.Query;

public class HttpPageSource implements DataSource {
	public boolean hiddenId(String id) {
		return true;
	}

	String id;
	static HttpPageSource instance;
	MultiThreadedHttpConnectionManager connectionManager = 
  		new MultiThreadedHttpConnectionManager();
  	HttpClient client = new HttpClient(connectionManager);	  	
	public Object getFieldValue(LazyPropertyId valueId) throws Exception {
		throw new UnsupportedOperationException();
	}
	public HttpPageSource() {
		instance = this;
	}

	public void initParameters(Map<String,Object> parameters) throws Exception {
	}

	public void mapObject(PersistableInitializer initializer, String objectId) throws Exception {
	  	HttpMethod method = new GetMethod(objectId);
		int statusCode = client.executeMethod(method);
		PersistableInitializer headerInitializer = DataSourceHelper.initializeObject();
		
		for (Header header : method.getResponseHeaders()) {
			headerInitializer.setProperty(header.getName(), header.getValue());
		}
		initializer.setProperty("headers", headerInitializer.getInitializingObject());
		headerInitializer.finished();
		initializer.setProperty("url",objectId);
		initializer.setProperty("body", new String(method.getResponseBody()));
		initializer.finished();
	}


	public String getId() {
		return id;
	}


	public void setId(String id) {
		this.id = id;
	}

	public Collection<Object> query(Query query) throws Exception {
		return new ArrayList();
	}

}
