import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const router = Router();
const prisma = new PrismaClient();

// GET /api/customers - Get all customers
router.get('/', async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id }
    });
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST /api/customers - Create customer
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customerName, person, email, tel, currency } = req.body;
    const customer = await prisma.customer.create({
      data: {
        customerName: customerName || '',
        person: person || '',
        email: email || '',
        tel: tel || '',
        currency: currency || 'USD'
      }
    });
    res.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// POST /api/customers/sync - Bulk sync from localStorage
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { customers } = req.body;
    if (!Array.isArray(customers)) {
      res.status(400).json({ error: 'customers must be an array' });
      return;
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const c of customers) {
      try {
        // Skip if missing required fields
        if (!c.customerName && !c.name) {
          results.skipped++;
          continue;
        }

        // Check if already exists
        const existing = await prisma.customer.findFirst({
          where: { customerName: c.customerName || c.name || '' }
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.customer.create({
          data: {
            customerName: c.customerName || c.name || '',
            person: c.person || c.contact || c.contactPerson || '',
            email: c.email || '',
            tel: c.tel || c.phone || '',
            currency: c.currency || 'USD'
          }
        });
        results.created++;
      } catch (err: any) {
        results.errors.push(`${c.customerName || c.name}: ${err.message}`);
      }
    }

    res.json({ success: true, ...results });
  } catch (error) {
    console.error('Error syncing customers:', error);
    res.status(500).json({ error: 'Failed to sync customers' });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { customerName, person, email, tel, currency } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        customerName,
        person,
        email,
        tel,
        currency
      }
    });
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.customer.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
