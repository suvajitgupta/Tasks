package org.persvr.util;

import java.util.Collection;


public class JsponEncoding {
    /*public static StringEncoder javascriptStringEncoder = new StringEncoder();
    static {
        javascriptStringEncoder.setUnsafeStrings(new String[] {"\\\"","\\n","\\r"}, new String[] {"\\\\\"","\\\\n","\\\\r"});
    }
	public static String encode(String string) {
		string = javascriptStringEncoder.encode(string); // TODO: This needs to be faster
		HsqlByteArrayOutputStream os = new HsqlByteArrayOutputStream(); 
		
		StringConverter.unicodeToAscii(os,string,false);
		string = os.toString();
		return string;
	}*/
	public interface ItemHandler {
		public String handleItem(Object item);
	}
	public static String makeList(Collection objects, ItemHandler handler) {
		StringBuffer buffer = new StringBuffer("[");
		boolean firstOne = true;
		for (Object object: objects) {
			if (firstOne) 
				firstOne = false;
			else
				buffer.append(",");
			buffer.append(handler.handleItem(object));
		}
		buffer.append("]");
		return buffer.toString();
	}
}
