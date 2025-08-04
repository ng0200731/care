import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken, requireOwnership } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schema for master file
const masterFileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  data: z.any(), // JSON data from coordinate viewer
});

// GET /api/master-files - Get all master files for current user
router.get('/', async (req, res) => {
  try {
    const where = req.user!.role === 'ADMIN' 
      ? {} // Admins see all
      : { userId: req.user!.id }; // Users see only their own

    const masterFiles = await prisma.masterFile.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ masterFiles });
  } catch (error) {
    console.error('Get master files error:', error);
    res.status(500).json({ error: 'Failed to get master files' });
  }
});

// GET /api/master-files/:id - Get specific master file
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const masterFile = await prisma.masterFile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    if (!masterFile) {
      return res.status(404).json({ error: 'Master file not found' });
    }

    // Check ownership (unless admin)
    if (req.user!.role !== 'ADMIN' && masterFile.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ masterFile });
  } catch (error) {
    console.error('Get master file error:', error);
    res.status(500).json({ error: 'Failed to get master file' });
  }
});

// POST /api/master-files - Create new master file
router.post('/', async (req, res) => {
  try {
    const { name, description, data } = masterFileSchema.parse(req.body);

    const masterFile = await prisma.masterFile.create({
      data: {
        name,
        description,
        data,
        userId: req.user!.id,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    res.status(201).json({ 
      message: 'Master file created successfully',
      masterFile 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create master file error:', error);
    res.status(500).json({ error: 'Failed to create master file' });
  }
});

// PUT /api/master-files/:id - Update master file
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, data } = masterFileSchema.parse(req.body);

    // Check if master file exists and user has access
    const existingFile = await prisma.masterFile.findUnique({
      where: { id }
    });

    if (!existingFile) {
      return res.status(404).json({ error: 'Master file not found' });
    }

    if (req.user!.role !== 'ADMIN' && existingFile.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const masterFile = await prisma.masterFile.update({
      where: { id },
      data: { name, description, data },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    res.json({ 
      message: 'Master file updated successfully',
      masterFile 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update master file error:', error);
    res.status(500).json({ error: 'Failed to update master file' });
  }
});

// DELETE /api/master-files/:id - Delete master file
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if master file exists and user has access
    const existingFile = await prisma.masterFile.findUnique({
      where: { id }
    });

    if (!existingFile) {
      return res.status(404).json({ error: 'Master file not found' });
    }

    if (req.user!.role !== 'ADMIN' && existingFile.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.masterFile.delete({
      where: { id }
    });

    res.json({ message: 'Master file deleted successfully' });
  } catch (error) {
    console.error('Delete master file error:', error);
    res.status(500).json({ error: 'Failed to delete master file' });
  }
});

export default router;
