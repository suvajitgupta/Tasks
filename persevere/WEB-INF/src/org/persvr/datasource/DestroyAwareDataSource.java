/*
 * DestroyAwareDataSource.java
 *
 * Created on May 14, 2009, 9:23 AM
 *
 * 
 */

package org.persvr.datasource;
/**
 * This is an interface to use for data sources that need to free resources prior to being destroyed.
 * 
 */
public interface DestroyAwareDataSource {

    /**
    * Data sources that have the requirement to free resources should implement the destroy method.  An example would be releasing locks on files 
    * used by the data source or the closing of connections prior to the data source being destroyed. 
    */
	public void destroy();	
	
}