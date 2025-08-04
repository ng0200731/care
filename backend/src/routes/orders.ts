import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schema for order
const orderSchema = z.object({
  masterFileId: z.string().min(1, 'Master file is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
  orderData: z.any().optional(),
});

const updateOrderSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'CONFIRMED', 'IN_PRODUCTION', 'DELIVERED', 'CANCELLED']).optional(),
  quantity: z.number().min(1).optional(),
  notes: z.string().optional(),
  orderData: z.any().optional(),
});

// GET /api/orders - Get all orders for current user
router.get('/', async (req, res) => {
  try {
    const where = req.user!.role === 'ADMIN' 
      ? {} // Admins see all
      : { userId: req.user!.id }; // Users see only their own

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        masterFile: {
          select: { id: true, name: true, description: true }
        },
        supplier: {
          select: { id: true, name: true, contactInfo: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// GET /api/orders/:id - Get specific order
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        masterFile: true,
        supplier: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check ownership (unless admin)
    if (req.user!.role !== 'ADMIN' && order.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const { masterFileId, supplierId, quantity, notes, orderData } = orderSchema.parse(req.body);

    // Verify master file and supplier belong to user (unless admin)
    if (req.user!.role !== 'ADMIN') {
      const [masterFile, supplier] = await Promise.all([
        prisma.masterFile.findUnique({ where: { id: masterFileId } }),
        prisma.supplier.findUnique({ where: { id: supplierId } })
      ]);

      if (!masterFile || masterFile.userId !== req.user!.id) {
        return res.status(400).json({ error: 'Invalid master file' });
      }

      if (!supplier || supplier.userId !== req.user!.id) {
        return res.status(400).json({ error: 'Invalid supplier' });
      }
    }

    const order = await prisma.order.create({
      data: {
        masterFileId,
        supplierId,
        quantity,
        notes,
        orderData,
        userId: req.user!.id,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        masterFile: {
          select: { id: true, name: true, description: true }
        },
        supplier: {
          select: { id: true, name: true, contactInfo: true }
        }
      }
    });

    res.status(201).json({ 
      message: 'Order created successfully',
      order 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/orders/:id - Update order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateOrderSchema.parse(req.body);

    // Check if order exists and user has access
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (req.user!.role !== 'ADMIN' && existingOrder.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        masterFile: {
          select: { id: true, name: true, description: true }
        },
        supplier: {
          select: { id: true, name: true, contactInfo: true }
        }
      }
    });

    res.json({ 
      message: 'Order updated successfully',
      order 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order exists and user has access
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (req.user!.role !== 'ADMIN' && existingOrder.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.order.delete({
      where: { id }
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
