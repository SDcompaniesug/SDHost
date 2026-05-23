const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const STORAGE_DIR = path.join(__dirname, 'pastes');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Create storage directory if it doesn't exist
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR);
    console.log('Created pastes directory');
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'SDPaste API is running',
        endpoints: {
            create: 'POST /api/pastes',
            read: 'GET /api/pastes/:id',
            update: 'PUT /api/pastes/:id',
            delete: 'DELETE /api/pastes/:id'
        }
    });
});

// CREATE a new paste
app.post('/api/pastes', (req, res) => {
    try {
        const { title, content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        
        // Generate unique ID
        const id = crypto.randomBytes(8).toString('hex');
        const now = Date.now();
        
        const paste = {
            id: id,
            title: title || 'Untitled',
            content: content,
            created_at: now,
            updated_at: now,
            views: 0
        };
        
        // Save to file
        const filePath = path.join(STORAGE_DIR, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(paste, null, 2));
        
        console.log(`Created paste: ${id}`);
        
        res.json({
            success: true,
            id: id,
            url: `https://${req.get('host')}/api/pastes/${id}`,
            message: 'Paste created successfully'
        });
        
    } catch (error) {
        console.error('Create error:', error);
        res.status(500).json({ error: 'Failed to create paste' });
    }
});

// READ a paste
app.get('/api/pastes/:id', (req, res) => {
    try {
        const id = req.params.id;
        const filePath = path.join(STORAGE_DIR, `${id}.json`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Paste not found' });
        }
        
        // Read paste
        const paste = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Increment view count
        paste.views++;
        fs.writeFileSync(filePath, JSON.stringify(paste, null, 2));
        
        console.log(`Viewed paste: ${id} (${paste.views} views)`);
        
        res.json(paste);
        
    } catch (error) {
        console.error('Read error:', error);
        res.status(500).json({ error: 'Failed to read paste' });
    }
});

// UPDATE a paste
app.put('/api/pastes/:id', (req, res) => {
    try {
        const id = req.params.id;
        const filePath = path.join(STORAGE_DIR, `${id}.json`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Paste not found' });
        }
        
        // Read existing paste
        const paste = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Update fields
        if (req.body.title) paste.title = req.body.title;
        if (req.body.content) paste.content = req.body.content;
        paste.updated_at = Date.now();
        
        // Save updated paste
        fs.writeFileSync(filePath, JSON.stringify(paste, null, 2));
        
        console.log(`Updated paste: ${id}`);
        
        res.json({
            success: true,
            message: 'Paste updated successfully'
        });
        
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update paste' });
    }
});

// DELETE a paste
app.delete('/api/pastes/:id', (req, res) => {
    try {
        const id = req.params.id;
        const filePath = path.join(STORAGE_DIR, `${id}.json`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Paste not found' });
        }
        
        // Delete file
        fs.unlinkSync(filePath);
        
        console.log(`Deleted paste: ${id}`);
        
        res.json({
            success: true,
            message: 'Paste deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete paste' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SDPaste API running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}`);
    console.log(`📝 Create paste: POST http://localhost:${PORT}/api/pastes`);
});