import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Real-time subscription manager
export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  // Subscribe to order status changes
  subscribeToOrderUpdates(callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Order'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orderstatushistory'
        },
        callback
      )
      .subscribe();

    this.channels.set('order-updates', channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete('order-updates');
    };
  }

  // Subscribe to inventory changes
  subscribeToInventoryUpdates(callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel('inventory-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventorylog'
        },
        callback
      )
      .subscribe();

    this.channels.set('inventory-updates', channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete('inventory-updates');
    };
  }

  // Subscribe to shipment updates
  subscribeToShipmentUpdates(callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel('shipment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments'
        },
        callback
      )
      .subscribe();

    this.channels.set('shipment-updates', channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete('shipment-updates');
    };
  }

  // Subscribe to purchase order updates
  subscribeToPurchaseOrderUpdates(callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel('purchase-order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchaseorder'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchaseorderstatushistory'
        },
        callback
      )
      .subscribe();

    this.channels.set('purchase-order-updates', channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete('purchase-order-updates');
    };
  }

  // Subscribe to production updates
  subscribeToProductionUpdates(callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel('production-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'productionstatuslog'
        },
        callback
      )
      .subscribe();

    this.channels.set('production-updates', channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete('production-updates');
    };
  }

  // Subscribe to return updates
  subscribeToReturnUpdates(callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel('return-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returnstatushistory'
        },
        callback
      )
      .subscribe();

    this.channels.set('return-updates', channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete('return-updates');
    };
  }

  // Subscribe to user updates (admin only)
  subscribeToUserUpdates(callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel('user-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        callback
      )
      .subscribe();

    this.channels.set('user-updates', channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete('user-updates');
    };
  }

  // Subscribe to product updates
  subscribeToProductUpdates(callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel('product-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product'
        },
        callback
      )
      .subscribe();

    this.channels.set('product-updates', channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete('product-updates');
    };
  }

  // Subscribe to role-specific updates
  subscribeToRoleUpdates(role: string, userId: string, callback: (payload: any) => void): () => void {
    const channelName = `role-updates-${role}-${userId}`;
    
    let channel = supabase.channel(channelName);

    // Subscribe based on role
    switch (role) {
      case 'customer':
        // Customer sees their orders, shipments, returns, payments
        channel = channel
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'order',
            filter: `customerid=eq.${userId}`
          }, callback)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'shipments'
          }, callback)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'returns'
          }, callback);
        break;

      case 'supplier':
        // Supplier sees their purchase orders, products, production
        channel = channel
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'purchaseorder',
            filter: `supplierid=eq.${userId}`
          }, callback)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'product',
            filter: `supplierid=eq.${userId}`
          }, callback)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'production'
          }, callback);
        break;

      case 'warehouse':
        // Warehouse sees inventory, shipments, orders
        channel = channel
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'inventory'
          }, callback)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'shipments'
          }, callback)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'order'
          }, callback);
        break;

      case 'carrier':
        // Carrier sees their assigned shipments
        channel = channel
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'shipments',
            filter: `carrierid=eq.${userId}`
          }, callback);
        break;

      case 'admin':
        // Admin sees everything
        channel = channel
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'order'
          }, callback)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'inventory'
          }, callback)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'shipments'
          }, callback)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'purchaseorder'
          }, callback)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'users'
          }, callback);
        break;
    }

    channel.subscribe();
    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  // Unsubscribe from all channels
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }

  // Get active channels count
  getActiveChannelsCount(): number {
    return this.channels.size;
  }

  // Check if a specific channel is active
  isChannelActive(channelName: string): boolean {
    return this.channels.has(channelName);
  }
}

// Create a singleton instance
export const realtimeManager = new RealtimeManager();

// Utility functions for common real-time patterns
export const useRealtimeSubscription = (
  subscriptionType: string,
  callback: (payload: any) => void,
  dependencies: any[] = []
) => {
  // This would be used in React components with useEffect
  // Example usage in a component:
  /*
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToOrderUpdates((payload) => {
      console.log('Order updated:', payload);
      // Refresh data or update state
    });

    return unsubscribe;
  }, []);
  */
};

// Notification helpers
export const createNotification = (
  type: 'order' | 'inventory' | 'shipment' | 'purchase_order' | 'production' | 'return',
  action: 'created' | 'updated' | 'deleted',
  data: any
) => {
  return {
    id: crypto.randomUUID(),
    type,
    action,
    data,
    timestamp: new Date().toISOString(),
    read: false
  };
};

// Status change notification formatter
export const formatStatusChangeNotification = (
  entityType: string,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  changedBy?: string
) => {
  return {
    title: `${entityType} Status Updated`,
    message: `${entityType} ${entityId.slice(0, 8)} changed from "${oldStatus}" to "${newStatus}"`,
    changedBy,
    timestamp: new Date().toISOString()
  };
};
