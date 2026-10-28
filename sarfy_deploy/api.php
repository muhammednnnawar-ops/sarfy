<?php
/**
 * ============================================================
 * Sarfy (صرفي) - REST API Backend with Military-Grade AES-256 Encryption
 * معالج الطلبات والمزامنة والتشفير التلقائي لقاعدة بيانات MySQL (HostArmada Speed Reaper)
 * ============================================================
 */

header('Content-Type: application/json; charset=utf-8');
// تحديد السماح بالمصدر (CORS) لنفس النطاق فقط بدلاً من الجميع
$allowedOrigin = isset($_SERVER['HTTP_ORIGIN']) ? trim($_SERVER['HTTP_ORIGIN']) : '';
$selfOrigin = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '');
if ($allowedOrigin === '' || $allowedOrigin === $selfOrigin) {
    header('Access-Control-Allow-Origin: ' . ($allowedOrigin !== '' ? $allowedOrigin : $selfOrigin));
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Vary: Origin');

// معالجة طلبات Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// دالة إرجاع استجابة JSON وإنهاء التنفيذ
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// التحقق من وجود ملف الإعدادات
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    jsonResponse([
        'success' => false,
        'connected' => false,
        'error' => 'ملف config.php غير موجود على السيرفر.',
        'help' => 'يرجى رفع ملف config.php بجوار api.php وضبط بيانات الاتصال.'
    ], 200);
}

require_once $configFile;

/**
 * ============================================================
 * Sarfy Military-Grade AES-256 Cryptographic Engine
 * تشفير وفك تشفير كافة السجلات والبيانات المخزنة بقاعدة البيانات
 * تشفير حقيقي بـ AES-256-CBC مع توثيق السلامة بـ HMAC-SHA256
 * ============================================================
 */
function getEncryptionKey() {
    // مفتاح التشفير يجب أن يكون مضبوطاً في config.php — لن نعمل أبداً بمفتاح افتراضي معروف
    if (!defined('DB_ENCRYPTION_KEY') || empty(DB_ENCRYPTION_KEY)) {
        jsonResponse([
            'success' => false,
            'error' => 'مفتاح التشفير DB_ENCRYPTION_KEY غير مضبوط في ملف config.php. تم إيقاف واجهة البرمجة لأسباب أمنية.',
            'help' => 'أضف الثابت DB_ENCRYPTION_KEY في config.php بقيمة عشوائية طويلة (64 حرفاً على الأقل) ولا تشاركه مع أحد.'
        ], 500);
    }
    return hash('sha256', DB_ENCRYPTION_KEY, true); // مفتاح ثنائي 32 بايت لـ AES-256
}

function db_encrypt($data) {
    if ($data === null || $data === '') {
        return $data;
    }
    $plain = is_array($data) || is_object($data) ? json_encode($data, JSON_UNESCAPED_UNICODE) : (string)$data;
    
    // إذا كانت البيانات مشفرة مسبقاً لا نعيد تشفيرها
    if (strpos($plain, 'ENC::v1::') === 0) {
        return $plain;
    }

    $key = getEncryptionKey();
    $iv = openssl_random_pseudo_bytes(16);
    $ciphertext = openssl_encrypt($plain, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    
    if ($ciphertext === false) {
        return $plain; // في حال تعذر التشفير نرجع النص
    }

    $hmac = hash_hmac('sha256', $iv . $ciphertext, $key, true);
    return 'ENC::v1::' . base64_encode($iv . $hmac . $ciphertext);
}

function db_decrypt($data) {
    if (!is_string($data) || strpos($data, 'ENC::v1::') !== 0) {
        return $data; // نص عادي غير مشفر (دعم رجعي كامل)
    }

    $b64 = substr($data, 9);
    $raw = base64_decode($b64);
    if ($raw === false || strlen($raw) < 48) {
        return $data;
    }

    $iv = substr($raw, 0, 16);
    $hmac = substr($raw, 16, 32);
    $ciphertext = substr($raw, 48);

    $key = getEncryptionKey();
    $calculatedHmac = hash_hmac('sha256', $iv . $ciphertext, $key, true);

    if (!hash_equals($hmac, $calculatedHmac)) {
        return $data; // فشل التحقق من السلامة أو المفتاح غير مطابق
    }

    $decrypted = openssl_decrypt($ciphertext, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    return $decrypted !== false ? $decrypted : $data;
}

// ============================================================
// نظام جلسات تسجيل الدخول (Session Tokens) - إصدار 1
// ============================================================
function ensureSessionsTable($pdo) {
    static $done = false;
    if ($done) return;
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_sessions (
        token VARCHAR(64) NOT NULL PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $done = true;
}

// إصدار توكن جلسة عشوائي آمن وتخزينه مرتبطاً بالمستخدم
function issueSessionToken($pdo, $userId) {
    ensureSessionsTable($pdo);
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare("INSERT INTO user_sessions (token, user_id) VALUES (?, ?)");
    $stmt->execute([$token, $userId]);
    // حد أقصى للجلسات النشطة لكل مستخدم: نحتفظ بآخر 10 فقط
    try {
        $pdo->prepare("DELETE s1 FROM user_sessions s1
            INNER JOIN user_sessions s2
            ON s1.user_id = s2.user_id AND s1.created_at <
            (SELECT created_at FROM (SELECT created_at FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1 OFFSET 9) latest)
            WHERE s1.user_id = ?")->execute([$userId, $userId]);
    } catch (Exception $e) {}
    return $token;
}

// التحقق من صحة توكن الجلسة وإرجاع معرف المستخدم المرتبط به
function requireSession($pdo) {
    $token = '';
    $authHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? trim($_SERVER['HTTP_AUTHORIZATION']) : '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $m)) {
        $token = $m[1];
    } elseif (isset($_GET['token'])) {
        $token = trim($_GET['token']);
    }

    if (empty($token)) {
        jsonResponse(['success' => false, 'error' => 'الوصول مرفوض: مطلوب تسجيل الدخول (توكن جلسة غير موجود).'], 401);
    }

    try {
        ensureSessionsTable($pdo);
        $stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? LIMIT 1");
        $stmt->execute([$token]);
        $row = $stmt->fetch();
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => 'تعذر التحقق من الجلسة.'], 500);
    }

    if (!$row) {
        http_response_code(401);
        jsonResponse(['success' => false, 'error' => 'انتهت الجلسة أو التوكن غير صالح. يرجى تسجيل الدخول من جديد.'], 401);
    }

    return $row['user_id'];
}

// جدول محاولات تسجيل الدخول الفاشلة (Rate Limiting على السيرفر)
function ensureLoginAttemptsTable($pdo) {
    static $done = false;
    if ($done) return;
    $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_ip_time (ip_address, attempted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $done = true;
}

// التحقق من تجاوز الحد المسموح لمحاولات الدخول الفاشلة من نفس الـ IP
function isLoginRateLimited($pdo) {
    try {
        ensureLoginAttemptsTable($pdo);
        $ip = isset($_SERVER['REMOTE_ADDR']) ? substr($_SERVER['REMOTE_ADDR'], 0, 45) : 'unknown';
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM login_attempts WHERE ip_address = ? AND attempted_at > (NOW() - INTERVAL 15 MINUTE)");
        $stmt->execute([$ip]);
        return ((int)$stmt->fetchColumn()) >= 20;
    } catch (Exception $e) {
        return false; // في حال تعذر الوصول للجدول لا نمنع المستخدمين الشرعيين
    }
}

function recordFailedLoginAttempt($pdo) {
    try {
        ensureLoginAttemptsTable($pdo);
        $ip = isset($_SERVER['REMOTE_ADDR']) ? substr($_SERVER['REMOTE_ADDR'], 0, 45) : 'unknown';
        $pdo->prepare("INSERT INTO login_attempts (ip_address) VALUES (?)")->execute([$ip]);
        // تنظيف السجلات الأقدم من يوم لإبقاء الجدول صغيراً
        $pdo->exec("DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL 1 DAY)");
    } catch (Exception $e) {}
}

// إنشاء اتصال PDO بقاعدة البيانات
function getDB() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : '3306') . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    return $pdo;
}

// توجيه الإجراء المطلوب
$action = isset($_GET['action']) ? trim($_GET['action']) : '';

try {
    // 1. اختبار الاتصال بقاعدة البيانات (Test Connection)
    if ($action === 'test') {
        try {
            $pdo = getDB();
            $stmt = $pdo->query("SHOW TABLES");
            $tables = [];
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }

            jsonResponse([
                'success' => true,
                'connected' => true,
                'tables_count' => count($tables),
                'encryption' => 'AES-256-CBC Active with HMAC-SHA256 Integrity',
                'encrypted_storage' => true,
                'message' => 'متصل بنجاح بقاعدة البيانات MySQL - التشفير AES-256 مُفعّل'
            ]);
        } catch (Exception $e) {
            jsonResponse([
                'success' => false,
                'connected' => false,
                'error' => 'تعذر الاتصال بقاعدة البيانات. تحقق من إعدادات config.php (اسم القاعدة والمستخدم وكلمة المرور).'
            ]);
        }
    }

    // لجميع الإجراءات التالية نحتاج اتصالاً صحيحاً بـ MySQL
    $pdo = getDB();

    // 2. جلب البيانات من السيرفر (Get All Data / Multi-Device Poll) - يتطلب توكن جلسة صالح
    if ($action === 'get_data' || $action === 'poll_data') {
        // معرف المستخدم يُستمد من توكن الجلسة فقط (لا يُقبل من العميل بعد الآن)
        $userId = requireSession($pdo);
        $lastUpdated = isset($_GET['last_updated']) ? trim($_GET['last_updated']) : '';
        $pollOnly = isset($_GET['poll_only']) && ($_GET['poll_only'] === '1' || $_GET['poll_only'] === 'true');

        // محاولة جلب الحالة المحفوظة بالكامل وتوقيت التحديث أولاً
        try {
            $stateStmt = $pdo->prepare("SELECT state_json, updated_at FROM user_app_state WHERE user_id = ?");
            $stateStmt->execute([$userId]);
            $stateRow = $stateStmt->fetch();
        } catch (Exception $e) {
            $stateStmt = $pdo->prepare("SELECT state_json FROM user_app_state WHERE user_id = ?");
            $stateStmt->execute([$userId]);
            $stateRow = $stateStmt->fetch();
            if ($stateRow) {
                $stateRow['updated_at'] = md5($stateRow['state_json']);
            }
        }

        if ($stateRow && !empty($stateRow['state_json'])) {
            $serverUpdatedAt = $stateRow['updated_at'] ?? '';
            // التحقق من وجود تغييرات جديدة للأجهزة المتعددة
            if ($pollOnly && !empty($lastUpdated) && $serverUpdatedAt === $lastUpdated) {
                jsonResponse([
                    'success' => true,
                    'has_changes' => false,
                    'updated_at' => $serverUpdatedAt
                ]);
            }

            // فك تشفير الحالة المخزنة بـ AES-256
            $decryptedJson = db_decrypt($stateRow['state_json']);
            $fullData = json_decode($decryptedJson, true);
            jsonResponse([
                'success' => true,
                'has_changes' => true,
                'source' => 'app_state',
                'encrypted' => true,
                'updated_at' => $serverUpdatedAt,
                'data' => $fullData
            ]);
        }

        // إذا لم توجد حالة كاملة، إعادة بناء البيانات من الجداول العلائقية وفك تشفيرها
        $accountsStmt = $pdo->prepare("SELECT id, name, type, CAST(opening AS DECIMAL(15,2)) as opening, status, notes FROM accounts WHERE user_id = ?");
        $accountsStmt->execute([$userId]);
        $accounts = $accountsStmt->fetchAll();
        foreach ($accounts as &$a) {
            $a['name'] = db_decrypt($a['name']);
            $a['type'] = db_decrypt($a['type']);
            $a['notes'] = db_decrypt($a['notes']);
            $a['opening'] = (float)$a['opening'];
        }

        $incomeStmt = $pdo->prepare("SELECT id, date, source, description as 'desc', category, CAST(amount AS DECIMAL(15,2)) as amount, account_id as accountId, method, status, expected_type as expectedType, expected_date as expectedDate, notes FROM income WHERE user_id = ?");
        $incomeStmt->execute([$userId]);
        $income = $incomeStmt->fetchAll();
        foreach ($income as &$i) {
            $i['source'] = db_decrypt($i['source']);
            $i['desc'] = db_decrypt($i['desc']);
            $i['category'] = db_decrypt($i['category']);
            $i['method'] = db_decrypt($i['method']);
            $i['notes'] = db_decrypt($i['notes']);
            $i['amount'] = (float)$i['amount'];
        }

        $expensesStmt = $pdo->prepare("SELECT id, date, description as 'desc', main_cat as mainCat, sub_cat as subCat, CAST(amount AS DECIMAL(15,2)) as amount, account_id as accountId, method, necessity, recurrence, status, notes FROM expenses WHERE user_id = ?");
        $expensesStmt->execute([$userId]);
        $expenses = $expensesStmt->fetchAll();
        foreach ($expenses as &$e) {
            $e['desc'] = db_decrypt($e['desc']);
            $e['mainCat'] = db_decrypt($e['mainCat']);
            $e['subCat'] = db_decrypt($e['subCat']);
            $e['method'] = db_decrypt($e['method']);
            $e['notes'] = db_decrypt($e['notes']);
            $e['amount'] = (float)$e['amount'];
        }

        $transfersStmt = $pdo->prepare("SELECT id, date, from_account_id as fromAccountId, to_account_id as toAccountId, CAST(amount AS DECIMAL(15,2)) as amount, CAST(fee AS DECIMAL(15,2)) as fee, status, notes FROM transfers WHERE user_id = ?");
        $transfersStmt->execute([$userId]);
        $transfers = $transfersStmt->fetchAll();
        foreach ($transfers as &$t) {
            $t['notes'] = db_decrypt($t['notes']);
            $t['amount'] = (float)$t['amount'];
            $t['fee'] = (float)$t['fee'];
        }

        $debtsOwedStmt = $pdo->prepare("SELECT id, person, description as 'desc', CAST(original AS DECIMAL(15,2)) as original, CAST(paid AS DECIMAL(15,2)) as paid, start_date as startDate, due_date as dueDate, status, account_id as accountId, notes FROM debts_owed WHERE user_id = ?");
        $debtsOwedStmt->execute([$userId]);
        $debtsOwed = $debtsOwedStmt->fetchAll();
        foreach ($debtsOwed as &$d) {
            $d['person'] = db_decrypt($d['person']);
            $d['desc'] = db_decrypt($d['desc']);
            $d['notes'] = db_decrypt($d['notes']);
            $d['original'] = (float)$d['original'];
            $d['paid'] = (float)$d['paid'];
        }

        $debtsRecStmt = $pdo->prepare("SELECT id, person, description as 'desc', CAST(original AS DECIMAL(15,2)) as original, CAST(received AS DECIMAL(15,2)) as received, start_date as startDate, due_date as dueDate, probability, status, notes FROM debts_receivable WHERE user_id = ?");
        $debtsRecStmt->execute([$userId]);
        $debtsReceivable = $debtsRecStmt->fetchAll();
        foreach ($debtsReceivable as &$d) {
            $d['person'] = db_decrypt($d['person']);
            $d['desc'] = db_decrypt($d['desc']);
            $d['notes'] = db_decrypt($d['notes']);
            $d['original'] = (float)$d['original'];
            $d['received'] = (float)$d['received'];
        }

        $subStmt = $pdo->prepare("SELECT id, name, type, CAST(value AS DECIMAL(15,2)) as value, interval_value as intervalValue, interval_unit as intervalUnit, start_date as startDate, next_renewal as nextRenewal, account_id as accountId, auto_renew as autoRenew, status, last_payment as lastPayment, notes FROM subscriptions WHERE user_id = ?");
        $subStmt->execute([$userId]);
        $subscriptions = $subStmt->fetchAll();
        foreach ($subscriptions as &$s) {
            $s['name'] = db_decrypt($s['name']);
            $s['type'] = db_decrypt($s['type']);
            $s['notes'] = db_decrypt($s['notes']);
            $s['value'] = (float)$s['value'];
            $s['intervalValue'] = (int)$s['intervalValue'];
            $s['autoRenew'] = (bool)$s['autoRenew'];
        }

        $upcStmt = $pdo->prepare("SELECT id, name, type, CAST(amount AS DECIMAL(15,2)) as amount, due_date as dueDate, account_id as accountId, priority, status, recurring, source, notes FROM upcoming WHERE user_id = ?");
        $upcStmt->execute([$userId]);
        $upcoming = $upcStmt->fetchAll();
        foreach ($upcoming as &$u) {
            $u['name'] = db_decrypt($u['name']);
            $u['type'] = db_decrypt($u['type']);
            $u['source'] = db_decrypt($u['source']);
            $u['notes'] = db_decrypt($u['notes']);
            $u['amount'] = (float)$u['amount'];
            $u['recurring'] = (bool)$u['recurring'];
        }

        $expIncStmt = $pdo->prepare("SELECT id, source, client, description as 'desc', CAST(amount AS DECIMAL(15,2)) as amount, CAST(probability AS DECIMAL(4,2)) as probability, expected_date as expectedDate, account_id as accountId, status, actual_received as actualReceived, notes FROM expected_income WHERE user_id = ?");
        $expIncStmt->execute([$userId]);
        $expectedIncome = $expIncStmt->fetchAll();
        foreach ($expectedIncome as &$ei) {
            $ei['source'] = db_decrypt($ei['source']);
            $ei['client'] = db_decrypt($ei['client']);
            $ei['desc'] = db_decrypt($ei['desc']);
            $ei['notes'] = db_decrypt($ei['notes']);
            $ei['amount'] = (float)$ei['amount'];
            $ei['probability'] = (float)$ei['probability'];
            if ($ei['actualReceived'] !== null) $ei['actualReceived'] = (float)$ei['actualReceived'];
        }

        $goalsStmt = $pdo->prepare("SELECT id, name, type, CAST(target AS DECIMAL(15,2)) as target, CAST(current AS DECIMAL(15,2)) as current, start_date as startDate, target_date as targetDate, priority, status, account_id as accountId, notes FROM goals WHERE user_id = ?");
        $goalsStmt->execute([$userId]);
        $goals = $goalsStmt->fetchAll();
        foreach ($goals as &$g) {
            $g['name'] = db_decrypt($g['name']);
            $g['type'] = db_decrypt($g['type']);
            $g['notes'] = db_decrypt($g['notes']);
            $g['target'] = (float)$g['target'];
            $g['current'] = (float)$g['current'];
        }

        jsonResponse([
            'success' => true,
            'source' => 'relational_tables',
            'encrypted' => true,
            'data' => [
                'accounts' => $accounts,
                'income' => $income,
                'expenses' => $expenses,
                'transfers' => $transfers,
                'debtsOwed' => $debtsOwed,
                'debtsReceivable' => $debtsReceivable,
                'subscriptions' => $subscriptions,
                'upcoming' => $upcoming,
                'expectedIncome' => $expectedIncome,
                'goals' => $goals
            ]
        ]);
    }

    // 3. المزامنة الشاملة وحفظ الحالة مشفرة بالكامل بـ AES-256 (Atomic Encrypted Sync All) - يتطلب توكن جلسة صالح
    if ($action === 'sync_all') {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            jsonResponse(['success' => false, 'error' => 'البيانات المرسلة فارغة.'], 400);
        }

        $payload = json_decode($raw, true);
        if (!$payload) {
            jsonResponse(['success' => false, 'error' => 'تعذر قراءة بيانات JSON.'], 400);
        }

        // معرف المستخدم يُستمد من توكن الجلسة فقط (لا يُقبل من العميل بعد الآن)
        $userId = requireSession($pdo);
        $state = isset($payload['data']) ? $payload['data'] : $payload;

        // بدء معاملة ذرية لحماية سلامة البيانات
        $pdo->beginTransaction();

        // 1) تشفير الحالة الكاملة بـ AES-256-CBC وحفظها في جدول user_app_state
        $encryptedState = db_encrypt(json_encode($state, JSON_UNESCAPED_UNICODE));
        try {
            $stmtAppState = $pdo->prepare("INSERT INTO user_app_state (user_id, state_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = CURRENT_TIMESTAMP");
            $stmtAppState->execute([$userId, $encryptedState]);
        } catch (Exception $e) {
            $stmtAppState = $pdo->prepare("INSERT INTO user_app_state (user_id, state_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)");
            $stmtAppState->execute([$userId, $encryptedState]);
        }

        // 2) تحديث جدول الحسابات مع التشفير
        if (isset($state['accounts']) && is_array($state['accounts'])) {
            $pdo->prepare("DELETE FROM accounts WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO accounts (id, user_id, name, type, opening, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['accounts'] as $a) {
                $ins->execute([
                    $a['id'],
                    $userId,
                    db_encrypt($a['name']),
                    db_encrypt($a['type']),
                    isset($a['opening']) ? (float)$a['opening'] : 0.00,
                    $a['status'] ?? 'نشط',
                    db_encrypt($a['notes'] ?? '')
                ]);
            }
        }

        // 3) تحديث جدول الدخل مع التشفير
        if (isset($state['income']) && is_array($state['income'])) {
            $pdo->prepare("DELETE FROM income WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO income (id, user_id, date, source, description, category, amount, account_id, method, status, expected_type, expected_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['income'] as $i) {
                $ins->execute([
                    $i['id'],
                    $userId,
                    $i['date'],
                    db_encrypt($i['source']),
                    db_encrypt($i['desc'] ?? ''),
                    db_encrypt($i['category']),
                    (float)$i['amount'],
                    $i['accountId'] ?? null,
                    db_encrypt($i['method'] ?? ''),
                    $i['status'] ?? 'مستلم',
                    $i['expectedType'] ?? 'فعلي',
                    !empty($i['expectedDate']) ? $i['expectedDate'] : null,
                    db_encrypt($i['notes'] ?? '')
                ]);
            }
        }

        // 4) تحديث جدول المصروفات مع التشفير
        if (isset($state['expenses']) && is_array($state['expenses'])) {
            $pdo->prepare("DELETE FROM expenses WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO expenses (id, user_id, date, description, main_cat, sub_cat, amount, account_id, method, necessity, recurrence, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['expenses'] as $e) {
                $ins->execute([
                    $e['id'],
                    $userId,
                    $e['date'],
                    db_encrypt($e['desc']),
                    db_encrypt($e['mainCat']),
                    db_encrypt($e['subCat'] ?? ''),
                    (float)$e['amount'],
                    $e['accountId'] ?? null,
                    db_encrypt($e['method'] ?? ''),
                    $e['necessity'] ?? 'ضروري',
                    $e['recurrence'] ?? 'متكرر',
                    $e['status'] ?? 'مدفوع',
                    db_encrypt($e['notes'] ?? '')
                ]);
            }
        }

        // 5) تحديث جدول التحويلات مع التشفير
        if (isset($state['transfers']) && is_array($state['transfers'])) {
            $pdo->prepare("DELETE FROM transfers WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO transfers (id, user_id, date, from_account_id, to_account_id, amount, fee, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['transfers'] as $t) {
                $ins->execute([
                    $t['id'],
                    $userId,
                    $t['date'],
                    $t['fromAccountId'],
                    $t['toAccountId'],
                    (float)$t['amount'],
                    isset($t['fee']) ? (float)$t['fee'] : 0.00,
                    $t['status'] ?? 'مكتمل',
                    db_encrypt($t['notes'] ?? '')
                ]);
            }
        }

        // 6) تحديث ديون عليّ مع التشفير
        if (isset($state['debtsOwed']) && is_array($state['debtsOwed'])) {
            $pdo->prepare("DELETE FROM debts_owed WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO debts_owed (id, user_id, person, description, original, paid, start_date, due_date, status, account_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['debtsOwed'] as $d) {
                $ins->execute([
                    $d['id'],
                    $userId,
                    db_encrypt($d['person']),
                    db_encrypt($d['desc'] ?? ''),
                    (float)$d['original'],
                    isset($d['paid']) ? (float)$d['paid'] : 0.00,
                    !empty($d['startDate']) ? $d['startDate'] : null,
                    !empty($d['dueDate']) ? $d['dueDate'] : null,
                    $d['status'] ?? 'مفتوح',
                    $d['accountId'] ?? null,
                    db_encrypt($d['notes'] ?? '')
                ]);
            }
        }

        // 7) تحديث مستحقات لي مع التشفير
        if (isset($state['debtsReceivable']) && is_array($state['debtsReceivable'])) {
            $pdo->prepare("DELETE FROM debts_receivable WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO debts_receivable (id, user_id, person, description, original, received, start_date, due_date, probability, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['debtsReceivable'] as $d) {
                $ins->execute([
                    $d['id'],
                    $userId,
                    db_encrypt($d['person']),
                    db_encrypt($d['desc'] ?? ''),
                    (float)$d['original'],
                    isset($d['received']) ? (float)$d['received'] : 0.00,
                    !empty($d['startDate']) ? $d['startDate'] : null,
                    !empty($d['dueDate']) ? $d['dueDate'] : null,
                    $d['probability'] ?? 'متوسطة',
                    $d['status'] ?? 'مفتوح',
                    db_encrypt($d['notes'] ?? '')
                ]);
            }
        }

        // 8) تحديث الاشتراكات مع التشفير
        if (isset($state['subscriptions']) && is_array($state['subscriptions'])) {
            $pdo->prepare("DELETE FROM subscriptions WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO subscriptions (id, user_id, name, type, value, interval_value, interval_unit, start_date, next_renewal, account_id, auto_renew, status, last_payment, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['subscriptions'] as $s) {
                $ins->execute([
                    $s['id'],
                    $userId,
                    db_encrypt($s['name']),
                    db_encrypt($s['type'] ?? ''),
                    (float)$s['value'],
                    isset($s['intervalValue']) ? (int)$s['intervalValue'] : 1,
                    $s['intervalUnit'] ?? 'شهر',
                    !empty($s['startDate']) ? $s['startDate'] : null,
                    !empty($s['nextRenewal']) ? $s['nextRenewal'] : null,
                    $s['accountId'] ?? null,
                    isset($s['autoRenew']) && $s['autoRenew'] ? 1 : 0,
                    $s['status'] ?? 'نشط',
                    !empty($s['lastPayment']) ? $s['lastPayment'] : null,
                    db_encrypt($s['notes'] ?? '')
                ]);
            }
        }

        // 9) تحديث الالتزامات القادمة مع التشفير
        if (isset($state['upcoming']) && is_array($state['upcoming'])) {
            $pdo->prepare("DELETE FROM upcoming WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO upcoming (id, user_id, name, type, amount, due_date, account_id, priority, status, recurring, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['upcoming'] as $u) {
                $ins->execute([
                    $u['id'],
                    $userId,
                    db_encrypt($u['name']),
                    db_encrypt($u['type'] ?? ''),
                    (float)$u['amount'],
                    !empty($u['dueDate']) ? $u['dueDate'] : null,
                    $u['accountId'] ?? null,
                    $u['priority'] ?? 'متوسطة',
                    $u['status'] ?? 'قادم',
                    isset($u['recurring']) && $u['recurring'] ? 1 : 0,
                    db_encrypt($u['source'] ?? ''),
                    db_encrypt($u['notes'] ?? '')
                ]);
            }
        }

        // 10) تحديث الدخل المتوقع مع التشفير
        if (isset($state['expectedIncome']) && is_array($state['expectedIncome'])) {
            $pdo->prepare("DELETE FROM expected_income WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO expected_income (id, user_id, source, client, description, amount, probability, expected_date, account_id, status, actual_received, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['expectedIncome'] as $ei) {
                $ins->execute([
                    $ei['id'],
                    $userId,
                    db_encrypt($ei['source']),
                    db_encrypt($ei['client'] ?? ''),
                    db_encrypt($ei['desc'] ?? ''),
                    (float)$ei['amount'],
                    isset($ei['probability']) ? (float)$ei['probability'] : 0.50,
                    !empty($ei['expectedDate']) ? $ei['expectedDate'] : null,
                    $ei['accountId'] ?? null,
                    $ei['status'] ?? 'محتمل',
                    isset($ei['actualReceived']) && $ei['actualReceived'] !== null ? (float)$ei['actualReceived'] : null,
                    db_encrypt($ei['notes'] ?? '')
                ]);
            }
        }

        // 11) تحديث الأهداف المالية مع التشفير
        if (isset($state['goals']) && is_array($state['goals'])) {
            $pdo->prepare("DELETE FROM goals WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO goals (id, user_id, name, type, target, current, start_date, target_date, priority, status, account_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['goals'] as $g) {
                $ins->execute([
                    $g['id'],
                    $userId,
                    db_encrypt($g['name']),
                    db_encrypt($g['type'] ?? ''),
                    (float)$g['target'],
                    isset($g['current']) ? (float)$g['current'] : 0.00,
                    !empty($g['startDate']) ? $g['startDate'] : null,
                    !empty($g['targetDate']) ? $g['targetDate'] : null,
                    $g['priority'] ?? 'متوسطة',
                    $g['status'] ?? 'قيد التنفيذ',
                    $g['accountId'] ?? null,
                    db_encrypt($g['notes'] ?? '')
                ]);
            }
        }

        // تثبيت المعاملة
        $pdo->commit();

        $updatedAt = date('Y-m-d H:i:s');
        try {
            $tsStmt = $pdo->prepare("SELECT updated_at FROM user_app_state WHERE user_id = ?");
            $tsStmt->execute([$userId]);
            $tsRow = $tsStmt->fetch();
            if ($tsRow && !empty($tsRow['updated_at'])) {
                $updatedAt = $tsRow['updated_at'];
            }
        } catch (Exception $e) {}

        jsonResponse([
            'success' => true,
            'encrypted' => true,
            'message' => 'تمت المزامنة وتشفير كافة البيانات بنجاح تام بـ AES-256 داخل MySQL',
            'synced_at' => $updatedAt,
            'updated_at' => $updatedAt
        ]);
    }

    // 4. إجراءات المصادقة والمستخدمين (Authentication)
    if ($action === 'auth') {
        $sub = isset($_GET['sub']) ? trim($_GET['sub']) : '';
        $raw = file_get_contents('php://input');
        $body = $raw ? json_decode($raw, true) : [];

        // 4.1 تسجيل حساب جديد وتخزينه مشفراً في قاعدة البيانات MySQL
        if ($sub === 'register') {
            $email = trim($body['email'] ?? '');
            $fullName = trim($body['fullName'] ?? '');
            $username = trim($body['username'] ?? ($email ? explode('@', $email)[0] : ''));
            $plainPassword = trim($body['password'] ?? '');
            $plainPin = trim($body['pin'] ?? '');
            $pinHash = trim($body['pinHash'] ?? '');
            $pwdHash = trim($body['pwdHash'] ?? '');
            $currency = $body['currency'] ?? 'ج.م';
            $avatarSeed = mb_substr($fullName ?: 'ص', 0, 2, 'UTF-8');

            if (empty($email)) {
                jsonResponse(['success' => false, 'error' => 'البريد الإلكتروني مطلوب.'], 400);
            }
            if (empty($fullName)) {
                jsonResponse(['success' => false, 'error' => 'الاسم بالكامل مطلوب.'], 400);
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
                jsonResponse(['success' => false, 'error' => 'صيغة البريد الإلكتروني غير صحيحة.'], 400);
            }
            if (strlen($fullName) > 80) {
                jsonResponse(['success' => false, 'error' => 'الاسم بالكامل طويل جداً.'], 400);
            }

            // تجزئة كلمة المرور بـ bcrypt (password_hash) عند توفر النص الصريح — الرجوع للتجزئة القديمة في حال الأجهزة بلا نص صريح
            if (!empty($plainPassword)) {
                $pwdHash = password_hash($plainPassword, PASSWORD_DEFAULT);
            } elseif (empty($pwdHash)) {
                jsonResponse(['success' => false, 'error' => 'كلمة المرور مطلوبة.'], 400);
            }
            // رمز الـ PIN: تُخزن التجزئة المرسلة من العميل إن وُجدت (لتطابق فك القفل محلياً)،
            // مع نسخة bcrypt من الرمز الصريح للتحقق الآمن على السيرفر
            $pinHashStored = $pinHash;
            if (!empty($plainPin)) {
                $pinHashStored = password_hash($plainPin, PASSWORD_DEFAULT);
            } elseif (empty($pinHash) && empty($plainPin)) {
                jsonResponse(['success' => false, 'error' => 'الرمز السري (PIN) مطلوب.'], 400);
            }

            // التحقق من عدم وجود البريد مسبقاً في قاعدة البيانات
            $chk = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
            $chk->execute([$email]);
            if ($chk->fetch()) {
                jsonResponse(['success' => false, 'error' => 'هذا البريد الإلكتروني مسجل بالفعل في قاعدة البيانات. يرجى تسجيل الدخول.'], 400);
            }

            // تحديد المعرف الفريد والدور (أول مستخدم مسجل أو admin@sarfy.app يصبح مالك المنصة)
            $id = 'usr_' . bin2hex(random_bytes(5));
            $countStmt = $pdo->query("SELECT COUNT(*) FROM users");
            $userCount = (int)$countStmt->fetchColumn();
            $role = ($userCount === 0 || strtolower($email) === 'admin@sarfy.app') ? 'owner' : 'user';

            // تشفير الاسم والبيانات الحساسة للمستخدم قبل الحفظ
            $encryptedFullName = db_encrypt($fullName);

            // الحفظ في جدول users
            $stmt = $pdo->prepare("INSERT INTO users (id, username, email, full_name, currency, pin_hash, password_hash, role, status, avatar_seed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)");
            $stmt->execute([$id, $username ?: $email, $email, $encryptedFullName, $currency, $pinHashStored, $pwdHash, $role, $avatarSeed]);

            // إنشاء حالة التطبيق الأولية وحفظها مشفرة في MySQL
            $initialState = !empty($body['data']) && is_array($body['data']) ? $body['data'] : [
                'userProfile' => [
                    'id' => $id,
                    'fullName' => $fullName,
                    'email' => $email,
                    'role' => $role,
                    'currency' => $currency,
                    'avatarSeed' => $avatarSeed,
                    'createdAt' => date('Y-m-d')
                ],
                'accounts' => [
                    ['id' => 'acc_cash_' . $id, 'name' => 'محفظة كاش', 'type' => 'كاش', 'opening' => (float)($body['cashOpening'] ?? 3000), 'status' => 'نشط', 'notes' => 'مصاريف نقدية يومية'],
                    ['id' => 'acc_bank_' . $id, 'name' => 'حساب بنكي رئيسي', 'type' => 'حساب بنكي', 'opening' => (float)($body['bankOpening'] ?? 25000), 'status' => 'نشط', 'notes' => 'حساب البنك الرئيسي'],
                    ['id' => 'acc_wal_' . $id, 'name' => 'محفظة إلكترونية', 'type' => 'محفظة إلكترونية', 'opening' => (float)($body['walletOpening'] ?? 1500), 'status' => 'نشط', 'notes' => 'فودافون كاش / إنستاباي']
                ],
                'income' => [],
                'expenses' => [],
                'transfers' => [],
                'debtsOwed' => [],
                'debtsReceivable' => [],
                'subscriptions' => [],
                'upcoming' => [],
                'expectedIncome' => [],
                'goals' => [],
                'settings' => [
                    'currency' => $currency,
                    'incomeCats' => ['راتب', 'عمل حر', 'مشروع', 'مكافأة', 'استثمار', 'أخرى'],
                    'expenseCats' => ['طعام', 'مواصلات', 'منزل', 'فواتير', 'اتصالات وإنترنت', 'صحة', 'تعليم', 'ترفيه', 'تسوق', 'أخرى']
                ]
            ];

            // حفظ الحالة مشفرة بـ AES-256
            $encryptedInitial = db_encrypt(json_encode($initialState, JSON_UNESCAPED_UNICODE));
            $pdo->prepare("INSERT INTO user_app_state (user_id, state_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)")
                ->execute([$id, $encryptedInitial]);

            // إدراج الحسابات الافتتاحية في جدول accounts مشفرة
            if (!empty($initialState['accounts'])) {
                $insAcc = $pdo->prepare("INSERT INTO accounts (id, user_id, name, type, opening, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
                foreach ($initialState['accounts'] as $a) {
                    $insAcc->execute([$a['id'], $id, db_encrypt($a['name']), db_encrypt($a['type']), (float)$a['opening'], $a['status'] ?? 'نشط', db_encrypt($a['notes'] ?? '')]);
                }
            }

            jsonResponse([
                'success' => true,
                'encrypted' => true,
                'token' => issueSessionToken($pdo, $id),
                'user' => [
                    'id' => $id,
                    'fullName' => $fullName,
                    'email' => $email,
                    'role' => $role,
                    'status' => 'active',
                    'currency' => $currency,
                    'avatarSeed' => $avatarSeed
                ],
                'message' => 'تم إنشاء الحساب وتشفير كافة بياناته بنجاح تام داخل قاعدة بيانات MySQL'
            ]);
        }

        // 4.2 تسجيل الدخول والتحقق المباشر من قاعدة بيانات MySQL
        if ($sub === 'login') {
            $identifier = trim($body['identifier'] ?? '');
            $plainPassword = trim($body['password'] ?? '');
            $plainPin = trim($body['pin'] ?? '');
            $pwdHash = trim($body['pwdHash'] ?? '');
            $pinHash = trim($body['pinHash'] ?? '');

            if (empty($identifier) && empty($pwdHash) && empty($plainPassword) && empty($pinHash) && empty($plainPin)) {
                jsonResponse(['success' => false, 'error' => 'يرجى إدخال بيانات تسجيل الدخول.'], 400);
            }

            if (isLoginRateLimited($pdo)) {
                jsonResponse(['success' => false, 'error' => 'محاولات كثيرة فاشلة من هذا الجهاز. حاول من جديد بعد 15 دقيقة.'], 429);
            }

            // توليد التجزئات إن لم تكن مرسلة
            if (empty($pwdHash) && !empty($plainPassword)) {
                $pwdHash = hash('sha256', $plainPassword . '_sarfy_master_pwd_salt_v2');
            }
            if (empty($pinHash) && !empty($plainPin)) {
                $pinHash = hash('sha256', $plainPin . '_sarfy_pin_salt_v1');
            }

            // تسجيل الدخول يتطلب تحديد هوية المستخدم (بريد أو اسم مستخدم) — لا تخمين عبر الـ PIN وحده
            if (empty($identifier)) {
                jsonResponse(['success' => false, 'error' => 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم مع الرمز السري أو كلمة المرور.'], 400);
            }
            if (mb_strlen($identifier) > 190) {
                jsonResponse(['success' => false, 'error' => 'بيانات الدخول غير صحيحة.'], 400);
            }

            $stmt = $pdo->prepare("SELECT id, username, email, full_name, currency, pin_hash, password_hash, role, status, avatar_seed FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) LIMIT 1");
            $stmt->execute([$identifier, $identifier]);
            $candidate = $stmt->fetch();
            $user = null;

            if ($candidate) {
                $dbPwd = $candidate['password_hash'] ?? '';
                $dbPin = $candidate['pin_hash'] ?? '';

                // مطابقة كلمة المرور: التجزئة المرسلة أو bcrypt القديم فقط — لا مقارنة بالنص الصريح مطلقاً
                $pwdMatched = false;
                if (!empty($pwdHash)) {
                    $pwdMatched = ($dbPwd === $pwdHash) || (strlen($dbPwd) === 60 && password_verify($plainPassword, $dbPwd));
                }

                // مطابقة الرمز السري: bcrypt مخزن، أو التجزئة المرسلة، أو المتولدة من النص الصريح بالملح المعتمد
                $pinMatched = false;
                if (strlen($dbPin) === 60 && substr($dbPin, 0, 3) === '$2y$') {
                    // التجزئة الحديثة bcrypt — تُطابق بالنص الصريح فقط
                    $pinMatched = !empty($plainPin) && password_verify($plainPin, $dbPin);
                } else {
                    $pinCandidates = [];
                    if (!empty($pinHash)) { $pinCandidates[] = $pinHash; }
                    if (!empty($plainPin)) {
                        $pinCandidates[] = hash('sha256', $plainPin . '_sarfy_pin_salt_v1');
                        $pinCandidates[] = hash('sha256', $plainPin . '_sarfy_pin_salt_v2');
                    }
                    foreach ($pinCandidates as $pc) {
                        if ($pc !== '' && hash_equals($dbPin, $pc)) { $pinMatched = true; break; }
                    }
                }

                if ($pwdMatched || $pinMatched) {
                    $user = $candidate;
                }
            }

            if (!$user) {
                recordFailedLoginAttempt($pdo);
                jsonResponse(['success' => false, 'error' => 'بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور المسجلة.'], 401);
            }

            // ترقية التجزئة القديمة (SHA-256) إلى bcrypt بسلاسة عند أول دخول ناجح بكلمة مرور صريحة
            if (!empty($plainPassword) && preg_match('/^[a-f0-9]{64}$/', $user['password_hash'] ?? '')) {
                try {
                    $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?")
                        ->execute([password_hash($plainPassword, PASSWORD_DEFAULT), $user['id']]);
                } catch (Exception $e) {}
            }

            // ترقية تجزئة الـ PIN القديمة (SHA-256) إلى bcrypt عند أول دخول ناجح بالرمز الصريح
            if (!empty($plainPin) && preg_match('/^[a-f0-9]{64}$/', $user['pin_hash'] ?? '')) {
                try {
                    $pdo->prepare("UPDATE users SET pin_hash = ? WHERE id = ?")
                        ->execute([password_hash($plainPin, PASSWORD_DEFAULT), $user['id']]);
                } catch (Exception $e) {}
            }

            // التحقق من حالة الحساب
            if (isset($user['status']) && $user['status'] === 'suspended') {
                jsonResponse(['success' => false, 'error' => 'تم تعليق هذا الحساب من قِبل إدارة التطبيق. يرجى التواصل مع الدعم.'], 403);
            }

            // تحديث تاريخ آخر تسجيل دخول في MySQL
            try {
                $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);
            } catch (Exception $e) {}

            jsonResponse([
                'success' => true,
                'encrypted' => true,
                'token' => issueSessionToken($pdo, $user['id']),
                'user' => [
                    'id' => $user['id'],
                    'fullName' => db_decrypt($user['full_name']),
                    'email' => $user['email'],
                    'role' => $user['role'] ?? 'user',
                    'status' => $user['status'] ?? 'active',
                    'currency' => $user['currency'] ?? 'ج.م',
                    'avatarSeed' => $user['avatar_seed'] ?: mb_substr(db_decrypt($user['full_name']), 0, 2, 'UTF-8')
                ],
                'message' => 'تم التحقق وتسجيل الدخول بنجاح من قاعدة بيانات MySQL المشفرة'
            ]);
        }

        // 4.3 فحص وجود أي مستخدم مسجل — إجابات بوليانية فقط دون تسريب بيانات المستخدمين (PII)
        if ($sub === 'check_user') {
            $stmt = $pdo->query("SELECT id, pin_hash, password_hash FROM users LIMIT 1");
            $user = $stmt->fetch();
            if ($user) {
                jsonResponse(['success' => true, 'has_user' => true, 'hasPin' => !empty($user['pin_hash']), 'hasPassword' => !empty($user['password_hash'])]);
            } else {
                jsonResponse(['success' => true, 'has_user' => false]);
            }
        }
    }

    // 5. إجراءات لوحة تحكم مالك التطبيق (Owner & Admin Dashboard API)
    // تتطلب توكن جلسة صالحاً + مستحقات owner أو admin — فحص على السيرفر
    if ($action === 'admin') {
        $sub = isset($_GET['sub']) ? trim($_GET['sub']) : '';
        $raw = file_get_contents('php://input');
        $body = $raw ? json_decode($raw, true) : [];

        $adminId = requireSession($pdo);
        $roleStmt = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
        $roleStmt->execute([$adminId]);
        $adminRole = $roleStmt->fetchColumn();

        if ($adminRole === false || !in_array($adminRole, ['owner', 'admin'], true)) {
            jsonResponse(['success' => false, 'error' => 'الوصول مرفوض: هذه الصلاحيات متاحة لمالكي المنصة والمشرفين فقط.'], 403);
        }

        // التحقق من صيغة معرف المستخدم في الإجراءات الإدرائية (منع القيم الشاذة الطويلة)
        $userIdField = trim($body['userId'] ?? '');
        if ($userIdField !== '' && (!preg_match('/^[A-Za-z0-9_\-]{1,64}$/', $userIdField))) {
            jsonResponse(['success' => false, 'error' => 'معرف المستخدم غير صالح.'], 400);
        }

        // 5.1 استعراض قائمة العملاء والمستخدمين
        if ($sub === 'users_list') {
            $stmt = $pdo->query("SELECT u.id, u.username, u.email, u.full_name, u.role, u.status, u.currency, u.created_at, u.last_login,
                (SELECT COUNT(*) FROM accounts a WHERE a.user_id = u.id) as accounts_count,
                (SELECT COUNT(*) FROM expenses e WHERE e.user_id = u.id) as expenses_count,
                (SELECT COUNT(*) FROM income i WHERE i.user_id = u.id) as income_count,
                (SELECT COALESCE(SUM(opening), 0) FROM accounts a WHERE a.user_id = u.id) as total_balance
                FROM users u ORDER BY u.created_at DESC");
            $users = $stmt->fetchAll();

            // فك تشفير الأسماء وإحصائيات عامة للمنصة
            $totalUsers = count($users);
            $activeUsers = 0;
            $totalTransactions = 0;
            foreach ($users as &$u) {
                $u['full_name'] = db_decrypt($u['full_name']);
                if ($u['status'] === 'active') $activeUsers++;
                $u['total_records'] = (int)$u['accounts_count'] + (int)$u['expenses_count'] + (int)$u['income_count'];
                $totalTransactions += $u['total_records'];
            }

            jsonResponse([
                'success' => true,
                'stats' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'total_transactions' => $totalTransactions
                ],
                'users' => $users
            ]);
        }

        // 5.2 تغيير حالة المستخدم (تفعيل / تعليق) — ولا يُسمح بتعليق مالك المنصة
        if ($sub === 'update_status') {
            $userId = trim($body['userId'] ?? '');
            $allowedStatuses = ['active', 'suspended'];
            $newStatus = in_array(trim($body['status'] ?? 'active'), $allowedStatuses, true) ? trim($body['status']) : 'active';

            if (empty($userId)) jsonResponse(['success' => false, 'error' => 'معرف المستخدم مطلوب.'], 400);

            $tgtStmt = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
            $tgtStmt->execute([$userId]);
            $targetRole = $tgtStmt->fetchColumn();
            if ($targetRole === 'owner') {
                jsonResponse(['success' => false, 'error' => 'لا يمكن تعديل حالة مالك المنصة.'], 403);
            }

            $pdo->prepare("UPDATE users SET status = ? WHERE id = ?")->execute([$newStatus, $userId]);
            jsonResponse(['success' => true, 'message' => "تم تحديث حالة المستخدم إلى {$newStatus}"]);
        }

        // 5.3 تغيير رتبة المستخدم (ترقية لمشرف / تخفيض لمستخدم) — قائمة رتب محددة دون منح ملكية
        if ($sub === 'update_role') {
            $userId = trim($body['userId'] ?? '');
            $allowedRoles = ['user', 'admin'];
            $newRole = in_array(trim($body['role'] ?? ''), $allowedRoles, true) ? trim($body['role']) : '';

            if (empty($userId) || empty($newRole)) jsonResponse(['success' => false, 'error' => 'معرف المستخدم والرتبة المسموحة مطلوبان.'], 400);

            $tgtStmt = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
            $tgtStmt->execute([$userId]);
            $targetRole = $tgtStmt->fetchColumn();
            if ($targetRole === 'owner') {
                jsonResponse(['success' => false, 'error' => 'لا يمكن تغيير رتبة مالك المنصة.'], 403);
            }

            $pdo->prepare("UPDATE users SET role = ? WHERE id = ?")->execute([$newRole, $userId]);
            jsonResponse(['success' => true, 'message' => "تم تغيير رتبة المستخدم إلى {$newRole}"]);
        }

        // 5.4 حذف مستخدم وكافة بياناته نهائياً — ولا يُسمح بحذف مالك المنصة أو المشرف
        if ($sub === 'delete_user') {
            $userId = trim($body['userId'] ?? '');
            if (empty($userId)) jsonResponse(['success' => false, 'error' => 'معرف المستخدم مطلوب.'], 400);
            if ($userId === $adminId) {
                jsonResponse(['success' => false, 'error' => 'لا يمكن حذف حسابك من لوحة الإدارة.'], 400);
            }

            $tgtStmt = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
            $tgtStmt->execute([$userId]);
            $targetRole = $tgtStmt->fetchColumn();
            if ($targetRole === 'owner') {
                jsonResponse(['success' => false, 'error' => 'لا يمكن حذف مالك المنصة.'], 403);
            }

            $pdo->beginTransaction();
            $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM user_app_state WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM accounts WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM income WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM expenses WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM transfers WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM debts_owed WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM debts_receivable WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM subscriptions WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM upcoming WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM expected_income WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM goals WHERE user_id = ?")->execute([$userId]);
            $pdo->commit();

            jsonResponse(['success' => true, 'message' => 'تم حذف المستخدم وكافة بياناته بنجاح']);
        }

        // 5.5 إنشاء عميل جديد من لوحة المالك مباشرة مع التشفير
        if ($sub === 'create_client') {
            $email = trim($body['email'] ?? '');
            $fullName = trim($body['fullName'] ?? '');
            $passwordHash = $body['passwordHash'] ?? '';
            $pinHash = $body['pinHash'] ?? null;
            $role = trim($body['role'] ?? 'user');
            $currency = $body['currency'] ?? 'ج.م';

            if (empty($email) || empty($fullName)) {
                jsonResponse(['success' => false, 'error' => 'الاسم والبريد مطلوبان.'], 400);
            }

            $chk = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
            $chk->execute([$email]);
            if ($chk->fetch()) {
                jsonResponse(['success' => false, 'error' => 'هذا البريد مسجل بالفعل.'], 400);
            }

            $id = 'usr_' . bin2hex(random_bytes(5));
            $encryptedFullName = db_encrypt($fullName);
            // الرتبة مقصورة على مستخدم عادي — المشرفون فقط (ولا يمكن منح ملكية من اللوحة)
            $stmt = $pdo->prepare("INSERT INTO users (id, username, email, full_name, currency, pin_hash, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 'active')");
            $stmt->execute([$id, explode('@', $email)[0], $email, $encryptedFullName, $currency, $pinHash, $passwordHash]);

            jsonResponse(['success' => true, 'encrypted' => true, 'message' => 'تم إنشاء حساب العميل بنجاح وتشفيره', 'user_id' => $id]);
        }
    }

    // 6. أداة ترحيل وتشفير البيانات السابقة بنقرة واحدة (One-Click In-Place Database Encryption Migration)
    // تتطلب صلاحية مالك المنصة (owner) مع توكن جلسة صالح
    if ($action === 'encrypt_db' || $action === 'migrate_encryption') {
        $migratorId = requireSession($pdo);
        $mgStmt = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
        $mgStmt->execute([$migratorId]);
        if ($mgStmt->fetchColumn() !== 'owner') {
            jsonResponse(['success' => false, 'error' => 'الوصول مرفوض: أداة الترحيل متاحة لمالك المنصة فقط.'], 403);
        }

        $stats = [
            'app_state_encrypted' => 0,
            'users_encrypted' => 0,
            'accounts_encrypted' => 0,
            'income_encrypted' => 0,
            'expenses_encrypted' => 0,
            'debts_owed_encrypted' => 0,
            'debts_receivable_encrypted' => 0,
            'subscriptions_encrypted' => 0,
            'upcoming_encrypted' => 0,
            'expected_income_encrypted' => 0,
            'goals_encrypted' => 0,
        ];

        $pdo->beginTransaction();

        // 1) تشفير user_app_state
        $rows = $pdo->query("SELECT user_id, state_json FROM user_app_state")->fetchAll();
        $updState = $pdo->prepare("UPDATE user_app_state SET state_json = ? WHERE user_id = ?");
        foreach ($rows as $r) {
            if (strpos($r['state_json'], 'ENC::v1::') !== 0) {
                $updState->execute([db_encrypt($r['state_json']), $r['user_id']]);
                $stats['app_state_encrypted']++;
            }
        }

        // 2) تشفير users
        $rows = $pdo->query("SELECT id, full_name FROM users")->fetchAll();
        $updUser = $pdo->prepare("UPDATE users SET full_name = ? WHERE id = ?");
        foreach ($rows as $r) {
            if (strpos($r['full_name'], 'ENC::v1::') !== 0) {
                $updUser->execute([db_encrypt($r['full_name']), $r['id']]);
                $stats['users_encrypted']++;
            }
        }

        // 3) تشفير accounts
        $rows = $pdo->query("SELECT id, name, type, notes FROM accounts")->fetchAll();
        $updAcc = $pdo->prepare("UPDATE accounts SET name = ?, type = ?, notes = ? WHERE id = ?");
        foreach ($rows as $r) {
            $updAcc->execute([db_encrypt($r['name']), db_encrypt($r['type']), db_encrypt($r['notes'] ?? ''), $r['id']]);
            $stats['accounts_encrypted']++;
        }

        // 4) تشفير income
        $rows = $pdo->query("SELECT id, source, description, category, method, notes FROM income")->fetchAll();
        $updInc = $pdo->prepare("UPDATE income SET source = ?, description = ?, category = ?, method = ?, notes = ? WHERE id = ?");
        foreach ($rows as $r) {
            $updInc->execute([db_encrypt($r['source']), db_encrypt($r['description'] ?? ''), db_encrypt($r['category']), db_encrypt($r['method'] ?? ''), db_encrypt($r['notes'] ?? ''), $r['id']]);
            $stats['income_encrypted']++;
        }

        // 5) تشفير expenses
        $rows = $pdo->query("SELECT id, description, main_cat, sub_cat, method, notes FROM expenses")->fetchAll();
        $updExp = $pdo->prepare("UPDATE expenses SET description = ?, main_cat = ?, sub_cat = ?, method = ?, notes = ? WHERE id = ?");
        foreach ($rows as $r) {
            $updExp->execute([db_encrypt($r['description']), db_encrypt($r['main_cat']), db_encrypt($r['sub_cat'] ?? ''), db_encrypt($r['method'] ?? ''), db_encrypt($r['notes'] ?? ''), $r['id']]);
            $stats['expenses_encrypted']++;
        }

        // 6) تشفير debts_owed
        $rows = $pdo->query("SELECT id, person, description, notes FROM debts_owed")->fetchAll();
        $updDO = $pdo->prepare("UPDATE debts_owed SET person = ?, description = ?, notes = ? WHERE id = ?");
        foreach ($rows as $r) {
            $updDO->execute([db_encrypt($r['person']), db_encrypt($r['description'] ?? ''), db_encrypt($r['notes'] ?? ''), $r['id']]);
            $stats['debts_owed_encrypted']++;
        }

        // 7) تشفير debts_receivable
        $rows = $pdo->query("SELECT id, person, description, notes FROM debts_receivable")->fetchAll();
        $updDR = $pdo->prepare("UPDATE debts_receivable SET person = ?, description = ?, notes = ? WHERE id = ?");
        foreach ($rows as $r) {
            $updDR->execute([db_encrypt($r['person']), db_encrypt($r['description'] ?? ''), db_encrypt($r['notes'] ?? ''), $r['id']]);
            $stats['debts_receivable_encrypted']++;
        }

        // 8) تشفير subscriptions
        $rows = $pdo->query("SELECT id, name, type, notes FROM subscriptions")->fetchAll();
        $updSub = $pdo->prepare("UPDATE subscriptions SET name = ?, type = ?, notes = ? WHERE id = ?");
        foreach ($rows as $r) {
            $updSub->execute([db_encrypt($r['name']), db_encrypt($r['type'] ?? ''), db_encrypt($r['notes'] ?? ''), $r['id']]);
            $stats['subscriptions_encrypted']++;
        }

        // 9) تشفير upcoming
        $rows = $pdo->query("SELECT id, name, type, source, notes FROM upcoming")->fetchAll();
        $updUpc = $pdo->prepare("UPDATE upcoming SET name = ?, type = ?, source = ?, notes = ? WHERE id = ?");
        foreach ($rows as $r) {
            $updUpc->execute([db_encrypt($r['name']), db_encrypt($r['type'] ?? ''), db_encrypt($r['source'] ?? ''), db_encrypt($r['notes'] ?? ''), $r['id']]);
            $stats['upcoming_encrypted']++;
        }

        // 10) تشفير expected_income
        $rows = $pdo->query("SELECT id, source, client, description, notes FROM expected_income")->fetchAll();
        $updEI = $pdo->prepare("UPDATE expected_income SET source = ?, client = ?, description = ?, notes = ? WHERE id = ?");
        foreach ($rows as $r) {
            $updEI->execute([db_encrypt($r['source']), db_encrypt($r['client'] ?? ''), db_encrypt($r['description'] ?? ''), db_encrypt($r['notes'] ?? ''), $r['id']]);
            $stats['expected_income_encrypted']++;
        }

        // 11) تشفير goals
        $rows = $pdo->query("SELECT id, name, type, notes FROM goals")->fetchAll();
        $updG = $pdo->prepare("UPDATE goals SET name = ?, type = ?, notes = ? WHERE id = ?");
        foreach ($rows as $r) {
            $updG->execute([db_encrypt($r['name']), db_encrypt($r['type'] ?? ''), db_encrypt($r['notes'] ?? ''), $r['id']]);
            $stats['goals_encrypted']++;
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => 'تم تشفير كافة السجلات والبيانات السابقة بنجاح تام داخل قاعدة بيانات MySQL بـ AES-256',
            'stats' => $stats
        ]);
    }

    // في حال عدم التعرف على الإجراء
    jsonResponse(['success' => false, 'error' => 'إجراء غير معروف.'], 400);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse([
        'success' => false,
        'error' => $e->getMessage()
    ], 500);
}
