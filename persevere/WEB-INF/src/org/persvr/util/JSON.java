package org.persvr.util;

import java.text.CharacterIterator;
import java.text.StringCharacterIterator;
import java.util.List;
import java.util.Map;

import org.mozilla.javascript.IdFunctionObject;
import org.mozilla.javascript.Undefined;
import org.persvr.remote.JSONFunction;

/**
 * JSON parser and serializer
 * @author Kris
 *
 */
public class JSON {
	public static Object parse(String json){
		return new JSONParser().read(json);
	}
    static char[] hex = "0123456789ABCDEF".toCharArray();
	public static String quote(String str){
		if(str == null)
			return "null";
		StringBuffer sb = new StringBuffer();
		sb.append('"');
        CharacterIterator it = new StringCharacterIterator(str);
        for (char c = it.first(); c != CharacterIterator.DONE; c = it.next()) {
            if (c == '"') sb.append("\\\"");
            else if (c == '\\') sb.append("\\\\");
            else if (c == '\b') sb.append("\\b");
            else if (c == '\f') sb.append("\\f");
            else if (c == '\n') sb.append("\\n");
            else if (c == '\r') sb.append("\\r");
            else if (c == '\t') sb.append("\\t");
            else if (Character.isISOControl(c)) {
            	sb.append("\\u");
                int n = c;
                for (int i = 0; i < 4; ++i) {
                    int digit = (n & 0xf000) >> 12;
                	sb.append(hex[digit]);
                    n <<= 4;
                }
            } else {
            	sb.append(c);
            }
        }
        sb.append('"');
        return sb.toString();
	}
	public static String serialize(Object obj){
		if(obj instanceof String)
			return quote((String)obj);
		if(obj instanceof Number || obj instanceof Boolean || obj instanceof JSONFunction)
			return obj.toString();
		if(obj == null)
			return "null";
		StringBuffer sb = new StringBuffer();
		if(obj instanceof Map){
			sb.append("{");
			boolean first = true;
			for (Map.Entry<String,Object> entry : ((Map<String,Object>)obj).entrySet()){
				if(first)
					first = false;
				else
					sb.append(",");
				sb.append(JSON.quote(entry.getKey()) + ":");
				sb.append(serialize(entry.getValue()));
			}
			sb.append("}");	
		}
		else if(obj instanceof List){
			sb.append("[");
			boolean first = true;
			for (Object item : ((List) obj)){
				if(first)
					first = false;
				else
					sb.append(",");
				sb.append(serialize(item));
			}
			sb.append("]");	
		}else if(obj instanceof IdFunctionObject){
			return ((IdFunctionObject)obj).getFunctionName();
		}
		else if (obj == Undefined.instance){
			return "undefined";
		}
		else throw new RuntimeException("Can not serialize " + obj);
		return sb.toString();
	}
}
