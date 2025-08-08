const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3002' }));
app.use(express.json({ limit: '5mb' }));

// Healthcheck
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Master Files endpoints
app.get('/api/master-files', async (req, res) => {
  try {
    const masterFiles = await prisma.masterFile.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json({ masterFiles });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch master files' });
  }
});

app.get('/api/master-files/:id', async (req, res) => {
  try {
    const mf = await prisma.masterFile.findUnique({ where: { id: req.params.id } });
    if (!mf) return res.status(404).json({ error: 'Master file not found' });
    res.json({ masterFile: mf });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch master file' });
  }
});

app.post('/api/master-files', async (req, res) => {
  try {
    const { name, description, width, height, customerId, canvasImage, designData } = req.body;

    // Create; rely on DB unique constraint on name
    try {
      const mf = await prisma.masterFile.create({
        data: {
          name,
          description: description || null,
          width: width || 200,
          height: height || 150,
          customerId: customerId || 'default',
          canvasImage: canvasImage || null,
          data: JSON.stringify({ designData, width, height })
        }
      });
      return res.status(201).json({ masterFile: mf, message: 'Master file created successfully' });
    } catch (err) {
      // Unique constraint violation (name)
      if (err && err.code === 'P2002') {
        return res.status(400).json({ error: `Master file with name "${name}" already exists.` });
      }
      throw err;
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create master file' });
  }
});

app.put('/api/master-files/:id', async (req, res) => {
  try {
    const { name, description, width, height, canvasImage, designData } = req.body;

    const update = {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
      ...(canvasImage !== undefined ? { canvasImage } : {}),
      ...(designData !== undefined ? { data: JSON.stringify({ designData, width, height }) } : {}),
      updatedAt: new Date()
    };

    await prisma.masterFile.update({ where: { id: req.params.id }, data: update });
    res.json({ message: 'Master file updated successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update master file' });
  }
});

app.listen(PORT, () => console.log(`Care Label server running on http://localhost:${PORT}`));

