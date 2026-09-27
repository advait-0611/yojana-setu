'use client';

import { ChangeEvent, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { jsPDF } from 'jspdf';
import {
  Mic,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  ShieldCheck,
  Sparkles,
  Languages,
  Info,
  FileText,
  ExternalLink,
  Search,
  Menu,
} from 'lucide-react';

type Reason = {
  text: string;
  type: 'pass' | 'warn' | 'fail';
};

type Scheme = {
  id: string;
  name: string;
  ministry: string;
  description: string;
  maxLoanLimit: number;
  matchPercentage: number;
  reasons: Reason[];
};

type FormData = {
  age: number;
  gender: string;
  category: string;
  income: number;
  locationType: string;
  education: string;
  sector: string;
  capitalRequired: number;
};

type OCRFinding = {
  label: string;
  status: 'found' | 'missing' | 'warning';
  detail: string;
};


const GENDER_OPTIONS = ['Female', 'Male', 'Transgender'];

const CATEGORY_OPTIONS = [
  'SC',
  'ST',
  'OBC',
  'PwD',
  'Safai Karamchari',
  'General',
];

const LOCATION_OPTIONS = ['Rural', 'Urban'];

const EDUCATION_OPTIONS = [
  'Below 8th',
  '8th Passed',
  '10th Passed',
  'Graduate/Diploma',
];

const SECTOR_OPTIONS = [
  'Manufacturing',
  'Services',
  'Trading',
  'Agriculture-Allied',
];

const TOTAL_STEPS = 5;

export default function Home() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Scheme[]>([]);
  const [isListening, setIsListening] = useState(false);

  // --------------------------------------------------
  // Document pre-verification (OCR)
  // --------------------------------------------------

  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [ocrFileName, setOcrFileName] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrFindings, setOcrFindings] = useState<OCRFinding[]>([]);
  const [ocrDocumentType, setOcrDocumentType] = useState('');

  const openOCR = () => {
    setOcrOpen(true);
    setOcrError('');
    setOcrStatus('');
  };

  const closeOCR = () => {
    if (ocrLoading) return;
    setOcrOpen(false);
  };

  const analyzeOCRText = (rawText: string) => {
    const text = rawText.replace(/\s+/g, ' ').trim();
    const lower = text.toLowerCase();

    const hasAny = (terms: string[]) =>
      terms.some((term) => lower.includes(term));

    const hasName = hasAny([
      'name',
      'नाम',
      'applicant name',
      'candidate name',
      'श्री',
      'श्रीमती',
      'kumari',
    ]);

    const hasAddress = hasAny([
      'address',
      'पता',
      'village',
      'गांव',
      'district',
      'जिला',
      'taluka',
      'tehsil',
      'state',
      'राज्य',
    ]);

    const hasIncome = hasAny([
      'income certificate',
      'annual income',
      'family income',
      'income',
      'आय प्रमाण पत्र',
      'वार्षिक आय',
      'पारिवारिक आय',
      'आय',
    ]);

    const hasNCL = hasAny([
      'non creamy layer',
      'non-creamy layer',
      'non creamy',
      'non-creamy',
      'non creamy layer certificate',
      'non-creamy layer certificate',
      'non creamy layer certificate',
      'obc',
      'other backward class',
      'अन्य पिछड़ा वर्ग',
      'अन्य पिछड़ा वर्ग',
      'नॉन क्रीमी लेयर',
    ]);

    const hasSC = hasAny([
      'scheduled caste',
      'अनुसूचित जाति',
      'caste certificate',
      'जाति प्रमाण पत्र',
      ' sc ',
    ]);

    const hasST = hasAny([
      'scheduled tribe',
      'अनुसूचित जनजाति',
      ' st ',
    ]);

    const hasAadhaar = hasAny([
      'aadhaar',
      'aadhar',
      'आधार',
    ]);

    const hasPAN = hasAny([
      'permanent account number',
      'pan card',
      ' pan ',
    ]);

    let documentType = '';

    if (hasNCL) {
      documentType = 'Likely NCL / OBC-related certificate';
    } else if (hasSC) {
      documentType = 'Likely SC / caste certificate';
    } else if (hasST) {
      documentType = 'Likely ST / caste certificate';
    } else if (hasIncome) {
      documentType = 'Likely income-related certificate';
    } else if (hasAadhaar) {
      documentType = 'Likely Aadhaar / identity document';
    } else if (hasPAN) {
      documentType = 'Likely PAN / identity document';
    }

    const strongDocumentSignal =
      hasNCL ||
      hasSC ||
      hasST ||
      hasIncome ||
      hasAadhaar ||
      hasPAN;

    const enoughText = text.replace(/\s/g, '').length >= 25;

    const findings: OCRFinding[] = [
      {
        label: 'Readable document text',
        status: enoughText ? 'found' : 'missing',
        detail: enoughText
          ? 'OCR extracted a usable amount of text from the upload.'
          : 'Very little recognizable text was found in this image.',
      },
      {
        label: 'Name information',
        status: hasName ? 'found' : 'missing',
        detail: hasName
          ? 'A name-related field or wording was detected.'
          : 'A clear name-related field was not detected.',
      },
      {
        label: 'Address information',
        status: hasAddress ? 'found' : 'missing',
        detail: hasAddress
          ? 'Address/location wording was detected.'
          : 'Address/location wording was not detected.',
      },
      {
        label: 'Income information',
        status: hasIncome ? 'found' : 'missing',
        detail: hasIncome
          ? 'Income-related wording was detected.'
          : 'Income-related wording was not detected.',
      },
      {
        label: 'Category information',
        status: hasNCL || hasSC || hasST ? 'found' : 'missing',
        detail:
          hasNCL
            ? 'OBC / Non-Creamy Layer indicators were detected in the uploaded text.'
            : hasSC
            ? 'SC / caste-related indicators were detected in the uploaded text.'
            : hasST
            ? 'ST / tribe-related indicators were detected in the uploaded text.'
            : 'No supported SC/ST/OBC category indicators were detected in the uploaded text.',
      },
      {
        label: 'Government identity information',
        status: hasAadhaar || hasPAN ? 'found' : 'missing',
        detail:
          hasAadhaar || hasPAN
            ? 'Aadhaar/PAN-related wording was detected.'
            : 'Aadhaar/PAN-related wording was not detected.',
      },
    ];

    if (!strongDocumentSignal || !enoughText) {
      findings.push({
        label: 'Document relevance',
        status: 'warning',
        detail:
          'The upload does not contain enough recognizable government-document indicators for a meaningful pre-check.',
      });
    } else {
      findings.push({
        label: 'Document relevance',
        status: 'found',
        detail:
          'The upload contains document indicators relevant to a preliminary scheme-document check.',
      });
    }

    setOcrDocumentType(documentType);
    setOcrFindings(findings);
  };

  const handleOCRFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOcrFileName(file.name);
    setOcrText('');
    setOcrError('');
    setOcrFindings([]);
    setOcrDocumentType('');
    setOcrLoading(true);
    setOcrStatus('Reading the uploaded document...');

    try {
      const worker = await createWorker(['eng', 'hin']);
      const result = await worker.recognize(file);
      const extractedText = result.data.text?.trim() || '';

      await worker.terminate();

      setOcrText(extractedText);
      analyzeOCRText(extractedText);
      setOcrStatus(
        extractedText
          ? 'OCR completed. The findings below are a document pre-check only.'
          : 'OCR completed, but no useful text was detected.'
      );
    } catch (error) {
      console.error('OCR error:', error);
      setOcrError(
        'The document could not be processed. Try a clearer JPG or PNG image.'
      );
      setOcrStatus('OCR failed.');
    } finally {
      setOcrLoading(false);
    }
  };


  const [voiceLanguage, setVoiceLanguage] = useState<'en-IN' | 'hi-IN'>(
    'en-IN'
  );

  const [formData, setFormData] = useState<FormData>({
    age: 28,
    gender: 'Female',
    category: 'SC',
    income: 200000,
    locationType: 'Rural',
    education: '8th Passed',
    sector: 'Manufacturing',
    capitalRequired: 1200000,
  });

  // --------------------------------------------------
  // Update form
  // --------------------------------------------------

  const updateForm = (field: keyof FormData, value: string | number) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // --------------------------------------------------
  // Voice command engine
  // --------------------------------------------------

  /*
    Voice input is intentionally handled locally in the browser so the
    prototype can work without sending a user's spoken profile to a server.

    The parser is designed for:
    - English
    - Hindi
    - Hinglish / Roman-Hindi
    - common regional pronunciation/transcription variations
    - mixed Hindi + English sentences
    - numbers written as digits or spoken words
    - lakh / lakhs / crore / करोड़ amounts

    IMPORTANT: This parser never invents a profile value. It only changes a
    field when it can identify a reasonably strong phrase for that field.
  */

  const normalizeVoiceText = (value: string) => {
    return value
      .toLowerCase()
      .normalize('NFC')
      .replace(/[“”‘’]/g, "'")
      .replace(/[।,!?;:()[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const hasAny = (text: string, phrases: string[]) =>
    phrases.some((phrase) => text.includes(phrase));

  const hasWord = (text: string, word: string) =>
    new RegExp(`(^|\\s)${word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}(?=\\s|$)`, 'iu').test(text);

  const HINDI_NUMBER_WORDS: Record<string, number> = {
    'शून्य': 0, 'एक': 1, 'इक': 1, 'दो': 2, 'दोनों': 2, 'तीन': 3,
    'चार': 4, 'पाँच': 5, 'पांच': 5, 'छह': 6, 'छः': 6, 'छहः': 6,
    'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10, 'ग्यारह': 11, 'बारह': 12,
    'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15, 'पन्द्रह': 15, 'सोलह': 16,
    'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20, 'इक्कीस': 21,
    'बाईस': 22, 'बाइस': 22, 'तेईस': 23, 'तेइस': 23, 'चौबीस': 24,
    'पच्चीस': 25, 'छब्बीस': 26,
    'सत्ताईस': 27, 'सत्ताइस': 27, 'अट्ठाईस': 28, 'अठाईस': 28,
    'अट्ठाइस': 28, 'उनतीस': 29, 'तीस': 30, 'इकतीस': 31, 'इकत्तीस': 31,
    'बत्तीस': 32, 'तैंतीस': 33, 'तेतीस': 33, 'चौंतीस': 34,
    'पैंतीस': 35, 'छत्तीस': 36, 'सैंतीस': 37,
    'अड़तीस': 38, 'अड़तीस': 38, 'उनतालीस': 39, 'चालीस': 40,
    'इकतालीस': 41, 'बयालीस': 42, 'तैंतालीस': 43,
    'चवालीस': 44, 'पैंतालीस': 45, 'छियालीस': 46, 'सैंतालीस': 47,
    'अड़तालीस': 48, 'अड़तालीस': 48, 'उनचास': 49, 'पचास': 50,
    'इक्यावन': 51, 'बावन': 52, 'तिरेपन': 53, 'तिरपन': 53, 'चौवन': 54,
    'पचपन': 55, 'छप्पन': 56, 'सत्तावन': 57, 'अट्ठावन': 58, 'उनसठ': 59,
    'साठ': 60, 'इकसठ': 61, 'बासठ': 62, 'तिरसठ': 63, 'चौंसठ': 64,
    'पैंसठ': 65, 'छियासठ': 66, 'सड़सठ': 67, 'सरसठ': 67, 'अड़सठ': 68,
    'उनहत्तर': 69, 'सत्तर': 70, 'इकहत्तर': 71, 'बहत्तर': 72, 'तिहत्तर': 73,
    'चौहत्तर': 74, 'पचहत्तर': 75, 'छिहत्तर': 76, 'सतहत्तर': 77,
    'अठहत्तर': 78, 'उन्यासी': 79, 'अस्सी': 80, 'इक्यासी': 81, 'बयासी': 82,
    'तिरासी': 83, 'चौरासी': 84, 'पचासी': 85, 'छियासी': 86, 'सत्तासी': 87,
    'अट्ठासी': 88, 'नवासी': 89, 'नब्बे': 90, 'इक्यानवे': 91, 'बानवे': 92,
    'तिरानवे': 93, 'चौरानवे': 94, 'पंचानवे': 95, 'छियानवे': 96,
    'सत्तानवे': 97, 'अट्ठानवे': 98, 'निन्यानवे': 99, 'सौ': 100,
  };

  const ROMAN_HINDI_NUMBER_WORDS: Record<string, number> = {
    shunya: 0, ek: 1, ik: 1, do: 2, teen: 3, tin: 3, char: 4, chaar: 4,
    paanch: 5, panch: 5, cheh: 6, chhe: 6, chhah: 6, saat: 7, sat: 7,
    aath: 8, ath: 8, nau: 9, no: 9, das: 10, gyarah: 11, gyaarah: 11,
    barah: 12, baarah: 12, terah: 13, chaudah: 14, pandrah: 15,
    solah: 16, satrah: 17, atharah: 18, unnis: 19, bees: 20,
    ikkis: 21, bais: 22, teis: 23, teiis: 23, chaubees: 24, pachis: 25,
    chhabis: 26, satais: 27, sattaiis: 27, athais: 28, atthais: 28,
    untees: 29, tees: 30, ikattis: 31, battis: 32, taintees: 33,
    chauntees: 34, paintis: 35, chhattis: 36, saintis: 37, adtees: 38,
    untalis: 39, chalis: 40, iktalis: 41, bayalis: 42, taintalis: 43,
    chawalis: 44, paintalis: 45, chiyalis: 46, saintalis: 47, adtalis: 48,
    unchaas: 49, pachaas: 50, ikyavan: 51, bavan: 52, tirpan: 53,
    chauvan: 54, pachpan: 55, chhappan: 56, sattavan: 57, athavan: 58,
    unsath: 59, saath: 60, iksath: 61, baasath: 62, tirsath: 63,
    chaunsath: 64, painsath: 65, chhiyasath: 66, sadsath: 67, adsath: 68,
    unhattar: 69, sattar: 70, ikhattar: 71, bahattar: 72, tihattar: 73,
    chauhattar: 74, pachhattar: 75, chihattar: 76, satahattar: 77,
    athhattar: 78, unasi: 79, assi: 80, ikyasi: 81, bayasi: 82,
    tirasi: 83, chaurasi: 84, pachasi: 85, chhiyasi: 86, sattasi: 87,
    athasi: 88, navasi: 89, nabbe: 90, ikyanave: 91, banave: 92,
    tiranave: 93, chauranave: 94, panchanave: 95, chhiyanave: 96,
    sattanave: 97, athanave: 98, ninyanave: 99, sau: 100,
  };

  const ENGLISH_NUMBER_WORDS: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
    eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
    fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
    nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
    seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  };

  const ENGLISH_NUMBER_ALIASES: Record<string, string> = {
    too: 'two', to: 'two', tree: 'three', fore: 'four', for: 'four', ate: 'eight',
    ninty: 'ninety', fourty: 'forty', sevnty: 'seventy', hundered: 'hundred',
  };

  const parseNumberWords = (input: string): number | null => {
    const text = normalizeVoiceText(input);
    if (!text) return null;

    const digit = text.match(/\d+(?:\.\d+)?/);
    if (digit) return Number(digit[0]);

    const tokens = text.split(/\s+/);
    let total = 0;
    let current = 0;
    let found = false;

    for (const rawToken of tokens) {
      const token = rawToken.replace(/[^a-zA-Zअ-हािीुूृेैोौंःँं़ड़ढ़]/g, '');
      const englishToken = ENGLISH_NUMBER_ALIASES[token] || token;
      const value =
        ENGLISH_NUMBER_WORDS[englishToken] ??
        HINDI_NUMBER_WORDS[token] ??
        ROMAN_HINDI_NUMBER_WORDS[token];

      if (value === undefined) continue;
      found = true;

      if (value === 100) {
        current = (current || 1) * 100;
      } else {
        current += value;
      }
    }

    if (!found) return null;
    return total + current;
  };

  const parseSpokenAmount = (input: string): number | null => {
    const text = normalizeVoiceText(input)
      .replace(/रुपये|रुपया|रूपये|रूपया|rs\.?|inr/giu, ' ')
      .replace(/rupees?|rupaye?|rupiya|rupiah/giu, ' ');

    const direct = text.match(/\d+(?:\.\d+)?\s*(crore|crores|करोड़|करोड|करोड़|lakh|lakhs|lac|लाख|हज़ार|हजार|thousand|million)?/iu);
    if (direct) {
      const value = Number(direct[0].match(/\d+(?:\.\d+)?/)?.[0]);
      if (!Number.isNaN(value)) {
        const unit = (direct[1] || '').toLowerCase();
        if (['crore', 'crores', 'करोड़', 'करोड', 'करोड़'].includes(unit)) return value * 10000000;
        if (['lakh', 'lakhs', 'lac', 'लाख'].includes(unit)) return value * 100000;
        if (['हज़ार', 'हजार', 'thousand'].includes(unit)) return value * 1000;
        if (unit === 'million') return value * 1000000;
        return value;
      }
    }

    const fractionMap: Record<string, number> = {
      'डेढ़': 1.5, 'डेढ': 1.5, 'dedh': 1.5,
      'ढाई': 2.5, 'dhai': 2.5,
      'साढ़े': 0.5, 'साढे': 0.5, 'sadhe': 0.5,
      'पौने': -0.25, 'paune': -0.25,
    };

    const amountUnit = text.match(/(crore|crores|करोड़|करोड|करोड़|lakh|lakhs|lac|लाख|हजार|हज़ार|thousand)/iu)?.[0];
    const multiplier = amountUnit
      ? ['crore', 'crores', 'करोड़', 'करोड', 'करोड़'].includes(amountUnit.toLowerCase())
        ? 10000000
        : ['lakh', 'lakhs', 'lac', 'लाख'].includes(amountUnit.toLowerCase())
          ? 100000
          : 1000
      : 1;

    if (amountUnit) {
      if (hasAny(text, ['डेढ़', 'डेढ', 'dedh'])) return 1.5 * multiplier;
      if (hasAny(text, ['ढाई', 'dhai'])) return 2.5 * multiplier;

      const halfMatch = text.match(/(?:साढ़े|साढे|sadhe)\s+([^ ]+)/iu);
      if (halfMatch) {
        const base = parseNumberWords(halfMatch[1]);
        if (base !== null) return (base + 0.5) * multiplier;
      }

      const pauneMatch = text.match(/(?:पौने|paune)\s+([^ ]+)/iu);
      if (pauneMatch) {
        const base = parseNumberWords(pauneMatch[1]);
        if (base !== null) return (base - 0.25) * multiplier;
      }

      const beforeUnit = text.split(new RegExp(amountUnit, 'i'))[0];
      const value = parseNumberWords(beforeUnit);
      if (value !== null) return value * multiplier;
    }

    return parseNumberWords(text);
  };

  const extractNumberNear = (text: string, patterns: RegExp[], maxChars = 70) => {
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (!match || match.index === undefined) continue;
      const after = text.slice(match.index + match[0].length, match.index + match[0].length + maxChars);
      const value = parseSpokenAmount(after);
      if (value !== null) return value;
    }
    return null;
  };

  const processVoiceInput = (transcript: string) => {
    const text = normalizeVoiceText(transcript);
    const updates: Partial<FormData> = {};
    let changed = false;

    // Gender — female is checked before male and male is matched as a word,
    // so "female" can never accidentally become "male".
    if (hasAny(text, [
      'female', 'woman', 'women', 'lady', 'girl', 'mahila', 'mahila hoon',
      'mahila hun', 'aurat', 'stree', 'स्त्री', 'महिला', 'औरत', 'महिलाएं',
      'महिलायें', 'नारी', 'लड़की', 'लड़की', 'महिला हूं', 'महिला हूँ',
    ])) {
      updates.gender = 'Female';
      changed = true;
    } else if (hasAny(text, [
      'male', 'man', 'men', 'gentleman', 'purush', 'purush hoon', 'purush hun',
      'aadmi', 'mard', 'पुरुष', 'आदमी', 'मर्द', 'जन',
    ]) || hasWord(text, 'male')) {
      updates.gender = 'Male';
      changed = true;
    } else if (hasAny(text, [
      'transgender', 'trans gender', 'third gender', 'kinnar', 'किन्नर',
      'ट्रांसजेंडर', 'तृतीय लिंग', 'थर्ड जेंडर',
    ])) {
      updates.gender = 'Transgender';
      changed = true;
    }

    // Category
    if (hasAny(text, [
      'safai karamchari', 'safai karmchari', 'safai worker', 'sanitation worker',
      'सफाई कर्मचारी', 'सफाईकर्मी', 'सफाई कर्मी', 'सफाई वाला', 'सफाई कामगार',
    ])) {
      updates.category = 'Safai Karamchari';
      changed = true;
    } else if (hasAny(text, [
      'scheduled caste', 'schedule caste', 'sc category', 'एससी', 'एस सी',
      'अनुसूचित जाति', 'दलित', 'हरिजन',
    ]) || hasWord(text, 'sc')) {
      updates.category = 'SC';
      changed = true;
    } else if (hasAny(text, [
      'scheduled tribe', 'schedule tribe', 'st category', 'एसटी', 'एस टी',
      'अनुसूचित जनजाति', 'आदिवासी', 'जनजाति',
    ]) || hasWord(text, 'st')) {
      updates.category = 'ST';
      changed = true;
    } else if (hasAny(text, [
      'obc', 'o b c', 'ओबीसी', 'ओ बी सी', 'other backward class',
      'backward class', 'pichda varg', 'pichhda varg', 'पिछड़ा वर्ग',
      'पिछड़ा वर्ग', 'अन्य पिछड़ा वर्ग', 'अन्य पिछड़ा वर्ग',
    ]) || hasWord(text, 'obc')) {
      updates.category = 'OBC';
      changed = true;
    } else if (hasAny(text, [
      'pwd', 'p w d', 'divyang', 'divyangjan', 'person with disability',
      'disabled', 'विकलांग', 'दिव्यांग', 'दिव्यांगजन', 'अपंग',
    ]) || hasWord(text, 'pwd')) {
      updates.category = 'PwD';
      changed = true;
    } else if (hasAny(text, [
      'general category', 'general caste', 'open category', 'सामान्य वर्ग',
      'सामान्य श्रेणी', 'जनरल कैटेगरी', 'जनरल श्रेणी', 'ओपन कैटेगरी',
    ])) {
      updates.category = 'General';
      changed = true;
    }

    // Location
    if (hasAny(text, [
      'rural', 'village', 'villager', 'gram', 'gaon', 'gaav', 'gaw', 'dehat',
      'rural area', 'गाँव', 'गांव', 'गाव', 'ग्राम', 'ग्रामीण', 'देहात', 'गाँव में',
    ])) {
      updates.locationType = 'Rural';
      changed = true;
    } else if (hasAny(text, [
      'urban', 'city', 'town', 'shehar', 'shahar', 'nagar', 'urban area',
      'शहर', 'शहरी', 'नगर', 'कस्बा', 'कस्बे',
    ])) {
      updates.locationType = 'Urban';
      changed = true;
    }

    // Education — specific levels first.
    if (hasAny(text, [
      'below 8th', 'less than 8th', 'under 8th', '8 se kam', 'aath se kam',
      'आठवीं से कम', 'आठवीं से नीचे', 'आठवी से कम', '8वीं से कम',
    ])) {
      updates.education = 'Below 8th';
      changed = true;
    } else if (hasAny(text, [
      'graduate', 'graduation', 'degree', 'bachelor', 'diploma', 'graduate diploma',
      'snatak', 'स्नातक', 'डिग्री', 'डिप्लोमा', 'ग्रेजुएट', 'ग्रेजुएशन',
    ])) {
      updates.education = 'Graduate/Diploma';
      changed = true;
    } else if (hasAny(text, [
      '10th', 'tenth', 'tenth class', 'class ten', 'dasvi', 'dasvin', 'dasveen',
      'दसवीं', 'दसवी', 'दसवाँ', 'दसवीं पास', '10वीं', '१०वीं',
    ])) {
      updates.education = '10th Passed';
      changed = true;
    } else if (hasAny(text, [
      '8th', 'eighth', 'eighth class', 'class eight', 'aathvi', 'aathvin',
      'aathvi pass', 'आठवीं', 'आठवी', 'आठवीं पास', '8वीं', '८वीं',
    ])) {
      updates.education = '8th Passed';
      changed = true;
    }

    // Sector
    if (hasAny(text, [
      'manufacturing', 'manufacture', 'factory', 'production', 'processing',
      'garment', 'textile', 'workshop', 'manufacturing business', 'निर्माण',
      'मैन्युफैक्चरिंग', 'फैक्टरी', 'उत्पादन', 'प्रोसेसिंग', 'कपड़ा', 'विनिर्माण',
    ])) {
      updates.sector = 'Manufacturing';
      changed = true;
    } else if (hasAny(text, [
      'services', 'service', 'service business', 'repair', 'salon', 'shop service',
      'it service', 'सेवा', 'सर्विस', 'मरम्मत', 'सैलून', 'सेवा क्षेत्र',
    ])) {
      updates.sector = 'Services';
      changed = true;
    } else if (hasAny(text, [
      'trading', 'trade', 'retail', 'retailer', 'shop', 'store', 'business',
      'dukaan', 'dokan', 'vyapar', 'व्यापार', 'दुकान', 'दूकान', 'बिजनेस',
      'व्यवसाय', 'खुदरा', 'रिटेल', 'दुकानदार',
    ])) {
      updates.sector = 'Trading';
      changed = true;
    } else if (hasAny(text, [
      'agriculture', 'agricultural', 'farming', 'farmer', 'dairy', 'poultry',
      'livestock', 'animal husbandry', 'खेती', 'कृषि', 'किसान', 'डेयरी',
      'पशुपालन', 'मुर्गी पालन', 'पशु पालन', 'दूध का काम',
    ])) {
      updates.sector = 'Agriculture-Allied';
      changed = true;
    }

    // Age — look only near age/years/umar markers. This prevents an income
    // number later in the same sentence from becoming the age.
    const age = extractNumberNear(text, [
      /(?:my\s+)?age(?:\s+is|\s+of|\s*[:=])?/iu,
      /(?:i\s+am|i'm|i\s*am\s+)?\d*\s*years?\s*old/iu,
      /(?:meri|meri\s+umar|umar|umr|aayu|ayu|मेरी\s+उम्र|उम्र|आयु|आयु\s+है|साल)/iu,
      /(?:उम्र|आयु)\s*(?:है|की|मेरी)?/iu,
    ]);
    if (age !== null && age >= 1 && age <= 100) {
      updates.age = Math.round(age);
      changed = true;
    }

    // If the user says "I am twenty eight" without an explicit age marker,
    // accept a standalone age-shaped number only when it is the only plausible
    // 1–100 number in the sentence.
    if (updates.age === undefined) {
      const candidates = [...text.matchAll(/\b\d{1,2}\b/g)].map((m) => Number(m[0])).filter((n) => n >= 1 && n <= 100);
      if (candidates.length === 1 && hasAny(text, ['i am', "i'm", 'main', 'mai', 'मैं', 'मेरी'])) {
        updates.age = candidates[0];
        changed = true;
      }
    }

    if (updates.age === undefined) {
      const spokenAgeWords = parseNumberWords(text);
      if (spokenAgeWords !== null && spokenAgeWords >= 1 && spokenAgeWords <= 100 &&
          hasAny(text, ['i am', "i'm", 'main', 'mai', 'मैं', 'मेरी', 'umar', 'उम्र', 'आयु'])) {
        updates.age = Math.round(spokenAgeWords);
        changed = true;
      }
    }

    // Income — parse the number near income-related words, not the first number
    // in the entire transcript.
    const income = extractNumberNear(text, [
      /(?:annual\s+)?income(?:\s+is|\s+of|\s*[:=])?/iu,
      /(?:yearly|year\s+income|per\s+year|a\s+year)\s*(?:income)?/iu,
      /(?:salary|earnings|earning|kamai|aamdani|आय|कमाई|आमदनी|सालाना\s+आय|वार्षिक\s+आय)\s*(?:है|is|of|की)?/iu,
    ]);
    if (income !== null && income > 0 && income <= 1000000000) {
      updates.income = Math.round(income);
      changed = true;
    }

    // Capital / loan requirement — keep it independent from income.
    const capital = extractNumberNear(text, [
      /(?:capital|capital\s+required|capital\s+needed|funds|funding)\s*(?:required|needed|is|of|की)?/iu,
      /(?:loan|loan\s+amount|loan\s+required|borrow|borrowing)\s*(?:amount|required|needed|is|of|की)?/iu,
      /(?:investment|investment\s+needed|project\s+cost|business\s+cost)\s*(?:required|needed|is|of|की)?/iu,
      /(?:पूंजी|पूंजी\s+चाहिए|पूंजी\s+की\s+जरूरत|लोन|ऋण|निवेश|परियोजना\s+लागत|व्यवसाय\s+लागत)\s*(?:चाहिए|की|है|रुपये|रुपए)?/iu,
    ]);
    if (capital !== null && capital > 0 && capital <= 1000000000) {
      updates.capitalRequired = Math.round(capital);
      changed = true;
    }

    if (changed) {
      setFormData((previous) => ({
        ...previous,
        ...updates,
      }));
    }

    return changed;
  };

  // --------------------------------------------------
  // Voice recognition
  // --------------------------------------------------

  const startVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const browserWindow = window as any;
    const SpeechRecognition =
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Voice recognition is not supported in this browser. Please use the latest Google Chrome or Microsoft Edge.'
      );
      return;
    }

    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    let finished = false;

    recognition.onstart = () => {
      finished = false;
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const resultList = event.results?.[event.resultIndex ?? 0];
      const alternatives = resultList ? Array.from(resultList) : [];

      const transcripts = alternatives
        .map((item: any) => String(item?.transcript || '').trim())
        .filter(Boolean);

      // Web Speech already ranks alternatives. We additionally rank them by
      // how many actual profile fields our parser can understand.
      const scored = transcripts.map((candidate) => {
        const normalized = normalizeVoiceText(candidate);
        let score = 0;

        if (hasAny(normalized, ['female', 'woman', 'mahila', 'महिला', 'male', 'man', 'purush', 'पुरुष', 'transgender', 'किन्नर'])) score += 2;
        if (hasAny(normalized, ['sc', 'scheduled caste', 'st', 'scheduled tribe', 'obc', 'ओबीसी', 'pwd', 'दिव्यांग', 'safai karamchari', 'general category'])) score += 2;
        if (hasAny(normalized, ['rural', 'village', 'gaon', 'ग्रामीण', 'गांव', 'urban', 'city', 'शहरी', 'शहर'])) score += 1;
        if (hasAny(normalized, ['manufacturing', 'factory', 'निर्माण', 'services', 'सेवा', 'trading', 'व्यापार', 'agriculture', 'कृषि', 'खेती'])) score += 1;
        if (hasAny(normalized, ['income', 'salary', 'आय', 'कमाई', 'annual', 'सालाना'])) score += 1;
        if (hasAny(normalized, ['loan', 'capital', 'investment', 'लोन', 'पूंजी', 'निवेश'])) score += 1;
        if (hasAny(normalized, ['age', 'years old', 'umar', 'उम्र', 'आयु', 'साल'])) score += 1;
        if (hasAny(normalized, ['8th', '10th', 'graduate', 'diploma', 'आठवीं', 'दसवीं', 'स्नातक', 'डिप्लोमा'])) score += 1;

        return { candidate, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const bestTranscript = scored[0]?.candidate || transcripts[0] || '';

      if (!bestTranscript) {
        alert(
          voiceLanguage === 'hi-IN'
            ? 'आवाज़ सुनाई नहीं दी। कृपया माइक्रोफ़ोन के पास साफ़ और थोड़ा धीरे बोलें।'
            : 'No clear speech was detected. Please speak clearly and try again.'
        );
        return;
      }

      const changed = processVoiceInput(bestTranscript);

      if (changed) {
        alert(
          voiceLanguage === 'hi-IN'
            ? `सुना गया:\n"${bestTranscript}"\n\nपहचानी गई जानकारी फ़ॉर्म में भर दी गई है। कृपया आगे बढ़ने से पहले उसे एक बार जाँच लें।`
            : `Heard:\n"${bestTranscript}"\n\nThe recognized information has been filled in. Please review it once before continuing.`
        );
      } else {
        alert(
          voiceLanguage === 'hi-IN'
            ? `सुना गया:\n"${bestTranscript}"\n\nमैं इसमें कोई भरोसेमंद फ़ॉर्म जानकारी नहीं पहचान पाया। कृपया उम्र, लिंग, श्रेणी, आय, स्थान, शिक्षा, व्यवसाय या लोन की रकम स्पष्ट रूप से बोलें।`
            : `Heard:\n"${bestTranscript}"\n\nI could not confidently identify a profile field. Please mention your age, gender, category, income, location, education, business sector, or loan amount clearly.`
        );
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        alert(
          'Microphone permission was denied. Please allow microphone access for localhost in Chrome and try again.'
        );
      } else if (event.error === 'no-speech') {
        alert(
          voiceLanguage === 'hi-IN'
            ? 'कोई साफ़ आवाज़ नहीं मिली। कृपया माइक्रोफ़ोन के पास बोलें और दोबारा कोशिश करें।'
            : 'No speech was detected. Please speak near the microphone and try again.'
        );
      } else if (event.error === 'audio-capture') {
        alert(
          voiceLanguage === 'hi-IN'
            ? 'माइक्रोफ़ोन उपलब्ध नहीं है। अपनी माइक्रोफ़ोन सेटिंग जाँचें।'
            : 'No microphone was detected. Please check your microphone settings.'
        );
      } else {
        alert(
          voiceLanguage === 'hi-IN'
            ? 'आवाज़ पहचानने में समस्या हुई। कृपया दोबारा कोशिश करें।'
            : 'There was a problem recognizing your voice. Please try again.'
        );
      }
    };

    recognition.onend = () => {
      if (!finished) {
        finished = true;
        setIsListening(false);
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Unable to start speech recognition:', error);
      setIsListening(false);
    }
  };

  // --------------------------------------------------
  // Navigation
  // --------------------------------------------------

  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep((previous) => previous + 1);
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep((previous) => previous - 1);
    }
  };

  // --------------------------------------------------
  // Match schemes
  // --------------------------------------------------

  const findSchemes = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data);
        setStep(6);
      } else {
        alert('Unable to find matching schemes.');
      }
    } catch (error) {
      console.error(error);
      alert(
        'Something went wrong while finding schemes.'
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Currency
  // --------------------------------------------------

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --------------------------------------------------
  // Generate Bank-ready DPR PDF
  // --------------------------------------------------

  const generateDPR = (scheme: Scheme) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    const footerY = pageHeight - 11;
    const bottomLimit = pageHeight - 22;
    let y = 20;

    const colors = {
      navy: [17, 49, 74] as const,
      green: [34, 105, 75] as const,
      paleGreen: [231, 240, 236] as const,
      veryLight: [248, 250, 249] as const,
      white: [255, 255, 255] as const,
      border: [215, 222, 219] as const,
      text: [38, 46, 49] as const,
      muted: [91, 101, 104] as const,
      lightRow: [247, 249, 248] as const,
      passBg: [232, 244, 235] as const,
      passText: [30, 105, 58] as const,
      checkBg: [255, 246, 220] as const,
      checkText: [132, 94, 18] as const,
      failBg: [250, 232, 232] as const,
      failText: [151, 47, 47] as const,
    };

    const generatedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const projectCost = Math.max(0, Number(formData.capitalRequired) || 0);
    const existingIncome = Math.max(0, Number(formData.income) || 0);

    const indicativeOwnContribution = Math.round(projectCost * 0.15);
    const indicativeExternalFinance = Math.max(
      0,
      projectCost - indicativeOwnContribution
    );

    const equipmentCost = Math.round(projectCost * 0.45);
    const workingCapital = Math.round(projectCost * 0.25);
    const setupCost = Math.round(projectCost * 0.15);
    const otherEligibleCost = Math.max(
      0,
      projectCost - equipmentCost - workingCapital - setupCost
    );

    const indicativeAnnualTurnover = Math.round(projectCost * 1.5);
    const indicativeAnnualOperatingCost = Math.round(
      indicativeAnnualTurnover * 0.72
    );
    const indicativeAnnualSurplus = Math.max(
      0,
      indicativeAnnualTurnover - indicativeAnnualOperatingCost
    );

    const sectorPlan: Record<string, { title: string; text: string }> = {
      Manufacturing: {
        title: 'Manufacturing / Production Plan',
        text: 'The proposed enterprise can focus on procurement of inputs, production or processing, quality control, packaging and sale of finished goods. The project requirement may cover productive equipment, basic infrastructure, working capital and other eligible business needs, subject to the selected scheme guidelines.',
      },
      Services: {
        title: 'Service Operations Plan',
        text: 'The proposed enterprise can provide customer-facing services supported by the required tools, equipment, workspace and working capital. Operations should focus on service quality, customer acquisition, repeat business and controlled operating expenses.',
      },
      Trading: {
        title: 'Trading / Retail Plan',
        text: 'The proposed enterprise can procure goods from suitable suppliers and sell them through a local retail or trading channel. Working capital, inventory management, customer service and disciplined cash-flow management will be important to day-to-day operations.',
      },
      'Agriculture-Allied': {
        title: 'Agriculture-Allied Operations Plan',
        text: 'The proposed enterprise can operate in an agriculture or allied activity such as farming, dairy, poultry, livestock or related value-chain work. The project can focus on productive assets, inputs, operations, local market access and regular cash-flow management.',
      },
    };

    const selectedSectorPlan =
      sectorPlan[formData.sector] || sectorPlan.Services;

    const setFill = (rgb: readonly [number, number, number]) => {
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    };

    const setDraw = (rgb: readonly [number, number, number]) => {
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    };

    const setText = (rgb: readonly [number, number, number]) => {
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    };

    const writeLines = (
      lines: string[],
      x: number,
      startY: number,
      lineHeight: number
    ) => {
      lines.forEach((line, index) => {
        doc.text(line, x, startY + index * lineHeight);
      });
      return startY + Math.max(0, lines.length - 1) * lineHeight;
    };

    const wrappedLines = (text: string, width: number) =>
      doc.splitTextToSize(String(text || '-'), width) as string[];

    const drawPageBackground = () => {
      setFill(colors.veryLight);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    };

    const drawHeader = (showTitle = true) => {
      setFill(colors.navy);
      doc.rect(0, 0, pageWidth, 13, 'F');

      setFill(colors.green);
      doc.rect(0, 13, pageWidth, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setText(colors.white);
      doc.text('YOJANA SETU', margin, 8.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.3);
      doc.text(
        'Scheme Support & Preliminary Project Report',
        pageWidth - margin,
        8.5,
        { align: 'right' }
      );

      if (showTitle) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        setText(colors.muted);
        doc.text('DETAILED PROJECT REPORT', margin, 23);
      }

      setText(colors.text);
    };

    const drawFooter = (pageNumber: number, totalPages: number) => {
      setDraw(colors.border);
      doc.line(margin, pageHeight - 17, pageWidth - margin, pageHeight - 17);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      setText(colors.muted);
      doc.text(
        'Yojana Setu | Preliminary DPR | SIH 2026 Prototype',
        margin,
        footerY
      );
      doc.text(
        `Page ${pageNumber} of ${totalPages}`,
        pageWidth - margin,
        footerY,
        { align: 'right' }
      );
      setText(colors.text);
    };

    const newPage = () => {
      doc.addPage();
      drawPageBackground();
      drawHeader();
      y = 31;
    };

    const ensureSpace = (height: number) => {
      if (y + height > bottomLimit) {
        newPage();
      }
    };

    const addParagraph = (
      text: string,
      fontSize = 8.7,
      lineHeight = 4.7,
      color = colors.text
    ) => {
      const lines = wrappedLines(text, contentWidth);
      const height = Math.max(1, lines.length) * lineHeight + 4;
      ensureSpace(height);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      setText(color);
      writeLines(lines, margin, y, lineHeight);
      y += height;
      setText(colors.text);
    };

    const addSection = (number: string, title: string) => {
      ensureSpace(17);

      setFill(colors.paleGreen);
      doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'F');

      setFill(colors.green);
      doc.rect(margin, y, 2.5, 9, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.2);
      setText(colors.navy);
      doc.text(`${number}. ${title}`, margin + 6, y + 6.2);

      y += 14;
      setText(colors.text);
    };

    const addLabelValue = (label: string, value: string) => {
      const labelWidth = 55;
      const valueWidth = contentWidth - labelWidth - 7;
      const lines = wrappedLines(value, valueWidth);
      const rowHeight = Math.max(9, lines.length * 4.5 + 4);

      ensureSpace(rowHeight + 2);

      setFill(colors.white);
      setDraw(colors.border);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
      doc.rect(margin, y, contentWidth, rowHeight, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.4);
      setText(colors.muted);
      doc.text(label, margin + 4, y + 5.6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.7);
      setText(colors.text);
      writeLines(lines, margin + labelWidth, y + 5.6, 4.5);

      y += rowHeight + 2;
      setText(colors.text);
    };

    const drawTableHeader = (
      headers: string[],
      widths: number[],
      headerY: number
    ) => {
      let x = margin;

      headers.forEach((header, index) => {
        setFill(colors.navy);
        setDraw(colors.navy);
        doc.rect(x, headerY, widths[index], 9, 'F');
        doc.rect(x, headerY, widths[index], 9, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.6);
        setText(colors.white);

        const lines = wrappedLines(header, widths[index] - 4);
        writeLines(lines, x + 2, headerY + 5.4, 3.2);

        x += widths[index];
      });

      setText(colors.text);
    };

    const addTable = (
      headers: string[],
      rows: string[][],
      widths: number[]
    ) => {
      const headerHeight = 9;
      const bodyLineHeight = 4.4;

      ensureSpace(headerHeight + 10);
      drawTableHeader(headers, widths, y);
      y += headerHeight;

      rows.forEach((row, rowIndex) => {
        const cellLines = row.map((cell, index) =>
          wrappedLines(cell, widths[index] - 4)
        );

        const rowHeight = Math.max(
          8.5,
          ...cellLines.map((lines) => lines.length * bodyLineHeight + 4)
        );

        if (y + rowHeight > bottomLimit) {
          newPage();
          drawTableHeader(headers, widths, y);
          y += headerHeight;
        }

        let x = margin;

        row.forEach((cell, index) => {
          const fill =
            rowIndex % 2 === 0 ? colors.white : colors.lightRow;

          setFill(fill);
          setDraw(colors.border);
          doc.rect(x, y, widths[index], rowHeight, 'F');
          doc.rect(x, y, widths[index], rowHeight, 'S');

          doc.setFont(
            'helvetica',
            index === 0 ? 'bold' : 'normal'
          );
          doc.setFontSize(8.1);
          setText(index === 0 ? colors.text : colors.text);

          writeLines(
            cellLines[index],
            x + 2,
            y + 5.4,
            bodyLineHeight
          );

          x += widths[index];
        });

        y += rowHeight;
      });

      y += 4;
      setText(colors.text);
    };

    const addBulletList = (items: string[]) => {
      items.forEach((item) => {
        const lines = wrappedLines(item, contentWidth - 9);
        const rowHeight = Math.max(7, lines.length * 4.5 + 2);

        ensureSpace(rowHeight);

        setFill(colors.green);
        doc.circle(margin + 2, y - 1.2, 0.9, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        setText(colors.text);
        writeLines(lines, margin + 7, y, 4.5);

        y += rowHeight;
      });

      setText(colors.text);
    };

    const addStatusRow = (status: string, text: string) => {
      const badgeWidth = 20;
      const textX = margin + badgeWidth + 6;
      const lines = wrappedLines(text, contentWidth - badgeWidth - 10);
      const rowHeight = Math.max(10, lines.length * 4.5 + 5);

      ensureSpace(rowHeight + 2);

      setFill(colors.white);
      setDraw(colors.border);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
      doc.rect(margin, y, contentWidth, rowHeight, 'S');

      const isPass = status === 'PASS';
      const isCheck = status === 'CHECK';
      const badgeBg = isPass
        ? colors.passBg
        : isCheck
          ? colors.checkBg
          : colors.failBg;
      const badgeText = isPass
        ? colors.passText
        : isCheck
          ? colors.checkText
          : colors.failText;

      setFill(badgeBg);
      doc.roundedRect(margin + 3, y + 2, badgeWidth, 6.5, 1.4, 1.4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      setText(badgeText);
      doc.text(status, margin + 3 + badgeWidth / 2, y + 6.2, {
        align: 'center',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.4);
      setText(colors.text);
      writeLines(lines, textX, y + 5.7, 4.5);

      y += rowHeight + 2;
      setText(colors.text);
    };

    // --------------------------------------------------
    // Page 1: Cover and executive summary
    // --------------------------------------------------

    drawPageBackground();
    drawHeader(false);

    y = 34;

    setFill(colors.navy);
    doc.roundedRect(margin, y, contentWidth, 49, 3, 3, 'F');

    setFill(colors.green);
    doc.rect(margin, y + 40, contentWidth, 9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    setText(colors.white);
    doc.text('DETAILED PROJECT REPORT', margin + 8, y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.6);
    doc.text(
      'Scheme-linked business project preparation document',
      margin + 8,
      y + 24
    );

    doc.setFontSize(8);
    doc.text(`Generated: ${generatedDate}`, margin + 8, y + 33);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('YOJANA SETU', pageWidth - margin - 8, y + 16, {
      align: 'right',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.text(
      'Prototype project-support report',
      pageWidth - margin - 8,
      y + 24,
      { align: 'right' }
    );

    setText(colors.text);
    y += 58;

    addSection('A', 'Executive Summary');

    addParagraph(
      `This preliminary DPR has been prepared from the applicant profile entered in Yojana Setu and the selected scheme match. The proposed project is in the ${formData.sector} sector with an indicative project requirement of ${formatCurrency(projectCost)}. The report is intended to organize the applicant's information for initial discussion, planning and document preparation.`
    );

    addTable(
      ['Project Snapshot', 'Details'],
      [
        ['Selected Scheme', scheme.name],
        ['Scheme Ministry', scheme.ministry],
        ['Eligibility Match', `${scheme.matchPercentage}%`],
        ['Business Sector', formData.sector],
        ['Project Requirement', formatCurrency(projectCost)],
        ['Applicant Location', formData.locationType],
      ],
      [58, contentWidth - 58]
    );

    addSection('B', 'Applicant Profile');

    addTable(
      ['Particular', 'Applicant Information'],
      [
        ['Age', `${formData.age} years`],
        ['Gender', formData.gender],
        ['Category', formData.category],
        ['Education', formData.education],
        ['Location Type', formData.locationType],
        ['Annual Income', formatCurrency(existingIncome)],
      ],
      [58, contentWidth - 58]
    );

    addSection('C', 'Proposed Enterprise');

    addLabelValue('Business Sector', formData.sector);
    addLabelValue(
      'Project / Capital Requirement',
      formatCurrency(projectCost)
    );
    addLabelValue(
      'Purpose',
      'Establishment, expansion or productive investment in the proposed enterprise, subject to scheme-specific rules.'
    );
    addParagraph(selectedSectorPlan.text);

    // --------------------------------------------------
    // Project cost and finance
    // --------------------------------------------------

    addSection('D', 'Project Cost & Means of Finance');

    addParagraph(
      'The figures below are an illustrative planning structure generated from the capital requirement entered by the applicant. They are not a sanction structure and should be adjusted to actual quotations, scheme norms and bank appraisal.'
    );

    addTable(
      ['Cost Head', 'Indicative Amount'],
      [
        [
          'Plant / equipment / productive assets',
          formatCurrency(equipmentCost),
        ],
        [
          'Working capital / inventory / operating needs',
          formatCurrency(workingCapital),
        ],
        [
          'Premises / setup / basic infrastructure',
          formatCurrency(setupCost),
        ],
        [
          'Other eligible project requirements',
          formatCurrency(otherEligibleCost),
        ],
        ['Total Indicative Project Cost', formatCurrency(projectCost)],
      ],
      [105, contentWidth - 105]
    );

    addTable(
      ['Indicative Finance Source', 'Amount', 'Note'],
      [
        [
          'Applicant contribution',
          formatCurrency(indicativeOwnContribution),
          'Illustrative 15% planning assumption',
        ],
        [
          'Balance / external finance',
          formatCurrency(indicativeExternalFinance),
          'Subject to scheme and bank appraisal',
        ],
        [
          'Total',
          formatCurrency(projectCost),
          'Must reconcile with final project cost',
        ],
      ],
      [57, 45, contentWidth - 102]
    );

    // --------------------------------------------------
    // Selected scheme
    // --------------------------------------------------

    addSection('E', 'Selected Government Scheme');

    addTable(
      ['Particular', 'Scheme Information'],
      [
        ['Scheme', scheme.name],
        ['Ministry / Department', scheme.ministry],
        ['Match Score', `${scheme.matchPercentage}%`],
        [
          'Maximum Loan / Support',
          scheme.maxLoanLimit > 0
            ? formatCurrency(scheme.maxLoanLimit)
            : 'Training / non-loan support',
        ],
      ],
      [58, contentWidth - 58]
    );

    addParagraph(scheme.description);

    // --------------------------------------------------
    // Eligibility assessment
    // --------------------------------------------------

    addSection('F', 'Eligibility Assessment');

    scheme.reasons.forEach((reason) => {
      const status =
        reason.type === 'pass'
          ? 'PASS'
          : reason.type === 'warn'
            ? 'CHECK'
            : 'NOT MET';

      addStatusRow(status, reason.text);
    });

    // --------------------------------------------------
    // Business and operations plan
    // --------------------------------------------------

    addSection('G', selectedSectorPlan.title);

    addParagraph(selectedSectorPlan.text);

    addBulletList([
      'Identify the target customer group and local demand for the proposed product or service.',
      'Obtain realistic quotations for major equipment, inventory, setup and other project requirements.',
      'Maintain basic records for sales, purchases, expenses, stock and cash flow from the beginning of operations.',
      'Use the selected scheme only for activities and expenses permitted under its applicable guidelines.',
    ]);

    // --------------------------------------------------
    // Illustrative financial snapshot
    // --------------------------------------------------

    addSection('H', 'Illustrative Financial Snapshot');

    addParagraph(
      'This section is a planning illustration, not a forecast or guarantee. Actual turnover, expenses and surplus will depend on the enterprise, market conditions, capacity utilization and the final project design.'
    );

    addTable(
      ['Indicator', 'Illustrative Value', 'Basis'],
      [
        [
          'Project requirement',
          formatCurrency(projectCost),
          'Applicant-entered capital requirement',
        ],
        [
          'Existing annual income',
          formatCurrency(existingIncome),
          'Applicant-entered profile information',
        ],
        [
          'Illustrative annual turnover',
          formatCurrency(indicativeAnnualTurnover),
          '1.5 × project requirement',
        ],
        [
          'Illustrative operating cost',
          formatCurrency(indicativeAnnualOperatingCost),
          '72% of illustrative turnover',
        ],
        [
          'Illustrative annual surplus',
          formatCurrency(indicativeAnnualSurplus),
          'Turnover less illustrative operating cost',
        ],
      ],
      [65, 47, contentWidth - 112]
    );

    // --------------------------------------------------
    // Implementation plan
    // --------------------------------------------------

    addSection('I', 'Implementation Plan');

    addTable(
      ['Stage', 'Indicative Activity'],
      [
        [
          '1. Preparation',
          'Finalize business activity, project cost, quotations and required documents.',
        ],
        [
          '2. Application',
          'Confirm scheme-specific conditions and submit the application through the concerned channel.',
        ],
        [
          '3. Appraisal',
          'Bank / implementing agency reviews eligibility, documents, project viability and applicable norms.',
        ],
        [
          '4. Setup',
          'Procure eligible assets, arrange premises / operations and establish the enterprise.',
        ],
        [
          '5. Operations',
          'Begin commercial activity, maintain records and monitor cash flow and repayment obligations where applicable.',
        ],
      ],
      [35, contentWidth - 35]
    );

    // --------------------------------------------------
    // Documents and declaration
    // --------------------------------------------------

    addSection('J', 'Documents & Next Steps');

    addBulletList([
      'Review the selected scheme conditions and confirm the latest requirements with the concerned implementing agency or bank.',
      'Keep identity, address, category, income, education and business-related documents ready as applicable.',
      'Obtain quotations and prepare a final project cost based on the actual enterprise requirement.',
      'Use the Yojana Setu OCR pre-check as a preliminary document-readability and keyword check only.',
    ]);

    addSection('K', 'Declaration & Applicant Acknowledgement');

    addParagraph(
      'This report is generated from the information entered by the applicant and the scheme-matching results available in Yojana Setu. It is a preliminary project-support document. It is not a government-issued DPR, approval, sanction letter, eligibility certificate, loan guarantee, or proof of document authenticity. Final eligibility, appraisal, sanction and financing decisions remain with the concerned authority or bank.'
    );

    ensureSpace(24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setText(colors.text);
    doc.text('Applicant Signature: ______________________________', margin, y);
    doc.text(
      'Date: __________________',
      pageWidth - margin - 48,
      y
    );

    y += 13;

    doc.setFontSize(7.3);
    setText(colors.muted);
    doc.text(
      'Prepared using applicant-entered information and configured prototype matching rules.',
      margin,
      y
    );
    setText(colors.text);

    // --------------------------------------------------
    // Finalize page footers and save
    // --------------------------------------------------

    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      drawFooter(page, totalPages);
    }

    const safeSchemeName = scheme.name
      .replace(/[^a-z0-9]+/gi, '_')
      .replace(/^_+|_+$/g, '');

    doc.save(
      `Yojana_Setu_DPR_${safeSchemeName || 'Scheme'}.pdf`
    );
  };

  // --------------------------------------------------
  // Reason icon
  // --------------------------------------------------

  const ReasonIcon = ({
    type,
  }: {
    type: Reason['type'];
  }) => {
    if (type === 'pass') {
      return (
        <CheckCircle
          size={18}
          className="text-green-600"
        />
      );
    }

    if (type === 'warn') {
      return (
        <AlertTriangle
          size={18}
          className="text-yellow-600"
        />
      );
    }

    return (
      <XCircle
        size={18}
        className="text-red-600"
      />
    );
  };

  // --------------------------------------------------
  // Page
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-900">
      {/* Government-style top strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#e67e22] via-white to-[#138808]" />

      {/* Utility bar */}
      <div className="border-b border-slate-200 bg-[#172b4d] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 text-xs">
          <div className="flex items-center gap-4">
            <span>भारत सरकार | Government of India — Style Prototype</span>
            <span className="hidden border-l border-white/30 pl-4 md:inline">
              SIH 2026 · SIH26092
            </span>
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            <span>Accessibility</span>
            <span>Help</span>
            <span>English | हिंदी</span>
          </div>
        </div>
      </div>

      {/* Main identity header */}
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {/* Custom project mark — not an official Government emblem */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-[#172b4d] bg-white shadow-sm">
                <div className="text-center leading-none">
                  <div className="text-[10px] font-bold tracking-widest text-[#e67e22]">YOJANA</div>
                  <div className="mt-1 text-xl font-black text-[#172b4d]">SETU</div>
                  <div className="mx-auto mt-1 h-0.5 w-8 bg-[#138808]" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-[#172b4d] md:text-3xl">
                    योजना सेतु
                  </h1>
                  <span className="text-xl font-medium text-slate-400">|</span>
                  <span className="text-xl font-semibold text-slate-700">Yojana Setu</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  Government Scheme Discovery &amp; Eligibility Assistant
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Prototype developed for Smart India Hackathon 2026 · Problem Statement SIH26092
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setVoiceLanguage(
                    voiceLanguage === 'en-IN' ? 'hi-IN' : 'en-IN'
                  )
                }
                className="flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#172b4d] hover:bg-slate-50"
              >
                <Languages size={17} />
                {voiceLanguage === 'en-IN' ? 'हिंदी / Hindi' : 'English / अंग्रेज़ी'}
              </button>

              <button
                type="button"
                onClick={startVoiceInput}
                disabled={isListening}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white ${
                  isListening
                    ? 'cursor-not-allowed bg-red-600'
                    : 'bg-[#176b45] hover:bg-[#115437]'
                }`}
              >
                <Mic size={17} />
                {isListening
                  ? voiceLanguage === 'hi-IN'
                    ? 'सुन रहा है...'
                    : 'Listening...'
                  : 'Voice Input / बोलकर भरें'}
              </button>
            </div>
          </div>

          {/* Portal navigation */}
          <nav className="hidden border-t border-slate-200 md:flex">
            <div className="flex items-center gap-0">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`border-b-4 px-5 py-3 text-sm font-semibold ${
                  step !== 6
                    ? 'border-[#176b45] text-[#176b45]'
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="border-b-4 border-transparent px-5 py-3 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              >
                Scheme Finder
              </button>
              <button
                type="button"
                onClick={openOCR}
                className="border-b-4 border-transparent px-5 py-3 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              >
                Document Pre-Check
              </button>
              <span className="ml-2 flex items-center gap-2 border-l border-slate-200 px-5 py-3 text-xs text-slate-500">
                <Menu size={15} />
                Citizen Services
              </span>
            </div>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-5 md:py-8">
        {/* Results */}
        {step === 6 ? (
          <section>
            {/* Results title banner */}
            <div className="overflow-hidden border border-slate-300 bg-white shadow-sm">
              <div className="h-1 bg-[#176b45]" />
              <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#176b45]">
                    <Search size={15} />
                    Scheme Finder · परिणाम
                  </div>
                  <h2 className="text-2xl font-bold text-[#172b4d] md:text-3xl">
                    Government Schemes Matched to Your Profile
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    The results below are generated from the profile information you entered and the
                    eligibility rules currently configured in Yojana Setu. Review the detailed reasons
                    before proceeding with any application.
                  </p>
                </div>

                <div className="flex min-w-[190px] items-center justify-center border border-slate-200 bg-[#f8fafb] p-5 text-center">
                  <div>
                    <div className="text-3xl font-bold text-[#172b4d]">{results.length}</div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Matching schemes
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile snapshot */}
              <div className="border-t border-slate-200 bg-[#f8fafb] px-6 py-4 md:px-8">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Search profile summary
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4 lg:grid-cols-7">
                  <div><span className="block text-xs text-slate-500">Age</span><strong>{formData.age}</strong></div>
                  <div><span className="block text-xs text-slate-500">Category</span><strong>{formData.category}</strong></div>
                  <div><span className="block text-xs text-slate-500">Gender</span><strong>{formData.gender}</strong></div>
                  <div><span className="block text-xs text-slate-500">Location</span><strong>{formData.locationType}</strong></div>
                  <div><span className="block text-xs text-slate-500">Education</span><strong>{formData.education}</strong></div>
                  <div><span className="block text-xs text-slate-500">Sector</span><strong>{formData.sector}</strong></div>
                  <div><span className="block text-xs text-slate-500">Capital</span><strong>{formatCurrency(formData.capitalRequired)}</strong></div>
                </div>
              </div>
            </div>

            {/* Results actions */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Info size={17} className="text-[#176b45]" />
                Match percentage is an explainability aid, not a government approval or sanction score.
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="border border-[#172b4d] bg-white px-4 py-2 text-sm font-semibold text-[#172b4d] hover:bg-slate-50"
              >
                Modify Search Profile
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {results.length === 0 ? (
                <div className="border border-slate-300 bg-white p-10 text-center shadow-sm">
                  <AlertTriangle className="mx-auto mb-3 text-yellow-600" size={40} />
                  <h3 className="mb-2 text-xl font-semibold text-[#172b4d]">
                    No matching schemes found
                  </h3>
                  <p className="text-slate-600">
                    Try changing some of your profile information and run the scheme finder again.
                  </p>
                </div>
              ) : (
                results.map((scheme, index) => (
                  <article
                    key={scheme.id}
                    className="overflow-hidden border border-slate-300 bg-white shadow-sm"
                  >
                    <div className="border-l-4 border-[#176b45]">
                      <div className="p-6 md:p-7">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="bg-[#172b4d] px-2.5 py-1 text-xs font-bold text-white">
                                MATCH {index + 1}
                              </span>
                              <span className="border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {scheme.ministry}
                              </span>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="mt-1 shrink-0 border border-[#d9e4df] bg-[#f1f7f4] p-2.5">
                                <ShieldCheck size={23} className="text-[#176b45]" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold leading-tight text-[#172b4d] md:text-2xl">
                                  {scheme.name}
                                </h3>
                                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                                  {scheme.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="w-full border border-slate-200 bg-[#f8fafb] p-4 lg:w-56 lg:shrink-0">
                            <div className="flex items-end justify-between">
                              <div>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Profile match
                                </div>
                                <div className="mt-1 text-3xl font-bold text-[#176b45]">
                                  {scheme.matchPercentage}%
                                </div>
                              </div>
                              <div className="text-right text-xs text-slate-500">
                                Support
                                <div className="mt-1 font-bold text-[#172b4d]">
                                  {scheme.maxLoanLimit > 0
                                    ? formatCurrency(scheme.maxLoanLimit)
                                    : 'Non-loan support'}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 h-2 bg-slate-200">
                              <div
                                className="h-full bg-[#176b45]"
                                style={{ width: `${Math.min(100, Math.max(0, scheme.matchPercentage))}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 border-t border-slate-200 pt-5">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h4 className="text-sm font-bold uppercase tracking-wide text-[#172b4d]">
                              Eligibility assessment
                            </h4>
                            <span className="text-xs text-slate-500">
                              Explainable rule checks
                            </span>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2">
                            {scheme.reasons.map((reason, reasonIndex) => (
                              <div
                                key={reasonIndex}
                                className="flex items-start gap-3 border border-slate-200 bg-[#fbfcfd] p-3"
                              >
                                <div className="mt-0.5 shrink-0">
                                  <ReasonIcon type={reason.type} />
                                </div>
                                <span className="text-sm leading-5 text-slate-700">
                                  {reason.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                          <div className="border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Applicant category
                            </div>
                            <div className="mt-1 font-semibold text-[#172b4d]">{formData.category}</div>
                          </div>
                          <div className="border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Business sector
                            </div>
                            <div className="mt-1 font-semibold text-[#172b4d]">{formData.sector}</div>
                          </div>
                          <div className="border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Capital required
                            </div>
                            <div className="mt-1 font-semibold text-[#172b4d]">
                              {formatCurrency(formData.capitalRequired)}
                            </div>
                          </div>
                        </div>

                        <details className="mt-5 border border-slate-200">
                          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#172b4d] hover:bg-slate-50">
                            View scheme assessment details
                          </summary>
                          <div className="border-t border-slate-200 bg-[#fafbfc] p-4 text-sm leading-6 text-slate-600">
                            <p>
                              This assessment is based on the applicant profile and the eligibility
                              conditions represented in the current Yojana Setu dataset. Final eligibility,
                              documentation requirements, sanction, and financing decisions are made by
                              the concerned implementing authority or bank.
                            </p>
                          </div>
                        </details>

                        <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                          <button
                            type="button"
                            onClick={openOCR}
                            className="flex items-center gap-2 border border-[#176b45] bg-white px-4 py-2.5 text-sm font-semibold text-[#176b45] hover:bg-[#f1f7f4]"
                          >
                            <FileText size={17} />
                            Pre-verify Documents
                          </button>

                          <button
                            type="button"
                            onClick={() => generateDPR(scheme)}
                            className="flex items-center gap-2 bg-[#176b45] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#115437]"
                          >
                            <FileText size={17} />
                            Generate Bank DPR
                          </button>

                          <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
                            <ExternalLink size={14} />
                            Verify final conditions with the concerned authority
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Results footer panel */}
            <div className="mt-6 border border-slate-300 bg-white p-5">
              <div className="flex gap-3">
                <Info className="mt-0.5 shrink-0 text-[#172b4d]" size={19} />
                <div>
                  <h3 className="font-bold text-[#172b4d]">Before you apply</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Yojana Setu is an SIH prototype for scheme discovery. It does not issue certificates,
                    approve loans, authenticate documents, or replace the application process of a
                    government department, corporation, or bank.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-5 flex items-center gap-2 border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#172b4d] hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
              Start New Scheme Search
            </button>
          </section>
        ) : (
          <>
            {/* Portal-style hero */}
            <section className="overflow-hidden border border-slate-300 bg-white shadow-sm">
              <div className="grid lg:grid-cols-[1.55fr_0.75fr]">
                <div className="relative overflow-hidden bg-[#172b4d] px-6 py-8 text-white md:px-9 md:py-10">
                  <div className="absolute right-0 top-0 h-full w-2 bg-[#e67e22]" />
                  <div className="absolute bottom-0 left-0 h-1 w-1/2 bg-[#138808]" />

                  <div className="relative max-w-3xl">
                    <div className="mb-3 inline-flex items-center gap-2 border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                      <Building2 size={15} />
                      Citizen Scheme Services
                    </div>
                    <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                      Find Government Schemes
                      <span className="mt-1 block text-xl font-medium text-slate-200 md:text-2xl">
                        सरकारी योजनाएँ खोजें
                      </span>
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
                      Answer a few simple questions to discover government schemes and financial
                      support that may fit your business profile.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="bg-white px-5 py-3 text-sm font-bold text-[#172b4d] hover:bg-slate-100"
                      >
                        Start Scheme Finder
                      </button>
                      <button
                        type="button"
                        onClick={openOCR}
                        className="border border-white/60 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
                      >
                        Document Pre-Check
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-[#f8fafb] p-6 lg:border-l lg:border-t-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#176b45]">
                    What Yojana Setu provides
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="flex gap-3">
                      <div className="shrink-0 bg-[#172b4d] p-2 text-white">
                        <Search size={17} />
                      </div>
                      <div>
                        <div className="font-bold text-[#172b4d]">Scheme Discovery</div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          Match a business profile with configured scheme eligibility rules.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="shrink-0 bg-[#176b45] p-2 text-white">
                        <ShieldCheck size={17} />
                      </div>
                      <div>
                        <div className="font-bold text-[#172b4d]">Explainable Results</div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          See which profile conditions contributed to each result.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="shrink-0 bg-[#e67e22] p-2 text-white">
                        <FileText size={17} />
                      </div>
                      <div>
                        <div className="font-bold text-[#172b4d]">Application Support</div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          Pre-check documents and generate a preliminary bank-oriented DPR.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How it works */}
            <section className="mt-6 border border-slate-300 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[#f8fafb] px-6 py-4">
                <h3 className="font-bold text-[#172b4d]">How the scheme finder works</h3>
                <p className="mt-1 text-xs text-slate-500">
                  A simple citizen-service workflow inspired by government scheme discovery portals.
                </p>
              </div>
              <div className="grid md:grid-cols-5">
                {[
                  ['01', 'Basic Profile', 'Age & gender'],
                  ['02', 'Social Category', 'Category & income'],
                  ['03', 'Location & Education', 'Residence & education'],
                  ['04', 'Business Sector', 'Business activity'],
                  ['05', 'Capital Required', 'Funding requirement'],
                ].map(([number, title, detail], index) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setStep(index + 1)}
                    className={`border-b border-slate-200 p-4 text-left hover:bg-slate-50 md:border-b-0 md:border-r last:md:border-r-0 ${
                      step === index + 1 ? 'bg-[#f1f7f4]' : 'bg-white'
                    }`}
                  >
                    <div className="text-xs font-black text-[#e67e22]">{number}</div>
                    <div className="mt-1 text-sm font-bold text-[#172b4d]">{title}</div>
                    <div className="mt-1 text-xs text-slate-500">{detail}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Progress */}
            <div className="mt-6 border border-slate-300 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#176b45]">
                    Application assistance
                  </div>
                  <div className="mt-1 font-bold text-[#172b4d]">
                    Step {step} of {TOTAL_STEPS}
                  </div>
                </div>
                <div className="text-sm font-bold text-[#176b45]">
                  {Math.round((step / TOTAL_STEPS) * 100)}% complete
                </div>
              </div>
              <div className="flex h-2 gap-1">
                {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                  <div
                    key={index}
                    className={`flex-1 ${
                      index < step ? 'bg-[#176b45]' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Form */}
            <section className="mt-6 border border-slate-300 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[#f8fafb] px-6 py-5 md:px-8">
                <div className="text-xs font-bold uppercase tracking-wider text-[#176b45]">
                  Applicant information
                </div>
                <h2 className="mt-1 text-xl font-bold text-[#172b4d] md:text-2xl">
                  {step === 1
                    ? 'Basic Profile / मूल जानकारी'
                    : step === 2
                    ? 'Social Category / सामाजिक श्रेणी'
                    : step === 3
                    ? 'Location & Education / स्थान और शिक्षा'
                    : step === 4
                    ? 'Business Sector / व्यवसाय क्षेत्र'
                    : 'Required Capital / आवश्यक पूंजी'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Please provide accurate information for a more useful scheme match.
                </p>
              </div>

              <div className="p-6 md:p-8">
                {/* Step 1 */}
                {step === 1 && (
                  <div>
                    <p className="mb-6 text-sm text-slate-600">
                      Tell us about yourself / अपने बारे में बताएं
                    </p>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-[#172b4d]">
                          Age / उम्र
                        </label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) => updateForm('age', Number(e.target.value))}
                          className="w-full border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#176b45] focus:ring-1 focus:ring-[#176b45]"
                          min={1}
                          max={100}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-[#172b4d]">
                          Gender / लिंग
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => updateForm('gender', e.target.value)}
                          className="w-full border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#176b45]"
                        >
                          {GENDER_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option === 'Female'
                                ? 'Female / महिला'
                                : option === 'Male'
                                ? 'Male / पुरुष'
                                : 'Transgender / ट्रांसजेंडर'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div>
                    <p className="mb-6 text-sm text-slate-600">
                      Select your social category / अपनी सामाजिक श्रेणी चुनें
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {CATEGORY_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateForm('category', option)}
                          className={`border p-4 text-left text-sm font-semibold transition ${
                            formData.category === option
                              ? 'border-[#176b45] bg-[#f1f7f4] text-[#176b45]'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-[#176b45]'
                          }`}
                        >
                          {option === 'SC'
                            ? 'SC / अनुसूचित जाति'
                            : option === 'ST'
                            ? 'ST / अनुसूचित जनजाति'
                            : option === 'OBC'
                            ? 'OBC / अन्य पिछड़ा वर्ग'
                            : option === 'PwD'
                            ? 'PwD / दिव्यांग'
                            : option === 'Safai Karamchari'
                            ? 'Safai Karamchari / सफाई कर्मचारी'
                            : 'General / सामान्य'}
                        </button>
                      ))}
                    </div>
                    <div className="mt-6">
                      <label className="mb-2 block text-sm font-bold text-[#172b4d]">
                        Annual Family Income / वार्षिक पारिवारिक आय
                      </label>
                      <input
                        type="number"
                        value={formData.income}
                        onChange={(e) => updateForm('income', Number(e.target.value))}
                        className="w-full border border-slate-300 px-4 py-3 outline-none focus:border-[#176b45]"
                        min={0}
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Example: ₹2,00,000 per year
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div>
                    <p className="mb-6 text-sm text-slate-600">
                      Tell us where you live and your education level.
                    </p>
                    <div className="mb-7">
                      <label className="mb-3 block text-sm font-bold text-[#172b4d]">
                        Location / स्थान
                      </label>
                      <div className="grid gap-3 md:grid-cols-2">
                        {LOCATION_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => updateForm('locationType', option)}
                            className={`border p-4 text-left text-sm font-semibold ${
                              formData.locationType === option
                                ? 'border-[#176b45] bg-[#f1f7f4] text-[#176b45]'
                                : 'border-slate-300 hover:border-[#176b45]'
                            }`}
                          >
                            {option === 'Rural' ? 'Rural / ग्रामीण' : 'Urban / शहरी'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-bold text-[#172b4d]">
                        Education / शिक्षा
                      </label>
                      <div className="grid gap-3 md:grid-cols-2">
                        {EDUCATION_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => updateForm('education', option)}
                            className={`border p-4 text-left text-sm font-semibold ${
                              formData.education === option
                                ? 'border-[#176b45] bg-[#f1f7f4] text-[#176b45]'
                                : 'border-slate-300 hover:border-[#176b45]'
                            }`}
                          >
                            {option === 'Below 8th'
                              ? 'Below 8th / आठवीं से कम'
                              : option === '8th Passed'
                              ? '8th Passed / आठवीं पास'
                              : option === '10th Passed'
                              ? '10th Passed / दसवीं पास'
                              : 'Graduate/Diploma / स्नातक/डिप्लोमा'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                  <div>
                    <p className="mb-6 text-sm text-slate-600">
                      What type of business do you want to start?
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {SECTOR_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateForm('sector', option)}
                          className={`border p-5 text-left text-sm font-semibold ${
                            formData.sector === option
                              ? 'border-[#176b45] bg-[#f1f7f4] text-[#176b45]'
                              : 'border-slate-300 hover:border-[#176b45]'
                          }`}
                        >
                          {option === 'Manufacturing'
                            ? 'Manufacturing / निर्माण'
                            : option === 'Services'
                            ? 'Services / सेवा'
                            : option === 'Trading'
                            ? 'Trading / व्यापार'
                            : 'Agriculture-Allied / कृषि-संबंधित'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5 */}
                {step === 5 && (
                  <div>
                    <p className="mb-6 text-sm text-slate-600">
                      How much money do you need for your business?
                    </p>
                    <label className="mb-2 block text-sm font-bold text-[#172b4d]">
                      Required Capital / आवश्यक पूंजी
                    </label>
                    <input
                      type="number"
                      value={formData.capitalRequired}
                      onChange={(e) => updateForm('capitalRequired', Number(e.target.value))}
                      className="w-full border border-slate-300 px-4 py-3 text-lg outline-none focus:border-[#176b45]"
                      min={0}
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      Current amount: <strong>{formatCurrency(formData.capitalRequired)}</strong>
                    </p>

                    <div className="mt-6 border border-[#cfe1d8] bg-[#f1f7f4] p-5">
                      <p className="font-bold text-[#176b45]">
                        Profile Summary / प्रोफ़ाइल सारांश
                      </p>
                      <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2 lg:grid-cols-3">
                        <p>Age / उम्र: <strong>{formData.age}</strong></p>
                        <p>Gender / लिंग: <strong>{formData.gender}</strong></p>
                        <p>Category / श्रेणी: <strong>{formData.category}</strong></p>
                        <p>Location / स्थान: <strong>{formData.locationType}</strong></p>
                        <p>Sector / क्षेत्र: <strong>{formData.sector}</strong></p>
                        <p>Capital / पूंजी: <strong>{formatCurrency(formData.capitalRequired)}</strong></p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={step === 1}
                    className={`flex items-center gap-2 border px-5 py-3 text-sm font-semibold ${
                      step === 1
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        : 'border-slate-300 bg-white text-[#172b4d] hover:bg-slate-50'
                    }`}
                  >
                    <ArrowLeft size={18} />
                    Back / पीछे
                  </button>

                  {step < TOTAL_STEPS ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center gap-2 bg-[#176b45] px-6 py-3 text-sm font-bold text-white hover:bg-[#115437]"
                    >
                      Next / आगे
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={findSchemes}
                      disabled={loading}
                      className={`flex items-center gap-2 px-6 py-3 text-sm font-bold text-white ${
                        loading
                          ? 'cursor-not-allowed bg-[#75a993]'
                          : 'bg-[#176b45] hover:bg-[#115437]'
                      }`}
                    >
                      {loading ? 'Finding Schemes...' : 'Find Schemes / योजनाएँ खोजें'}
                      {!loading && <Search size={18} />}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Voice assistance */}
            <section className="mt-6 border border-slate-300 bg-white p-5 shadow-sm">
              <div className="flex gap-3">
                <div className="shrink-0 bg-[#172b4d] p-2 text-white">
                  <Mic size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[#172b4d]">
                    Voice Input / बोलकर जानकारी भरें
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Current voice language:{' '}
                    <strong>
                      {voiceLanguage === 'hi-IN'
                        ? 'Hindi / हिंदी'
                        : 'English / अंग्रेज़ी'}
                    </strong>
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {voiceLanguage === 'hi-IN'
                      ? 'उदाहरण: "मेरी उम्र अट्ठाईस है और मैं एक पुरुष हूँ।"'
                      : 'Example: "My age is twenty eight and I am male."'}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-300 bg-[#172b4d] text-white">
        <div className="mx-auto max-w-7xl px-5 py-8">
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="text-lg font-bold">योजना सेतु | Yojana Setu</div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                An SIH 2026 prototype for AI-assisted discovery of government schemes
                relevant to marginalized entrepreneurs.
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Prototype
              </div>
              <p className="mt-2 text-sm text-slate-300">SIH26092</p>
              <p className="text-sm text-slate-300">Ministry of Social Justice &amp; Empowerment</p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Notice
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-300">
                This is a student prototype. It is not an official Government of India portal.
              </p>
            </div>
          </div>
          <div className="mt-7 border-t border-white/15 pt-4 text-xs text-slate-400">
            Yojana Setu · Scheme discovery prototype · For demonstration and evaluation purposes
          </div>
        </div>
      </footer>

      {/* OCR modal */}
      {ocrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172b4d]/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-slate-300 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#f8fafb] p-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#176b45]">
                  Citizen document service
                </div>
                <h2 className="mt-1 text-xl font-bold text-[#172b4d]">Document Pre-Check</h2>
                <p className="mt-1 text-sm text-slate-500">
                  OCR checks the visible text in your uploaded image. It does not prove document authenticity or verify the document with a government database.
                </p>
              </div>
              <button
                type="button"
                onClick={closeOCR}
                className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white"
              >
                Close
              </button>
            </div>

            <div className="p-6">
              <div className="border-2 border-dashed border-slate-300 bg-[#fafbfc] p-6 text-center">
                <input
                  id="ocr-document-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleOCRFile}
                  className="hidden"
                />
                <label
                  htmlFor="ocr-document-upload"
                  className="inline-flex cursor-pointer items-center gap-2 bg-[#176b45] px-5 py-3 text-sm font-bold text-white hover:bg-[#115437]"
                >
                  <FileText size={17} />
                  {ocrLoading ? 'Processing...' : 'Choose Document Image'}
                </label>
                <p className="mt-3 text-xs text-slate-500">
                  Supported: JPG, JPEG, PNG, WEBP · English/Hindi OCR
                </p>
                {ocrFileName && (
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Uploaded: {ocrFileName}
                  </p>
                )}
              </div>

              {ocrLoading && (
                <div className="mt-5 border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  {ocrStatus}
                </div>
              )}

              {ocrError && (
                <div className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {ocrError}
                </div>
              )}

              {!ocrLoading && ocrFindings.length > 0 && (
                <div className="mt-6">
                  <div className="border border-slate-200 bg-[#f8fafb] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Pre-check result
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#172b4d]">
                      {ocrDocumentType
                        ? ocrDocumentType
                        : 'Document type could not be determined from the OCR text.'}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {ocrFindings.map((finding) => (
                      <div
                        key={finding.label}
                        className="flex gap-3 border border-slate-200 p-4"
                      >
                        {finding.status === 'found' ? (
                          <CheckCircle className="mt-0.5 shrink-0 text-green-600" size={20} />
                        ) : finding.status === 'warning' ? (
                          <AlertTriangle className="mt-0.5 shrink-0 text-yellow-600" size={20} />
                        ) : (
                          <XCircle className="mt-0.5 shrink-0 text-red-600" size={20} />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{finding.label}</p>
                          <p className="mt-1 text-sm text-slate-600">{finding.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-900">
                    <strong>Important:</strong> This is a preliminary OCR/document-relevance check.
                    A successful pre-check does not confirm that the certificate is genuine, valid,
                    issued by the claimed authority, or legally acceptable for a government application.
                  </div>

                  {ocrText && (
                    <details className="mt-5 border border-slate-200 p-4">
                      <summary className="cursor-pointer font-semibold text-slate-700">
                        View extracted OCR text
                      </summary>
                      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-600">
                        {ocrText}
                      </pre>
                    </details>
                  )}

                  {ocrStatus && !ocrLoading && (
                    <p className="mt-4 text-xs text-slate-500">{ocrStatus}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

