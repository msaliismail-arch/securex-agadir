-- SÉCUREX CONNECT — Setup complet pour nouveau projet Supabase
-- Généré le 2026-07-12 (schema = prisma/schema.prisma)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========== TABLES ==========

CREATE TABLE "AdminUser" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "phone" TEXT,
  "passwordHash" TEXT NOT NULL,
  "twoFactorCode" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "WebsiteContent" (
  "id" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Client" (
  "id" TEXT PRIMARY KEY,
  "phone" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'SMS',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Vehicle" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
  "plate" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "fuel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Vehicle_clientId_idx" ON "Vehicle"("clientId");

CREATE TABLE "Category" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Service" (
  "id" TEXT PRIMARY KEY,
  "categoryId" TEXT NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "durationMin" INTEGER NOT NULL DEFAULT 30,
  "price" DOUBLE PRECISION NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");

CREATE TABLE "Appointment" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
  "vehicleId" TEXT REFERENCES "Vehicle"("id") ON DELETE SET NULL,
  "categoryId" TEXT NOT NULL REFERENCES "Category"("id"),
  "serviceId" TEXT NOT NULL REFERENCES "Service"("id"),
  "date" TIMESTAMP(3) NOT NULL,
  "slot" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "qrToken" TEXT,
  "qrGeneratedAt" TIMESTAMP(3),
  "checkedInAt" TIMESTAMP(3),
  "checkedInBy" TEXT,
  "queueNumber" INTEGER,
  "notes" TEXT,
  "clientName" TEXT NOT NULL,
  "clientPhone" TEXT NOT NULL,
  "vehiclePlate" TEXT NOT NULL,
  "vehicleDesc" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Appointment_date_status_idx" ON "Appointment"("date", "status");

CREATE TABLE "DailyCapacity" (
  "id" TEXT PRIMARY KEY,
  "date" TIMESTAMP(3) NOT NULL UNIQUE,
  "capaciteMax" INTEGER NOT NULL DEFAULT 20,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "InspectionResult" (
  "id" TEXT PRIMARY KEY,
  "appointmentId" TEXT NOT NULL UNIQUE REFERENCES "Appointment"("id") ON DELETE CASCADE,
  "overallResult" TEXT NOT NULL,
  "brakes" TEXT NOT NULL DEFAULT 'PASS',
  "lights" TEXT NOT NULL DEFAULT 'PASS',
  "tires" TEXT NOT NULL DEFAULT 'PASS',
  "emissions" TEXT NOT NULL DEFAULT 'PASS',
  "bodywork" TEXT NOT NULL DEFAULT 'PASS',
  "inspector" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Announcement" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "category" TEXT NOT NULL DEFAULT 'INFO',
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "adminId" TEXT,
  "adminName" TEXT NOT NULL,
  "adminRole" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target" TEXT,
  "details" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuditLog_adminRole_idx" ON "AuditLog"("adminRole");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE TABLE "Setting" (
  "id" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL
);

CREATE TABLE "OtpRequest" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "consumed" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "OtpRequest_key_idx" ON "OtpRequest"("key");

-- ========== SEED ==========

-- Admin SUPER (mot de passe temporaire: Securex2026! — À CHANGER après connexion)
INSERT INTO "AdminUser" ("id","username","email","firstName","lastName","name","role","passwordHash","active")
VALUES ('admin_super_001','admin','ismail.msali25@ump.ac.ma','Ismail','MSALI','Ismail MSALI','SUPER',
        crypt('Securex2026!', gen_salt('bf', 10)), true);

-- Catégories
INSERT INTO "Category" ("id","name","slug","description","icon","color","sort") VALUES
('cat_voiture','Voiture','voiture','Contrôle technique des véhicules légers','Car','blue',0),
('cat_moto','Moto','moto','Contrôle technique des motos et cyclomoteurs','Bike','orange',1),
('cat_camion','Camion','camion','Contrôle technique des poids lourds','Truck','green',2),
('cat_utilitaire','Utilitaire','utilitaire','Contrôle technique des véhicules utilitaires','Bus','purple',3);

-- Services (tarifs modifiables depuis le dashboard admin)
INSERT INTO "Service" ("id","categoryId","name","slug","description","durationMin","price","active") VALUES
('srv_vt_voiture','cat_voiture','Visite technique périodique','vt-voiture','Contrôle technique complet du véhicule léger',30,350,true),
('srv_cv_voiture','cat_voiture','Contre-visite','cv-voiture','Vérification des points défaillants après réparation',20,150,true),
('srv_vt_moto','cat_moto','Visite technique moto','vt-moto','Contrôle technique complet de la moto',20,200,true),
('srv_cv_moto','cat_moto','Contre-visite moto','cv-moto','Vérification des points défaillants après réparation',15,100,true),
('srv_vt_camion','cat_camion','Visite technique poids lourd','vt-camion','Contrôle technique complet du poids lourd',45,550,true),
('srv_cv_camion','cat_camion','Contre-visite poids lourd','cv-camion','Vérification des points défaillants après réparation',30,250,true),
('srv_vt_util','cat_utilitaire','Visite technique utilitaire','vt-utilitaire','Contrôle technique complet du véhicule utilitaire',35,400,true),
('srv_cv_util','cat_utilitaire','Contre-visite utilitaire','cv-utilitaire','Vérification des points défaillants après réparation',25,180,true);
