<?php
require_once '../config/database.php';

$user_id = get_user_id();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // --- HANDLE FETCHING PROJECTS ---
    $projects = [];
    // Fetch projects, most recent first
    $stmt = $conn->prepare("SELECT id, type, title, duration, description FROM projects WHERE user_id = ? ORDER BY id DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $projects[] = $row;
    }
    
    echo json_encode($projects);
    $stmt->close();

} elseif ($method === 'POST') {
    // --- HANDLE ADDING A NEW PROJECT ---
    $input = json_decode(file_get_contents('php://input'), true);

    $type = $input['type'];
    $title = $input['title'];
    $duration = $input['duration'];
    $desc = $input['desc'];

    $stmt = $conn->prepare("INSERT INTO projects (user_id, type, title, duration, description) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("issss", $user_id, $type, $title, $duration, $desc);
    
    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(['success' => 'Project added.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add project.']);
    }
    $stmt->close();
}

$conn->close();
?>