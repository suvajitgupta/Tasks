package org.persvr.rpc;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.ScriptRuntime;
import org.persvr.data.GlobalData;
import org.persvr.data.Method;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableObject;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.remote.Client;
import org.persvr.remote.PersevereFilter;
import org.persvr.security.PermissionLevel;

public class RPCall extends RPCMessage{
	protected String functionName;
	protected Persistable target;
	protected Object[] parameters;
	private static int nextId = 1;

	public RPCall(Persistable target, String functionName, Object[] parameters) {
		super();
		id = "call" + nextId++;
		this.target = target;
		this.functionName = functionName;
		this.parameters = parameters;
	}
	public RPCall(Persistable target, String functionName, Object[] parameters, Object id) {
		super();
		this.id = id;
		this.target = target;
		this.functionName = functionName;
		this.parameters = parameters;
	}

	public String getFunctionName() {
		return functionName;
	}

	public Object[] getParameters() {
		return parameters;
	}

	public Persistable getTarget() {
		return target;
	}
	public static final Object SUSPENDED = new Object();

	/**
	 * Executes the Remote Procedure call on the server. It will generate a response when finished
	 *
	 */
	public void executeLocally(){
		try {
			if (target == null)
    			throw new RuntimeException("Can not execute a procedure without an object defined");
			PersistableObject.checkSecurity(target, PermissionLevel.EXECUTE_LEVEL.level);
			Object jsMethod = target.get(functionName);
			if (jsMethod instanceof Function) {
				Object retValue;
	    		Client.getCurrentObjectResponse().performedClientInitiatedCall = true;

				if(jsMethod instanceof Method) 
					retValue= ((Method)jsMethod).call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), target, parameters, false);
				else
					retValue = ((Function)jsMethod).call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), target, parameters);
				if (retValue == SUSPENDED)
					return;
				else
					Client.getCurrentObjectResponse().sendMessage(new RPCResponse(id,retValue,null));
				return;
			}
			else {
				throw new RuntimeException("There is no method " + functionName + " on " + target);
			}
		}
		catch (Throwable e) {
			Log log = LogFactory.getLog(RPCall.class);

			if(e instanceof RhinoException)
				log.warn(((RhinoException)e).details() + '\n' + ((RhinoException)e).getScriptStackTrace());
			else
				log.warn("", e);
			Client.getCurrentObjectResponse().sendMessage(new RPCResponse(id,null,"" + e.getMessage()));
		}
	}
}
