package org.persvr.remote;

import java.util.Date;

import org.mozilla.javascript.Scriptable;
import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.util.JSON;

public class JsponSender {
	public static String objectToString(Object value) {//TODO: make the second parameter unnecesssary

		String valueString;
		if (value instanceof String) {
				return JSON.quote((String) value);
		} 
		else if (value instanceof Number || value instanceof Boolean)
			return value.toString();
		else if (value instanceof Date) {
			return "\"@" + ((Date) value).getTime() + "@\"";
		}
		else if (value == null)
			return "null";
		else if (value instanceof RemoteScript) {
			valueString = ((RemoteScript)value).getScriptText();
		}
		else if (value instanceof ObjectId) 
			throw new RuntimeException("can not directly handle objectId");
		else {  
			if (value == Scriptable.NOT_FOUND)
				return "undefined"; 
			System.err.println("Can not output an object of type "
					+ value.getClass() + " to JSON");
			valueString = "\"DataNotFoundInstance\""; 
		} 
		return valueString; 
	} 
	public static String persistableToString(Persistable value) {//TODO: make the second parameter unnecesssary
		return "";
	}
	static String staticSendField(Object key, Object value) {
		return "\n\"" + key.toString() + "\":" + objectToString(value);
	}

}
