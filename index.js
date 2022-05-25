const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, '/dist')));

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('http://localhost:' + PORT);
})