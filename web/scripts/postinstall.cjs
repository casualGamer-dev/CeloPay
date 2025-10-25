
const fs = require('fs'); const path = require('path');
const file = process.env.DATA_FILE || path.join(process.cwd(),'data','store.json');
if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file), { recursive: true });
if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ circles: [], loans: [] }, null, 2));
