-- ==============================
-- CREATE TABLES
-- ==============================

-- Table: dbo.admins
CREATE TABLE dbo.admins (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL
);
GO

-- Table: dbo.locations
CREATE TABLE dbo.locations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(500) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    region NVARCHAR(100) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    lat DECIMAL(10, 6) NOT NULL,
    lng DECIMAL(10, 6) NOT NULL
);
GO

-- Table: dbo.users
CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    balance INT NOT NULL DEFAULT 0,
    home_address NVARCHAR(500),
    work_address NVARCHAR(500)
);
GO

-- Table: dbo.parking_lots
CREATE TABLE dbo.parking_lots (
    id INT IDENTITY(1,1) PRIMARY KEY,
    location_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    lot_type NVARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    current_available INT NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    address NVARCHAR(500) NOT NULL,
    lat DECIMAL(10, 6) NOT NULL,
    lng DECIMAL(10, 6) NOT NULL,
    status_override NVARCHAR(100) NULL
);
GO

-- Table: dbo.user_favorites
CREATE TABLE dbo.user_favorites (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    location_id INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(500) NOT NULL
);
GO

-- Table: dbo.user_incentives
CREATE TABLE dbo.user_incentives (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    transit_type NVARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- ==============================
-- ADD FOREIGN KEY CONSTRAINTS
-- ==============================

ALTER TABLE dbo.parking_lots
    ADD CONSTRAINT FK_parking_lots_locations FOREIGN KEY (location_id) REFERENCES dbo.locations(id);
GO

ALTER TABLE dbo.user_favorites
    ADD CONSTRAINT FK_user_favorites_locations FOREIGN KEY (location_id) REFERENCES dbo.locations(id);
GO

ALTER TABLE dbo.user_favorites
    ADD CONSTRAINT FK_user_favorites_users FOREIGN KEY (user_id) REFERENCES dbo.users(id);
GO

ALTER TABLE dbo.user_incentives
    ADD CONSTRAINT FK_user_incentives_users FOREIGN KEY (user_id) REFERENCES dbo.users(id);
GO

-- ==============================
-- INSERT DATA
-- ==============================

-- Data for dbo.admins
SET IDENTITY_INSERT dbo.admins ON;
INSERT INTO dbo.admins (id, username, email) VALUES (1, 'dpasala', 'dpasala@calpoly.edu');
INSERT INTO dbo.admins (id, username, email) VALUES (2, 'kbeltran', 'kbeltr03@calpoly.edu');
INSERT INTO dbo.admins (id, username, email) VALUES (3, 'newadmin', 'newadmin@example.com');
INSERT INTO dbo.admins (id, username, email) VALUES (4, 'test1', 'test1@calpoly.edu');
SET IDENTITY_INSERT dbo.admins OFF;
GO

-- Data for dbo.locations
SET IDENTITY_INSERT dbo.locations ON;
INSERT INTO dbo.locations (id, name, address, city, region, is_active, created_at, updated_at, lat, lng) VALUES 
(11, 'Palo Alto Office', '3500 Deer Creek Rd, Palo Alto, CA', 'Palo Alto', 'Bay Area', 1, '2026-02-04T04:12:00.850Z', '2026-02-04T04:12:00.850Z', 37.3947, -122.1503);
INSERT INTO dbo.locations (id, name, address, city, region, is_active, created_at, updated_at, lat, lng) VALUES 
(12, 'Fremont Factory', '45500 Fremont Blvd, Fremont, CA', 'Fremont', 'Bay Area', 1, '2026-02-04T04:12:00.850Z', '2026-02-04T04:12:00.850Z', 37.4923, -121.944);
INSERT INTO dbo.locations (id, name, address, city, region, is_active, created_at, updated_at, lat, lng) VALUES 
(13, 'North Fremont Factory', '1501 Page Ave, Fremont, CA', 'Fremont', 'Bay Area', 1, '2026-02-04T04:12:00.850Z', '2026-02-04T04:12:00.850Z', 37.5304, -121.9899);
INSERT INTO dbo.locations (id, name, address, city, region, is_active, created_at, updated_at, lat, lng) VALUES 
(14, 'Stanford Research Park', '3172 Porter Dr, Palo Alto, CA', 'Palo Alto', 'Bay Area', 1, '2026-02-04T04:12:00.850Z', '2026-02-04T04:12:00.850Z', 37.4231, -122.1484);
INSERT INTO dbo.locations (id, name, address, city, region, is_active, created_at, updated_at, lat, lng) VALUES 
(15, 'San Mateo Office', '2400 Fashion Island Blvd, San Mateo, CA', 'San Mateo', 'Bay Area', 1, '2026-02-04T04:12:00.850Z', '2026-02-04T04:12:00.850Z', 37.5591, -122.2849);
INSERT INTO dbo.locations (id, name, address, city, region, is_active, created_at, updated_at, lat, lng) VALUES 
(16, 'Sunnyvale Hub', '1350 Crossman Ave, Sunnyvale, CA', 'Sunnyvale', 'Bay Area', 1, '2026-02-04T04:12:00.850Z', '2026-02-04T04:12:00.850Z', 37.3688, -122.0363);
INSERT INTO dbo.locations (id, name, address, city, region, is_active, created_at, updated_at, lat, lng) VALUES 
(17, 'Mountain View Office', '1501 Page Mill Rd, Palo Alto, CA', 'Palo Alto', 'Bay Area', 1, '2026-02-04T04:12:00.850Z', '2026-02-04T04:12:00.850Z', 37.4419, -122.143);
INSERT INTO dbo.locations (id, name, address, city, region, is_active, created_at, updated_at, lat, lng) VALUES 
(18, 'Redwood City Office', '620 Broadway, Redwood City, CA', 'Redwood City', 'Bay Area', 1, '2026-02-04T04:12:00.850Z', '2026-02-04T04:12:00.850Z', 37.4863, -122.2277);
SET IDENTITY_INSERT dbo.locations OFF;
GO

-- Data for dbo.users
SET IDENTITY_INSERT dbo.users ON;
INSERT INTO dbo.users (id, name, email, balance, home_address, work_address) VALUES 
(1, 'dakshesh', 'dpasala@calpoly.edu', 30, '1 Grand Avenue, San Luis Obispo, 93410', 'Deer Creek');
INSERT INTO dbo.users (id, name, email, balance, home_address, work_address) VALUES 
(2, 'kevin', 'kbeltr03@calpoly.edu', 20, '795 orcutt road #202, San Luis Obispo', '3500 Deer Creek Rd, Palo Alto, CA');
SET IDENTITY_INSERT dbo.users OFF;
GO

-- Data for dbo.parking_lots
SET IDENTITY_INSERT dbo.parking_lots ON;
INSERT INTO dbo.parking_lots (id, location_id, name, lot_type, capacity, current_available, is_active, created_at, updated_at, address, lat, lng, status_override) VALUES 
(6, 11, 'Main Parking Structure', 'garage', 300, 30, 1, '2026-02-04T04:12:01.540Z', '2026-02-04T04:12:01.540Z', '3500 Deer Creek Rd, Palo Alto, CA', 37.3947, -122.1503, NULL);
INSERT INTO dbo.parking_lots (id, location_id, name, lot_type, capacity, current_available, is_active, created_at, updated_at, address, lat, lng, status_override) VALUES 
(7, 11, 'Visitor Lot A', 'surface', 50, 0, 1, '2026-02-04T04:12:01.540Z', '2026-02-04T04:12:01.540Z', '3500 Deer Creek Rd, Palo Alto, CA', 37.3945, -122.1505, 'Lot closed');
INSERT INTO dbo.parking_lots (id, location_id, name, lot_type, capacity, current_available, is_active, created_at, updated_at, address, lat, lng, status_override) VALUES 
(8, 12, 'North Lot', 'surface', 200, 0, 1, '2026-02-04T04:12:01.540Z', '2026-02-04T04:12:01.540Z', '45500 Fremont Blvd, Fremont, CA', 37.493, -121.945, NULL);
INSERT INTO dbo.parking_lots (id, location_id, name, lot_type, capacity, current_available, is_active, created_at, updated_at, address, lat, lng, status_override) VALUES 
(9, 12, 'South Garage', 'garage', 400, 0, 1, '2026-02-04T04:12:01.540Z', '2026-02-04T04:12:01.540Z', '45500 Fremont Blvd, Fremont, CA', 37.4915, -121.944, 'Lot closed');
INSERT INTO dbo.parking_lots (id, location_id, name, lot_type, capacity, current_available, is_active, created_at, updated_at, address, lat, lng, status_override) VALUES 
(10, 13, 'Employee Lot B', 'surface', 250, 200, 1, '2026-02-04T04:12:01.540Z', '2026-02-04T04:12:01.540Z', '1501 Page Ave, Fremont, CA', 37.5325, -121.9458, NULL);
INSERT INTO dbo.parking_lots (id, location_id, name, lot_type, capacity, current_available, is_active, created_at, updated_at, address, lat, lng, status_override) VALUES 
(11, 14, 'Research Park Structure', 'garage', 180, 90, 1, '2026-02-04T04:12:01.540Z', '2026-02-04T04:12:01.540Z', '3172 Porter Dr, Palo Alto, CA', 37.4235, -122.1490, NULL);
INSERT INTO dbo.parking_lots (id, location_id, name, lot_type, capacity, current_available, is_active, created_at, updated_at, address, lat, lng, status_override) VALUES 
(12, 14, 'Parking Lot A', 'surface', 150, 80, 1, '2026-02-04T04:12:01.540Z', '2026-02-04T04:12:01.540Z', '3172 Porter Dr, Palo Alto, CA', 37.4231, -122.1484, NULL);
INSERT INTO dbo.parking_lots (id, location_id, name, lot_type, capacity, current_available, is_active, created_at, updated_at, address, lat, lng, status_override) VALUES 
(13, 15, 'Underground Garage', 'garage', 250, 100, 1, '2026-02-04T04:12:01.540Z', '2026-02-04T04:12:01.540Z', '2400 Fashion Island Blvd, San Mateo, CA', 37.5591, -122.2849, NULL);
INSERT INTO dbo.parking_lots (id, location_id, name, lot_type, capacity, current_available, is_active, created_at, updated_at, address, lat, lng, status_override) VALUES 
(14, 16, 'Parking Lot B', 'surface', 100, 90, 1, '2026-02-04T04:12:01.540Z', '2026-02-04T04:12:01.540Z', '1350 Crossman Ave, Sunnyvale, CA', 37.3688, -122.0363, NULL);
INSERT INTO dbo.parking_lots (id, location_id, name, lot_type, capacity, current_available, is_active, created_at, updated_at, address, lat, lng, status_override) VALUES 
(15, 17, 'West Parking', 'surface', 120, 60, 1, '2026-02-04T04:12:01.540Z', '2026-02-04T04:12:01.540Z', '1501 Page Mill Rd, Palo Alto, CA', 37.4419, -122.143, NULL);
INSERT INTO dbo.parking_lots (id, location_id, name, lot_type, capacity, current_available, is_active, created_at, updated_at, address, lat, lng, status_override) VALUES 
(16, 18, 'Central Lot', 'surface', 100, 45, 1, '2026-02-04T04:12:01.540Z', '2026-02-04T04:12:01.540Z', '620 Broadway, Redwood City, CA', 37.4863, -122.2277, NULL);
SET IDENTITY_INSERT dbo.parking_lots OFF;
GO

-- Data for dbo.user_favorites
SET IDENTITY_INSERT dbo.user_favorites ON;
INSERT INTO dbo.user_favorites (id, user_id, location_id, created_at, name, address) VALUES 
(24, 2, 12, '2026-02-05T09:58:11.925Z', 'Fremont Factory', '45500 Fremont Blvd, Fremont, CA');
INSERT INTO dbo.user_favorites (id, user_id, location_id, created_at, name, address) VALUES 
(25, 2, 17, '2026-02-05T09:58:13.003Z', 'Mountain View Office', '1501 Page Mill Rd, Palo Alto, CA');
INSERT INTO dbo.user_favorites (id, user_id, location_id, created_at, name, address) VALUES 
(27, 1, 18, '2026-07-10T05:56:25.674Z', 'Redwood City Office', '620 Broadway, Redwood City, CA');
SET IDENTITY_INSERT dbo.user_favorites OFF;
GO

-- Data for dbo.user_incentives
SET IDENTITY_INSERT dbo.user_incentives ON;
INSERT INTO dbo.user_incentives (id, user_id, transit_type, amount, created_at) VALUES 
(1, 1, 'shuttle', 5, '2026-01-13T03:28:35.743Z');
INSERT INTO dbo.user_incentives (id, user_id, transit_type, amount, created_at) VALUES 
(2, 1, 'shuttle', 5, '2026-01-13T03:52:53.710Z');
SET IDENTITY_INSERT dbo.user_incentives OFF;
GO

-- ==============================
-- SCRIPT COMPLETE
-- ==============================
PRINT 'Database tables created successfully!';
GO