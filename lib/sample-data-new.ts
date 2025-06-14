import { supabase } from './supabase';

export const createSampleData = async () => {
  try {
    console.log('Creating comprehensive sample data for new schema...');

    // Check if sample data already exists
    const { data: existingProducts } = await supabase
      .from('product')
      .select('productid')
      .limit(1);

    if (existingProducts && existingProducts.length > 0) {
      console.log('Sample data already exists');
      return {
        success: true,
        message: 'Sample data already exists',
        data: { existing: true }
      };
    }

    // Get warehouse IDs
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('warehouseid, warehousename');

    if (!warehouses || warehouses.length === 0) {
      console.log('No warehouses found, skipping sample data creation');
      return;
    }

    // Create sample supplier user in customers table
    const { data: supplierUser, error: supplierUserError } = await supabase
      .from('customers')
      .insert({
        email: 'supplier@example.com',
        fullname: 'Sample Supplier',
        customername: 'Sample Supplier Co.',
        role: 'supplier',
        phone: '+1-555-0001',
        address: '456 Supplier St, Business City, BC 12345',
        isactive: true,
      })
      .select()
      .single();

    if (supplierUserError) {
      console.error('Error creating supplier user:', supplierUserError);
      return;
    }

    // Create supplier profile
    const { data: supplierProfile, error: supplierProfileError } = await supabase
      .from('supplier')
      .insert({
        userid: supplierUser.customerid,
        suppliername: 'Sample Supplier Co.',
      })
      .select()
      .single();

    if (supplierProfileError) {
      console.error('Error creating supplier profile:', supplierProfileError);
      return;
    }

    // Create sample products
    const sampleProducts = [
      {
        productname: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        unitprice: 199.99,
        supplierid: supplierProfile.supplierid,
      },
      {
        productname: 'Smartphone Case',
        description: 'Protective case for smartphones',
        unitprice: 29.99,
        supplierid: supplierProfile.supplierid,
      },
      {
        productname: 'USB Cable',
        description: 'High-speed USB-C cable',
        unitprice: 19.99,
        supplierid: supplierProfile.supplierid,
      },
      {
        productname: 'Bluetooth Speaker',
        description: 'Portable Bluetooth speaker with excellent sound quality',
        unitprice: 89.99,
        supplierid: supplierProfile.supplierid,
      },
      {
        productname: 'Laptop Stand',
        description: 'Adjustable laptop stand for ergonomic working',
        unitprice: 49.99,
        supplierid: supplierProfile.supplierid,
      },
    ];

    const { data: products, error: productsError } = await supabase
      .from('product')
      .insert(sampleProducts)
      .select();

    if (productsError) {
      console.error('Error creating products:', productsError);
      return;
    }

    // Create sample inventory for each product in each warehouse
    const inventoryData = [];
    for (const product of products || []) {
      for (const warehouse of warehouses) {
        inventoryData.push({
          productid: product.productid,
          warehouseid: warehouse.warehouseid,
          quantity: Math.floor(Math.random() * 100) + 10, // Random quantity between 10-110
        });
      }
    }

    const { error: inventoryError } = await supabase
      .from('inventory')
      .insert(inventoryData);

    if (inventoryError) {
      console.error('Error creating inventory:', inventoryError);
      return;
    }

    // Create sample customer user
    const { data: customerUser, error: customerUserError } = await supabase
      .from('customers')
      .insert({
        email: 'customer@example.com',
        fullname: 'Sample Customer',
        customername: 'Sample Customer',
        role: 'customer',
        phone: '+1-555-0123',
        address: '123 Main St, Anytown, USA',
        isactive: true,
      })
      .select()
      .single();

    if (customerUserError) {
      console.error('Error creating customer user:', customerUserError);
      return;
    }

    // Create sample warehouse user
    const { data: warehouseUser, error: warehouseUserError } = await supabase
      .from('customers')
      .insert({
        email: 'warehouse@example.com',
        fullname: 'Warehouse Manager',
        customername: 'Warehouse Manager',
        role: 'warehouse',
        phone: '+1-555-0002',
        address: '789 Warehouse Ave, Storage City, SC 12345',
        isactive: true,
      })
      .select()
      .single();

    if (warehouseUserError) {
      console.error('Error creating warehouse user:', warehouseUserError);
      return;
    }

    // Create sample carrier user
    const { data: carrierUser, error: carrierUserError } = await supabase
      .from('customers')
      .insert({
        email: 'carrier@example.com',
        fullname: 'Delivery Driver',
        customername: 'Delivery Driver',
        role: 'carrier',
        phone: '+1-555-0003',
        address: '321 Delivery Rd, Transport Town, TT 12345',
        isactive: true,
      })
      .select()
      .single();

    if (carrierUserError) {
      console.error('Error creating carrier user:', carrierUserError);
      return;
    }

    // Create sample orders (using new table name)
    const { data: sampleOrder, error: orderError } = await supabase
      .from('orders') // Updated table name
      .insert({
        customerid: customerUser.customerid,
        orderstatus: 'pending', // Updated field name
        expecteddeliverydate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return;
    }

    // Create order details
    const orderDetails = products?.slice(0, 3).map(product => ({
      orderid: sampleOrder.orderid,
      productid: product.productid,
      quantity: Math.floor(Math.random() * 3) + 1, // Random quantity 1-3
    })) || [];

    const { error: orderDetailsError } = await supabase
      .from('orderdetail')
      .insert(orderDetails);

    if (orderDetailsError) {
      console.error('Error creating order details:', orderDetailsError);
      return;
    }

    // Create sample purchase order
    const { data: purchaseOrder, error: poError } = await supabase
      .from('purchaseorder')
      .insert({
        supplierid: supplierProfile.supplierid,
        status: 'pending',
        totalamount: 1500.00,
      })
      .select()
      .single();

    if (poError) {
      console.error('Error creating purchase order:', poError);
      return;
    }

    console.log('Sample data created successfully!');
    return {
      success: true,
      message: 'Sample data created successfully',
      data: {
        products: products?.length || 0,
        inventory: inventoryData.length,
        orders: 1,
        purchaseOrders: 1,
        users: 4 // supplier, customer, warehouse, carrier
      }
    };

  } catch (error) {
    console.error('Error creating sample data:', error);
    return {
      success: false,
      message: 'Failed to create sample data',
      error: error
    };
  }
};
