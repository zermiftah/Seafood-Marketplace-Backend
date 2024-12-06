const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
 
const app = express();

app.use(express.json());
const corsOptions = {
    origin: '*', 
    methods: ['GET', 'POST', 'DELETE'], 
    allowedHeaders: ['Content-Type'], // Allow headers you expect to use
};

app.use(cors(corsOptions));

app.use('/img', express.static(path.join(__dirname, 'data', 'img')));

app.get('/data', cors(), (req, res) => {
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


app.post('/freezer', cors(), (req, res) => {
    const { Username } = req.body;

    if (!Username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    const filePath = path.join(__dirname, 'data', 'UserData.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ message: 'Error reading user data' });
        }

        let users;
        try {
            users = JSON.parse(data); 
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ message: 'Error parsing user data' });
        }

        const user = users.find(u => u.Username === Username);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updatedUser = {
            ...user,
            Freezer: user.Freezer.map(product => ({
                ...product,
                Product_Image: `${req.protocol}://${req.get('host')}/img/${product.Product_Image}`
            }))
        };

        return res.status(200).json(updatedUser);
    });
});

app.delete('/freezer', cors(), (req, res) => {
    const { Username, Product_Name } = req.body;

    if (!Username || !Product_Name) {
        return res.status(400).json({ message: 'Username and Product_Name are required' });
    }

    const filePath = path.join(__dirname, 'data', 'UserData.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ message: 'Error reading user data' });
        }

        let users;
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ message: 'Error parsing user data' });
        }

        const user = users.find(u => u.Username === Username);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Filter out the product to delete based on Product_Name
        const updatedFreezer = user.Freezer.filter(product => product.Product_Name !== Product_Name);

        if (updatedFreezer.length === user.Freezer.length) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update the user data with the filtered Freezer array
        const updatedUser = { ...user, Freezer: updatedFreezer };
        const updatedUsers = users.map(u => u.Username === Username ? updatedUser : u);

        fs.writeFile(filePath, JSON.stringify(updatedUsers, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing file:', writeErr);
                return res.status(500).json({ message: 'Error updating user data' });
            }

            return res.status(200).json({ message: 'Product deleted successfully' });
        });
    });
});


app.post('/add-to-freezer', cors(), (req, res) => {
    const { Username, Product_Name, Product_Category, Product_Image, Product_Price, Count, Discount } = req.body;

    // Validasi input
    if (!Username || !Product_Name || !Product_Category || !Product_Image || Product_Price == null || Count == null || Discount == null) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const filePath = path.join(__dirname, 'data', 'UserData.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ message: 'Error reading user data' });
        }

        let users;
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).json({ message: 'Error parsing user data' });
        }

        const user = users.find(u => u.Username === Username);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if product already exists in the freezer
        const existingProduct = user.Freezer.find(p => p.Product_Name === Product_Name);

        if (existingProduct) {
            // Update the count if the product already exists
            existingProduct.Count += Count;
            fs.writeFile(filePath, JSON.stringify(users, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('Error writing file:', writeErr);
                    return res.status(500).json({ message: 'Error saving user data' });
                }
                return res.status(200).json({ message: 'Product count updated successfully', product: existingProduct });
            });
        } else {
            // Add the new product if it doesn't exist
            const newProduct = {
                Product_Name,
                Product_Category,
                Product_Image,
                Product_Price,
                Count,
                Discount
            };

            user.Freezer.push(newProduct);

            fs.writeFile(filePath, JSON.stringify(users, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('Error writing file:', writeErr);
                    return res.status(500).json({ message: 'Error saving user data' });
                }
                return res.status(200).json({ message: 'Product added to freezer successfully', product: newProduct });
            });
        }
    });
});


app.post('/login', cors(), (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const filePath = path.join(__dirname, 'data', 'UserData.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ message: 'Error reading user data' });
        }

        const jsonData = JSON.parse(data);
        const user = jsonData.find(u => u.Username === username && u.Password === password);

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const userData = {
            Username: user.Username
        };

        res.json({ message: 'Login successful', user: userData });
    });
});

const API_URL = 'https://seafood-marketplace-backend.glitch.me';

app.listen(process.env.PORT || 3011, () => {
    console.log(`Server is running on ${API_URL}`);
});
