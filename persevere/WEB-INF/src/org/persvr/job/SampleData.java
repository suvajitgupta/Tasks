package org.persvr.job;

import java.util.List;

import org.persvr.Persevere;
import org.persvr.data.ObjectNotFoundException;
import org.persvr.data.Persistable;
import org.persvr.data.Transaction;

public class SampleData implements Job {

	public void execute() {
		try {
			List customers = (List) Persevere.load("Customer/");
			Transaction transaction = Transaction.startTransaction();
			if(customers.size() == 0){
				Persistable customer1 = Persevere.newObject("Customer");
				customer1.set("firstName", "John");
				customer1.set("lastName", "Doe");
				customer1.set("age", 41);
				Persistable customer2 = Persevere.newObject("Customer");
				customer2.set("firstName", "Jim");
				customer2.set("lastName", "Jones");
				customer2.set("age", 33);
			}
			transaction.commit();
		}
		catch (ObjectNotFoundException e){
			
		}
	}

}
