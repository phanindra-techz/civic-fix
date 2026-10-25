import type { IssueCategory, LanguageCode } from './types'

export interface GuideStrings {
  greeting: string
  placeholder: string
  categories: Record<IssueCategory, string>
  intro: (cat: string) => string
  steps: [string, string, string]
  dept: (dept: string, sla: number) => string
  autofill: string
  submitNow: string
  track: (id: string, status: string) => string
  noTicket: string
  fallback: string
  submitted: (id: string, dept: string) => string
  suggestions: string[]
  listening: string
}

export const GUIDE_STRINGS: Record<LanguageCode, GuideStrings> = {
  en: {
    greeting:
      "Hi! I'm CivicGuide. I can help you report potholes, garbage, waterlogging or broken streetlights — in your language, by text or voice.",
    placeholder: 'Type or speak your issue…',
    categories: {
      pothole: 'pothole',
      garbage: 'garbage issue',
      waterlogging: 'waterlogging issue',
      streetlight: 'broken streetlight',
      traffic: 'traffic issue',
    },
    intro: (cat) => `Reporting a ${cat} is quick:`,
    steps: [
      'Snap or upload a photo of the problem',
      'Your GPS location is tagged automatically',
      'Submit — you get a ticket ID and an SLA deadline',
    ],
    dept: (dept, sla) => `It will be routed to ${dept}. Resolution SLA: ${sla} hours.`,
    autofill: 'Autofill & open form',
    submitNow: 'Submit for me now',
    track: (id, status) => `Ticket ${id} is currently: ${status}`,
    noTicket: "You don't have any complaints yet. Report an issue first and I'll track it for you.",
    fallback: "Sorry, I didn't catch that. Ask me about potholes, garbage, waterlogging, streetlights, or tracking a complaint.",
    submitted: (id, dept) => `Done! Complaint registered as ${id} and assigned to ${dept}.`,
    suggestions: ['How do I report a pothole?', 'Streetlight not working in my lane', 'Garbage not collected', 'Track my complaint'],
    listening: 'Listening…',
  },
  te: {
    greeting:
      'నమస్కారం! నేను సివిక్‌గైడ్. రోడ్డు గుంతలు, చెత్త, నీటి నిల్వ లేదా వీధి దీపాల సమస్యలను నివేదించడంలో మీకు సహాయం చేస్తాను.',
    placeholder: 'మీ సమస్యను టైప్ చేయండి లేదా మాట్లాడండి…',
    categories: { pothole: 'రోడ్డు గుంత', garbage: 'చెత్త', waterlogging: 'నీటి నిల్వ', streetlight: 'వీధి దీపం', traffic: 'ట్రాఫిక్' },
    intro: (cat) => `${cat} సమస్యను నివేదించడం సులభం:`,
    steps: [
      'సమస్య ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి',
      'మీ GPS స్థానం ఆటోమేటిక్‌గా జోడించబడుతుంది',
      'సమర్పించండి — మీకు టికెట్ ID మరియు SLA గడువు లభిస్తుంది',
    ],
    dept: (dept, sla) => `ఇది ${dept} కు పంపబడుతుంది. పరిష్కార గడువు: ${sla} గంటలు.`,
    autofill: 'ఫారమ్ నింపి తెరవండి',
    submitNow: 'ఇప్పుడే సమర్పించండి',
    track: (id, status) => `టికెట్ ${id} ప్రస్తుత స్థితి: ${status}`,
    noTicket: 'మీ పేరుపై ఇంకా ఫిర్యాదులు లేవు. ముందుగా ఒక సమస్యను నివేదించండి.',
    fallback: 'క్షమించండి, అర్థం కాలేదు. గుంతలు, చెత్త, నీటి నిల్వ లేదా వీధి దీపాల గురించి అడగండి.',
    submitted: (id, dept) => `ఫిర్యాదు నమోదైంది! టికెట్ ${id} — ${dept} కు కేటాయించబడింది.`,
    suggestions: ['గుంతను ఎలా నివేదించాలి?', 'మా వీధిలో లైట్ పనిచేయడం లేదు', 'చెత్త సేకరించలేదు', 'నా ఫిర్యాదు స్థితి ట్రాక్'],
    listening: 'వింటున్నాను…',
  },
  hi: {
    greeting: 'नमस्ते! मैं सिविकगाइड हूँ। गड्ढे, कचरा, जलभराव या स्ट्रीटलाइट की शिकायत दर्ज करने में आपकी मदद करूँगा।',
    placeholder: 'अपनी समस्या लिखें या बोलें…',
    categories: { pothole: 'सड़क का गड्ढा', garbage: 'कचरा', waterlogging: 'जलभराव', streetlight: 'स्ट्रीटलाइट', traffic: 'ट्रैफ़िक' },
    intro: (cat) => `${cat} की शिकायत दर्ज करना आसान है:`,
    steps: [
      'समस्या की फ़ोटो लें या अपलोड करें',
      'आपका GPS स्थान अपने-आप जुड़ जाएगा',
      'सबमिट करें — आपको टिकट ID और SLA समय-सीमा मिलेगी',
    ],
    dept: (dept, sla) => `यह ${dept} को भेजा जाएगा। समाधान समय-सीमा: ${sla} घंटे।`,
    autofill: 'फ़ॉर्म भरकर खोलें',
    submitNow: 'अभी सबमिट करें',
    track: (id, status) => `टिकट ${id} की वर्तमान स्थिति: ${status}`,
    noTicket: 'आपके नाम पर अभी कोई शिकायत नहीं है। पहले एक समस्या दर्ज करें।',
    fallback: 'माफ़ कीजिए, मैं समझ नहीं पाया। गड्ढे, कचरा, जलभराव या स्ट्रीटलाइट के बारे में पूछें।',
    submitted: (id, dept) => `शिकायत दर्ज हो गई! टिकट ${id} — ${dept} को सौंपा गया।`,
    suggestions: ['गड्ढे की शिकायत कैसे करें?', 'मेरी गली की लाइट खराब है', 'कचरा नहीं उठाया गया', 'मेरी शिकायत ट्रैक करें'],
    listening: 'सुन रहा हूँ…',
  },
  kn: {
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು ಸಿವಿಕ್‌ಗೈಡ್. ರಸ್ತೆ ಗುಂಡಿ, ಕಸ, ನೀರು ನಿಲ್ಲುವಿಕೆ ಅಥವಾ ಬೀದಿ ದೀಪದ ದೂರು ನೀಡಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.',
    placeholder: 'ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ…',
    categories: { pothole: 'ರಸ್ತೆ ಗುಂಡಿ', garbage: 'ಕಸ', waterlogging: 'ನೀರು ನಿಲ್ಲುವಿಕೆ', streetlight: 'ಬೀದಿ ದೀಪ', traffic: 'ಸಂಚಾರ' },
    intro: (cat) => `${cat} ದೂರು ನೀಡುವುದು ಸುಲಭ:`,
    steps: [
      'ಸಮಸ್ಯೆಯ ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
      'ನಿಮ್ಮ GPS ಸ್ಥಳ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸೇರಿಸಲಾಗುತ್ತದೆ',
      'ಸಲ್ಲಿಸಿ — ನಿಮಗೆ ಟಿಕೆಟ್ ID ಮತ್ತು SLA ಗಡುವು ಸಿಗುತ್ತದೆ',
    ],
    dept: (dept, sla) => `ಇದನ್ನು ${dept} ಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ. ಪರಿಹಾರ ಗಡುವು: ${sla} ಗಂಟೆಗಳು.`,
    autofill: 'ಫಾರ್ಮ್ ತುಂಬಿ ತೆರೆಯಿರಿ',
    submitNow: 'ಈಗಲೇ ಸಲ್ಲಿಸಿ',
    track: (id, status) => `ಟಿಕೆಟ್ ${id} ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ: ${status}`,
    noTicket: 'ನಿಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ದೂರುಗಳಿಲ್ಲ. ಮೊದಲು ಒಂದು ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ.',
    fallback: 'ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. ಗುಂಡಿ, ಕಸ, ನೀರು ಅಥವಾ ಬೀದಿ ದೀಪದ ಬಗ್ಗೆ ಕೇಳಿ.',
    submitted: (id, dept) => `ದೂರು ದಾಖಲಾಗಿದೆ! ಟಿಕೆಟ್ ${id} — ${dept} ಗೆ ನಿಯೋಜಿಸಲಾಗಿದೆ.`,
    suggestions: ['ಗುಂಡಿಯ ಬಗ್ಗೆ ದೂರು ಹೇಗೆ ನೀಡುವುದು?', 'ನಮ್ಮ ಬೀದಿಯ ದೀಪ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ', 'ಕಸ ಸಂಗ್ರಹಿಸಿಲ್ಲ', 'ನನ್ನ ದೂರಿನ ಸ್ಥಿತಿ'],
    listening: 'ಕೇಳುತ್ತಿದ್ದೇನೆ…',
  },
  ta: {
    greeting: 'வணக்கம்! நான் சிவிக்கைடு. சாலை குழி, குப்பை, தண்ணீர் தேக்கம் அல்லது தெருவிளக்கு புகார்களைப் பதிவு செய்ய உதவுகிறேன்.',
    placeholder: 'உங்கள் பிரச்சனையை தட்டச்சு செய்யவும் அல்லது பேசவும்…',
    categories: { pothole: 'சாலை குழி', garbage: 'குப்பை', waterlogging: 'தண்ணீர் தேக்கம்', streetlight: 'தெருவிளக்கு', traffic: 'போக்குவரத்து' },
    intro: (cat) => `${cat} புகாரைப் பதிவு செய்வது எளிது:`,
    steps: [
      'பிரச்சனையின் புகைப்படம் எடுக்கவும் அல்லது பதிவேற்றவும்',
      'உங்கள் GPS இருப்பிடம் தானாகச் சேர்க்கப்படும்',
      'சமர்ப்பிக்கவும் — டிக்கெட் ID மற்றும் SLA காலக்கெடு கிடைக்கும்',
    ],
    dept: (dept, sla) => `இது ${dept} க்கு அனுப்பப்படும். தீர்வு காலக்கெடு: ${sla} மணி நேரம்.`,
    autofill: 'படிவத்தை நிரப்பித் திறக்கவும்',
    submitNow: 'இப்போதே சமர்ப்பிக்கவும்',
    track: (id, status) => `டிக்கெட் ${id} தற்போதைய நிலை: ${status}`,
    noTicket: 'உங்கள் பெயரில் இன்னும் புகார்கள் இல்லை. முதலில் ஒரு பிரச்சனையைப் பதிவு செய்யவும்.',
    fallback: 'மன்னிக்கவும், புரியவில்லை. குழி, குப்பை, தண்ணீர் அல்லது தெருவிளக்கு பற்றி கேளுங்கள்.',
    submitted: (id, dept) => `புகார் பதிவு செய்யப்பட்டது! டிக்கெட் ${id} — ${dept} க்கு ஒதுக்கப்பட்டது.`,
    suggestions: ['சாலை குழியை எப்படி புகார் செய்வது?', 'எங்கள் தெருவிளக்கு எரியவில்லை', 'குப்பை எடுக்கப்படவில்லை', 'என் புகார் நிலை'],
    listening: 'கேட்கிறேன்…',
  },
  ml: {
    greeting:
      'നമസ്കാരം! ഞാൻ സിവിക്‌ഗൈഡ്. റോഡിലെ കുഴി, മാലിന്യം, വെള്ളക്കെട്ട് അല്ലെങ്കിൽ തെരുവുവിളക്ക് പരാതികൾ നൽകാൻ ഞാൻ സഹായിക്കും.',
    placeholder: 'നിങ്ങളുടെ പ്രശ്നം ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ സംസാരിക്കുക…',
    categories: { pothole: 'റോഡിലെ കുഴി', garbage: 'മാലിന്യം', waterlogging: 'വെള്ളക്കെട്ട്', streetlight: 'തെരുവുവിളക്ക്', traffic: 'ഗതാഗതം' },
    intro: (cat) => `${cat} പരാതി നൽകുന്നത് എളുപ്പമാണ്:`,
    steps: [
      'പ്രശ്നത്തിന്റെ ഫോട്ടോ എടുക്കുക അല്ലെങ്കിൽ അപ്‌ലോഡ് ചെയ്യുക',
      'നിങ്ങളുടെ GPS ലൊക്കേഷൻ സ്വയം ചേർക്കും',
      'സമർപ്പിക്കുക — ടിക്കറ്റ് ID യും SLA സമയപരിധിയും ലഭിക്കും',
    ],
    dept: (dept, sla) => `ഇത് ${dept} ലേക്ക് അയയ്ക്കും. പരിഹാര സമയപരിധി: ${sla} മണിക്കൂർ.`,
    autofill: 'ഫോം പൂരിപ്പിച്ച് തുറക്കുക',
    submitNow: 'ഇപ്പോൾ സമർപ്പിക്കുക',
    track: (id, status) => `ടിക്കറ്റ് ${id} നിലവിലെ സ്ഥിതി: ${status}`,
    noTicket: 'നിങ്ങളുടെ പേരിൽ ഇതുവരെ പരാതികളില്ല. ആദ്യം ഒരു പ്രശ്നം റിപ്പോർട്ട് ചെയ്യുക.',
    fallback: 'ക്ഷമിക്കണം, മനസ്സിലായില്ല. കുഴി, മാലിന്യം, വെള്ളക്കെട്ട് അല്ലെങ്കിൽ തെരുവുവിളക്കിനെക്കുറിച്ച് ചോദിക്കുക.',
    submitted: (id, dept) => `പരാതി രജിസ്റ്റർ ചെയ്തു! ടിക്കറ്റ് ${id} — ${dept} ന് കൈമാറി.`,
    suggestions: ['റോഡിലെ കുഴി എങ്ങനെ റിപ്പോർട്ട് ചെയ്യാം?', 'ഞങ്ങളുടെ തെരുവുവിളക്ക് കത്തുന്നില്ല', 'മാലിന്യം ശേഖരിച്ചില്ല', 'എന്റെ പരാതിയുടെ സ്ഥിതി'],
    listening: 'കേൾക്കുന്നു…',
  },
  mr: {
    greeting: 'नमस्कार! मी सिविकगाइड. रस्त्यावरील खड्डे, कचरा, पाणी साचणे किंवा पथदिव्यांच्या तक्रारी नोंदवण्यासाठी मी मदत करेन.',
    placeholder: 'तुमची समस्या टाइप करा किंवा बोला…',
    categories: { pothole: 'रस्त्यावरील खड्डा', garbage: 'कचरा', waterlogging: 'पाणी साचणे', streetlight: 'पथदिवा', traffic: 'वाहतूक' },
    intro: (cat) => `${cat} ची तक्रार नोंदवणे सोपे आहे:`,
    steps: ['समस्येचा फोटो काढा किंवा अपलोड करा', 'तुमचे GPS स्थान आपोआप जोडले जाईल', 'सबमिट करा — तुम्हाला तिकीट ID आणि SLA मुदत मिळेल'],
    dept: (dept, sla) => `हे ${dept} कडे पाठवले जाईल. निवारण मुदत: ${sla} तास.`,
    autofill: 'फॉर्म भरून उघडा',
    submitNow: 'आत्ताच सबमिट करा',
    track: (id, status) => `तिकीट ${id} ची सध्याची स्थिती: ${status}`,
    noTicket: 'तुमच्या नावावर अद्याप कोणतीही तक्रार नाही. आधी एक समस्या नोंदवा.',
    fallback: 'माफ करा, समजले नाही. खड्डे, कचरा, पाणी किंवा पथदिव्यांबद्दल विचारा.',
    submitted: (id, dept) => `तक्रार नोंदवली! तिकीट ${id} — ${dept} कडे सोपवले.`,
    suggestions: ['खड्ड्याची तक्रार कशी करावी?', 'आमच्या गल्लीतील दिवा बंद आहे', 'कचरा उचलला नाही', 'माझ्या तक्रारीची स्थिती'],
    listening: 'ऐकत आहे…',
  },
}

const INTENT_PATTERNS: [IssueCategory | 'track', RegExp][] = [
  ['track', /track|status|cf-|ట్రాక్|స్థితి|स्थिति|ट्रैक|ಸ್ಥಿತಿ|நிலை|സ്ഥിതി|स्थिती/i],
  ['pothole', /pot ?hole|road|crack|గుంత|రోడ్డు|गड्ढ|सड़क|ಗುಂಡಿ|ರಸ್ತೆ|குழி|சாலை|കുഴി|റോഡ്|खड्ड|रस्त/i],
  ['garbage', /garbage|trash|waste|dump|చెత్త|कचरा|ಕಸ|குப்பை|മാലിന്യ/i],
  ['waterlogging', /water|flood|drain|నీరు|నీటి|వరద|पानी|जलभराव|ನೀರು|தண்ணீர்|வெள்ள|വെള്ള|पाणी/i],
  ['streetlight', /light|lamp|dark|దీప|లైట్|लाइट|बत्ती|ದೀಪ|விளக்கு|വിളക്ക്|ലൈറ്റ്|दिवा|दिव्य/i],
]

export function detectIntent(text: string): IssueCategory | 'track' | null {
  return INTENT_PATTERNS.find(([, re]) => re.test(text))?.[0] ?? null
}
