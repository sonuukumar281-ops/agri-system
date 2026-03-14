import json
import re

file_path = "translations.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_keys = {
    'en': ',\n        my_crops: "My Crops",\n        active_crop_name: "Wheat (PBW-343)",\n        soil_status: "Healthy",\n        water_status: "Opt Water",\n        act_soil: "Soil Check Done",\n        act_crop: "Crop Recommendation Viewed",\n        act_market: "Market Prices Checked",\n        "2h_ago": "2 hours ago",\n        "1d_ago": "1 day ago",\n        "2d_ago": "2 days ago"',
    'hi': ',\n        my_crops: "मेरी फसलें",\n        active_crop_name: "गेहूं (PBW-343)",\n        soil_status: "स्वस्थ",\n        water_status: "इष्टतम पानी",\n        act_soil: "मिट्टी की जांच पूर्ण",\n        act_crop: "फसल सिफारिश देखी गई",\n        act_market: "मंडी भाव देखे गए",\n        "2h_ago": "2 घंटे पहले",\n        "1d_ago": "1 दिन पहले",\n        "2d_ago": "2 दिन पहले"',
    'te': ',\n        my_crops: "నా పంటలు",\n        active_crop_name: "గోధుమ (PBW-343)",\n        soil_status: "ఆరోగ్యకరమైనది",\n        water_status: "సరైన నీరు",\n        act_soil: "మట్టి తనిఖీ పూర్తయింది",\n        act_crop: "పంట సిఫార్సు వీక్షించబడింది",\n        act_market: "మార్కెట్ ధరలు తనిఖీ చేయబడ్డాయి",\n        "2h_ago": "2 గంటల క్రితం",\n        "1d_ago": "1 రోజు క్రితం",\n        "2d_ago": "2 రోజుల క్రితం"',
    'ta': ',\n        my_crops: "என் பயிர்கள்",\n        active_crop_name: "கோதுமை (PBW-343)",\n        soil_status: "ஆரோக்கியமான",\n        water_status: "உகந்த நீர்",\n        act_soil: "மண் சோதனை முடிந்தது",\n        act_crop: "பயிர் பரிந்துரை பார்க்கப்பட்டது",\n        act_market: "சந்தை விலைகள் சரிபார்க்கப்பட்டன",\n        "2h_ago": "2 மணி நேரத்திற்கு முன்",\n        "1d_ago": "1 நாள் முன்",\n        "2d_ago": "2 நாட்களுக்கு முன்"',
    'kn': ',\n        my_crops: "ನನ್ನ ಬೆಳೆಗಳು",\n        active_crop_name: "ಗೋಧಿ (PBW-343)",\n        soil_status: "ಆರೋಗ್ಯಕರ",\n        water_status: "ಸೂಕ್ತ ನೀರು",\n        act_soil: "ಮಣ್ಣಿನ ತಪಾಸಣೆ ಮುಗಿದಿದೆ",\n        act_crop: "ಬೆಳೆ ಶಿಫಾರಸು ವೀಕ್ಷಿಸಲಾಗಿದೆ",\n        act_market: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ",\n        "2h_ago": "2 ಗಂಟೆಗಳ ಹಿಂದೆ",\n        "1d_ago": "1 ದಿನದ ಹಿಂದೆ",\n        "2d_ago": "2 ದಿನಗಳ ಹಿಂದೆ"',
    'mr': ',\n        my_crops: "माझी पिके",\n        active_crop_name: "गहू (PBW-343)",\n        soil_status: "निरोगी",\n        water_status: "इष्टतम पाणी",\n        act_soil: "माती तपासणी पूर्ण",\n        act_crop: "पीक शिफारस पाहिली",\n        act_market: "बाजारभाव तपासले",\n        "2h_ago": "2 तासांपूर्वी",\n        "1d_ago": "1 दिवसापूर्वी",\n        "2d_ago": "2 दिवसांपूर्वी"',
    'bn': ',\n        my_crops: "আমার ফসল",\n        active_crop_name: "গম (PBW-343)",\n        soil_status: "সুস্থ",\n        water_status: "উপযুক্ত জল",\n        act_soil: "মাটি পরীক্ষা সম্পন্ন",\n        act_crop: "ফসল সুপারিশ দেখা হয়েছে",\n        act_market: "বাজার দর যাচাই করা হয়েছে",\n        "2h_ago": "২ ঘন্টা আগে",\n        "1d_ago": "১ দিন আগে",\n        "2d_ago": "২ দিন আগে"',
    'gu': ',\n        my_crops: "મારા પાકો",\n        active_crop_name: "ઘઉં (PBW-343)",\n        soil_status: "સ્વસ્થ",\n        water_status: "શ્રેષ્ઠ પાણી",\n        act_soil: "માટીની તપાસ પૂર્ણ",\n        act_crop: "પાક ભલામણ જોવામાં આવી",\n        act_market: "બજાર ભાવ તપાસ્યા",\n        "2h_ago": "2 કલાક પહેલા",\n        "1d_ago": "1 દિવસ પહેલા",\n        "2d_ago": "2 દિવસ પહેલા"',
    'pa': ',\n        my_crops: "ਮੇਰੀਆਂ ਫਸਲਾਂ",\n        active_crop_name: "ਕਣਕ (PBW-343)",\n        soil_status: "ਸਿਹਤਮੰਦ",\n        water_status: "ਸਰਵੋਤਮ ਪਾਣੀ",\n        act_soil: "ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਪੂਰੀ ਹੋਈ",\n        act_crop: "ਫਸਲ ਦੀ ਸਿਫਾਰਸ਼ ਵੇਖੀ ਗਈ",\n        act_market: "ਬਾਜ਼ਾਰ ਦੀਆਂ ਕੀਮਤਾਂ ਦੀ ਜਾਂਚ ਕੀਤੀ ਗਈ",\n        "2h_ago": "2 ਘੰਟੇ ਪਹਿਲਾਂ",\n        "1d_ago": "1 ਦਿਨ ਪਹਿਲਾਂ",\n        "2d_ago": "2 ਦਿਨ ਪਹਿਲਾਂ"',
    'ml': ',\n        my_crops: "എന്റെ വിളകൾ",\n        active_crop_name: "ഗോതമ്പ് (PBW-343)",\n        soil_status: "ആരോഗ്യകരമായ",\n        water_status: "ഒപ്റ്റിമൽ വെള്ളം",\n        act_soil: "മണ്ണ് പരിശോധന പൂർത്തിയായി",\n        act_crop: "വിള ശുപാർശ കണ്ടു",\n        act_market: "വിപണി വിലകൾ പരിശോധിച്ചു",\n        "2h_ago": "2 മണിക്കൂർ മുമ്പ്",\n        "1d_ago": "1 ദിവസം മുമ്പ്",\n        "2d_ago": "2 ദിവസം മുമ്പ്"'
}

for lang, extra in new_keys.items():
    # Find `view_all: "VIEW ALL"` (or its equivalent for other languages) which we added last time
    content = re.sub(rf'({lang}:\s+{{.*?)(view_all:[^\n]*)(?=\n\s+}})', rf'\1\2{extra}', content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated translations.js with My Crops successfully!")
