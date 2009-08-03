package org.persvr.datasource;

public interface SourceDeleteAware {
    /**
     * When a source is deleted this is called
     * @throws Exception
     */
    void onDelete() throws Exception;

}
