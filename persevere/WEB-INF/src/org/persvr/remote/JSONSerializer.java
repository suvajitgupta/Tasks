package org.persvr.remote;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.IdFunctionObject;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Undefined;
import org.persvr.Persevere;
import org.persvr.data.BinaryData;
import org.persvr.data.DataSourceManager;
import org.persvr.data.DeferredField;
import org.persvr.data.FunctionUtils;
import org.persvr.data.GlobalData;
import org.persvr.data.Identification;
import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableObject;
import org.persvr.data.Query;
import org.persvr.data.QueryCollection;
import org.persvr.datasource.ClassDataSource;
import org.persvr.datasource.DataSource;
import org.persvr.datasource.RemoteDataSource;
import org.persvr.remote.Client.IndividualRequest;
import org.persvr.remote.DataSerializer.Request.SerializerFeature;
import org.persvr.security.ObjectAccessDeniedException;
import org.persvr.security.SystemPermission;
import org.persvr.security.UserSecurity;
import org.persvr.util.JSON;

public class JSONSerializer extends DataSerializer {

	public boolean match(String accept) {
		return accept != null && accept.matches(".*json.*") && !(accept.matches(".*javascript.*") || accept.matches(".*ecmascript.*"));
	}
	
	
	public String getContentType() {
		return "application/json; charset=UTF-8";
	}
	Object convertToCollectionContainerIfNeeded(List value, IndividualRequest request){
		HttpServletRequest httpRequest = request.getHttpRequest();
		if(httpRequest != null){
			String acceptHeader = httpRequest.getHeader("Accept");
			if(acceptHeader != null) {
				int collectionIndex = acceptHeader.indexOf("collection=");
				if(collectionIndex > -1){
					String collectionProperty = acceptHeader.replaceAll("(.*collection=)(\\w+)(.*)", "$2");
					Persistable newRoot = Persevere.newObject();
					newRoot.set(collectionProperty, value);
					boolean sizeEstimated = value instanceof QueryCollection;
					int size = sizeEstimated ? (int) ((QueryCollection)value).estimatedSize(20) : ((List)value).size();
					newRoot.set("totalCount", size);
					return newRoot;
				}
			}
		}
		return value;
	}
	void setSchemaMediaTypeParameter(Object value, Request request){
		HttpServletResponse response = Client.getCurrentObjectResponse().getHttpResponse();
		if(response != null) {
			if(value instanceof List){
				if(!((List)value).isEmpty()){
					value = ((List)value).get(0);
				}
			}
			if(value instanceof Persistable){
				Persistable clazz = ((Persistable)value).getSchema();
				if(clazz != null) {
					ObjectId classId = clazz.getId();
					if(classId.subObjectId != null){
						if("Class".equals(classId.subObjectId))
							response.setContentType(response.getContentType() + ";schema=" + request.idString(classId) + ";schema=http://json-schema.org/hyper-schema");
						else
							response.setContentType(response.getContentType() + ";schema=" + request.idString(classId));
					}
				}
			}
		}
	}
	public void serialize(Object value, Request request, Writer writer) {
		Serialization serialization = new Serialization();
		serialization.request = request;
		try {
			if (value instanceof List && request instanceof IndividualRequest){
				value = convertToCollectionContainerIfNeeded((List)value, (IndividualRequest) request);
			}
			setSchemaMediaTypeParameter(value, request);
			serialization.writeValue(writer, value, false);
		} catch (UnsupportedEncodingException e) {
			throw new RuntimeException(e);
		}
		catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
	protected class Serialization {
		Set<String> alreadyFulfilled = new HashSet<String>(100);

		public Request request;
		String getDisplayId(Persistable obj){
			ObjectId objId = obj.getId();
			if(objId.source == null || !objId.hidden())
				return request.idString(obj.getId());
			Persistable parent = obj.getParent();
			if (parent != null) {
				
				if(parent instanceof List){
					if(!(parent instanceof QueryCollection)){
						for(int i = 0; i < ((List)parent).size();i++){
							if(obj == ((List)parent).get(i))
								return getDisplayId(parent) + '.' + i; 
						}
					}
				}
		    	for (Map.Entry<String,Object> entry: parent.entrySet(0)) {
					if(obj == entry.getValue()){
						String startingId = getDisplayId(parent);
						return startingId + (startingId.indexOf('#') == -1 ? '#' : '.') + entry.getKey(); 
					}
				}
			}
			return request.idString(obj.getId());
		}
		
		public void writeValue(Writer writer, Object value, Boolean lazy) throws IOException {
			writeValue(writer, value, lazy,null, false);
		}
		protected String undefined(){
			return "null";
		}
		protected void writeValue(Writer writer, Object value, Boolean lazy, Persistable referrer, boolean hasParentId) throws IOException {//TODO: make the second parameter unnecesssary
			String valueString;
			/*if (value instanceof XMLElement)
				value = ((XMLElement) value).getNewConversion();*/
			if (value instanceof DeferredField)
				value = ((DeferredField)value).getTarget();
			if (value instanceof Persistable || value instanceof Identification) {
				Identification<? extends Object> id;
		        if (value instanceof Persistable) 
		        	id = ((Persistable) value).getId();
		        else 
		        	id = (Identification<? extends Object>) value;
		        if (id == null || (id instanceof ObjectId && !Boolean.TRUE.equals(lazy))) {
		        		//(!(id.source instanceof HttpJsonSource && !(request.requestedSource instanceof HttpJsonSource))))) {
					 serializeObject(writer, value instanceof ObjectId ? ((ObjectId)value).getTarget() : (Persistable) value , lazy, referrer, hasParentId);
				}
				else {
					String idString = request.idString(id);
					writer.write("{\"$ref\":" + JSON.quote(idString) + "}");
				}
			}
			else if (value instanceof BaseFunction && value != Client.functionPrototype) {
				writer.write(serializeFunction((BaseFunction)value)); 
			}
			else if (value instanceof String) {
				writer.write(JSON.quote((String) value));
			} 
			else if (value instanceof Number){
				writer.write(value instanceof Double ? 
						ScriptRuntime.toString(((Double)value).doubleValue()) : 
							value.toString());
			}
			else if (value instanceof Boolean) {
				writer.write(value.toString());
			}
			else if (value instanceof Date) {
				writer.write(serializeDate((Date)value));
			}
			else if (value == null)
				writer.write("null");
			else if (value instanceof RemoteScript) {
				writer.write(((RemoteScript)value).getScriptText());
			}
			else if (value instanceof ObjectId) 
				throw new RuntimeException("can not directly handle objectId");
			else if (value instanceof Scriptable){
				if (value instanceof NativeJavaObject){
					writeValue(writer, ((NativeJavaObject)value).unwrap(),lazy,referrer, hasParentId);
				}
				else if ("Date".equals(((Scriptable)value).getClassName())) {
					writeValue(writer, PersistableObject.convertToDateJavaDate(value),lazy,referrer, hasParentId);
				}
				else
					writer.write("null"); // this should only happen when we hit a system prototype
			}
			else if (value instanceof BinaryData){
				writer.write('"' + new String(Base64.encodeBase64(((BinaryData)value).getBytes())) + "\",\n\"encoding\":\"base64\"");
			}
			else if (value == Scriptable.NOT_FOUND || value == Undefined.instance)
				writer.write(undefined()); 
			else {
				Log log = LogFactory.getLog(JSONSerializer.class);
				log.info("Can not output an object of type "
						+ value.getClass() + " to JSON");
				writer.write("\"Can not serialize " + value.getClass() + "\""); 
			} 
		} 
		protected boolean canReference(Persistable obj, Persistable referrer) {
			ObjectId id = obj.getId();
			return id.source != null && !referrer.equals(obj.getParent());// || !id.hidden();
					/* || 
					(objId.source == null && referrer.getId().toString().equals("root"))*/
		}
		void serializeObject(Writer writer, Persistable obj, Boolean lazy, Persistable referrer, boolean parentHasId) throws IOException {
			StringBuffer buffer = new StringBuffer(); 
			try { 
				depth++;
				ObjectId objId = obj.getId();
				boolean persisted = false;
				String idString = null;
				if (objId != null) {
					persisted = objId.isAssignedId();
					idString = JSON.quote(request.idString(objId));
				}
				ObjectId refId;
				if (objId != null && referrer != null && 
							(!((refId = referrer.getId()) instanceof Query || !parentHasId || // want all the items in a query to be included
									(referrer instanceof List && request instanceof IndividualRequest && ((IndividualRequest)request).requestRoot == referrer) || 
								(refId.subObjectId == null && refId.source == DataSourceManager.getMetaClassSource())) && // and want children of the root to be included as well
								!Boolean.FALSE.equals(lazy) &&
						(canReference(obj, referrer) || 
								objId instanceof Query) || alreadyFulfilled.contains(objId))) { 
					writer.write("{\"$ref\":" + JSON.quote(getDisplayId(obj)) + "}");
					depth--;
					return;
				}
				else {
					request.shouldSerialize(obj);
					String id = objId == null ? null : objId.toString();
					
					boolean commaNeeded = true;
					if (id == null) {
/*						if (request.aliasId != null) 
							buffer.append("{\"id\":" + JSON.quote(request.aliasId));
						else {*/
							buffer.append("{");
							commaNeeded = false;
						//}
					}
					else {
						alreadyFulfilled.add(id);
						if (persisted && (!objId.hidden() || referrer== null)) // if is a plain object or not persisted we hide ids
								{// also if the path is null, that indicates the client has no way to determine the reference, so we better include an id 
								//|| obj.getAcl() != null) {// if there is security defined we should include the id so that the security can be defined for the client							
							buffer.append("{\"id\":" + idString);
						}
						else {
							buffer.append("{");
							commaNeeded = false;
						}
					}
					if (obj instanceof List) {
						try { 
							writer.write("[");
							commaNeeded= false;
							int[] indexes = request.getIndexRange((List) obj);
							for (Object item : ((List)obj).subList(indexes[0], indexes[1])) {
								writeNewLine(writer, commaNeeded);
								try {
									writeValue(writer, item, lazy, obj, parentHasId);
								} catch (EcmaError e) {
									if(item instanceof Persistable){
										item = ((Persistable)item).getId();
									}
									if(item instanceof Identification && "AccessError".equals(e.getName())){
										String refString = request.idString((Identification)item);
										writer.write("{\"$ref\":" + JSON.quote(refString) + "}");
									}
									else{
										writer.write(JSON.quote(e.getMessage()));
									}
								} catch (Exception e) {
									writer.write(JSON.quote(e.getMessage()));
								}
								commaNeeded = true;
									
								//arrayBuffer.append(getValueString(item, false));
							}
						}
						catch (Exception e) {
							Log log = LogFactory.getLog(JSONSerializer.class);
							log.info(e.getMessage());
							if(e instanceof RuntimeException)
								throw (RuntimeException) e;
						}
						finally {
							depth--;
							writeNewLine(writer, false);
							writer.write("]");
						}
					}
					else{
						if(commaNeeded){
							parentHasId = true;
						}
						Persistable schema = obj.getSchema();	
						Set<Map.Entry<String,Object>> entries= obj.entrySet(4);
						boolean security = PersistableObject.isSecurityEnabled();
						PersistableObject.enableSecurity(false);
						Object propsObject = schema == null ? null : schema.get("properties");
						boolean objectStarted = false;
						try{
							Persistable properties = propsObject instanceof Persistable ? (Persistable) propsObject : null; 
							if(objId.subObjectId == null && objId.source instanceof ClassDataSource)
								objId = null; // this causes the output for root to still serialize identifi
							PersistableObject.enableSecurity(security);
					    	for (Map.Entry<String,Object> entry: entries) {
					    		if(!objectStarted) {
									writer.write(buffer.toString());
									objectStarted = true;
					    		}
					    		String key = entry.getKey();
					    		Object value = entry.getValue();
								try {
									if (!key.startsWith(":") && !("id".equals(key) && obj.getId().source != null))// || request.includeMetaData) 
									{
										PersistableObject.enableSecurity(false);
										Object propDef = properties == null ? null : properties.get(key);
										Object lazyObject = propDef instanceof Persistable ?  ((Persistable)propDef).get("lazy") : null;
										lazy = lazyObject instanceof Boolean ? (Boolean) lazyObject : null;
										Object conditional = propDef instanceof Persistable ?  ((Persistable)propDef).get("shouldSerialize") : null;
										if(conditional instanceof Function){
											if(!ScriptRuntime.toBoolean(((Function)conditional).call(Context.enter(), GlobalData.getGlobalScope(), obj, new Object[]{}))){
												continue;
											}
										}
										if (value instanceof BaseFunction && !(request.getFeature(SerializerFeature.IncludeServerMethods) && UserSecurity.hasPermission(SystemPermission.javaScriptCoding))) {
											String runAt = FunctionUtils.getRunAtForMethod(obj, key);
											if (!("client".equals(runAt) || "local".equals(runAt))){
												PersistableObject.enableSecurity(security);
												continue;
											}
										}
										PersistableObject.enableSecurity(security);
										writeNewLine(writer,commaNeeded);
										writer.write(JSON.quote(key));
										writer.write(":");
										Identification valueId;
										if(value instanceof Identification)
											valueId = (Identification)value;
										else if(value instanceof Persistable){
											valueId = ((Persistable)value).getId();
										}
										else
											valueId = null;
										if(Boolean.TRUE.equals(lazy) || (valueId != null && valueId.source instanceof RemoteDataSource)){
											if(value instanceof Persistable){
												value = ((Persistable)value).getId();
											}
											if(value instanceof Identification){
												String refString = request.idString((Identification)value);
												writer.write("{\"$ref\":" + JSON.quote(refString) + "}");
											}
											else{
												writer.write("{\"$ref\":" + JSON.quote(request.idString(objId) + '.' + key) + "}");
											}
										}
										else{
											if(value instanceof Identification){
												value = ((Identification)value).getTarget();
											}
											writeValue(writer, value, lazy, obj, parentHasId);
										}
										commaNeeded = true;
										
									} 
								} catch (ObjectAccessDeniedException e) {
									if(value instanceof Identification){
										String refString = request.idString((Identification)value);
										writer.write("{\"$ref\":" + JSON.quote(refString) + "}");
									}
									else{
										writer.write("{\"$ref\":" + JSON.quote(request.idString(objId) + '.' + key) + "}");
									}
								} catch (Exception e) {
									writer.write(JSON.quote("Error: " + e.getMessage()));
								}
							}
				    		if(!objectStarted) {
								writer.write(buffer.toString());
								objectStarted = true;
				    		}
						}
						catch(RuntimeException e){
							if(!objectStarted)
								throw e;
						}
						finally{
							depth--;
							if(objectStarted){
								writeNewLine(writer, false);
								writer.write("}");
							}							
							PersistableObject.enableSecurity(security);
						}
					}					
				}
			} 
			finally { 
			}
		}
	
		StringBuffer outputSoFar = new StringBuffer();
		int depth = -1;
		void writeNewLine(Writer writer, boolean needComma) throws IOException {
			writer.write(needComma ? ",\n":"\n");
			for (int i = 0; i < depth; i++)
				writer.write("\t");
		}
		public void setRequest(IndividualRequest request) {
			this.request = request;
		}
		protected String serializeFunction(BaseFunction function) {
			if(function instanceof IdFunctionObject){
				// primitive class
				String json = "{\"type\":\"" + function.get("type", function) + '"';
				if(function.get("format", function) instanceof String){
					json += ",\"format\":\"" + function.get("format", function) + '"';
				}
				return json + "}";
			}
			return "\"function\"";
		}
		protected String serializeDate(Date date){
			return "\"" + dateToIso(date) + "\"";
		}
	}
	static {
		TimeZone utc = TimeZone.getTimeZone( "UTC" );
        ISO_SDF.setTimeZone ( utc );
	}
	static private String dateToIso(Date date) {
        return ISO_SDF.format(date);
        // convert from milliseconds to centiseconds
        // by chopping off last digit, and reappending the decorative Z.
        //return milliformat.substring( 0, 22 ) + 'Z' ;
	}

}
