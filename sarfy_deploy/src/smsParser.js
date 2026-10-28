// Sarfy - Smart Bank & InstaPay SMS & Notification Parser
// محرك تحليل ذكي لرسائل البنوك والمحافظ الإلكترونية باللغتين العربية والإنجليزية

export function parseFinancialMessage(rawText, accounts = []) {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.trim();
  if (text.length < 5) return null;

  let type = 'expense'; // افتراضياً مصروف
  let amount = null;
  let merchant = '';
  let category = '';
  let accountId = accounts[0]?.id || 'acc_1';
  let date = new Date().toISOString().split('T')[0];

  // 1. تحديد نوع العملية (دخل أم مصروف)
  const isIncome = /(إيداع|تم استلام|استلمت|حوالة واردة|تحويل وارد|اضافة|deposit|received|credited|incoming transfer)/i.test(text);
  const isExpense = /(خصم|شراء|تم سحب|سحب|سداد|دفع|تحويل إلى|تحويل صادر|purchase|debit|withdrawn|paid|sent to)/i.test(text);

  if (isIncome && !isExpense) {
    type = 'income';
  } else {
    type = 'expense';
  }

  // 2. استخراج المبلغ المالي
  // يبحث عن الأنماط مثل: 450.00 ج.م أو EGP 450 أو 500 جنيه أو 1,250.50
  const amountRegexes = [
    /(?:مبلغ|بقيمة|بمبلغ|قيمة|amount of|of|for)\s*(?:EGP|LE|SAR|USD|\$|ج\.م|جم|جنيه|رس|ريال)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:EGP|LE|SAR|USD|ج\.م|جم|جنيه|رس|ريال)/i,
    /(?:EGP|LE|SAR|USD|\$)\s*([\d,]+(?:\.\d{1,2})?)/i
  ];

  for (const rx of amountRegexes) {
    const match = text.match(rx);
    if (match && match[1]) {
      const parsed = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // إذا لم نجد بنمط محدد، نبحث عن أول رقم منطقي في الرسالة
  if (!amount) {
    const fallbackMatch = text.match(/(\d+(?:\.\d{1,2})?)/);
    if (fallbackMatch) {
      const parsed = parseFloat(fallbackMatch[1]);
      if (parsed > 0 && parsed < 10000000) {
        amount = parsed;
      }
    }
  }

  // 3. استخراج اسم المتجر أو الطرف المستلم / المرسل
  const toPersonMatch = text.match(/(?:إلى|to)\s+([A-Za-z0-9\u0600-\u06FF\s]{2,20}?)(?=\s+(?:عبر|بتاريخ|في|رصيدك|من|بنك|إنستاباي|instapay)|[\.\n,]|$)/i);
  const merchantMatch = text.match(/(?:لدى|من متجر|في متجر|at)\s+([A-Za-z0-9\u0600-\u06FF\s\.\-]{2,25}?)(?=\s+(?:من|عبر|بتاريخ|في|رصيدك|باستخدام|with|on|balance|ending)|[\.\n,]|$)/i);
  
  if (toPersonMatch && toPersonMatch[1]) {
    merchant = `تحويل إلى ${toPersonMatch[1].trim()}`;
  } else if (merchantMatch && merchantMatch[1]) {
    merchant = merchantMatch[1].trim().replace(/^(متجر|شركة|محل)\s+/i, '');
  }

  // 4. استنتاج التصنيف بناءً على المتجر أو النص
  const lower = text.toLowerCase();
  if (/(كارفور|بنده|سوبرماركت|هايبر|ماركت|خضار|فواكه|لحوم|بقالة|carrefour|market|grocery|metro|spinneys|hyper)/i.test(lower)) {
    category = 'طعام ومشروبات';
    if (!merchant) merchant = 'سوبرماركت ومواد غذائية';
  } else if (/(مطعم|كافيه|قهوة|ستاربكس|ماكدونالدز|كنتاكي|برجر|بيتزا|restaurant|cafe|coffee|starbucks|mcdonalds|kfc|burger)/i.test(lower)) {
    category = 'طعام ومشروبات';
    if (!merchant) merchant = 'مطعم وكافيه';
  } else if (/(بنزين|محطة|طاقة|شل|موبيل|توتال|أوبر|كريم|سويفل|تاكسي|قطار|تذكرة|gas|fuel|shell|mobil|total|uber|careem)/i.test(lower)) {
    category = 'مواصلات وبنزين';
    if (!merchant) merchant = 'وقود ومواصلات';
  } else if (/(صيدلية|علاج|دواء|دكتور|مستشفى|تحاليل|عيادة|pharmacy|hospital|clinic|doctor|lab)/i.test(lower)) {
    category = 'صحة وعلاج';
    if (!merchant) merchant = 'صيدلية وعناية طبية';
  } else if (/(فاتورة|كهرباء|مياه|غاز|إنترنت|شحن|we|vodafone|orange|etisalat|bill|telecom)/i.test(lower) && !isIncome) {
    category = 'فواتير ومرافق';
    if (!merchant) merchant = 'سداد فاتورة ومرافق';
  } else if (/(أمازون|نون|بي تك|ملابس|أحذية|زارا|amazon|noon|b\.tech|jumia|zara|shopping|fashion)/i.test(lower)) {
    category = 'تسوق وملابس';
    if (!merchant) merchant = 'مشتريات وتسوق';
  } else if (/(قسط|تمويل|سلفة|سداد قسط|installment|loan)/i.test(lower)) {
    category = 'أقساط';
    if (!merchant) merchant = 'سداد قسط';
  } else if (isIncome && /(راتب|مرتب|salary|payroll)/i.test(lower)) {
    category = 'راتب';
    if (!merchant || merchant === 'حسابك') merchant = 'تحويل راتب شهري';
  } else {
    category = type === 'expense' ? 'أخرى' : 'أخرى';
    if (!merchant || merchant === 'حسابك') merchant = type === 'expense' ? 'مصروف عبر إشعار بنكي' : 'إيداع بنكي';
  }

  // 5. مطابقة الحساب المناسب
  // مطابقة الأرقام الأربعة الأخيرة
  const cardDigitsMatch = text.match(/(?:بطاقتك|بطاقة|حساب|card|ending)\s*(?:المنتهية بـ|رقم)?\s*(?:[xX*]*\s*)?(\d{4})/i);
  if (cardDigitsMatch && cardDigitsMatch[1]) {
    const last4 = cardDigitsMatch[1];
    const foundAcc = accounts.find(a => 
      (a.name && a.name.includes(last4)) ||
      (a.notes && a.notes.includes(last4)) ||
      (a.number && a.number.endsWith(last4))
    );
    if (foundAcc) accountId = foundAcc.id;
  } else if (/(فودافون كاش|محفظة|vodafone cash|wallet|orange cash|etisalat cash)/i.test(lower)) {
    const walletAcc = accounts.find(a => a.type === 'محفظة إلكترونية' || a.name.includes('كاش') || a.name.includes('فودافون'));
    if (walletAcc) accountId = walletAcc.id;
  } else if (/(انستاباي|إنستاباي|instapay)/i.test(lower)) {
    const bankAcc = accounts.find(a => a.type === 'بنكي' || a.name.includes('إنستاباي'));
    if (bankAcc) accountId = bankAcc.id;
  } else if (/(atm|ماكينة|صراف|بنك)/i.test(lower)) {
    const bankAcc = accounts.find(a => a.type === 'بنكي');
    if (bankAcc) accountId = bankAcc.id;
  }

  return {
    rawText: text,
    type,
    amount: amount || 0,
    merchant,
    category,
    accountId,
    date,
    confidence: amount ? (merchant ? 'high' : 'medium') : 'low'
  };
}
