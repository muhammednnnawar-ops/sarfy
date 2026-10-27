<?php
/**
 * ============================================================
 * Sarfy (صرفي) - REST API Backend
 * معالج الطلبات والمزامنة مع قاعدة بيانات MySQL (HostArmada Speed Reaper)
 * ============================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

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
                'database' => DB_NAME,
                'tables' => $tables,
                'tables_count' => count($tables),
                'message' => 'متصل بنجاح بقاعدة البيانات MySQL على السيرفر'
            ]);
        } catch (Exception $e) {
            jsonResponse([
                'success' => false,
                'connected' => false,
                'error' => 'تعذر الاتصال بـ MySQL: ' . $e->getMessage(),
                'help' => 'يرجى مراجعة اسم قاعدة البيانات واسم المستخدم وكلمة المرور في config.php والتأكد من إضافتها عبر cPanel.'
            ]);
        }
    }

    // لجميع الإجراءات التالية نحتاج اتصالاً صحيحاً بـ MySQL
    $pdo = getDB();

    // 2. جلب البيانات من السيرفر (Get All Data / Multi-Device Poll)
    if ($action === 'get_data' || $action === 'poll_data') {
        $userId = isset($_GET['user_id']) ? trim($_GET['user_id']) : 'user_1';
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

            $fullData = json_decode($stateRow['state_json'], true);
            jsonResponse([
                'success' => true,
                'has_changes' => true,
                'source' => 'app_state',
                'updated_at' => $serverUpdatedAt,
                'data' => $fullData
            ]);
        }

        // إذا لم توجد حالة كاملة، إعادة بناء البيانات من الجداول العلائقية
        $accountsStmt = $pdo->prepare("SELECT id, name, type, CAST(opening AS DECIMAL(15,2)) as opening, status, notes FROM accounts WHERE user_id = ?");
        $accountsStmt->execute([$userId]);
        $accounts = $accountsStmt->fetchAll();
        foreach ($accounts as &$a) { $a['opening'] = (float)$a['opening']; }

        $incomeStmt = $pdo->prepare("SELECT id, date, source, description as 'desc', category, CAST(amount AS DECIMAL(15,2)) as amount, account_id as accountId, method, status, expected_type as expectedType, expected_date as expectedDate, notes FROM income WHERE user_id = ?");
        $incomeStmt->execute([$userId]);
        $income = $incomeStmt->fetchAll();
        foreach ($income as &$i) { $i['amount'] = (float)$i['amount']; }

        $expensesStmt = $pdo->prepare("SELECT id, date, description as 'desc', main_cat as mainCat, sub_cat as subCat, CAST(amount AS DECIMAL(15,2)) as amount, account_id as accountId, method, necessity, recurrence, status, notes FROM expenses WHERE user_id = ?");
        $expensesStmt->execute([$userId]);
        $expenses = $expensesStmt->fetchAll();
        foreach ($expenses as &$e) { $e['amount'] = (float)$e['amount']; }

        $transfersStmt = $pdo->prepare("SELECT id, date, from_account_id as fromAccountId, to_account_id as toAccountId, CAST(amount AS DECIMAL(15,2)) as amount, CAST(fee AS DECIMAL(15,2)) as fee, status, notes FROM transfers WHERE user_id = ?");
        $transfersStmt->execute([$userId]);
        $transfers = $transfersStmt->fetchAll();
        foreach ($transfers as &$t) { $t['amount'] = (float)$t['amount']; $t['fee'] = (float)$t['fee']; }

        $debtsOwedStmt = $pdo->prepare("SELECT id, person, description as 'desc', CAST(original AS DECIMAL(15,2)) as original, CAST(paid AS DECIMAL(15,2)) as paid, start_date as startDate, due_date as dueDate, status, account_id as accountId, notes FROM debts_owed WHERE user_id = ?");
        $debtsOwedStmt->execute([$userId]);
        $debtsOwed = $debtsOwedStmt->fetchAll();
        foreach ($debtsOwed as &$d) { $d['original'] = (float)$d['original']; $d['paid'] = (float)$d['paid']; }

        $debtsRecStmt = $pdo->prepare("SELECT id, person, description as 'desc', CAST(original AS DECIMAL(15,2)) as original, CAST(received AS DECIMAL(15,2)) as received, start_date as startDate, due_date as dueDate, probability, status, notes FROM debts_receivable WHERE user_id = ?");
        $debtsRecStmt->execute([$userId]);
        $debtsReceivable = $debtsRecStmt->fetchAll();
        foreach ($debtsReceivable as &$d) { $d['original'] = (float)$d['original']; $d['received'] = (float)$d['received']; }

        $subStmt = $pdo->prepare("SELECT id, name, type, CAST(value AS DECIMAL(15,2)) as value, interval_value as intervalValue, interval_unit as intervalUnit, start_date as startDate, next_renewal as nextRenewal, account_id as accountId, auto_renew as autoRenew, status, last_payment as lastPayment, notes FROM subscriptions WHERE user_id = ?");
        $subStmt->execute([$userId]);
        $subscriptions = $subStmt->fetchAll();
        foreach ($subscriptions as &$s) { $s['value'] = (float)$s['value']; $s['intervalValue'] = (int)$s['intervalValue']; $s['autoRenew'] = (bool)$s['autoRenew']; }

        $upcStmt = $pdo->prepare("SELECT id, name, type, CAST(amount AS DECIMAL(15,2)) as amount, due_date as dueDate, account_id as accountId, priority, status, recurring, source, notes FROM upcoming WHERE user_id = ?");
        $upcStmt->execute([$userId]);
        $upcoming = $upcStmt->fetchAll();
        foreach ($upcoming as &$u) { $u['amount'] = (float)$u['amount']; $u['recurring'] = (bool)$u['recurring']; }

        $expIncStmt = $pdo->prepare("SELECT id, source, client, description as 'desc', CAST(amount AS DECIMAL(15,2)) as amount, CAST(probability AS DECIMAL(4,2)) as probability, expected_date as expectedDate, account_id as accountId, status, actual_received as actualReceived, notes FROM expected_income WHERE user_id = ?");
        $expIncStmt->execute([$userId]);
        $expectedIncome = $expIncStmt->fetchAll();
        foreach ($expectedIncome as &$ei) { $ei['amount'] = (float)$ei['amount']; $ei['probability'] = (float)$ei['probability']; if ($ei['actualReceived'] !== null) $ei['actualReceived'] = (float)$ei['actualReceived']; }

        $goalsStmt = $pdo->prepare("SELECT id, name, type, CAST(target AS DECIMAL(15,2)) as target, CAST(current AS DECIMAL(15,2)) as current, start_date as startDate, target_date as targetDate, priority, status, account_id as accountId, notes FROM goals WHERE user_id = ?");
        $goalsStmt->execute([$userId]);
        $goals = $goalsStmt->fetchAll();
        foreach ($goals as &$g) { $g['target'] = (float)$g['target']; $g['current'] = (float)$g['current']; }

        jsonResponse([
            'success' => true,
            'source' => 'relational_tables',
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

    // 3. المزامنة الشاملة وحفظ الحالة (Atomic Sync All)
    if ($action === 'sync_all') {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            jsonResponse(['success' => false, 'error' => 'البيانات المرسلة فارغة.'], 400);
        }

        $payload = json_decode($raw, true);
        if (!$payload) {
            jsonResponse(['success' => false, 'error' => 'تعذر قراءة بيانات JSON.'], 400);
        }

        $userId = isset($payload['user_id']) ? trim($payload['user_id']) : 'user_1';
        $state = isset($payload['data']) ? $payload['data'] : $payload;

        // بدء معاملة ذرية لحماية سلامة البيانات ومنع فقدان أي عملية
        $pdo->beginTransaction();

        // 1) حفظ الحالة الكاملة في جدول user_app_state مع تحديث التوقيت اللحظي
        try {
            $stmtAppState = $pdo->prepare("INSERT INTO user_app_state (user_id, state_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = CURRENT_TIMESTAMP");
            $stmtAppState->execute([$userId, json_encode($state, JSON_UNESCAPED_UNICODE)]);
        } catch (Exception $e) {
            $stmtAppState = $pdo->prepare("INSERT INTO user_app_state (user_id, state_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)");
            $stmtAppState->execute([$userId, json_encode($state, JSON_UNESCAPED_UNICODE)]);
        }

        // 2) تحديث جدول الحسابات
        if (isset($state['accounts']) && is_array($state['accounts'])) {
            $pdo->prepare("DELETE FROM accounts WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO accounts (id, user_id, name, type, opening, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['accounts'] as $a) {
                $ins->execute([
                    $a['id'],
                    $userId,
                    $a['name'],
                    $a['type'],
                    isset($a['opening']) ? (float)$a['opening'] : 0.00,
                    $a['status'] ?? 'نشط',
                    $a['notes'] ?? ''
                ]);
            }
        }

        // 3) تحديث جدول الدخل
        if (isset($state['income']) && is_array($state['income'])) {
            $pdo->prepare("DELETE FROM income WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO income (id, user_id, date, source, description, category, amount, account_id, method, status, expected_type, expected_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['income'] as $i) {
                $ins->execute([
                    $i['id'],
                    $userId,
                    $i['date'],
                    $i['source'],
                    $i['desc'] ?? '',
                    $i['category'],
                    (float)$i['amount'],
                    $i['accountId'] ?? null,
                    $i['method'] ?? null,
                    $i['status'] ?? 'مستلم',
                    $i['expectedType'] ?? 'فعلي',
                    !empty($i['expectedDate']) ? $i['expectedDate'] : null,
                    $i['notes'] ?? ''
                ]);
            }
        }

        // 4) تحديث جدول المصروفات
        if (isset($state['expenses']) && is_array($state['expenses'])) {
            $pdo->prepare("DELETE FROM expenses WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO expenses (id, user_id, date, description, main_cat, sub_cat, amount, account_id, method, necessity, recurrence, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['expenses'] as $e) {
                $ins->execute([
                    $e['id'],
                    $userId,
                    $e['date'],
                    $e['desc'],
                    $e['mainCat'],
                    $e['subCat'] ?? '',
                    (float)$e['amount'],
                    $e['accountId'] ?? null,
                    $e['method'] ?? null,
                    $e['necessity'] ?? 'ضروري',
                    $e['recurrence'] ?? 'متكرر',
                    $e['status'] ?? 'مدفوع',
                    $e['notes'] ?? ''
                ]);
            }
        }

        // 5) تحديث جدول التحويلات
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
                    $t['notes'] ?? ''
                ]);
            }
        }

        // 6) تحديث ديون عليّ
        if (isset($state['debtsOwed']) && is_array($state['debtsOwed'])) {
            $pdo->prepare("DELETE FROM debts_owed WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO debts_owed (id, user_id, person, description, original, paid, start_date, due_date, status, account_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['debtsOwed'] as $d) {
                $ins->execute([
                    $d['id'],
                    $userId,
                    $d['person'],
                    $d['desc'] ?? '',
                    (float)$d['original'],
                    isset($d['paid']) ? (float)$d['paid'] : 0.00,
                    !empty($d['startDate']) ? $d['startDate'] : null,
                    !empty($d['dueDate']) ? $d['dueDate'] : null,
                    $d['status'] ?? 'مفتوح',
                    $d['accountId'] ?? null,
                    $d['notes'] ?? ''
                ]);
            }
        }

        // 7) تحديث مستحقات لي
        if (isset($state['debtsReceivable']) && is_array($state['debtsReceivable'])) {
            $pdo->prepare("DELETE FROM debts_receivable WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO debts_receivable (id, user_id, person, description, original, received, start_date, due_date, probability, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['debtsReceivable'] as $d) {
                $ins->execute([
                    $d['id'],
                    $userId,
                    $d['person'],
                    $d['desc'] ?? '',
                    (float)$d['original'],
                    isset($d['received']) ? (float)$d['received'] : 0.00,
                    !empty($d['startDate']) ? $d['startDate'] : null,
                    !empty($d['dueDate']) ? $d['dueDate'] : null,
                    $d['probability'] ?? 'متوسطة',
                    $d['status'] ?? 'مفتوح',
                    $d['notes'] ?? ''
                ]);
            }
        }

        // 8) تحديث الاشتراكات
        if (isset($state['subscriptions']) && is_array($state['subscriptions'])) {
            $pdo->prepare("DELETE FROM subscriptions WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO subscriptions (id, user_id, name, type, value, interval_value, interval_unit, start_date, next_renewal, account_id, auto_renew, status, last_payment, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['subscriptions'] as $s) {
                $ins->execute([
                    $s['id'],
                    $userId,
                    $s['name'],
                    $s['type'] ?? '',
                    (float)$s['value'],
                    isset($s['intervalValue']) ? (int)$s['intervalValue'] : 1,
                    $s['intervalUnit'] ?? 'شهر',
                    !empty($s['startDate']) ? $s['startDate'] : null,
                    !empty($s['nextRenewal']) ? $s['nextRenewal'] : null,
                    $s['accountId'] ?? null,
                    !empty($s['autoRenew']) ? 1 : 0,
                    $s['status'] ?? 'نشط',
                    !empty($s['lastPayment']) ? $s['lastPayment'] : null,
                    $s['notes'] ?? ''
                ]);
            }
        }

        // 9) تحديث الالتزامات القادمة
        if (isset($state['upcoming']) && is_array($state['upcoming'])) {
            $pdo->prepare("DELETE FROM upcoming WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO upcoming (id, user_id, name, type, amount, due_date, account_id, priority, status, recurring, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['upcoming'] as $u) {
                $ins->execute([
                    $u['id'],
                    $userId,
                    $u['name'],
                    $u['type'] ?? '',
                    (float)$u['amount'],
                    !empty($u['dueDate']) ? $u['dueDate'] : null,
                    $u['accountId'] ?? null,
                    $u['priority'] ?? 'متوسطة',
                    $u['status'] ?? 'قادم',
                    !empty($u['recurring']) ? 1 : 0,
                    $u['source'] ?? '',
                    $u['notes'] ?? ''
                ]);
            }
        }

        // 10) تحديث الدخل المتوقع
        if (isset($state['expectedIncome']) && is_array($state['expectedIncome'])) {
            $pdo->prepare("DELETE FROM expected_income WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO expected_income (id, user_id, source, client, description, amount, probability, expected_date, account_id, status, actual_received, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['expectedIncome'] as $ei) {
                $ins->execute([
                    $ei['id'],
                    $userId,
                    $ei['source'],
                    $ei['client'] ?? '',
                    $ei['desc'] ?? '',
                    (float)$ei['amount'],
                    isset($ei['probability']) ? (float)$ei['probability'] : 0.50,
                    !empty($ei['expectedDate']) ? $ei['expectedDate'] : null,
                    $ei['accountId'] ?? null,
                    $ei['status'] ?? 'محتمل',
                    isset($ei['actualReceived']) && $ei['actualReceived'] !== null ? (float)$ei['actualReceived'] : null,
                    $ei['notes'] ?? ''
                ]);
            }
        }

        // 11) تحديث الأهداف المالية
        if (isset($state['goals']) && is_array($state['goals'])) {
            $pdo->prepare("DELETE FROM goals WHERE user_id = ?")->execute([$userId]);
            $ins = $pdo->prepare("INSERT INTO goals (id, user_id, name, type, target, current, start_date, target_date, priority, status, account_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($state['goals'] as $g) {
                $ins->execute([
                    $g['id'],
                    $userId,
                    $g['name'],
                    $g['type'] ?? '',
                    (float)$g['target'],
                    isset($g['current']) ? (float)$g['current'] : 0.00,
                    !empty($g['startDate']) ? $g['startDate'] : null,
                    !empty($g['targetDate']) ? $g['targetDate'] : null,
                    $g['priority'] ?? 'متوسطة',
                    $g['status'] ?? 'قيد التنفيذ',
                    $g['accountId'] ?? null,
                    $g['notes'] ?? ''
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
            'message' => 'تمت المزامنة وحفظ البيانات بنجاح داخل قاعدة بيانات MySQL',
            'synced_at' => $updatedAt,
            'updated_at' => $updatedAt
        ]);
    }

    // 4. إجراءات المصادقة والمستخدمين (Authentication)
    if ($action === 'auth') {
        $sub = isset($_GET['sub']) ? trim($_GET['sub']) : '';
        $raw = file_get_contents('php://input');
        $body = $raw ? json_decode($raw, true) : [];

        // 4.1 تسجيل حساب جديد وتخزينه مباشرة في قاعدة البيانات MySQL
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

            // توليد التجزئة في حال تم إرسال كلمة المرور أو الرمز الصريح
            if (empty($pwdHash) && !empty($plainPassword)) {
                $pwdHash = hash('sha256', $plainPassword . '_sarfy_master_pwd_salt_v2');
            }
            if (empty($pinHash) && !empty($plainPin)) {
                $pinHash = hash('sha256', $plainPin . '_sarfy_pin_salt_v1');
            }

            // التحقق من عدم وجود البريد مسبقاً في قاعدة البيانات
            $chk = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
            $chk->execute([$email]);
            if ($chk->fetch()) {
                jsonResponse(['success' => false, 'error' => 'هذا البريد الإلكتروني مسجل بالفعل في قاعدة البيانات. يرجى تسجيل الدخول.'], 400);
            }

            // تحديد المعرف الفريد والدور (أول مستخدم مسجل أو admin@sarfy.app يصبح مالك المنصة)
            $id = 'usr_' . substr(md5(uniqid(mt_rand(), true)), 0, 10);
            $countStmt = $pdo->query("SELECT COUNT(*) FROM users");
            $userCount = (int)$countStmt->fetchColumn();
            $role = ($userCount === 0 || strtolower($email) === 'admin@sarfy.app') ? 'owner' : 'user';

            // الحفظ الحقيقي والمباشر في جدول users داخل MySQL
            $stmt = $pdo->prepare("INSERT INTO users (id, username, email, full_name, currency, pin_hash, password_hash, role, status, avatar_seed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)");
            $stmt->execute([$id, $username ?: $email, $email, $fullName, $currency, $pinHash, $pwdHash, $role, $avatarSeed]);

            // إنشاء حالة التطبيق الأولية وحفظها في MySQL
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

            $pdo->prepare("INSERT INTO user_app_state (user_id, state_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)")
                ->execute([$id, json_encode($initialState, JSON_UNESCAPED_UNICODE)]);

            // إدراج الحسابات الافتتاحية في جدول accounts
            if (!empty($initialState['accounts'])) {
                $insAcc = $pdo->prepare("INSERT INTO accounts (id, user_id, name, type, opening, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
                foreach ($initialState['accounts'] as $a) {
                    $insAcc->execute([$a['id'], $id, $a['name'], $a['type'], (float)$a['opening'], $a['status'] ?? 'نشط', $a['notes'] ?? '']);
                }
            }

            jsonResponse([
                'success' => true,
                'user' => [
                    'id' => $id,
                    'fullName' => $fullName,
                    'email' => $email,
                    'role' => $role,
                    'status' => 'active',
                    'currency' => $currency,
                    'avatarSeed' => $avatarSeed,
                    'pinHash' => $pinHash,
                    'pwdHash' => $pwdHash
                ],
                'message' => 'تم حفظ وإنشاء الحساب وبياناته بنجاح تام داخل قاعدة بيانات MySQL'
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

            // توليد التجزئات إن لم تكن مرسلة
            if (empty($pwdHash) && !empty($plainPassword)) {
                $pwdHash = hash('sha256', $plainPassword . '_sarfy_master_pwd_salt_v2');
            }
            if (empty($pinHash) && !empty($plainPin)) {
                $pinHash = hash('sha256', $plainPin . '_sarfy_pin_salt_v1');
            }

            $user = null;

            // أ) البحث بالبريد الإلكتروني أو اسم المستخدم
            if (!empty($identifier)) {
                $stmt = $pdo->prepare("SELECT id, username, email, full_name, currency, pin_hash, password_hash, role, status, avatar_seed FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) LIMIT 1");
                $stmt->execute([$identifier, $identifier]);
                $candidate = $stmt->fetch();

                if ($candidate) {
                    $dbPwd = $candidate['password_hash'] ?? '';
                    $dbPin = $candidate['pin_hash'] ?? '';

                    $pwdMatched = false;
                    if (!empty($pwdHash) || !empty($plainPassword)) {
                        $pwdMatched = (
                            (!empty($pwdHash) && $dbPwd === $pwdHash) ||
                            (!empty($plainPassword) && $dbPwd === $plainPassword) ||
                            (!empty($plainPassword) && $dbPwd === hash('sha256', $plainPassword . '_sarfy_master_pwd_salt_v2')) ||
                            (!empty($plainPassword) && $dbPwd === hash('sha256', $plainPassword)) ||
                            (!empty($plainPassword) && password_verify($plainPassword, $dbPwd))
                        );
                    }

                    $pinMatched = false;
                    if (!empty($pinHash) || !empty($plainPin)) {
                        $pinMatched = (
                            (!empty($pinHash) && $dbPin === $pinHash) ||
                            (!empty($plainPin) && $dbPin === $plainPin) ||
                            (!empty($plainPin) && $dbPin === hash('sha256', $plainPin . '_sarfy_pin_salt_v1')) ||
                            (!empty($plainPin) && $dbPin === hash('sha256', $plainPin))
                        );
                    }

                    if ($pwdMatched || $pinMatched) {
                        $user = $candidate;
                    }
                }
            }
            // ب) في حال تسجيل الدخول بالرمز السري PIN أو كلمة المرور فقط دون تحديد البريد
            else {
                if (!empty($pwdHash) || !empty($plainPassword)) {
                    $stmt = $pdo->prepare("SELECT id, username, email, full_name, currency, pin_hash, password_hash, role, status, avatar_seed FROM users WHERE password_hash = ? OR password_hash = ? LIMIT 1");
                    $stmt->execute([$pwdHash, $plainPassword]);
                    $user = $stmt->fetch();
                } else if (!empty($pinHash) || !empty($plainPin)) {
                    $stmt = $pdo->prepare("SELECT id, username, email, full_name, currency, pin_hash, password_hash, role, status, avatar_seed FROM users WHERE pin_hash = ? OR pin_hash = ? LIMIT 1");
                    $stmt->execute([$pinHash, $plainPin]);
                    $user = $stmt->fetch();
                }
            }

            if (!$user) {
                jsonResponse(['success' => false, 'error' => 'بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور المسجلة.'], 401);
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
                'user' => [
                    'id' => $user['id'],
                    'fullName' => $user['full_name'],
                    'email' => $user['email'],
                    'role' => $user['role'] ?? 'user',
                    'status' => $user['status'] ?? 'active',
                    'currency' => $user['currency'] ?? 'ج.م',
                    'avatarSeed' => $user['avatar_seed'] ?: mb_substr($user['full_name'], 0, 2, 'UTF-8'),
                    'pinHash' => $user['pin_hash'],
                    'pwdHash' => $user['password_hash']
                ],
                'message' => 'تم التحقق وتسجيل الدخول بنجاح من قاعدة بيانات MySQL'
            ]);
        }

        // 4.3 فحص وجود أي مستخدم مسجل
        if ($sub === 'check_user') {
            $stmt = $pdo->query("SELECT id, username, email, full_name, currency, pin_hash, password_hash, role, status FROM users LIMIT 1");
            $user = $stmt->fetch();
            if ($user) {
                jsonResponse(['success' => true, 'has_user' => true, 'user' => [
                    'id' => $user['id'],
                    'fullName' => $user['full_name'],
                    'email' => $user['email'],
                    'role' => $user['role'] ?? 'user',
                    'currency' => $user['currency'],
                    'hasPin' => !empty($user['pin_hash']),
                    'hasPassword' => !empty($user['password_hash'])
                ]]);
            } else {
                jsonResponse(['success' => true, 'has_user' => false]);
            }
        }
    }

    // 5. إجراءات لوحة تحكم مالك التطبيق (Owner & Admin Dashboard API)
    if ($action === 'admin') {
        $sub = isset($_GET['sub']) ? trim($_GET['sub']) : '';
        $raw = file_get_contents('php://input');
        $body = $raw ? json_decode($raw, true) : [];

        // 5.1 استعراض قائمة العملاء والمستخدمين
        if ($sub === 'users_list') {
            $stmt = $pdo->query("SELECT u.id, u.username, u.email, u.full_name, u.role, u.status, u.currency, u.created_at, u.last_login,
                (SELECT COUNT(*) FROM accounts a WHERE a.user_id = u.id) as accounts_count,
                (SELECT COUNT(*) FROM expenses e WHERE e.user_id = u.id) as expenses_count,
                (SELECT COUNT(*) FROM income i WHERE i.user_id = u.id) as income_count,
                (SELECT COALESCE(SUM(opening), 0) FROM accounts a WHERE a.user_id = u.id) as total_balance
                FROM users u ORDER BY u.created_at DESC");
            $users = $stmt->fetchAll();

            // إحصائيات عامة للمنصة
            $totalUsers = count($users);
            $activeUsers = 0;
            $totalTransactions = 0;
            foreach ($users as &$u) {
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

        // 5.2 تغيير حالة المستخدم (تفعيل / تعليق)
        if ($sub === 'update_status') {
            $userId = trim($body['userId'] ?? '');
            $newStatus = trim($body['status'] ?? 'active'); // 'active' | 'suspended'

            if (empty($userId)) jsonResponse(['success' => false, 'error' => 'معرف المستخدم مطلوب.'], 400);

            $pdo->prepare("UPDATE users SET status = ? WHERE id = ?")->execute([$newStatus, $userId]);
            jsonResponse(['success' => true, 'message' => "تم تحديث حالة المستخدم إلى {$newStatus}"]);
        }

        // 5.3 تغيير رتبة المستخدم (ترقية لمشرف / تخفيض لمستخدم)
        if ($sub === 'update_role') {
            $userId = trim($body['userId'] ?? '');
            $newRole = trim($body['role'] ?? 'user'); // 'owner' | 'admin' | 'user'

            if (empty($userId)) jsonResponse(['success' => false, 'error' => 'معرف المستخدم مطلوب.'], 400);

            $pdo->prepare("UPDATE users SET role = ? WHERE id = ?")->execute([$newRole, $userId]);
            jsonResponse(['success' => true, 'message' => "تم تغيير رتبة المستخدم إلى {$newRole}"]);
        }

        // 5.4 حذف مستخدم وكافة بياناته نهائياً
        if ($sub === 'delete_user') {
            $userId = trim($body['userId'] ?? '');
            if (empty($userId)) jsonResponse(['success' => false, 'error' => 'معرف المستخدم مطلوب.'], 400);

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

        // 5.5 إنشاء عميل جديد من لوحة المالك مباشرة
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

            $id = 'usr_' . substr(md5(uniqid(mt_rand(), true)), 0, 10);
            $stmt = $pdo->prepare("INSERT INTO users (id, username, email, full_name, currency, pin_hash, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')");
            $stmt->execute([$id, explode('@', $email)[0], $email, $fullName, $currency, $pinHash, $passwordHash, $role]);

            jsonResponse(['success' => true, 'message' => 'تم إنشاء حساب العميل بنجاح', 'user_id' => $id]);
        }
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
