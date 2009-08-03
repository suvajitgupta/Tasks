/*
 * StringUtil.java
 *
 * Created on August 11, 2005, 1:33 PM
 *
 * To change this basis, choose Tools | Options and locate the basis under
 * the Source Creation and Management node. Right-click the basis and choose
 * Open. You can then make changes to the basis in the Source Editor.
 */

package org.persvr.util;

/**
 *
 * @author Kris Zyp
 */
public class StringEncoder {
    String escapeString = "\\\\";
    String[] unsafeStrings = new String[0];
    String[] replacementStrings = new String[0];
    String delimiter;
    /** Creates a new instance of StringUtil */
    public StringEncoder() {
    }
    public void setUnsafeStrings(String[] unsafeStrings, String[] replacementStrings) {
        this.unsafeStrings = unsafeStrings;
        this.replacementStrings = replacementStrings;
    }
    public void setEscapeString(String escapeString) {
        this.escapeString = escapeString;
    }
    public void setDilimiter(String delimiter) {
        this.delimiter = delimiter;
    }
    public String encode(String string) {
        string = string.replaceAll(escapeString, escapeString + escapeString);
        for (int i = 0; i < unsafeStrings.length; i++) {
            string = string.replaceAll(unsafeStrings[i] +"",replacementStrings[i]);
        }
        return string;
    }
    public String decode(String string) {
        for (int i = 0; i < unsafeStrings.length; i++) {
            string = string.replaceAll(replacementStrings[i],unsafeStrings[i] +"");
        }
        return string.replaceAll(escapeString + escapeString,escapeString);
    }


}
