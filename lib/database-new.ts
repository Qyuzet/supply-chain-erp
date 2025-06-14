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

export const orderOperations = {
  // Get all orders (updated table name)
  getAllOrders: async () => {
    const { data, error } = await supabase
      .from('orders') // Updated table name
      .select(`
        *,
        customers(customername, email, phone, address),
        orderdetail(
          *,
          product(
            productid,
            productname,
            unitprice,
            description
          )
        )
      `)
      .order('orderdate', { ascending: true }); // FIFO

    if (error) throw error;
    return data;
  },

  // Create order (updated table name)
  createOrder: async (orderData: Omit<Order, 'orderid'>) => {
    const { data, error } = await supabase
      .from('orders') // Updated table name
      .insert(orderData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update order status (updated table name and field name)
  updateOrderStatus: async (orderId: string, newStatus: string) => {
    const { data, error } = await supabase
      .from('orders') // Updated table name
      .update({ orderstatus: newStatus }) // Updated field name
      .eq('orderid', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

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

export const inventoryOperations = {
  // Get inventory levels
  getInventoryLevels: async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product(productname, description, unitprice),
        warehouses(warehousename, location)
      `)
      .order('quantity', { ascending: true }); // Show low stock first

    if (error) throw error;
    return data;
  },

  // Update inventory quantity
  updateInventoryQuantity: async (productId: string, warehouseId: string, newQuantity: number) => {
    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('productid', productId)
      .eq('warehouseid', warehouseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

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
