--
-- PostgreSQL database dump
--

\restrict PPUDu0uagUoNb9xhDYFiIMRSQKSXzaQlaf3LsaZxnVeq0CV0Uwnod4JGI7b7HcL

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-03-29 20:36:21

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 16388)
-- Name: projdbSchema; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA "projdbSchema";


ALTER SCHEMA "projdbSchema" OWNER TO pg_database_owner;

--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA "projdbSchema"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "projdbSchema" IS 'standard public schema';


--
-- TOC entry 889 (class 1247 OID 16390)
-- Name: EmailDomain; Type: DOMAIN; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE DOMAIN "projdbSchema"."EmailDomain" AS text
	CONSTRAINT "emailCheck" CHECK ((VALUE ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'::text));


ALTER DOMAIN "projdbSchema"."EmailDomain" OWNER TO pg_database_owner;

--
-- TOC entry 893 (class 1247 OID 16393)
-- Name: PhoneDomain; Type: DOMAIN; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE DOMAIN "projdbSchema"."PhoneDomain" AS text
	CONSTRAINT "phoneCheck" CHECK ((VALUE ~* '^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$'::text));


ALTER DOMAIN "projdbSchema"."PhoneDomain" OWNER TO pg_database_owner;

--
-- TOC entry 252 (class 1255 OID 16703)
-- Name: block_completing_unpaid(); Type: FUNCTION; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE FUNCTION "projdbSchema".block_completing_unpaid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
    IF NEW.status = 'Completed' THEN
        IF (
            SELECT COALESCE(SUM(p.amount), 0::money)
            FROM "projdbSchema"."Payment" p
            WHERE p."rentingID" = NEW."rentingID"
        ) < (
            SELECT r.price
            FROM "projdbSchema"."Room" r
            WHERE r."roomID" = NEW."roomID"
        ) THEN
            RAISE EXCEPTION 'Cannot complete renting: total payments do not meet the room price';
        END IF;
    END IF;
    RETURN NEW;
END;$$;


ALTER FUNCTION "projdbSchema".block_completing_unpaid() OWNER TO pg_database_owner;

--
-- TOC entry 251 (class 1255 OID 16700)
-- Name: block_overlapping_timeframes(); Type: FUNCTION; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE FUNCTION "projdbSchema".block_overlapping_timeframes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
    IF EXISTS (
        SELECT 1 FROM "projdbSchema"."Booking"
        WHERE "roomID" = NEW."roomID"
        AND "checkOutDate" > NEW."checkInDate"
        AND "checkInDate" < NEW."checkOutDate"
    ) OR EXISTS (
        SELECT 1 FROM "projdbSchema"."Renting"
        WHERE "roomID" = NEW."roomID"
        AND "checkOutDate" > NEW."checkInDate"
        AND "checkInDate" < NEW."checkOutDate"
    ) THEN
        RAISE EXCEPTION 'Overlapping booking or renting exists for this room';
    END IF;
    RETURN NEW;
END;$$;


ALTER FUNCTION "projdbSchema".block_overlapping_timeframes() OWNER TO pg_database_owner;

--
-- TOC entry 264 (class 1255 OID 16705)
-- Name: create_booking_archive(); Type: FUNCTION; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE FUNCTION "projdbSchema".create_booking_archive() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
	IF NEW.status IN ('Completed', 'Cancelled') AND OLD.status NOT IN ('Completed', 'Cancelled') THEN
        INSERT INTO "projdbSchema"."Booking_Archive" (
            "bookingID", "customerID", "custFullName", "custAddress",
            "custIDType", "custIDNumber", "roomID", "roomNumber",
            price, "hotelID", "hotelName", "hotelAddress",
            "chainID", "chainName", "checkInDate", "checkOutDate",
            "bookingDatetime", "archivedDatetime", "archivedStatus"
        )
        SELECT
            NEW."bookingID",
            c."customerID", c."custFullName", c."custAddress",
            c."custIDType", c."custIDNumber",
            r."roomID", r."roomNumber", r.price,
            h."hotelID", h."hotelName", h."hotelAddress",
            ch."chainID", ch."chainName",
            NEW."checkInDate", NEW."checkOutDate",
            NEW."bookingDatetime",
            CURRENT_TIMESTAMP,
            NEW.status
        FROM "projdbSchema"."Customer" c
        JOIN "projdbSchema"."Room" r ON r."roomID" = NEW."roomID"
        JOIN "projdbSchema"."Hotel" h ON h."hotelID" = r."hotelID"
        JOIN "projdbSchema"."Chain" ch ON ch."chainID" = h."chainID"
        WHERE c."customerID" = NEW."customerID";
    END IF;
    RETURN NEW;
END;$$;


ALTER FUNCTION "projdbSchema".create_booking_archive() OWNER TO pg_database_owner;

--
-- TOC entry 266 (class 1255 OID 16706)
-- Name: create_renting_archive(); Type: FUNCTION; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE FUNCTION "projdbSchema".create_renting_archive() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
	IF NEW.status IN ('Completed', 'Cancelled') AND OLD.status NOT IN ('Completed', 'Cancelled') THEN
        INSERT INTO "projdbSchema"."Renting_Archive" (
            "rentingID", "bookingID", "customerID", "custFullName",
            "custAddress", "custIDType", "custIDNumber",
            "roomID", "roomNumber", "roomPrice",
            "hotelID", "hotelName", "hotelAddress",
            "chainID", "chainName",
            "employeeID", "employeeFullName",
            "checkInDate", "checkOutDate",
            "actualCheckInDatetime", "actualCheckOutDatetime",
            "archivedDatetime", "archivedStatus", "totalPaid"
        )
        SELECT
            NEW."rentingID", NEW."bookingID",
            c."customerID", c."custFullName", c."custAddress",
            c."custIDType", c."custIDNumber",
            r."roomID", r."roomNumber", r.price,
            h."hotelID", h."hotelName", h."hotelAddress",
            ch."chainID", ch."chainName",
            e."employeeID", e."employeeFullName",
            NEW."checkInDate", NEW."checkOutDate",
            NEW."actualCheckInDatetime", NEW."actualCheckOutDatetime",
            CURRENT_TIMESTAMP,
            NEW.status,
            (SELECT COALESCE(SUM(amount), 0::money)
             FROM "projdbSchema"."Payment"
             WHERE "rentingID" = NEW."rentingID")
        FROM "projdbSchema"."Customer" c
        JOIN "projdbSchema"."Room" r ON r."roomID" = NEW."roomID"
        JOIN "projdbSchema"."Hotel" h ON h."hotelID" = r."hotelID"
        JOIN "projdbSchema"."Chain" ch ON ch."chainID" = h."chainID"
        LEFT JOIN "projdbSchema"."Employee" e ON e."employeeID" = NEW."employeeID"
        WHERE c."customerID" = NEW."customerID";
    END IF;
    RETURN NEW;
END;$$;


ALTER FUNCTION "projdbSchema".create_renting_archive() OWNER TO pg_database_owner;

--
-- TOC entry 250 (class 1255 OID 16698)
-- Name: update_booking_status_from_renting(); Type: FUNCTION; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE FUNCTION "projdbSchema".update_booking_status_from_renting() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
	UPDATE "projdbSchema"."Booking"
	SET status = NEW.status
	WHERE "bookingID" = NEW."bookingID";
	RETURN NEW;
END;$$;


ALTER FUNCTION "projdbSchema".update_booking_status_from_renting() OWNER TO pg_database_owner;

--
-- TOC entry 265 (class 1255 OID 16709)
-- Name: update_chain_hotelCount(); Type: FUNCTION; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE FUNCTION "projdbSchema"."update_chain_hotelCount"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "projdbSchema"."Chain"
        SET "hotelCount" = "hotelCount" + 1
        WHERE "chainID" = NEW."chainID";
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "projdbSchema"."Chain"
        SET "hotelCount" = "hotelCount" - 1
        WHERE "chainID" = OLD."chainID";
    END IF;
    RETURN NULL;
END;$$;


ALTER FUNCTION "projdbSchema"."update_chain_hotelCount"() OWNER TO pg_database_owner;

--
-- TOC entry 267 (class 1255 OID 16710)
-- Name: update_hotel_roomCount(); Type: FUNCTION; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE FUNCTION "projdbSchema"."update_hotel_roomCount"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "projdbSchema"."Hotel"
        SET "roomCount" = "roomCount" + 1
        WHERE "hotelID" = NEW."hotelID";
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "projdbSchema"."Hotel"
        SET "roomCount" = "roomCount" - 1
        WHERE "hotelID" = OLD."hotelID";
    END IF;
    RETURN NULL;
END;$$;


ALTER FUNCTION "projdbSchema"."update_hotel_roomCount"() OWNER TO pg_database_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16395)
-- Name: Amenity; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Amenity" (
    "amenityID" integer NOT NULL,
    "amenityName" text NOT NULL,
    description text
);


ALTER TABLE "projdbSchema"."Amenity" OWNER TO pg_database_owner;

--
-- TOC entry 221 (class 1259 OID 16402)
-- Name: Amenity_amenityID_seq; Type: SEQUENCE; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Amenity" ALTER COLUMN "amenityID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "projdbSchema"."Amenity_amenityID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 235 (class 1259 OID 16481)
-- Name: Hotel; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Hotel" (
    "hotelID" integer NOT NULL,
    "chainID" integer NOT NULL,
    "managerID" integer,
    "hotelAddress" text NOT NULL,
    "starCount" smallint,
    "roomCount" integer DEFAULT 0 NOT NULL,
    "hotelName" text,
    "hotelCity" text
);


ALTER TABLE "projdbSchema"."Hotel" OWNER TO pg_database_owner;

--
-- TOC entry 241 (class 1259 OID 16514)
-- Name: Renting; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Renting" (
    "rentingID" integer NOT NULL,
    "bookingID" integer,
    "customerID" integer NOT NULL,
    "roomID" integer NOT NULL,
    "employeeID" integer,
    "checkInDate" date,
    "checkOutDate" date,
    "actualCheckInDatetime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualCheckOutDatetime" timestamp without time zone,
    status text DEFAULT 'Active'::text NOT NULL
);


ALTER TABLE "projdbSchema"."Renting" OWNER TO pg_database_owner;

--
-- TOC entry 245 (class 1259 OID 16534)
-- Name: Room; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Room" (
    "roomID" integer NOT NULL,
    "hotelID" integer NOT NULL,
    "roomNumber" integer NOT NULL,
    price money NOT NULL,
    "viewType" text DEFAULT 'None'::text NOT NULL,
    extendable boolean DEFAULT false NOT NULL,
    "problemsDamages" text,
    capacity text DEFAULT 'Other'::text NOT NULL
);


ALTER TABLE "projdbSchema"."Room" OWNER TO pg_database_owner;

--
-- TOC entry 249 (class 1259 OID 16723)
-- Name: AvailableRoomsPerCity; Type: VIEW; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE VIEW "projdbSchema"."AvailableRoomsPerCity" AS
 SELECT h."hotelCity" AS city,
    count(r."roomID") AS "totalRooms"
   FROM ("projdbSchema"."Hotel" h
     JOIN "projdbSchema"."Room" r ON ((r."hotelID" = h."hotelID")))
  WHERE ((r."problemsDamages" IS NULL) AND (NOT (EXISTS ( SELECT 1
           FROM "projdbSchema"."Renting" rt
          WHERE ((rt."roomID" = r."roomID") AND (rt.status = 'Active'::text) AND (CURRENT_DATE >= rt."checkInDate") AND (CURRENT_DATE < rt."checkOutDate"))))))
  GROUP BY h."hotelCity";


ALTER VIEW "projdbSchema"."AvailableRoomsPerCity" OWNER TO pg_database_owner;

--
-- TOC entry 222 (class 1259 OID 16403)
-- Name: Booking; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Booking" (
    "bookingID" integer NOT NULL,
    "customerID" integer NOT NULL,
    "roomID" integer NOT NULL,
    "checkInDate" date NOT NULL,
    "checkOutDate" date NOT NULL,
    "bookingDatetime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL
);


ALTER TABLE "projdbSchema"."Booking" OWNER TO pg_database_owner;

--
-- TOC entry 223 (class 1259 OID 16417)
-- Name: Booking_Archive; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Booking_Archive" (
    "bookingArchiveID" integer NOT NULL,
    "bookingID" integer,
    "customerID" integer,
    "custFullName" text,
    "custAddress" text,
    "custIDType" text,
    "custIDNumber" text,
    "roomID" integer,
    "roomNumber" integer,
    price money,
    "hotelID" integer,
    "hotelName" text,
    "hotelAddress" text,
    "chainID" integer,
    "chainName" text,
    "checkInDate" date,
    "checkOutDate" date,
    "bookingDatetime" timestamp without time zone,
    "archivedDatetime" timestamp without time zone,
    "archivedStatus" text
);


ALTER TABLE "projdbSchema"."Booking_Archive" OWNER TO pg_database_owner;

--
-- TOC entry 224 (class 1259 OID 16423)
-- Name: Booking_Archive_bookingArchiveID_seq; Type: SEQUENCE; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Booking_Archive" ALTER COLUMN "bookingArchiveID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "projdbSchema"."Booking_Archive_bookingArchiveID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 225 (class 1259 OID 16424)
-- Name: Booking_bookingID_seq; Type: SEQUENCE; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Booking" ALTER COLUMN "bookingID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "projdbSchema"."Booking_bookingID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 248 (class 1259 OID 16717)
-- Name: CapacityPerHotel; Type: VIEW; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE VIEW "projdbSchema"."CapacityPerHotel" AS
 SELECT h."hotelID",
    h."hotelName",
    h."hotelAddress",
    sum(
        CASE r.capacity
            WHEN 'Single'::text THEN 1
            WHEN 'Double'::text THEN 2
            WHEN 'Suite'::text THEN 4
            ELSE 0
        END) AS "totalCapacity"
   FROM ("projdbSchema"."Hotel" h
     LEFT JOIN "projdbSchema"."Room" r ON ((r."hotelID" = h."hotelID")))
  GROUP BY h."hotelID", h."hotelName", h."hotelAddress";


ALTER VIEW "projdbSchema"."CapacityPerHotel" OWNER TO pg_database_owner;

--
-- TOC entry 226 (class 1259 OID 16425)
-- Name: Chain; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Chain" (
    "chainID" integer CONSTRAINT "CHain_chainID_not_null" NOT NULL,
    "chainName" text NOT NULL,
    "centralOfficeAddress" text NOT NULL,
    "hotelCount" integer DEFAULT 0 CONSTRAINT "CHain_hotelCount_not_null" NOT NULL
);


ALTER TABLE "projdbSchema"."Chain" OWNER TO pg_database_owner;

--
-- TOC entry 227 (class 1259 OID 16435)
-- Name: ChainEmail; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."ChainEmail" (
    "chainID" integer NOT NULL,
    email "projdbSchema"."EmailDomain" NOT NULL
);


ALTER TABLE "projdbSchema"."ChainEmail" OWNER TO pg_database_owner;

--
-- TOC entry 228 (class 1259 OID 16442)
-- Name: ChainPhone; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."ChainPhone" (
    "chainID" integer NOT NULL,
    "phoneNumber" "projdbSchema"."PhoneDomain" NOT NULL
);


ALTER TABLE "projdbSchema"."ChainPhone" OWNER TO pg_database_owner;

--
-- TOC entry 229 (class 1259 OID 16449)
-- Name: Chain_chainID_seq; Type: SEQUENCE; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Chain" ALTER COLUMN "chainID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "projdbSchema"."Chain_chainID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 230 (class 1259 OID 16450)
-- Name: Customer; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Customer" (
    "customerID" integer NOT NULL,
    "custFullName" text NOT NULL,
    "custAddress" text NOT NULL,
    "custIDType" text NOT NULL,
    "custIDNumber" text NOT NULL,
    "registrationDate" date DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE "projdbSchema"."Customer" OWNER TO pg_database_owner;

--
-- TOC entry 231 (class 1259 OID 16462)
-- Name: Customer_customerID_seq; Type: SEQUENCE; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Customer" ALTER COLUMN "customerID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "projdbSchema"."Customer_customerID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 232 (class 1259 OID 16463)
-- Name: Employee; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Employee" (
    "employeeID" integer NOT NULL,
    "hotelID" integer NOT NULL,
    "employeeFullName" text NOT NULL,
    "employeeAddress" text NOT NULL,
    "employeeSSN" text NOT NULL
);


ALTER TABLE "projdbSchema"."Employee" OWNER TO pg_database_owner;

--
-- TOC entry 233 (class 1259 OID 16473)
-- Name: EmployeeRole; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."EmployeeRole" (
    "employeeID" integer NOT NULL,
    role text NOT NULL
);


ALTER TABLE "projdbSchema"."EmployeeRole" OWNER TO pg_database_owner;

--
-- TOC entry 234 (class 1259 OID 16480)
-- Name: Employee_employeeID_seq; Type: SEQUENCE; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Employee" ALTER COLUMN "employeeID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "projdbSchema"."Employee_employeeID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 236 (class 1259 OID 16491)
-- Name: HotelEmail; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."HotelEmail" (
    "hotelID" integer NOT NULL,
    email "projdbSchema"."EmailDomain" NOT NULL
);


ALTER TABLE "projdbSchema"."HotelEmail" OWNER TO pg_database_owner;

--
-- TOC entry 237 (class 1259 OID 16498)
-- Name: HotelPhone; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."HotelPhone" (
    "hotelID" integer NOT NULL,
    "phoneNumber" "projdbSchema"."PhoneDomain" NOT NULL
);


ALTER TABLE "projdbSchema"."HotelPhone" OWNER TO pg_database_owner;

--
-- TOC entry 238 (class 1259 OID 16505)
-- Name: Hotel_hotelID_seq; Type: SEQUENCE; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Hotel" ALTER COLUMN "hotelID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "projdbSchema"."Hotel_hotelID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 239 (class 1259 OID 16506)
-- Name: Payment; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Payment" (
    "paymentID" integer NOT NULL,
    "rentingID" integer,
    amount money,
    "paymentDatetime" timestamp without time zone,
    "paymentMethod" text NOT NULL
);


ALTER TABLE "projdbSchema"."Payment" OWNER TO pg_database_owner;

--
-- TOC entry 240 (class 1259 OID 16513)
-- Name: Payment_paymentID_seq; Type: SEQUENCE; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Payment" ALTER COLUMN "paymentID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "projdbSchema"."Payment_paymentID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 242 (class 1259 OID 16526)
-- Name: Renting_Archive; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Renting_Archive" (
    "rentingArchiveID" integer NOT NULL,
    "rentingID" integer,
    "bookingID" integer,
    "customerID" integer,
    "custFullName" text,
    "custAddress" text,
    "custIDType" text,
    "custIDNumber" text,
    "roomID" integer,
    "roomNumber" integer,
    "roomPrice" money,
    "hotelID" integer,
    "hotelName" text,
    "hotelAddress" text,
    "chainID" integer,
    "chainName" text,
    "employeeID" integer,
    "employeeFullName" text,
    "checkInDate" date,
    "checkOutDate" date,
    "actualCheckInDatetime" timestamp without time zone,
    "actualCheckOutDatetime" timestamp without time zone,
    "archivedDatetime" timestamp without time zone,
    "archivedStatus" text,
    "totalPaid" money
);


ALTER TABLE "projdbSchema"."Renting_Archive" OWNER TO pg_database_owner;

--
-- TOC entry 243 (class 1259 OID 16532)
-- Name: Renting_Archive_rentingArchiveID_seq; Type: SEQUENCE; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Renting_Archive" ALTER COLUMN "rentingArchiveID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "projdbSchema"."Renting_Archive_rentingArchiveID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 244 (class 1259 OID 16533)
-- Name: Renting_rentingID_seq; Type: SEQUENCE; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Renting" ALTER COLUMN "rentingID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "projdbSchema"."Renting_rentingID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 246 (class 1259 OID 16549)
-- Name: Room_Amenity; Type: TABLE; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TABLE "projdbSchema"."Room_Amenity" (
    "roomID" integer NOT NULL,
    "amenityID" integer NOT NULL
);


ALTER TABLE "projdbSchema"."Room_Amenity" OWNER TO pg_database_owner;

--
-- TOC entry 247 (class 1259 OID 16554)
-- Name: Room_roomID_seq; Type: SEQUENCE; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Room" ALTER COLUMN "roomID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "projdbSchema"."Room_roomID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 5194 (class 0 OID 16395)
-- Dependencies: 220
-- Data for Name: Amenity; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Amenity" ("amenityID", "amenityName", description) FROM stdin;
\.


--
-- TOC entry 5196 (class 0 OID 16403)
-- Dependencies: 222
-- Data for Name: Booking; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Booking" ("bookingID", "customerID", "roomID", "checkInDate", "checkOutDate", "bookingDatetime", status) FROM stdin;
\.


--
-- TOC entry 5197 (class 0 OID 16417)
-- Dependencies: 223
-- Data for Name: Booking_Archive; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Booking_Archive" ("bookingArchiveID", "bookingID", "customerID", "custFullName", "custAddress", "custIDType", "custIDNumber", "roomID", "roomNumber", price, "hotelID", "hotelName", "hotelAddress", "chainID", "chainName", "checkInDate", "checkOutDate", "bookingDatetime", "archivedDatetime", "archivedStatus") FROM stdin;
\.


--
-- TOC entry 5200 (class 0 OID 16425)
-- Dependencies: 226
-- Data for Name: Chain; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Chain" ("chainID", "chainName", "centralOfficeAddress", "hotelCount") FROM stdin;
\.


--
-- TOC entry 5201 (class 0 OID 16435)
-- Dependencies: 227
-- Data for Name: ChainEmail; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."ChainEmail" ("chainID", email) FROM stdin;
\.


--
-- TOC entry 5202 (class 0 OID 16442)
-- Dependencies: 228
-- Data for Name: ChainPhone; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."ChainPhone" ("chainID", "phoneNumber") FROM stdin;
\.


--
-- TOC entry 5204 (class 0 OID 16450)
-- Dependencies: 230
-- Data for Name: Customer; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Customer" ("customerID", "custFullName", "custAddress", "custIDType", "custIDNumber", "registrationDate") FROM stdin;
\.


--
-- TOC entry 5206 (class 0 OID 16463)
-- Dependencies: 232
-- Data for Name: Employee; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Employee" ("employeeID", "hotelID", "employeeFullName", "employeeAddress", "employeeSSN") FROM stdin;
\.


--
-- TOC entry 5207 (class 0 OID 16473)
-- Dependencies: 233
-- Data for Name: EmployeeRole; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."EmployeeRole" ("employeeID", role) FROM stdin;
\.


--
-- TOC entry 5209 (class 0 OID 16481)
-- Dependencies: 235
-- Data for Name: Hotel; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Hotel" ("hotelID", "chainID", "managerID", "hotelAddress", "starCount", "roomCount", "hotelName", "hotelCity") FROM stdin;
\.


--
-- TOC entry 5210 (class 0 OID 16491)
-- Dependencies: 236
-- Data for Name: HotelEmail; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."HotelEmail" ("hotelID", email) FROM stdin;
\.


--
-- TOC entry 5211 (class 0 OID 16498)
-- Dependencies: 237
-- Data for Name: HotelPhone; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."HotelPhone" ("hotelID", "phoneNumber") FROM stdin;
\.


--
-- TOC entry 5213 (class 0 OID 16506)
-- Dependencies: 239
-- Data for Name: Payment; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Payment" ("paymentID", "rentingID", amount, "paymentDatetime", "paymentMethod") FROM stdin;
\.


--
-- TOC entry 5215 (class 0 OID 16514)
-- Dependencies: 241
-- Data for Name: Renting; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Renting" ("rentingID", "bookingID", "customerID", "roomID", "employeeID", "checkInDate", "checkOutDate", "actualCheckInDatetime", "actualCheckOutDatetime", status) FROM stdin;
\.


--
-- TOC entry 5216 (class 0 OID 16526)
-- Dependencies: 242
-- Data for Name: Renting_Archive; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Renting_Archive" ("rentingArchiveID", "rentingID", "bookingID", "customerID", "custFullName", "custAddress", "custIDType", "custIDNumber", "roomID", "roomNumber", "roomPrice", "hotelID", "hotelName", "hotelAddress", "chainID", "chainName", "employeeID", "employeeFullName", "checkInDate", "checkOutDate", "actualCheckInDatetime", "actualCheckOutDatetime", "archivedDatetime", "archivedStatus", "totalPaid") FROM stdin;
\.


--
-- TOC entry 5219 (class 0 OID 16534)
-- Dependencies: 245
-- Data for Name: Room; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Room" ("roomID", "hotelID", "roomNumber", price, "viewType", extendable, "problemsDamages", capacity) FROM stdin;
\.


--
-- TOC entry 5220 (class 0 OID 16549)
-- Dependencies: 246
-- Data for Name: Room_Amenity; Type: TABLE DATA; Schema: projdbSchema; Owner: pg_database_owner
--

COPY "projdbSchema"."Room_Amenity" ("roomID", "amenityID") FROM stdin;
\.


--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 221
-- Name: Amenity_amenityID_seq; Type: SEQUENCE SET; Schema: projdbSchema; Owner: pg_database_owner
--

SELECT pg_catalog.setval('"projdbSchema"."Amenity_amenityID_seq"', 1, false);


--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 224
-- Name: Booking_Archive_bookingArchiveID_seq; Type: SEQUENCE SET; Schema: projdbSchema; Owner: pg_database_owner
--

SELECT pg_catalog.setval('"projdbSchema"."Booking_Archive_bookingArchiveID_seq"', 1, false);


--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 225
-- Name: Booking_bookingID_seq; Type: SEQUENCE SET; Schema: projdbSchema; Owner: pg_database_owner
--

SELECT pg_catalog.setval('"projdbSchema"."Booking_bookingID_seq"', 1, false);


--
-- TOC entry 5231 (class 0 OID 0)
-- Dependencies: 229
-- Name: Chain_chainID_seq; Type: SEQUENCE SET; Schema: projdbSchema; Owner: pg_database_owner
--

SELECT pg_catalog.setval('"projdbSchema"."Chain_chainID_seq"', 1, false);


--
-- TOC entry 5232 (class 0 OID 0)
-- Dependencies: 231
-- Name: Customer_customerID_seq; Type: SEQUENCE SET; Schema: projdbSchema; Owner: pg_database_owner
--

SELECT pg_catalog.setval('"projdbSchema"."Customer_customerID_seq"', 1, false);


--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 234
-- Name: Employee_employeeID_seq; Type: SEQUENCE SET; Schema: projdbSchema; Owner: pg_database_owner
--

SELECT pg_catalog.setval('"projdbSchema"."Employee_employeeID_seq"', 1, false);


--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 238
-- Name: Hotel_hotelID_seq; Type: SEQUENCE SET; Schema: projdbSchema; Owner: pg_database_owner
--

SELECT pg_catalog.setval('"projdbSchema"."Hotel_hotelID_seq"', 1, false);


--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 240
-- Name: Payment_paymentID_seq; Type: SEQUENCE SET; Schema: projdbSchema; Owner: pg_database_owner
--

SELECT pg_catalog.setval('"projdbSchema"."Payment_paymentID_seq"', 1, false);


--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 243
-- Name: Renting_Archive_rentingArchiveID_seq; Type: SEQUENCE SET; Schema: projdbSchema; Owner: pg_database_owner
--

SELECT pg_catalog.setval('"projdbSchema"."Renting_Archive_rentingArchiveID_seq"', 1, false);


--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 244
-- Name: Renting_rentingID_seq; Type: SEQUENCE SET; Schema: projdbSchema; Owner: pg_database_owner
--

SELECT pg_catalog.setval('"projdbSchema"."Renting_rentingID_seq"', 1, false);


--
-- TOC entry 5238 (class 0 OID 0)
-- Dependencies: 247
-- Name: Room_roomID_seq; Type: SEQUENCE SET; Schema: projdbSchema; Owner: pg_database_owner
--

SELECT pg_catalog.setval('"projdbSchema"."Room_roomID_seq"', 1, false);


--
-- TOC entry 4976 (class 2606 OID 16556)
-- Name: Amenity Amenity_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Amenity"
    ADD CONSTRAINT "Amenity_pkey" PRIMARY KEY ("amenityID");


--
-- TOC entry 4981 (class 2606 OID 16558)
-- Name: Booking_Archive Booking_Archive_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Booking_Archive"
    ADD CONSTRAINT "Booking_Archive_pkey" PRIMARY KEY ("bookingArchiveID");


--
-- TOC entry 4978 (class 2606 OID 16560)
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY ("bookingID");


--
-- TOC entry 4985 (class 2606 OID 16562)
-- Name: ChainEmail ChainEmail_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."ChainEmail"
    ADD CONSTRAINT "ChainEmail_pkey" PRIMARY KEY ("chainID", email);


--
-- TOC entry 4987 (class 2606 OID 16564)
-- Name: ChainPhone ChainPhone_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."ChainPhone"
    ADD CONSTRAINT "ChainPhone_pkey" PRIMARY KEY ("chainID", "phoneNumber");


--
-- TOC entry 4983 (class 2606 OID 16566)
-- Name: Chain Chain_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Chain"
    ADD CONSTRAINT "Chain_pkey" PRIMARY KEY ("chainID");


--
-- TOC entry 4989 (class 2606 OID 16568)
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY ("customerID");


--
-- TOC entry 4997 (class 2606 OID 16570)
-- Name: EmployeeRole EmployeeRole_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."EmployeeRole"
    ADD CONSTRAINT "EmployeeRole_pkey" PRIMARY KEY ("employeeID", role);


--
-- TOC entry 4993 (class 2606 OID 16572)
-- Name: Employee Employee_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY ("employeeID");


--
-- TOC entry 5001 (class 2606 OID 16574)
-- Name: HotelEmail HotelEmail_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."HotelEmail"
    ADD CONSTRAINT "HotelEmail_pkey" PRIMARY KEY ("hotelID", email);


--
-- TOC entry 5003 (class 2606 OID 16576)
-- Name: HotelPhone HotelPhone_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."HotelPhone"
    ADD CONSTRAINT "HotelPhone_pkey" PRIMARY KEY ("hotelID", "phoneNumber");


--
-- TOC entry 4999 (class 2606 OID 16578)
-- Name: Hotel Hotel_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Hotel"
    ADD CONSTRAINT "Hotel_pkey" PRIMARY KEY ("hotelID");


--
-- TOC entry 5005 (class 2606 OID 16580)
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY ("paymentID");


--
-- TOC entry 5012 (class 2606 OID 16582)
-- Name: Renting_Archive Renting_Archive_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Renting_Archive"
    ADD CONSTRAINT "Renting_Archive_pkey" PRIMARY KEY ("rentingArchiveID");


--
-- TOC entry 5008 (class 2606 OID 16584)
-- Name: Renting Renting_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Renting"
    ADD CONSTRAINT "Renting_pkey" PRIMARY KEY ("rentingID");


--
-- TOC entry 5018 (class 2606 OID 16586)
-- Name: Room_Amenity Room_Amenity_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Room_Amenity"
    ADD CONSTRAINT "Room_Amenity_pkey" PRIMARY KEY ("roomID", "amenityID");


--
-- TOC entry 5014 (class 2606 OID 16588)
-- Name: Room Room_pkey; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Room"
    ADD CONSTRAINT "Room_pkey" PRIMARY KEY ("roomID");


--
-- TOC entry 4972 (class 2606 OID 16589)
-- Name: Room capacityCheck; Type: CHECK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Room"
    ADD CONSTRAINT "capacityCheck" CHECK ((capacity = ANY (ARRAY['Single'::text, 'Double'::text, 'Suite'::text, 'Other'::text]))) NOT VALID;


--
-- TOC entry 4964 (class 2606 OID 16590)
-- Name: Booking causalityCheck; Type: CHECK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Booking"
    ADD CONSTRAINT "causalityCheck" CHECK (("checkOutDate" > "checkInDate")) NOT VALID;


--
-- TOC entry 4969 (class 2606 OID 16591)
-- Name: Renting causalityCheck1; Type: CHECK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Renting"
    ADD CONSTRAINT "causalityCheck1" CHECK (((("checkOutDate" IS NULL) AND ("checkInDate" IS NULL)) OR ("checkOutDate" > "checkInDate"))) NOT VALID;


--
-- TOC entry 4970 (class 2606 OID 16592)
-- Name: Renting causalityCheck2; Type: CHECK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Renting"
    ADD CONSTRAINT "causalityCheck2" CHECK ((("actualCheckOutDatetime" IS NULL) OR ("actualCheckOutDatetime" > "actualCheckInDatetime"))) NOT VALID;


--
-- TOC entry 4967 (class 2606 OID 16593)
-- Name: Payment paymentAmountCheck; Type: CHECK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Payment"
    ADD CONSTRAINT "paymentAmountCheck" CHECK ((amount > (0)::money)) NOT VALID;


--
-- TOC entry 4968 (class 2606 OID 16594)
-- Name: Payment paymentMethodCheck; Type: CHECK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Payment"
    ADD CONSTRAINT "paymentMethodCheck" CHECK (("paymentMethod" = ANY (ARRAY['Credit'::text, 'Debit'::text, 'Cash'::text]))) NOT VALID;


--
-- TOC entry 4973 (class 2606 OID 16595)
-- Name: Room priceCheck; Type: CHECK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Room"
    ADD CONSTRAINT "priceCheck" CHECK ((price > (0)::money)) NOT VALID;


--
-- TOC entry 4966 (class 2606 OID 16596)
-- Name: Hotel starCountDomainCheck; Type: CHECK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Hotel"
    ADD CONSTRAINT "starCountDomainCheck" CHECK ((("starCount" IS NULL) OR (("starCount" >= 1) AND ("starCount" <= 5)))) NOT VALID;


--
-- TOC entry 4965 (class 2606 OID 16597)
-- Name: Booking statusCheck; Type: CHECK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Booking"
    ADD CONSTRAINT "statusCheck" CHECK ((status = ANY (ARRAY['Pending'::text, 'Confirmed'::text, 'Cancelled'::text, 'Completed'::text, 'Converted'::text]))) NOT VALID;


--
-- TOC entry 4971 (class 2606 OID 16598)
-- Name: Renting statusCheck; Type: CHECK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Renting"
    ADD CONSTRAINT "statusCheck" CHECK ((status = ANY (ARRAY['Active'::text, 'Completed'::text, 'Cancelled'::text]))) NOT VALID;


--
-- TOC entry 4991 (class 2606 OID 16600)
-- Name: Customer uniqueID; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Customer"
    ADD CONSTRAINT "uniqueID" UNIQUE ("custIDType", "custIDNumber");


--
-- TOC entry 5016 (class 2606 OID 16602)
-- Name: Room uniqueRoomNumber; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Room"
    ADD CONSTRAINT "uniqueRoomNumber" UNIQUE ("hotelID", "roomNumber");


--
-- TOC entry 4995 (class 2606 OID 16604)
-- Name: Employee uniqueSSN; Type: CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Employee"
    ADD CONSTRAINT "uniqueSSN" UNIQUE ("employeeSSN");


--
-- TOC entry 4974 (class 2606 OID 16605)
-- Name: Room viewTypeCheck; Type: CHECK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE "projdbSchema"."Room"
    ADD CONSTRAINT "viewTypeCheck" CHECK (("viewType" = ANY (ARRAY['Sea'::text, 'Mountain'::text, 'City'::text, 'None'::text]))) NOT VALID;


--
-- TOC entry 4979 (class 1259 OID 16729)
-- Name: booking_roomID_index; Type: INDEX; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE INDEX "booking_roomID_index" ON "projdbSchema"."Booking" USING btree ("roomID") WITH (deduplicate_items='true');


--
-- TOC entry 5006 (class 1259 OID 16730)
-- Name: payment_rentingID_index; Type: INDEX; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE INDEX "payment_rentingID_index" ON "projdbSchema"."Payment" USING btree ("rentingID") WITH (deduplicate_items='true');


--
-- TOC entry 5009 (class 1259 OID 16731)
-- Name: renting_bookingID_index; Type: INDEX; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE INDEX "renting_bookingID_index" ON "projdbSchema"."Renting" USING btree ("bookingID") WITH (deduplicate_items='true') WHERE ("bookingID" IS NOT NULL);


--
-- TOC entry 5010 (class 1259 OID 16728)
-- Name: renting_roomID_index; Type: INDEX; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE INDEX "renting_roomID_index" ON "projdbSchema"."Renting" USING btree ("roomID") WITH (deduplicate_items='true');


--
-- TOC entry 5037 (class 2620 OID 16707)
-- Name: Booking bookingArchiveComplete; Type: TRIGGER; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TRIGGER "bookingArchiveComplete" AFTER UPDATE OF status ON "projdbSchema"."Booking" FOR EACH ROW EXECUTE FUNCTION "projdbSchema".create_booking_archive();


--
-- TOC entry 5038 (class 2620 OID 16702)
-- Name: Booking bookingBlockOverlap; Type: TRIGGER; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TRIGGER "bookingBlockOverlap" BEFORE INSERT OR UPDATE OF "checkInDate", "checkOutDate" ON "projdbSchema"."Booking" FOR EACH ROW EXECUTE FUNCTION "projdbSchema".block_overlapping_timeframes();


--
-- TOC entry 5040 (class 2620 OID 16708)
-- Name: Renting rentingArchiveComplete; Type: TRIGGER; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TRIGGER "rentingArchiveComplete" AFTER UPDATE OF status ON "projdbSchema"."Renting" FOR EACH ROW EXECUTE FUNCTION "projdbSchema".create_renting_archive();


--
-- TOC entry 5041 (class 2620 OID 16704)
-- Name: Renting rentingBlockCompletingUnpaid; Type: TRIGGER; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TRIGGER "rentingBlockCompletingUnpaid" BEFORE UPDATE OF status ON "projdbSchema"."Renting" FOR EACH ROW EXECUTE FUNCTION "projdbSchema".block_completing_unpaid();


--
-- TOC entry 5042 (class 2620 OID 16701)
-- Name: Renting rentingBlockOverlap; Type: TRIGGER; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TRIGGER "rentingBlockOverlap" BEFORE INSERT OR UPDATE OF "checkInDate", "checkOutDate" ON "projdbSchema"."Renting" FOR EACH ROW EXECUTE FUNCTION "projdbSchema".block_overlapping_timeframes();


--
-- TOC entry 5043 (class 2620 OID 16699)
-- Name: Renting rentingBookingStatusTrigger; Type: TRIGGER; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TRIGGER "rentingBookingStatusTrigger" AFTER INSERT OR UPDATE OF status ON "projdbSchema"."Renting" FOR EACH ROW EXECUTE FUNCTION "projdbSchema".update_booking_status_from_renting();


--
-- TOC entry 5039 (class 2620 OID 16711)
-- Name: Hotel updateChainHotelCount; Type: TRIGGER; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TRIGGER "updateChainHotelCount" AFTER INSERT OR DELETE ON "projdbSchema"."Hotel" FOR EACH ROW EXECUTE FUNCTION "projdbSchema"."update_chain_hotelCount"();


--
-- TOC entry 5044 (class 2620 OID 16722)
-- Name: Room updateHotelRoomCount; Type: TRIGGER; Schema: projdbSchema; Owner: pg_database_owner
--

CREATE TRIGGER "updateHotelRoomCount" AFTER INSERT OR DELETE ON "projdbSchema"."Room" FOR EACH ROW EXECUTE FUNCTION "projdbSchema"."update_hotel_roomCount"();


--
-- TOC entry 5019 (class 2606 OID 16606)
-- Name: Booking Booking_fkeyCustomer; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Booking"
    ADD CONSTRAINT "Booking_fkeyCustomer" FOREIGN KEY ("customerID") REFERENCES "projdbSchema"."Customer"("customerID") ON DELETE CASCADE NOT VALID;


--
-- TOC entry 5020 (class 2606 OID 16611)
-- Name: Booking Booking_fkeyRoom; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Booking"
    ADD CONSTRAINT "Booking_fkeyRoom" FOREIGN KEY ("roomID") REFERENCES "projdbSchema"."Room"("roomID") ON DELETE CASCADE NOT VALID;


--
-- TOC entry 5021 (class 2606 OID 16616)
-- Name: ChainEmail ChainEmail_fkey; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."ChainEmail"
    ADD CONSTRAINT "ChainEmail_fkey" FOREIGN KEY ("chainID") REFERENCES "projdbSchema"."Chain"("chainID") ON DELETE CASCADE NOT VALID;


--
-- TOC entry 5022 (class 2606 OID 16621)
-- Name: ChainPhone ChainPhone_fkey; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."ChainPhone"
    ADD CONSTRAINT "ChainPhone_fkey" FOREIGN KEY ("chainID") REFERENCES "projdbSchema"."Chain"("chainID") ON DELETE CASCADE NOT VALID;


--
-- TOC entry 5024 (class 2606 OID 16626)
-- Name: EmployeeRole EmployeeRole_fkey; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."EmployeeRole"
    ADD CONSTRAINT "EmployeeRole_fkey" FOREIGN KEY ("employeeID") REFERENCES "projdbSchema"."Employee"("employeeID") ON DELETE CASCADE NOT VALID;


--
-- TOC entry 5023 (class 2606 OID 16631)
-- Name: Employee Employee_fkeyHotel; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Employee"
    ADD CONSTRAINT "Employee_fkeyHotel" FOREIGN KEY ("hotelID") REFERENCES "projdbSchema"."Hotel"("hotelID") ON DELETE RESTRICT NOT VALID;


--
-- TOC entry 5027 (class 2606 OID 16636)
-- Name: HotelEmail HotelEmail_fkey; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."HotelEmail"
    ADD CONSTRAINT "HotelEmail_fkey" FOREIGN KEY ("hotelID") REFERENCES "projdbSchema"."Hotel"("hotelID") ON DELETE CASCADE NOT VALID;


--
-- TOC entry 5028 (class 2606 OID 16641)
-- Name: HotelPhone HotelPhone_fkey; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."HotelPhone"
    ADD CONSTRAINT "HotelPhone_fkey" FOREIGN KEY ("hotelID") REFERENCES "projdbSchema"."Hotel"("hotelID") ON DELETE CASCADE NOT VALID;


--
-- TOC entry 5025 (class 2606 OID 16646)
-- Name: Hotel Hotel_fkeyChain; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Hotel"
    ADD CONSTRAINT "Hotel_fkeyChain" FOREIGN KEY ("chainID") REFERENCES "projdbSchema"."Chain"("chainID") ON DELETE RESTRICT NOT VALID;


--
-- TOC entry 5026 (class 2606 OID 16651)
-- Name: Hotel Hotel_fkeyManager; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Hotel"
    ADD CONSTRAINT "Hotel_fkeyManager" FOREIGN KEY ("managerID") REFERENCES "projdbSchema"."Employee"("employeeID") ON DELETE RESTRICT NOT VALID;


--
-- TOC entry 5029 (class 2606 OID 16656)
-- Name: Payment Payment_fkeyRenting; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Payment"
    ADD CONSTRAINT "Payment_fkeyRenting" FOREIGN KEY ("rentingID") REFERENCES "projdbSchema"."Renting"("rentingID") ON DELETE CASCADE NOT VALID;


--
-- TOC entry 5030 (class 2606 OID 16661)
-- Name: Renting Renting_fkeyBooking; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Renting"
    ADD CONSTRAINT "Renting_fkeyBooking" FOREIGN KEY ("bookingID") REFERENCES "projdbSchema"."Booking"("bookingID") ON DELETE SET NULL NOT VALID;


--
-- TOC entry 5031 (class 2606 OID 16666)
-- Name: Renting Renting_fkeyCustomer; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Renting"
    ADD CONSTRAINT "Renting_fkeyCustomer" FOREIGN KEY ("customerID") REFERENCES "projdbSchema"."Customer"("customerID") ON DELETE RESTRICT NOT VALID;


--
-- TOC entry 5032 (class 2606 OID 16671)
-- Name: Renting Renting_fkeyEmployee; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Renting"
    ADD CONSTRAINT "Renting_fkeyEmployee" FOREIGN KEY ("employeeID") REFERENCES "projdbSchema"."Employee"("employeeID") ON DELETE SET NULL NOT VALID;


--
-- TOC entry 5033 (class 2606 OID 16676)
-- Name: Renting Renting_fkeyRoom; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Renting"
    ADD CONSTRAINT "Renting_fkeyRoom" FOREIGN KEY ("roomID") REFERENCES "projdbSchema"."Room"("roomID") ON DELETE RESTRICT NOT VALID;


--
-- TOC entry 5035 (class 2606 OID 16681)
-- Name: Room_Amenity Room_Amenity_fkeyAmenity; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Room_Amenity"
    ADD CONSTRAINT "Room_Amenity_fkeyAmenity" FOREIGN KEY ("amenityID") REFERENCES "projdbSchema"."Amenity"("amenityID") ON DELETE RESTRICT NOT VALID;


--
-- TOC entry 5036 (class 2606 OID 16686)
-- Name: Room_Amenity Room_Amenity_fkeyRoom; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Room_Amenity"
    ADD CONSTRAINT "Room_Amenity_fkeyRoom" FOREIGN KEY ("roomID") REFERENCES "projdbSchema"."Room"("roomID") ON DELETE CASCADE NOT VALID;


--
-- TOC entry 5034 (class 2606 OID 16691)
-- Name: Room Room_fkeyHotel; Type: FK CONSTRAINT; Schema: projdbSchema; Owner: pg_database_owner
--

ALTER TABLE ONLY "projdbSchema"."Room"
    ADD CONSTRAINT "Room_fkeyHotel" FOREIGN KEY ("hotelID") REFERENCES "projdbSchema"."Hotel"("hotelID") ON DELETE RESTRICT NOT VALID;


-- Completed on 2026-03-29 20:36:22

--
-- PostgreSQL database dump complete
--

\unrestrict PPUDu0uagUoNb9xhDYFiIMRSQKSXzaQlaf3LsaZxnVeq0CV0Uwnod4JGI7b7HcL

