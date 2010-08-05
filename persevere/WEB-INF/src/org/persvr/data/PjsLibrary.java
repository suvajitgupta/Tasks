package org.persvr.data;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.Persevere;
import org.persvr.datasource.JavaScriptDBSource;
import org.persvr.datasource.UserAssignableIdSource;
import org.persvr.javascript.PersevereNativeFunction;
import org.persvr.remote.Client;
import org.persvr.remote.DataSerializer;
import org.persvr.remote.EventStream;
import org.persvr.remote.JsonReceiver;
import org.persvr.remote.Client.IndividualRequest;
import org.persvr.security.Capability;
import org.persvr.security.UserSecurity;

/**
 * Implementation of <a href="http://www.persistentjavascript.org">Persistent JavaScript</a> API for Rhino 
 * 
 * @author Kris Zyp
 */
public class PjsLibrary extends NativeObject {
	public String getClassName() {
		return "Pjs";
	}
	ScriptableObject global = (ScriptableObject) GlobalData.getGlobalScope();
	public void set(String name, Object value, boolean setGlobal, boolean setPjs){
		((Scriptable) value).setPrototype(ScriptableObject.getFunctionPrototype(GlobalData.getGlobalScope()));
		if(setGlobal)
			global.put(name, global, value);
		if(setPjs)
			put(name,this,value);
	}
	public PjsLibrary() {
		super();
		
		
		set("load", new PersevereNativeFunction("load") {
			@Override
			public Object profilableCall(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				if(args.length < 1 || !(args[0] instanceof String))
					throw ScriptRuntime.constructError("TypeError", "load must be called with a string parameter");
				Identification id = Identification.idForString((String) args[0]);
				if(id instanceof JsonPath){
					// we can add parameters if it is a JsonPath expression
					List parameters = new ArrayList();
					for(int i = 1; i < args.length; i++){
						if(!(args[i] instanceof Function) || i + 1 != args.length){
							parameters.add(args[i]);
						}
					}
					((JsonPath)id).setParameters(parameters.toArray());
				}
				Object object = id.getTarget();
				if (args.length > 1 && args[args.length - 1] instanceof Function) {// call the callback if necessary
					((Function)args[args.length - 1]).call(cx, scope, thisObj, new Object[]{object});
				}
				return object;
			}
			
		},true,true);
		set("remove", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				if(args.length == 0 || !(args[0] instanceof Persistable))
					throw ScriptRuntime.constructError("TypeError", "remove requires a persistable object");
				((Persistable)args[0]).delete();
				return true;
			}
			
		},true,true);
		set("get", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				Object value = ScriptRuntime.getObjectElem(args[0], args[1], cx);
				if (args.length > 2) {// call the callback if necessary
					((Function)args[2]).call(cx, scope, thisObj, new Object[]{value});
				}
				return value;
			}
		},true,true);
		set("set", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				((Persistable)args[0]).set((String)args[1], args[2]);
				return args[2];
			}
		},true,true);
		set("commit", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				Transaction.currentTransaction().commit();
				Transaction.startTransaction();
				return null;
			}
		},true,true);
		set("rollback", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				Transaction.startTransaction(); // abandon the old transaction
				return null;
			}
		},true,true);
/*		set("changing", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				
				return null;
			}
		});
		set("save", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				
				return null;
			}
		});*/
		set("getAccessLevel", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				if(args.length == 0 || !(args[0] instanceof Persistable))
					throw ScriptRuntime.constructError("TypeError", "getAccessLevel requires a persistable object");
				return ((Persistable)args[0]).getAccessLevel();
			}
		},false,true);
		set("hasAccessLevel", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				if(args.length == 0 || !(args[0] instanceof Persistable))
					throw ScriptRuntime.constructError("TypeError", "hasAccessLevel requires a persistable object");
				Integer level = Capability.getPermissionLevelForString((String) args[1]);
				return level == null ? false : level <= ((Persistable)args[0]).getAccessLevel();
			}
		},true,true);
		set("getId", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				if(args.length == 0 || !(args[0] instanceof Persistable))
					throw ScriptRuntime.constructError("TypeError", "getId requires a persistable object");

				return ((Persistable)args[0]).getId().toString();
			}
		},false,true);
		set("getParent", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				if(args.length == 0 || !(args[0] instanceof Persistable))
					throw ScriptRuntime.constructError("TypeError", "getParent requires a persistable object");

				return ((Persistable)args[0]).getParent();
			}
		},true, false);
		set("getVersions", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				if(args.length == 0 || !(args[0] instanceof Persistable))
					throw ScriptRuntime.constructError("TypeError", "getVersions requires a persistable object");
				// TODO: it would be nice to make a little more lazy version of this
				String baseId = ((Persistable)args[0]).getId() + "-v";
				Version version = ((Persistable)args[0]).getVersion();
				List versions = Persevere.newArray();
				if(version == null)
					return versions;
				int versionCount = version.getVersionNumber();
				for(int i = 0; i < versionCount; i++){
					versions.add(ObjectId.idForString(baseId + (i + 1)));
				}
				return versions;
			}
		},true, false);
		set("isPersisted", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				if(args.length == 0 || !(args[0] instanceof Persistable))
					throw ScriptRuntime.constructError("TypeError", "isPersisted requires a persistable object");

				return ((Persistable)args[0]).getId().isPersisted();
			}
		},false,true);
		set("getUserName", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				return UserSecurity.getUserName();
			}
		},false,true);
		set("getCurrentUser", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				return UserSecurity.currentUser();
			}
		},true,true);
		set("loggedInUsers", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				Boolean onlyConnected = args.length > 0 && Boolean.TRUE.equals(args[0]);
				Set users = new HashSet();
				for (Map.Entry<String, Client> entry : EventStream.streams.entrySet()){
					Client client = entry.getValue();
					if(!onlyConnected || client.isConnected()){
						Object user = client.getAuthorizedUser();
						if(user != null)
							users.add(user);
					}
				}
				return new PersistableArray(users.toArray());
			}
		},false,true);
		set("putHandler", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				// temporarily here until PersistableClass puts it's own version in
				return null;
			}
		},false,true);
		set("deserialize", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				return new JsonReceiver().convertJsonStringToObject((String) args[0]);
			}
		},true,false);
		set("serialize", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				final StringWriter writer = new StringWriter();
				
				IndividualRequest request = Client.getCurrentObjectResponse();
				HttpServletResponse currentResponse = request.getHttpResponse();
				request.setHttpResponse(new HttpServletResponse(){

					public void addCookie(Cookie arg0) {
					}

					public void addDateHeader(String arg0, long arg1) {
					}

					public void addHeader(String arg0, String arg1) {
					}

					public void addIntHeader(String arg0, int arg1) {
					}

					public boolean containsHeader(String arg0) {
						return false;
					}

					public String encodeRedirectUrl(String arg0) {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public String encodeRedirectURL(String arg0) {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public String encodeUrl(String arg0) {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public String encodeURL(String arg0) {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public void sendError(int arg0, String arg1) throws IOException {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public void sendError(int arg0) throws IOException {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public void sendRedirect(String arg0) throws IOException {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public void setDateHeader(String arg0, long arg1) {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public void setHeader(String arg0, String arg1) {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public void setIntHeader(String arg0, int arg1) {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public void setStatus(int arg0, String arg1) {
					}

					public void setStatus(int arg0) {
					}

					public void flushBuffer() throws IOException {
					}

					public int getBufferSize() {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public String getCharacterEncoding() {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public String getContentType() {
						return "application/json";
					}

					public Locale getLocale() {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public ServletOutputStream getOutputStream() throws IOException {
						return new ServletOutputStream(){

							@Override
							public void write(byte[] b) throws IOException {
								writer.write(new String(b));
							}

							@Override
							public void write(int b) throws IOException {
								writer.write(new String(new byte[]{(byte) b}));
								
							}
							
						};
						
					}

					public PrintWriter getWriter() throws IOException {
						return new PrintWriter(writer);
					}

					public boolean isCommitted() {
						throw new UnsupportedOperationException("Not implemented yet");
					}

					public void reset() {
					}

					public void resetBuffer() {
					}

					public void setBufferSize(int arg0) {
					}

					public void setCharacterEncoding(String arg0) {
					}

					public void setContentLength(int arg0) {
					}

					public void setContentType(String arg0) {
					}

					public void setLocale(Locale arg0) {
					}
					
				});
				try{
					DataSerializer.serialize(args[0], args.length > 1 ? (String) args[1] : null);
				}finally{
					request.setHttpResponse(currentResponse);
				}
				return writer.toString();
			}
		},true,false);
		set("_setIdSequence", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				try {
					if(!UserSecurity.hasPermission("setIdSequence")){
						throw ScriptRuntime.constructError("AccessError", "You do not have access to the set the id sequence");
					}
					((UserAssignableIdSource) DataSourceManager.getSource(((Persistable)args[0]).getId().subObjectId)).setIdSequence(((Number)args[1]).longValue());
				} catch (ClassCastException e) {
					throw ScriptRuntime.constructError("TypeError", "Must pass in a class and a number");
				}
				return null;
			}
		},false,true);
		set("freezeDatabase", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				if(!UserSecurity.hasPermission("freezeDatabase")){
					throw ScriptRuntime.constructError("AccessError", "You do not have access to freeze the database");
				}
				JavaScriptDBSource.getDatabase().freeze();
				return null;
			}
		},false,true);
		set("unfreezeDatabase", new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				if(!UserSecurity.hasPermission("freezeDatabase")){
					throw ScriptRuntime.constructError("AccessError", "You do not have access to freeze the database");
				}
				JavaScriptDBSource.getDatabase().unfreeze();
				return null;
			}
		},false,true);

	}
}
