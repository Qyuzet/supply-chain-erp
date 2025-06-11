import { supabase } from './supabase';
import type { Database } from './supabase';

// Type aliases for easier use - ALL TABLES INCLUDED
type Tables = Database['public']['Tables'];
type Order = Tables['order']['Row'];
type OrderDetail = Tables['orderdetail']['Row'];
type Product = Tables['product']['Row'];
type Inventory = Tables['inventory']['Row'];
type Shipment = Tables['shipments']['Row'];
type Customer = Tables['customers']['Row'];
type Supplier = Tables['supplier']['Row'];
type Warehouse = Tables['warehouses']['Row'];
type ShippingCarrier = Tables['shippingcarrier']['Row'];
type InventoryLog = Tables['inventorylog']['Row'];
type PurchaseOrder = Tables['purchaseorder']['Row'];
type Production = Tables['production']['Row'];
type PaymentCustomer = Tables['paymentcustomer']['Row'];
type PaymentSupplier = Tables['paymentsupplier']['Row'];
type Return = Tables['returns']['Row'];
type SupplierPerformance = Tables['supplierperformance']['Row'];

// Status logging function
export const logStatusChange = async (
  table: string,
  recordId: string,
  oldStatus: string | null,
  newStatus: string,
  userId: string,
  note?: string
) => {
  const historyTable = `${table}statushistory`;
  const idField = `${table}id`;
  
  const { error } = await supabase
    .from(historyTable)
    .insert({
      [idField]: recordId,
      oldstatus: oldStatus,
      newstatus: newStatus,
      changedbyuserid: userId,
      note: note || null,
    });

  if (error) throw error;
};

// Order Operations
export const orderOperations = {
  // Get orders for a customer
  getCustomerOrders: async (customerId: string) => {
    // First try simple query without complex JOINs
    const { data: orders, error: orderError } = await supabase
      .from('Order')
      .select('*')
      .eq('customerid', customerId)
      .order('orderdate', { ascending: false }); // Newest orders first for customer view

    if (orderError) {
      console.error('Database error in getCustomerOrders:', orderError);
      throw orderError;
    }

    if (!orders || orders.length === 0) {
      console.log('No orders found for customer:', customerId);
      return [];
    }

    // Then get order details separately
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const { data: orderDetails, error: detailError } = await supabase
          .from('orderdetail')
          .select(`
            *,
            product (
              productid,
              productname,
              unitprice,
              description
            )
          `)
          .eq('orderid', order.orderid);

        if (detailError) {
          console.error('Error getting order details:', detailError);
          return { ...order, orderdetail: [] };
        }

        return { ...order, orderdetail: orderDetails || [], shipments: [] };
      })
    );

    console.log('Orders with details:', ordersWithDetails);
    return ordersWithDetails;
  },

  // Create new order
  createOrder: async (customerId: string, orderDetails: Array<{productId: string, quantity: number}>) => {
    // Generate UUID for order
    const orderId = crypto.randomUUID();

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .insert({
        orderid: orderId,
        customerid: customerId,
        orderdate: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order details
    const orderDetailInserts = orderDetails.map(detail => ({
      orderid: order.orderid,
      productid: detail.productId,
      quantity: detail.quantity
    }));

    const { error: detailError } = await supabase
      .from('orderdetail')
      .insert(orderDetailInserts);

    if (detailError) throw detailError;

    return order;
  },

  // Update order status
  updateOrderStatus: async (orderId: string, newStatus: string, userId: string, note?: string) => {
    // Get current status
    const { data: currentOrder } = await supabase
      .from('order')
      .select('status')
      .eq('orderid', orderId)
      .single();

    // Update order
    const { error } = await supabase
      .from('order')
      .update({ status: newStatus })
      .eq('orderid', orderId);

    if (error) throw error;

    // Log status change
    await logStatusChange('order', orderId, currentOrder?.status || null, newStatus, userId, note);
  },

  // Get all orders (admin/warehouse view)
  getAllOrders: async () => {
    // First get all orders
    const { data: orders, error: orderError } = await supabase
      .from('Order')
      .select('*')
      .order('orderdate', { ascending: true }); // FIFO: First In, First Out

    if (orderError) {
      console.error('Database error in getAllOrders:', orderError);
      throw orderError;
    }

    if (!orders || orders.length === 0) {
      console.log('No orders found in database');
      return [];
    }

    // Then get order details separately
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const { data: orderDetails, error: detailError } = await supabase
          .from('orderdetail')
          .select(`
            *,
            product (
              productid,
              productname,
              unitprice,
              description
            )
          `)
          .eq('orderid', order.orderid);

        if (detailError) {
          console.error('Error getting order details:', detailError);
          return { ...order, orderdetail: [] };
        }

        return { ...order, orderdetail: orderDetails || [], shipments: [] };
      })
    );

    console.log('All orders with details:', ordersWithDetails);
    return ordersWithDetails;
  }
};

// Product Operations
export const productOperations = {
  // Get all products
  getAllProducts: async () => {
    const { data, error } = await supabase
      .from('product')
      .select(`
        *,
        supplier (suppliername)
      `)
      .order('productname');

    if (error) throw error;
    return data;
  },

  // Get products by supplier
  getSupplierProducts: async (supplierId: string) => {
    const { data, error } = await supabase
      .from('product')
      .select('*')
      .eq('supplierid', supplierId)
      .order('productname');

    if (error) throw error;
    return data;
  },

  // Create product
  createProduct: async (product: Omit<Product, 'productid'>) => {
    const { data, error } = await supabase
      .from('product')
      .insert(product)
      .select()
      .single();

    if (error) throw error;

    // Create initial inventory entry for the product in all warehouses
    if (data) {
      // Get all warehouses
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('warehouseid');

      if (warehouses && warehouses.length > 0) {
        // Create inventory entry for each warehouse
        const inventoryEntries = warehouses.map(warehouse => ({
          productid: data.productid,
          warehouseid: warehouse.warehouseid,
          quantity: 0 // Start with 0, supplier will add stock later
        }));

        await supabase
          .from('inventory')
          .insert(inventoryEntries);

        // Log initial inventory creation
        for (const warehouse of warehouses) {
          await supabase
            .from('inventorylog')
            .insert({
              logid: crypto.randomUUID(),
              productid: data.productid,
              warehouseid: warehouse.warehouseid,
              movementtype: 'adjustment',
              quantity: 0,
              referencetype: 'product_creation',
              referenceid: data.productid,
              timestamp: new Date().toISOString()
            });
        }
      }
    }

    return data;
  },

  // Update product
  updateProduct: async (productId: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('product')
      .update(updates)
      .eq('productid', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Inventory Operations
export const inventoryOperations = {
  // Get inventory by warehouse
  getWarehouseInventory: async (warehouseId?: string) => {
    let query = supabase
      .from('inventory')
      .select(`
        *,
        product (productname, description, unitprice),
        warehouses (warehousename, location)
      `);

    if (warehouseId) {
      query = query.eq('warehouseid', warehouseId);
    }

    const { data, error } = await query.order('quantity', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Update inventory quantity
  updateInventory: async (inventoryId: string, updates: { quantity: number }) => {
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('inventoryid', inventoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update inventory quantity with logging
  updateInventoryWithLogging: async (
    productId: string,
    warehouseId: string,
    newQuantity: number,
    movementType: 'in' | 'out' | 'transfer' | 'adjustment',
    referenceType?: string,
    referenceId?: string
  ) => {
    // Get current quantity
    const { data: currentInventory } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('productid', productId)
      .eq('warehouseid', warehouseId)
      .single();

    const oldQuantity = currentInventory?.quantity || 0;
    const quantityChange = newQuantity - oldQuantity;

    // Update inventory
    const { error: updateError } = await supabase
      .from('inventory')
      .upsert({
        productid: productId,
        warehouseid: warehouseId,
        quantity: newQuantity
      });

    if (updateError) throw updateError;

    // Log inventory movement
    const { error: logError } = await supabase
      .from('inventorylog')
      .insert({
        logid: crypto.randomUUID(),
        productid: productId,
        warehouseid: warehouseId,
        movementtype: movementType,
        quantity: quantityChange,
        referencetype: referenceType || null,
        referenceid: referenceId || null,
        timestamp: new Date().toISOString()
      });

    if (logError) throw logError;
  },

  // Get low stock items
  getLowStockItems: async (threshold: number = 10) => {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product (productname, description),
        warehouses (warehousename, location)
      `)
      .lt('quantity', threshold)
      .order('quantity', { ascending: true });

    if (error) throw error;
    return data;
  }
};

// Shipment Operations
export const shipmentOperations = {
  // Get shipments by carrier
  getCarrierShipments: async (carrierId: string) => {
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        order (
          *,
          customers (customername, address)
        ),
        warehouses (warehousename, location)
      `)
      .eq('carrierid', carrierId)
      .order('shipmentdate', { ascending: true }); // FIFO: First In, First Out

    if (error) throw error;
    return data;
  },

  // Create shipment
  createShipment: async (shipment: Omit<Shipment, 'shipmentid'>) => {
    const { data, error } = await supabase
      .from('shipments')
      .insert(shipment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update shipment status
  updateShipmentStatus: async (shipmentId: string, newStatus: string, trackingNumber?: string) => {
    const updates: any = { status: newStatus };
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
  },

  // Get all shipments
  getAllShipments: async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        order (
          *,
          customers (customername)
        ),
        warehouses (warehousename),
        shippingcarrier (carriername)
      `)
      .order('shipmentdate', { ascending: true }); // FIFO: First In, First Out

    if (error) throw error;
    return data;
  }
};









// Purchase Order Operations
export const purchaseOrderOperations = {
  // Create purchase order
  createPurchaseOrder: async (supplierId: string, totalAmount: number) => {
    const { data, error } = await supabase
      .from('purchaseorder')
      .insert({
        purchaseorderid: crypto.randomUUID(),
        supplierid: supplierId,
        orderdate: new Date().toISOString(),
        status: 'pending',
        totalamount: totalAmount
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get supplier purchase orders
  getSupplierPurchaseOrders: async (supplierId: string) => {
    const { data, error } = await supabase
      .from('purchaseorder')
      .select('*')
      .eq('supplierid', supplierId)
      .order('orderdate', { ascending: true }); // FIFO: First In, First Out

    if (error) throw error;
    return data;
  },

  // Update purchase order status
  updatePurchaseOrderStatus: async (purchaseOrderId: string, newStatus: string, userId: string, note?: string) => {
    const { data: currentPO } = await supabase
      .from('purchaseorder')
      .select('status')
      .eq('purchaseorderid', purchaseOrderId)
      .single();

    const { error } = await supabase
      .from('purchaseorder')
      .update({ status: newStatus })
      .eq('purchaseorderid', purchaseOrderId);

    if (error) throw error;

    // Log status change
    await supabase
      .from('purchaseorderstatushistory')
      .insert({
        historyid: crypto.randomUUID(),
        purchaseorderid: purchaseOrderId,
        oldstatus: currentPO?.status || null,
        newstatus: newStatus,
        changedat: new Date().toISOString(),
        changedbyuserid: userId,
        note: note || null
      });
  },

  // Get all purchase orders
  getAllPurchaseOrders: async () => {
    const { data, error } = await supabase
      .from('purchaseorder')
      .select(`
        *,
        supplier (suppliername)
      `)
      .order('orderdate', { ascending: true }); // FIFO: First In, First Out

    if (error) throw error;
    return data;
  }
};

// Payment Operations
export const paymentOperations = {
  // Create customer payment
  createCustomerPayment: async (orderid: string, customerid: string, amount: number, paymentMethod: string) => {
    const { data, error } = await supabase
      .from('paymentcustomer')
      .insert({
        paymentid: crypto.randomUUID(),
        orderid,
        customerid,
        amount,
        paymentdate: new Date().toISOString(),
        paymentmethod: paymentMethod,
        status: 'completed'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create supplier payment
  createSupplierPayment: async (purchaseOrderId: string, supplierId: string, amount: number, paymentMethod: string) => {
    const { data, error } = await supabase
      .from('paymentsupplier')
      .insert({
        paymentid: crypto.randomUUID(),
        purchaseorderid: purchaseOrderId,
        supplierid: supplierId,
        amount,
        paymentdate: new Date().toISOString(),
        paymentmethod: paymentMethod,
        status: 'completed'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get customer payments
  getCustomerPayments: async (customerId: string) => {
    const { data, error } = await supabase
      .from('paymentcustomer')
      .select(`
        *,
        order:Order(orderid, orderdate)
      `)
      .eq('customerid', customerId)
      .order('paymentdate', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get supplier payments
  getSupplierPayments: async (supplierId: string) => {
    const { data, error } = await supabase
      .from('paymentsupplier')
      .select(`
        *,
        purchaseorder(purchaseorderid, orderdate, totalamount)
      `)
      .eq('supplierid', supplierId)
      .order('paymentdate', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Production Operations
export const productionOperations = {
  // Create production order
  createProductionOrder: async (productId: string, purchaseOrderId: string, quantity: number) => {
    const { data, error } = await supabase
      .from('production')
      .insert({
        productionorderid: crypto.randomUUID(),
        productid: productId,
        purchaseorderid: purchaseOrderId,
        quantity,
        startdate: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update production status
  updateProductionStatus: async (productionOrderId: string, newStatus: string, userId: string, note?: string) => {
    const { data: currentProduction } = await supabase
      .from('production')
      .select('status')
      .eq('productionorderid', productionOrderId)
      .single();

    const { error } = await supabase
      .from('production')
      .update({ status: newStatus })
      .eq('productionorderid', productionOrderId);

    if (error) throw error;

    // Log status change
    await supabase
      .from('productionstatuslog')
      .insert({
        historyid: crypto.randomUUID(),
        productionorderid: productionOrderId,
        oldstatus: currentProduction?.status || null,
        newstatus: newStatus,
        changedat: new Date().toISOString(),
        changedbyuserid: userId,
        note: note || null
      });
  },

  // Get production orders
  getProductionOrders: async () => {
    const { data, error } = await supabase
      .from('production')
      .select(`
        *,
        product(productname, description),
        purchaseorder(purchaseorderid, orderdate)
      `)
      .order('startdate', { ascending: true }); // FIFO: First In, First Out

    if (error) throw error;
    return data;
  }
};

// Returns Operations
export const returnOperations = {
  // Create return request
  createReturn: async (orderid: string, productid: string, returnReason: string) => {
    const { data, error } = await supabase
      .from('returns')
      .insert({
        returnid: crypto.randomUUID(),
        orderid,
        productid,
        returndate: new Date().toISOString(),
        returnreason: returnReason,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update return status
  updateReturnStatus: async (returnId: string, newStatus: string, userId: string, note?: string) => {
    const { data: currentReturn } = await supabase
      .from('returns')
      .select('status')
      .eq('returnid', returnId)
      .single();

    const { error } = await supabase
      .from('returns')
      .update({ status: newStatus })
      .eq('returnid', returnId);

    if (error) throw error;

    // Log status change
    await supabase
      .from('returnstatushistory')
      .insert({
        historyid: crypto.randomUUID(),
        returnid: returnId,
        oldstatus: currentReturn?.status || null,
        newstatus: newStatus,
        changedat: new Date().toISOString(),
        changedbyuserid: userId,
        note: note || null
      });
  },

  // Get all returns
  getAllReturns: async () => {
    const { data, error } = await supabase
      .from('returns')
      .select(`
        *,
        order:Order(orderid, orderdate, customers(customername)),
        product(productname, unitprice)
      `)
      .order('returndate', { ascending: true }); // FIFO: First In, First Out

    if (error) throw error;
    return data;
  }
};

// Supplier Performance Operations
export const supplierPerformanceOperations = {
  // Create performance evaluation
  createPerformanceEvaluation: async (supplierId: string, purchaseOrderId: string, rating: number, deliveryTime: string, qualityScore: number) => {
    const { data, error } = await supabase
      .from('supplierperformance')
      .insert({
        performanceid: crypto.randomUUID(),
        supplierid: supplierId,
        purchaseorderid: purchaseOrderId,
        rating,
        deliverytime: deliveryTime,
        qualityscore: qualityScore,
        evaluationdate: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get supplier performance
  getSupplierPerformance: async (supplierId: string) => {
    const { data, error } = await supabase
      .from('supplierperformance')
      .select(`
        *,
        supplier(suppliername),
        purchaseorder(purchaseorderid, orderdate, totalamount)
      `)
      .eq('supplierid', supplierId)
      .order('evaluationdate', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get all performance evaluations
  getAllPerformanceEvaluations: async () => {
    const { data, error } = await supabase
      .from('supplierperformance')
      .select(`
        *,
        supplier(suppliername),
        purchaseorder(purchaseorderid, orderdate, totalamount)
      `)
      .order('evaluationdate', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Warehouse Operations
export const warehouseOperations = {
  // Get all warehouses
  getAllWarehouses: async () => {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('warehousename');

    if (error) throw error;
    return data;
  },

  // Get warehouse by ID
  getWarehouseById: async (warehouseId: string) => {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('warehouseid', warehouseId)
      .single();

    if (error) throw error;
    return data;
  }
};

// Carrier Operations
export const carrierOperations = {
  // Get all carriers
  getAllCarriers: async () => {
    const { data, error } = await supabase
      .from('shippingcarrier')
      .select('*')
      .order('carriername');

    if (error) throw error;
    return data;
  },

  // Get carrier by ID
  getCarrierById: async (carrierId: string) => {
    const { data, error } = await supabase
      .from('shippingcarrier')
      .select('*')
      .eq('carrierid', carrierId)
      .single();

    if (error) throw error;
    return data;
  }
};
