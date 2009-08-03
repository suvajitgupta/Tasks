package org.persvr.data;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import org.apache.commons.io.IOUtils;
/**
 * Represents a block of binary data that may be lazily accessed through streams
 * @author Kris
 *
 */
public class BinaryData {
	//TODO: Need to make this be an array-like Scriptable object per ServerJS API for binary data
	byte[] bytes;
	InputStreamSource source;
	/**
	 * Create an instance backed by the given input stream
	 * @param stream
	 */
	public BinaryData(final InputStream stream){
		source = new InputStreamSource(){
			boolean used;
			public InputStream getStream(){
				if(used)
					throw new RuntimeException("Stream already used");
				used = true;
				return stream;
			}
		};
	}
	public BinaryData(InputStreamSource source){
		this.source = source;
	}
	public interface InputStreamSource {
		InputStream getStream();
	}
	/**
	 * Create an instance backed with provided byte array
	 * @param bytes
	 */
	public BinaryData(final byte[] bytes){
		source = new InputStreamSource(){
			public InputStream getStream(){
				return new ByteArrayInputStream(bytes);
			}
		};
		this.bytes = bytes;
	}
	public void setSource(InputStreamSource source){
		this.source = source;
		this.bytes = null;
	}
	public InputStream getStream(){
		return source.getStream();
	};
	public void writeTo(OutputStream out) throws IOException{
		InputStream in = getStream();
		IOUtils.copy(in, out);
	}
	
	@Deprecated
	public byte[] getBytes(){
		// this requires the entire data to be converted to a byte array, not efficient
		if (bytes != null)
			return bytes;
		try {
			return IOUtils.toByteArray(getStream());
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
}
