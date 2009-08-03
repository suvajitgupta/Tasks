package org.persvr.data;

import java.util.HashSet;
import java.util.Set;

import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

public class ProtectedGlobal extends PersistableObject {
	boolean frozen = false;
	public void freeze(){
		sealChildren(this,false);
		frozen = true;
	}
	@Override
	public Object get(String name, Scriptable start) {
		return super.get(name, start);
	}
	private Set sealedObjects = new HashSet();
	private void sealChildren(ScriptableObject object, boolean sealSelf){
		if(sealedObjects.contains(object))
			return;
		sealedObjects.add(object);
		if(sealSelf){
			object.sealObject();
		}
		
		for (Object key : object.getAllIds()){
			if(!(key.equals("java") || key.equals("Packages") || key.equals("javax") || key.equals("org") || key.equals("com") || key.equals("edu") || key.equals("net"))){
				Object value = object.get(key.toString(),object);
				if (value instanceof ScriptableObject && !(value instanceof PersistableClass)){
					// don't seal the schemas, but seal everything else
					sealChildren((ScriptableObject) value,true);
				}
			}
		}
	}
	private void checkWrite() {
		if (frozen)
			throw ScriptRuntime.constructError("WriteError", "The global object is frozen and can not be modified");
	}
	@Override
	public void put(String name, Scriptable start, Object value) {
		checkWrite();
		if(value instanceof NativeFunction){
			if(Boolean.FALSE.equals(((Scriptable)value).get("privileged", (Scriptable) value)))
				value = new Method((BaseFunction)value, name){
					public Object call(Context cx, Scriptable scope,
							Scriptable thisObj, Object[] args) {
						// we don't do checks for the internal 
						return innerFunction.call(cx, scope, thisObj, args);
					}
				};
			else
				value = new Method((BaseFunction)value, name){
					public Object callWithChecks(Context cx, Scriptable scope,
							Scriptable thisObj, Object[] args, boolean clientInitiatedCall) {
						// we don't do checks for the internal 
						return innerFunction.call(cx, scope, thisObj, args);
					}
				};
		}
		super.put(name, start, value);
	}
	public void putClass(String name, Scriptable start, PersistableClass value) {
		super.put(name, start, value);
	}


	@Override
	public void put(int index, Scriptable start, Object value) {
		checkWrite();
		super.put(index, start, value);
	}

	@Override
	public void putConst(String name, Scriptable start, Object value) {
		checkWrite();
		super.putConst(name, start, value);
	}

}
