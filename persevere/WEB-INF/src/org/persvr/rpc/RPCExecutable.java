package org.persvr.rpc;

import java.lang.annotation.Annotation;



public class RPCExecutable implements Annotation {
	public Class<? extends Annotation> annotationType() {
		return RPCExecutable.class;
	}

	public boolean executable() {
		return true;
	}
}
