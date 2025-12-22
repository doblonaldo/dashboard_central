INSERT INTO User (id, email, name, passwordHash, role, createdAt, updatedAt, isActive) VALUES 
('admin-id-123', 'admin@example.com', 'Administrator', '$2b$10$ykobUlaOcZH8VBkPMARYk.29tDwcwa/1klwclrWT96Bz/tbHsX0UW', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
ON CONFLICT(email) DO UPDATE SET passwordHash='$2b$10$ykobUlaOcZH8VBkPMARYk.29tDwcwa/1klwclrWT96Bz/tbHsX0UW';

INSERT INTO User (id, email, name, passwordHash, role, createdAt, updatedAt, isActive) VALUES 
('user-id-456', 'usuario@empresa.com', 'Usuário Padrão', '$2b$10$31R6d/09xwg4/GvQAvndsuM9dt8J4ky9BF2yjqDJAkn.0LvIzirXm', 'VIEWER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
ON CONFLICT(email) DO UPDATE SET passwordHash='$2b$10$31R6d/09xwg4/GvQAvndsuM9dt8J4ky9BF2yjqDJAkn.0LvIzirXm';
