// Sarfy - Smart Bank & InstaPay SMS & Notification Parser
// محرك تحليل ذكي لرسائل البنوك والمحافظ الإلكترونية باللغتين العربية والإنجليزية

// مطابقة تصنيف المحلل مع تصنيفات المستخدم الفعلية (مثل "طعام ومشروبات" ← "طعام")
export function matchUserCategory(parsedCategory, userCategories = []) {
  if (!parsedCategory || !userCategories.length) return '';
  if (userCategories.includes(parsedCategory)) return parsedCategory;
  const words = parsedCategory.split(/\s+و?|\s*و\s*/).map(w => w.trim()).filter(w => w.length >= 2);
  const found = userCategories.find(cat =>
    words.some(w => cat.includes(w) || w.includes(cat))
  );
  if (found) return found;
  return userCategories.includes('أخرى') ? 'أخرى' : '';
}

export function parseFinancialMessage(rawText, accounts = []) {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.trim();
  if (text.length < 5) return null;

  let type = 'expense'; // افتراضياً مصروف
  let amount = null;
  let merchant = '';
  let category = '';
  let accountId = accounts[0]?.id || '';
  const now = new Date();
  let date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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
    const walletAcc = accounts.find(a => a.type === 'محفظة إلكترونية' || (a.name || '').includes('فودافون'));
    if (walletAcc) accountId = walletAcc.id;
  } else if (/(انستاباي|إنستاباي|instapay)/i.test(lower)) {
    const bankAcc = accounts.find(a => a.type === 'حساب بنكي' || (a.name || '').includes('إنستاباي'));
    if (bankAcc) accountId = bankAcc.id;
  } else if (/(atm|ماكينة|صراف|بنك)/i.test(lower)) {
    const bankAcc = accounts.find(a => a.type === 'حساب بنكي');
    if (bankAcc) accountId = bankAcc.id;
  }

  // 6. التاريخ والوقت إن وردا في الإشعار (مثل 29/10/2026 أو 29-10-26 و 14:35 أو 2:35 PM)
  let time = '';
  const dateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (dateMatch) {
    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    let year = Number(dateMatch[3]);
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  const timeMatch = text.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|ص|م)?/i);
  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const suffix = (timeMatch[3] || '').toLowerCase();
    if ((suffix === 'pm' || suffix === 'م') && hours < 12) hours += 12;
    if ((suffix === 'am' || suffix === 'ص') && hours === 12) hours = 0;
    if (hours < 24 && minutes < 60) {
      time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  return {
    rawText: text,
    time,
    type,
    amount: amount || 0,
    merchant,
    category,
    accountId,
    date,
    confidence: amount ? (merchant ? 'high' : 'medium') : 'low'
  };
}
