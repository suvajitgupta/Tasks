package org.persvr.data;

import java.util.Map;

import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.Persevere;

public class SchemaObject extends PersistableObject {
	
	public enum SchemaPart {
		Schema, Properties, Methods;
	}
	SchemaPart schemaPart;
	public void setSchemaPart(SchemaPart schemaPart){
		if(schemaPart == null){
			this.schemaPart = schemaPart; 
			switch(schemaPart) {
				case Schema:
					Object properties = get("properties");
					if (!(properties instanceof SchemaObject)){
						properties = Persevere.newObject(id.source);
						initializeProperty("properties", properties);
					}
					((SchemaObject)properties).setSchemaPart(SchemaPart.Properties);
					Object methods = get("methods");
					if (!(methods instanceof SchemaObject)){
						methods = Persevere.newObject(id.source);
						initializeProperty("methods", methods);
					}
					((SchemaObject)methods).setSchemaPart(SchemaPart.Methods);
					for(Map.Entry<String,Object> entry : entrySet(0)){
						setAttributes(entry.getKey(), ScriptableObject.READONLY & ScriptableObject.PERMANENT);
						if(entry.getValue() instanceof SchemaObject){
							((SchemaObject)entry.getValue()).setSchemaPart(null);
						}
					}
					break;
				case Properties:
					for(Map.Entry<String,Object> entry : entrySet(0)){
						((SchemaObject)entry.getValue()).setSchemaPart(SchemaPart.Schema);
					}
					break;
				case Methods:
					for(Map.Entry<String,Object> entry : entrySet(0)){
						setAttributes(entry.getKey(), ScriptableObject.READONLY & ScriptableObject.PERMANENT);
						if(entry.getValue() instanceof SchemaObject){
							((SchemaObject)entry.getValue()).setSchemaPart(null);
						}
					}
					break;
					
			}
		}
		
	}
	@Override
	public void put(String name, Scriptable start, Object obj) {
		super.put(name, start, obj);
		if(schemaPart == SchemaPart.Properties){
			//PersistableClass.coerceValueForSchema(schema, object, name, value)getParent()
		}
		
	}
	
	public boolean setParentIfNeeded(Persistable parent){
		if(this.parent==null){
			this.parent = parent;
			return true;
		}
		return false;
	}
}
