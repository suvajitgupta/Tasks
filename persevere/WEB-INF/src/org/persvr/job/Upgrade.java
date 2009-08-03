package org.persvr.job;


import org.persvr.security.CapabilityUser;

public class Upgrade implements Job {

	public void execute() {
		InstallStarterFiles starterFiles = new InstallStarterFiles();
		starterFiles.execute();
		CapabilityUser.resetSecurity();
		SampleData sampleData = new SampleData();
		sampleData.execute();
	}

}
