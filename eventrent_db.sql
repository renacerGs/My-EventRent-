--
-- PostgreSQL database dump
--

\restrict bTnhW39A0XmCoGSW8vhBD38u7lcb7FekUxUeh658ZKZhlbWCaMyDbxte8IKFsbz

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

-- Started on 2026-03-12 13:59:49

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
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 16585)
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 16590)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 220
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 230 (class 1259 OID 24622)
-- Name: event_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_sessions (
    id integer NOT NULL,
    event_id integer,
    name character varying(255) NOT NULL,
    description text,
    session_date date,
    start_time time without time zone,
    end_time time without time zone,
    contact_person character varying(100),
    event_type character varying(100),
    price numeric(15,2) DEFAULT 0,
    stock integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 229 (class 1259 OID 24621)
-- Name: event_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 229
-- Name: event_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_sessions_id_seq OWNED BY public.event_sessions.id;


--
-- TOC entry 221 (class 1259 OID 16591)
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    date_time timestamp without time zone,
    location character varying(255),
    description text,
    price numeric(10,2) DEFAULT 0,
    image_url text,
    category_id integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone character varying(20),
    stock integer DEFAULT 0,
    views integer DEFAULT 0,
    event_start date,
    event_end date,
    organizer character varying(255),
    place character varying(255),
    name_place character varying(255),
    city character varying(100),
    province character varying(100),
    map_url text
);


--
-- TOC entry 222 (class 1259 OID 16604)
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 222
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- TOC entry 232 (class 1259 OID 24641)
-- Name: session_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_questions (
    id integer NOT NULL,
    session_id integer,
    question_text character varying(255) NOT NULL,
    answer_type character varying(50) NOT NULL,
    is_required boolean DEFAULT false
);


--
-- TOC entry 231 (class 1259 OID 24640)
-- Name: session_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 231
-- Name: session_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_questions_id_seq OWNED BY public.session_questions.id;


--
-- TOC entry 234 (class 1259 OID 24663)
-- Name: ticket_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_answers (
    id integer NOT NULL,
    ticket_id integer,
    question_id integer,
    answer_text text NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 24662)
-- Name: ticket_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 233
-- Name: ticket_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticket_answers_id_seq OWNED BY public.ticket_answers.id;


--
-- TOC entry 223 (class 1259 OID 16605)
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    event_id integer,
    user_id integer,
    quantity integer DEFAULT 1,
    total_price numeric(10,2),
    purchase_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    session_id integer,
    attendee_data jsonb DEFAULT '[]'::jsonb,
    is_scanned boolean DEFAULT false,
    scanned_at timestamp without time zone
);


--
-- TOC entry 224 (class 1259 OID 16611)
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 224
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- TOC entry 225 (class 1259 OID 16612)
-- Name: user_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_likes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    event_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 226 (class 1259 OID 16619)
-- Name: user_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 226
-- Name: user_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_likes_id_seq OWNED BY public.user_likes.id;


--
-- TOC entry 227 (class 1259 OID 16620)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    picture text,
    google_id character varying(255),
    password character varying(255),
    role character varying(50) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 228 (class 1259 OID 16629)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4891 (class 2604 OID 16630)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4907 (class 2604 OID 24625)
-- Name: event_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sessions ALTER COLUMN id SET DEFAULT nextval('public.event_sessions_id_seq'::regclass);


--
-- TOC entry 4892 (class 2604 OID 16631)
-- Name: events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- TOC entry 4911 (class 2604 OID 24644)
-- Name: session_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_questions ALTER COLUMN id SET DEFAULT nextval('public.session_questions_id_seq'::regclass);


--
-- TOC entry 4913 (class 2604 OID 24666)
-- Name: ticket_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_answers ALTER COLUMN id SET DEFAULT nextval('public.ticket_answers_id_seq'::regclass);


--
-- TOC entry 4897 (class 2604 OID 16632)
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- TOC entry 4902 (class 2604 OID 16633)
-- Name: user_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_likes ALTER COLUMN id SET DEFAULT nextval('public.user_likes_id_seq'::regclass);


--
-- TOC entry 4904 (class 2604 OID 16634)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5092 (class 0 OID 16585)
-- Dependencies: 219
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name) FROM stdin;
1	Music
2	Food
3	Tech
4	Religious
5	Music
6	Food
7	Tech
8	Religious
9	Arts
10	Sports
11	Music
12	Food
13	Tech
14	Religious
\.


--
-- TOC entry 5103 (class 0 OID 24622)
-- Dependencies: 230
-- Data for Name: event_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_sessions (id, event_id, name, description, session_date, start_time, end_time, contact_person, event_type, price, stock, created_at) FROM stdin;
2	32	Opening Band	Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo	2026-05-10	18:30:00	19:30:00	Dika (0813-2222-1111)	Paid	200000.00	87	2026-03-11 17:51:58.605995
3	32	Guest Star Performance	Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo	2026-05-10	19:45:00	21:00:00	Dika (0813-2222-1111)	Paid	100000.00	86	2026-03-11 17:51:58.605995
\.


--
-- TOC entry 5094 (class 0 OID 16591)
-- Dependencies: 221
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, title, date_time, location, description, price, image_url, category_id, created_by, created_at, phone, stock, views, event_start, event_end, organizer, place, name_place, city, province, map_url) FROM stdin;
32	Harmony Night Concert	\N	\N	Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit\n	0.00	data:image/jpeg;base64,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	1	1	2026-03-11 17:51:58.605995	0812-3456-7890	0	168	2026-05-10	2026-05-10	\N	Jl. Kapten Piere Tendean No.32, Sekayu, Kec. Semarang Tengah, Kota Semarang, Jawa Tengah 50132	Gedung Kesenian Semarang	Semarang	jawa tengah	https://maps.app.goo.gl/SGGkDtsbWNGiqZ7Z8
\.


--
-- TOC entry 5105 (class 0 OID 24641)
-- Dependencies: 232
-- Data for Name: session_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_questions (id, session_id, question_text, answer_type, is_required) FROM stdin;
1	2	No HP	Text	t
2	3	Alamat	Text	t
3	3	Usia	Text	t
\.


--
-- TOC entry 5107 (class 0 OID 24663)
-- Dependencies: 234
-- Data for Name: ticket_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket_answers (id, ticket_id, question_id, answer_text) FROM stdin;
1	29	1	096453758395
2	29	1	083765833375
3	30	2	jl karang tumaritis rt 3/10 ngringo jaten karanganyar
4	30	3	23
5	30	2	jl karang tumaritis rt 3/10 ngringo jaten karanganyar
6	30	3	25
7	30	2	jl karang tumaritis rt 3/10 ngringo jaten karanganyar
8	30	3	22
9	31	1	8536563656
10	31	1	254265727525
11	31	1	23567287358672
12	32	1	0897766444536
13	32	2	jl punthrekrejo rt3/10 ngringo jaten karangnyar
14	32	3	23
15	32	1	26463756
16	32	3	22
17	32	2	jl punthrekrejo rt3/10 ngringo jaten karangnyar
\.


--
-- TOC entry 5096 (class 0 OID 16605)
-- Dependencies: 223
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tickets (id, event_id, user_id, quantity, total_price, purchase_date, session_id, attendee_data, is_scanned, scanned_at) FROM stdin;
29	32	1	2	400000.00	2026-03-11 23:22:28.430095	2	[]	f	\N
30	32	1	3	300000.00	2026-03-11 23:22:28.430095	3	[]	f	\N
31	32	1	3	600000.00	2026-03-11 23:58:31.315021	2	[{"name": "gosyen", "email": "gosyenabdiimanuel@gmail.com"}, {"name": "gracia", "email": "gosyenabdiimanuel@gmail.com"}, {"name": "gloria", "email": "gosyenabdiimanuel@gmail.com"}]	f	\N
32	32	1	2	200000.00	2026-03-11 23:58:31.315021	3	[{"name": "gosyen", "email": "gosyenabdiimanuel@gmail.com"}, {"name": "gloria", "email": "gosyenabdiimanuel@gmail.com"}]	f	\N
33	32	1	2	400000.00	2026-03-12 00:22:54.335499	2	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "089786756453", "question": "No HP"}]}, {"name": "Gracia", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "089786756453", "question": "No HP"}]}]	f	\N
34	32	1	3	300000.00	2026-03-12 00:22:54.335499	3	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "jl punthukrejo rt 3/10 ngringo jaten karanganyar jawatengah", "question": "Alamat"}, {"answer": "23", "question": "Usia"}]}, {"name": "Gracia", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "jl punthukrejo rt 3/10 ngringo jaten karanganyar jawatengah", "question": "Alamat"}, {"answer": "25", "question": "Usia"}]}, {"name": "gloria gamalia", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "jl punthukrejo rt 3/10 ngringo jaten karanganyar jawatengah", "question": "Alamat"}, {"answer": "22", "question": "Usia"}]}]	f	\N
35	32	1	1	200000.00	2026-03-12 10:08:20.836656	2	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "089325357562", "question": "No HP"}]}]	f	\N
36	32	1	1	100000.00	2026-03-12 10:08:20.836656	3	[{"name": "Gracia Gabriela", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "jl puntuhkrejo rt3/10 ngringo, jaten , karangnyar", "question": "Alamat"}, {"answer": "23", "question": "Usia"}]}]	f	\N
39	32	1	1	200000.00	2026-03-12 11:07:54.552713	2	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "089787665436", "question": "No HP"}]}]	t	2026-03-12 11:52:38.612566
43	32	1	1	200000.00	2026-03-12 13:47:57.022563	2	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "46246246", "question": "No HP"}]}]	f	\N
37	32	1	1	200000.00	2026-03-12 10:13:51.334227	2	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "757474782245", "question": "No HP"}]}]	t	2026-03-12 11:18:10.052299
38	32	1	1	100000.00	2026-03-12 10:13:51.334227	3	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "jl punthuk rejo rt 3 rw 10 ngringo jaten karangnyar", "question": "Alamat"}, {"answer": "23", "question": "Usia"}]}]	t	2026-03-12 11:18:40.330939
44	32	1	1	100000.00	2026-03-12 13:47:57.022563	3	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "fhwbbtewe", "question": "Alamat"}, {"answer": "45", "question": "Usia"}]}]	f	\N
42	32	1	1	100000.00	2026-03-12 11:24:19.678856	3	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "jl punthukrejo rt 3 rw 10 ngringo jaten kra", "question": "Alamat"}, {"answer": "23", "question": "Usia"}]}]	t	2026-03-12 11:25:28.355616
41	32	1	1	200000.00	2026-03-12 11:24:19.678856	2	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "089786756453", "question": "No HP"}]}]	t	2026-03-12 11:37:52.019989
40	32	1	1	100000.00	2026-03-12 11:07:54.552713	3	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "jl punthukrejo rt3/10 ngringo jaten karanganyar", "question": "Alamat"}, {"answer": "23", "question": "Usia"}]}]	t	2026-03-12 11:52:27.421277
45	32	4	1	200000.00	2026-03-12 13:57:11.076925	2	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "23525462", "question": "No HP"}]}]	f	\N
46	32	4	1	100000.00	2026-03-12 13:57:11.076925	3	[{"name": "Gosyen Imanuel", "email": "gosyenabdiimanuel@gmail.com", "customAnswers": [{"answer": "jl ajdidbbocidava", "question": "Alamat"}, {"answer": "23", "question": "Usia"}]}]	f	\N
\.


--
-- TOC entry 5098 (class 0 OID 16612)
-- Dependencies: 225
-- Data for Name: user_likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_likes (id, user_id, event_id, created_at) FROM stdin;
40	1	32	2026-03-12 13:37:11.454763
\.


--
-- TOC entry 5100 (class 0 OID 16620)
-- Dependencies: 227
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, name, picture, google_id, password, role, created_at) FROM stdin;
2	gosyen260503@gmail.com	gusion	https://ui-avatars.com/api/?name=gusion&background=random	\N	$2b$10$cBpTFQID.KOrHIww3Sx0x.PmNqRwegIXcdKJrbKJdx2pBhNeOPEuy	user	2026-03-03 21:40:41.853149
3	andrigaming@gmail.com	andri	https://ui-avatars.com/api/?name=andri&background=random	\N	$2b$10$2y0bH/sWM/qHCmeBSVymh.zOsuXuS.35P7.L22bwPV2La/Zw3M6rO	user	2026-03-03 21:41:26.485698
5	andritriwijayanto43@gmail.com	Andri Tri Wijayanto	https://lh3.googleusercontent.com/a/ACg8ocLKP201Er13-eFovrCK2eC3llbTbsXsAi8QqHwigsFGJl_7iA=s96-c	104086153625380921117	\N	user	2026-03-04 10:17:50.958994
6	gofood@gmail.com	gofood	https://api.dicebear.com/7.x/adventurer/svg?seed=gofood&backgroundColor=ffdfbf,ffd5dc,d1d4f9,c0aede,b6e3f4	\N	$2b$10$wuG.mgT2mfwi7.Zk5CbVI.3EaV4XammQHYTZ5Z1dR29aYQ23tKNfK	user	2026-03-05 13:54:25.314449
1	renacergosyen@gmail.com	gosyen renacer	data:image/jpeg;base64,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	100481715567703553875	\N	user	2026-03-03 12:06:57.119097
4	imanuel@gmail.com	Imanuel	data:image/jpeg;base64,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	\N	$2b$10$l1BLZexoz7H9IyMBEM9eWu0HNS2I4yurOLv9j1VLr5rxAGQ1piW9K	user	2026-03-03 21:50:55.761227
\.


--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 220
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 14, true);


--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 229
-- Name: event_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_sessions_id_seq', 3, true);


--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 222
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.events_id_seq', 32, true);


--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 231
-- Name: session_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.session_questions_id_seq', 3, true);


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 233
-- Name: ticket_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ticket_answers_id_seq', 17, true);


--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 224
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tickets_id_seq', 46, true);


--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 226
-- Name: user_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_likes_id_seq', 40, true);


--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- TOC entry 4915 (class 2606 OID 16642)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4929 (class 2606 OID 24634)
-- Name: event_sessions event_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sessions
    ADD CONSTRAINT event_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4917 (class 2606 OID 16644)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 4931 (class 2606 OID 24650)
-- Name: session_questions session_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_questions
    ADD CONSTRAINT session_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 4933 (class 2606 OID 24672)
-- Name: ticket_answers ticket_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_answers
    ADD CONSTRAINT ticket_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 4919 (class 2606 OID 16646)
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 4921 (class 2606 OID 16648)
-- Name: user_likes user_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_likes
    ADD CONSTRAINT user_likes_pkey PRIMARY KEY (id);


--
-- TOC entry 4923 (class 2606 OID 16650)
-- Name: user_likes user_likes_user_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_likes
    ADD CONSTRAINT user_likes_user_id_event_id_key UNIQUE (user_id, event_id);


--
-- TOC entry 4925 (class 2606 OID 16652)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4927 (class 2606 OID 16654)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4941 (class 2606 OID 24635)
-- Name: event_sessions event_sessions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sessions
    ADD CONSTRAINT event_sessions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 4934 (class 2606 OID 16655)
-- Name: events events_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 4935 (class 2606 OID 16660)
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4942 (class 2606 OID 24651)
-- Name: session_questions session_questions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_questions
    ADD CONSTRAINT session_questions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.event_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4943 (class 2606 OID 24678)
-- Name: ticket_answers ticket_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_answers
    ADD CONSTRAINT ticket_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.session_questions(id) ON DELETE CASCADE;


--
-- TOC entry 4944 (class 2606 OID 24673)
-- Name: ticket_answers ticket_answers_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_answers
    ADD CONSTRAINT ticket_answers_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- TOC entry 4936 (class 2606 OID 16665)
-- Name: tickets tickets_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 4937 (class 2606 OID 24657)
-- Name: tickets tickets_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.event_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4938 (class 2606 OID 16670)
-- Name: tickets tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4939 (class 2606 OID 16675)
-- Name: user_likes user_likes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_likes
    ADD CONSTRAINT user_likes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 4940 (class 2606 OID 16680)
-- Name: user_likes user_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_likes
    ADD CONSTRAINT user_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-03-12 13:59:49

--
-- PostgreSQL database dump complete
--

\unrestrict bTnhW39A0XmCoGSW8vhBD38u7lcb7FekUxUeh658ZKZhlbWCaMyDbxte8IKFsbz

