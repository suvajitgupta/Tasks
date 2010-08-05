/*
 * Id.java
 *
 * Created on August 11, 2005, 9:54 PM
 *
 * To change this basis, choose Tools | Options and locate the basis under
 * the Source Creation and Management node. Right-click the basis and choose
 * Open. You can then make changes to the basis in the Source Editor.
 */

package org.persvr.data;


import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.datasource.DataSource;
import org.persvr.javascript.PersevereContextFactory;



/**
 *
 * @author Kris Zyp
 * This class represents a JSONPath/JSONQuery expression, and is used to 
 * evaluate the expression handling the query -> JS conversion and execution
 */
public class JsonPath extends Identification<Object> {
	@Override
	protected List resolveTarget() {
		throw new RuntimeException("getTarget should always be used for JsonPath");
	}
	//	public Stipulation stipulation;
//	public String constructionString;
	Object[] parameters;
	int param;
	String jsonPath;
	public static synchronized JsonPath idForObject(DataSource source, String subObjectId, String jsonPath) {
		JsonPath objId = new JsonPath();
		objId.source = source;
		objId.subObjectId= subObjectId;
		objId.jsonPath = jsonPath;
		String[] parts = objId.jsonPath.split("#");
		if (parts.length > 1) {
			boolean first = true;
			objId.jsonPath = "";
			int i = 0;
			for (String part : parts) {
				objId.jsonPath += (first ? "" : ("__param" + i++)) + part; 
				first = false;
			}
		}

		return objId;
	}
//	static Function jsonPathFunction = (Function) GlobalData.getGlobalScope().get("query", GlobalData.getGlobalScope());

	public static Object query(Persistable objectToQuery, String jsonPath, Object... parameters) {
		JsonPath query = new JsonPath();
		query.setParameters(parameters);
		query.jsonPath = jsonPath;
		query.source = objectToQuery.getId().source;
		query.subObjectId = objectToQuery.getId().subObjectId;
		//return PersistableImpl.mapPersistent(query);
		return query.getTarget();
	}
	
	@Override
	public Object getTarget() {
		return doJsonPath(jsonPath);
	}
	public boolean isDefinite() {
		return isDefinite(jsonPath);
	}
	static boolean isDefinite(String jsonPath) {
		return !jsonPath.replaceAll("\"[^\"\\\\\\n\r]*\"", "").matches(".*(\\.\\.|\\*|\\[[\\\\/]|\\?|,|:|>|\\(|<|=|\\+).*");
	}
	private Object doJsonPath(String jsonPath) {
		return doJsonPath(ObjectId.idForObject(source,subObjectId).getTarget(),jsonPath);
	}
	/**
	 * Executes the JSONQuery expression
	 * @param target
	 * @param jsonPath
	 * @return
	 */
	private Object doJsonPath(Persistable target, String jsonPath) {
		Scriptable paramScope = new NativeObject();
		if (jsonPath.matches("new "))
			throw new RuntimeException("Invalid query");
		if (jsonPath.matches("[^\\?\\+\\=\\-\\*\\/\\!]\\("))
			throw new RuntimeException("Invalid query");
		if (parameters != null) {
			int poundIndex; 
			while((poundIndex = jsonPath.indexOf('$', 1)) > -1) {
				int i = Integer.parseInt(jsonPath.substring(poundIndex + 1, poundIndex + 2)) - 1;
				jsonPath = jsonPath.substring(0,poundIndex) + "args.param" + i + jsonPath.substring(poundIndex + 2);  
				paramScope.put("param" + i, paramScope, parameters[i]);
			}
		}
		//TODO: Once we have more of the JSONQuery expressions being handled at the data source
		//	level, we should set the optimization level to -1 for quicker evaluation:
		PersevereContextFactory.getContext().setOptimizationLevel(-1);
		Object result;
		try{
			Method.safeMode.set(Boolean.TRUE);
			Persistable schema = target.getSchema();
			if(schema == null){
				schema = ObjectId.idForString("Class/Object").getTarget();
			}
			Scriptable global = GlobalData.getGlobalScope();
			
			Function queryFunction = (Function) ScriptableObject.getProperty(schema, "query");
			Function QueryString = (Function) global.get("QueryString", global);
			Scriptable queryString = QueryString.construct(PersevereContextFactory.getContext(), global, new Object[]{jsonPath, paramScope}); 
			if(queryFunction instanceof Method){
				queryFunction = ((Method)queryFunction).innerFunction;
			}
			result = queryFunction.call(PersevereContextFactory.getContext(), global, target, new Object[]{queryString, target});
		}finally{
			Method.safeMode.set(null);
		}
		if(result instanceof PersistableArray && !(((PersistableArray)result).id instanceof Query)){
			// FIXME: This is a temporary hack, so that the JSONSerializer thinks it is a query and serializes it with all the items being serialized
			((PersistableArray)result).id = new Query();
			((PersistableArray)result).id.source = source;
			((PersistableArray)result).id.subObjectId = subObjectId;
		}
		if(result instanceof QueryArray && !(((QueryArray)result).id instanceof Query)){
			// FIXME: This is a temporary hack, so that the JSONSerializer thinks it is a query and serializes it with all the items being serialized
			((QueryArray)result).id = new Query();
			((QueryArray)result).id.source = source;
			((QueryArray)result).id.subObjectId = subObjectId;
		}
		// Restore the optimization level
		PersevereContextFactory.getContext().setOptimizationLevel(9);
		//((NativeArray)result).setPrototype(ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Array"));
		return result; 

	}
	public class PropertyPair {
		Persistable target;
		Object key;
		PropertyPair(Persistable target, Object key) {
			super();
			this.target = target;
			this.key = key;
		}
		public Persistable getTarget() {
			return target;
		}
		public Object getKey() {
			return key;
		}
	}
	public class PropertyValuePair extends PropertyPair {

		public PropertyValuePair(Persistable target, Object key) {
			super(target, key);
			// TODO Auto-generated constructor stub
		}
	}
	public List<PropertyPair> getPropertyPairs() {
		int lastDot = jsonPath.lastIndexOf('.');
		int firstBracket = jsonPath.indexOf('[');
		String propertyPart;
		PersistableList<Persistable> firstLevel;
		if (firstBracket != -1 && (firstBracket < lastDot || lastDot == -1)) {
			firstLevel = (PersistableList) doJsonPath(jsonPath.substring(0,firstBracket));
			propertyPart = jsonPath.substring(firstBracket);
		}
		else if (lastDot == -1)
			throw new RuntimeException("No property was provided");
		else {
			firstLevel = (PersistableList) doJsonPath(jsonPath.substring(0,lastDot));
			propertyPart = jsonPath.substring(lastDot);
		}
		List<PropertyPair> pairs = new ArrayList();
		for (Persistable obj : firstLevel) {
			if (isDefinite(propertyPart))
				pairs.add(new PropertyPair(obj,propertyPart));
			else {
				PersistableList secondLevel = (PersistableList) doJsonPath(obj,"$" + propertyPart);
				for (Object value : secondLevel) 
					pairs.add(new PropertyValuePair(obj,value));
			}
		}
		return pairs;
	}
	private static String getResourceAsString(InputStream is) throws IOException {
		BufferedReader in = new BufferedReader(new InputStreamReader(is));
		StringBuffer buffer = new StringBuffer();
		String line;
		while ((line = in.readLine()) != null) {
			buffer.append(line);
			buffer.append("\n");
		}
		return buffer.toString();
	}

	public Object[] getParameters() {
		return parameters;
	}

	public void setParameters(Object[] parameters) {
		this.parameters = parameters;
	}

}
