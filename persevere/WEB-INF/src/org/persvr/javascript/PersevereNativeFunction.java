package org.persvr.javascript;

import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.persvr.data.GlobalData;
import org.persvr.data.Method;

public class PersevereNativeFunction extends BaseFunction {
	public PersevereNativeFunction(String name){
		method = new Method(name);
		ScriptRuntime.setObjectProtoAndParent(this, GlobalData.getGlobalScope());
	}
	Method method;
	public PersevereNativeFunction(){
		ScriptRuntime.setObjectProtoAndParent(this, GlobalData.getGlobalScope());
	}
	public Object profilableCall(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
		return null;
	}
	@Override
	public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
		long startTime = 0;
		if(Method.profiling){
			startTime = Method.startTiming();
		}
		try{
			return profilableCall(cx, scope, thisObj, args);
		}
		finally{
			if(Method.profiling){
				Method.stopTiming(startTime, method);
			}
		}
	}
}
