package org.persvr.data;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.Map;

import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.persvr.datasource.DataSource;
import org.persvr.datasource.HttpJsonSource;
import org.persvr.remote.Client;
import org.persvr.rpc.RPCall;
import org.persvr.security.PermissionLevel;

public class Method extends BaseFunction {
	static ThreadLocal<Boolean> safeMode = new ThreadLocal<Boolean>();
	BaseFunction innerFunction;
	String source;
	String methodName;
	static ThreadLocal<LinkedList<Long>> currentTimings = new ThreadLocal<LinkedList<Long>>();
	static class Timing {
		long own;
		long total;
		int calls;
		long max;
	}
	public static boolean profiling = false;
	static Map<Method, Timing> timings;
	public static void startProfiling(){
		timings = new HashMap<Method, Timing>();
		profiling = true;
	}
	public Method(String methodName) {
		this.methodName = methodName;
	}
	public Method(BaseFunction innerFunction, String methodName) {
		super();
		this.innerFunction = innerFunction;
		// we no longer "strip" parent scopes
		// innerFunction.setParentScope(GlobalData.getGlobalScope());
		Object selfDefinedSource = innerFunction.get("source", innerFunction);
		this.source = selfDefinedSource instanceof String ? (String) selfDefinedSource : ScriptRuntime.toString(innerFunction);
		this.methodName = methodName;
		setPrototype(ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(), "Function"));
		put("prototype", this, innerFunction.get("prototype", innerFunction));
	}
	@Override
	public Object call(Context cx, Scriptable scope,
			Scriptable thisObj, Object[] args) {
		return call(cx, scope, thisObj, args, false);
	}
	String className;
	public Object call(Context cx, Scriptable scope,
			Scriptable thisObj, Object[] args, boolean clientInitiatedCall) {
		if(!(thisObj instanceof Persistable)){
			return innerFunction.call(cx, scope, thisObj, args);
		}
		//record the current security level
		boolean security = PersistableObject.isSecurityEnabled();
		if(security){
			PersistableObject.checkSecurity((Persistable)thisObj, PermissionLevel.EXECUTE_LEVEL.level);	
		}
		// go into unsecure mode, the code can run with full priviledges
		PersistableObject.enableSecurity(false);
		long startTime = 0;
		try{
			
			if(profiling){
				try {
					if(className == null) {
						if(thisObj instanceof PersistableClass)
							className = ((Persistable)thisObj).getId().subObjectId;
						else {
							Persistable clazz = thisObj instanceof SchemaObject ? 
											((Persistable) thisObj).getParent() : 
												((Persistable) thisObj).getSchema();
							if(clazz == null)
								className = "";
							else
								className = clazz.getId().subObjectId;
						}
					}
					startTime = startTiming();
				} catch (RuntimeException e) {
					LogFactory.getLog(Method.class).error(e);
				}
			}
			return callWithChecks(cx, scope, thisObj, args, clientInitiatedCall);
		}
		finally{
			//restore the security level
			PersistableObject.enableSecurity(security);
			if(profiling){
				stopTiming(startTime, this);
			}

		}
	}
	public Object callWithChecks(Context cx, Scriptable scope,
		Scriptable thisObj, Object[] args, boolean clientInitiatedCall) {
		Persistable methodDefinition = FunctionUtils.getMethodDefinition((Persistable) thisObj, methodName);
		Object runAt = null;
		if (methodDefinition != null) {
			Object parameters = methodDefinition.get("parameters");
			if (parameters instanceof PersistableArray) {
				// check to make sure the parameters match the required parameters for the method definition 
				int i = 0;
				for (Object parameter : (PersistableArray) parameters){
					Object arg = i < args.length ? args[i] : Undefined.instance;
					i++;
					try {
						PersistableClass.enforceSchemaForValue((Persistable) parameter, arg);
					}
					catch (EcmaError e) {
						throw PersistableClass.addPropertyToValidationError(e,"parameter " + i);
					}
				}
			}
			if(Boolean.TRUE == safeMode.get() && !Boolean.TRUE.equals(methodDefinition.get("safe")))
				throw new SecurityException("Can not call a method in a query unless it is marked 'safe' in the method definition");
			if(clientInitiatedCall && Boolean.TRUE.equals(methodDefinition.get("internal")))
				throw new SecurityException("Can not call a method marked 'internal' through a remote call");
			runAt = methodDefinition.get("runAt");
			if(((Persistable)thisObj).getId().source instanceof HttpJsonSource) {
				if(!("client".equals(runAt) || "system".equals(runAt) || "local".equals(runAt))){
				  	return ((HttpJsonSource)((Persistable)thisObj).getId().source).executeRPC(((Persistable)thisObj).getId(), methodName, args);
				}
			}
			else if ("client".equals(runAt)){
				Client.getCurrentObjectResponse().sendMessage(new RPCall((Persistable)thisObj,methodName,args));
				return RPCall.SUSPENDED;
			}
			
			Object returnValue = innerFunction.call(cx, scope, thisObj, args);
			Object returns = methodDefinition.get("returns");
			if (returns instanceof Persistable) {
				try {
					PersistableClass.enforceSchemaForValue((Persistable) returns, returnValue);
				}
				catch (EcmaError e) {
					throw PersistableClass.addPropertyToValidationError(e,"the return value");
				}
			}
			if(Boolean.TRUE.equals(methodDefinition.get("observable"))) {
				if (returnValue instanceof org.mozilla.javascript.Undefined && methodName.toUpperCase().equals("DELETE")) {
					Transaction.currentTransaction().addObservedCall(((Persistable)thisObj).getId(),innerFunction instanceof RestMethod ? methodName.toUpperCase() : methodName, thisObj, Boolean.TRUE.equals(methodDefinition.get("idempotent")), clientInitiatedCall);
				} else {
					Transaction.currentTransaction().addObservedCall(((Persistable)thisObj).getId(),innerFunction instanceof RestMethod ? methodName.toUpperCase() : methodName, returnValue, Boolean.TRUE.equals(methodDefinition.get("idempotent")), clientInitiatedCall);
				}
			}
			return returnValue;
		}
		if(((Persistable)thisObj).getId().source instanceof HttpJsonSource) {
			if(!("client".equals(runAt) || "system".equals(runAt) || "system".equals(runAt))){
			  	return ((HttpJsonSource)((Persistable)thisObj).getId().source).executeRPC(((Persistable)thisObj).getId(), methodName, args);
			}
		}
		return innerFunction.call(cx, scope, thisObj, args);
	}
	public static long startTiming(){
		long startTime = System.nanoTime();
		LinkedList<Long> currentTiming = currentTimings.get();
		if(currentTiming == null){
			currentTiming = new LinkedList<Long>();
			currentTimings.set(currentTiming);
		}
		if(!currentTiming.isEmpty()) {
			long lastTime = currentTiming.removeLast();
			currentTiming.add(startTime - lastTime);
		}
		currentTiming.add(startTime);
		return startTime;
	}
	public static void stopTiming(long startTime, Method method){
		LinkedList<Long> currentTiming = currentTimings.get();
		if(currentTiming != null){
			long now = System.nanoTime();
			Timing timing = timings.get(method);
			if(timing == null) {
				timing = new Timing();
				timings.put(method, timing);
			}
			timing.total += now - startTime;
			long own = now - currentTiming.removeLast();
			timing.own += own;
			timing.max = Math.max(timing.max, own);
			timing.calls++;
			if(!currentTiming.isEmpty()) {
				long lastTime = currentTiming.removeLast();
				currentTiming.add(now - lastTime);
			}
		}

	}
	public String toString(){
		return source;
	}
	public void setName(String name) {
		this.methodName = name;
	}
	public int getArity() {
		return innerFunction.getArity();
	}

	public String getClassName() {
		return innerFunction.getClassName();
	}

	public String getFunctionName() {
		return innerFunction.getFunctionName();
	}
	public Object getDefaultValue(Class typeHint){
		if (typeHint == ScriptRuntime.FunctionClass)
			return innerFunction;
		return super.getDefaultValue(typeHint);
	}

}
