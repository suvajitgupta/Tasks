package org.persvr.remote;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.mozilla.javascript.CompilerEnvirons;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Undefined;
import org.persvr.Persevere;
import org.persvr.data.FunctionUtils;
import org.persvr.data.Identification;
import org.persvr.data.ObjectId;
import org.persvr.data.ObjectNotFoundId;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableList;
import org.persvr.data.PersistableObject;
import org.persvr.rpc.RPCall;
import org.persvr.security.PermissionLevel;
import org.persvr.security.SystemPermission;
import org.persvr.security.UserSecurity;
import org.persvr.util.JSON;
import org.persvr.util.JSONParser.JSONException;

public class JsonReceiver {
	static Pattern DATE_MATCHER = Pattern.compile("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$");
	static SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd HH:mm:ssZ");
	protected String path = "";
	private static CompilerEnvirons compilerEnvirons = new CompilerEnvirons();
	public Object parseJsponString(String jsponString) {
		if (jsponString == null || jsponString.length() == 0)
			return Undefined.instance;
		return JSON.parse(jsponString);
		/*
		
		compilerEnvirons.setGeneratingSource(true);
		Parser p = new Parser(compilerEnvirons, compilerEnvirons.getErrorReporter());
        ScriptOrFnNode tree;
        //p.enableFunctionSourceTracking();
        jsponString = "(\"hi\")3";
        tree = p.parse(jsponString, "json", 0);
        String encodedSource = p.getEncodedSource();
        return parseNode(tree.getFirstChild().getFirstChild(),tree,jsponString);*/
		
	}
	/*protected Object parseNode(Node node,ScriptOrFnNode tree, String sourceString) {
		switch (node.getType()) {
			case Token.ARRAYLIT : 
				node = node.getFirstChild();
	        	List list = new ArrayList();
		    	while(node != null) {
		    		list.add(parseNode(node,tree,sourceString));
		    		node = node.getNext();
		    	}
		    	return list;
			case Token.OBJECTLIT :
				int i = 0;
				Object[] keys = (Object[]) node.getProp(Node.OBJECT_IDS_PROP);
				node = node.getFirstChild();
	        	Map map = new HashMap();
		    	while (node != null) {
		        	map.put(keys[i++], parseNode(node,tree,sourceString));
		        	node = node.getNext();
		    	}
		    	return map;
			case Token.STRING : 
	        	return node.getString();
			case Token.NUMBER : 
	        	return node.getDouble();
			case Token.TRUE : 
	        	return true;
			case Token.FALSE :
				return false;
			case Token.NULL :
	        	return null;
			case Token.FUNCTION:
				SourceTrackingFunctionNode funcNode = (SourceTrackingFunctionNode) tree.getFunctionNode(node.getIntProp(Node.FUNCTION_PROP, -1));
				String functionSource = sourceString.substring(funcNode.getSourceStart(),funcNode.getSourceEnd());
	        	return PersistableImpl.createFunction(functionSource,"new function",UserSecurity.currentUser().hasPermission(SystemPermission.javaScriptCoding));
			default :
				throw new RuntimeException("Unknown node type found in JSON expression " + node.getType()); 
		}
        
	}*/
	/**
	 * Converts a string json representation of a value or object into an object 
	 * @param jsponString
	 * @return
	 */
	public Object convertJsonStringToObject(String jsponString) {
		return convertParsedToObject(parseJsponString(jsponString));
	}
	protected Object convertParsedToObject(Object value) {
		if (value instanceof List)
			return listFromJSPONArray((List) value,null);
		if (value instanceof Map)
			return convertIdIfNeeded(idFromJSPONObject((Map) value, null, false));
		if (value instanceof String && DATE_MATCHER.matcher((String)value).matches())
			try {
				value = DataSerializer.ISO_SDF.parse(((String) value));
			} catch (ParseException e) {
				System.err.println("date error: " + e.getMessage());					
			}
		return value;
	}
	protected List listFromJSPONArray(List array, ObjectId targetId) {
		List list = null;
		if (targetId != null) {
			Object target = targetId.getTarget();
			if (target instanceof List) {
				list = (List) target;
				list.clear();
			}
		}
		if (list == null)
			list = Persevere.newArray(); 
    	for (int i = 0; i < array.size();i++) {
    		try {
				Object value = array.get(i);
				if (value instanceof Map) {
					value = convertIdIfNeeded(idFromJSPONObject((Map) value, null, false));
				}
				else if (value instanceof List) {
					value = listFromJSPONArray((List)value, null);		        			
				}
				list.add(value);
			} catch (JSONException e) {
				throw new RuntimeException(e);
			}
    	}
    	return list;
	} 
	public static final String FUNCTION_CODE_KEY = "function";
	static String functionCompression(String code) {
		//code = code.replaceAll("\\([\\w\\s,]*\\)\\{var njf(\\d+)=_frm\\(this,arguments([,\"\\w+\"]*)\\);nj:while\\(1\\)\\{switch\\(njf(\\d+).cp\\)\\{case 0:", "\u00ea$1$2\u00eb");
		//code = code.replaceAll("njf(\\d+).cp=(\\d+);case (\\d+):if\\(\\(njf(\\d+).rv(\\d+)=", "\u00ea$1,$2\u00ec");
		//code = code.replaceAll("\\)==NJSUS\\)\\{return njf(\\d+)\\(\\);\\}", "\u00ea$1\u00ed");

		code = code.replaceAll("\\([\\w|\\s|,]*\\)\\{with\\(_frm\\(this,arguments,([,\\[\\]\\\"\\w+\"]*)\\)\\)\\{nj:while\\(1\\)\\{switch\\(\\_cp\\)\\{case 0:", "\u00ea$1\u00eb");
		code = code.replaceAll("\\_cp=(\\d+);case (\\d+):if\\(\\(\\_r.v(\\d+)=", "\u00ea$1\u00ec");
		code = code.replaceAll("\\)==NJSUS\\)\\{return \\_S\\(\\);\\}", "\u00ea\u00ed");
		code = code.replaceAll("return;case -1:return _s()\\}\\}\\}\\}", "\u00ea\u00ee");
		//code = code.replaceAll("njf(\\d+)._", "\\xEC\\1");
		return code;
	}
	static interface ListUpdater{
		void update(Object object);
	}
	/*static void doListUpdate(Map updateObject, String command, ListUpdater updater)  {
		if (updateObject.has(command)) {
			List array = (List) updateObject.get(command);
	    	for (Object value : array) {
	    		updater.update(value);
	    	}
		}
		
	}
	protected void updateList(final Persistable listToUpdate,Map updateObject)  {
	   		doListUpdate(updateObject,"append", new ListUpdater() {
	   			public void update(Object object) {
	   				Object obj = convertIdIfNeeded(idOrValueFromJSON(object));
	   				if (listToUpdate instanceof List)
	   					((List) listToUpdate).add(obj);
	   				else {
		   				Context cx = PersevereContextFactory.getContext();
		   		        int length = ScriptRuntime.toInt32(ScriptRuntime.getObjectProp(listToUpdate, "length", cx));
		   		        ScriptRuntime.setObjectIndex(listToUpdate, length, obj, cx);
		   		        ScriptRuntime.setObjectProp(listToUpdate, "length", ScriptRuntime.wrapNumber(length+1), cx);
	   				}
	   			}
	   		});
	   		doListUpdate(updateObject,"delete", new ListUpdater() {
	   			public void update(Object object) {
	   				Object obj = convertIdIfNeeded(idOrValueFromJSON(object));
	   				if (listToUpdate instanceof List)
	   					((List) listToUpdate).remove(obj);
	   				else {
	   					int length = ScriptRuntime.toInt32(ScriptRuntime.getObjectProp(listToUpdate, "length", PersevereContextFactory.getContext()));
	   					for (int i = 0; i < length; i++)
	   						if (listToUpdate.get(i,listToUpdate) == obj) {
	   							NativeArray.splice(listToUpdate,new Object[]{i,1});
	   							break;
	   						}
	   				}
	   			}
	   		});
	   		doListUpdate(updateObject,"replace", new ListUpdater() {
	   			public void update(Object object) {
	   				Object old = idOrValueFromJSON(((Map)object).get("old"));
	   				Object newObj = idOrValueFromJSON(((Map)object).get("new"));
	   				if (listToUpdate instanceof List) {
	   					int index = ((List)listToUpdate).indexOf(old);
	   					((List)listToUpdate).set(index,newObj);
	   				}
	   				else {
	   					int length = ScriptRuntime.toInt32(ScriptRuntime.getObjectProp(listToUpdate, "length", PersevereContextFactory.getContext()));
	   					for (int i = 0; i < length; i++)
	   						if (listToUpdate.get(i,listToUpdate) == old) 
	   							NativeArray.splice(listToUpdate,new Object[]{i,1,newObj});
	   						
	   				}
	   					
	   			}
	   		});
	   		doListUpdate(updateObject,"splice", new ListUpdater() {
	   			public void update(Object obj) {
	   				Map object = (Map) obj;
	   				List values = null;
	   				if (object.containsKey("values")) 
	   					values = (List) object.get("values");
	   				Object args[] = new Object[values == null ? 2 : values.size() + 2];
	   				args[0] = object.get("index");
	   				args[1] = object.get("howMany");
	   				if (values != null)
   			    	for (int i =0; i < values.size(); i++) 
   			    		args[i+2]=convertIdIfNeeded(idOrValueFromJSON(values.get(i)));
	   				NativeArray.splice(listToUpdate,args);
	   			}
	   		});
	}*/
	protected Persistable createInitialObject(Map object) throws JSONException{
		return Persevere.newObject();
	}
	protected void replaceList(final PersistableList listToUpdate, List changes) throws JSONException{
    	int i = 0;
    	boolean rebuild = false;
    	for (; i < changes.size();i++) {
    		Object change = changes.get(i);
	    	if (listToUpdate.size() > i) { // make sure we are still matching
				if	(!listToUpdate.get(i).equals(change)) {
					rebuild = true;
					break;
				}
			}
			else
				listToUpdate.add(change);
		}
		if (listToUpdate.size() != i)
			rebuild = true;
		System.err.println("rebuild: " + rebuild);
		if (rebuild) { 
			listToUpdate.clear();
	    	for (i = 0; i < changes.size();i++) {
	    		Object change = changes.get(i);
				listToUpdate.add(change);
	    	}
		}
	}
	public static class UpdateInfo extends NativeObject {
		Map updateObject;
		public UpdateInfo() {
		}
		public UpdateInfo(Map updateObject) {
			this.updateObject = updateObject;
		}
	}
	static protected Object NOT_READY_FIELD = new Object();
	protected Object idOrValueFromJSON(Object value, ObjectId defaultId) throws JSONException{
		if (value instanceof Map) {
			return idFromJSPONObject((Map) value, defaultId, false);
		}
		else if (value instanceof List) {
			return listFromJSPONArray((List)value, defaultId);
		}
		else if (value instanceof String) {
			if (DATE_MATCHER.matcher((String)value).matches())
				try {
					return SDF.parse(((String) value).replace('T', ' ').replace('Z', ' ') + "-0000");
				} catch (ParseException e) {
					System.err.println("date error: " + e.getMessage());					
				}
		}
		else if (value instanceof JSONFunction) {
			boolean authorizedForFullScripting = UserSecurity.hasPermission(SystemPermission.javaScriptCoding);
			if (!authorizedForFullScripting)
				throw new RuntimeException("You do not have sufficient priviledge to create functions, and untrusted scripts are not implementd yet");

			return FunctionUtils.createFunction(((JSONFunction)value).toString(),"new function");			
		}
		return value;
	}
	static Object convertIdIfNeeded(Object value) {
		if (value instanceof Identification)
			return ((Identification<? extends Object>)value).getTarget();
		return value;
	}
	public void handleRPC(Object targetObject,  Map rpcObject) {
		Persistable target = (targetObject instanceof ObjectId) ? ((ObjectId)targetObject).getTarget() : (Persistable)targetObject;
		List params = (List) rpcObject.get("params");
		Object[] paramValues;
		if (params == null) {
			paramValues = new Object[0];
		}
		else {
			paramValues = new Object[params.size()];
        	for (int j =0; j < params.size(); j++) {
        		paramValues[j] = convertIdIfNeeded(idOrValueFromJSON(params.get(j),null));
        	}
		}			        				
		String method = (String)rpcObject.get("method");
		RPCall rpCall = new RPCall(target,method,paramValues,rpcObject.get("id")); 
		rpCall.executeLocally(); // responses will be added the current connection

	}
	public Identification<? extends Object> idFromJSPONObject(Map<String,Object> object, ObjectId targetId, boolean mustMatchId)  {
		//TODO: This needs be rearranged so that when you do a put (specifically an alteration), that we use the object 
		// returned by the put instead of what the id indicates, because it is possible for a aliasId to indicate that we 
		// should use a new object, when really we should use an existing object (from the childMods list)
    	Persistable target;
		try {
			String key;
			target = null;
			Date changesSince=null;
			if (object.containsKey("update") && ((Map) object.get("update")).containsKey("changesSince")) {
				String value = (String) ((Map) object.get("update")).get("changesSince");
				changesSince = new Date(Long.parseLong(value.substring(1,value.length()-1))); // handle dates			
			}
			if (object.containsKey("$ref")) {
				
				return Identification.idForRelativeString(path, (String) object.get("$ref"));
			}
			if (object.containsKey("id")) {
				Identification currentId = Identification.idForRelativeString(path, object.remove("id").toString());

				if (currentId.source instanceof ClientData) // TODO: Surely we can do this more consistently
					target = Client.getCurrentObjectResponse().getConnection().clientSideObject(currentId.toString(),createInitialObject(object));
				else {
					if (currentId instanceof ObjectId){
						if(mustMatchId){
							if(targetId != currentId){
								throw new RuntimeException("id does not match location");
							}
						}
						else {
							targetId = (ObjectId) currentId;
						}
						
					}
					else {
						target = (Persistable) currentId.getTarget();
						if(mustMatchId && target.getId() != targetId){
							throw new RuntimeException("id does not match location");
						}
					}
				}
			}
			if (targetId == null) {
				if (target == null)
					target = createInitialObject(object);
			}
			else {
				target= targetId.getOrCreateTarget();
			}
			PersistableObject.checkSecurity(target, PermissionLevel.WRITE_LEVEL.level);

			for (Map.Entry<String,Object> oldEntry : target.entrySet(0)) {
				String oldKey = oldEntry.getKey();
				if (!object.containsKey(oldKey) && !oldKey.equals("parent"))
					target.delete(oldKey);
			}
			for (Map.Entry<String,Object> entry : object.entrySet()) {
				key = entry.getKey();  // TODO: This needs to be limited to alteration lists, so we don't get a conflict with fields that start with c$.  This may need to be identified on the client side
				Object value = entry.getValue();
				if (key.startsWith("client/")) // This is a client id alteration which needs be changed a 
				{
					key = Client.getCurrentObjectResponse().getConnection().clientSideObject(key,object.containsKey("array") ? 
								Persevere.newArray() : Persevere.newObject()).getId().toString();
				}
				/*String valueModOriginal = null;
				if (GlobalData.CHILDMODS_FIELD.equals(key))
					valueModOriginal = GlobalData.CHILDMODS_FIELD;

				if (target!=null && (GlobalData.CHILDMODS_FIELD.equals(childModOriginalId) || target.isChildMods()) && !GlobalData.PARENT_FIELD.equals(key))
					valueModOriginal = key;*/
/*    		if ("update".equals(key)) {
					if ("delete".equals(value))
						return getErasureEntity();
					if (value instanceof Map)
						updateList(target,(Map) value);
				}
				else {*/
				Object oldValue = target.get(key);
					value = idOrValueFromJSON(value, oldValue instanceof Persistable ? ((Persistable)oldValue).getId() : null);
					if (value instanceof ObjectNotFoundId)
						throw new RuntimeException("Can not set value to an undefined id");
					if (key.equals(FUNCTION_CODE_KEY)) {
						value = functionCompression((String) value);
						}
					if (target != null) {
	    				value = convertIdIfNeeded(value);
	    				if (!(oldValue == null ? value == null : oldValue.equals(value))){
	    					PersistableObject.checkSecurity(target, PermissionLevel.WRITE_LEVEL.level);
	    					target.set(key,value);
	    				}
					}
				//}
			}
		} catch (JSONException e) {
			throw new RuntimeException(e);
		}
/*		if (parentValue != null) // we will do it at the end so that if it is an append list entry it can be done without security problems
			target.set(GlobalData.PARENT_FIELD, parentValue);*/
    	return target.getId();
	}
	public String getPath() {
		return path;
	}
	public void setPath(String path) {
		this.path = path;
	}
	
	
	
}
