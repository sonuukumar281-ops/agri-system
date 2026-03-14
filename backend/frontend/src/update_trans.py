import json
import re

file_path = "translations.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We can parse the javascript object, update it, and write it back.
# But python's json can't parse JS `export const translations = { ... };`.
# Let's extract everything inside the first { } using re or manual parsing.
# The structure is: export const translations = { en: { ... }, hi: { ... }, ... };

new_keys = {
    'en': ',\n        offline_synced: "OFFLINE SYNCED",\n        season: "SEASON",\n        quick_actions: "QUICK ACTIONS",\n        blockchain: "BLOCKCHAIN",\n        stage: "Stage",\n        ai_recommendation: "AI Recommendation",\n        smart_sell_alert: "Smart Sell Alert",\n        crop: "Crop",\n        status: "Status",\n        ai_reasoning: "AI Reasoning",\n        updated_2h_ago: "Updated: 2h ago",\n        loading_market_data: "LOADING MARKET DATA...",\n        view_all: "VIEW ALL"',
    'hi': ',\n        offline_synced: "ऑफ़लाइन सिंक किया गया",\n        season: "मौसम",\n        quick_actions: "त्वरित कार्रवाई",\n        blockchain: "ब्लॉकचेन",\n        stage: "चरण",\n        ai_recommendation: "AI अनुशंसा",\n        smart_sell_alert: "स्मार्ट सेल अलर्ट",\n        crop: "फसल",\n        status: "स्थिति",\n        ai_reasoning: "AI तर्क",\n        updated_2h_ago: "अद्यतन: 2 घंटे पहले",\n        loading_market_data: "बाजार डेटा लोड हो रहा है...",\n        view_all: "सभी देखें"',
    'te': ',\n        offline_synced: "ఆఫ్‌లైన్ సమకాలీకరించబడింది",\n        season: "బుతువు",\n        quick_actions: "త్వరిత చర్యలు",\n        blockchain: "బ్లాక్‌చైన్",\n        stage: "దశ",\n        ai_recommendation: "AI సిఫార్సు",\n        smart_sell_alert: "స్మార్ట్ సెల్ అలర్ట్",\n        crop: "పంట",\n        status: "స్థితి",\n        ai_reasoning: "AI తార్కికం",\n        updated_2h_ago: "నవీకరించబడింది: 2 గంటల క్రితం",\n        loading_market_data: "మార్కెట్ డేటా లోడ్ అవుతోంది...",\n        view_all: "అన్నీ చూడండి"',
    'ta': ',\n        offline_synced: "ஆஃப்லைனில் ஒத்திசைக்கப்பட்டது",\n        season: "பருவம்",\n        quick_actions: "விரைவான செயல்கள்",\n        blockchain: "பிளாக்செயின்",\n        stage: "நிலை",\n        ai_recommendation: "AI பரிந்துரை",\n        smart_sell_alert: "ஸ்மார்ட் செல் அலர்ட்",\n        crop: "பயிர்",\n        status: "நிலை",\n        ai_reasoning: "AI பகுத்தறிவு",\n        updated_2h_ago: "புதுப்பிக்கப்பட்டது: 2 மணி நேரத்திற்கு முன்",\n        loading_market_data: "சந்தை தரவு ஏற்றப்படுகிறது...",\n        view_all: "அனைத்தையும் காண்க"',
    'kn': ',\n        offline_synced: "ಆಫ್‌ಲೈನ್ ಸಿಂಕ್ ಮಾಡಲಾಗಿದೆ",\n        season: "ಋತು",\n        quick_actions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",\n        blockchain: "ಬ್ಲಾಕ್‌ಚೈನ್",\n        stage: "ಹಂತ",\n        ai_recommendation: "AI ಶಿಫಾರಸು",\n        smart_sell_alert: "ಸ್ಮಾರ್ಟ್ ಸೆಲ್ ಅಲರ್ಟ್",\n        crop: "ಬೆಳೆ",\n        status: "ಸ್ಥಿತಿ",\n        ai_reasoning: "AI ತಾರ್ಕಿಕ",\n        updated_2h_ago: "ನವೀಕರಿಸಲಾಗಿದೆ: 2 ಗಂಟೆಗಳ ಹಿಂದೆ",\n        loading_market_data: "ಮಾರುಕಟ್ಟೆ ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",\n        view_all: "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ"',
    'mr': ',\n        offline_synced: "ऑफलाइन सिंक केले",\n        season: "हंगाम",\n        quick_actions: "त्वरित क्रिया",\n        blockchain: "ब्लॉकचेन",\n        stage: "टप्पा",\n        ai_recommendation: "AI शिफारस",\n        smart_sell_alert: "स्मार्ट सेल अलर्ट",\n        crop: "पीक",\n        status: "स्थिती",\n        ai_reasoning: "AI तर्क",\n        updated_2h_ago: "अपडेट केले: २ तासांपूर्वी",\n        loading_market_data: "बाजार डेटा लोड करत आहे...",\n        view_all: "सर्व पहा"',
    'bn': ',\n        offline_synced: "অফলাইনে সিঙ্ক হয়েছে",\n        season: "ঋতু",\n        quick_actions: "দ্রুত কর্ম",\n        blockchain: "ব্লকচেইন",\n        stage: "পর্যায়",\n        ai_recommendation: "AI সুপারিশ",\n        smart_sell_alert: "স্মার্ট সেল অ্যালার্ট",\n        crop: "ফসল",\n        status: "স্ট্যাটাস",\n        ai_reasoning: "AI যুক্তি",\n        updated_2h_ago: "আপডেট করা হয়েছে: ২ ঘণ্টা আগে",\n        loading_market_data: "মার্কেটের ডেটা লোড হচ্ছে...",\n        view_all: "সব দেখুন"',
    'gu': ',\n        offline_synced: "ઑફલાઇન સિંક કર્યું",\n        season: "ઋતુ",\n        quick_actions: "ઝડપી ક્રિયાઓ",\n        blockchain: "બ્લોકચેન",\n        stage: "તબક્કો",\n        ai_recommendation: "AI ભલામણ",\n        smart_sell_alert: "સ્માર્ટ સેલ એલર્ટ",\n        crop: "પાક",\n        status: "સ્થિતિ",\n        ai_reasoning: "AI તર્ક",\n        updated_2h_ago: "અપડેટ કર્યું: 2 કલાક પહેલા",\n        loading_market_data: "બજારનો ડેટા લોડ થઈ રહ્યો છે...",\n        view_all: "બધું જુઓ"',
    'pa': ',\n        offline_synced: "ਔਫਲਾਈਨ ਸਿੰਕ ਕੀਤਾ ਗਿਆ",\n        season: "ਸੀਜ਼ਨ",\n        quick_actions: "ਤੁਰੰਤ ਕਾਰਵਾਈਆਂ",\n        blockchain: "ਬਲਾਕਚੇਨ",\n        stage: "ਪੜਾਅ",\n        ai_recommendation: "AI ਸਿਫ਼ਾਰਸ਼",\n        smart_sell_alert: "ਸਮਾਰਟ ਸੇਲ ਅਲਰਟ",\n        crop: "ਫਸਲ",\n        status: "ਸਥਿਤੀ",\n        ai_reasoning: "AI ਤਰਕ",\n        updated_2h_ago: "ਅੱਪਡੇਟ ਕੀਤਾ: 2 ਘੰਟੇ ਪਹਿਲਾਂ",\n        loading_market_data: "ਮਾਰਕੀਟ ਡੇਟਾ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",\n        view_all: "ਸਭ ਦੇਖੋ"',
    'ml': ',\n        offline_synced: "ഓഫ്‌ലൈൻ സമന്വയിപ്പിച്ചു",\n        season: "സീസൺ",\n        quick_actions: "ദ്രുത പ്രവർത്തനങ്ങൾ",\n        blockchain: "ബ്ലോക്ക്ചെയിൻ",\n        stage: "ഘട്ടം",\n        ai_recommendation: "AI ശുപാർശ",\n        smart_sell_alert: "സ്മാർട്ട് സെൽ അലർട്ട്",\n        crop: "വിള",\n        status: "പദവി",\n        ai_reasoning: "AI യുക്തി",\n        updated_2h_ago: "അപ്ഡേറ്റ് ചെയ്തത്: 2 മണിക്കൂർ മുമ്പ്",\n        loading_market_data: "മാർക്കറ്റ് ഡാറ്റ ലോഡുചെയ്യുന്നു...",\n        view_all: "എല്ലാം കാണുക"'
}

for lang, extra in new_keys.items():
    # Find the end of the block for this language, e.g.
    #        best_crop_sell: "AI · Best Crop to Sell Today"
    #    },
    pattern = re.compile(rf'(\n\s+best_crop_sell:.*?\n)(\s+)(}},|\}})', re.DOTALL)
    
    # Let's just find the `best_crop_sell:` line for the specific language and replace it with best_crop_sell + extra
    
    # We can do this easily by regex replacing
    content = re.sub(rf'({lang}:\s+{{.*?)(best_crop_sell:[^\n]*)(?=\n\s+}})', rf'\1\2{extra}', content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated translations.js successfully!")
