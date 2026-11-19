-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Untitled Project',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT,
    "target_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "score" INTEGER,
    "screenshot_url" TEXT,
    "error_message" TEXT,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scan_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "wcag_criteria" TEXT,
    "severity" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "element_html" TEXT,
    "source" TEXT NOT NULL DEFAULT 'axe',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "issues_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fixes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issue_id" TEXT NOT NULL,
    "fix_type" TEXT NOT NULL,
    "fix_value" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fixes_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fixes_issue_id_key" ON "fixes"("issue_id");
