package org.persvr.job;

import org.persvr.data.DataSourceManager;

public class OrphanPurger implements Job {
	public void execute() {
		DataSourceManager.purgeAllOrphans();
	}
}
