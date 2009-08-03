package org.persvr.util;

import java.io.ByteArrayInputStream;
import java.io.DataInput;
import java.io.DataInputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.RandomAccessFile;
/**
 * This class buffers reads from a RandomAccessFile for much faster access to data
 * @author Kris
 *
 */
public class BufferedDataInput implements DataInput {
	RandomAccessFile raf;
	byte[] buffer = new byte[2048];
	DataInputStream di;
	int pointer = 2048;
	
	int lastRead = 2048;
	public BufferedDataInput(RandomAccessFile raf) throws IOException {
		this.raf = raf;
	}
	private DataInputStream willRead(int length) throws IOException{
		int newPointer = pointer + length;
		if(newPointer > 2048){
			if(pointer < 2048){
				int start = 2048 - pointer;
				System.arraycopy(buffer, pointer, buffer, 0, start);
				lastRead = raf.read(buffer, start, pointer);
				if(lastRead == -1)
					throw new EOFException();
				lastRead += start;
			}
			else{
				lastRead =raf.read(buffer, 0, 2048);
				if(lastRead == -1)
					throw new EOFException();
			}
			pointer = length;
			return di = new DataInputStream(new ByteArrayInputStream(buffer));			
		}
		pointer = newPointer;
		return di;
	}
	public boolean readBoolean() throws IOException {
		return willRead(1).readBoolean(); 
	}
	public void goBackOne() throws IOException {
		di.reset();
		pointer--;
	}
	public void mark() throws IOException {
		di.mark(1);
	}
	public byte readByte() throws IOException {
		return willRead(1).readByte(); 
	}

	public char readChar() throws IOException {
		throw new UnsupportedOperationException();
	}

	public double readDouble() throws IOException {
		return willRead(8).readDouble(); 
	}

	public float readFloat() throws IOException {
		return willRead(4).readFloat(); 
	}
	public String readString() throws IOException {
		int length = readInt();
		if(length < 2048){
			willRead(length);
			di.skipBytes(length);
			//read right from the buffer
			return new String(buffer, pointer - length, length, "UTF-8");
		}
		byte[] bytes = new byte[length];
		raf.readFully(bytes);
		return new String(bytes, "UTF-8");
	}

	public void readFully(byte[] b) throws IOException {
		readFully(b, 0, b.length);	
	}

	public void readFully(byte[] b, int off, int len) throws IOException {
		if(len < 2048){
			willRead(len);
			di.skipBytes(len);
			//read right from the buffer
			System.arraycopy(buffer, pointer - len, b, off, len);
			return;
			
		}
		raf.seek(raf.getFilePointer() + pointer - 2048);
		pointer = 2048; // reset it
		raf.readFully(b, off, len);
	}

	public int readInt() throws IOException {
		return willRead(4).readInt();
	}
	public long length() throws IOException {
		return raf.length();
	}
	public long getFilePointer() throws IOException {
		return raf.getFilePointer() + pointer - lastRead; 
	}
	public void seek(long reference) throws IOException {
		raf.seek(reference);
		pointer = 2048;
	}
	public String readLine() throws IOException {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	public long readLong() throws IOException {
		return willRead(8).readLong();
	}

	public short readShort() throws IOException {
		return willRead(2).readShort();
	}

	public String readUTF() throws IOException {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	public int readUnsignedByte() throws IOException {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	public int readUnsignedShort() throws IOException {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	public int skipBytes(int n) throws IOException {
		throw new UnsupportedOperationException("Not implemented yet");
	}

}
