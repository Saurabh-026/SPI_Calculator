<?php
require_once '../config/database.php';

$user_id = get_user_id();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // --- HANDLE FETCHING SKILLS ---
    $skills = [];
    $stmt = $conn->prepare("SELECT id, name, level, certificate_url FROM skills WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $skills[] = $row;
    }
    
    echo json_encode($skills);
    $stmt->close();

} elseif ($method === 'POST') {
    // --- HANDLE ADDING A NEW SKILL ---
    $input = json_decode(file_get_contents('php://input'), true);

    $name = $input['name'];
    $level = $input['level'];
    $cert_url = $input['cert'] ?: null; // Use null if empty

    $stmt = $conn->prepare("INSERT INTO skills (user_id, name, level, certificate_url) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $user_id, $name, $level, $cert_url);
    
    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(['success' => 'Skill added.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add skill.']);
    }
    $stmt->close();
}

$conn->close();
?>