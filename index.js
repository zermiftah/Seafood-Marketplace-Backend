const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());

app.use('/img', express.static(path.join(__dirname, 'data', 'img')));

app.get('/data', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'data.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ message: 'Error reading data' });
        }
        const jsonData = JSON.parse(data).map(product => ({
            ...product,
            Product_Image: `${req.protocol}://${req.get('host')}/img/${product.Product_Image}`
        }));

        res.json(jsonData);
    });
});

const PORT = 3011;
app.listen(PORT, () => {
    console.log(`Server is running on :${PORT}`);
});
