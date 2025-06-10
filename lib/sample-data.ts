import { supabase } from './supabase';

export const createSampleData = async () => {
  try {
    console.log('Creating comprehensive sample data...');

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

    // Create sample supplier user and profile
    const { data: supplierUser, error: supplierUserError } = await supabase
      .from('users')
      .insert({
        email: 'supplier@example.com',
        fullname: 'Sample Supplier',
        role: 'supplier',
        isactive: true,
      })
      .select()
      .single();

    if (supplierUserError) {
      console.error('Error creating supplier user:', supplierUserError);
      return;
    }

    const { data: supplierProfile, error: supplierProfileError } = await supabase
      .from('supplier')
      .insert({
        userid: supplierUser.userid,
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

    // Create sample customer user and profile
    const { data: customerUser, error: customerUserError } = await supabase
      .from('users')
      .insert({
        email: 'customer@example.com',
        fullname: 'Sample Customer',
        role: 'customer',
        isactive: true,
      })
      .select()
      .single();

    if (customerUserError) {
      console.error('Error creating customer user:', customerUserError);
      return;
    }

    const { data: customerProfile, error: customerProfileError } = await supabase
      .from('customers')
      .insert({
        userid: customerUser.userid,
        customername: 'Sample Customer',
        phone: '+1-555-0123',
        address: '123 Main St, Anytown, USA',
      })
      .select()
      .single();

    if (customerProfileError) {
      console.error('Error creating customer profile:', customerProfileError);
      return;
    }

    // Create sample orders
    const { data: sampleOrder, error: orderError } = await supabase
      .from('Order')
      .insert({
        customerid: customerProfile.customerid,
        status: 'pending',
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
