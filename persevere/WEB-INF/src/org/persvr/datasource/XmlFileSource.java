package org.persvr.datasource;

import java.io.FileOutputStream;

import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.persvr.data.Persistable;


/**
 * Exposes an XML file as a read/write data source.
 * @author Kris
 *
 */
public class XmlFileSource extends WritableXmlSource {
	boolean writeOccured = false;
    @Override 
	protected synchronized void saveXml() {
        try {
            writeOccured = false;
            System.out.println("Writing XML file: " + getUrl());
            //File tempDest = File.createTempFile("temp","xml");
            FileOutputStream xmlFOS = new FileOutputStream(file, false);
            
            /*OutputFormat format = new OutputFormat(doc);

            //format.setIndenting(true);
            //format.setIndent(1);
            //format.setLineWidth(0);
            //We comment this out to get pretty formatting, uncomment it to preserve white space
            format.setPreserveSpace(true);
            format.setEncoding("UTF-8");*/
            TransformerFactory transformerFactory =
        	TransformerFactory.newInstance ();
        	Transformer transformer = transformerFactory.newTransformer();

        	transformer.setOutputProperty(javax.xml.transform. OutputKeys.INDENT,"yes");
        	transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount","4");

        	StreamResult result = new StreamResult(xmlFOS);
        	transformer.transform(new DOMSource(doc),result);
        	
/*        	XMLSerializer xmlSerializer = new XMLSerializer(xmlFOS,format);  // output to the file using the specified formatting
            xmlSerializer.startPreserving();
            xmlSerializer.serialize(doc);  // serialize the document*/
            xmlFOS.close();
            /*File tempOldFile = new File("temp.xml");
            file.renameTo(tempOldFile);
            tempDest.renameTo(file);
            tempOldFile.delete();*/
            lastModified = file.lastModified();
        }
        catch (Exception e) {
            e.printStackTrace();
        }

    }

}
