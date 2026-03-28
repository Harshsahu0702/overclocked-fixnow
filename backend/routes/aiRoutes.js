const express = require("express");
const router = express.Router();
const axios = require("axios");
const PartnerProfile = require("../models/PartnerProfile");

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://localhost:8000/detect-service";

router.post("/interpret", async (req, res) => {
    try {
        const { text, lat, lng } = req.body;
        if (!text) return res.status(400).json({ success: false, message: "Text is required" });

        console.log(`🤖 AI Interpretation Request: "${text}"`);
        
        let detectedService = null;
        let confidence = 0;
        let detectionMethod = "python-ai";
        let aiUsed = true;
        let allMatches = [];

        try {
            // STEP 1: Call the new Python Hybrid AI Service (The Single Source of Truth)
            // Timeout set to 30s to handle Render free tier cold starts
            const pyRes = await axios.post(PYTHON_AI_URL, { text }, { timeout: 30000 });
            
            if (pyRes.data && pyRes.data.length > 0 && !pyRes.data[0].error) {
                allMatches = pyRes.data;
                const best = allMatches[0];
                detectedService = best.service;
                
                // Normalize confidence to 0-1 (Python returns ~95, Frontend expects ~0.95)
                confidence = best.confidence > 1 ? best.confidence / 100 : best.confidence;
                detectionMethod = best.source || "python-hybrid-ai";
                aiUsed = !detectionMethod.toLowerCase().includes("keyword");
                
                console.log(`🐍 Python AI Success: ${detectedService} (${Math.round(confidence * 100)}%)`);
            }
        } catch (pyErr) {
            console.error("❌ Python AI Service Down:", pyErr.message);
            return res.status(503).json({ 
                success: false, 
                message: "AI is waking up (cold start), please try again in 10-15 seconds! ☕" 
            });
        }

        if (!detectedService) {
            return res.status(404).json({ 
                success: false, 
                message: "Hum samajh nahi paye ki aapko kaunsi service chahiye. Kripya thoda vistaar mein batayein." 
            });
        }

        // --- PARTNER SEARCH LOGIC ---
        // Find approved, online, and available workers near the customer (7km radius)
        const allNearbyWorkers = await PartnerProfile.find({
            status: 'APPROVED',
            isOnline: true,
            workingStatus: 'AVAILABLE',
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [lng, lat] },
                    $maxDistance: 7000 
                }
            }
        }).select('name phone location rating skills serviceCategory isOnline workingStatus');

        // Filter: only show partners who provide the EXACT detected service
        // Only match if partner's skill/category contains the service name (or is equal)
        // We do NOT do reverse matching (searchTerm.includes(skill)) to avoid false positives
        const searchTerm = detectedService.toLowerCase().trim();
        console.log(`🤖 DEBUG: Detected Service: "${detectedService}" | Searching for: "${searchTerm}"`);

        const serviceMatches = (partnerValue) => {
            if (!partnerValue) return false;
            const val = partnerValue.toLowerCase().trim();
            // 1. Exact match
            if (val === searchTerm) return true;
            // 2. Contains (directional)
            if (val.includes(searchTerm)) return true;
            // 3. Backward match (only for long strings)
            if (searchTerm.includes(val) && val.length >= 5) return true;
            return false;
        };

        const matchedWorkers = allNearbyWorkers.filter(p => {
            const isMatch = (
                (p.serviceCategory && serviceMatches(p.serviceCategory)) ||
                (p.skills && Array.isArray(p.skills) && p.skills.some(s => serviceMatches(s)))
            );
            if (isMatch) console.log(`✅ MATCH: ${p.name}`);
            else console.log(`❌ NO MATCH: ${p.name}`);
            return isMatch;
        });

        console.log(`🔍 LOG: Total Online: ${allNearbyWorkers.length} | Matched: ${matchedWorkers.length}`);

        // Use price directly from Python model
        const estimatedPrice = (allMatches.length > 0 && allMatches[0].price) ? allMatches[0].price : 300;

        res.json({
            success: true,
            service: detectedService,
            confidence: confidence,
            aiUsed: aiUsed,
            detectionMethod: detectionMethod,
            workers: matchedWorkers,
            estimatedPrice: estimatedPrice,
            allMatches: allMatches, 
            source: detectionMethod
        });

    } catch (error) {
        console.error("Interpret Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
