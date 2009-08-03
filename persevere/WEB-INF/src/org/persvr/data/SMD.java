package org.persvr.data;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletResponse;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.Persevere;
import org.persvr.datasource.DataSource;
import org.persvr.javascript.PersevereNativeFunction;
import org.persvr.remote.AliasIds;
import org.persvr.remote.Client;
import org.persvr.remote.JSONSerializer;
import org.persvr.remote.JavaScriptSerializer;

public class SMD extends ReadonlyObject{

	public static SMD instance = new SMD(); 
	static SMDServices servicesInstance;
	private SMD(){						
		setPrototype(ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Object"));

		Scriptable applicationJson = new NativeObject();
		put("representation:application/json", this, applicationJson);
		setAttributes("representation:application/json",ScriptableObject.DONTENUM);
		applicationJson.put("quality", applicationJson, 1.0);
		applicationJson.put("output", applicationJson, new PersevereNativeFunction(){
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				try {					
					HttpServletResponse response = Client.getCurrentObjectResponse().getHttpResponse();
					response.setContentType("application/json; locator=id; charset=UTF-8");
					Writer writer = new OutputStreamWriter(response.getOutputStream(),"UTF8");
					new JSONSerializer().serialize(args[0], Client.getCurrentObjectResponse(), writer);
					writer.flush();
					return null;
				} catch (IOException e) {
					throw new RuntimeException(e);
				}
			}

		});
		
			
	
		servicesInstance = new SMDServices();		
		servicesInstance.setPrototype(ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Object"));
	}
	class SMDServices extends ReadonlyObject{

		public ObjectId getId() {			
			return new NewObjectId(this);
		}

		public Version getVersion() {			
			return null;
		}

		public Persistable getParent() {			
			return instance;
		}

		@Override
		public Persistable getSchema() {			
			return null;
		}


		public Set<Map.Entry<String, Object>> entrySet(int options){			
			Map map = new HashMap();
			for (String name : DataSourceManager.getDataSourceNames()){
				map.put(name, get(name));
			}
			return map.entrySet();
		}
		public Object get(String key) {			
			DataSource source = DataSourceManager.getSource(key);
			if (source != null) {
				//Object schema = ObjectPath.idForObject(source, "", ".schema").getTarget();
				Persistable sourceDescription = new PersistableObject();
				sourceDescription.set("target",key + '/');
				PersistableList<Persistable> params = (PersistableList<Persistable>) sourceDescription.set("parameters",Persevere.newArray());
				Persistable idParam = new PersistableObject();
				params.add(idParam);
				idParam.set("type", "string");
				sourceDescription.set("returns", ObjectId.idForObject(DataSourceManager.getMetaClassSource(), source.getId()).getTarget());
				return sourceDescription;
			}
			return Scriptable.NOT_FOUND;
		}

		SMDServices(){}

	}
	public Object get(String key) {		
		if ("transport".equals(key))
			return "REST";
		if ("envelope".equals(key))
			return "PATH";
		if ("SMDVersion".equals(key))
			return "2.0";
		if ("contentType".equals(key)) 			
			return "application/javascript";	
		if ("services".equals(key))
			return servicesInstance;
		return defaultGet(key, this);
	}

	public static AliasIds.AliasHandler smdAlias = new AliasIds.AliasHandler() {
		public Persistable getTarget() {			
			return instance;
		}
	};
	public ObjectId getId() {		
		return smdAlias;
	}

	public Persistable getParent() {		
		return null;
	}

	Set<String> keys = new HashSet(Arrays.asList(new String[]{"transport","contentType","services","envelope","SMDVersion"}));
	public Set<Map.Entry<String, Object>> entrySet(int options){		
		Map map = new HashMap();
		for (String name : keys){
			map.put(name, get(name));
		}
		return map.entrySet();
	}
	public Version getVersion() {		
		return null;
	}

}
