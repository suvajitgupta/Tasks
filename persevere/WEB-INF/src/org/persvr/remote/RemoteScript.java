package org.persvr.remote;
/**
 * This class is intended to be a value that when serialized as JSON can insert custom text in the outputted JSON text
 * @author Kris Zyp
 *
 */
public class RemoteScript {
	private String scriptText;

	public String getScriptText() {
		return scriptText;
	}

	public void setScriptText(String scriptText) {
		this.scriptText = scriptText;
	}
	
}
