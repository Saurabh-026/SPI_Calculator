<?php
require_once '../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name'], $input['username'], $input['password'], $input['secret_question'], $input['secret_answer'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Please fill in all fields.']);
    exit();
}

$name = trim($input['name']);
$username = trim($input['username']);
$password = trim($input['password']);
$secret_question = trim($input['secret_question']);
$secret_answer = trim($input['secret_answer']);

$hashed_password = password_hash($password, PASSWORD_BCRYPT);
$hashed_secret_answer = password_hash($secret_answer, PASSWORD_BCRYPT);

$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['error' => 'Username already exists.']);
    $stmt->close();
    $conn->close();
    exit();
}
$stmt->close();

$stmt = $conn->prepare("INSERT INTO users (name, username, password, secret_question, secret_answer) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $name, $username, $hashed_password, $secret_question, $hashed_secret_answer);

if ($stmt->execute()) {
    $_SESSION['user_id'] = $stmt->insert_id;
    $_SESSION['username'] = $username;
    http_response_code(201);
    echo json_encode(['success' => 'User registered successfully.']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to register user.']);
}

$stmt->close();
$conn->close();
?>