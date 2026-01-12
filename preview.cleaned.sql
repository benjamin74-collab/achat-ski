--
-- PostgreSQL database dump
--

\restrict fcOTzg54o9nPZoYgKc4B6wsSwrFakRrOAg7BpKKQeIVfKG9SNp8jhn3dd43YPzD

-- Dumped from database version 17.7 (e429a59)
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_avatarId_fkey";
ALTER TABLE IF EXISTS ONLY public."Sku" DROP CONSTRAINT IF EXISTS "Sku_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Review" DROP CONSTRAINT IF EXISTS "Review_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Review" DROP CONSTRAINT IF EXISTS "Review_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_brandId_fkey";
ALTER TABLE IF EXISTS ONLY public."Page" DROP CONSTRAINT IF EXISTS "Page_thumbnailId_fkey";
ALTER TABLE IF EXISTS ONLY public."Page" DROP CONSTRAINT IF EXISTS "Page_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."Page" DROP CONSTRAINT IF EXISTS "Page_bannerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Page" DROP CONSTRAINT IF EXISTS "Page_authorId_fkey";
ALTER TABLE IF EXISTS ONLY public."PageComment" DROP CONSTRAINT IF EXISTS "PageComment_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."PageComment" DROP CONSTRAINT IF EXISTS "PageComment_pageId_fkey";
ALTER TABLE IF EXISTS ONLY public."Offer" DROP CONSTRAINT IF EXISTS "Offer_skuId_fkey";
ALTER TABLE IF EXISTS ONLY public."Offer" DROP CONSTRAINT IF EXISTS "Offer_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."MediaAsset" DROP CONSTRAINT IF EXISTS "MediaAsset_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public."EmailVerificationToken" DROP CONSTRAINT IF EXISTS "EmailVerificationToken_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."EditorialTest" DROP CONSTRAINT IF EXISTS "EditorialTest_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."EditorialTest" DROP CONSTRAINT IF EXISTS "EditorialTest_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."EditorialTest" DROP CONSTRAINT IF EXISTS "EditorialTest_bannerId_fkey";
ALTER TABLE IF EXISTS ONLY public."EditorialTestScore" DROP CONSTRAINT IF EXISTS "EditorialTestScore_testId_fkey";
ALTER TABLE IF EXISTS ONLY public."EditorialTestScore" DROP CONSTRAINT IF EXISTS "EditorialTestScore_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."Click" DROP CONSTRAINT IF EXISTS "Click_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."Click" DROP CONSTRAINT IF EXISTS "Click_offerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public."Brand" DROP CONSTRAINT IF EXISTS "Brand_logoId_fkey";
ALTER TABLE IF EXISTS ONLY public."Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
DROP INDEX IF EXISTS public."VerificationToken_token_key";
DROP INDEX IF EXISTS public."VerificationToken_identifier_token_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."TestRatingCategory_slug_key";
DROP INDEX IF EXISTS public."Sku_gtin_key";
DROP INDEX IF EXISTS public."Session_sessionToken_key";
DROP INDEX IF EXISTS public."Review_status_idx";
DROP INDEX IF EXISTS public."Review_rating_idx";
DROP INDEX IF EXISTS public."Review_productId_idx";
DROP INDEX IF EXISTS public."Product_slug_key";
DROP INDEX IF EXISTS public."Product_gtin_key";
DROP INDEX IF EXISTS public."Product_categoryId_idx";
DROP INDEX IF EXISTS public."Product_brandId_idx";
DROP INDEX IF EXISTS public."Page_slug_key";
DROP INDEX IF EXISTS public."Offer_skuId_merchantId_key";
DROP INDEX IF EXISTS public."Merchant_slug_key";
DROP INDEX IF EXISTS public."Merchant_name_key";
DROP INDEX IF EXISTS public."MediaAsset_storageKey_key";
DROP INDEX IF EXISTS public."MediaAsset_slug_key";
DROP INDEX IF EXISTS public."EmailVerificationToken_token_key";
DROP INDEX IF EXISTS public."EditorialTest_status_idx";
DROP INDEX IF EXISTS public."EditorialTest_publishedAt_idx";
DROP INDEX IF EXISTS public."EditorialTest_productId_idx";
DROP INDEX IF EXISTS public."Category_slug_key";
DROP INDEX IF EXISTS public."Category_slug_idx";
DROP INDEX IF EXISTS public."Category_published_idx";
DROP INDEX IF EXISTS public."Category_parentId_order_idx";
DROP INDEX IF EXISTS public."Brand_slug_key";
DROP INDEX IF EXISTS public."Brand_name_key";
DROP INDEX IF EXISTS public."Account_provider_providerAccountId_key";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."TestRatingCategory" DROP CONSTRAINT IF EXISTS "TestRatingCategory_pkey";
ALTER TABLE IF EXISTS ONLY public."Sku" DROP CONSTRAINT IF EXISTS "Sku_pkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_pkey";
ALTER TABLE IF EXISTS ONLY public."Review" DROP CONSTRAINT IF EXISTS "Review_pkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_pkey";
ALTER TABLE IF EXISTS ONLY public."Page" DROP CONSTRAINT IF EXISTS "Page_pkey";
ALTER TABLE IF EXISTS ONLY public."PageComment" DROP CONSTRAINT IF EXISTS "PageComment_pkey";
ALTER TABLE IF EXISTS ONLY public."Offer" DROP CONSTRAINT IF EXISTS "Offer_pkey";
ALTER TABLE IF EXISTS ONLY public."Merchant" DROP CONSTRAINT IF EXISTS "Merchant_pkey";
ALTER TABLE IF EXISTS ONLY public."MediaAsset" DROP CONSTRAINT IF EXISTS "MediaAsset_pkey";
ALTER TABLE IF EXISTS ONLY public."ImportRun" DROP CONSTRAINT IF EXISTS "ImportRun_pkey";
ALTER TABLE IF EXISTS ONLY public."EmailVerificationToken" DROP CONSTRAINT IF EXISTS "EmailVerificationToken_pkey";
ALTER TABLE IF EXISTS ONLY public."EditorialTest" DROP CONSTRAINT IF EXISTS "EditorialTest_pkey";
ALTER TABLE IF EXISTS ONLY public."EditorialTestScore" DROP CONSTRAINT IF EXISTS "EditorialTestScore_pkey";
ALTER TABLE IF EXISTS ONLY public."Click" DROP CONSTRAINT IF EXISTS "Click_pkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_pkey";
ALTER TABLE IF EXISTS ONLY public."Brand" DROP CONSTRAINT IF EXISTS "Brand_pkey";
ALTER TABLE IF EXISTS ONLY public."Account" DROP CONSTRAINT IF EXISTS "Account_pkey";
ALTER TABLE IF EXISTS public."TestRatingCategory" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Sku" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Review" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Product" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."PageComment" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Page" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Offer" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Merchant" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."MediaAsset" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."ImportRun" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."EmailVerificationToken" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."EditorialTest" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Click" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Category" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Brand" ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."VerificationToken";
DROP TABLE IF EXISTS public."User";
DROP SEQUENCE IF EXISTS public."TestRatingCategory_id_seq";
DROP TABLE IF EXISTS public."TestRatingCategory";
DROP SEQUENCE IF EXISTS public."Sku_id_seq";
DROP TABLE IF EXISTS public."Sku";
DROP TABLE IF EXISTS public."Session";
DROP SEQUENCE IF EXISTS public."Review_id_seq";
DROP TABLE IF EXISTS public."Review";
DROP SEQUENCE IF EXISTS public."Product_id_seq";
DROP TABLE IF EXISTS public."Product";
DROP SEQUENCE IF EXISTS public."Page_id_seq";
DROP SEQUENCE IF EXISTS public."PageComment_id_seq";
DROP TABLE IF EXISTS public."PageComment";
DROP TABLE IF EXISTS public."Page";
DROP SEQUENCE IF EXISTS public."Offer_id_seq";
DROP TABLE IF EXISTS public."Offer";
DROP SEQUENCE IF EXISTS public."Merchant_id_seq";
DROP TABLE IF EXISTS public."Merchant";
DROP SEQUENCE IF EXISTS public."MediaAsset_id_seq";
DROP TABLE IF EXISTS public."MediaAsset";
DROP SEQUENCE IF EXISTS public."ImportRun_id_seq";
DROP TABLE IF EXISTS public."ImportRun";
DROP SEQUENCE IF EXISTS public."EmailVerificationToken_id_seq";
DROP TABLE IF EXISTS public."EmailVerificationToken";
DROP SEQUENCE IF EXISTS public."EditorialTest_id_seq";
DROP TABLE IF EXISTS public."EditorialTestScore";
DROP TABLE IF EXISTS public."EditorialTest";
DROP SEQUENCE IF EXISTS public."Click_id_seq";
DROP TABLE IF EXISTS public."Click";
DROP SEQUENCE IF EXISTS public."Category_id_seq";
DROP TABLE IF EXISTS public."Category";
DROP SEQUENCE IF EXISTS public."Brand_id_seq";
DROP TABLE IF EXISTS public."Brand";
DROP TABLE IF EXISTS public."Account";
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."PageKind";
DROP TYPE IF EXISTS public."ModerationStatus";
DROP TYPE IF EXISTS public."MediaKind";
--
-- Name: MediaKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MediaKind" AS ENUM (
    'IMAGE'
);


--
-- Name: ModerationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ModerationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: PageKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PageKind" AS ENUM (
    'GUIDE',
    'COMPARATIF',
    'ARTICLE'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'USER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


--
-- Name: Brand; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Brand" (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "websiteUrl" character varying(512),
    "logoUrl" character varying(512),
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "logoId" integer
);


--
-- Name: Brand_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Brand_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Brand_id_seq" OWNED BY public."Brand".id;


--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Category" (
    id integer NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    "parentId" integer,
    intro text,
    content text,
    "metaTitle" text,
    "metaDescription" text,
    "isInMenu" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    published boolean DEFAULT true NOT NULL,
    "mapKwanko" text[],
    "mapEkosport" text[],
    "mapSnowleader" text[],
    "mapGlisshop" text[],
    aliases text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Category_id_seq" OWNED BY public."Category".id;


--
-- Name: Click; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Click" (
    id bigint NOT NULL,
    "offerId" integer NOT NULL,
    "productId" integer NOT NULL,
    "priceCentsAtClick" integer NOT NULL,
    "subId" text,
    ts timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    referrer text
);


--
-- Name: Click_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Click_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Click_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Click_id_seq" OWNED BY public."Click".id;


--
-- Name: EditorialTest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EditorialTest" (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    "userId" text,
    title text NOT NULL,
    excerpt text NOT NULL,
    score double precision,
    "sourceName" text NOT NULL,
    "sourceUrl" text NOT NULL,
    status public."ModerationStatus" DEFAULT 'PENDING'::public."ModerationStatus" NOT NULL,
    "publishedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "bannerId" integer,
    "bannerUrl" text,
    content text
);


--
-- Name: EditorialTestScore; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EditorialTestScore" (
    "testId" integer NOT NULL,
    "categoryId" integer NOT NULL,
    score integer NOT NULL
);


--
-- Name: EditorialTest_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."EditorialTest_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: EditorialTest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."EditorialTest_id_seq" OWNED BY public."EditorialTest".id;


--
-- Name: EmailVerificationToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmailVerificationToken" (
    id integer NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: EmailVerificationToken_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."EmailVerificationToken_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: EmailVerificationToken_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."EmailVerificationToken_id_seq" OWNED BY public."EmailVerificationToken".id;


--
-- Name: ImportRun; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ImportRun" (
    id integer NOT NULL,
    source text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "finishedAt" timestamp(3) without time zone,
    "offersUpserted" integer DEFAULT 0 NOT NULL,
    "offersDisabled" integer DEFAULT 0 NOT NULL,
    notes text
);


--
-- Name: ImportRun_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ImportRun_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ImportRun_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ImportRun_id_seq" OWNED BY public."ImportRun".id;


--
-- Name: MediaAsset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MediaAsset" (
    id integer NOT NULL,
    slug text NOT NULL,
    title text,
    alt text,
    kind public."MediaKind" DEFAULT 'IMAGE'::public."MediaKind" NOT NULL,
    mime text NOT NULL,
    width integer,
    height integer,
    bytes integer,
    "storageKey" text NOT NULL,
    "publicUrl" character varying(1024) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdById" text
);


--
-- Name: MediaAsset_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MediaAsset_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MediaAsset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MediaAsset_id_seq" OWNED BY public."MediaAsset".id;


--
-- Name: Merchant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Merchant" (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    network text,
    "programId" text,
    status text
);


--
-- Name: Merchant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Merchant_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Merchant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Merchant_id_seq" OWNED BY public."Merchant".id;


--
-- Name: Offer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Offer" (
    id integer NOT NULL,
    "skuId" integer NOT NULL,
    "merchantId" integer NOT NULL,
    "affiliateUrl" text NOT NULL,
    "priceCents" integer NOT NULL,
    currency text NOT NULL,
    "inStock" boolean DEFAULT true NOT NULL,
    "shippingCents" integer,
    "lastSeen" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: Offer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Offer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Offer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Offer_id_seq" OWNED BY public."Offer".id;


--
-- Name: Page; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Page" (
    id integer NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    intro text,
    "thumbnailUrl" text,
    "bannerUrl" text,
    "authorId" text,
    published boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "metaTitle" text,
    "metaDescription" text,
    tags text[],
    "bannerId" integer,
    "thumbnailId" integer,
    "categoryId" integer,
    kind public."PageKind" DEFAULT 'ARTICLE'::public."PageKind" NOT NULL
);


--
-- Name: PageComment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PageComment" (
    id integer NOT NULL,
    "pageId" integer NOT NULL,
    "userId" text NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    published boolean DEFAULT true NOT NULL
);


--
-- Name: PageComment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PageComment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PageComment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PageComment_id_seq" OWNED BY public."PageComment".id;


--
-- Name: Page_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Page_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Page_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Page_id_seq" OWNED BY public."Page".id;


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    id integer NOT NULL,
    brand text,
    model text NOT NULL,
    season text,
    "categoryId" integer,
    gtin text,
    slug text NOT NULL,
    attributes jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description text,
    "brandId" integer
);


--
-- Name: Product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;


--
-- Name: Review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Review" (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    "userId" text,
    rating integer NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    "authorName" text,
    "sourceName" text,
    "sourceUrl" text,
    status public."ModerationStatus" DEFAULT 'PENDING'::public."ModerationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Review_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Review_id_seq" OWNED BY public."Review".id;


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Name: Sku; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Sku" (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    variant text,
    gtin text,
    attributes jsonb
);


--
-- Name: Sku_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Sku_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Sku_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Sku_id_seq" OWNED BY public."Sku".id;


--
-- Name: TestRatingCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TestRatingCategory" (
    id integer NOT NULL,
    slug text NOT NULL,
    label text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TestRatingCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."TestRatingCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: TestRatingCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."TestRatingCategory_id_seq" OWNED BY public."TestRatingCategory".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text,
    "emailVerified" timestamp(3) without time zone,
    image text,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "avatarId" integer,
    "firstName" text,
    "lastName" text,
    "marketingOptIn" boolean DEFAULT false NOT NULL,
    "passwordHash" text,
    pseudo text
);


--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: Brand id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Brand" ALTER COLUMN id SET DEFAULT nextval('public."Brand_id_seq"'::regclass);


--
-- Name: Category id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category" ALTER COLUMN id SET DEFAULT nextval('public."Category_id_seq"'::regclass);


--
-- Name: Click id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Click" ALTER COLUMN id SET DEFAULT nextval('public."Click_id_seq"'::regclass);


--
-- Name: EditorialTest id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EditorialTest" ALTER COLUMN id SET DEFAULT nextval('public."EditorialTest_id_seq"'::regclass);


--
-- Name: EmailVerificationToken id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailVerificationToken" ALTER COLUMN id SET DEFAULT nextval('public."EmailVerificationToken_id_seq"'::regclass);


--
-- Name: ImportRun id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ImportRun" ALTER COLUMN id SET DEFAULT nextval('public."ImportRun_id_seq"'::regclass);


--
-- Name: MediaAsset id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MediaAsset" ALTER COLUMN id SET DEFAULT nextval('public."MediaAsset_id_seq"'::regclass);


--
-- Name: Merchant id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Merchant" ALTER COLUMN id SET DEFAULT nextval('public."Merchant_id_seq"'::regclass);


--
-- Name: Offer id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Offer" ALTER COLUMN id SET DEFAULT nextval('public."Offer_id_seq"'::regclass);


--
-- Name: Page id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Page" ALTER COLUMN id SET DEFAULT nextval('public."Page_id_seq"'::regclass);


--
-- Name: PageComment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageComment" ALTER COLUMN id SET DEFAULT nextval('public."PageComment_id_seq"'::regclass);


--
-- Name: Product id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);


--
-- Name: Review id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review" ALTER COLUMN id SET DEFAULT nextval('public."Review_id_seq"'::regclass);


--
-- Name: Sku id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sku" ALTER COLUMN id SET DEFAULT nextval('public."Sku_id_seq"'::regclass);


--
-- Name: TestRatingCategory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TestRatingCategory" ALTER COLUMN id SET DEFAULT nextval('public."TestRatingCategory_id_seq"'::regclass);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: Brand; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Brand" (id, name, slug, description, "websiteUrl", "logoUrl", active, "createdAt", "updatedAt", "logoId") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Category" (id, slug, name, "parentId", intro, content, "metaTitle", "metaDescription", "isInMenu", "order", published, "mapKwanko", "mapEkosport", "mapSnowleader", "mapGlisshop", aliases, "createdAt", "updatedAt") FROM stdin;
2	snowboard	Snowboard	\N	Description courte catégorie snowboard	Description longue catégorie snowboard	\N	\N	t	2	t	{}	{}	{}	{}	{}	2025-12-28 17:14:51.816	2025-12-28 17:14:51.816
1	ski	Ski	\N	Description courte catégorie ski	Description longue catégorie ski	\N	\N	f	1	f	{}	{}	{}	{}	{}	2025-12-28 17:14:15.981	2026-01-05 21:05:12.881
4	skis	Skis	\N	Comparez les meilleurs skis (piste, all-mountain, freeride, freestyle, randonnée, junior) et trouvez le modèle adapté à votre niveau, votre terrain et votre budget.	<p>\n  Les <strong>skis</strong> influencent directement votre plaisir sur la neige : stabilité, accroche, facilité en virage, tolérance\n  et confiance à vitesse plus élevée. Avant de comparer les prix, l’essentiel est de choisir une famille de skis cohérente avec\n  votre pratique : <a href="/skis-piste">skis de piste</a> pour la précision sur neige damée, <a href="/skis-all-mountain">skis all-mountain</a>\n  pour la polyvalence, <a href="/skis-freeride">skis freeride</a> pour la portance en neige profonde, <a href="/skis-freestyle">skis freestyle</a>\n  pour le park et la maniabilité, ou <a href="/skis-randonnee">skis de randonnée</a> si vous privilégiez la montée sans renoncer à la descente.\n</p>\n\n<p>\n  Sur Meilleur-Ski, notre objectif est simple : vous aider à comprendre les différences entre modèles, éviter les erreurs de choix,\n  puis <strong>comparer les offres</strong> chez plusieurs revendeurs. Si vous souhaitez une solution “clé en main”, jetez aussi un œil aux\n  <a href="/packs-skis">packs skis + fixations</a>, souvent pratiques pour équiper un ski de piste ou un ski polyvalent.\n</p>\n\n<h2>À quoi servent les skis ?</h2>\n<p>\n  Un ski doit à la fois glisser et tenir : il doit rester stable, accrocher sur neige dure et se montrer prévisible quand la neige change.\n  Son comportement dépend de critères techniques simples à comprendre : <strong>largeur au patin</strong>, <strong>rayon</strong> (facilité à tourner),\n  <strong>flex</strong> (tolérance vs précision), et profil <strong>rocker/cambre</strong> (maniabilité, portance, accroche).\n  Ces paramètres n’ont de valeur que s’ils sont alignés avec votre terrain : piste, bords de piste, hors-piste ou montée en randonnée.\n</p>\n\n<h2>Comment bien choisir ses skis ?</h2>\n<p>\n  Le bon choix repose sur trois piliers : votre <strong>niveau</strong>, votre <strong>usage dominant</strong> et votre <strong>morphologie</strong>.\n  L’idée n’est pas de viser “le ski le plus performant”, mais celui qui vous fera skier mieux et plus longtemps, avec moins de fatigue.\n</p>\n\n<h3>Niveau du skieur</h3>\n<ul>\n  <li><strong>Débutant</strong> : privilégiez la tolérance et la facilité de déclenchement. Un ski trop rigide pénalise la progression.</li>\n  <li><strong>Intermédiaire</strong> : cherchez un équilibre stabilité/maniabilité, souvent excellent en <a href="/skis-all-mountain">all-mountain</a>.</li>\n  <li><strong>Confirmé / expert</strong> : vous pouvez viser plus de rigidité et de précision, notamment en <a href="/skis-piste">piste</a> ou en <a href="/skis-freeride">freeride</a> selon votre terrain.</li>\n</ul>\n\n<h3>Usage et terrain</h3>\n<ul>\n  <li><a href="/skis-piste"><strong>Piste</strong></a> : priorité à l’accroche, à la précision et à la stabilité sur neige damée.</li>\n  <li><a href="/skis-all-mountain"><strong>All-mountain</strong></a> : le meilleur choix si vous skiez “un peu de tout” (piste + conditions variables).</li>\n  <li><a href="/skis-freeride"><strong>Freeride</strong></a> : largeur et portance pour flotter, stabilité en neige profonde.</li>\n  <li><a href="/skis-freestyle"><strong>Freestyle</strong></a> : maniabilité, souvent twin-tip, pour le park et les rotations.</li>\n  <li><a href="/skis-randonnee"><strong>Randonnée</strong></a> : compromis poids/efficacité pour monter, puis sécurité et contrôle à la descente.</li>\n</ul>\n\n<h3>Taille, poids et longueur</h3>\n<p>\n  La longueur et le gabarit du ski doivent rester cohérents avec votre morphologie. Un ski trop long devient exigeant et fatigue,\n  un ski trop court peut manquer de stabilité. En général, plus vous cherchez de maniabilité et de facilité, plus vous raccourcissez\n  légèrement ; plus vous cherchez de stabilité et d’appui, plus vous pouvez allonger modérément. Pour les plus jeunes, passez directement\n  par <a href="/skis-junior">skis junior</a> : la construction et les tailles y sont adaptées à la progression.\n</p>\n\n<h3>Construction et sensations</h3>\n<p>\n  Les renforts (carbone/titanal), le noyau et le profil influencent la relance, l’accroche et la tolérance. Ne vous fiez pas uniquement\n  aux promesses marketing : choisissez d’abord la famille adaptée (piste, all-mountain, freeride…) puis affinez la construction selon votre niveau\n  et votre style de ski.\n</p>\n\n<h3>Erreurs fréquentes à éviter</h3>\n<ul>\n  <li>Prendre un ski trop technique “pour progresser” : c’est souvent l’inverse qui se produit (fatigue, perte de confiance).</li>\n  <li>Choisir un ski trop spécialisé si votre pratique est variée : dans ce cas, <a href="/skis-all-mountain">l’all-mountain</a> est souvent plus pertinent.</li>\n  <li>Oublier l’équipement complet : les <a href="/packs-skis">packs skis + fixations</a> simplifient l’achat et garantissent une configuration cohérente.</li>\n</ul>\n\n<h2>Les différents types de skis</h2>\n<p>\n  Pour choisir rapidement, partez de l’usage dominant, puis comparez dans la bonne catégorie :\n</p>\n<ul>\n  <li><a href="/skis-piste"><strong>Skis de piste</strong></a> : précision et accroche sur neige damée.</li>\n  <li><a href="/skis-all-mountain"><strong>Skis all-mountain</strong></a> : polyvalence et confort dans la majorité des conditions.</li>\n  <li><a href="/skis-freeride"><strong>Skis freeride</strong></a> : portance, stabilité et contrôle hors-piste.</li>\n  <li><a href="/skis-freestyle"><strong>Skis freestyle</strong></a> : maniabilité et comportement joueur, souvent twin-tip.</li>\n  <li><a href="/skis-randonnee"><strong>Skis de randonnée</strong></a> : efficacité à la montée, confiance à la descente.</li>\n  <li><a href="/skis-junior"><strong>Skis junior</strong></a> : tailles et constructions adaptées aux enfants.</li>\n</ul>\n\n<h2>Les meilleures marques de skis</h2>\n<p>\n  Les marques se distinguent par leur spécialité (piste, polyvalence, freeride, randonnée), leurs choix de construction et la cohérence\n  de leurs gammes. Plutôt que de choisir “une marque”, l’approche la plus efficace consiste à choisir un type de ski adapté, puis à comparer\n  les modèles disponibles et leurs offres. C’est exactement ce que permet Meilleur-Ski.\n</p>\n\n<h2>Comparer les prix des skis</h2>\n<p>\n  Le prix d’une paire de skis varie selon la saison, les stocks, les promotions et la collection (nouveautés ou saisons précédentes).\n  Une fois la bonne famille identifiée (<a href="/skis-piste">piste</a>, <a href="/skis-all-mountain">all-mountain</a>, <a href="/skis-freeride">freeride</a>, etc.),\n  comparer plusieurs revendeurs est souvent la manière la plus simple d’obtenir le meilleur rapport performance/prix.\n</p>\n\n<h2>FAQ – Tout savoir sur les skis</h2>\n<dl>\n  <dt><strong>Quelle est la différence entre skis piste et skis all-mountain ?</strong></dt>\n  <dd>Les skis de piste privilégient l’accroche et la précision sur neige damée. Les all-mountain ajoutent de la polyvalence et une meilleure adaptation aux neiges changeantes et aux bords de piste.</dd>\n\n  <dt><strong>Quelle longueur de skis choisir ?</strong></dt>\n  <dd>La longueur dépend du niveau, du poids, de la taille et de l’usage. Plus court = maniable et facile, plus long = stable et rassurant à vitesse. L’essentiel est de rester cohérent avec votre pratique.</dd>\n\n  <dt><strong>Faut-il changer ses skis régulièrement ?</strong></dt>\n  <dd>Un ski entretenu peut durer plusieurs saisons. On change surtout quand on évolue (piste vers freeride/randonnée) ou si le ski a perdu en accroche et en tenue.</dd>\n\n  <dt><strong>Les skis sont-ils vendus avec fixations ?</strong></dt>\n  <dd>Certains modèles sont proposés en pack skis + fixations, d’autres nécessitent de choisir les fixations séparément. Les <a href="/packs-skis">packs skis + fixations</a> sont souvent une solution simple et cohérente.</dd>\n\n  <dt><strong>Skis neufs ou skis de saison précédente ?</strong></dt>\n  <dd>Les skis de saisons précédentes offrent souvent un excellent rapport qualité/prix, avec des technologies très proches des nouveautés.</dd>\n</dl>\n\n<h2>Bien choisir ses skis avec Meilleur-Ski</h2>\n<p>\n  Commencez par définir votre usage dominant, choisissez la famille de skis correspondante, puis affinez selon votre niveau et votre morphologie.\n  Ensuite, comparez les offres : c’est la méthode la plus efficace pour trouver le bon modèle au bon prix.\n</p>\n	Skis : comparer les meilleurs modèles au meilleur prix | Meilleur-Ski	Comparez les skis (piste, all-mountain, freeride, freestyle, rando, junior). Conseils d’expert pour bien choisir et trouver le meilleur prix chez les revendeurs.	t	1	t	{}	{}	{}	{}	{}	2026-01-05 21:04:30.426	2026-01-05 21:10:50.052
3	chaussure-de-ski	Chaussure de ski	\N	Description courte catégorie chaussure de ski	Description longue catégorie chaussure de ski	\N	\N	t	3	t	{}	{}	{}	{}	{}	2025-12-28 17:15:26.252	2026-01-05 21:11:27.583
8	skis-all-mountain	Skis All Mountain	4	Les skis all-mountain sont le choix idéal pour skier partout. Comparez les modèles polyvalents piste et hors-piste et trouvez le meilleur prix.	<p>\n  Les <strong>skis all-mountain</strong> sont conçus pour les skieurs qui veulent un ski capable de s’adapter à la majorité des\n  situations en montagne. Ni exclusivement orientés <a href="/skis-piste">piste</a>, ni aussi larges que des\n  <a href="/skis-freeride">skis freeride</a>, ils offrent un excellent compromis entre accroche sur neige damée,\n  stabilité en conditions variables et facilité de prise en main.\n</p>\n\n<p>\n  Si vous skiez sur piste mais que vous aimez sortir des tracés quand la neige est bonne, ou si vous cherchez un ski unique\n  pour toute la saison, l’all-mountain est souvent le choix le plus cohérent. Sur Meilleur-Ski, nous vous aidons à comprendre\n  les différences entre modèles et à <strong>comparer les prix</strong> pour trouver le ski all-mountain le plus adapté à votre pratique.\n</p>\n\n<h2>À quoi servent les skis all-mountain ?</h2>\n<p>\n  Un ski all-mountain est pensé pour évoluer aussi bien sur neige damée que sur neige transformée, trafollée ou légèrement\n  poudreuse. Sa largeur intermédiaire (généralement plus large qu’un ski de piste, mais plus étroite qu’un freeride pur)\n  lui permet de rester stable tout en conservant une bonne accroche.\n</p>\n<p>\n  C’est le ski “passe-partout” par excellence : idéal pour les stations aux conditions changeantes, pour les skieurs qui\n  alternent pistes et bords de piste, ou pour ceux qui ne veulent pas multiplier les paires de skis.\n</p>\n\n<h2>Comment bien choisir ses skis all-mountain ?</h2>\n<p>\n  Le choix d’un ski all-mountain dépend principalement de votre niveau, de votre manière de skier et de l’équilibre que vous\n  recherchez entre précision sur piste et tolérance hors des traces.\n</p>\n\n<h3>Niveau du skieur</h3>\n<ul>\n  <li><strong>Débutant à intermédiaire</strong> : privilégiez un ski tolérant, facile à déclencher et rassurant à vitesse modérée.</li>\n  <li><strong>Intermédiaire à confirmé</strong> : recherchez un bon équilibre entre stabilité et maniabilité.</li>\n  <li><strong>Confirmé / expert</strong> : vous pouvez viser un ski plus rigide, plus précis, avec une meilleure tenue à haute vitesse.</li>\n</ul>\n\n<h3>Largeur et comportement</h3>\n<p>\n  La largeur au patin influence directement le comportement du ski. Un all-mountain plutôt étroit se rapprochera du\n  <a href="/skis-piste">ski de piste</a>, tandis qu’un modèle plus large offrira plus de portance et se rapprochera\n  d’un <a href="/skis-freeride">ski freeride</a>. Le bon choix dépend de la part de piste et de hors-piste dans votre pratique.\n</p>\n\n<h3>Construction et sensations</h3>\n<p>\n  Noyau bois, renforts carbone ou titanal, rocker plus ou moins marqué : ces éléments jouent sur la stabilité, la relance\n  et la tolérance. Un ski rigide sera plus précis mais plus exigeant ; un ski plus souple sera plus facile et plus joueur.\n</p>\n\n<h3>Erreurs fréquentes à éviter</h3>\n<ul>\n  <li>Choisir un ski trop orienté piste si vous sortez souvent des tracés.</li>\n  <li>Prendre un modèle trop large si vous skiez majoritairement sur neige damée.</li>\n  <li>Sous-estimer l’importance de la longueur et du flex par rapport à votre gabarit.</li>\n</ul>\n\n<h2>Skis all-mountain ou autre type de skis ?</h2>\n<p>\n  L’all-mountain est un excellent compromis, mais il n’est pas toujours le plus pertinent selon votre usage principal.\n</p>\n<ul>\n  <li>Si vous skiez presque exclusivement sur neige damée : orientez-vous plutôt vers des <a href="/skis-piste">skis de piste</a>.</li>\n  <li>Si vous recherchez avant tout la portance en poudreuse : privilégiez des <a href="/skis-freeride">skis freeride</a>.</li>\n  <li>Si vous pratiquez la montée avec des peaux : les <a href="/skis-randonnee">skis de randonnée</a> seront plus adaptés.</li>\n</ul>\n\n<h2>Skis all-mountain et packs skis + fixations</h2>\n<p>\n  Les skis all-mountain sont très souvent proposés en <a href="/packs-skis">packs skis + fixations</a>. Cette solution permet\n  de bénéficier d’un ensemble cohérent, correctement réglé et souvent plus économique qu’un achat séparé.\n  C’est une option particulièrement intéressante pour une pratique polyvalente.\n</p>\n\n<h2>Les meilleures marques de skis all-mountain</h2>\n<p>\n  De nombreuses marques proposent aujourd’hui des gammes all-mountain très abouties. Elles se distinguent par leur ADN\n  (plus ou moins sportif, plus ou moins joueur), leurs choix de construction et leur tolérance.\n  L’essentiel reste de comparer les modèles en fonction de votre pratique réelle plutôt que de vous fier uniquement au nom.\n</p>\n\n<h2>Comparer les prix des skis all-mountain</h2>\n<p>\n  Les skis all-mountain existent dans une large gamme de prix selon la saison, la technologie embarquée et l’année de sortie.\n  Comparer les offres de plusieurs revendeurs permet souvent de trouver d’excellentes opportunités, notamment sur les\n  modèles des saisons précédentes.\n</p>\n<p>\n  Une fois le bon type identifié, prenez le temps de comparer les prix et les disponibilités pour choisir le ski all-mountain\n  offrant le meilleur rapport performance/prix.\n</p>\n\n<h2>FAQ – Tout savoir sur les skis all-mountain</h2>\n<dl>\n  <dt><strong>Qu’est-ce qu’un ski all-mountain ?</strong></dt>\n  <dd>Un ski all-mountain est un ski polyvalent, capable de performer sur piste tout en restant efficace en neige variable et en bords de piste.</dd>\n\n  <dt><strong>Les skis all-mountain conviennent-ils aux débutants ?</strong></dt>\n  <dd>Oui, à condition de choisir un modèle tolérant et pas trop rigide. Certains skis all-mountain sont très accessibles pour progresser.</dd>\n\n  <dt><strong>Peut-on skier en poudreuse avec des skis all-mountain ?</strong></dt>\n  <dd>Oui, surtout avec des modèles un peu plus larges. Toutefois, en poudreuse profonde et régulière, des skis freeride restent plus adaptés.</dd>\n\n  <dt><strong>Quelle différence entre skis all-mountain et skis freeride ?</strong></dt>\n  <dd>Les skis freeride sont plus larges et orientés hors-piste, tandis que les skis all-mountain cherchent un équilibre entre piste et hors-piste.</dd>\n\n  <dt><strong>Faut-il choisir un pack skis all-mountain ?</strong></dt>\n  <dd>Les packs skis + fixations sont souvent une solution simple et économique, particulièrement adaptée aux skis all-mountain.</dd>\n</dl>\n\n<h2>Bien choisir ses skis all-mountain</h2>\n<p>\n  Si vous cherchez une paire de skis capable de vous accompagner toute la saison, sur piste comme en conditions variables,\n  les skis all-mountain représentent souvent le meilleur compromis. Définissez votre niveau, votre terrain dominant,\n  puis comparez les offres pour trouver le modèle le plus adapté à votre façon de skier.\n</p>\n	Skis all-mountain : polyvalence piste et hors-piste | Meilleur-Ski	Comparez les skis all-mountain : polyvalents sur piste et en neige variable. Conseils d’expert pour choisir le bon modèle au meilleur prix.	t	1	t	{}	{}	{}	{}	{}	2026-01-05 21:25:09.394	2026-01-05 21:25:09.394
9	skis-piste	Skis Piste	4	Les skis de piste sont conçus pour la précision et l’accroche sur neige damée. Comparez les modèles et trouvez le meilleur prix selon votre niveau.	<p>\n  Les <strong>skis de piste</strong> sont conçus pour offrir un maximum de précision, d’accroche et de stabilité sur neige damée.\n  Ils s’adressent aux skieurs qui passent l’essentiel de leur temps sur les pistes, recherchent des virages propres et une\n  sensation de contrôle à vitesse plus ou moins élevée. Contrairement aux <a href="/skis-all-mountain">skis all-mountain</a>,\n  ils privilégient la performance sur piste plutôt que la polyvalence hors des tracés.\n</p>\n\n<p>\n  Si votre pratique se concentre principalement sur neige damée, ou si vous aimez enchaîner les virages bien coupés,\n  le ski de piste est le choix le plus logique. Sur Meilleur-Ski, nous vous aidons à comprendre les différences entre modèles\n  et à <strong>comparer les prix</strong> pour choisir le ski de piste le plus adapté à votre niveau.\n</p>\n\n<h2>À quoi servent les skis de piste ?</h2>\n<p>\n  Un ski de piste est pensé pour accrocher sur neige dure, rester stable à vitesse élevée et offrir une grande précision\n  en entrée et en sortie de virage. Sa largeur réduite par rapport aux autres familles permet un passage de carre à carre\n  rapide et efficace.\n</p>\n<p>\n  Ce type de ski est idéal pour les pistes damées, les conditions froides ou compactes et pour les skieurs qui recherchent\n  des sensations proches du carving, avec une trajectoire maîtrisée du début à la fin du virage.\n</p>\n\n<h2>Comment bien choisir ses skis de piste ?</h2>\n<p>\n  Le choix d’un ski de piste repose principalement sur votre niveau technique, votre vitesse de prédilection et votre\n  tolérance à un ski plus ou moins exigeant.\n</p>\n\n<h3>Niveau du skieur</h3>\n<ul>\n  <li><strong>Débutant</strong> : skis tolérants, faciles à déclencher, favorisant la progression.</li>\n  <li><strong>Intermédiaire</strong> : bon compromis entre accroche et maniabilité.</li>\n  <li><strong>Confirmé / expert</strong> : skis plus rigides et précis, conçus pour tenir à haute vitesse.</li>\n</ul>\n\n<h3>Rayon de courbe et comportement</h3>\n<p>\n  Le rayon de courbe influence la manière dont le ski engage le virage. Un rayon court favorise les virages serrés et dynamiques,\n  tandis qu’un rayon plus long apporte plus de stabilité dans les grandes courbes. Le bon choix dépend de votre style de ski\n  et du type de pistes que vous fréquentez.\n</p>\n\n<h3>Construction et sensations</h3>\n<p>\n  Les skis de piste utilisent souvent des renforts (titanal, carbone) pour améliorer la tenue sur neige dure et la stabilité.\n  Plus la construction est rigide, plus le ski est précis… mais aussi plus exigeant physiquement.\n</p>\n\n<h3>Erreurs fréquentes à éviter</h3>\n<ul>\n  <li>Choisir un ski trop rigide par rapport à son niveau.</li>\n  <li>Prendre un ski trop long, au détriment de la maniabilité.</li>\n  <li>Opter pour un ski de piste pur si vous sortez régulièrement des pistes (dans ce cas, un <a href="/skis-all-mountain">all-mountain</a> est souvent plus adapté).</li>\n</ul>\n\n<h2>Skis de piste ou skis all-mountain ?</h2>\n<p>\n  Le ski de piste est idéal si vous skiez presque exclusivement sur neige damée et recherchez de la précision.\n  Si vous aimez varier les terrains ou skier quand les conditions changent, les <a href="/skis-all-mountain">skis all-mountain</a>\n  offrent plus de polyvalence, au prix d’une légère perte de performance pure sur piste.\n</p>\n\n<h2>Skis de piste et packs skis + fixations</h2>\n<p>\n  Les skis de piste sont très souvent proposés en <a href="/packs-skis">packs skis + fixations</a>. Cette solution permet\n  d’obtenir un ensemble cohérent, bien réglé et généralement plus économique qu’un achat séparé.\n  C’est une option particulièrement intéressante pour une pratique sur piste.\n</p>\n\n<h2>Les meilleures marques de skis de piste</h2>\n<p>\n  Les marques spécialisées dans le ski alpin proposent des gammes de skis de piste très variées, allant de modèles accessibles\n  pour la progression à des skis très performants pour skieurs confirmés. L’important est de comparer les modèles selon leur\n  comportement réel sur la neige, et non uniquement selon leur positionnement marketing.\n</p>\n\n<h2>Comparer les prix des skis de piste</h2>\n<p>\n  Les skis de piste existent dans une large gamme de prix selon leur niveau de performance et leur année de sortie.\n  Comparer les offres chez plusieurs revendeurs permet souvent de réaliser de belles économies, notamment sur les modèles\n  des saisons précédentes.\n</p>\n<p>\n  Une fois votre niveau et votre type de ski définis, prenez le temps de comparer les prix pour trouver le ski de piste\n  offrant le meilleur rapport performance/prix.\n</p>\n\n<h2>FAQ – Tout savoir sur les skis de piste</h2>\n<dl>\n  <dt><strong>Qu’est-ce qu’un ski de piste ?</strong></dt>\n  <dd>Un ski de piste est conçu pour la neige damée, avec une forte accroche et une grande précision en virage.</dd>\n\n  <dt><strong>Les skis de piste conviennent-ils aux débutants ?</strong></dt>\n  <dd>Oui, à condition de choisir un modèle tolérant et adapté au niveau. Certains skis de piste sont spécifiquement conçus pour la progression.</dd>\n\n  <dt><strong>Peut-on sortir des pistes avec des skis de piste ?</strong></dt>\n  <dd>C’est possible ponctuellement, mais leur largeur et leur conception ne sont pas idéales pour la neige profonde ou trafollée.</dd>\n\n  <dt><strong>Quelle différence entre skis de piste et skis carving ?</strong></dt>\n  <dd>Le terme “carving” désigne une manière de skier. Les skis de piste modernes sont presque tous conçus pour faciliter le carving.</dd>\n\n  <dt><strong>Faut-il choisir un pack skis de piste ?</strong></dt>\n  <dd>Les <a href="/packs-skis">packs skis + fixations</a> sont souvent une solution simple et économique pour le ski de piste.</dd>\n</dl>\n\n<h2>Bien choisir ses skis de piste</h2>\n<p>\n  Si vous recherchez précision, accroche et sensations sur neige damée, les skis de piste sont le choix le plus pertinent.\n  Définissez votre niveau, votre style de virage et votre vitesse de prédilection, puis comparez les offres pour trouver\n  le modèle le plus adapté à votre façon de skier.\n</p>\n	Skis de piste : précision et accroche sur neige damée | Meilleur-Ski	Comparez les skis de piste pour carver avec précision. Conseils d’expert pour choisir le bon modèle selon votre niveau et trouver le meilleur prix.	t	2	t	{}	{}	{}	{}	{}	2026-01-05 21:29:13.219	2026-01-05 21:29:13.219
10	skis-freeride	Skis Freeride	4	Les skis freeride sont conçus pour le hors-piste et la poudreuse. Comparez les modèles et trouvez le ski adapté à votre terrain et à votre niveau.	<p>\n  Les <strong>skis freeride</strong> sont destinés aux skieurs qui recherchent avant tout de la portance, de la stabilité\n  et du contrôle hors des pistes damées. Plus larges que des <a href="/skis-piste">skis de piste</a> ou des\n  <a href="/skis-all-mountain">skis all-mountain</a>, ils sont conçus pour évoluer dans la poudreuse, la neige trafollée\n  et les terrains variés que l’on rencontre en hors-piste.\n</p>\n\n<p>\n  Si votre plaisir se trouve dans la neige profonde, les bords de piste non tracés ou les itinéraires engagés,\n  le freeride est la famille de skis la plus adaptée. Sur Meilleur-Ski, nous vous aidons à comprendre les différences\n  entre modèles et à <strong>comparer les prix</strong> pour choisir des skis freeride cohérents avec votre pratique.\n</p>\n\n<h2>À quoi servent les skis freeride ?</h2>\n<p>\n  Un ski freeride est conçu pour flotter en neige profonde et rester stable quand les conditions deviennent irrégulières.\n  Sa largeur importante sous le pied augmente la portance, tandis que le rocker prononcé facilite la maniabilité\n  et le pivotement dans la poudreuse.\n</p>\n<p>\n  Ces skis sont particulièrement efficaces en hors-piste, dans les champs de poudreuse, la neige trafollée ou\n  les conditions de fin de journée. En contrepartie, ils sont moins vifs et moins précis sur piste qu’un ski plus étroit.\n</p>\n\n<h2>Comment bien choisir ses skis freeride ?</h2>\n<p>\n  Le choix d’un ski freeride dépend de votre niveau, de votre fréquence de pratique hors-piste et du compromis que vous\n  souhaitez entre portance, stabilité et maniabilité.\n</p>\n\n<h3>Niveau du skieur</h3>\n<ul>\n  <li><strong>Intermédiaire</strong> : choisissez un ski freeride accessible, pas trop rigide, pour rester tolérant et progressif.</li>\n  <li><strong>Confirmé</strong> : vous pouvez viser un ski plus stable, capable de tenir à vitesse soutenue en terrain variable.</li>\n  <li><strong>Expert</strong> : skis plus rigides et performants, conçus pour les pentes engagées et la vitesse en hors-piste.</li>\n</ul>\n\n<h3>Largeur et portance</h3>\n<p>\n  La largeur au patin est un critère clé. Plus un ski est large, plus il flotte en poudreuse, mais plus il devient\n  exigeant sur piste. Un freeride “modéré” peut rester polyvalent, tandis qu’un freeride très large sera dédié\n  quasi exclusivement au hors-piste.\n</p>\n\n<h3>Construction et stabilité</h3>\n<p>\n  Les skis freeride utilisent souvent des constructions robustes, avec des renforts pour encaisser la vitesse,\n  les réceptions et les terrains accidentés. Un ski plus rigide sera très stable, mais demandera une bonne technique\n  et un bon engagement physique.\n</p>\n\n<h3>Erreurs fréquentes à éviter</h3>\n<ul>\n  <li>Choisir un ski trop large si vous skiez souvent sur piste.</li>\n  <li>Prendre un modèle trop rigide sans avoir le niveau technique adapté.</li>\n  <li>Négliger la longueur et le rayon, essentiels pour la stabilité en hors-piste.</li>\n</ul>\n\n<h2>Skis freeride ou skis all-mountain ?</h2>\n<p>\n  Le ski freeride est idéal si vous skiez majoritairement hors-piste ou recherchez avant tout la poudreuse.\n  Si votre pratique est plus variée, avec une part importante de piste, les\n  <a href="/skis-all-mountain">skis all-mountain</a> offrent un meilleur compromis.\n</p>\n\n<h2>Skis freeride et ski de randonnée</h2>\n<p>\n  Certains skieurs utilisent des skis freeride équipés de fixations spécifiques pour accéder à des zones non desservies\n  par les remontées. Toutefois, si la montée fait partie intégrante de votre pratique, il est souvent plus pertinent\n  de s’orienter vers des <a href="/skis-randonnee">skis de randonnée</a> ou des modèles freerando, plus légers et plus adaptés\n  à l’effort en montée.\n</p>\n\n<h2>Skis freeride et packs skis + fixations</h2>\n<p>\n  Les skis freeride peuvent être proposés en <a href="/packs-skis">packs skis + fixations</a>, notamment pour une pratique\n  orientée station et hors-piste accessible. Cette solution garantit une compatibilité correcte et simplifie l’achat,\n  mais elle doit être choisie avec soin selon votre programme de ski.\n</p>\n\n<h2>Les meilleures marques de skis freeride</h2>\n<p>\n  De nombreuses marques développent des gammes freeride très spécialisées, avec des modèles axés sur la poudreuse,\n  la stabilité à haute vitesse ou la polyvalence hors-piste. L’essentiel reste de comparer les caractéristiques techniques\n  et le comportement réel sur la neige plutôt que de se fier uniquement au positionnement marketing.\n</p>\n\n<h2>Comparer les prix des skis freeride</h2>\n<p>\n  Les skis freeride couvrent une large gamme de prix selon leur construction, leur largeur et leur orientation.\n  Comparer les offres chez plusieurs revendeurs permet souvent de trouver des opportunités intéressantes,\n  notamment sur les modèles des saisons précédentes.\n</p>\n<p>\n  Une fois votre programme clairement défini, prenez le temps de comparer les prix pour choisir des skis freeride\n  offrant le meilleur compromis entre performance, stabilité et budget.\n</p>\n\n<h2>FAQ – Tout savoir sur les skis freeride</h2>\n<dl>\n  <dt><strong>Qu’est-ce qu’un ski freeride ?</strong></dt>\n  <dd>Un ski freeride est un ski large, conçu pour la poudreuse et le hors-piste, offrant portance et stabilité en terrain variable.</dd>\n\n  <dt><strong>Les skis freeride sont-ils adaptés à la piste ?</strong></dt>\n  <dd>Ils peuvent être skiés sur piste, mais leur largeur les rend moins précis et moins dynamiques que des skis plus étroits.</dd>\n\n  <dt><strong>Quelle largeur choisir pour un ski freeride ?</strong></dt>\n  <dd>Plus la pratique est orientée poudreuse, plus la largeur peut être importante. Pour un usage mixte, une largeur modérée est plus polyvalente.</dd>\n\n  <dt><strong>Peut-on débuter le hors-piste avec des skis freeride ?</strong></dt>\n  <dd>Oui, à condition de choisir un modèle tolérant et de progresser avec encadrement et matériel de sécurité adapté.</dd>\n\n  <dt><strong>Skis freeride ou freerando ?</strong></dt>\n  <dd>Le freeride est orienté descente, le freerando intègre la montée. Si vous marchez souvent, des skis de randonnée seront plus adaptés.</dd>\n</dl>\n\n<h2>Bien choisir ses skis freeride</h2>\n<p>\n  Si votre terrain de jeu principal est le hors-piste et la neige profonde, les skis freeride sont le choix le plus logique.\n  Définissez votre niveau, votre fréquence de pratique et votre besoin de portance, puis comparez les offres pour trouver\n  le modèle le plus adapté à votre façon de skier.\n</p>\n	Skis freeride : portance et stabilité en poudreuse | Meilleur-Ski	Comparez les skis freeride pour le hors-piste et la poudreuse. Conseils d’expert pour choisir le bon modèle et trouver le meilleur prix.	t	2	t	{}	{}	{}	{}	{}	2026-01-06 21:17:43.098	2026-01-06 21:17:43.098
11	skis-freestyle	Skis Freestyle	4	Les skis freestyle sont conçus pour le park, les modules et un ski joueur. Comparez les modèles et trouvez le meilleur prix selon votre pratique.	<p>\n  Les <strong>skis freestyle</strong> sont destinés aux skieurs qui privilégient le jeu, la créativité et les figures,\n  que ce soit en snowpark, sur les modules ou en ski urbain. Contrairement aux\n  <a href="/skis-piste">skis de piste</a> orientés précision ou aux\n  <a href="/skis-freeride">skis freeride</a> conçus pour la poudreuse, le freestyle mise sur la maniabilité,\n  la tolérance et un comportement joueur.\n</p>\n\n<p>\n  Si vous aimez enchaîner les sauts, les rails ou skier de manière ludique sur piste et en bords de piste,\n  le freestyle est la famille la plus adaptée. Sur Meilleur-Ski, nous vous aidons à comprendre les différences\n  entre modèles et à <strong>comparer les prix</strong> pour choisir des skis freestyle cohérents avec votre style.\n</p>\n\n<h2>À quoi servent les skis freestyle ?</h2>\n<p>\n  Un ski freestyle est conçu pour faciliter les rotations, les réceptions et le ski en switch (marche arrière).\n  La majorité des modèles sont <strong>twin-tip</strong>, avec des spatules relevées à l’avant et à l’arrière,\n  afin de skier et d’atterrir dans les deux sens.\n</p>\n<p>\n  Leur construction privilégie la maniabilité et la tolérance pour absorber les réceptions de sauts,\n  rester stable sur les rails et conserver un comportement joueur sur piste.\n</p>\n\n<h2>Comment bien choisir ses skis freestyle ?</h2>\n<p>\n  Le choix d’un ski freestyle dépend de votre niveau, du type de modules que vous pratiquez et de l’équilibre\n  recherché entre solidité, souplesse et polyvalence.\n</p>\n\n<h3>Niveau du skieur</h3>\n<ul>\n  <li><strong>Débutant</strong> : skis souples et tolérants pour apprendre les bases en toute confiance.</li>\n  <li><strong>Intermédiaire</strong> : bon compromis entre stabilité et maniabilité pour progresser sur différents modules.</li>\n  <li><strong>Confirmé / expert</strong> : skis plus solides et plus stables, capables d’encaisser des réceptions engagées.</li>\n</ul>\n\n<h3>Flex et comportement</h3>\n<p>\n  Le flex est un critère central en freestyle. Un ski plus souple sera joueur, facile à presser sur les rails\n  et tolérant à basse vitesse. Un ski plus rigide offrira plus de stabilité sur les gros sauts,\n  mais demandera plus de technique et d’engagement.\n</p>\n\n<h3>Largeur et polyvalence</h3>\n<p>\n  Certains skis freestyle restent assez étroits et très orientés park, tandis que d’autres sont plus larges\n  et permettent de skier aussi en neige variable. Si vous cherchez un ski unique pour le park et la piste,\n  un modèle proche de l’<a href="/skis-all-mountain">all-mountain</a> peut être un bon compromis.\n</p>\n\n<h3>Erreurs fréquentes à éviter</h3>\n<ul>\n  <li>Choisir un ski trop rigide si vous skiez principalement sur des modules techniques.</li>\n  <li>Prendre un ski trop étroit si vous sortez souvent du park.</li>\n  <li>Sous-estimer l’importance de la solidité pour les réceptions répétées.</li>\n</ul>\n\n<h2>Skis freestyle ou skis all-mountain ?</h2>\n<p>\n  Les skis freestyle sont idéaux pour le park et le ski joueur. Si votre pratique est plus variée,\n  avec une part importante de piste et de conditions changeantes, les\n  <a href="/skis-all-mountain">skis all-mountain</a> offriront davantage de polyvalence.\n</p>\n\n<h2>Skis freestyle et ski freeride</h2>\n<p>\n  Certains skis freestyle dits “backcountry” permettent de sortir du park pour skier en poudreuse légère.\n  Toutefois, pour une vraie pratique hors-piste, les\n  <a href="/skis-freeride">skis freeride</a> restent plus adaptés en termes de portance et de stabilité.\n</p>\n\n<h2>Skis freestyle et packs skis + fixations</h2>\n<p>\n  Les skis freestyle peuvent être proposés en <a href="/packs-skis">packs skis + fixations</a>, notamment pour\n  une pratique park et piste. Cette solution permet de bénéficier d’un ensemble cohérent et souvent plus économique,\n  à condition de vérifier que les fixations correspondent bien à votre programme.\n</p>\n\n<h2>Les meilleures marques de skis freestyle</h2>\n<p>\n  De nombreuses marques développent des skis freestyle reconnus pour leur solidité, leur tolérance et leur comportement joueur.\n  Certaines sont très orientées park, d’autres proposent des modèles plus polyvalents.\n  Comparer les caractéristiques techniques reste la meilleure approche pour choisir.\n</p>\n\n<h2>Comparer les prix des skis freestyle</h2>\n<p>\n  Les skis freestyle existent dans une large gamme de prix selon leur construction et leur orientation.\n  Comparer les offres de plusieurs revendeurs permet souvent de trouver des modèles performants à prix réduit,\n  notamment sur les collections des saisons précédentes.\n</p>\n<p>\n  Une fois votre style de ski défini, prenez le temps de comparer les prix pour choisir des skis freestyle\n  offrant le meilleur équilibre entre solidité, maniabilité et budget.\n</p>\n\n<h2>FAQ – Tout savoir sur les skis freestyle</h2>\n<dl>\n  <dt><strong>Qu’est-ce qu’un ski freestyle ?</strong></dt>\n  <dd>Un ski freestyle est conçu pour le park, les figures et le ski joueur, avec une grande maniabilité et souvent une forme twin-tip.</dd>\n\n  <dt><strong>Les skis freestyle sont-ils adaptés à la piste ?</strong></dt>\n  <dd>Oui, ils peuvent être skiés sur piste, mais ils sont généralement moins précis et moins accrocheurs que des skis de piste.</dd>\n\n  <dt><strong>Quelle différence entre freestyle et freeride ?</strong></dt>\n  <dd>Le freestyle est orienté figures et park, tandis que le freeride est conçu pour la poudreuse et le hors-piste.</dd>\n\n  <dt><strong>Faut-il choisir des skis freestyle souples ou rigides ?</strong></dt>\n  <dd>Les skis souples sont plus joueurs et tolérants, les skis rigides plus stables sur les gros sauts. Le choix dépend du niveau et du style.</dd>\n\n  <dt><strong>Les packs skis freestyle sont-ils intéressants ?</strong></dt>\n  <dd>Les <a href="/packs-skis">packs skis + fixations</a> peuvent être une solution simple et économique pour une pratique freestyle.</dd>\n</dl>\n\n<h2>Bien choisir ses skis freestyle</h2>\n<p>\n  Si votre plaisir passe par le park, les modules et un ski créatif, les skis freestyle sont faits pour vous.\n  Définissez votre niveau, votre type de modules et votre besoin de polyvalence, puis comparez les offres\n  pour trouver le modèle le plus adapté à votre façon de skier.\n</p>\n	Skis freestyle : park, modules et ski joueur | Meilleur-Ski	Comparez les skis freestyle pour le park, les modules et le ski joueur. Conseils d’expert pour choisir le bon modèle au meilleur prix.	t	3	t	{}	{}	{}	{}	{}	2026-01-06 21:19:45.28	2026-01-06 21:19:45.28
\.


--
-- Data for Name: Click; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Click" (id, "offerId", "productId", "priceCentsAtClick", "subId", ts, referrer) FROM stdin;
\.


--
-- Data for Name: EditorialTest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EditorialTest" (id, "productId", "userId", title, excerpt, score, "sourceName", "sourceUrl", status, "publishedAt", "bannerId", "bannerUrl", content) FROM stdin;
\.


--
-- Data for Name: EditorialTestScore; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EditorialTestScore" ("testId", "categoryId", score) FROM stdin;
\.


--
-- Data for Name: EmailVerificationToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EmailVerificationToken" (id, token, "userId", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: ImportRun; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ImportRun" (id, source, "startedAt", "finishedAt", "offersUpserted", "offersDisabled", notes) FROM stdin;
\.


--
-- Data for Name: MediaAsset; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MediaAsset" (id, slug, title, alt, kind, mime, width, height, bytes, "storageKey", "publicUrl", "createdAt", "createdById") FROM stdin;
\.


--
-- Data for Name: Merchant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Merchant" (id, name, slug, network, "programId", status) FROM stdin;
\.


--
-- Data for Name: Offer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Offer" (id, "skuId", "merchantId", "affiliateUrl", "priceCents", currency, "inStock", "shippingCents", "lastSeen") FROM stdin;
\.


--
-- Data for Name: Page; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Page" (id, slug, title, content, intro, "thumbnailUrl", "bannerUrl", "authorId", published, "createdAt", "updatedAt", "metaTitle", "metaDescription", tags, "bannerId", "thumbnailId", "categoryId", kind) FROM stdin;
\.


--
-- Data for Name: PageComment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PageComment" (id, "pageId", "userId", body, "createdAt", "updatedAt", published) FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" (id, brand, model, season, "categoryId", gtin, slug, attributes, "createdAt", description, "brandId") FROM stdin;
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Review" (id, "productId", "userId", rating, title, body, "authorName", "sourceName", "sourceUrl", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: Sku; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Sku" (id, "productId", variant, gtin, attributes) FROM stdin;
\.


--
-- Data for Name: TestRatingCategory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TestRatingCategory" (id, slug, label, "order", active, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, name, email, "emailVerified", image, role, "createdAt", "updatedAt", "avatarId", "firstName", "lastName", "marketingOptIn", "passwordHash", pseudo) FROM stdin;
cmjpzmyak0000l8046emyfro3	Admin	contact@meilleur-ski.com	\N	\N	ADMIN	2025-12-28 17:13:06.238	2026-01-05 20:52:51.008	\N	\N	\N	f	\N	\N
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
7644a043-0ae0-4a5e-92aa-b2e7c94d2ac2	b643b078153e3a7c6870ae24bcdb0eb6118bc93b308c997871098511074b69b0	2025-12-28 11:03:43.2294+00	20251022085139_baseline_from_current_schema	\N	\N	2025-12-28 11:03:42.502062+00	1
fc5a079d-ee65-4a74-b418-ded24ff8e28e	b44eb8d0c88ac6e3c816c9df8dccb85e5bd1b3881801406f72b9a57bb96b1ebb	2025-12-28 11:03:43.891024+00	20251104142043_add_brand_model_and_product_fk	\N	\N	2025-12-28 11:03:43.414612+00	1
32a3e6a8-b521-4de0-8c2a-c6da7ce78f55	9125132955247aeb9104bef76d6dda6cb8a5ab354e7a9f4853d5bda001f3447b	2025-12-28 11:03:44.557974+00	20251105215335_fix_pages_user_relations	\N	\N	2025-12-28 11:03:44.076154+00	1
83c6064a-fb96-4853-a93f-891d823cebda	863a3965cd9863156c81f1ce7c725edc4e812f57713dc25fb170e670bbccde2a	2025-12-28 11:03:45.220388+00	20251106134525_media_created_by	\N	\N	2025-12-28 11:03:44.743628+00	1
f06eddcc-3f77-432d-bc02-a140e023e746	6c52c2c2f1ceb6122c64ffb1a131ac5be5c4f82b8c8090ccd4edf86c97fb3571	2025-12-28 11:03:45.870831+00	20251110081733_page_kind_and_category	\N	\N	2025-12-28 11:03:45.405687+00	1
4e8f8709-a06b-4117-a19b-328ee4fc9b4f	b17e52d5ee270b1ec0baa06625a6acc2abcc3777877016de58e6cfe65a6ef9a8	2025-12-28 11:03:46.535295+00	20251125110805_test_ratings	\N	\N	2025-12-28 11:03:46.055916+00	1
be27468a-93a6-4712-9960-da8b0afc1c93	1eb0df3fa714341a50a674410f639251b7629122c27420618d7b45d96da60bb0	2025-12-28 11:03:47.192811+00	20251126172132_add_user_profile_fields	\N	\N	2025-12-28 11:03:46.720697+00	1
abd4a80a-45cc-4acb-8477-48a21d20bf42	bd11a1605557e7684349bd481e0ad1ed455b33cd8f6df103eb4035f7c95ca65b	2025-12-28 11:03:47.854046+00	20251128125533_add_email_verification_token	\N	\N	2025-12-28 11:03:47.377929+00	1
\.


--
-- Name: Brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Brand_id_seq"', 1, false);


--
-- Name: Category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Category_id_seq"', 11, true);


--
-- Name: Click_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Click_id_seq"', 1, false);


--
-- Name: EditorialTest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."EditorialTest_id_seq"', 1, false);


--
-- Name: EmailVerificationToken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."EmailVerificationToken_id_seq"', 1, false);


--
-- Name: ImportRun_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ImportRun_id_seq"', 1, false);


--
-- Name: MediaAsset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."MediaAsset_id_seq"', 1, false);


--
-- Name: Merchant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Merchant_id_seq"', 1, false);


--
-- Name: Offer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Offer_id_seq"', 1, false);


--
-- Name: PageComment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PageComment_id_seq"', 1, false);


--
-- Name: Page_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Page_id_seq"', 1, false);


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Product_id_seq"', 1, false);


--
-- Name: Review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Review_id_seq"', 1, false);


--
-- Name: Sku_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Sku_id_seq"', 1, false);


--
-- Name: TestRatingCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."TestRatingCategory_id_seq"', 1, false);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Brand Brand_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Click Click_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Click"
    ADD CONSTRAINT "Click_pkey" PRIMARY KEY (id);


--
-- Name: EditorialTestScore EditorialTestScore_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EditorialTestScore"
    ADD CONSTRAINT "EditorialTestScore_pkey" PRIMARY KEY ("testId", "categoryId");


--
-- Name: EditorialTest EditorialTest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EditorialTest"
    ADD CONSTRAINT "EditorialTest_pkey" PRIMARY KEY (id);


--
-- Name: EmailVerificationToken EmailVerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY (id);


--
-- Name: ImportRun ImportRun_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ImportRun"
    ADD CONSTRAINT "ImportRun_pkey" PRIMARY KEY (id);


--
-- Name: MediaAsset MediaAsset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MediaAsset"
    ADD CONSTRAINT "MediaAsset_pkey" PRIMARY KEY (id);


--
-- Name: Merchant Merchant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Merchant"
    ADD CONSTRAINT "Merchant_pkey" PRIMARY KEY (id);


--
-- Name: Offer Offer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_pkey" PRIMARY KEY (id);


--
-- Name: PageComment PageComment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageComment"
    ADD CONSTRAINT "PageComment_pkey" PRIMARY KEY (id);


--
-- Name: Page Page_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Page"
    ADD CONSTRAINT "Page_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Sku Sku_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sku"
    ADD CONSTRAINT "Sku_pkey" PRIMARY KEY (id);


--
-- Name: TestRatingCategory TestRatingCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TestRatingCategory"
    ADD CONSTRAINT "TestRatingCategory_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Brand_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Brand_name_key" ON public."Brand" USING btree (name);


--
-- Name: Brand_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Brand_slug_key" ON public."Brand" USING btree (slug);


--
-- Name: Category_parentId_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Category_parentId_order_idx" ON public."Category" USING btree ("parentId", "order");


--
-- Name: Category_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Category_published_idx" ON public."Category" USING btree (published);


--
-- Name: Category_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Category_slug_idx" ON public."Category" USING btree (slug);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: EditorialTest_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EditorialTest_productId_idx" ON public."EditorialTest" USING btree ("productId");


--
-- Name: EditorialTest_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EditorialTest_publishedAt_idx" ON public."EditorialTest" USING btree ("publishedAt");


--
-- Name: EditorialTest_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EditorialTest_status_idx" ON public."EditorialTest" USING btree (status);


--
-- Name: EmailVerificationToken_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON public."EmailVerificationToken" USING btree (token);


--
-- Name: MediaAsset_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MediaAsset_slug_key" ON public."MediaAsset" USING btree (slug);


--
-- Name: MediaAsset_storageKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON public."MediaAsset" USING btree ("storageKey");


--
-- Name: Merchant_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Merchant_name_key" ON public."Merchant" USING btree (name);


--
-- Name: Merchant_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Merchant_slug_key" ON public."Merchant" USING btree (slug);


--
-- Name: Offer_skuId_merchantId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Offer_skuId_merchantId_key" ON public."Offer" USING btree ("skuId", "merchantId");


--
-- Name: Page_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Page_slug_key" ON public."Page" USING btree (slug);


--
-- Name: Product_brandId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_brandId_idx" ON public."Product" USING btree ("brandId");


--
-- Name: Product_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_categoryId_idx" ON public."Product" USING btree ("categoryId");


--
-- Name: Product_gtin_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Product_gtin_key" ON public."Product" USING btree (gtin);


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Product_slug_key" ON public."Product" USING btree (slug);


--
-- Name: Review_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_productId_idx" ON public."Review" USING btree ("productId");


--
-- Name: Review_rating_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_rating_idx" ON public."Review" USING btree (rating);


--
-- Name: Review_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_status_idx" ON public."Review" USING btree (status);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Sku_gtin_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Sku_gtin_key" ON public."Sku" USING btree (gtin);


--
-- Name: TestRatingCategory_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TestRatingCategory_slug_key" ON public."TestRatingCategory" USING btree (slug);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Brand Brand_logoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES public."MediaAsset"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Category Category_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Click Click_offerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Click"
    ADD CONSTRAINT "Click_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES public."Offer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Click Click_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Click"
    ADD CONSTRAINT "Click_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EditorialTestScore EditorialTestScore_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EditorialTestScore"
    ADD CONSTRAINT "EditorialTestScore_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."TestRatingCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EditorialTestScore EditorialTestScore_testId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EditorialTestScore"
    ADD CONSTRAINT "EditorialTestScore_testId_fkey" FOREIGN KEY ("testId") REFERENCES public."EditorialTest"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EditorialTest EditorialTest_bannerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EditorialTest"
    ADD CONSTRAINT "EditorialTest_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES public."MediaAsset"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EditorialTest EditorialTest_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EditorialTest"
    ADD CONSTRAINT "EditorialTest_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EditorialTest EditorialTest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EditorialTest"
    ADD CONSTRAINT "EditorialTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmailVerificationToken EmailVerificationToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MediaAsset MediaAsset_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MediaAsset"
    ADD CONSTRAINT "MediaAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Offer Offer_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Offer Offer_skuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES public."Sku"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PageComment PageComment_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageComment"
    ADD CONSTRAINT "PageComment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES public."Page"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PageComment PageComment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageComment"
    ADD CONSTRAINT "PageComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Page Page_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Page"
    ADD CONSTRAINT "Page_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Page Page_bannerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Page"
    ADD CONSTRAINT "Page_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES public."MediaAsset"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Page Page_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Page"
    ADD CONSTRAINT "Page_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Page Page_thumbnailId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Page"
    ADD CONSTRAINT "Page_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES public."MediaAsset"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Review Review_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sku Sku_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sku"
    ADD CONSTRAINT "Sku_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_avatarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES public."MediaAsset"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict fcOTzg54o9nPZoYgKc4B6wsSwrFakRrOAg7BpKKQeIVfKG9SNp8jhn3dd43YPzD

