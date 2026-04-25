-- DML for Customer Management System

-- Insert master data for countries
INSERT INTO countries (name, code, phone_prefix) VALUES ('Sri Lanka', 'LK', '+94');
INSERT INTO countries (name, code, phone_prefix) VALUES ('United States', 'US', '+1');
INSERT INTO countries (name, code, phone_prefix) VALUES ('United Kingdom', 'GB', '+44');
INSERT INTO countries (name, code, phone_prefix) VALUES ('Australia', 'AU', '+61');

-- Insert master data for cities
INSERT INTO cities (name, country_id) VALUES ('Colombo', (SELECT id FROM countries WHERE code = 'LK'));
INSERT INTO cities (name, country_id) VALUES ('Kandy', (SELECT id FROM countries WHERE code = 'LK'));
INSERT INTO cities (name, country_id) VALUES ('Galle', (SELECT id FROM countries WHERE code = 'LK'));
INSERT INTO cities (name, country_id) VALUES ('New York', (SELECT id FROM countries WHERE code = 'US'));
INSERT INTO cities (name, country_id) VALUES ('Los Angeles', (SELECT id FROM countries WHERE code = 'US'));
INSERT INTO cities (name, country_id) VALUES ('London', (SELECT id FROM countries WHERE code = 'GB'));
INSERT INTO cities (name, country_id) VALUES ('Sydney', (SELECT id FROM countries WHERE code = 'AU'));

-- Insert default admin user (admin / admin123)
-- BCrypt hash for 'admin123'
INSERT INTO users (username, password, role) VALUES ('admin', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy596HWrrJQay6uexgZJVk6TKSIQER4W', 'ADMIN');
