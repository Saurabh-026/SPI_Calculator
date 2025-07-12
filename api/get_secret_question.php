<?php
require_once '../config/database.php';
$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? '';
if (empty($username)) {
    http_response_code(400);
    echo json_encode(['error' => 'Username cannot be empty.']);
    exit();
}
$stmt = $conn->prepare("SELECT secret_question FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
if ($user = $result->fetch_assoc()) {
    if (empty($user['secret_question'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No secret question is set for this account.']);
        exit();
    }
    echo json_encode(['secret_question' => $user['secret_question']]);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Username not found.']);
}
$stmt->close();
$conn->close();
?>