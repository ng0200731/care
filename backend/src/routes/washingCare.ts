import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';

const router = Router();
const prisma = new PrismaClient();

// Get all shortform records
router.get('/shortform', async (req, res) => {
  try {
    const shortforms = await prisma.shortForm.findMany({
      orderBy: {
        symbol: 'asc'
      }
    });
    
    res.json({
      success: true,
      data: shortforms,
      count: shortforms.length
    });
  } catch (error) {
    console.error('Error fetching shortform data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shortform data'
    });
  }
});

// Get shortform by ID
router.get('/shortform/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const shortform = await prisma.shortForm.findUnique({
      where: { id }
    });
    
    if (!shortform) {
      return res.status(404).json({
        success: false,
        error: 'Shortform record not found'
      });
    }
    
    res.json({
      success: true,
      data: shortform
    });
  } catch (error) {
    console.error('Error fetching shortform record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shortform record'
    });
  }
});

// Search shortform by symbol or code
router.get('/shortform/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const shortforms = await prisma.shortForm.findMany({
      where: {
        OR: [
          { symbol: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: {
        symbol: 'asc'
      }
    });
    
    res.json({
      success: true,
      data: shortforms,
      count: shortforms.length
    });
  } catch (error) {
    console.error('Error searching shortform data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search shortform data'
    });
  }
});

// Get all composition records
router.get('/composition', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const take = limit ? parseInt(limit as string) : undefined;
    const skip = offset ? parseInt(offset as string) : undefined;
    
    const compositions = await prisma.composition.findMany({
      take,
      skip,
      orderBy: {
        material: 'asc'
      }
    });
    
    const total = await prisma.composition.count();
    
    res.json({
      success: true,
      data: compositions,
      count: compositions.length,
      total,
      pagination: {
        limit: take,
        offset: skip,
        hasMore: skip !== undefined && take !== undefined ? (skip + take) < total : false
      }
    });
  } catch (error) {
    console.error('Error fetching composition data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch composition data'
    });
  }
});

// Get composition by ID
router.get('/composition/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const composition = await prisma.composition.findUnique({
      where: { id }
    });
    
    if (!composition) {
      return res.status(404).json({
        success: false,
        error: 'Composition record not found'
      });
    }
    
    res.json({
      success: true,
      data: composition
    });
  } catch (error) {
    console.error('Error fetching composition record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch composition record'
    });
  }
});

// Search composition by material or other fields
router.get('/composition/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit, offset } = req.query;
    const take = limit ? parseInt(limit as string) : 50; // Default limit for search
    const skip = offset ? parseInt(offset as string) : undefined;
    
    const compositions = await prisma.composition.findMany({
      where: {
        OR: [
          { material: { contains: query, mode: 'insensitive' } },
          { percentage: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { properties: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } }
        ]
      },
      take,
      skip,
      orderBy: {
        material: 'asc'
      }
    });
    
    res.json({
      success: true,
      data: compositions,
      count: compositions.length
    });
  } catch (error) {
    console.error('Error searching composition data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search composition data'
    });
  }
});

// Get unique materials from composition
router.get('/composition/materials/unique', async (req, res) => {
  try {
    const materials = await prisma.composition.findMany({
      select: {
        material: true
      },
      distinct: ['material'],
      orderBy: {
        material: 'asc'
      }
    });
    
    const uniqueMaterials = materials
      .map(item => item.material)
      .filter(material => material && material.trim() !== '');
    
    res.json({
      success: true,
      data: uniqueMaterials,
      count: uniqueMaterials.length
    });
  } catch (error) {
    console.error('Error fetching unique materials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unique materials'
    });
  }
});

// Get database statistics
router.get('/stats', async (req, res) => {
  try {
    const shortformCount = await prisma.shortForm.count();
    const compositionCount = await prisma.composition.count();
    
    res.json({
      success: true,
      data: {
        shortform: {
          total: shortformCount
        },
        composition: {
          total: compositionCount
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;
