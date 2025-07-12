<?php
require_once '../config/database.php';

$user_id = get_user_id();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // --- HANDLE FETCHING ACADEMIC DATA ---
    $academics = [];
    // Fetch all academic records for the user, ordered by semester
    $stmt = $conn->prepare("SELECT id, semester_number, sgpa FROM academics WHERE user_id = ? ORDER BY semester_number ASC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        // For each academic record, fetch its subjects
        $subjects_stmt = $conn->prepare("SELECT name, marks FROM subjects WHERE academic_id = ?");
        $subjects_stmt->bind_param("i", $row['id']);
        $subjects_stmt->execute();
        $subjects_result = $subjects_stmt->get_result();
        
        $subjects = [];
        while ($subject_row = $subjects_result->fetch_assoc()) {
            $subjects[] = $subject_row;
        }
        $row['subjects'] = $subjects;
        $academics[] = $row;
        $subjects_stmt->close();
    }
    
    echo json_encode($academics);
    $stmt->close();

} elseif ($method === 'POST') {
    // --- HANDLE ADDING A NEW ACADEMIC RECORD ---
    $input = json_decode(file_get_contents('php://input'), true);

    $semester_number = $input['sem'];
    $subjects = $input['subjects'];
    
    // Calculate SGPA on the server-side for accuracy
    $total_marks = 0;
    $subject_count = count($subjects);
    foreach ($subjects as $subject) {
        $total_marks += (int)$subject['marks'];
    }
    $sgpa = $subject_count > 0 ? ($total_marks / ($subject_count * 100)) * 10 : 0;

    // Use a transaction to ensure data integrity
    $conn->begin_transaction();
    try {
        // Insert into academics table
        $stmt = $conn->prepare("INSERT INTO academics (user_id, semester_number, sgpa) VALUES (?, ?, ?)");
        $stmt->bind_param("iid", $user_id, $semester_number, $sgpa);
        $stmt->execute();
        $academic_id = $stmt->insert_id; // Get the ID of the new academic record
        $stmt->close();

        // Insert each subject into the subjects table
        $subject_stmt = $conn->prepare("INSERT INTO subjects (academic_id, name, marks) VALUES (?, ?, ?)");
        foreach ($subjects as $subject) {
            $subject_stmt->bind_param("isi", $academic_id, $subject['name'], $subject['marks']);
            $subject_stmt->execute();
        }
        $subject_stmt->close();

        // If everything is successful, commit the transaction
        $conn->commit();
        http_response_code(201); // Created
        echo json_encode(['success' => 'Academic record added.']);

    } catch (Exception $e) {
        // If anything fails, roll back the transaction
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add record: ' . $e->getMessage()]);
    }
}

$conn->close();
?>