package org.persvr.remote;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.util.Date;
import java.util.List;

import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.IdFunctionObject;
import org.mozilla.javascript.Scriptable;
import org.persvr.Persevere;
import org.persvr.data.Persistable;
import org.persvr.data.QueryCollection;
import org.persvr.data.GlobalData.PersistableConstructor;
import org.persvr.remote.Client.IndividualRequest;
import org.persvr.remote.DataSerializer.Request.SerializerFeature;
import org.persvr.util.JSON;

public class JavaScriptSerializer extends JSONSerializer {
	public boolean match(String accept) {
		return true;
	}
	public String getContentType() {
		return "application/javascript; charset=UTF-8; locator=id";
	}
	
	@Override
	public void serialize(Object value,Request request, Writer writer) {
		Serialization serialization = new JavaScriptSerialization();
		serialization.request = request;
		try {
			if (value instanceof Persistable) {
				if (value instanceof List && request instanceof IndividualRequest){
					value = convertToCollectionContainerIfNeeded((List)value, (IndividualRequest) request);
				}
				setSchemaMediaTypeParameter(value, request);

				if(value instanceof List && request instanceof IndividualRequest && ((IndividualRequest)request).possibleUnauthorizedGet) {
					// in this case, this could be an unauthorized cross-site access attempt (CSRF), we don't want it to be possible to JSON hijack it
					writer.write("{}&&");
					serialization.writeValue(writer, value, false);
				}
				else if (value instanceof Scriptable && !(value instanceof List)) {
					// we are confident that it is a same-origin request, make it standard JS form
					writer.append('(');
					try{
						serialization.writeValue(writer, value, false);
					}finally{
						if(!(writer instanceof DirtyOutputStreamWriter) || ((DirtyOutputStreamWriter)writer).isDirty) {
							writer.write(")");
							writer.flush();
						}
					}
				}
				else
					serialization.writeValue(writer, value, false);
			}
			else
				serialization.writeValue(writer, value, false);
		} catch (UnsupportedEncodingException e) {
			throw new RuntimeException(e);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	protected class JavaScriptSerialization extends Serialization {
		protected String serializeFunction(BaseFunction function) {
			if(function instanceof IdFunctionObject || function instanceof PersistableConstructor){
				// primitive class
				return function.getFunctionName();
			}
			String functionToString = function.toString();
			if(request.getFeature(SerializerFeature.IncludeToStringSource)){
				return "(function(){var func = " + functionToString + ";\nfunc.toString = function(){ return " + JSON.quote(functionToString) + ";};\nreturn func;})()";
			}
			else {
				return functionToString;
			}
		}
		
		protected String undefined(){
			return "undefined";
		}
		protected String serializeDate(Date date){
			return "new Date(" + date.getTime() + ")";
		}
	}

}
