import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Environment Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please check your .env.local file');
  throw new Error('Supabase configuration is missing. Please check environment variables.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          userid: string;
          email: string;
          passwordhash: string | null;
          fullname: string | null;
          role: 'customer' | 'supplier' | 'warehouse' | 'carrier' | 'admin';
          createdat: string;
          isactive: boolean;
        };
        Insert: {
          userid?: string;
          email: string;
          passwordhash?: string | null;
          fullname?: string | null;
          role?: 'customer' | 'supplier' | 'warehouse' | 'carrier' | 'admin';
          createdat?: string;
          isactive?: boolean;
        };
        Update: {
          userid?: string;
          email?: string;
          passwordhash?: string | null;
          fullname?: string | null;
          role?: 'customer' | 'supplier' | 'warehouse' | 'carrier' | 'admin';
          createdat?: string;
          isactive?: boolean;
        };
      };
      customers: {
        Row: {
          customerid: string;
          userid: string;
          customername: string | null;
          phone: string | null;
          address: string | null;
        };
      };
      supplier: {
        Row: {
          supplierid: string;
          userid: string;
          suppliername: string | null;
        };
      };
      product: {
        Row: {
          productid: string;
          productname: string;
          description: string | null;
          unitprice: number;
          supplierid: string | null;
        };
      };
      order: {
        Row: {
          orderid: string;
          customerid: string;
          orderdate: string;
          expecteddeliverydate: string | null;
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
        };
      };
      shipments: {
        Row: {
          shipmentid: string;
          carrierid: string | null;
          orderid: string | null;
          warehouseid: string | null;
          shipmentdate: string;
          trackingnumber: string | null;
          status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
        };
      };
      inventory: {
        Row: {
          productid: string;
          warehouseid: string;
          quantity: number;
        };
      };
      purchaseorder: {
        Row: {
          purchaseorderid: string;
          supplierid: string | null;
          orderdate: string;
          status: 'pending' | 'sent' | 'confirmed' | 'in_production' | 'shipped' | 'received' | 'cancelled';
          totalamount: number;
        };
      };
      orderdetail: {
        Row: {
          orderid: string;
          productid: string;
          quantity: number;
          shipmentid: string | null;
        };
      };
      warehouses: {
        Row: {
          warehouseid: string;
          warehousename: string;
          location: string | null;
        };
      };
      shippingcarrier: {
        Row: {
          carrierid: string;
          carriername: string;
          contactinfo: string | null;
          websiteurl: string | null;
          servicelevel: string | null;
          coststructure: string | null;
          deliverytimeframe: string | null;
          servicearea: string | null;
        };
      };
      inventorylog: {
        Row: {
          logid: string;
          productid: string | null;
          warehouseid: string | null;
          movementtype: 'in' | 'out' | 'transfer' | 'adjustment' | null;
          quantity: number;
          referencetype: string | null;
          referenceid: string | null;
          timestamp: string;
        };
      };
      production: {
        Row: {
          productionorderid: string;
          productid: string | null;
          purchaseorderid: string | null;
          quantity: number;
          startdate: string | null;
          enddate: string | null;
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
        };
      };
      paymentcustomer: {
        Row: {
          paymentid: string;
          orderid: string | null;
          customerid: string | null;
          amount: number;
          paymentdate: string;
          paymentmethod: string | null;
          status: 'pending' | 'completed' | 'failed' | 'refunded';
        };
      };
      paymentsupplier: {
        Row: {
          paymentid: string;
          purchaseorderid: string | null;
          supplierid: string | null;
          amount: number;
          paymentdate: string;
          paymentmethod: string | null;
          status: 'pending' | 'completed' | 'failed';
        };
      };
      returns: {
        Row: {
          returnid: string;
          orderid: string | null;
          productid: string | null;
          returndate: string;
          returnreason: string | null;
          status: 'requested' | 'approved' | 'rejected' | 'received' | 'processed';
        };
      };
      orderstatushistory: {
        Row: {
          historyid: string;
          orderid: string | null;
          oldstatus: string | null;
          newstatus: string | null;
          changedat: string;
          changedbyuserid: string | null;
          note: string | null;
        };
      };
      purchaseorderstatushistory: {
        Row: {
          historyid: string;
          purchaseorderid: string | null;
          oldstatus: string | null;
          newstatus: string | null;
          changedat: string;
          changedbyuserid: string | null;
          note: string | null;
        };
      };
      returnstatushistory: {
        Row: {
          historyid: string;
          returnid: string | null;
          oldstatus: string | null;
          newstatus: string | null;
          changedat: string;
          changedbyuserid: string | null;
          note: string | null;
        };
      };
      productionstatuslog: {
        Row: {
          historyid: string;
          productionorderid: string | null;
          oldstatus: string | null;
          newstatus: string | null;
          changedat: string;
          changedbyuserid: string | null;
          note: string | null;
        };
      };
      supplierperformance: {
        Row: {
          performanceid: string;
          supplierid: string | null;
          purchaseorderid: string | null;
          rating: number | null;
          deliverytime: string | null;
          qualityscore: number | null;
          evaluationdate: string;
        };
      };
    };
  };
}

export type UserRole = Database['public']['Tables']['users']['Row']['role'];