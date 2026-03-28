import os
import requests

# -------------------------
# Configuration
# -------------------------
API_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"
HF_TOKEN = os.getenv("HF_TOKEN")
DEFAULT_PRICE = 300

# -------------------------
# Price Map
# -------------------------
PRICE_MAP = {
    "Electrician": 250, "Plumber": 200, "AC Repair": 450, "AC Installation": 800,
    "Refrigerator Repair": 400, "Washing Machine Repair": 350, "Microwave Repair": 300,
    "RO Water Purifier Service": 300, "Geyser Repair": 350, "Inverter & Battery Repair": 300,
    "Carpenter": 350, "Furniture Repair": 300, "Modular Kitchen Installation": 5000,
    "Door & Window Installation": 800, "Glass Fitting": 400, "Aluminium Work": 600,
    "Welder & Fabricator": 400, "Painter": 500, "Waterproofing": 1500, "False Ceiling": 2000,
    "Tile Fitting": 700, "Bathroom Renovation": 8000, "Home Renovation": 15000,
    "Home Cleaning": 400, "Deep Cleaning": 800, "Sofa Cleaning": 500, "Carpet Cleaning": 400,
    "Kitchen Cleaning": 500, "Water Tank Cleaning": 600, "Pest Control": 500,
    "Cockroach Control": 400, "Termite Control": 700, "Mosquito Control": 500,
    "Bed Bug Treatment": 800, "Rat Control": 500, "Men Salon": 150, "Women Salon": 400,
    "Bridal Makeup": 5000, "Party Makeup": 1500, "Mehendi Artist": 1000,
    "Spa & Massage": 800, "Waxing & Threading": 200, "Cook": 700, "Maid": 400,
    "Babysitter": 500, "Elder Care": 600, "Driver": 600, "Packers & Movers": 3000,
    "Computer Repair": 400, "Laptop Repair": 500, "Mobile Repair": 300, "TV Repair": 400,
    "CCTV Installation": 2000, "WiFi & Network Setup": 400, "DTH & Cable Setup": 200,
    "Home Automation": 2000, "Solar Panel Installation": 50000, "Locksmith": 200,
    "Event Decoration": 3000, "Flower Decoration": 2000, "Photography": 3000,
    "Videography": 5000, "DJ & Sound System": 5000, "Tent & Catering": 20000,
    "Car Wash": 300, "Bike Repair": 200, "Tyre Puncture": 100, "Car AC Repair": 500,
    "Yoga Instructor": 500, "Fitness Trainer": 500, "Dietitian": 500,
    "Doctor Home Visit": 500, "Nurse Home Care": 600, "Physiotherapist": 700,
    "Tutor": 500, "Music Teacher": 400, "Dance Teacher": 400, "Graphic Designer": 500,
    "Website Developer": 5000, "App Developer": 10000, "CA & Tax Filing": 1000,
    "Legal Consultant": 1000, "Interior Designer": 5000, "Laundry & Dry Cleaning": 200,
    "Tailor & Alteration": 200, "Shoe Repair": 100, "Watch Repair": 200,
    "Jewellery Repair": 300, "Gas Stove Repair": 250, "Chimney Cleaning": 400,
    "Water Pump Repair": 350, "Borewell & Water Drilling": 5000, "Garden & Landscaping": 500,
    "Tree Cutting": 800, "Swimming Pool Maintenance": 1500, "Security Guard": 800,
    "Courier & Delivery": 100, "Plumbing": 200
}

# -------------------------
# Keywords for Indian Language Detection (Full Dataset)
# -------------------------
SERVICE_KEYWORDS = {
    "Electrician": [
        "bijli", "bijli nahi", "bijli gayi", "light nahi", "light band", "light chali gayi", "andhera", "pankha", 
        "pankha nahi chalta", "switch kharab", "wire", "taar", "taar jal gaya", "short", "short circuit", "spark", 
        "current", "socket", "plug", "mcb", "mcb trip", "fuse", "fuse ud gaya", "meter", "electric meter", 
        "wiring", "rewiring", "board kharab", "switchboard", "dimmer", "regulator", "fan regulator", "ceiling fan", 
        "exhaust fan", "fan nahi chalta", "bulb futa", "tubelight", "led", "led kharab", "ghar ki light", 
        "bijli ka kaam", "electric ka kaam", "bijli wala", "electrician", "electrical", "electric", "power outage", 
        "no power", "power gone", "trip", "tripped", "breaker", "main switch", "distribution box", "db box", 
        "socket not working", "fan not working", "light not working", "bulb not working", "new connection"
    ],
    "Plumber": [
        "nal", "nal se pani aata", "nal band", "nal tuta", "nal kharab", "tap", "tap se pani", "tapkana", 
        "tapak raha", "pani tapak raha", "pipe", "pipe phata", "pipe tuti", "pipe leak", "nali", "nali jam", 
        "nali band", "drain jam", "toilet", "flush", "flush nahi hota", "commode", "seat tuti", "toilet se pani", 
        "latrine", "bathroom", "shower", "shower kharab", "washbasin", "basin", "tank", "overhead tank", 
        "tank se pani", "motor", "pani ki motor", "pump", "pump kharab", "pani nahi aata", "pani band", 
        "pani ka pressure", "pressure kam", "gutter", "sewer", "manhole", "plumber", "plumbing", "nali safai", 
        "blockage", "water leaking", "water dripping"
    ],
    "AC Repair": [
        "ac", "ac kharab", "ac nahi chalta", "ac band ho gaya", "cooling nahi", "thanda nahi", "ac thanda nahi karta", 
        "gas khatam", "gas leak", "gas bharo", "gas refill", "ac se pani tapak raha", "ac service", "ac servicing", 
        "filter safai", "filter cleaning", "ac ki service", "split ac", "window ac", "inverter ac", "ac remote", 
        "remote kaam nahi karta", "ac bahut shor karta", "noise aa rahi", "ac smell", "bijli zyada", 
        "ac ka compressor", "compressor kharab"
    ],
    "AC Installation": ["new ac lagana", "ac fit karna", "ac install", "ac fitting", "ac mount karna", "ac lagwana hai"],
    "Refrigerator Repair": ["fridge", "fridge kharab", "fridge band", "fridge thanda nahi", "refrigerator", "cool nahi karta", "freezer kaam nahi", "ice nahi banta", "fridge compressor"],
    "Washing Machine Repair": ["washing machine", "machine nahi chalta", "kapde nahi dhulate", "spin nahi hota", "drum", "pani nahi bhar raha", "semi automatic", "fully automatic"],
    "Microwave Repair": ["microwave", "microwave kharab", "oven kaam nahi karta", "garam nahi karta", "heat nahi", "khana garam nahi", "micro kharab", "turntable nahi ghoomta"],
    "RO Water Purifier Service": ["ro", "ro kharab", "ro se pani nahi aata", "water purifier", "purifier kharab", "filter change", "membrane change", "ro service", "pani saf nahi", "pani ka taste kharab"],
    "Geyser Repair": ["geyser", "geyser kharab", "garam pani nahi aata", "hot water nahi", "heater kharab", "water heater", "geyser leak", "geyser trip"],
    "Inverter & Battery Repair": ["inverter", "inverter kharab", "battery khatam", "backup nahi deta", "ups kharab", "power cut pe nahi chalta", "battery swap", "battery replace"],
    "Carpenter": ["darwaja", "darwaja kharab", "lakdi", "wood", "lakdi ka kaam", "furniture", "furniture banana", "furniture repair", "table", "chair", "bed", "almirah", "door lock", "carpenter", "mistri", "badhai"],
    "Furniture Repair": ["sofa tuta", "sofa repair", "sofa spring", "chair tuti", "chair repair", "bed repair", "furniture fix", "foam change"],
    "Modular Kitchen Installation": ["kitchen", "modular kitchen", "kitchen banana", "kitchen fitting", "kitchen platform", "countertop", "chimney fitting", "hob fitting"],
    "Door & Window Installation": ["naya darwaja", "door lagana", "new door", "window lagana", "khidki", "upvc door", "sliding door", "door frame"],
    "Glass Fitting": ["glass", "sheesha tuta", "mirror", "mirror fitting", "window glass tuta", "glass lagana", "glass crack", "glass door"],
    "Aluminium Work": ["aluminium", "aluminium door", "aluminium window", "aluminium partition", "sliding window aluminium"],
    "Welder & Fabricator": ["welding", "weld karna", "iron gate", "gate banana", "grill banana", "railing", "iron work", "metal fabrication"],
    "Painter": ["paint", "rang", "paint karna", "wall paint", "ghar paint karna", "painting", "whitewash", "safedi", "putty", "texture", "varnish", "painter"],
    "Waterproofing": ["seelan", "seepage", "leakage", "chhat se pani", "roof leak", "wall me pani", "damp wall", "waterproof", "waterproofing"],
    "False Ceiling": ["false ceiling", "pop ceiling", "gypsum ceiling", "ceiling design", "ceiling work", "pop work"],
    "Tile Fitting": ["tiles", "tile fitting", "tile lagana", "floor tiles", "wall tiles", "marble", "marble fitting", "granite", "tile crack"],
    "Bathroom Renovation": ["bathroom banwana", "bathroom renovation", "new bathroom", "bathroom tiles change", "toilet seat change", "commode change"],
    "Home Renovation": ["ghar banwana", "ghar renovate", "ghar repair", "home renovation", "home improvement", "makeover", "home remodel"],
    "Home Cleaning": ["ghar safai", "safai karo", "cleaning chahiye", "ghar saaf", "room cleaning", "house cleaning"],
    "Deep Cleaning": ["deep cleaning", "thorough cleaning", "full cleaning", "kitchen deep clean", "bathroom deep clean", "festive cleaning", "diwali cleaning"],
    "Sofa Cleaning": ["sofa saaf", "sofa cleaning", "sofa dirty", "sofa stain", "sofa wash", "couch cleaning"],
    "Carpet Cleaning": ["carpet", "carpet saaf", "carpet cleaning", "rug cleaning", "darri", "carpet stain"],
    "Kitchen Cleaning": ["kitchen saaf", "kitchen cleaning", "chimney clean", "hob cleaning", "stove saaf", "exhaust clean"],
    "Water Tank Cleaning": ["tank safai", "tank clean", "water tank saaf", "underground tank", "overhead tank clean", "sump cleaning"],
    "Pest Control": ["keede", "keede makode", "insects", "pest control", "spray karo", "spray chahiye"],
    "Cockroach Control": ["cockroach", "til chatta", "roach", "kitchen me keede", "roach control"],
    "Termite Control": ["termite", "deemak", "deemak lag gayi", "wood kha rahi", "white ants", "safed cheeti", "furniture kharab"],
    "Mosquito Control": ["machchar", "mosquito", "dengue", "malaria", "fogging", "mosquito spray"],
    "Bed Bug Treatment": ["khatmal", "bed bug", "mattress keede", "biting at night", "bed bug treatment"],
    "Rat Control": ["chuha", "chuhe", "rat", "mouse", "rodent", "chuha pakadna", "rat trap"],
    "Men Salon": ["haircut", "bal katna", "shave", "daadi", "beard trim", "gents salon", "men parlour"],
    "Women Salon": ["parlour", "ladies salon", "hair cut ladies", "facial", "bleach", "detan", "cleanup", "pedicure", "manicure"],
    "Bridal Makeup": ["bride makeup", "shaadi makeup", "wedding makeup", "dulhan makeup", "bridal", "engagement makeup"],
    "Party Makeup": ["party makeup", "event makeup", "function makeup", "makeup artist", "MUA"],
    "Mehendi Artist": ["mehendi", "henna", "mehendi lagana", "mehendi design", "mehendi artist"],
    "Spa & Massage": ["massage", "body massage", "spa", "full body massage", "head massage", "foot massage"],
    "Waxing & Threading": ["waxing", "wax karna", "threading", "eyebrow threading", "upper lip", "hair removal"],
    "Cook": ["cook", "khana banana", "rasoi", "cooking", "chef", "home cook", "khana chahiye"],
    "Maid": ["maid", "bai", "jhaadu pocha", "kaam wali", "sahayika", "bartan saaf", "househelp"],
    "Babysitter": ["baby", "baby care", "child care", "baccha", "babysitter", "nanny", "day care"],
    "Elder Care": ["old age care", "elderly", "patient care", "attendant", "caregiver", "senior care"],
    "Driver": ["driver", "gaadi chalana", "chauffeur", "car driver", "office driver"],
    "Packers & Movers": ["shifting", "ghar shift", "move karna", "packers movers", "relocation", "saman shift"],
    "Computer Repair": ["computer", "pc", "desktop", "cpu", "computer slow", "virus", "windows install", "data recovery"],
    "Laptop Repair": ["laptop", "laptop screen tuta", "laptop slow", "charging nahi", "macbook repair", "laptop repair"],
    "Mobile Repair": ["mobile", "phone kharab", "screen tuta", "display kharab", "phone on nahi", "iphone repair", "mobile repair"],
    "TV Repair": ["tv", "television", "tv kharab", "tv screen", "smart tv", "led tv", "tv repair"],
    "CCTV Installation": ["cctv", "camera lagana", "security camera", "cctv setup", "cctv install"],
    "WiFi & Network Setup": ["wifi", "wifi nahi chal raha", "internet nahi", "router", "broadband", "network", "slow internet"],
    "DTH & Cable Setup": ["dth", "dish tv", "tata sky", "signal nahi", "set top box", "cable tv"],
    "Home Automation": ["smart home", "automation", "alexa", "google home", "smart switch", "home automation"],
    "Solar Panel Installation": ["solar", "solar panel", "solar lagana", "rooftop solar", "solar heater"],
    "Locksmith": ["lock", "lock tuta", "lock kharab", "chabi kho gayi", "duplicate key", "locksmith", "key banana"],
    "Event Decoration": ["decoration", "decor", "sajawat", "balloon decoration", "party decor", "birthday decoration"],
    "Flower Decoration": ["flower decoration", "phool", "phool sajawat", "rose decoration", "mandap decoration"],
    "Photography": ["photographer", "photo", "photo shoot", "wedding photographer", "event photo"],
    "Videography": ["videographer", "video", "video shoot", "wedding video", "reels banana"],
    "DJ & Sound System": ["dj", "sound system", "speaker", "dj booking", "music system"],
    "Tent & Catering": ["tent", "shamiana", "catering", "caterer", "buffet", "pandit"],
    "Car Wash": ["car wash", "gaadi saaf", "car cleaning", "car detailing", "foam wash"],
    "Bike Repair": ["bike repair", "bike kharab", "motorcycle", "scooter repair", "bike oil change"],
    "Tyre Puncture": ["puncture", "tyre puncture", "tyre flat", "flat tyre", "tyre bhar do"],
    "Car AC Repair": ["car ac", "car ac kharab", "car thanda nahi", "car cooling", "car ac gas"],
    "Yoga Instructor": ["yoga", "yoga class", "yoga trainer", "meditation", "morning yoga"],
    "Fitness Trainer": ["gym trainer", "personal trainer", "fitness trainer", "workout", "fat loss"],
    "Dietitian": ["diet", "dietitian", "nutritionist", "diet chart", "meal plan"],
    "Doctor Home Visit": ["doctor", "doctor ghar aao", "home visit doctor", "checkup ghar", "fever"],
    "Nurse Home Care": ["nurse", "nursing care", "patient attend", "injection nurse", "iv nurse"],
    "Physiotherapist": ["physiotherapy", "physio", "joint pain", "physio at home", "back pain massage"],
    "Tutor": ["tutor", "tuition", "padhai", "home tutor", "teacher chahiye", "maths tutor"],
    "Music Teacher": ["music", "guitar sikhna", "singing class", "music teacher", "instrument sikhna"],
    "Dance Teacher": ["dance", "dance class", "dance sikhna", "dance teacher", "zumba"],
    "Graphic Designer": ["graphic design", "logo banana", "banner design", "poster design", "visiting card"],
    "Website Developer": ["website", "website banana", "website design", "web developer", "wordpress"],
    "App Developer": ["app banana", "mobile app", "android app", "ios app", "flutter", "react native"],
    "CA & Tax Filing": ["ca", "chartered accountant", "tax filing", "itr", "gst", "income tax"],
    "Legal Consultant": ["lawyer", "vakil", "legal advice", "court", "notice", "legal consultant"],
    "Interior Designer": ["interior", "interior design", "interior decorator", "room design", "ghar sajana"],
    "Laundry & Dry Cleaning": ["laundry", "dry cleaning", "kapde dhulai", "dry clean", "ironing", "press"],
    "Tailor & Alteration": ["tailor", "darzi", "silai", "blouse silwana", "alteration", "stitching"],
    "Shoe Repair": ["shoe repair", "joote kharab", "sole tuti", "mochi", "cobbler"],
    "Watch Repair": ["watch repair", "ghadi kharab", "strap change", "battery watch"],
    "Jewellery Repair": ["jewellery repair", "zevar", "ring tuta", "sona theek", "gold repair"],
    "Gas Stove Repair": ["gas stove", "chulha", "chulha kharab", "burner kharab", "stove repair", "ignition nahi"],
    "Chimney Cleaning": ["chimney", "chimney cleaning", "chimney mask", "hood cleaning"],
    "Water Pump Repair": ["pump", "water pump", "motor pump", "pump kharab", "submersible"],
    "Borewell & Water Drilling": ["borewell", "boring", "naya boring", "water boring", "hand pump"],
    "Garden & Landscaping": ["garden", "gardening", "mali", "paudha lagana", "lawn mowing"],
    "Tree Cutting": ["ped", "ped katna", "tree cutting", "tree removal", "branch cut"],
    "Swimming Pool Maintenance": ["pool", "swimming pool", "pool cleaning", "pool repair"],
    "Security Guard": ["security", "guard", "watchman", "chowkidar", "security guard hire"],
    "Courier & Delivery": ["courier", "delivery", "parcel", "send karna", "package"],
}

def detect_by_keywords(text):
    text = text.lower()
    scores = {}

    for service, words in SERVICE_KEYWORDS.items():
        count = 0
        for w in words:
            if w in text:
                count += 1
        if count > 0:
            # We scale score by count, but cap it.
            # Base confidence of 0.7 if 1 word matches, +0.1 for each extra match
            scores[service] = min(0.7 + (count * 0.1), 0.98)

    if not scores:
        return []

    # Sort and take top 3
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    results = []
    for service, score in sorted_scores[:3]:
        price = PRICE_MAP.get(service, DEFAULT_PRICE)
        results.append({
            "service": service,
            "confidence": int(score * 100),
            "price": price,
            "source": "FixNow Keyword Engine"
        })
    return results

def classify_service(text):
    # Step 1: Rule-based (Keywords)
    rule_results = detect_by_keywords(text)
    
    # If we have a very strong keyword match (> 90%), we favor it
    if rule_results and rule_results[0]["confidence"] >= 90:
        return rule_results

    # Step 2: HuggingFace Fallback / Enhancement
    if not HF_TOKEN:
        return rule_results if rule_results else [{"error": "No service detected and tokens missing"}]

    payload = {
        "inputs": text,
        "parameters": {
            "candidate_labels": list(PRICE_MAP.keys())
        }
    }

    try:
        response = requests.post(API_URL, headers={"Authorization": f"Bearer {HF_TOKEN}"}, json=payload, timeout=10)
        data = response.json()

        if isinstance(data, list): data = data[0]

        if "labels" in data:
            hf_results = []
            for i in range(min(3, len(data["labels"]))):
                label = data["labels"][i]
                score = data["scores"][i]
                price = PRICE_MAP.get(label, DEFAULT_PRICE)
                hf_results.append({
                    "service": label,
                    "confidence": int(score * 100),
                    "price": price,
                    "source": "HuggingFace Hybrid AI"
                })
            
            # If we found keywords but HF also found something, combined results might be good.
            # But the requirement asks for Top 3. Usually HF results are more comprehensive for top 3.
            return hf_results

        return rule_results if rule_results else [{"error": "Internal AI error"}]

    except Exception as e:
        return rule_results if rule_results else [{"error": f"AI service unavailable: {str(e)}"}]
