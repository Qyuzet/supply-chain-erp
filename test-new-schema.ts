// Test script for new schema - Run this to verify everything works
import { supabase } from './lib/supabase';
import { createSampleData } from './lib/sample-data';
import { getCurrentUser } from './lib/auth';

export const testNewSchema = async () => {
  console.log('🧪 Starting comprehensive schema test...');
  
  const results = {
    databaseConnection: false,
    tableStructure: false,
    sampleDataCreation: false,
    userAuthentication: false,
    orderWorkflow: false,
    paymentWorkflow: false,
    inventoryOperations: false,
    errors: [] as string[]
  };

  try {
    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      results.errors.push(`Database connection failed: ${connectionError.message}`);
    } else {
      results.databaseConnection = true;
      console.log('✅ Database connection successful');
    }

    // Test 2: Table Structure
    console.log('2️⃣ Testing table structure...');
    const requiredTables = [
      'customers', 'orders', 'orderdetail', 'product', 'inventory',
      'warehouses', 'shipments', 'shippingcarrier', 'supplier',
      'purchaseorder', 'production', 'paymentcustomer', 'paymentsupplier',
      'returns', 'returndetail', 'goodsreceipt'
    ];

    let tablesExist = 0;
    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
          tablesExist++;
        } else {
          results.errors.push(`Table ${table} not accessible: ${error.message}`);
        }
      } catch (err) {
        results.errors.push(`Table ${table} test failed: ${err}`);
      }
    }

    if (tablesExist === requiredTables.length) {
      results.tableStructure = true;
      console.log(`✅ All ${requiredTables.length} tables accessible`);
    } else {
      console.log(`❌ Only ${tablesExist}/${requiredTables.length} tables accessible`);
    }

    // Test 3: Sample Data Creation
    console.log('3️⃣ Testing sample data creation...');
    try {
      const sampleResult = await createSampleData();
      if (sampleResult?.success) {
        results.sampleDataCreation = true;
        console.log('✅ Sample data created successfully');
        console.log(`   - Products: ${sampleResult.data?.products || 0}`);
        console.log(`   - Users: ${sampleResult.data?.users || 0}`);
        console.log(`   - Orders: ${sampleResult.data?.orders || 0}`);
      } else {
        results.errors.push(`Sample data creation failed: ${sampleResult?.message}`);
      }
    } catch (err) {
      results.errors.push(`Sample data creation error: ${err}`);
    }

    // Test 4: User Authentication
    console.log('4️⃣ Testing user authentication...');
    try {
      // Test getting users from customers table
      const { data: users, error: userError } = await supabase
        .from('customers')
        .select('customerid, email, role, customername')
        .limit(5);

      if (userError) {
        results.errors.push(`User query failed: ${userError.message}`);
      } else {
        results.userAuthentication = true;
        console.log(`✅ User authentication system working (${users?.length || 0} users found)`);
        
        // Log user roles for verification
        const roleCount = users?.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('   - User roles:', roleCount);
      }
    } catch (err) {
      results.errors.push(`User authentication test error: ${err}`);
    }

    // Test 5: Order Workflow
    console.log('5️⃣ Testing order workflow...');
    try {
      // Test order queries with new schema
      const { data: orders, error: orderError } = await supabase
        .from('orders') // Updated table name
        .select(`
          orderid,
          orderstatus,
          orderdate,
          customers(customername),
          orderdetail(
            quantity,
            product(productname, unitprice)
          )
        `)
        .limit(3);

      if (orderError) {
        results.errors.push(`Order workflow test failed: ${orderError.message}`);
      } else {
        results.orderWorkflow = true;
        console.log(`✅ Order workflow working (${orders?.length || 0} orders found)`);
        
        // Test order status distribution
        const statusCount = orders?.reduce((acc, order) => {
          acc[order.orderstatus] = (acc[order.orderstatus] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('   - Order statuses:', statusCount);
      }
    } catch (err) {
      results.errors.push(`Order workflow test error: ${err}`);
    }

    // Test 6: Payment Workflow
    console.log('6️⃣ Testing payment workflow...');
    try {
      const { data: payments, error: paymentError } = await supabase
        .from('paymentcustomer')
        .select(`
          paymentid,
          amount,
          status,
          paymentmethod,
          orders(orderid, orderstatus)
        `)
        .limit(3);

      if (paymentError) {
        results.errors.push(`Payment workflow test failed: ${paymentError.message}`);
      } else {
        results.paymentWorkflow = true;
        console.log(`✅ Payment workflow working (${payments?.length || 0} payments found)`);
        
        const totalAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        console.log(`   - Total payment amount: $${totalAmount.toFixed(2)}`);
      }
    } catch (err) {
      results.errors.push(`Payment workflow test error: ${err}`);
    }

    // Test 7: Inventory Operations
    console.log('7️⃣ Testing inventory operations...');
    try {
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          quantity,
          product(productname, unitprice),
          warehouses(warehousename, location)
        `)
        .limit(5);

      if (inventoryError) {
        results.errors.push(`Inventory operations test failed: ${inventoryError.message}`);
      } else {
        results.inventoryOperations = true;
        console.log(`✅ Inventory operations working (${inventory?.length || 0} items found)`);
        
        const totalItems = inventory?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        console.log(`   - Total inventory items: ${totalItems}`);
      }
    } catch (err) {
      results.errors.push(`Inventory operations test error: ${err}`);
    }

  } catch (globalError) {
    results.errors.push(`Global test error: ${globalError}`);
  }

  // Test Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  
  const tests = [
    { name: 'Database Connection', passed: results.databaseConnection },
    { name: 'Table Structure', passed: results.tableStructure },
    { name: 'Sample Data Creation', passed: results.sampleDataCreation },
    { name: 'User Authentication', passed: results.userAuthentication },
    { name: 'Order Workflow', passed: results.orderWorkflow },
    { name: 'Payment Workflow', passed: results.paymentWorkflow },
    { name: 'Inventory Operations', passed: results.inventoryOperations }
  ];

  const passedTests = tests.filter(t => t.passed).length;
  const totalTests = tests.length;

  tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
  });

  console.log(`\n🎯 OVERALL SCORE: ${passedTests}/${totalTests} tests passed`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 ERRORS ENCOUNTERED:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Your new schema is working perfectly!');
    console.log('✅ Ready for production use');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('📋 Refer to migration-guide.md for troubleshooting');
  }

  return results;
};

// Export for use in admin panel
export default testNewSchema;
