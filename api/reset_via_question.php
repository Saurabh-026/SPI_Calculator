<?php
require_once '../config/database.php';
$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? '';
$secret_answer = $input['secret_answer'] ?? '';
$new_password = $input['password'] ?? '';
if (empty($username) || empty($secret_answer) || empty($new_password)) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required.']);
    exit();
}
$stmt = $conn->prepare("SELECT secret_answer FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
if ($user = $result->fetch_assoc()) {
    if (password_verify($secret_answer, $user['secret_answer'])) {
        $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
        $update_stmt = $conn->prepare("UPDATE users SET password = ? WHERE username = ?");
        $update_stmt->bind_param("ss", $hashed_password, $username);
        $update_stmt->execute();
        $update_stmt->close();
        echo json_encode(['success' => 'Password has been reset successfully.']);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Incorrect secret answer.']);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'User not found.']);
}
$stmt->close();
$conn->close();
?>