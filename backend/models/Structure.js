// backend/models/Structure.js
const mongoose = require('mongoose');

// assortedData এর পুরো স্ট্রাকচারটি একটি ডকুমেন্ট হিসেবে রাখব
const StructureSchema = new mongoose.Schema({
    name: { type: String, default: "quiz_index" },
    data: { type: mongoose.Schema.Types.Mixed } // পুরো অবজেক্টটি এখানে থাকবে
});

module.exports = mongoose.model('Structure', StructureSchema);