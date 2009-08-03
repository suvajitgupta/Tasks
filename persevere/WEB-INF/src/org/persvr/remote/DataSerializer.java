package org.persvr.remote;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.nio.charset.Charset;
import java.nio.charset.CharsetEncoder;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.data.GlobalData;
import org.persvr.data.Identification;
import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableObject;
import org.persvr.javascript.PersevereContextFactory;

public abstract class DataSerializer {
	public abstract void serialize(Object value, Request request, Writer writer);
	public abstract boolean match(String accept);
	static SimpleDateFormat ISO_SDF = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
	public abstract String getContentType();
	/**
	 * This takes an object and returns a string representation
	 * @param value The object to output
	 */
	public static void serialize(Object value, String acceptTypeHeader){
		serialize(value, acceptTypeHeader, true);
	}
	public static void serialize(Object value, String acceptTypeHeader, boolean setType){
		ScriptableObject object;
		if (value instanceof Persistable){
			object = ((ScriptableObject)value);
		}else{
			object = (ScriptableObject) ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Object");
		}
			
		Scriptable bestRep = null;
		double bestQuality = 0;
		String bestType = null;
		if(acceptTypeHeader==null)
			acceptTypeHeader = "*/*";
		String[] acceptTypes = acceptTypeHeader.split("\\s*,\\s*");
		PersistableObject.enableSecurity(false);
		Client.getCurrentObjectResponse().requestRoot = value;
		for (String acceptType : acceptTypes){
			String[] parts = acceptType.split("\\s*;\\s*");
			String type = parts[0];
			double clientQuality = 1;
			for(String part: parts){
				if(part.startsWith("q=")){
					try {
						clientQuality = Double.parseDouble(part.substring(2));
					} catch (NumberFormatException e) {
						e.printStackTrace();
					}
				}
			}
			if("*/*".equals(type)){
				ScriptableObject proto = object;
				do {
					for (Map.Entry<String,Object> entry : PersistableObject.entrySet(proto, 5)){
						if(entry.getKey().startsWith("representation:")){
							Object rep = entry.getValue();
							if(rep instanceof ObjectId){
								rep = ((ObjectId)rep).getTarget();
							}
							if(rep instanceof Scriptable){
								Number serverQuality = (Number) ScriptableObject.getProperty((Scriptable)rep,"quality");
								double quality = serverQuality.doubleValue() + clientQuality;
								if(quality > bestQuality){
									bestRep = (Scriptable) rep;
									bestQuality = quality;
									bestType = entry.getKey().substring("representation:".length()); 
								}
							}
							
						}
					}
					proto = (ScriptableObject) proto.getPrototype();
					
				}while(proto != null);
				
			}
			else{
				Object rep = ScriptableObject.getProperty(object,"representation:" + type);
				if(rep instanceof Scriptable){
					Number serverQuality = (Number) ScriptableObject.getProperty((Scriptable)rep, "quality");
					double quality = serverQuality.doubleValue() + clientQuality;
					if(quality > bestQuality){
						bestRep = (Scriptable) rep;
						bestQuality = quality;
						bestType = type; 
					}
				}
			}
		}
		HttpServletResponse response = Client.getCurrentObjectResponse().getHttpResponse();
		if(bestRep != null){
			Function getContentType = (Function) ScriptableObject.getProperty(bestRep, "output");
			PersistableObject.enableSecurity(true);
			if(response != null && setType) {
				response.setContentType(bestType + "; charset=UTF-8");
			}
			getContentType.call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), bestRep, new Object[]{value});
			return;
		}
		
		response.setStatus(406);
		try {
			response.getOutputStream().print("No acceptable MIME type was specified in the Accept header, it is recommended that you include */* in the Accept header to get the best representation.");
		} catch (IOException e) {
			e.printStackTrace();
		}

	}
	public interface Request{
		public String idString(Identification id);
		public boolean shouldSerialize(Persistable obj);
		/**
		 * 
		 * @param obj
		 * @return First value should be starting index, the second should be the ending index
		 */
		public int[] getIndexRange(List obj);
		public enum SerializerFeature {
			IncludeServerMethods, IncludeToStringSource;
		}
		public boolean getFeature(SerializerFeature feature);
	}
	public static class DirtyOutputStreamWriter extends OutputStreamWriter {
		public boolean isDirty = false;
		public DirtyOutputStreamWriter(OutputStream out, String charsetName) throws UnsupportedEncodingException {
			super(out, charsetName);
			// TODO Auto-generated constructor stub
		}
		@Override
		public void write(String arg0) throws IOException {
			isDirty = true;
			super.write(arg0);
		}
		public void flushIfDirty() throws IOException {
			if(isDirty){
				flush();
			}
		}
	}
}
