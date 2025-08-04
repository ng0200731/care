import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schema for supplier
const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    contactPerson: z.string().optional(),
  }),
  capabilities: z.object({
    services: z.array(z.string()).optional(),
    minimumOrder: z.number().optional(),
    leadTime: z.string().optional(),
    pricing: z.any().optional(),
  }).optional(),
});

// GET /api/suppliers - Get all suppliers for current user
router.get('/', async (req, res) => {
  try {
    const where = req.user!.role === 'ADMIN' 
      ? {} // Admins see all
      : { userId: req.user!.id }; // Users see only their own

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ suppliers });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to get suppliers' });
  }
});

// GET /api/suppliers/:id - Get specific supplier
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check ownership (unless admin)
    if (req.user!.role !== 'ADMIN' && supplier.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ supplier });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Failed to get supplier' });
  }
});

// POST /api/suppliers - Create new supplier
router.post('/', async (req, res) => {
  try {
    const { name, contactInfo, capabilities } = supplierSchema.parse(req.body);

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactInfo,
        capabilities,
        userId: req.user!.id,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    res.status(201).json({ 
      message: 'Supplier created successfully',
      supplier 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactInfo, capabilities } = supplierSchema.parse(req.body);

    // Check if supplier exists and user has access
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    if (req.user!.role !== 'ADMIN' && existingSupplier.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, contactInfo, capabilities },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    res.json({ 
      message: 'Supplier updated successfully',
      supplier 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier exists and user has access
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    if (req.user!.role !== 'ADMIN' && existingSupplier.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;
