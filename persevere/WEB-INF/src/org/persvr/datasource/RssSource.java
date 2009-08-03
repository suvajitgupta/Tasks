package org.persvr.datasource;

import org.w3c.dom.Element;
import org.persvr.data.*;
/**
 * With this class you can make an RSS feed be a Persevere DataSource 
 * @author Kris
 *
 */
public class RssSource extends XmlSource {

	@Override
	protected Element getElementById(String id) {
		if ("".equals(id))
			return (Element) doc.getDocumentElement().getElementsByTagName("channel").item(0);
		return super.getElementById(id);
	}

	/*@Override
	protected Object convertStringToObject(String value) {
		if (value.startsWith("http://")) 
			return ObjectId.idForObject(HttpPageSource.instance, value);
		
		return super.convertStringToObject(value);
	}*/
	
}
