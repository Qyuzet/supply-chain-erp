import { supabase } from './supabase';

// Updated interfaces for new schema
export interface Customer {
  customerid: string;
  userid?: string;
  customername: string;
  phone: string;
  address: string;
  role: string;
  passwordhash?: string;
  createdat: string;
  isactive: boolean;
  email: string;
}

export interface Order {
  orderid: string;
  customerid: string;
  orderdate: string;
  expecteddeliverydate?: string;
  orderstatus: string;
}

export interface Product {
  productid: string;
  productname: string;
  description?: string;
  unitprice: number;
  supplierid: string;
}

export interface Shipment {
  shipmentid: string;
  carrierid: string;
  orderid: string;
  warehouseid: string;
  shipmentdate: string;
  trackingnumber?: string;
  shipmentstatus: string;
}

// Updated database operations for new schema
export const customerOperations = {
  // Get customer orders (updated table name)
  getCustomerOrders: async (customerId: string) => {
    const { data, error } = await supabase
      .from('orders') // Updated table name
      .select(`
        *,
        orderdetail(
          *,
          product(
            productid,
            productname,
            unitprice,
            description
          )
        ),
        shipments(
          shipmentid,
          trackingnumber,
          shipmentstatus,
          shippingcarrier(carriername)
        )
      `)
      .eq('customerid', customerId)
      .order('orderdate', { ascending: true }); // FIFO

    if (error) throw error;
    return data;
  },

  // Get customer by email (from customers table)
  getCustomerByEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  },

  // Create customer (simplified - all in customers table)
  createCustomer: async (customerData: Omit<Customer, 'customerid' | 'createdat'>) => {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Removed duplicate - using the more complete version below

export const shipmentOperations = {
  // Get all shipments (updated field name)
  getAllShipments: async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        orders(
          *,
          customers(customername)
        ),
        warehouses(warehousename),
        shippingcarrier(carriername)
      `)
      .order('shipmentdate', { ascending: true }); // FIFO

    if (error) throw error;
    return data;
  },

  // Update shipment status (updated field name)
  updateShipmentStatus: async (shipmentId: string, newStatus: string, trackingNumber?: string) => {
    const updates: any = { shipmentstatus: newStatus }; // Updated field name
    if (trackingNumber) {
      updates.trackingnumber = trackingNumber;
    }

    const { data, error } = await supabase
      .from('shipments')
      .update(updates)
      .eq('shipmentid', shipmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Removed duplicate - keeping the more complete version below

// Helper function to log status changes (updated table names)
export const logStatusChange = async (
  entityType: 'order' | 'purchaseorder' | 'return' | 'production',
  entityId: string,
  oldStatus: string,
  newStatus: string,
  userId: string,
  note?: string
) => {
  const tableMap = {
    order: 'orderstatushistory',
    purchaseorder: 'purchaseorderstatushistory', 
    return: 'returnstatushistory',
    production: 'productionstatuslog'
  };

  const idFieldMap = {
    order: 'orderid',
    purchaseorder: 'purchaseorderid',
    return: 'returnid', 
    production: 'productionorderid'
  };

  const { error } = await supabase
    .from(tableMap[entityType])
    .insert({
      [idFieldMap[entityType]]: entityId,
      oldstatus: oldStatus,
      newstatus: newStatus,
      changedbyuserid: userId,
      note: note || `Status changed from ${oldStatus} to ${newStatus}`
    });

  if (error) {
    console.error('Error logging status change:', error);
    throw error;
  }
};

// Authentication helper (updated for customers table)
export const authOperations = {
  // Get user by ID (from customers table)
  getUserById: async (userId: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('customerid', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Get user by email (from customers table)
  getUserByEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  }
};

// Removed duplicate - keeping the more complete version below

export const productOperations = {
  // Get all products with supplier info
  getAllProducts: async () => {
    const { data, error } = await supabase
      .from('product')
      .select(`
        *,
        supplier(suppliername)
      `)
      .order('productname');

    if (error) throw error;
    return data;
  },

  // Get products for a specific supplier
  getSupplierProducts: async (supplierId: string) => {
    const { data, error } = await supabase
      .from('product')
      .select(`
        *,
        supplier(suppliername)
      `)
      .eq('supplierid', supplierId)
      .order('productname');

    if (error) throw error;
    return data;
  },

  // Create new product
  createProduct: async (productData: Omit<Product, 'productid'>) => {
    const { data, error } = await supabase
      .from('product')
      .insert(productData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update product
  updateProduct: async (productId: string, updates: Partial<Omit<Product, 'productid'>>) => {
    const { data, error } = await supabase
      .from('product')
      .update(updates)
      .eq('productid', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete product
  deleteProduct: async (productId: string) => {
    const { data, error } = await supabase
      .from('product')
      .delete()
      .eq('productid', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const orderOperations = {
  // Get all orders with details
  getAllOrders: async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(customername, email, phone, address),
        orderdetail(
          productid,
          quantity,
          product(productname, unitprice, description)
        ),
        shipments(shipmentid, trackingnumber, shipmentstatus)
      `)
      .order('orderdate', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get orders for specific customer
  getCustomerOrders: async (customerId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        orderdetail(
          productid,
          quantity,
          product(productname, unitprice, description)
        ),
        shipments(shipmentid, trackingnumber, shipmentstatus)
      `)
      .eq('customerid', customerId)
      .order('orderdate', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create new order
  createOrder: async (orderData: {
    customerid: string;
    orderItems: Array<{
      productid: string;
      quantity: number;
    }>;
  }) => {
    const orderId = crypto.randomUUID();
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);

    // Create order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        orderid: orderId,
        customerid: orderData.customerid,
        orderdate: new Date().toISOString(),
        expecteddeliverydate: expectedDeliveryDate.toISOString(),
        orderstatus: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order details
    for (const item of orderData.orderItems) {
      const { error: detailError } = await supabase
        .from('orderdetail')
        .insert({
          orderid: orderId,
          productid: item.productid,
          quantity: item.quantity
        });

      if (detailError) throw detailError;
    }

    return newOrder;
  },

  // Update order status
  updateOrderStatus: async (orderId: string, newStatus: string, userId?: string, note?: string) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ orderstatus: newStatus })
      .eq('orderid', orderId)
      .select()
      .single();

    if (error) throw error;

    // Log status change
    if (userId) {
      const { error: historyError } = await supabase
        .from('orderstatushistory')
        .insert({
          orderid: orderId,
          oldstatus: data.orderstatus,
          newstatus: newStatus,
          changedbyuserid: userId,
          note: note || `Status updated to ${newStatus}`
        });

      if (historyError) {
        console.error('Error logging order status change:', historyError);
      }
    }

    return data;
  }
};

export const returnOperations = {
  // Get all returns with details
  getAllReturns: async () => {
    const { data, error } = await supabase
      .from('returns')
      .select(`
        *,
        order:orders(
          orderdate,
          customers(customername)
        ),
        returndetail(
          productid,
          quantity,
          reason,
          status,
          product(productname, unitprice)
        )
      `)
      .order('returndate', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create new return
  createReturn: async (orderId: string, productId: string, reason: string) => {
    const returnId = crypto.randomUUID();

    // Create return
    const { data: newReturn, error: returnError } = await supabase
      .from('returns')
      .insert({
        returnid: returnId,
        orderid: orderId,
        returnreason: reason,
        status: 'requested'
      })
      .select()
      .single();

    if (returnError) throw returnError;

    // Create return detail
    const { error: detailError } = await supabase
      .from('returndetail')
      .insert({
        returnid: returnId,
        productid: productId,
        quantity: 1, // Default quantity
        reason: reason,
        status: 'requested'
      });

    if (detailError) throw detailError;

    return newReturn;
  },

  // Update return status
  updateReturnStatus: async (returnId: string, newStatus: string, userId: string, note: string) => {
    const { data, error } = await supabase
      .from('returns')
      .update({ status: newStatus })
      .eq('returnid', returnId)
      .select()
      .single();

    if (error) throw error;

    // Log status change
    const { error: historyError } = await supabase
      .from('returnstatushistory')
      .insert({
        returnid: returnId,
        oldstatus: data.status,
        newstatus: newStatus,
        changedbyuserid: userId,
        note: note
      });

    if (historyError) {
      console.error('Error logging return status change:', historyError);
    }

    return data;
  }
};

export const paymentOperations = {
  // Create customer payment
  createCustomerPayment: async (
    orderId: string,
    customerId: string,
    amount: number,
    paymentMethod: string
  ) => {
    const { data, error } = await supabase
      .from('paymentcustomer')
      .insert({
        paymentid: crypto.randomUUID(),
        orderid: orderId,
        customerid: customerId,
        amount: amount,
        paymentmethod: paymentMethod,
        status: 'completed'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create supplier payment
  createSupplierPayment: async (
    purchaseOrderId: string,
    supplierId: string,
    amount: number,
    paymentMethod: string
  ) => {
    const { data, error } = await supabase
      .from('paymentsupplier')
      .insert({
        paymentid: crypto.randomUUID(),
        purchaseorderid: purchaseOrderId,
        supplierid: supplierId,
        amount: amount,
        paymentmethod: paymentMethod,
        status: 'completed'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get customer payments
  getCustomerPayments: async (customerId?: string) => {
    let query = supabase
      .from('paymentcustomer')
      .select(`
        *,
        order:orders(orderid, orderdate),
        customers(customername)
      `)
      .order('paymentdate', { ascending: false });

    if (customerId) {
      query = query.eq('customerid', customerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get supplier payments
  getSupplierPayments: async () => {
    const { data, error } = await supabase
      .from('paymentsupplier')
      .select(`
        *,
        purchaseorder(purchaseorderid, orderdate, totalamount),
        supplier(suppliername)
      `)
      .order('paymentdate', { ascending: false });

    if (error) throw error;
    return data;
  }
};

export const purchaseOrderOperations = {
  // Get approved purchase orders for production
  getApprovedPurchaseOrdersForProduction: async (supplierId?: string) => {
    let query = supabase
      .from('purchaseorder')
      .select(`
        *,
        supplier(suppliername),
        purchaseorderdetail(
          purchaseorderdetailid,
          productid,
          quantity,
          unitprice,
          subtotal,
          product(productname, description, unitprice)
        )
      `)
      .eq('status', 'approved')
      .order('orderdate', { ascending: true });

    if (supplierId) {
      query = query.eq('supplierid', supplierId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Create purchase order
  createPurchaseOrder: async (orderData: {
    supplierid: string;
    expecteddeliverydate: string;
    notes: string;
    items: Array<{
      productid: string;
      quantity: number;
      unitprice: number;
    }>;
  }) => {
    const poId = crypto.randomUUID();
    const totalAmount = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unitprice), 0);

    // Create purchase order
    const { data: newPO, error: poError } = await supabase
      .from('purchaseorder')
      .insert({
        purchaseorderid: poId,
        supplierid: orderData.supplierid,
        orderdate: new Date().toISOString(),
        expecteddeliverydate: orderData.expecteddeliverydate,
        status: 'pending',
        totalamount: totalAmount,
        notes: orderData.notes
      })
      .select()
      .single();

    if (poError) throw poError;

    // Create purchase order details
    for (const item of orderData.items) {
      const { error: detailError } = await supabase
        .from('purchaseorderdetail')
        .insert({
          purchaseorderid: poId,
          productid: item.productid,
          quantity: item.quantity,
          unitprice: item.unitprice,
          subtotal: item.quantity * item.unitprice
        });

      if (detailError) throw detailError;
    }

    return newPO;
  },

  // Update purchase order status
  updatePurchaseOrderStatus: async (poId: string, newStatus: string) => {
    const { data, error } = await supabase
      .from('purchaseorder')
      .update({ status: newStatus })
      .eq('purchaseorderid', poId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const productionOperations = {
  // Create production order
  createProductionOrder: async (
    productId: string,
    purchaseOrderId: string,
    quantity: number
  ) => {
    const { data, error } = await supabase
      .from('production')
      .insert({
        productid: productId,
        purchaseorderid: purchaseOrderId,
        quantity,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all production orders
  getAllProductionOrders: async () => {
    const { data, error } = await supabase
      .from('production')
      .select(`
        *,
        product(productname, description),
        purchaseorder(orderdate, status)
      `)
      .order('startdate', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Update production status
  updateProductionStatus: async (
    productionOrderId: string,
    newStatus: string,
    userId: string,
    note: string
  ) => {
    // Update production status
    const { data, error } = await supabase
      .from('production')
      .update({ status: newStatus })
      .eq('productionorderid', productionOrderId)
      .select()
      .single();

    if (error) throw error;

    // Log status change
    const { error: historyError } = await supabase
      .from('productionstatuslog')
      .insert({
        productionorderid: productionOrderId,
        oldstatus: data.status,
        newstatus: newStatus,
        changedbyuserid: userId,
        note: note
      });

    if (historyError) {
      console.error('Error logging production status change:', historyError);
    }

    return data;
  },

  // Create production order from purchase order detail
  createProductionOrderFromPO: async (
    purchaseOrderDetailId: string,
    productId: string,
    quantity: number
  ) => {
    const { data, error } = await supabase
      .from('production')
      .insert({
        productionorderid: crypto.randomUUID(),
        productid: productId,
        purchaseorderdetailid: purchaseOrderDetailId,
        quantity: quantity,
        startdate: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const inventoryOperations = {
  // Get warehouse inventory - FIXED for composite primary key structure
  getWarehouseInventory: async (warehouseId?: string) => {
    let query = supabase
      .from('inventory')
      .select(`
        productid,
        warehouseid,
        quantity,
        product!inventory_productid_fkey(productid, productname, description, unitprice),
        warehouses!inventory_warehouseid_fkey(warehouseid, warehousename, location)
      `);

    if (warehouseId) {
      query = query.eq('warehouseid', warehouseId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('❌ Inventory query error:', error);
      throw error;
    }
    console.log('📦 Raw inventory data:', data);
    return data;
  },

  // Get low stock items - FIXED for composite primary key structure
  getLowStockItems: async (threshold: number = 10) => {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        productid,
        warehouseid,
        quantity,
        product!inventory_productid_fkey(productid, productname, description, unitprice),
        warehouses!inventory_warehouseid_fkey(warehouseid, warehousename, location)
      `)
      .lt('quantity', threshold)
      .order('quantity', { ascending: true });

    if (error) {
      console.error('❌ Low stock query error:', error);
      throw error;
    }
    console.log('📉 Low stock data:', data);
    return data;
  },

  // Update inventory quantity
  updateInventoryQuantity: async (
    productId: string,
    warehouseId: string,
    newQuantity: number,
    movementType: string,
    referenceType?: string,
    referenceId?: string
  ) => {
    // Update inventory
    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('productid', productId)
      .eq('warehouseid', warehouseId)
      .select()
      .single();

    if (error) throw error;

    // Log inventory movement
    const { error: logError } = await supabase
      .from('inventorylog')
      .insert({
        logid: crypto.randomUUID(),
        productid: productId,
        warehouseid: warehouseId,
        movementtype: movementType,
        quantity: newQuantity,
        referencetype: referenceType || 'manual_adjustment',
        referenceid: referenceId || 'manual',
        timestamp: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging inventory movement:', logError);
    }

    return data;
  },

  // Add inventory
  addInventory: async (
    productId: string,
    warehouseId: string,
    quantity: number
  ) => {
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        productid: productId,
        warehouseid: warehouseId,
        quantity: quantity
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const supplierPerformanceOperations = {
  // Get supplier performance metrics
  getSupplierPerformance: async (supplierId?: string) => {
    // Mock data for now since this table might not exist
    return {
      totalOrders: 125,
      completedOrders: 120,
      averageRating: 4.6,
      onTimeDelivery: 96.5,
      qualityScore: 98.2,
      totalRevenue: 450000
    };
  },

  // Create performance record
  createPerformanceRecord: async (supplierId: string, metrics: any) => {
    // Mock implementation
    return { success: true };
  }
};
