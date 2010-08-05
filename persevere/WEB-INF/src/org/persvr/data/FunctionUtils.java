package org.persvr.data;

import java.util.HashMap;
import java.util.Map;

import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.ScriptRuntime;
import org.persvr.javascript.PersevereContextFactory;
/**
 * Helper class for handling JS functions
 * @author Kris
 *
 */
public class FunctionUtils {
	private FunctionUtils(){}
	
	/**
	 * Get the source of a function
	 * @param function
	 * @return
	 */
	public static String getSource(Function function) {
		return function.toString();
	}
    static Persistable defaultSchema;
    public static Persistable getMethodDefinition(Persistable thisObj, String methodName) {
    	if(methodName == null)
    		return null;
    	if(thisObj instanceof PersistableClass){
			Object methods = thisObj.get("staticMethods");
			if (methods instanceof Persistable){
				Object staticMethodDef = ((Persistable)methods).get(methodName);
				if (staticMethodDef instanceof Persistable){
					return (Persistable) staticMethodDef;
				}
			}
    	}
    	Persistable methodDefinition = getMethodDefinitionForSchema(
    			thisObj instanceof SchemaObject ?
    					thisObj.getParent() : 
    					thisObj.getSchema(),
    				methodName);
    	return methodDefinition;
    }
    static Persistable ObjectSchema;
    static Persistable getObjectSchema(){
    	if (ObjectSchema == null)
    		ObjectSchema = ObjectId.idForObject(DataSourceManager.getMetaClassSource(), "Object").getTarget();
    	return ObjectSchema;
    }
    static Persistable getMethodDefinitionForSchema(Persistable schema, String methodName) {
    	if(schema == null){
    		if (defaultSchema == null){
    			defaultSchema = getObjectSchema(); 
    		}
    		schema = defaultSchema;
    		 
    	}
    	while (schema != null){
    		// search the schema hierarchy for a methods definition
			Object methods = schema.get("methods");
			if (methods instanceof Persistable){
				Object methodDefinition = ((Persistable)methods).get(methodName);
				if (methodDefinition instanceof Persistable){
					return (Persistable) methodDefinition;
				}
			}
			Object superType = PersistableClass.getSuperType(schema);
			schema = superType instanceof Persistable ? (Persistable) superType : schema == getObjectSchema() ? null : getObjectSchema();
    	}
		return null;
    }
    public static String getRunAtForMethod(Persistable thisObj, String methodName) {

		Persistable methodDefinition = getMethodDefinition(thisObj, methodName);
		if (methodDefinition != null){
			Object runAt = ((Persistable)methodDefinition).get("runAt");
			if(runAt instanceof String)
				return (String) runAt;
		}
		return null;

    }
	public static Function createFunction(final String source, String name) {
		Context context = PersevereContextFactory.getContext();
		try {
			BaseFunction func = (BaseFunction) context.evaluateString(GlobalData.getGlobalScope(), "(" + source + ")", name, 1, null);
			// store the source so we can retain comments et al
			func.put("source", func, source);
			ScriptRuntime.setObjectProtoAndParent(func,GlobalData.getGlobalScope());
			return func;
		}
		catch (Exception e) {
			System.err.println(e.getMessage());
			return (BaseFunction) context.evaluateString(GlobalData.getGlobalScope(), "(function(){throw new Error('Compilation error in this function')})", name, 1, null);
		}

    }
}
