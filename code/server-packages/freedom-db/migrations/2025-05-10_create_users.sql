CREATE TABLE "users" (
    "userId" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "publicKeys" JSONB NOT NULL,
    "defaultSalt" VARCHAR NOT NULL,
    "encryptedCredentials" VARCHAR NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("userId")
);

CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
