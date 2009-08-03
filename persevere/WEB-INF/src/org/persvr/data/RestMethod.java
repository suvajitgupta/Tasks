package org.persvr.data;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;

import javax.servlet.http.HttpServletResponse;

import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.persvr.javascript.PersevereNativeFunction;
import org.persvr.remote.Client;
import org.persvr.remote.JSONSerializer;
import org.persvr.remote.JavaScriptSerializer;
import org.persvr.remote.DataSerializer.DirtyOutputStreamWriter;

/**
 * Provides the default implementation of the REST methods
 * @author Kris
 *
 */
public abstract class RestMethod extends BaseFunction {
	@Override
	public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
		return runMethod(cx,thisObj,args.length == 0 ? Undefined.instance : args[0]);
	}
	RestMethod(String source){
		this.put("source", this, source);
	}
	public String toString(){
		return (String) this.get("source", this);
	}
	static class GetMethod extends RestMethod {
		GetMethod(){
			super("function(ifModifiedSince){\n\t[native code]\n}");
		}

		@Override
		public Object runMethod(Context cx, Scriptable thisObj, Object ifModifiedSince) {
			// TODO: Implement If-Modified-Since
/*			if (ifModifiedSince != null) {
				Date ifModSince = null;
				try {
					try {
						ifModSince = PersevereFilter.preciseFormatter.parse((String) ifModifiedSince);
					} catch (ParseException e) {
						ifModSince = new Date(Date.parse((String) ifModifiedSince));
					}
				} catch (Exception e) {
					Logger.getLogger(PersevereFilter.class.toString()).info("unable to parse date " + ifModifiedSince);
				}
				
				boolean current = ifModSince != null && datedTarget.getLastModified().compareTo(ifModSince) > 0;
				if (current) {
					response.setStatus(304);								
				}
			}*/
			return thisObj;// pretty simple, the Persevere outputters handle the serialization
		}
	}
 
	public abstract Object runMethod(Context cx, Scriptable thisObj, Object bodyValue);
	// this is a mirror of the object proto that is enumerable
	public static Persistable objectProtoMirror = new PersistableObject();
	static void setRestMethods(Scriptable scope) {
		final ScriptableObject arrayProto = (ScriptableObject) ScriptableObject.getClassPrototype(scope,"Array");
		final ScriptableObject objectProto = (ScriptableObject) ScriptableObject.getClassPrototype(scope,"Object");
		objectProto.put("get", objectProto, new GetMethod());
		objectProto.setAttributes("get",ScriptableObject.DONTENUM);
		objectProto.put("head", objectProto, new Method(new GetMethod() {
			@Override
			public Object runMethod(Context cx, Scriptable thisObj, Object bodyValue) {
				super.runMethod(cx, thisObj, bodyValue);
				return Undefined.instance;
			}
		},"head"));
		objectProto.setAttributes("head",ScriptableObject.DONTENUM);
		objectProto.put("put", objectProto, new Method(new RestMethod("function(content, target, property){\n\t[native code]\n}") {
			@Override
			public Object runMethod(Context cx, Scriptable thisObj, Object bodyValue) {
				throw new RuntimeException("Should never be called");
			}
			@Override
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
/*				Object content = args[0];
				Persistable target = (Persistable) thisObj;
				if (args.length > 1)
					target = (Persistable) args[1];
				if (args.length > 1 && args[2] != null){
					// if the property is defined we will set just that
					String property = args[2].toString();
				}*/
				
				//TODO: Move the Persevere operations into here
				return thisObj;// pretty simple, the Persevere handles the setting the values
			}
		},"put"));
		objectProto.setAttributes("put",ScriptableObject.DONTENUM);
		objectProto.put("delete", objectProto, new Method(new RestMethod("function(from){\n\t[native code]\n}") {
			
			@Override
			public Object runMethod(Context cx, Scriptable thisObj, Object bodyValue) {
				throw new RuntimeException("Should never be called");
			}
			@Override
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
				
				/*if (args.length > 0 && args[0] != null) { // This means we know what object to delete the target from
					String from = (String) args[0];
					Identification<? extends Object> fromId = Identification.idForString(from);
					Object fromTarget = fromId.getTarget();
					if (fromTarget instanceof List) // if it is list we can use the efficient remove method
						((List<Object>) fromTarget).remove(thisObj);
					else if (fromTarget instanceof Persistable) { // find the right value
						for (Map.Entry<String,Object> entry : ((Persistable) fromTarget).entrySet(0))
							if (thisObj== entry.getValue())
								((Persistable) fromTarget).delete(entry.getKey());
					} else
						throw new RuntimeException("The 'from' parameter does not refer to a valid object");
				}
				else {
					if (thisObj instanceof Persistable) {
						((Persistable) thisObj).delete();
					} else {
						throw new RuntimeException("This type of object path does not currently support DELETE");
					}
				}*/
				return Undefined.instance;
			}

		},"delete"));
		objectProto.setAttributes("delete",ScriptableObject.DONTENUM);

		objectProto.put("post", objectProto, new Method(new RestMethod("function(content){\n\t[native code]\n}") {

			@Override
			public Object runMethod(Context cx, Scriptable thisObj, Object newObject) {
				if (newObject instanceof Persistable)
					PersistableClass.enforceObjectIsValidBySchema(((Persistable) newObject).getSchema(), (Persistable) newObject);
				return newObject;
			}
		},"post"));
		objectProto.setAttributes("post",ScriptableObject.DONTENUM);

		objectProto.put("onSave", objectProto, new Method(new RestMethod("function(content){\n}") {

			@Override
			public Object runMethod(Context cx, Scriptable thisObj, Object newObject) {
				return newObject;
			}
		},"onSave"));
		objectProto.setAttributes("onSave",ScriptableObject.DONTENUM);
		objectProto.put("message", objectProto, new Method(new RestMethod("function(content){\n}") {

			@Override
			public Object runMethod(Context cx, Scriptable thisObj, Object newObject) {
				return newObject;
			}
		},"message"));
		objectProto.setAttributes("message",ScriptableObject.DONTENUM);
		objectProto.setGetterOrSetter("parent", 0, new PersevereNativeFunction(){

			@Override
		    public Object call(Context cx, Scriptable scope, Scriptable thisObj,
                    Object[] args) {
				return thisObj instanceof Persistable ? ((Persistable)thisObj).getParent() : null;
			}
		},false);
		objectProto.setAttributes("parent",ScriptableObject.DONTENUM);
		
		Scriptable applicationJavascript = new NativeObject();
		objectProto.put("representation:application/javascript", objectProto, applicationJavascript);
		objectProtoMirror.put("representation:application/javascript", objectProtoMirror, applicationJavascript);
		objectProto.setAttributes("representation:application/javascript",ScriptableObject.DONTENUM);
		applicationJavascript.put("quality", applicationJavascript, 0.9);
		applicationJavascript.put("output", applicationJavascript, new PersevereNativeFunction(){
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				try {
					HttpServletResponse response = Client.getCurrentObjectResponse().getHttpResponse();
					DirtyOutputStreamWriter writer = new DirtyOutputStreamWriter(response.getOutputStream(),"UTF8");
					try{
						new JavaScriptSerializer().serialize(args[0], Client.getCurrentObjectResponse(), writer);
					}
					catch(RuntimeException e){
						if(writer.isDirty)
							writer.write("&&");
						throw e;
					}
					finally{
						writer.flushIfDirty();
					}
					return null;
				} catch (IOException e) {
					throw new RuntimeException(e);
				}
			}

		});
		
		Scriptable applicationJson = new NativeObject();
		objectProto.put("representation:application/json", objectProto, applicationJson);
		objectProtoMirror.put("representation:application/json", objectProtoMirror, applicationJson);
		objectProto.setAttributes("representation:application/json",ScriptableObject.DONTENUM);
		applicationJson.put("quality", applicationJson, 0.8);
		applicationJson.put("output", applicationJson, new PersevereNativeFunction(){
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				try {
					HttpServletResponse response = Client.getCurrentObjectResponse().getHttpResponse();
					DirtyOutputStreamWriter writer = new DirtyOutputStreamWriter(response.getOutputStream(),"UTF8");
					try{
						new JSONSerializer().serialize(args[0], Client.getCurrentObjectResponse(), writer);
					}
					catch(RuntimeException e){
						if(writer.isDirty)
							writer.write("&&");
						throw e;
					}
					finally{
						writer.flushIfDirty();
					}
					return null;
				} catch (IOException e) {
					throw new RuntimeException(e);
				}

			}

		});
		

	}
    public int getArity() { return 0; }

    public int getLength() { return 0; }

    public String getFunctionName()
    {
        return "";
    }
}
