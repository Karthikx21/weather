CREATE TABLE "favorite_cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lat" real NOT NULL,
	"lon" real NOT NULL,
	"country" text NOT NULL,
	"country_code" text,
	"admin1" text,
	"timezone" text,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lat" real NOT NULL,
	"lon" real NOT NULL,
	"country" text NOT NULL,
	"country_code" text,
	"admin1" text,
	"timezone" text,
	"searched_at" timestamp DEFAULT now() NOT NULL
);
