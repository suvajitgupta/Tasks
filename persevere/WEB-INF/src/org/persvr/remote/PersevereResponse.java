package org.persvr.remote;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.Writer;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;

import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.persvr.data.GlobalData;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.remote.Client.IndividualRequest;

public class PersevereResponse extends HttpServletResponseWrapper{

	public PersevereResponse(HttpServletResponse response) {
		super(response);
	}
	public PersevereResponse(HttpServletResponse response, Writer writer) {
		super(response);
		if(writer != null){
			this.writer = writer;
			byteArrayStream = new ByteArrayOutputStream();
		}
	}
	ByteArrayOutputStream byteArrayStream;

	/**
	 * This takes an object and returns a JSPON string representation
	 * @param returnValue The object to output
	 * @return JSPON string representation
	 */
	public String outputReturnObject(Object returnValue)  {
        IndividualRequest requestHandler = Client.getCurrentObjectResponse();
    	return requestHandler.serialize(returnValue);
        //requestHandler.outputWaitingData();
        
	}
	public String outputWaitingResponse() throws IOException {
        IndividualRequest requestHandler = Client.getCurrentObjectResponse();
        return requestHandler.outputWaitingData();

	}
	@Override
	public ServletOutputStream getOutputStream() throws IOException {
		return new RedirectedOutputStream(byteArrayStream == null ? super.getOutputStream() : byteArrayStream);
	}
	@Override
	public PrintWriter getWriter() throws IOException {
		if (printWriter == null)
			printWriter = new PrintWriter(getOutputStream(), true);
		return printWriter;
	}
	@Override
	public void flushBuffer() throws IOException {
		if (printWriter != null)
			printWriter.flush();
		if(byteArrayStream != null){
			writer.write(byteArrayStream.toString());
			writer.flush();
		}
		try{
			super.flushBuffer();
		}catch(IOException e){
			// ignore these exceptions
		}
	}
	
	public static class RedirectedOutputStream extends ServletOutputStream {

		public RedirectedOutputStream(OutputStream stream) {
			this.stream = stream;
		}


		
		public void write(byte b[]) throws IOException {
			stream.write(b);
		}

		
		public void write(byte b[], int off, int len) throws IOException {
			try{
				stream.write(b, off, len);
			}catch(Exception e){
				// we don't need to see the EofExceptions that Jetty produces
			}
		}
		
		public void write(int b) throws IOException {
			stream.write(b);
		}

		private OutputStream stream;

		public void close() throws IOException {
			try{
			stream.close();
			}catch(IOException e){
				// we don't need to see the EofExceptions that Jetty produces
			}
		}



		public boolean equals(Object obj) {
			return stream.equals(obj);
		}



		public void flush() throws IOException {
			stream.flush();
		}



		public int hashCode() {
			return stream.hashCode();
		}



		public void print(boolean arg0) throws IOException {
			stream.write(("" + arg0).getBytes("UTF-8"));
		}



		public void print(char c) throws IOException {
			stream.write(("" + c).getBytes("UTF-8"));
		}



		public void print(double d) throws IOException {
			stream.write(("" + d).getBytes("UTF-8"));
		}



		public void print(float f) throws IOException {
			stream.write(("" + f).getBytes("UTF-8"));
		}



		public void print(int i) throws IOException {
			stream.write(("" + i).getBytes("UTF-8"));
		}



		public void print(long l) throws IOException {
			stream.write(("" + l).getBytes("UTF-8"));
		}



		public void print(String arg0) throws IOException {
			stream.write(("" + arg0).getBytes("UTF-8"));
		}



		public void println() throws IOException {
			stream.write(("\n").getBytes("UTF-8"));
		}



		public void println(boolean b) throws IOException {
			stream.write((b + "\n").getBytes("UTF-8"));
		}



		public void println(char c) throws IOException {
			stream.write((c + "\n").getBytes("UTF-8"));
		}



		public void println(double d) throws IOException {
			stream.write((d + "\n").getBytes("UTF-8"));
		}



		public void println(float f) throws IOException {
			stream.write((f + "\n").getBytes("UTF-8"));
		}



		public void println(int i) throws IOException {
			stream.write((i + "\n").getBytes("UTF-8"));
		}



		public void println(long l) throws IOException {
			stream.write((l + "\n").getBytes("UTF-8"));
		}



		public void println(String s) throws IOException {
			stream.write((s + "\n").getBytes("UTF-8"));
		}



		public String toString() {
			return stream.toString();
		}
	}
	private Writer writer;
	private PrintWriter printWriter;

	@Override
	public void setContentType(String type) {
		if(writer == null)
			super.setContentType(type);
	}
	@Override
	public void setDateHeader(String name, long date) {
		if(writer == null)
			super.setDateHeader(name, date);
	}
	@Override
	public void setHeader(String name, String value) {
		if(writer == null)
			super.setHeader(name, value);
	}
	@Override
	public void setIntHeader(String name, int value) {
		if(writer == null)
			super.setIntHeader(name, value);
	}
	int status;
	@Override
	public void setStatus(int sc, String sm) {
		status = sc;
		super.setStatus(sc, sm);
	}
	@Override
	public void setStatus(int sc) {
		status = sc;
		super.setStatus(sc);
	}
	public int getStatus() {
		return status;
	}
}
