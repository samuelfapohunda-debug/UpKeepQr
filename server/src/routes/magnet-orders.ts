import { Router } from 'express';
import { storage } from '../../storage.js';
import { authenticateAgent } from '../../middleware/auth.js';
import { createAuditLog, handleError } from './utils.js';
import {
  insertOrderMagnetOrderSchema,
  insertOrderMagnetItemSchema,
  insertOrderMagnetBatchSchema,
  insertOrderMagnetShipmentSchema,
} from '../../../shared/schema.js';

const router = Router();

// GET /orders/metrics - Get order magnet metrics for KPIs (admin)
router.get('/orders/metrics', authenticateAgent, async (req, res) => {
  try {
    await createAuditLog(req, '/api/admin/magnets/orders/metrics');
    
    // For now, get basic metrics from all orders
    // In a real implementation, this would use more efficient aggregation queries
    const orders = await storage.getAllOrderMagnetOrders();
    
    // Apply filters to match the frontend table filters
    let filteredOrders = orders;
    
    // Filter by status array
    if (req.query.status) {
      const statusArray = Array.isArray(req.query.status) ? req.query.status : [req.query.status];
      filteredOrders = filteredOrders.filter(o => statusArray.includes(o.status));
    }
    
    // Filter by payment status array
    if (req.query.paymentStatus) {
      const paymentStatusArray = Array.isArray(req.query.paymentStatus) ? req.query.paymentStatus : [req.query.paymentStatus];
      filteredOrders = filteredOrders.filter(o => paymentStatusArray.includes(o.paymentStatus));
    }
    
    // Filter by SKU, ZIP, batchId, carrier, etc.
    if (req.query.sku) {
      // Note: SKU filtering would typically be done at item level, simplified for now
      filteredOrders = filteredOrders.filter(o => 
        o.customerEmail.toLowerCase().includes((req.query.sku as string).toLowerCase()) ||
        o.customerName.toLowerCase().includes((req.query.sku as string).toLowerCase())
      );
    }
    
    if (req.query.zip) {
      filteredOrders = filteredOrders.filter(o => o.shipZip?.includes(req.query.zip as string));
    }
    
    if (req.query.carrier) {
      filteredOrders = filteredOrders.filter(o => 
        o.shippingCarrier?.toLowerCase().includes((req.query.carrier as string).toLowerCase())
      );
    }
    
    // Filter by date range
    if (req.query.dateFrom || req.query.dateTo) {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : null;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : null;
      
      filteredOrders = filteredOrders.filter(o => {
        if (!o.createdAt) return false;
        const orderDate = new Date(o.createdAt);
        
        if (dateFrom && orderDate < dateFrom) return false;
        if (dateTo && orderDate > dateTo) return false;
        
        return true;
      });
    }
    
    // Filter by search query
    if (req.query.q) {
      const query = (req.query.q as string).toLowerCase();
      filteredOrders = filteredOrders.filter(o => 
        o.customerName.toLowerCase().includes(query) ||
        o.customerEmail.toLowerCase().includes(query) ||
        o.id.toLowerCase().includes(query)
      );
    }
    
    // Calculate metrics from filtered results
    const metrics = {
      totalOrders: filteredOrders.length,
      pendingCount: filteredOrders.filter(o => o.status === 'new').length,
      inProductionCount: filteredOrders.filter(o => o.status === 'in_production').length,
      shippedCount: filteredOrders.filter(o => o.status === 'shipped').length,
      deliveredCount: filteredOrders.filter(o => o.status === 'delivered').length,
      activatedCount: filteredOrders.filter(o => o.status === 'activated').length,
      totalRevenue: filteredOrders.reduce((sum, o) => sum + o.total, 0)
    };

    res.json(metrics);
  } catch (error: any) {
    return handleError(error, 'admin magnets orders metrics', res);
  }
});

// GET /orders - Get all order magnet orders with filtering and pagination (admin)
router.get('/orders', authenticateAgent, async (req, res) => {
  try {
    await createAuditLog(req, '/api/admin/magnets/orders');
    
    // Parse and validate query parameters
    const { status, page = 1, pageSize = 25, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
    
    let orders;
    if (status && typeof status === 'string') {
      orders = await storage.getOrderMagnetOrdersByStatus(status);
    } else {
      orders = await storage.getAllOrderMagnetOrders();
    }
    
    // Simple pagination and sorting in memory for now
    const startIndex = (Number(page) - 1) * Number(pageSize);
    const endIndex = startIndex + Number(pageSize);
    const sortedOrders = orders.sort((a, b) => {
      if (sortDir === 'desc') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    
    const paginatedOrders = sortedOrders.slice(startIndex, endIndex);
    
    const result = {
      items: paginatedOrders,
      total: orders.length,
      page: Number(page),
      pageSize: Number(pageSize)
    };

    res.json(result);
  } catch (error: any) {
    return handleError(error, 'admin magnets orders list', res);
  }
});

// GET /orders/:id - Get order magnet order by ID (admin - returns full data)
router.get('/orders/:id', authenticateAgent, async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await storage.getOrderMagnetOrder(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get related items, shipments, and audit events
    const [items, shipments, auditEvents] = await Promise.all([
      storage.getOrderMagnetItemsByOrder(id),
      storage.getOrderMagnetShipmentsByOrder(id),
      storage.getOrderMagnetAuditEventsByOrder(id)
    ]);

    res.json({
      ...order,
      items,
      shipments,
      auditEvents
    });
  } catch (error: any) {
    return handleError(error, 'admin magnets orders get', res);
  }
});

// POST /orders - Create a new order magnet order (admin)
router.post('/orders', authenticateAgent, async (req, res) => {
  try {
    await createAuditLog(req, '/api/admin/magnets/orders POST');
    
    const validatedData = insertOrderMagnetOrderSchema.parse(req.body);
    
    const order = await storage.createOrderMagnetOrder(validatedData);
    
    // Create audit event for order creation
    await storage.createOrderMagnetAuditEvent({
      orderId: order.id,
      actor: 'admin',
      type: 'order_created',
      data: { orderId: order.id }
    });

    res.status(201).json(order);
  } catch (error: any) {
    return handleError(error, 'admin magnets orders creation', res);
  }
});

// PATCH /orders/:id/status - Update order magnet order status (admin)
router.patch('/orders/:id/status', authenticateAgent, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    
    // Get current state for audit trail
    const currentOrder = await storage.getOrderMagnetOrder(id);
    if (!currentOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    const updatedOrder = await storage.updateOrderMagnetOrderStatus(id, status);
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Create audit event for status change
    if (currentOrder.status !== status) {
      await storage.createOrderMagnetAuditEvent({
        orderId: id,
        actor: 'admin',
        type: 'status_change',
        data: { 
          oldStatus: currentOrder.status, 
          newStatus: status 
        }
      });
    }

    res.json(updatedOrder);
  } catch (error: any) {
    return handleError(error, 'admin magnets orders status update', res);
  }
});

// GET /orders/:id/items - Get items for an order magnet order (admin)
router.get('/orders/:id/items', authenticateAgent, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if order exists
    const order = await storage.getOrderMagnetOrder(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const items = await storage.getOrderMagnetItemsByOrder(id);
    res.json(items);
  } catch (error: any) {
    return handleError(error, 'admin magnets orders items get', res);
  }
});

// POST /items - Create a new order magnet item (admin)
router.post('/items', authenticateAgent, async (req, res) => {
  try {
    await createAuditLog(req, '/api/admin/magnets/items POST');
    
    const validatedData = insertOrderMagnetItemSchema.parse(req.body);
    
    const item = await storage.createOrderMagnetItem(validatedData);
    
    // Create audit event for item creation
    await storage.createOrderMagnetAuditEvent({
      orderId: item.orderId,
      itemId: item.id,
      actor: 'admin',
      type: 'item_created',
      data: { itemId: item.id, sku: item.sku }
    });

    res.status(201).json(item);
  } catch (error: any) {
    return handleError(error, 'admin magnets items creation', res);
  }
});

// GET /batches - Get all order magnet batches (admin)
router.get('/batches', authenticateAgent, async (req, res) => {
  try {
    await createAuditLog(req, '/api/admin/magnets/batches');
    
    const batches = await storage.getAllOrderMagnetBatches();
    res.json(batches);
  } catch (error: any) {
    return handleError(error, 'admin magnets batches list', res);
  }
});

// POST /batches - Create a new order magnet batch (admin)
router.post('/batches', authenticateAgent, async (req, res) => {
  try {
    await createAuditLog(req, '/api/admin/magnets/batches POST');
    
    const validatedData = insertOrderMagnetBatchSchema.parse(req.body);
    
    const batch = await storage.createOrderMagnetBatch(validatedData);

    res.status(201).json(batch);
  } catch (error: any) {
    return handleError(error, 'admin magnets batches creation', res);
  }
});

// GET /batches/:id/items - Get items for a specific batch (admin)
router.get('/batches/:id/items', authenticateAgent, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if batch exists
    const batch = await storage.getOrderMagnetBatch(id);
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const items = await storage.getOrderMagnetItemsByBatch(id);
    res.json(items);
  } catch (error: any) {
    return handleError(error, 'admin magnets batches items get', res);
  }
});

// POST /shipments - Create a new order magnet shipment (admin)
router.post('/shipments', authenticateAgent, async (req, res) => {
  try {
    await createAuditLog(req, '/api/admin/magnets/shipments POST');
    
    const validatedData = insertOrderMagnetShipmentSchema.parse(req.body);
    
    const shipment = await storage.createOrderMagnetShipment(validatedData);
    
    // Create audit event for shipment creation
    await storage.createOrderMagnetAuditEvent({
      orderId: shipment.orderId,
      actor: 'admin',
      type: 'shipment_created',
      data: { 
        shipmentId: shipment.id, 
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier
      }
    });

    res.status(201).json(shipment);
  } catch (error: any) {
    return handleError(error, 'admin magnets shipments creation', res);
  }
});

export default router;
