--
-- PostgreSQL database dump
--

\restrict PdFQhVUA6g6cGX6tlFQwb0qwZo1Du2n8BUg9bdXR2ofefj1aayrghRToEFl3vnD

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    request_id character varying(255),
    actor character varying(100) DEFAULT 'admin'::character varying NOT NULL,
    type character varying(50) NOT NULL,
    data json NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    household_id character varying(255),
    order_id character varying(255)
);


ALTER TABLE public.audit_events OWNER TO postgres;

--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    name character varying(120) NOT NULL,
    email character varying(255) NOT NULL,
    subject character varying(160) NOT NULL,
    message text NOT NULL,
    source_ip character varying(45),
    status character varying(20) DEFAULT 'new'::character varying NOT NULL,
    ticket_id character varying(20) NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- Name: home_maintenance_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.home_maintenance_tasks (
    id integer NOT NULL,
    task_code character varying(100) NOT NULL,
    category character varying(100) NOT NULL,
    task_name character varying(255) NOT NULL,
    base_frequency character varying(50) NOT NULL,
    months_hot_humid character varying(50),
    months_cold_snow character varying(50),
    months_mixed character varying(50),
    months_arid_mountain character varying(50),
    seasonal_tag character varying(50),
    how_to text NOT NULL,
    why_it_matters text NOT NULL,
    est_minutes integer NOT NULL,
    materials text,
    safety_note text,
    applies_if_freeze boolean DEFAULT false NOT NULL,
    applies_if_hurricane boolean DEFAULT false NOT NULL,
    applies_if_wildfire boolean DEFAULT false NOT NULL,
    applies_if_hard_water boolean DEFAULT false NOT NULL,
    applies_if_has_sprinklers boolean DEFAULT false NOT NULL,
    pro_service_recommended boolean DEFAULT false NOT NULL,
    diy_ok boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.home_maintenance_tasks OWNER TO postgres;

--
-- Name: home_maintenance_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.home_maintenance_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.home_maintenance_tasks_id_seq OWNER TO postgres;

--
-- Name: home_maintenance_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.home_maintenance_tasks_id_seq OWNED BY public.home_maintenance_tasks.id;


--
-- Name: home_profile_extras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.home_profile_extras (
    id integer NOT NULL,
    household_id text NOT NULL,
    owner_type text,
    sell_window text,
    year_built integer,
    roof_material text,
    roof_age_years integer,
    hvac_type text,
    hvac_age_years integer,
    hvac_last_service_month text,
    water_heater_type text,
    water_heater_age_years integer,
    water_heater_capacity_gal integer,
    exterior_type text,
    lot_sq_ft integer,
    insurance_provider text,
    insurance_renewal_month integer,
    electric_provider text,
    gas_provider text,
    has_hoa boolean DEFAULT false,
    hoa_name text,
    planned_projects text[],
    smart_home_gear text[],
    budget_band text,
    contact_pref_channel text,
    contact_pref_cadence text,
    marketing_consent boolean DEFAULT true,
    appliances jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    home_type text,
    square_footage integer,
    bedrooms integer,
    bathrooms integer
);


ALTER TABLE public.home_profile_extras OWNER TO postgres;

--
-- Name: home_profile_extras_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.home_profile_extras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.home_profile_extras_id_seq OWNER TO postgres;

--
-- Name: home_profile_extras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.home_profile_extras_id_seq OWNED BY public.home_profile_extras.id;


--
-- Name: household_task_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.household_task_assignments (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    household_id character varying NOT NULL,
    task_id integer NOT NULL,
    due_date date NOT NULL,
    frequency character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    completed_at timestamp without time zone,
    priority character varying(20) DEFAULT 'medium'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    skipped_at timestamp without time zone,
    skipped_reason text,
    reminder_sent boolean DEFAULT false,
    reminder_sent_at timestamp without time zone
);


ALTER TABLE public.household_task_assignments OWNER TO postgres;

--
-- Name: households; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.households (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(30),
    notification_preference character varying(20) DEFAULT 'both'::character varying NOT NULL,
    sms_opt_in boolean DEFAULT false,
    preferred_contact character varying(20),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    address_line_1 character varying(255),
    address_line_2 character varying(255),
    city character varying(100),
    state character varying(2),
    zipcode character varying(10),
    setup_status character varying(20) DEFAULT 'not_started'::character varying NOT NULL,
    setup_completed_at timestamp without time zone,
    setup_started_at timestamp without time zone,
    order_id character varying(50),
    last_modified_by character varying,
    setup_notes text,
    setup_issues text,
    magnet_code character varying(50),
    magnet_token character varying(50),
    created_by character varying(20) DEFAULT 'customer'::character varying NOT NULL,
    created_by_user_id character varying(255)
);


ALTER TABLE public.households OWNER TO postgres;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id text NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    preferred_contact text,
    hear_about_us text,
    street_address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    property_type text,
    number_of_locations integer,
    location_nickname text,
    home_type text,
    square_footage integer,
    roof_age integer,
    hvac_system_type text,
    water_heater_type text,
    number_of_assets integer,
    asset_categories text,
    company_name text,
    industry_type text,
    number_of_employees integer,
    business_website text,
    preferred_service_type text,
    estimated_qr_labels text,
    interest_type text,
    need_consultation boolean,
    is_owner boolean,
    budget_range text,
    timeline_to_proceed text,
    preferred_contact_time text,
    notes text,
    activation_code text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    request_id character varying(255) NOT NULL,
    author character varying(100) DEFAULT 'admin'::character varying NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notes OWNER TO postgres;

--
-- Name: order_magnet_audit_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_magnet_audit_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying,
    item_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    actor character varying(100) DEFAULT 'admin'::character varying NOT NULL,
    type character varying(50) NOT NULL,
    data jsonb NOT NULL
);


ALTER TABLE public.order_magnet_audit_events OWNER TO postgres;

--
-- Name: order_magnet_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_magnet_batches (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    printer_name character varying(255),
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    unit_cost numeric(10,2),
    quantity integer DEFAULT 0 NOT NULL,
    submitted_at timestamp without time zone,
    completed_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.order_magnet_batches OWNER TO postgres;

--
-- Name: order_magnet_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_magnet_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    sku character varying(100) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    activation_code character varying(20) NOT NULL,
    qr_url text NOT NULL,
    activation_status character varying(20) DEFAULT 'inactive'::character varying NOT NULL,
    activated_at timestamp without time zone,
    activated_by_email character varying(255),
    scan_count integer DEFAULT 0 NOT NULL,
    last_scan_at timestamp without time zone,
    print_batch_id character varying,
    serial_number character varying(50),
    print_file_url character varying(500),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.order_magnet_items OWNER TO postgres;

--
-- Name: order_magnet_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_magnet_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    customer_name character varying(255) NOT NULL,
    customer_email character varying(255) NOT NULL,
    customer_phone character varying(50) NOT NULL,
    ship_address_line_1 character varying(255) NOT NULL,
    ship_address_line_2 character varying(255),
    ship_city character varying(100) NOT NULL,
    ship_state character varying(50) NOT NULL,
    ship_zip character varying(5) NOT NULL,
    ship_country character varying(10) DEFAULT 'US'::character varying NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    shipping_fee numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    discount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    tax numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    total numeric(10,2) NOT NULL,
    payment_status character varying(20) DEFAULT 'unpaid'::character varying NOT NULL,
    payment_provider character varying(20) DEFAULT 'stripe'::character varying NOT NULL,
    payment_ref character varying(255),
    status character varying(20) DEFAULT 'new'::character varying NOT NULL,
    source character varying(100),
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(100),
    notes text
);


ALTER TABLE public.order_magnet_orders OWNER TO postgres;

--
-- Name: order_magnet_shipments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_magnet_shipments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    carrier character varying(100),
    tracking_number character varying(100),
    label_url character varying(500),
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    shipped_at timestamp without time zone,
    expected_delivery timestamp without time zone,
    delivered_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.order_magnet_shipments OWNER TO postgres;

--
-- Name: pro_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pro_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    trade character varying(50) NOT NULL,
    urgency character varying(50) NOT NULL,
    description text NOT NULL,
    photos json DEFAULT '[]'::json,
    address_line_1 character varying(255) NOT NULL,
    address_line_2 character varying(255),
    city character varying(100) NOT NULL,
    state character varying(50) NOT NULL,
    zip character varying(5) NOT NULL,
    contact_name character varying(255) NOT NULL,
    contact_email character varying(255) NOT NULL,
    contact_phone character varying(50) NOT NULL,
    preferred_windows text,
    status character varying(50) DEFAULT 'new'::character varying NOT NULL,
    provider_assigned character varying(255),
    public_tracking_code character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pro_requests OWNER TO postgres;

--
-- Name: providers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.providers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    trade character varying(50) NOT NULL,
    coverage_zips json NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.providers OWNER TO postgres;

--
-- Name: setup_form_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.setup_form_notes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    household_id character varying NOT NULL,
    created_by character varying,
    content text NOT NULL,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.setup_form_notes OWNER TO postgres;

--
-- Name: stripe_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stripe_events (
    event_id character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    processed_at timestamp without time zone DEFAULT now() NOT NULL,
    session_id character varying(255),
    order_id character varying(50),
    metadata jsonb
);


ALTER TABLE public.stripe_events OWNER TO postgres;

--
-- Name: home_maintenance_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_maintenance_tasks ALTER COLUMN id SET DEFAULT nextval('public.home_maintenance_tasks_id_seq'::regclass);


--
-- Name: home_profile_extras id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_profile_extras ALTER COLUMN id SET DEFAULT nextval('public.home_profile_extras_id_seq'::regclass);


--
-- Data for Name: audit_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_events (id, request_id, actor, type, data, created_at, household_id, order_id) FROM stdin;
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_messages (id, created_at, updated_at, name, email, subject, message, source_ip, status, ticket_id, tags) FROM stdin;
\.


--
-- Data for Name: home_maintenance_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.home_maintenance_tasks (id, task_code, category, task_name, base_frequency, months_hot_humid, months_cold_snow, months_mixed, months_arid_mountain, seasonal_tag, how_to, why_it_matters, est_minutes, materials, safety_note, applies_if_freeze, applies_if_hurricane, applies_if_wildfire, applies_if_hard_water, applies_if_has_sprinklers, pro_service_recommended, diy_ok, created_at, updated_at) FROM stdin;
1	HVAC_FILTER_CHANGE	HVAC	Change HVAC Air Filter	monthly	monthly	monthly	monthly	monthly	\N	Turn off HVAC system. Locate air filter (usually in return air duct or furnace). Remove old filter, noting size and direction of airflow arrow. Insert new filter with arrow pointing toward furnace/blower. Turn system back on.	Clean filters improve air quality, reduce energy costs by 5-15%, and prevent system breakdowns. Dirty filters force your HVAC to work harder, shortening its lifespan.	15	Replacement HVAC filter (check size: common sizes are 16x20x1, 20x25x1)	Turn off system before replacing filter to avoid inhaling dust.	f	f	f	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
2	HVAC_ANNUAL_SERVICE	HVAC	Schedule Professional HVAC Inspection	annual	spring	spring	spring	spring	spring	Contact licensed HVAC technician to inspect system before cooling season. Technician will check refrigerant levels, clean coils, test thermostat, inspect electrical connections, and ensure proper airflow.	Annual maintenance extends HVAC lifespan by 5-10 years, prevents costly breakdowns, maintains warranty coverage, and keeps energy efficiency optimal.	90	None (professional service)	Ensure technician is licensed and insured.	f	f	f	f	f	t	f	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
3	HVAC_CONDENSER_CLEAN	HVAC	Clean Outdoor AC Condenser Unit	annual	spring	spring	spring	spring	spring	Turn off power to unit at breaker. Remove debris (leaves, grass) from around unit. Gently spray coils with garden hose from inside out. Straighten any bent fins with fin comb. Clear 2-foot perimeter around unit.	Clean condensers run 10-15% more efficiently, reduce cooling costs, and prevent compressor failure. Blocked airflow is a leading cause of AC failure.	30	Garden hose, fin comb (optional)	Always turn off power at breaker before cleaning. Never use pressure washer.	f	f	f	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
4	WATER_HEATER_FLUSH	Plumbing	Flush Water Heater Tank	annual	annual	annual	annual	annual	\N	Turn off power/gas to heater. Attach hose to drain valve at bottom of tank. Run hose to drain or outside. Open drain valve and let tank drain completely (20-30 minutes). Close valve, remove hose, turn power/gas back on.	Removes sediment buildup that reduces efficiency, causes noisy operation, and shortens tank life. Can improve efficiency by 5-10% and extend tank life by years.	45	Garden hose, bucket	Water will be HOT. Let cool for 2 hours before draining or wear protective gloves.	f	f	f	t	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
5	WATER_HEATER_ANODE	Plumbing	Inspect Water Heater Anode Rod	biannual	biannual	biannual	biannual	biannual	\N	Turn off power/gas. Locate anode rod on top of tank. Use socket wrench to remove rod. If rod is less than 1/2" thick or coated with calcium, replace it. Apply teflon tape to threads and reinstall.	Anode rod prevents tank corrosion by sacrificing itself. Replacing it can extend tank life from 8-10 years to 15-20 years. Most important preventive maintenance for water heaters.	60	Socket wrench, replacement anode rod, teflon tape	Turn off power/gas. If rod is stuck, consider calling professional.	f	f	f	t	f	t	f	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
6	LEAK_INSPECTION	Plumbing	Check for Plumbing Leaks	quarterly	quarterly	quarterly	quarterly	quarterly	\N	Inspect under sinks, around toilets, water heater, and washing machine. Look for water stains, moisture, mold, or dripping. Check water meter: turn off all water, note meter reading, wait 2 hours, check again. If meter changed, you have a leak.	Small leaks waste 10,000+ gallons per year, cause water damage ($5,000-$70,000 repairs), promote mold growth, and increase water bills. Early detection prevents major damage.	20	Flashlight	Check for mold/mildew which indicates moisture problems.	f	f	f	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
7	GUTTER_CLEANING	Exterior	Clean Gutters and Downspouts	biannual	spring-fall	spring-fall	spring-fall	spring-fall	spring-fall	Use sturdy ladder with stabilizer. Scoop debris from gutters into bucket. Flush gutters with hose. Check downspouts are clear. Ensure water flows away from foundation.	Clogged gutters cause water damage to roof, siding, foundation ($10,000-$50,000 repairs), basement flooding, and landscape erosion. Regular cleaning prevents these costly issues.	60	Ladder, gloves, bucket, garden hose, gutter scoop	Use ladder stabilizer. Never lean ladder against gutters. Work with partner.	f	f	f	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
8	ROOF_INSPECTION	Exterior	Visual Roof Inspection	annual	spring	spring	spring	spring	spring	From ground with binoculars, look for missing/damaged shingles, sagging areas, damaged flashing around chimneys/vents. Inside attic, check for water stains, daylight through roof, or sagging.	Early detection of roof issues prevents major water damage, mold, and structural problems. Small repairs cost $300-$1,000; replacement costs $5,000-$15,000+.	30	Binoculars, flashlight	Do NOT climb on roof yourself - hire professional if issues found.	f	t	f	f	f	t	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
9	PRESSURE_WASH	Exterior	Pressure Wash Exterior	annual	spring	spring	spring	spring	spring	Rent or use pressure washer (1500-2000 PSI for home). Start from top, work down. Keep nozzle 12-18" from surface. Use wide-angle nozzle. Avoid windows, vents, and electrical fixtures.	Removes mold, mildew, dirt, and grime that degrade siding. Maintains curb appeal, prevents rot, and extends siding life. Increases home value by $10,000-$15,000.	120	Pressure washer, safety goggles, outdoor cleaner	Never use on damaged siding. Wear safety goggles. Keep nozzle moving to avoid damage.	f	f	f	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
10	WINTERIZATION	Seasonal	Winterize Home	annual	\N	fall	fall	fall	fall	Drain and shut off outdoor faucets. Insulate exposed pipes. Clean and store garden hoses. Service snow removal equipment. Check weatherstripping on doors/windows. Test heating system.	Prevents frozen pipe bursts ($5,000+ damage), reduces heating costs by 10-20%, ensures heating system works when needed, prevents carbon monoxide issues.	90	Pipe insulation, weatherstripping	Test smoke and CO detectors. Have heating system serviced professionally.	t	f	f	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
11	SPRING_MAINTENANCE	Seasonal	Spring Home Maintenance	annual	spring	spring	spring	spring	spring	Inspect roof and gutters. Check for winter damage. Turn on outdoor water faucets. Test sprinkler system. Clean windows. Check AC system. Inspect deck/patio for damage.	Addresses winter damage before it worsens. Prepares home for summer. Prevents small issues from becoming expensive repairs. Maintains home value.	120	Various tools and supplies	Inspect for pest damage after winter.	f	f	f	f	t	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
12	DRYER_VENT_CLEAN	Appliance	Clean Dryer Vent	annual	annual	annual	annual	annual	\N	Unplug dryer. Disconnect vent hose from back of dryer and wall. Use dryer vent brush or vacuum to remove lint from hose and duct. Reconnect securely. Clean lint trap.	Lint buildup causes 15,000+ house fires annually. Cleaning improves drying efficiency (30% faster), reduces energy costs, prevents fires, and extends dryer life.	45	Dryer vent brush kit or vacuum attachment	Unplug dryer before cleaning. Check for gas leaks if gas dryer.	f	f	t	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
13	FRIDGE_COILS_CLEAN	Appliance	Clean Refrigerator Coils	annual	annual	annual	annual	annual	\N	Unplug refrigerator. Locate coils (usually back or bottom behind panel). Use coil brush or vacuum to remove dust and debris. Clean area around fridge. Plug back in.	Dirty coils make fridge work 25% harder, shortening lifespan and increasing energy costs by $100+/year. Cleaning takes 15 minutes, extends fridge life by years.	30	Coil cleaning brush or vacuum with brush attachment	Unplug before cleaning. Be gentle with coils - they bend easily.	f	f	f	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
14	SMOKE_DETECTOR_TEST	Safety	Test Smoke and CO Detectors	monthly	monthly	monthly	monthly	monthly	\N	Press test button on each detector. Should sound alarm. If not, replace battery. Replace entire unit every 10 years. Vacuum detector to remove dust.	Working detectors are required by law and save lives. Smoke alarms cut fire death risk by 50%. CO detectors prevent poisoning deaths. Simple test takes 5 minutes.	10	Replacement batteries (9V or AA)	Never disable detector. Replace if more than 10 years old.	f	f	t	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
15	FIRE_EXTINGUISHER_CHECK	Safety	Inspect Fire Extinguishers	monthly	monthly	monthly	monthly	monthly	\N	Check pressure gauge is in green zone. Ensure pin and seal are intact. Check for visible damage or corrosion. Ensure accessible and not blocked. Should have one per floor and in kitchen.	Quick access to working extinguisher can prevent small fire from becoming total loss ($100,000+ damage). 90% of home fires start small and could be stopped with extinguisher.	5	None	Never use water on electrical or grease fires. Call 911 for any fire.	f	f	t	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
16	FURNACE_FILTER_WINTER	HVAC	Change Furnace Filter (Winter)	monthly	\N	monthly	monthly	monthly	winter	Turn off furnace. Locate filter (usually in return duct or furnace). Remove old filter. Note size and airflow direction. Install new filter with arrow pointing toward furnace. Turn system back on.	Critical during heating season when furnace runs constantly. Clean filter prevents furnace overheating, reduces heating costs by 15%, improves air quality, extends furnace life.	15	Furnace filter (check size - common: 16x20x1, 20x25x1)	Turn off furnace before replacing. Consider higher MERV rating for better filtration.	t	f	f	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
17	CAULK_INSPECTION	Exterior	Inspect and Replace Caulking	annual	spring	spring	spring	spring	spring	Check caulking around windows, doors, and exterior penetrations (pipes, wires). Look for cracks, gaps, or missing caulk. Remove old deteriorated caulk. Apply new exterior-grade silicone caulk.	Failed caulking allows water infiltration causing rot, mold, insect entry, and energy loss. Small caulk job ($20) prevents thousands in water damage repairs.	60	Caulk gun, exterior silicone caulk, caulk removal tool	Work in dry conditions. Caulk requires 24 hours to cure.	f	t	f	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
18	SPRINKLER_WINTERIZE	Exterior	Winterize Sprinkler System	annual	\N	fall	fall	fall	fall	Turn off water supply to system. Drain pipes using manual drain valves or compressed air blowout. Open valves to release pressure. Insulate backflow preventer.	Prevents pipe bursts from freezing ($2,000-$5,000 repairs). Critical in cold climates. Spring repairs cost 3x more than fall winterization.	60	Air compressor (if using blowout method)	If using compressed air, do not exceed 80 PSI for PVC pipes.	t	f	f	f	t	t	f	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
19	SPRINKLER_SPRING_START	Exterior	Start Up Sprinkler System	annual	spring	spring	spring	spring	spring	Slowly turn on water supply. Check each zone for leaks, broken heads, or poor coverage. Adjust spray patterns. Set controller for seasonal schedule.	Proper startup prevents water waste, dead zones in lawn, and high water bills. Catches winter damage early when repairs are cheaper.	45	Screwdriver for adjustments	Turn on water slowly to avoid pressure damage.	f	f	f	f	t	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
20	DECK_SEAL	Exterior	Seal/Stain Deck	biannual	spring	spring	spring	spring	spring	Clean deck thoroughly. Sand rough spots. Apply deck cleaner and brightener. Let dry 48 hours. Apply stain/sealant with brush or roller. Apply thin, even coats.	Sealing prevents wood rot, splintering, UV damage, and insect infestation. Extends deck life from 10-15 years to 25-30 years. Maintains home value.	240	Deck cleaner, sander, stain/sealant, brushes/roller	Work in dry weather (no rain for 48 hours). Test stain color on small area first.	f	f	f	f	f	f	t	2025-11-24 04:18:11.471914	2025-11-24 04:18:11.471914
\.


--
-- Data for Name: home_profile_extras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.home_profile_extras (id, household_id, owner_type, sell_window, year_built, roof_material, roof_age_years, hvac_type, hvac_age_years, hvac_last_service_month, water_heater_type, water_heater_age_years, water_heater_capacity_gal, exterior_type, lot_sq_ft, insurance_provider, insurance_renewal_month, electric_provider, gas_provider, has_hoa, hoa_name, planned_projects, smart_home_gear, budget_band, contact_pref_channel, contact_pref_cadence, marketing_consent, appliances, created_at, updated_at, home_type, square_footage, bedrooms, bathrooms) FROM stdin;
1	_Lm5Dab9cAcdi8tGYXzT1	\N	\N	\N	\N	10	central_air	\N	\N	tank_gas	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 02:47:05.697	2025-11-24 02:47:05.697	\N	\N	\N	\N
2	8MFmHdsE_AfuIp4FIxFfU	\N	\N	2010	\N	8	heat_pump	\N	\N	tankless	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 03:13:59.48	2025-11-24 03:13:59.48	townhouse	1800	3	2
3	yDn5ImCZUgD50FMSM-ZVI	\N	\N	2015	\N	10	central_air	\N	\N	tank_gas	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 03:54:25.133	2025-11-24 03:54:25.133	single_family	2000	3	2
4	B5_UOjOczjtckKCzvZSs_	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 03:56:23.574	2025-11-24 03:56:23.574	townhouse	1800	3	2
5	SQ_v1WKOAKIDLknD_GlWW	\N	\N	2010	\N	12	central_air	\N	\N	tank_gas	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	email	\N	t	\N	2025-11-24 04:21:55.885	2025-11-24 04:21:55.885	single_family	2200	4	2
6	JYHvb8AW6w_XNFFD7frNo	\N	\N	2010	\N	12	central_air	\N	\N	tank_gas	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	email	\N	t	\N	2025-11-24 04:22:58.244	2025-11-24 04:22:58.244	single_family	2200	4	2
7	Iuf6nQNQ3m_6IG1Ewo29Z	\N	\N	2015	\N	5	none	\N	\N	tankless	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	email	\N	t	\N	2025-11-24 04:25:17.846	2025-11-24 04:25:17.846	condo	1200	2	1
8	pdSJgyHOsK21xcaPSmipj	\N	\N	\N	\N	\N	heat_pump	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 04:37:01.498	2025-11-24 04:37:01.498	condo	\N	\N	\N
9	BsG5g14TCTc-hneXBLgy9	\N	\N	\N	\N	\N	central_air	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 04:40:42.269	2025-11-24 04:40:42.269	single_family	\N	\N	\N
10	EF1Fp7hplZ0tFBIfvk35r	\N	\N	2018	\N	3	central_air	\N	\N	tank_gas	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	email	\N	t	\N	2025-11-24 04:45:26.07	2025-11-24 04:45:26.07	condo	1100	2	2
11	d7UP30d1ijkuuhjxyrvUU	\N	\N	2005	\N	8	central_air	\N	\N	tank_gas	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	email	\N	t	\N	2025-11-24 04:46:52.228	2025-11-24 04:46:52.228	single_family	2500	4	3
12	9M8RO_Rs8kQuk1nxhp-Kj	\N	\N	\N	\N	\N	heat_pump	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 04:48:29.307	2025-11-24 04:48:29.307	condo	\N	\N	\N
13	Slx9P7SVGGoL3rpDe2rzM	\N	\N	\N	\N	12	central_air	\N	\N	tank_gas	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 04:49:27.978	2025-11-24 04:49:27.978	single_family	2200	4	2
\.


--
-- Data for Name: household_task_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.household_task_assignments (id, household_id, task_id, due_date, frequency, status, completed_at, priority, notes, created_at, updated_at, skipped_at, skipped_reason, reminder_sent, reminder_sent_at) FROM stdin;
d6cb4f67-9319-422f-ba49-d6436e92887c	JYHvb8AW6w_XNFFD7frNo	14	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
0ac0ed83-41a3-4b20-99ba-47faaee80aac	JYHvb8AW6w_XNFFD7frNo	15	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
9bf42312-2227-4b99-9229-662f74de18ce	JYHvb8AW6w_XNFFD7frNo	1	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
7502501b-978b-404e-a31c-a88b9e3cedcc	JYHvb8AW6w_XNFFD7frNo	16	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
dfd903bd-6aaf-4e57-b01a-20351c253a8d	JYHvb8AW6w_XNFFD7frNo	6	2025-12-24	quarterly	pending	\N	medium	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
847b5904-0392-47b2-b3f7-e5086cb6bace	JYHvb8AW6w_XNFFD7frNo	8	2025-12-24	annual	pending	\N	high	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
88fabdc5-b432-4608-ae3c-308a7ac1d55e	JYHvb8AW6w_XNFFD7frNo	10	2025-12-24	annual	pending	\N	high	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
721edbec-ecc1-409f-a651-d01ab6c20070	JYHvb8AW6w_XNFFD7frNo	3	2026-01-08	annual	pending	\N	medium	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
f8bae253-4ec9-4656-8285-d3575b1ecd34	JYHvb8AW6w_XNFFD7frNo	7	2026-01-08	biannual	pending	\N	high	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
3874f63b-528f-4bec-9f08-fffa2605a78b	JYHvb8AW6w_XNFFD7frNo	2	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
e2c36f06-7dc1-432c-a8ae-46bcbd663133	JYHvb8AW6w_XNFFD7frNo	17	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
33979136-116b-4b40-a2e1-2fc2b284ee8e	JYHvb8AW6w_XNFFD7frNo	18	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
6417067b-e306-4cae-9f1a-9e6bfc060807	JYHvb8AW6w_XNFFD7frNo	19	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
d154c669-d2d9-4f2b-bbc7-d633a4b97614	JYHvb8AW6w_XNFFD7frNo	4	2026-02-22	annual	pending	\N	medium	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
6f856bb2-ba48-4f49-988f-ca9315067a93	JYHvb8AW6w_XNFFD7frNo	12	2026-02-22	annual	pending	\N	high	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
f0c41909-ccdb-4b6b-b66f-38ba4212aa80	JYHvb8AW6w_XNFFD7frNo	20	2026-02-22	biannual	pending	\N	medium	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
529bde47-9193-4222-80fc-a1305a996f0c	JYHvb8AW6w_XNFFD7frNo	9	2026-03-24	annual	pending	\N	low	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
23bf21b4-e368-4934-a922-0c21d8587d08	JYHvb8AW6w_XNFFD7frNo	11	2026-03-24	annual	pending	\N	high	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
d1d8a861-4be5-4290-ae5d-352011c80524	JYHvb8AW6w_XNFFD7frNo	13	2026-03-24	annual	pending	\N	medium	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
afa2fd2e-5c1f-4ef6-ac9a-4590958be260	JYHvb8AW6w_XNFFD7frNo	5	2026-05-23	biannual	pending	\N	low	\N	2025-11-24 04:22:58.232245	2025-11-24 04:22:58.232245	\N	\N	f	\N
b2af110d-886b-425c-903e-f42d04f4e804	Iuf6nQNQ3m_6IG1Ewo29Z	14	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:25:17.835295	2025-11-24 04:25:17.835295	\N	\N	f	\N
f8eefddc-67f0-4862-b684-4427ef78f27c	Iuf6nQNQ3m_6IG1Ewo29Z	15	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:25:17.835295	2025-11-24 04:25:17.835295	\N	\N	f	\N
f20d49a8-33c8-458e-9b8b-651946f482c9	Iuf6nQNQ3m_6IG1Ewo29Z	6	2025-12-24	quarterly	pending	\N	medium	\N	2025-11-24 04:25:17.835295	2025-11-24 04:25:17.835295	\N	\N	f	\N
4f741749-736f-42b3-8fed-9aa0b183518b	Iuf6nQNQ3m_6IG1Ewo29Z	10	2025-12-24	annual	pending	\N	high	\N	2025-11-24 04:25:17.835295	2025-11-24 04:25:17.835295	\N	\N	f	\N
647aa8cc-bfd7-40bf-9c56-2201d6302b2d	Iuf6nQNQ3m_6IG1Ewo29Z	12	2026-02-22	annual	pending	\N	high	\N	2025-11-24 04:25:17.835295	2025-11-24 04:25:17.835295	\N	\N	f	\N
e5fe3887-c3ae-4e98-9dc6-6b6cf90126d2	Iuf6nQNQ3m_6IG1Ewo29Z	11	2026-03-24	annual	pending	\N	high	\N	2025-11-24 04:25:17.835295	2025-11-24 04:25:17.835295	\N	\N	f	\N
1af900b7-69de-4492-9fb0-b90c4aca18d9	Iuf6nQNQ3m_6IG1Ewo29Z	13	2026-03-24	annual	pending	\N	medium	\N	2025-11-24 04:25:17.835295	2025-11-24 04:25:17.835295	\N	\N	f	\N
89ded86f-be66-4394-9659-fc0d803b3dd5	pdSJgyHOsK21xcaPSmipj	14	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:37:01.4925	2025-11-24 04:37:01.4925	\N	\N	f	\N
2ebe9f40-8a8e-474f-9dc0-3152483ad04b	pdSJgyHOsK21xcaPSmipj	15	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:37:01.4925	2025-11-24 04:37:01.4925	\N	\N	f	\N
d4168c72-be57-4a5d-a193-bee63dbd3b20	pdSJgyHOsK21xcaPSmipj	1	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:37:01.4925	2025-11-24 04:37:01.4925	\N	\N	f	\N
a2439123-106c-4045-93f4-0d07dd599b13	pdSJgyHOsK21xcaPSmipj	16	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:37:01.4925	2025-11-24 04:37:01.4925	\N	\N	f	\N
ffdecbd0-33ba-4fba-a87d-ef99fa0edd47	pdSJgyHOsK21xcaPSmipj	6	2025-12-24	quarterly	pending	\N	medium	\N	2025-11-24 04:37:01.4925	2025-11-24 04:37:01.4925	\N	\N	f	\N
ec0b43a9-4c91-4438-b012-d62ac4d6fb77	pdSJgyHOsK21xcaPSmipj	10	2025-12-24	annual	pending	\N	high	\N	2025-11-24 04:37:01.4925	2025-11-24 04:37:01.4925	\N	\N	f	\N
ab85b93a-9629-443f-9d70-e22601fdbded	pdSJgyHOsK21xcaPSmipj	3	2026-01-08	annual	pending	\N	medium	\N	2025-11-24 04:37:01.4925	2025-11-24 04:37:01.4925	\N	\N	f	\N
bdc0b559-7ba0-4395-86b4-bcb30b5d87d1	pdSJgyHOsK21xcaPSmipj	2	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:37:01.4925	2025-11-24 04:37:01.4925	\N	\N	f	\N
78b7970b-0fa8-416c-a2ca-a94232175c82	pdSJgyHOsK21xcaPSmipj	12	2026-02-22	annual	pending	\N	high	\N	2025-11-24 04:37:01.4925	2025-11-24 04:37:01.4925	\N	\N	f	\N
d622bfde-c5e7-410f-8cd5-93f9e953afff	pdSJgyHOsK21xcaPSmipj	11	2026-03-24	annual	pending	\N	high	\N	2025-11-24 04:37:01.4925	2025-11-24 04:37:01.4925	\N	\N	f	\N
9f4a0c06-b1b4-4a19-aedd-3012cd33f3d2	pdSJgyHOsK21xcaPSmipj	13	2026-03-24	annual	pending	\N	medium	\N	2025-11-24 04:37:01.4925	2025-11-24 04:37:01.4925	\N	\N	f	\N
7557d6f7-79d6-4198-97b0-fd666ca3c301	BsG5g14TCTc-hneXBLgy9	14	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
02775674-92a2-45eb-81bc-fcf41fb12aeb	BsG5g14TCTc-hneXBLgy9	15	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
02c262ef-9df3-421c-9d41-3a67975dc376	BsG5g14TCTc-hneXBLgy9	1	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
7b234ab4-4ff6-4e08-8bb6-5b9b072b524d	BsG5g14TCTc-hneXBLgy9	16	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
ff888486-9daf-4290-9b01-9a689a27402a	BsG5g14TCTc-hneXBLgy9	6	2025-12-24	quarterly	pending	\N	medium	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
43a335c9-9063-46c6-8b33-7fca45c4a43e	BsG5g14TCTc-hneXBLgy9	10	2025-12-24	annual	pending	\N	high	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
cae1e972-7857-486e-91b7-c13e8ad2cb0e	BsG5g14TCTc-hneXBLgy9	3	2026-01-08	annual	pending	\N	medium	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
30d14103-4edc-4e14-a840-736ebf9581a6	BsG5g14TCTc-hneXBLgy9	7	2026-01-08	biannual	pending	\N	high	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
79ba12fe-0241-455a-a58b-5f82e8efbfff	BsG5g14TCTc-hneXBLgy9	2	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
437b35f1-adfe-4ea4-8882-dd2f6ccd19c2	BsG5g14TCTc-hneXBLgy9	17	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
f4e77728-6a5d-42a9-b052-a66c4d334fe9	BsG5g14TCTc-hneXBLgy9	18	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
be0f446e-de40-40f1-b0cb-71ea38650404	BsG5g14TCTc-hneXBLgy9	19	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
119b8b54-c7c3-400d-af00-cd3786c360c7	BsG5g14TCTc-hneXBLgy9	8	2026-02-22	annual	pending	\N	medium	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
223b6c08-4f16-44fa-82db-2cd5110dddfc	BsG5g14TCTc-hneXBLgy9	12	2026-02-22	annual	pending	\N	high	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
cab2245c-882b-43b3-b9b1-b6be45a0d57d	BsG5g14TCTc-hneXBLgy9	20	2026-02-22	biannual	pending	\N	medium	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
bab259a0-07d3-4ede-bc7d-9958e5138a9c	BsG5g14TCTc-hneXBLgy9	9	2026-03-24	annual	pending	\N	low	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
d452607e-16cd-4c10-867d-ed33e4aed1c7	BsG5g14TCTc-hneXBLgy9	11	2026-03-24	annual	pending	\N	high	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
c8542b56-5780-48d3-817b-42ee807443be	BsG5g14TCTc-hneXBLgy9	13	2026-03-24	annual	pending	\N	medium	\N	2025-11-24 04:40:42.263424	2025-11-24 04:40:42.263424	\N	\N	f	\N
23a19ee4-6d61-49f9-9483-f2a9e85c2be7	EF1Fp7hplZ0tFBIfvk35r	14	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
87e2af29-2e61-4cbc-a826-1c5065ce7a10	EF1Fp7hplZ0tFBIfvk35r	15	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
49bbf2b8-853c-4a05-9ff7-809f71d10946	EF1Fp7hplZ0tFBIfvk35r	1	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
4db20dff-c33d-413c-adfa-05343401d743	EF1Fp7hplZ0tFBIfvk35r	16	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
66520fd5-b89a-44cd-b52e-549bfb224e04	EF1Fp7hplZ0tFBIfvk35r	6	2025-12-24	quarterly	pending	\N	medium	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
52f1dbb7-dc6e-4b97-9ae0-738d08f8061d	EF1Fp7hplZ0tFBIfvk35r	10	2025-12-24	annual	pending	\N	high	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
82a6dd58-d276-41ef-8df9-67585eec859e	EF1Fp7hplZ0tFBIfvk35r	3	2026-01-08	annual	pending	\N	medium	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
5fb2500c-cb75-4d2b-99b3-76e035668e30	EF1Fp7hplZ0tFBIfvk35r	2	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
f6ecfa1d-3e49-4615-9ab7-826de55d1f1b	EF1Fp7hplZ0tFBIfvk35r	4	2026-02-22	annual	pending	\N	medium	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
286131ac-768a-4daa-a762-67adf51c01c9	EF1Fp7hplZ0tFBIfvk35r	12	2026-02-22	annual	pending	\N	high	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
66027885-f514-4bb1-9e3e-b0ff390afdea	EF1Fp7hplZ0tFBIfvk35r	11	2026-03-24	annual	pending	\N	high	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
00e0c2b8-8968-4175-8135-b675e932884a	EF1Fp7hplZ0tFBIfvk35r	13	2026-03-24	annual	pending	\N	medium	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
615db95a-4a53-437a-8211-f26914a71c1c	EF1Fp7hplZ0tFBIfvk35r	5	2026-05-23	biannual	pending	\N	low	\N	2025-11-24 04:45:26.055418	2025-11-24 04:45:26.055418	\N	\N	f	\N
1cc2acd0-65ac-4d9d-8f73-d135eba6d37f	d7UP30d1ijkuuhjxyrvUU	14	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
bd17c3f9-580f-4535-b60f-3bfcb7ea4813	d7UP30d1ijkuuhjxyrvUU	15	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
ab93464e-8752-4913-8e5b-dd4f56ffea59	d7UP30d1ijkuuhjxyrvUU	1	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
140dcf89-6415-4813-9294-be267a7a4a6a	d7UP30d1ijkuuhjxyrvUU	16	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
0dc32898-4a8a-4819-829f-fb36fadb5093	d7UP30d1ijkuuhjxyrvUU	6	2025-12-24	quarterly	pending	\N	medium	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
d4530028-8f70-4acc-a342-00e14df97924	d7UP30d1ijkuuhjxyrvUU	10	2025-12-24	annual	pending	\N	high	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
5dbcd7f5-3035-4952-ae9c-d2ed8d04e1b9	d7UP30d1ijkuuhjxyrvUU	3	2026-01-08	annual	pending	\N	medium	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
78930fd8-dd3a-4ed3-8d09-3b2425511099	d7UP30d1ijkuuhjxyrvUU	7	2026-01-08	biannual	pending	\N	high	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
c36c9fee-5ee0-41e9-a2b5-37a2d823294d	d7UP30d1ijkuuhjxyrvUU	2	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
62efb3be-8438-471f-840e-484df7c3c0a4	d7UP30d1ijkuuhjxyrvUU	17	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
7f77f20f-8ab1-4139-ae76-28fa6b144ad1	d7UP30d1ijkuuhjxyrvUU	18	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
33631e52-60e5-43af-a6e1-16c1a51b496c	d7UP30d1ijkuuhjxyrvUU	4	2026-02-22	annual	pending	\N	medium	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
fdc7495d-fef0-482f-8551-d4899819b5ae	d7UP30d1ijkuuhjxyrvUU	8	2026-02-22	annual	pending	\N	medium	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
41a15d6b-e56b-4dd1-a579-5c6aec59f9ca	d7UP30d1ijkuuhjxyrvUU	12	2026-02-22	annual	pending	\N	high	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
d81a5cee-8ee6-478b-8eba-ed913ea7e4fa	d7UP30d1ijkuuhjxyrvUU	19	2026-02-22	annual	pending	\N	medium	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
257a9f67-3a85-4290-8951-8b00e6a26aa0	d7UP30d1ijkuuhjxyrvUU	20	2026-02-22	biannual	pending	\N	medium	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
73971c98-a862-41fa-a9ff-1694d270c6c0	d7UP30d1ijkuuhjxyrvUU	9	2026-03-24	annual	pending	\N	low	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
6d69d501-c6f1-42e7-9883-c79d9e797ccc	d7UP30d1ijkuuhjxyrvUU	11	2026-03-24	annual	pending	\N	high	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
14017b4a-0dac-4a22-a55a-c63f50dd5ba1	d7UP30d1ijkuuhjxyrvUU	13	2026-03-24	annual	pending	\N	medium	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
21093d79-5b96-4dd7-a16f-9d0e9e78225b	d7UP30d1ijkuuhjxyrvUU	5	2026-05-23	biannual	pending	\N	low	\N	2025-11-24 04:46:52.22351	2025-11-24 04:46:52.22351	\N	\N	f	\N
b09de896-6a32-49aa-b861-e84c3414d7b8	9M8RO_Rs8kQuk1nxhp-Kj	14	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:48:29.289509	2025-11-24 04:48:29.289509	\N	\N	f	\N
c931eff7-f2d0-40e0-b814-825bd4a5ebbc	9M8RO_Rs8kQuk1nxhp-Kj	15	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:48:29.289509	2025-11-24 04:48:29.289509	\N	\N	f	\N
5efbe50c-b02c-414a-9a9d-3c26f087de6a	9M8RO_Rs8kQuk1nxhp-Kj	1	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:48:29.289509	2025-11-24 04:48:29.289509	\N	\N	f	\N
36a0d083-13d7-4b5f-bb8a-185d19db37cc	9M8RO_Rs8kQuk1nxhp-Kj	16	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:48:29.289509	2025-11-24 04:48:29.289509	\N	\N	f	\N
80e9acb9-2489-45e6-b437-f30acdd9ef47	9M8RO_Rs8kQuk1nxhp-Kj	6	2025-12-24	quarterly	pending	\N	medium	\N	2025-11-24 04:48:29.289509	2025-11-24 04:48:29.289509	\N	\N	f	\N
2ba8f5b5-a0ef-4c42-8bf9-5f542c7184b2	9M8RO_Rs8kQuk1nxhp-Kj	10	2025-12-24	annual	pending	\N	high	\N	2025-11-24 04:48:29.289509	2025-11-24 04:48:29.289509	\N	\N	f	\N
d519030e-87a4-449a-bea4-5aa7170563b8	9M8RO_Rs8kQuk1nxhp-Kj	3	2026-01-08	annual	pending	\N	medium	\N	2025-11-24 04:48:29.289509	2025-11-24 04:48:29.289509	\N	\N	f	\N
62e0fe5a-4d73-4200-84c8-9c1c448156b5	9M8RO_Rs8kQuk1nxhp-Kj	2	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:48:29.289509	2025-11-24 04:48:29.289509	\N	\N	f	\N
610e1a4d-b8c3-41cb-bd97-888b8874dc99	9M8RO_Rs8kQuk1nxhp-Kj	12	2026-02-22	annual	pending	\N	high	\N	2025-11-24 04:48:29.289509	2025-11-24 04:48:29.289509	\N	\N	f	\N
12023487-412c-4f9a-85ee-ff3b5b23ff52	9M8RO_Rs8kQuk1nxhp-Kj	11	2026-03-24	annual	pending	\N	high	\N	2025-11-24 04:48:29.289509	2025-11-24 04:48:29.289509	\N	\N	f	\N
c74bc6e4-d28e-4297-a768-c03f9bf2c284	9M8RO_Rs8kQuk1nxhp-Kj	13	2026-03-24	annual	pending	\N	medium	\N	2025-11-24 04:48:29.289509	2025-11-24 04:48:29.289509	\N	\N	f	\N
8e6d169b-45c5-4fb7-b165-8c715e056b70	Slx9P7SVGGoL3rpDe2rzM	14	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
5de9039b-7628-4dfe-b425-bfce9be61b70	Slx9P7SVGGoL3rpDe2rzM	15	2025-12-01	monthly	pending	\N	high	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
0ddd2440-1f0b-4ae7-823d-7c4485fa6900	Slx9P7SVGGoL3rpDe2rzM	1	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
708bac66-4885-40c4-9a8d-0b5f2f9c0b66	Slx9P7SVGGoL3rpDe2rzM	16	2025-12-08	monthly	pending	\N	high	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
50a66e58-64bc-4cac-92ce-7106075035a7	Slx9P7SVGGoL3rpDe2rzM	6	2025-12-24	quarterly	pending	\N	medium	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
10ad6bc1-2e95-4648-9f0d-b05c56b68ebb	Slx9P7SVGGoL3rpDe2rzM	8	2025-12-24	annual	pending	\N	high	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
c429d581-c639-4515-8112-b48b52e61ca7	Slx9P7SVGGoL3rpDe2rzM	10	2025-12-24	annual	pending	\N	high	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
ec6e078d-96f9-490b-992d-0e11defc8e2a	Slx9P7SVGGoL3rpDe2rzM	3	2026-01-08	annual	pending	\N	medium	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
b6107979-5b60-4e3d-8d1f-27573551d648	Slx9P7SVGGoL3rpDe2rzM	7	2026-01-08	biannual	pending	\N	high	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
73daa5f0-f25c-4fce-a0c4-00bf7aca36ba	Slx9P7SVGGoL3rpDe2rzM	2	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
772abe7e-244f-482d-b8a3-7b6ea0d74653	Slx9P7SVGGoL3rpDe2rzM	17	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
f721acfb-d2ee-4857-b70a-be018cdcb9d7	Slx9P7SVGGoL3rpDe2rzM	18	2026-01-23	annual	pending	\N	medium	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
fda9be22-dd70-4b0b-ae0f-b1cae1f7fa6d	Slx9P7SVGGoL3rpDe2rzM	4	2026-02-22	annual	pending	\N	medium	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
86b56b8f-ae53-4ca5-b021-c61e0e1faaad	Slx9P7SVGGoL3rpDe2rzM	12	2026-02-22	annual	pending	\N	high	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
884e6634-8d2d-4c7a-9052-e44a75592e4b	Slx9P7SVGGoL3rpDe2rzM	19	2026-02-22	annual	pending	\N	medium	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
77e8cb5d-b5a8-423e-a9b5-03fd0167ac86	Slx9P7SVGGoL3rpDe2rzM	20	2026-02-22	biannual	pending	\N	medium	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
28c28896-0491-4362-b698-a3dcb6e56508	Slx9P7SVGGoL3rpDe2rzM	9	2026-03-24	annual	pending	\N	low	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
d0c081ae-fab4-4476-930e-db73632f8cd0	Slx9P7SVGGoL3rpDe2rzM	11	2026-03-24	annual	pending	\N	high	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
639ff71d-8f96-444c-864e-f739193220ed	Slx9P7SVGGoL3rpDe2rzM	13	2026-03-24	annual	pending	\N	medium	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
b2f96cfc-d8f5-441c-8ccd-90353fbed54d	Slx9P7SVGGoL3rpDe2rzM	5	2026-05-23	biannual	pending	\N	low	\N	2025-11-24 04:49:27.9711	2025-11-24 04:49:27.9711	\N	\N	f	\N
\.


--
-- Data for Name: households; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.households (id, name, email, phone, notification_preference, sms_opt_in, preferred_contact, created_at, updated_at, address_line_1, address_line_2, city, state, zipcode, setup_status, setup_completed_at, setup_started_at, order_id, last_modified_by, setup_notes, setup_issues, magnet_code, magnet_token, created_by, created_by_user_id) FROM stdin;
cvTTFNZQOcraS2uUZEyZz	Demola Lawal 2	samuel.fapohunda@gmail.com	16786509430	both	f	\N	2025-11-23 16:26:01.782	2025-11-23 16:27:25.856	\N	\N	\N	\N	30126	completed	\N	2025-11-23 16:26:01.782	\N	agent_samuel	This is good	\N	\N	\N	admin	agent_samuel
T1HrO2Hg55Ols_c3BKl2Z	Moo Moo	samuel.fapohunda@gmail.com	14044886739	both	f	\N	2025-11-23 19:44:32.333	2025-11-23 19:44:32.333	\N	\N	\N	\N	07036	in_progress	\N	2025-11-23 19:44:32.333	\N	\N	\N	\N	\N	\N	admin	agent_samuel
svi1XjdJq2gdgwMH7pYA6	Samuel Fapohunda	samuel.fapohunda@gmail.com	14044886739	both	f	\N	2025-11-23 21:15:06.441	2025-11-23 21:15:06.441	\N	\N	\N	\N	30281	in_progress	\N	2025-11-23 21:15:06.441	\N	\N	\N	\N	\N	\N	admin	agent_samuel
_Lm5Dab9cAcdi8tGYXzT1	John Doe	john@example.com	4045551234	both	f	\N	2025-11-24 02:47:05.697	2025-11-24 02:47:05.697	\N	\N	\N	\N	30281	completed	2025-11-24 02:47:05.697	2025-11-24 02:47:05.697	f31d3ea8-a23a-43ad-b8f4-4db2fc1ccf0a	\N	\N	\N	\N	PGXWEvfxXTrN	customer	\N
8MFmHdsE_AfuIp4FIxFfU	Test Complete	testcomplete@example.com	4045551234	both	f	\N	2025-11-24 03:13:59.48	2025-11-24 03:13:59.48	\N	\N	\N	\N	30281	completed	2025-11-24 03:13:59.48	2025-11-24 03:13:59.48	00893ef8-9c2c-4657-937a-87a42c2d8608	\N	\N	\N	\N	EHLZShvzpSNJ	customer	\N
yDn5ImCZUgD50FMSM-ZVI	Phase 2 Test User	samuel@upkeepqr.com	4045551234	both	f	\N	2025-11-24 03:54:25.133	2025-11-24 03:54:25.133	\N	\N	\N	\N	30281	completed	2025-11-24 03:54:25.133	2025-11-24 03:54:25.133	281934e3-0670-49e2-bf45-7a74b9cdceab	\N	\N	\N	\N	OJnpwr1c8PsQ	customer	\N
B5_UOjOczjtckKCzvZSs_	José Álvarez-O'Brien	samuel@upkeepqr.com	\N	both	f	\N	2025-11-24 03:56:23.574	2025-11-24 03:56:23.574	\N	\N	\N	\N	30281	completed	2025-11-24 03:56:23.574	2025-11-24 03:56:23.574	f0c2c9af-a120-4fbb-a2cc-1b8912fae59c	\N	\N	\N	\N	irJc-W5OdAFh	customer	\N
SQ_v1WKOAKIDLknD_GlWW	Task Test User	tasktest@example.com	\N	email_only	f	email	2025-11-24 04:21:55.885	2025-11-24 04:21:55.885	\N	\N	\N	\N	30281	completed	2025-11-24 04:21:55.885	2025-11-24 04:21:55.885	2ee4d838-d39a-4756-a087-70e617533e22	\N	\N	\N	\N	pF__LLpHs0E5	customer	\N
JYHvb8AW6w_XNFFD7frNo	Task Generation Test	taskgen@example.com	\N	email_only	f	email	2025-11-24 04:22:58.244	2025-11-24 04:22:58.244	\N	\N	\N	\N	30281	completed	2025-11-24 04:22:58.244	2025-11-24 04:22:58.244	8d00bdf9-20d7-45f7-ae55-785eb69e0dc1	\N	\N	\N	\N	YLBZGdorl7PL	customer	\N
Iuf6nQNQ3m_6IG1Ewo29Z	No HVAC Test	nohvac@example.com	\N	email_only	f	email	2025-11-24 04:25:17.846	2025-11-24 04:25:17.846	\N	\N	\N	\N	30281	completed	2025-11-24 04:25:17.846	2025-11-24 04:25:17.846	1a74022e-5453-4801-b57d-d940c4c80637	\N	\N	\N	\N	5I0k_9t0aHYd	customer	\N
pdSJgyHOsK21xcaPSmipj	Condo Test	condotest@example.com	\N	both	f	\N	2025-11-24 04:37:01.498	2025-11-24 04:37:01.498	\N	\N	\N	\N	30281	completed	2025-11-24 04:37:01.498	2025-11-24 04:37:01.498	1a54fafd-3bee-4b22-a2b9-fc7dfa67e718	\N	\N	\N	\N	OYQJd6hZP-NN	customer	\N
BsG5g14TCTc-hneXBLgy9	Debug Test	debugtest@example.com	\N	both	f	\N	2025-11-24 04:40:42.269	2025-11-24 04:40:42.269	\N	\N	\N	\N	30281	completed	2025-11-24 04:40:42.269	2025-11-24 04:40:42.269	0709954e-6a8b-47fd-87a5-fa08e3439ca6	\N	\N	\N	\N	QKgbc1dsIhZq	customer	\N
EF1Fp7hplZ0tFBIfvk35r	Condo Test User	condo@example.com	\N	email_only	f	email	2025-11-24 04:45:26.07	2025-11-24 04:45:26.07	\N	\N	\N	\N	90210	completed	2025-11-24 04:45:26.07	2025-11-24 04:45:26.07	f3e738e8-646e-498a-bd46-572184e97fd0	\N	\N	\N	\N	wO3JvfgTHKSm	customer	\N
d7UP30d1ijkuuhjxyrvUU	Single Family Validation	validation@example.com	\N	email_only	f	email	2025-11-24 04:46:52.228	2025-11-24 04:46:52.228	\N	\N	\N	\N	33101	completed	2025-11-24 04:46:52.228	2025-11-24 04:46:52.228	16b01232-f5f1-4655-8201-b3868b5ad3e4	\N	\N	\N	\N	AL7CPn5FseZw	customer	\N
9M8RO_Rs8kQuk1nxhp-Kj	Fixed Condo Test	fixedcondo@example.com	\N	both	f	\N	2025-11-24 04:48:29.307	2025-11-24 04:48:29.307	\N	\N	\N	\N	30281	completed	2025-11-24 04:48:29.307	2025-11-24 04:48:29.307	fea5fb82-9b7b-448d-9b1d-5bed9232ee1d	\N	\N	\N	\N	F9qDWh5Ig1La	customer	\N
Slx9P7SVGGoL3rpDe2rzM	Single Family Test	singlefamily@example.com	4045551234	both	f	\N	2025-11-24 04:49:27.978	2025-11-24 04:49:27.978	\N	\N	\N	\N	30281	completed	2025-11-24 04:49:27.978	2025-11-24 04:49:27.978	004f521a-f7c5-44a8-bcd5-4d07fbc1e8d5	\N	\N	\N	\N	9req5IUYQtU_	customer	\N
2W1pLLfpYBwPNbMmi_tiq	Samuel Fapohunda	samuel.fapohunda@gmail.com	14044886739	both	f	\N	2025-11-23 03:43:06.412	2025-11-23 03:43:06.412	\N	\N	\N	\N	30281	in_progress	\N	2025-11-23 03:43:06.412	\N	\N	\N	\N	\N	\N	admin	agent_samuel
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, full_name, email, phone, preferred_contact, hear_about_us, street_address, city, state, zip_code, property_type, number_of_locations, location_nickname, home_type, square_footage, roof_age, hvac_system_type, water_heater_type, number_of_assets, asset_categories, company_name, industry_type, number_of_employees, business_website, preferred_service_type, estimated_qr_labels, interest_type, need_consultation, is_owner, budget_range, timeline_to_proceed, preferred_contact_time, notes, activation_code, created_at) FROM stdin;
Z41Gec58vG6ZEwiH	John Smith	john@example.com	5551234567	\N	\N	123 Main Street	Atlanta	GA	30301	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	TEST-CODE-123	2025-11-23 20:40:45.492096
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notes (id, request_id, author, message, created_at) FROM stdin;
\.


--
-- Data for Name: order_magnet_audit_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_magnet_audit_events (id, order_id, item_id, created_at, actor, type, data) FROM stdin;
\.


--
-- Data for Name: order_magnet_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_magnet_batches (id, name, printer_name, status, unit_cost, quantity, submitted_at, completed_at, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: order_magnet_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_magnet_items (id, order_id, sku, quantity, unit_price, activation_code, qr_url, activation_status, activated_at, activated_by_email, scan_count, last_scan_at, print_batch_id, serial_number, print_file_url, created_at, updated_at) FROM stdin;
48b16b1d-83f7-43d2-970a-159bea49b5d4	00893ef8-9c2c-4657-937a-87a42c2d8608	single	1	35.00	EHLZShvzpSNJ	data:image/png;base64,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	active	2025-11-24 03:13:59.48	testcomplete@example.com	0	\N	\N	\N	\N	2025-11-13 03:00:36.21135	2025-11-24 03:13:59.48
9b6f35ef-3e05-4e6d-9951-5b338cdd5d85	f0c2c9af-a120-4fbb-a2cc-1b8912fae59c	single	1	19.00	irJc-W5OdAFh	data:image/png;base64,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o6dEum7oGp1Euk66Rr8R6bqha4T/jgkAljABwBImAFjCBABLmABgCRMALGECgCVMALDERy8U6XpK1+gpXaPfiHSdRLpuiHSddI1OIl03dI1OIl0nXaMnRbrepGt0Euk66Rq9iQkAljABwBImAFjCBABLmABgCRMALGECgCVMALDER3hMpOuWrtFJpGubSNcNka6TrtFvdI1OIl0nXaMbIl0nka6TrtENka6TrtENJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAljABwBIfYaVI10nX6IZI1w1do5NI1w1do1siXU+JdJ10jW6IdJ10jd7EBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWOKjF+oa/UVdo1siXTdEuk66Rk/pGt0Q6TrpGm0U6bqha3QS6TrpGj3FBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWOKjh0W6/lWRrlu6Rm8S6bqha3QS6XqbrtFJpOuka3RDpOsvMgHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJb4+v4hAFjABABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS/wHnFY2s/haB3oAAAAASUVORK5CYII=	active	2025-11-24 03:56:23.574	samuel@upkeepqr.com	0	\N	\N	\N	\N	2025-11-13 03:12:37.187932	2025-11-24 03:56:23.574
d4a8f5d4-1819-4876-93fb-0fb6550095f4	281934e3-0670-49e2-bf45-7a74b9cdceab	single	1	35.00	OJnpwr1c8PsQ	data:image/png;base64,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	active	2025-11-24 03:54:25.133	samuel@upkeepqr.com	1	2025-11-24 03:55:28.393	\N	\N	\N	2025-11-13 01:04:48.265219	2025-11-24 03:54:25.133
4b49eae4-e995-4d6d-b1dc-4461f9789c75	8d00bdf9-20d7-45f7-ae55-785eb69e0dc1	single	1	35.00	YLBZGdorl7PL	data:image/png;base64,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	active	2025-11-24 04:22:58.244	taskgen@example.com	0	\N	\N	\N	\N	2025-11-15 01:38:40.385958	2025-11-24 04:22:58.244
c6b220bb-37c8-4796-8b48-740bae8b2a51	f3e738e8-646e-498a-bd46-572184e97fd0	single	1	19.00	wO3JvfgTHKSm	data:image/png;base64,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	active	2025-11-24 04:45:26.07	condo@example.com	0	\N	\N	\N	\N	2025-11-19 12:22:38.725302	2025-11-24 04:45:26.07
c2fa18f8-b417-4a81-8fb5-92484c646948	22c4d264-7bc6-4905-8aba-6ee8a460420f	single	1	853.15	ZsL0y8wDIy6K	data:image/png;base64,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	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-19 13:39:21.975282	2025-11-19 13:39:21.975282
3d92fcb0-99b1-4ab4-972d-75000622952b	0709954e-6a8b-47fd-87a5-fa08e3439ca6	single	1	35.00	QKgbc1dsIhZq	data:image/png;base64,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	active	2025-11-24 04:40:42.269	debugtest@example.com	0	\N	\N	\N	\N	2025-11-19 12:59:17.280541	2025-11-24 04:40:42.269
9f977612-c799-48e7-b4be-ae6037421033	16b01232-f5f1-4655-8201-b3868b5ad3e4	single	1	853.15	AL7CPn5FseZw	data:image/png;base64,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jZ7SNXpKpOuka3SDCQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsMRHLxTpekrX6KeKdJ10jU66RieRrhu6Rk/pGn0j0nUS6dom0nXSNTrpGj3FBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWOIjvE6k600iXSddo5NI10mk6yldo1u6RjdEuk66RieRrhsiXTd0jW4wAcASJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAlvgIr9M1Ool03RDpOukanUS6ntI1uiHS9aRI1w2RrjfpGj3FBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWOKjF+oa/URdo29Euk66RieRrhsiXSddoxsiXTdEuk66Rt+IdJ1Euk66RieRrqd0jU4iXW9iAoAlTACwhAkAljABwBImAFjCBABLmABgCRMALPHRwyJdf6tI19t0jW6IdD0l0vWkrtFJpOsk0vUmka6TrtGbmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEv8+v2HAGABEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLmABgCRMALPE/ESspyaSscUYAAAAASUVORK5CYII=	active	2025-11-24 04:46:52.228	validation@example.com	0	\N	\N	\N	\N	2025-11-19 12:36:06.021565	2025-11-24 04:46:52.228
52978e0d-710b-4bff-8b13-9fcd827dfeff	600f7f82-0de4-481f-9078-c57b8c7c73c6	single	1	853.15	SPbTdBTKAV8J	data:image/png;base64,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wBIfPaxrtE2k620iXSddo5NI10nX6IZI15t0jX4i0nVD1+g36ho9xQQAS5gAYAkTACxhAoAlTACwhAkAljABwBImAFjioxeKdD2la/SUSNctXaOTSNebdI1+q0jXm3SNbuganUS6TrpGN5gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLfITHdI1uiXSddI1uiHSddI1OIl2/VdfoKZGuGyJd25gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLfITHRLp+omt0Q6TrKZGuk67RSaTrpGt0Eum6pWt0Euk66RqdRLpuiHSddI1uiHQ9xQQAS5gAYAkTACxhAoAlTACwhAkAljABwBImAFjioxfqGv1GXaNbukY3RLpu6Brd0DU6iXSddI1OIl0/Eel6StfoTSJdJ12jp5gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLfPSwSNdfFen6ia7RDZGup0S6TrpGJ5Gup3SNfiLSddI1uiHS9ZSu0Q2RrpOu0Q0mAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEl/f/wgAFjABwBImAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcAS/wG42jtsmr+42gAAAABJRU5ErkJggg==	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-19 15:08:31.596355	2025-11-19 15:08:31.596355
7c6df293-386f-4c3e-bf01-b712500f18a3	fa1e284a-0bb9-44c2-a205-d12dbbae5ca9	single	1	853.15	xu9Ytanuzq4t	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAjeSURBVO3BwW0twQ1FwSviZcINmX8w5IaxyErAaAFuD4Zfp+rr+4cAYAETACxhAoAlTACwhAkAljABwBImAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJT66KNL1V3WNbol0vUnX6IZI10nX6IZI1y1doxsiXX9V1+gGEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYImPHtY12ibSdUOk65au0Q2RrpNI10nX6CmRridFuk66Rjd0jbaJdD3FBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWOKjF4p0PaVr9JSu0W9Euk4iXSddo5Ou0ZtEuk66RjdEujaKdD2la/QmJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAljABwBIf4XW6RieRrhsiXSddoxu6RieRrhsiXfj3mABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEt8hMdEun6ja3TSNbqha/SUSNdJ1+iGrtFJpOs3ukZ4BxMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGCJj16oa/Qv6hrdEum6oWt0Eul6SqTrbSJdJ12jp3SN/ioTACxhAoAlTACwhAkAljABwBImAFjCBABLmABgiY8eFun6qyJdv9E1uqFrdBLpOukanUS6TrpGJ5Guk67RSaTrpGv0G5Gup0S68N+ZAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS3x9/xBeJdJ10jU6iXSddI1OIl0nXaOTSNdTuka3RLpOukb4/zMBwBImAFjCBABLmABgCRMALGECgCVMALCECQCW+OiiSNdJ1+gk0nXSNTqJdJ10jU4iXSddo1u6Rk+JdD2la3RDpOuGSNdGka6TrtENka6TrtFTTACwhAkAljABwBImAFjCBABLmABgCRMALGECgCVMALDE1/cPXRLpOukaPSXSddI1eptI11O6RieRrhu6RieRrqd0jW6JdN3QNboh0nXSNboh0nXSNbrBBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWOKjpSJdT4l0Palr9CZdozfpGv2rIl03dI1OIl3bmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEt8ff/QgyJdJ12jGyJdJ12jp0S6fqNr9JRI1w1doxsiXRt1jf5Fka6TrtFTTACwhAkAljABwBImAFjCBABLmABgCRMALGECgCW+vn/okkjXSdfoJNJ1Q9fohkjXDV2jWyJdJ12jp0S63qRrdBLpepuu0Q2RrpOu0Umk64au0Q0mAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEh89LNJ10jU6iXSdRLpu6BrdEOn6ja7RDZGuG7pGJ12jGyJdN0S6TrpGvxHpOukanUS6tukanUS6nmICgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAs8fX9Q39YpOuGrtHbRLqe0jV6k0jXSdfoSZGuG7pGJ5Guk67RSaTrhq7RDSYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASHz0s0nVD1+gk0nXSNXpKpOs3ukZP6Ro9JdJ10jU6iXSddI1uiXTd0DU6iXSdRLrepGv0FBMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGCJr+8fuiTS9ZSu0VMiXTd0jX4j0nXSNTqJdN3QNXpKpOsv6xrdEOk66RqdRLpu6BrdYAKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYAkTACzx0UVdo5NI10nX6CmRrpOu0Q2Rrid1jU4iXSeRrpOu0VO6Rk+KdJ10jU4iXW8S6TrpGp1Eup5iAoAlTACwhAkAljABwBImAFjCBABLmABgCRMALPHRRZGuk67Rm3SNTiJdN3SNfiPSdRLpOukanXSNboh0nXSNboh0nXSNbukavUmk66RrdEOk601MALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJb6+f+hBka436RrdEOm6pWt0Eum6oWt0Eun6F3WN3ibSddI1Ool0nXSNTiJdJ12jp5gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLmABgia/vH7ok0nXSNboh0vUmXaOTSNfbdI1uiHSddI1uiHSddI1uiXRt0zX6F5kAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLfHRR1+gpXaO/rGt0Euk6iXSddI2eEuk66RqdRLqe1DV6SqTrhkjXU7pGN5gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLfHRRpOuv6hqddI1uiXQ9JdJ10jW6oWv0r4p0nXSNboh0nXSNTiJdb2ICgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAs8dHDukbbRLo26hqdRLpOukY3RLpOukYnka6TrtEtka4bukbbdI1OIl1PMQHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJb46IUiXU/pGj0l0vUbXaOTrtFJpOuka4T/XaTrTbpGN0S63sQEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBY4iM8pmv0G5Guk67RSdfoJNJ1Q9fohkjXDZGuJ3WNnhLpuiHStY0JAJYwAcASJgBYwgQAS5gAYAkTACxhAoAlTACwxEd4TKTrN7pGJ5Guk67RDV2jG7pGbxLp+o2u0Umk66RrdBLpuiHSddI1uiHS9RQTACxhAoAlTACwhAkAljABwBImAFjCBABLmABgiY9eqGv0L+oa/Uak64ZI10nX6CTSddI1Ool0nXSNTiJdT4p0PaVr9CaRrpOu0VNMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJT56WKTrr4p0vU2k64ZI1zZdo9+IdJ10jW6IdD2la3RDpOuka3SDCQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsMTX9w8BwAImAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBY4j8Wd08nIMKt5AAAAABJRU5ErkJggg==	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-22 02:20:42.394107	2025-11-22 02:20:42.394107
7577c053-dac8-4530-901d-6cb1038fbc5d	a6af51c7-a4a0-4413-b477-965864fb0029	single	1	35.00	G2e7b-Aa_xrR	data:image/png;base64,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	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-22 03:04:42.783478	2025-11-22 03:04:42.783478
fb3db767-6431-4df4-ac63-9911ba9eb99c	dd0c602c-7e5d-4543-841c-57116d849744	single	1	35.00	1HEPh8cKFXwg	data:image/png;base64,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	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-22 16:48:45.945522	2025-11-22 16:48:45.945522
c92d8698-87e4-4a78-acbc-e196b2ee8f4d	72a5f246-7f13-4d62-b6b7-e6e54223bd62	single	1	35.00	j0h-1wbMfB4A	data:image/png;base64,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	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-22 17:14:49.626176	2025-11-22 17:14:49.626176
0f296e74-21e5-4929-822b-b8bda822bec5	8513d356-b352-42f5-9a75-02d4cffb327d	single	1	35.00	bJb2RpE9mi5v	data:image/png;base64,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	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-22 17:21:07.70471	2025-11-22 17:21:07.70471
f1755146-f44e-4481-8b21-5ab45333a046	6cad00a5-a395-4afc-8987-eda814a119e7	single	1	19.00	UdaOVVxGdy6z	data:image/png;base64,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	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-22 17:22:23.764047	2025-11-22 17:22:23.764047
2e398505-5ef9-4be4-afd6-7d615e9b015d	30692a48-2481-45b6-a307-f5d7ac56fbcf	single	1	35.00	Hq8ft2EzqHCE	data:image/png;base64,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	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-22 17:31:22.705394	2025-11-22 17:31:22.705394
67449fd4-122f-463c-9c82-61c8016937d8	14601307-22a5-4504-963c-d69b0d6fe7cf	single	1	19.00	dP_K-1uat7c9	data:image/png;base64,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	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-22 17:46:49.216354	2025-11-22 17:46:49.216354
28ac2242-6a4c-4941-a576-d334aeb020c7	9cef547e-2537-412f-a8fb-42b34f5e397a	single	1	35.00	SZR-odDToUYb	data:image/png;base64,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	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-23 01:34:12.909239	2025-11-23 01:34:12.909239
85e234d8-811e-4f0a-b83e-9b3327226841	8cb30e08-585f-422b-a1f9-e39c036b6470	single	1	35.00	M0duWucDMuoO	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAi0SURBVO3BwXEtQQpFwSviecIG/DcGNtiikQMzpUVNR6N/Mr++fwgAFjABwBImAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBY4qOLIl3/qq7RkyJdJ12jN4l0nXSNboh03dI1uiHS9a/qGt1gAoAlTACwhAkAljABwBImAFjCBABLmABgCRMALPHRw7pG20S6boh0/UbX6KRrdEOk600iXW8T6TrpGt3QNdom0vUUEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYImPXijS9ZSu0VO6RrdEuk66Rjd0jf6iSNdGka6ndI3exAQAS5gAYAkTACxhAoAlTACwhAkAljABwBImAFjiI/xZka6TrtENka6TrtFTIl34e0wAsIQJAJYwAcASJgBYwgQAS5gAYAkTACxhAoAlPsJjIl2/0TW6oWt0Eun6i7pGJ5Gu3+ga4R1MALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJT56oa7RX9Q1epuu0Q2RrpNI10nX6CTS9aRI10nX6Cldo3+VCQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsMRHD4t0/asiXb/RNXpKpOuka3RD1+gk0nXSNTqJdJ10jX4j0vWUSBf+OxMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGCJr+8fwp8U6fpXdY1uiXSddI3w/2cCgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAs8dFFka6TrtFJpOuka3QS6TrpGp1Euk66RrdEuk66Riddo5NI10nX6CmRrqdEujaKdJ10jW6IdJ10jZ5iAoAlTACwhAkAljABwBImAFjCBABLmABgCRMALGECgCW+vn/oQZGuk67RUyJdJ12jk0jXLV2jk0jXU7pGN0S63qRrdEuk64au0Q2RrpOu0Q2RrpOu0Q0mAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEh8tFem6oWt0Euk66RqdRLqe1DW6IdJ10jU66Rrhf4t03dA1Ool0bWMCgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAs8fX9Q5dEuk66RieRrhu6RieRrpOu0Umk66Rr9BuRrr+oa3RDpOttukZ/UaTrpGv0FBMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGCJr+8feplI11O6RieRrrfpGr1JpOuka3QS6bqha3QS6XqbrtENka6TrtFJpOuGrtENJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAljABwBIfXRTp2ibSddI1Ool03dI12qZr9CaRrpOu0W9Euk66RieRrm26RieRrqeYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS3x0UdfohkjXSdfoJNJ10jU6iXSddI1uiXTd0DW6IdJ10jW6oWt0Q6Trlq7RUyJdJ12jp0S63sQEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBY4uv7hy6JdN3QNXpKpOuka7RRpOuka/SUSNdTuka3RLpu6BqdRLqe0jU6iXSddI2eYgKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYAkTACzx9f1DD4p0nXSNnhLpekrX6JZI10nX6C+KdP1VXaMbIl0nXaOTSNcNXaMbTACwhAkAljABwBImAFjCBABLmABgCRMALGECgCU+eqFI11O6Rm8T6TrpGt0Q6bqha3RDpOuka/SkSNdJ1+gk0vUmka6TrtFJpOspJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAljABwBIfXRTpOukanUS6buga3RDpeptI11O6RieRrpOu0UnX6CTSddI1uqVr9CaRrpOu0Q2RrjcxAcASJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAlvjooq7RSaTrpGt0Q6Trhq7RSaTrpGv0G5GuG7pGN0S6nhLpuiHSddI1elLX6CTSddI1Ool0nXSNbugaPcUEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS3x9/9Alka6TrtGbRLpu6BqdRLp+o2t0Q6TrpGt0Q6TrpGu0UaRrm67RX2QCgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAs8fX9Q3hEpGujrtFJpOspXaMbIl23dI2eEuk66RqdRLqe0jW6wQQAS5gAYAkTACxhAoAlTACwhAkAljABwBImAFjio4siXf+qrtFJ1+iWSNdJ1+iGSNdJ1wj/W6TrpGt0Q6TrpGt0Eul6ExMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGCJjx7WNdom0rVRpOuGrtENka436Rr9RqTrhq7RNl2jk0jXU0wAsIQJAJYwAcASJgBYwgQAS5gAYAkTACxhAoAlPnqhSNdTukZPiXTd0jU6iXSddI2e0jW6IdL1NpGuN+ka3RDpehMTACxhAoAlTACwhAkAljABwBImAFjCBABLmABgiY/wmK7RLZGuGyJdN3SNboh0PSXSdUvX6CmRrhsiXduYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS3yEx0S6ntQ1Ool0nXSNTiJdJ12jG7pGJ5GuW7pGJ5Guk67RSaTrhkjXSdfohkjXU0wAsIQJAJYwAcASJgBYwgQAS5gAYAkTACxhAoAlPnqhrtFf1DX6jUjXSdfoJNJ10jW6oWt0Eum6IdJ10jU6iXT9RqTrKV2jN4l0nXSNnmICgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAs8dHDIl3/qkjXLZGuk67RSaTrKV2jk0jXU7pGvxHpOuka3RDpekrX6IZI10nX6AYTACxhAoAlTACwhAkAljABwBImAFjCBABLmABgia/vHwKABUwAsIQJAJYwAcASJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLmABgCRMALGECgCVMALDEfwCUtTgPebE62QAAAABJRU5ErkJggg==	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-23 03:44:49.250504	2025-11-23 03:44:49.250504
89d48791-bfeb-4e53-8602-7480535fe8cc	1a7cb774-32ca-4992-ae4f-848a111f3d6e	single	1	19.00	ClfBmu765pGS	data:image/png;base64,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	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-23 16:25:06.515528	2025-11-23 16:25:06.515528
e97b3eb1-a833-4143-be5e-6bdb79bbb5b5	509f4c5b-7a4a-46e4-946d-810aa8295c99	single	1	35.00	U2dIlrrKTLGX	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAi1SURBVO3B0bEcAYpFwSuiPeEH/DcGfrBFIwd2eRFTU9FIJ/PX7z8EAAeYAOAIEwAcYQKAI0wAcIQJAI4wAcARJgA4wgQAR5gA4AgTABxhAoAjTABwhAkAjjABwBEmADjCBABHmADgCBMAHPHRgyJd/6qu0VMiXZuu0SbS9Zau0SbS9YSu0SbS9aau0SbS9a/qGj3BBABHmADgCBMAHGECgCNMAHCECQCOMAHAESYAOOKjl3WNrol0fZtI11u6RptI1xO6Rk/oGj0l0vWWrtE1ka63mADgCBMAHGECgCNMAHCECQCOMAHAESYAOMIEAEd89IUiXW/pGr0l0vUTXaNNpGvTNXpL12gT6dpEujZdoydEun6ia/RNIl1v6Rp9ExMAHGECgCNMAHCECQCOMAHAESYAOMIEAEeYAOCIj3BS12gT6XpC12gT6XpLpGvTNdp0jX4i0rXpGuF/zwQAR5gA4AgTABxhAoAjTABwhAkAjjABwBEmADjiI5wU6XpC1+gJXaNNpOsJXaMnRLpwiwkAjjABwBEmADjCBABHmADgCBMAHGECgCNMAHDER1+oa/Qvi3S9JdL1r+oa/USk65t0jf5VJgA4wgQAR5gA4AgTABxhAoAjTABwhAkAjjABwBEfvSzShf9f12gT6dp0jTaRrk3XaBPp2nSNNpGuJ0S6Nl2jbxPpwv/NBABHmADgCBMAHGECgCNMAHCECQCOMAHAESYAOOKjB3WN8N+LdG26Rk/oGn2TrtFbIl1v6hrhv2MCgCNMAHCECQCOMAHAESYAOMIEAEeYAOAIEwAc8dGDIl2brtEm0nVN12jTNfo2ka5N1+ibRLo2XaNNpOsnukZPiHRd0zX6JiYAOMIEAEeYAOAIEwAcYQKAI0wAcIQJAI4wAcARJgA44qMHdY02ka5N1+gtka5N12gT6dp0jd4U6dp0jTaRridEup7QNfo2ka5v0jV6S6Rr0zV6ggkAjjABwBEmADjCBABHmADgCBMAHGECgCNMAHDEr99/6EWRrk3XaBPp2nSNnhDpelPXaBPp2nSNvkmka9M1+jaRrk3X6AmRrid0jf5GJgA4wgQAR5gA4AgTABxhAoAjTABwhAkAjjABwBEfvaxr9JZI1xO6RptI15u6RptI1xO6Rk/oGuEdka5N12gT6dp0jd5iAoAjTABwhAkAjjABwBEmADjCBABHmADgCBMAHPHRyyJdm67RN4l0bbpGm0jXUyJdm67RJtL1lkjXW7pGm0jXT3SN3tI1ekKkaxPp2nSNvokJAI4wAcARJgA4wgQAR5gA4AgTABxhAoAjTABwxK/ff+ghka6/UddoE+l6U9doE+nadI02ka5N1+gJka5N1+gJka6ndI02ka63dI3eEunadI2eYAKAI0wAcIQJAI4wAcARJgA4wgQAR5gA4AgTABzx0YO6RptI11u6Rk+IdG26Rv+ySNcTukZPiHRtukY/EenaRLo2XaNNpGvTNdpEup7QNdp0jd5iAoAjTABwhAkAjjABwBEmADjCBABHmADgCBMAHPHr9x96SKRr0zXaRLq+SdfoCZGup3SN3hLp2nSNvkmk69t0ja6JdG26Rm8xAcARJgA4wgQAR5gA4AgTABxhAoAjTABwhAkAjvj1+w/9pSJdb+kabSJdP9E12kS6Nl2jTaRr0zXaRLr+Vl2jayJdT+gafRMTABxhAoAjTABwhAkAjjABwBEmADjCBABHmADgiI8eFOl6QtfoCV2jTaRr0zXaRLou6ho9oWv0hEjXt4l0bbpGm0jXW7pGm0jXEyJdm67RE0wAcIQJAI4wAcARJgA4wgQAR5gA4AgTABxhAoAjPnpZ12gT6XpL12gT6XpC1+gnIl1viXRtukZPiHRtukabSNema/SUSNcm0rXpGj0h0vVNukZvMQHAESYAOMIEAEeYAOAIEwAcYQKAI0wAcIQJAI74CKuu0SbStYl0/UTX6AmRrrdEup4Q6dp0jZ4Q6fqJrtHfqGu0iXRtukZvMQHAESYAOMIEAEeYAOAIEwAcYQKAI0wAcIQJAI4wAcARH/3jIl1P6Bq9KdK16RptIl1P6Bpd0zX6iUjX3yjS9YRI16Zr9AQTABxhAoAjTABwhAkAjjABwBEmADjCBABHmADgiF+//xBeEel6StfoLZGuJ3SNNpGuTdfoTZGuTdfoLZGua7pGTzABwBEmADjCBABHmADgCBMAHGECgCNMAHCECQCO+OhBka5/Vddo0zX6iUjXJtK16RptIl1viXR9k0jXmyJdm67RN+kafRMTABxhAoAjTABwhAkAjjABwBEmADjCBABHmADgiI9e1jW6JtL1hEjXT3SN3tI12kS6Nl2jTaRr0zX6W3WN3tI1ekuka9M1eoIJAI4wAcARJgA4wgQAR5gA4AgTABxhAoAjTABwxEdfKNL1lq7Rt4l0bbpGb+kabSJdm67REyJdT+ga/USkaxPpuibStekabbpGbzEBwBEmADjCBABHmADgCBMAHGECgCNMAHCECQCO+Ahfp2u0iXS9pWu06RptIl1P6Bp9m67REyJdm67RJtL1hEjXE7pGTzABwBEmADjCBABHmADgCBMAHGECgCNMAHCECQCO+AgndY2eEOnaRLo2XaMndI02ka6LIl1PiHR9k67RW0wAcIQJAI4wAcARJgA4wgQAR5gA4AgTABxhAoAjPvpCXaO/UdfoJyJdm67RJtK16RptIl1viXRtukabSNema/QTka5NpGvTNdpEut7SNdpEur6JCQCOMAHAESYAOMIEAEeYAOAIEwAcYQKAI0wAcMSv33/oIZGuf1XXaBPp+omu0SbS9TfqGm0iXZuu0ZsiXX+jrtE3MQHAESYAOMIEAEeYAOAIEwAcYQKAI0wAcIQJAI749fsPAcABJgA4wgQAR5gA4AgTABxhAoAjTABwhAkAjjABwBEmADjCBABHmADgCBMAHGECgCNMAHCECQCOMAHAESYAOOI/o0U9lUd8yKkAAAAASUVORK5CYII=	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-23 19:37:28.625212	2025-11-23 19:37:28.625212
0cad854b-3a0d-4bee-bcaa-96f01c85f619	17e14276-a7d4-4064-a63a-2a2c94eaecfb	single	1	19.00	Tx2hAxjMSM_Z	data:image/png;base64,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	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-23 20:35:18.953824	2025-11-23 20:35:18.953824
8d8ac75c-2735-4daf-b055-4a318292aaf7	2c0b4c63-ad71-46b0-a146-551d377b65cc	single	1	853.15	zl2VMFrD6K9L	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAirSURBVO3B0Y0kS2xFwbtEe8If0n9jyB/ashoH9LIBpQrF2RPx5+8PAcACJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEt8dFGk61/VNXpSpOuka3QS6bqha3QS6bqha3QS6XpS1+gk0vWv6hrdYAKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYAkTACzx0cO6RttEuvCMrtENXaNbIl1P6RptE+l6igkAljABwBImAFjCBABLmABgCRMALGECgCVMALDERy8U6XpK1+gpka5vdI1OukYnka4bukYnka6TrtFJpOuka3RDpOsbXaM3iXQ9pWv0JiYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASH+F1Il0nXaOnRLpOukYnka4bIl0nXaOTrtE3Il0nXSP8/zMBwBImAFjCBABLmABgCRMALGECgCVMALCECQCW+Aiv0zXaJtJ10jV6k0gXdjEBwBImAFjCBABLmABgCRMALGECgCVMALCECQCW+OiFukb/skjXDV2jk0jXSdfohkjXSdfoKV2jb0S63qRr9K8yAcASJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAlvjoYZEu/Leu0Umk600iXSddo5NI10nX6CTSddI1eptIF/53JgBYwgQAS5gAYAkTACxhAoAlTACwhAkAljABwBIfXdQ1wntEuk66Rk+JdL1JpOtJXSP835gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLfHRRpOuka3QS6dqma3TSNXqbSNdJ1+gpXaOTSNdJ1+gk0vWNrtENka5tukZvYgKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYAkTACxhAoAlPlqqa3QS6TrpGt0Q6TrpGt3SNXpKpOuka3QS6TqJdJ10jd4m0vUmXaOnRLpOukY3mABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEt89It1jU4iXW8T6TrpGp1Euk66Riddo5NI1w1do6d0jb4R6TrpGt0Q6dqma/QUEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYImPLuoavUmk64au0Umk65au0TZdI7xHpOuka3QS6TrpGj3FBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWOLP3x96UKTrhq7RUyJdJ12jk0jXN7pGJ5Guk67RSaTrpGt0Q6TrKV2jk0jXN7pG20S6bugavYkJAJYwAcASJgBYwgQAS5gAYAkTACxhAoAlTACwxJ+/P/SgSNdTukYnka6TrtFJpOuka3RLpOtNukY3RLpOukY3RLpu6RqdRLqe0jV6SqTrpGt0gwkAljABwBImAFjCBABLmABgCRMALGECgCVMALDEn78/dEmk64au0Q2RrpOu0Umk64au0TciXTd0jU4iXW/SNboh0nXSNfpGpOuGrtFJpOuka3QS6bqha/QmJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAljABwBJ//v7QJZGuk67RDZGup3SN3ibSddI1uiHSddI1uiHSddI1Ool0vU3XaJtI10nX6CkmAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEn/+/tCDIl1P6RqdRLrepmt0Q6TrpGt0Q6Trhq7RSaTrSV2jbSJdN3SN3sQEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBY4s/fH7ok0nXSNTqJdJ10jU4iXSddo40iXU/pGt0Q6fqtukYnka6ndI1OIl0nXaOTSNdJ1+gGEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYImPXqhrdBLpOukanUS6fquu0b+qa3RLpOsk0nXSNboh0vUmXaOnmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEt89EKRrhsiXTd0jU4iXW8T6bqha3QS6XpK1+iGSNc3uka/UdfoJNJ10jV6igkAljABwBImAFjCBABLmABgCRMALGECgCVMALCECQCW+OiFukYnka6TrtFJpOsk0oX/1jV6SqTrpGt00jX6RqTrN4p03RDpOuka3WACgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAs8dFFXaOndI1u6Bo9JdL1ja7RDZGuk67RSaQL/61r9JRI10mk6zcyAcASJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAlvjookjXv6prdNI1+kak66Rr9Bt1jU4iXSeRrreJdJ10jd6ka/QmJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAljABwBIfPaxrtE2k64ZI15O6Rk/pGt0Q6TrpGp1Eut6ma/SUrtFTIl0nXaMbTACwhAkAljABwBImAFjCBABLmABgCRMALGECgCU+eqFI11O6Rm/TNTqJdJ10jU4iXSddo5NI11MiXSddo1siXSeRrm0iXSddo5Ou0VNMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJT7CSl2jG7pGJ5Guk67RSaTrKZGuk67RLV2jGyJdJ12jk0jXDZGuG7pGN5gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLfITXiXSddI1OIl0nXaOTrtFJpOuGrtFTIl1PinTdEOl6k67RU0wAsIQJAJYwAcASJgBYwgQAS5gAYAkTACxhAoAlPnqhrtFv1DX6RqTrhq7RSaTrhq7Rm0S6TrpG34h0nUS6TrpGJ5Gup3SNTiJdb2ICgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAs8dHDIl3/qkjXN7pGJ5GuG7pGT4l0bdQ1Ool0nUS63iTSddI1ehMTACxhAoAlTACwhAkAljABwBImAFjCBABLmABgiT9/fwgAFjABwBImAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcAS/wPC/D3dsrvx/gAAAABJRU5ErkJggg==	inactive	\N	\N	0	\N	\N	\N	\N	2025-11-23 21:15:36.810307	2025-11-23 21:15:36.810307
104a0dcd-deaa-4364-8ef1-d8b37af442a3	f31d3ea8-a23a-43ad-b8f4-4db2fc1ccf0a	single	1	853.15	PGXWEvfxXTrN	data:image/png;base64,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	active	2025-11-24 02:47:05.697	john@example.com	0	\N	\N	\N	\N	2025-11-13 00:24:11.556108	2025-11-24 02:47:05.697
ed0c3e2e-729c-49f6-bc83-29e04fd2acbd	2ee4d838-d39a-4756-a087-70e617533e22	single	1	853.15	pF__LLpHs0E5	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAiZSURBVO3BwY0kQY5Fwd9EasILqb8w5IWy9LQCu57A+ASCVc/sz99/BAALmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYAkTACzx0UWRrt+qa/SkSNdJ1+gk0nXSNTqJdJ10jZ4S6XpS1+gk0vVbdY1uMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJb46GFdo20iXW/TNXqTrtFJpOuGrtFJ1+iWSNdTukbbRLqeYgKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYAkTACzx0QtFup7SNXpKpOs36xq9SaTrG12jN4l0PaVr9CYmAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEh/hdbpGJ5Guk67RSaTrhkjXm3SNTrpG34h0nXSN8L9nAoAlTACwhAkAljABwBImAFjCBABLmABgCRMALPERfqxI11O6RjdEuk66RjdEurCLCQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsMRHL9Q1+s0iXTd0jZ4S6bqha/SUrtE3Il1v0jX6rUwAsIQJAJYwAcASJgBYwgQAS5gAYAkTACxhAoAlPnpYpAv/v67RSaTrhkjXSdfohq7RSaTrpGt0Euk66Rq9TaQL/zcTACxhAoAlTACwhAkAljABwBImAFjCBABLmABgiY8u6hphl67RUyJdJ12jp0S6ntQ1wn/HBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWOKjiyJdJ12jk0jXNl2jk67R20S6bugaPSXSddI1Ool0faNrdEOka5uu0ZuYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYImPHhbpOukanUS6ntI1elKk66RrdBLpuqFrdBLpekrX6G0iXW/SNXpKpOuka3SDCQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsMRHS3WNTiJdN0S6TrpGJ5GuJ3WNTiJdb9I1ekrX6BuRrpOu0Q2Rrm26Rk8xAcASJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAlvjohSJdN3SNTiJdJ12jk0jXSdfolkjXSdcIv1Ok66RrdBLpOukaPcUEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBY4qOLukY3RLqe0jU6iXQ9KdK1TdfoJNJ1Eum6oWt0Eun6RtfoKV2jGyJdJ5Guk67Rm5gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABL/Pn7jy6JdJ10jX6rSNc3ukYnka436RrdEOk66RrdEOm6pWt0Eul6StfoKZGuk67RDSYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcASf/7+ox8q0nXSNTqJdN3QNfpGpOspXaOTSNdTukY3RLpOukbfiHTd0DU6iXSddI1OIl03dI3exAQAS5gAYAkTACxhAoAlTACwhAkAljABwBImAFjiz99/dEmk64au0VMiXSddoydFurbpGp1Eum7oGp1Eut6ma7RNpOuka/QUEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYImPfrBI1w2RrpOu0Umk6xtdo6dEuk66RieRrpOu0Q2Rrid1jbaJdN3QNXoTEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYImPlop0nXSN3qRr9DZdoxu6RieRro0iXSddo5NI11O6RieRrhsiXSddoxtMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJT56WNfoJNJ10jV6SqTrhq7RLZGuk67RSaTrpGv0lK7RSaTrpGt0S6TrJNJ10jW6IdL1Jl2jp5gAYAkTACxhAoAlTACwhAkAljABwBImAFjCBABLfPRCXaOTSNdJ1+gk0nXSNTqJdJ1Eur7RNTrpGp1Euk66RjdEum6IdJ10jW6IdH2ja/QTdY1OIl0nXaOnmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGCJP3//0SWRrpOu0Umk64au0Q2RrpOu0Umk65au0W8V6TrpGt0S6dqma3QS6XpK1+gGEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS5gAYImPLuoa3dA1epOu0ZO6RieRrpOu0Umka5uu0dt0jZ4S6TqJdP1EJgBYwgQAS5gAYAkTACxhAoAlTACwhAkAljABwBIfXRTp+q26Riddo29Euk66RieRrt8q0vU2ka6TrtGbdI3exAQAS5gAYAkTACxhAoAlTACwhAkAljABwBImAFjio4d1jbaJdN0Q6fpG1+gk0nVD1+gk0nXSNboh0vVTdY2e0jV6SqTrpGt0gwkAljABwBImAFjCBABLmABgCRMALGECgCVMALDERy8U6XpK1+htIl03dI1OIl0nXaOTSNdJ1+gpXaNbIl0nka5tIl0nXaOTrtFTTACwhAkAljABwBImAFjCBABLmABgCRMALGECgCU+wkpdoxu6RieRrpOu0Umk6ymRrpOu0S1doxsiXSddo5NI1w2Rrhu6RjeYAGAJEwAsYQKAJUwAsIQJAJYwAcASJgBYwgQAS3yE1+kanUS6TrpGJ5GubSJdJ12jk0jXkyJdN0S63qRr9BQTACxhAoAlTACwhAkAljABwBImAFjCBABLmABgiY9eqGv0E3WNvhHpuiHSddI1Ool03dA1Ool0nXSNTiJdJ12jb0S6TiJdJ12jk0jXU7pGJ5GuNzEBwBImAFjCBABLmABgCRMALGECgCVMALCECQCW+Ohhka7fKtKFZ3SNbukanUS6TiJdbxLpOukavYkJAJYwAcASJgBYwgQAS5gAYAkTACxhAoAlTACwxJ+//wgAFjABwBImAFjCBABLmABgCRMALGECgCVMALCECQCWMAHAEiYAWMIEAEuYAGAJEwAsYQKAJUwAsIQJAJYwAcAS/wENJi/rFgd1/AAAAABJRU5ErkJggg==	active	2025-11-24 04:21:55.885	tasktest@example.com	0	\N	\N	\N	\N	2025-11-13 17:47:31.636121	2025-11-24 04:21:55.885
bcc42fcd-9c78-476a-8a0b-b47eb03958e0	1a74022e-5453-4801-b57d-d940c4c80637	single	1	57.00	5I0k_9t0aHYd	data:image/png;base64,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	active	2025-11-24 04:25:17.846	nohvac@example.com	0	\N	\N	\N	\N	2025-11-15 01:51:54.386119	2025-11-24 04:25:17.846
721fe4c0-f664-40ce-b9fc-f933f9642501	1a54fafd-3bee-4b22-a2b9-fc7dfa67e718	single	1	35.00	OYQJd6hZP-NN	data:image/png;base64,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	active	2025-11-24 04:37:01.498	condotest@example.com	0	\N	\N	\N	\N	2025-11-19 12:32:33.57906	2025-11-24 04:37:01.498
3286661b-d6ff-4452-a1c7-61f43e30ca8b	fea5fb82-9b7b-448d-9b1d-5bed9232ee1d	single	1	35.00	F9qDWh5Ig1La	data:image/png;base64,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	active	2025-11-24 04:48:29.307	fixedcondo@example.com	0	\N	\N	\N	\N	2025-11-22 03:12:17.239367	2025-11-24 04:48:29.307
1b2eba96-6811-4270-bb0c-c868087b778f	004f521a-f7c5-44a8-bcd5-4d07fbc1e8d5	single	1	35.00	9req5IUYQtU_	data:image/png;base64,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	active	2025-11-24 04:49:27.978	singlefamily@example.com	0	\N	\N	\N	\N	2025-11-22 17:02:38.317377	2025-11-24 04:49:27.978
\.


--
-- Data for Name: order_magnet_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_magnet_orders (id, order_id, created_at, updated_at, customer_name, customer_email, customer_phone, ship_address_line_1, ship_address_line_2, ship_city, ship_state, ship_zip, ship_country, subtotal, shipping_fee, discount, tax, total, payment_status, payment_provider, payment_ref, status, source, utm_source, utm_medium, utm_campaign, notes) FROM stdin;
4c578c87-281c-4f48-8cf5-187aa6aee95c	TEST-FIX-2025	2025-11-11 23:03:00.330464	2025-11-11 23:03:00.330464	Test Customer	test@fix.com	Pending	Pending	\N	Pending	Pending	00000	US	19.00	0.00	0.00	0.00	19.00	paid	stripe	pi_test_fix	new	\N	\N	\N	\N	\N
dbbea876-0104-4116-9ff3-7fb727910527	1-2025	2025-11-12 18:03:40.013506	2025-11-12 18:03:40.013506	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	853.15	0.00	0.00	0.00	853.15	paid	stripe	cs_test_a1tUNbWH8EiJNA14dQsHvvDvGhzSyQ6W0ZcK47nBspSokEN5TZqXGZra4x	paid	\N	\N	\N	\N	\N
82c4e5d8-2222-44ad-a571-da4a41c0b82f	3-2025	2025-11-12 18:07:24.716545	2025-11-12 18:07:24.716545	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	853.15	0.00	0.00	0.00	853.15	paid	stripe	cs_test_a1a0aje2fDiBLuWM3DaINrvK442uPJO0nQvy4WAAJjYy8TwShUXXkxZTnY	paid	\N	\N	\N	\N	\N
4fbba83c-5f63-471f-86d0-1057e84fae54	5-2025	2025-11-12 18:22:14.949958	2025-11-12 18:22:14.949958	Demola Lawal	samuel.fapohunda@gmail.com	+14044886739	6607 Destiny Dr Se		Mableton	GA	30126	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a1If1hLbSGOjusv3epSdMsGaBwhJzL47D34bXaMtFQseJR2eOiLXynB6a6	paid	\N	\N	\N	\N	\N
4e7094f5-e93a-489b-83b5-af0e23395388	6-2025	2025-11-12 18:47:29.510127	2025-11-12 18:47:29.510127	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	19.00	0.00	0.00	0.00	19.00	paid	stripe	cs_test_a1GjXhwgD4lC48243G9C1WZgWgMkeSMRbR2WWX0GVVamwat0VovlM1huJj	paid	\N	\N	\N	\N	\N
33215cda-a4a8-4940-a009-29d9e953481a	7-2025	2025-11-12 18:50:15.701219	2025-11-12 18:50:15.701219	Ademola Sule	samuel.fapohunda@gmail.com	+14044886739	6607 Destiny Dr Se		Mableton	GA	30126	US	853.15	0.00	0.00	0.00	853.15	paid	stripe	cs_test_a1eAPZRedAfjt4sp4Zygkz551JZE6unl3HLDzSMKSNu90K2InxGeKVYr5u	paid	\N	\N	\N	\N	\N
8da0cb03-8ce4-47ec-9e8c-af4458e6fde6	8-2025	2025-11-12 19:05:21.874828	2025-11-12 19:05:21.874828	Tude Tudee	samuel.fapohunda@gmail.com	+14044886739	6607 Destiny Dr Se		Mableton	GA	30126	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a17rZNW5jxdHDoVsMOp4qGBIyk5LNK19y6qCbhCcChDhEzmyxc40cILEUl	paid	\N	\N	\N	\N	\N
c162cad0-72fa-4680-85cb-b81697507e9a	10-2025	2025-11-12 23:59:48.961528	2025-11-12 23:59:48.961528	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	19.00	0.00	0.00	0.00	19.00	paid	stripe	cs_test_a1rnzpOrNdpbIL35H24FGMgsgsh5gbVeh1NFhwa6MKN3RFpm3iCIUnCTXe	paid	\N	\N	\N	\N	\N
f31d3ea8-a23a-43ad-b8f4-4db2fc1ccf0a	2-2025	2025-11-13 00:24:11.498509	2025-11-13 00:24:11.498509	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	853.15	0.00	0.00	0.00	853.15	paid	stripe	cs_test_a1O9TgnPjSVSbSArQQJPaqsOr0tXUuInhEs7BU3fZQWLHeg5L5m75ExVii	paid	\N	\N	\N	\N	\N
281934e3-0670-49e2-bf45-7a74b9cdceab	4-2025	2025-11-13 01:04:48.210684	2025-11-13 01:04:48.210684	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a1ed5DxiX2n2ZjvEs44LSBpHfGzP2wjHsdX0e6f2Dey7kSDEl55HnMmD81	paid	\N	\N	\N	\N	\N
00893ef8-9c2c-4657-937a-87a42c2d8608	11-2025	2025-11-13 03:00:36.21135	2025-11-13 03:00:36.21135	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a1sTFWIBro6oRsJGfngZUZeeEyWYoNYJqeOhzCtVRrVoL92tkCsvaS1F7y	paid	\N	\N	\N	\N	\N
f0c2c9af-a120-4fbb-a2cc-1b8912fae59c	12-2025	2025-11-13 03:12:37.187932	2025-11-13 03:12:37.187932	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	19.00	0.00	0.00	0.00	19.00	paid	stripe	cs_test_a1UHbbwEgSL8PmbGCaAIV4HSfhcJy44tMZNcRxVNuHaAdYXPa3kcF7T8IY	paid	\N	\N	\N	\N	\N
2ee4d838-d39a-4756-a087-70e617533e22	45-2025	2025-11-13 17:47:31.636121	2025-11-13 17:47:31.636121	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	853.15	0.00	0.00	0.00	853.15	paid	stripe	cs_test_a108pFJJ2sV3vvpOTMbDrNNyFHuIu5kBcXoaMk2Bkfu4CDHxioUD0kQqsl	paid	\N	\N	\N	\N	\N
8d00bdf9-20d7-45f7-ae55-785eb69e0dc1	47-2025	2025-11-15 01:38:40.385958	2025-11-15 01:38:40.385958	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a1RGY3rB4Tya1vUWF2ITKdBtjUYZpHuiQQQ8rduvqeSEwmS7vkSF96Oart	paid	\N	\N	\N	\N	\N
1a74022e-5453-4801-b57d-d940c4c80637	48-2025	2025-11-15 01:51:54.386119	2025-11-15 01:51:54.386119	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	57.00	0.00	0.00	0.00	57.00	paid	stripe	cs_test_a1572AqobHrbEzyK7UrF7jgKb6bWf2uLWCMgMfqw0ipROZvfHv6iXuq1LD	paid	\N	\N	\N	\N	\N
f3e738e8-646e-498a-bd46-572184e97fd0	50-2025	2025-11-19 12:22:38.725302	2025-11-19 12:22:38.725302	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	19.00	0.00	0.00	0.00	19.00	paid	stripe	cs_test_a1Tcnw6kbJfOf9KsLh2pW5azSYz7RD5NfX6NdoMQyUb0u2NG4zhBQvSRcr	paid	\N	\N	\N	\N	\N
1a54fafd-3bee-4b22-a2b9-fc7dfa67e718	51-2025	2025-11-19 12:32:33.57906	2025-11-19 12:32:33.57906	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a1PayOkFHfqEh6u3KFnEEz6KPQDtgR8DrZADxkzM97pOE7RwCExpFwsDdQ	paid	\N	\N	\N	\N	\N
16b01232-f5f1-4655-8201-b3868b5ad3e4	52-2025	2025-11-19 12:36:06.021565	2025-11-19 12:36:06.021565	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	853.15	0.00	0.00	0.00	853.15	paid	stripe	cs_test_a1Z50B0KGKdhsdPDbfGck7teiYmLgVBAc6vmTZukQHUb1XaMrxH8CevyKo	paid	\N	\N	\N	\N	\N
0709954e-6a8b-47fd-87a5-fa08e3439ca6	53-2025	2025-11-19 12:59:17.280541	2025-11-19 12:59:17.280541	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a11MwE0Llqc4FDzVtnlFYUVXVkUkA4UUgxrxTeXsW7j6qAbhbuZcnnbSfe	paid	\N	\N	\N	\N	\N
22c4d264-7bc6-4905-8aba-6ee8a460420f	54-2025	2025-11-19 13:39:21.975282	2025-11-19 13:39:21.975282	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	853.15	0.00	0.00	0.00	853.15	paid	stripe	cs_test_a11a1GQhU9gIwflB6GJwsX7IbyB40kVu0Pd05MJzTc9xIG0EhfujbnoGFT	paid	\N	\N	\N	\N	\N
600f7f82-0de4-481f-9078-c57b8c7c73c6	55-2025	2025-11-19 15:08:31.596355	2025-11-19 15:08:31.596355	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	853.15	0.00	0.00	0.00	853.15	paid	stripe	cs_test_a1ORMAa2cxvaNKi4E8Jjk0AwViCNgIQSqUeMMaKa4X1Vs7A2lmqFFlC9Iw	paid	\N	\N	\N	\N	\N
fa1e284a-0bb9-44c2-a205-d12dbbae5ca9	56-2025	2025-11-22 02:20:42.394107	2025-11-22 02:20:42.394107	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	853.15	0.00	0.00	0.00	853.15	paid	stripe	cs_test_a1EYnkpiIp03tPRsyckxUS3JjoMAK3dSwaewOh2G1aVNpWz4cg99guqcUQ	paid	\N	\N	\N	\N	\N
a6af51c7-a4a0-4413-b477-965864fb0029	57-2025	2025-11-22 03:04:42.783478	2025-11-22 03:04:42.783478	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a14S68wMhBcmUrkEhgMeSg5JgQLJfHKuMH2GVSPaigZHY0q0yiMsZaYauv	paid	\N	\N	\N	\N	\N
fea5fb82-9b7b-448d-9b1d-5bed9232ee1d	58-2025	2025-11-22 03:12:17.239367	2025-11-22 03:12:17.239367	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a1frAvYCn6etUn0gYAxOibcc9D2fj9ZI2pd1fmHZ4yscoRIyeFOlhmVLZJ	paid	\N	\N	\N	\N	\N
dd0c602c-7e5d-4543-841c-57116d849744	60-2025	2025-11-22 16:48:45.945522	2025-11-22 16:48:45.945522	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a1UZcZxweOyO6mxqQmNdTM5vYPhdLuOm0nybie2yacxsWN4liXxYrT60Eb	paid	\N	\N	\N	\N	\N
004f521a-f7c5-44a8-bcd5-4d07fbc1e8d5	61-2025	2025-11-22 17:02:38.317377	2025-11-22 17:02:38.317377	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a18HdExSlebxEe0U5lKYsBMC9Xq0lEa7RGgq39NvsvohkOIrGLCYveiRnH	paid	\N	\N	\N	\N	\N
72a5f246-7f13-4d62-b6b7-e6e54223bd62	62-2025	2025-11-22 17:14:49.626176	2025-11-22 17:14:49.626176	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a10PoMyGt5n0IWMcNzy4Aq95EC8ykKCvnnuxFDdZ9LtITWRHaQCkR5C0Jq	paid	\N	\N	\N	\N	\N
8513d356-b352-42f5-9a75-02d4cffb327d	63-2025	2025-11-22 17:21:07.70471	2025-11-22 17:21:07.70471	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a11tkRbaX0dFDyoB1Q0eFMvDHEHzjOTY4AF9HtMw21nY7qLYOwoKoLKAQy	paid	\N	\N	\N	\N	\N
6cad00a5-a395-4afc-8987-eda814a119e7	64-2025	2025-11-22 17:22:23.764047	2025-11-22 17:22:23.764047	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	19.00	0.00	0.00	0.00	19.00	paid	stripe	cs_test_a1LsY5ZP9kDYf8GOwIiLdZBdnY9Buo1yr2v1utMF8Cx6b6M3EYKt8Zs8cj	paid	\N	\N	\N	\N	\N
30692a48-2481-45b6-a307-f5d7ac56fbcf	65-2025	2025-11-22 17:31:22.705394	2025-11-22 17:31:22.705394	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a1u4cqx0Lyfxr9tLrsjoo61evbWTLXE6oijailgEBF1u4w07QrZDuq2VB7	paid	\N	\N	\N	\N	\N
14601307-22a5-4504-963c-d69b0d6fe7cf	66-2025	2025-11-22 17:46:49.216354	2025-11-22 17:46:49.216354	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	19.00	0.00	0.00	0.00	19.00	paid	stripe	cs_test_a1pOz7ONBzX3txkySdxztrXL0YDc0wP1op5TGOoIhfRRs7fS0HQCleJwrZ	paid	\N	\N	\N	\N	\N
9cef547e-2537-412f-a8fb-42b34f5e397a	67-2025	2025-11-23 01:34:12.909239	2025-11-23 01:34:12.909239	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a1ii0yvsXuIxJ3LhbzuuK7DdJ5sT1RhsKRO0aRRFrHg49s5fwGjlUT89Y3	paid	\N	\N	\N	\N	\N
8cb30e08-585f-422b-a1f9-e39c036b6470	68-2025	2025-11-23 03:44:49.250504	2025-11-23 03:44:49.250504	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a1ysDwNmceGHzpz9SRzzZefNFgM4XxbF12BbQo7vb6TSUMUFO58V9vDVih	paid	\N	\N	\N	\N	\N
1a7cb774-32ca-4992-ae4f-848a111f3d6e	69-2025	2025-11-23 16:25:06.515528	2025-11-23 16:25:06.515528	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	19.00	0.00	0.00	0.00	19.00	paid	stripe	cs_test_a1Zs04LCnIitjgjPjxB2q3vtvHOG24xlFIeZA4yoDWFr4Vz7lQWo2A76xS	paid	\N	\N	\N	\N	\N
509f4c5b-7a4a-46e4-946d-810aa8295c99	70-2025	2025-11-23 19:37:28.625212	2025-11-23 19:37:28.625212	Demola Lawal	samuel.fapohunda@gmail.com	+14044886739	6607 Destiny Dr Se		Mableton	GA	30126	US	35.00	0.00	0.00	0.00	35.00	paid	stripe	cs_test_a1XDs4eHaVEad6XIu03JDr4ExtdUfq8in2ugs4O53ecWeTFjjvvp608p9M	paid	\N	\N	\N	\N	\N
17e14276-a7d4-4064-a63a-2a2c94eaecfb	71-2025	2025-11-23 20:35:18.953824	2025-11-23 20:35:18.953824	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	19.00	0.00	0.00	0.00	19.00	paid	stripe	cs_test_a1HEXqSjyk0LTmT430hZhTk1BZIKJ2emYiq9MOCwlNd4fPjvzUO9jDm49h	paid	\N	\N	\N	\N	\N
2c0b4c63-ad71-46b0-a146-551d377b65cc	72-2025	2025-11-23 21:15:36.810307	2025-11-23 21:15:36.810307	Samuel Fapohunda	samuel.fapohunda@gmail.com	+14044886739	602 Cobblestone Blvd		Stockbridge	GA	30281	US	853.15	0.00	0.00	0.00	853.15	paid	stripe	cs_test_a1Jk0lDrYy1sbP9G4vq8aMaSCo3Dou3Xfda9mKgfjQrXhisMLPQom6ovkR	paid	\N	\N	\N	\N	\N
\.


--
-- Data for Name: order_magnet_shipments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_magnet_shipments (id, order_id, carrier, tracking_number, label_url, status, shipped_at, expected_delivery, delivered_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pro_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pro_requests (id, trade, urgency, description, photos, address_line_1, address_line_2, city, state, zip, contact_name, contact_email, contact_phone, preferred_windows, status, provider_assigned, public_tracking_code, created_at, updated_at) FROM stdin;
83e058f5-0aca-4bac-a0e5-d8c29aa8e558	plumbing	24h	Kitchen sink is leaking and needs immediate repair	[]	123 Main Street	\N	Atlanta	GA	30301	John Doe	john@example.com	555-1234	\N	new	\N	0BDfcr20	2025-11-23 20:49:18.132	2025-11-23 20:49:18.132
60e1c14e-f623-454f-8b0c-6b99998b53e1	electrical	emergency	Power outage in main breaker panel	[]	456 Oak Avenue	\N	Decatur	GA	30030	Jane Smith	jane@example.com	555-5678	\N	new	\N	_PBFux-A	2025-11-23 20:50:43.346	2025-11-23 20:50:43.346
009a7843-5b32-4899-8682-ba4c92e00dc1	hvac	flexible	AC maintenance checkup needed	[]	789 Pine Street	\N	Marietta	GA	30060	Bob Johnson	bob@example.com	555-9012	\N	new	\N	At21TSBB	2025-11-23 20:51:35.967	2025-11-23 20:51:35.967
fd036b3f-dceb-4690-8afc-5a1dc96f63ce	roofing	3days	Roof inspection needed before winter	[]	321 Maple Drive	\N	Roswell	GA	30075	Sarah Lee	sarah@example.com	555-3456	\N	new	\N	zE6yh332	2025-11-23 20:52:10.772	2025-11-23 20:52:10.772
8689267d-5d18-4f8b-81bf-eee611ef8add	electrical	24h	jsjvfsknv''lfmv'dl,v DS<v D>< DS><ds	[]	602 Cobblestone Blvd		Stockbridge	GA	30281	Samuel Fapohunda	samuel.fapohunda@gmail.com	4044886739		new	\N	vf0YMC9o	2025-11-23 20:54:30.072	2025-11-23 20:54:30.072
a1a7b1db-385c-4755-b42c-993281a03bbe	plumbing	24h	dfvnbfsjd;k mdf ;vm ;m ;fm ;fdfa	[]	6607 Destiny Dr Se		Mableton	GA	30126	Demola Lawal	samuel.fapohunda@gmail.com	6786509430		new	\N	rytB0MH_	2025-11-23 21:13:12.739	2025-11-23 21:13:12.739
\.


--
-- Data for Name: providers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.providers (id, name, trade, coverage_zips, email, phone, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: setup_form_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.setup_form_notes (id, household_id, created_by, content, deleted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stripe_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stripe_events (event_id, event_type, processed_at, session_id, order_id, metadata) FROM stdin;
evt_1SSqlzRYhHBHe0FJ6JcdN5q3	checkout.session.completed	2025-11-13 03:00:36.21135	cs_test_a1sTFWIBro6oRsJGfngZUZeeEyWYoNYJqeOhzCtVRrVoL92tkCsvaS1F7y	11-2025	\N
evt_1SSoApRYhHBHe0FJr7L7pj28	checkout.session.completed	2025-11-13 03:12:37.187932	cs_test_a1UHbbwEgSL8PmbGCaAIV4HSfhcJy44tMZNcRxVNuHaAdYXPa3kcF7T8IY	12-2025	\N
evt_1ST4cJRYhHBHe0FJNWgRb87r	checkout.session.completed	2025-11-13 17:47:31.636121	cs_test_a108pFJJ2sV3vvpOTMbDrNNyFHuIu5kBcXoaMk2Bkfu4CDHxioUD0kQqsl	45-2025	\N
evt_1STYRnRYhHBHe0FJPgn9gk1I	checkout.session.completed	2025-11-15 01:38:40.385958	cs_test_a1RGY3rB4Tya1vUWF2ITKdBtjUYZpHuiQQQ8rduvqeSEwmS7vkSF96Oart	47-2025	\N
evt_1STXiIRYhHBHe0FJpRbwyNBD	checkout.session.completed	2025-11-15 01:51:54.386119	cs_test_a1572AqobHrbEzyK7UrF7jgKb6bWf2uLWCMgMfqw0ipROZvfHv6iXuq1LD	48-2025	\N
evt_1SV9S2RYhHBHe0FJcwlFEVyV	checkout.session.completed	2025-11-19 12:22:38.725302	cs_test_a1Tcnw6kbJfOf9KsLh2pW5azSYz7RD5NfX6NdoMQyUb0u2NG4zhBQvSRcr	50-2025	\N
evt_1SV9cbRYhHBHe0FJPXkp2sjs	checkout.session.completed	2025-11-19 12:32:33.57906	cs_test_a1PayOkFHfqEh6u3KFnEEz6KPQDtgR8DrZADxkzM97pOE7RwCExpFwsDdQ	51-2025	\N
evt_1SVAcDRYhHBHe0FJYqPKjHmi	checkout.session.completed	2025-11-19 12:36:06.021565	cs_test_a1Z50B0KGKdhsdPDbfGck7teiYmLgVBAc6vmTZukQHUb1XaMrxH8CevyKo	52-2025	\N
evt_1SVA2JRYhHBHe0FJgU9lrbB0	checkout.session.completed	2025-11-19 12:59:17.280541	cs_test_a11MwE0Llqc4FDzVtnlFYUVXVkUkA4UUgxrxTeXsW7j6qAbhbuZcnnbSfe	53-2025	\N
evt_1SVBbRRYhHBHe0FJBlgcKTeJ	checkout.session.completed	2025-11-19 13:39:21.975282	cs_test_a11a1GQhU9gIwflB6GJwsX7IbyB40kVu0Pd05MJzTc9xIG0EhfujbnoGFT	54-2025	\N
evt_1SVADdRYhHBHe0FJ2puKvPZB	checkout.session.completed	2025-11-19 15:08:31.596355	cs_test_a1ORMAa2cxvaNKi4E8Jjk0AwViCNgIQSqUeMMaKa4X1Vs7A2lmqFFlC9Iw	55-2025	\N
evt_1SW6RIRYhHBHe0FJbSkROpyf	checkout.session.completed	2025-11-22 02:20:42.394107	cs_test_a1EYnkpiIp03tPRsyckxUS3JjoMAK3dSwaewOh2G1aVNpWz4cg99guqcUQ	56-2025	\N
evt_1SW77uRYhHBHe0FJWA3oT06W	checkout.session.completed	2025-11-22 03:04:42.783478	cs_test_a14S68wMhBcmUrkEhgMeSg5JgQLJfHKuMH2GVSPaigZHY0q0yiMsZaYauv	57-2025	\N
evt_1SW6HzRYhHBHe0FJbFdLXpva	checkout.session.completed	2025-11-22 03:12:17.239367	cs_test_a1frAvYCn6etUn0gYAxOibcc9D2fj9ZI2pd1fmHZ4yscoRIyeFOlhmVLZJ	58-2025	\N
evt_1SWJzNRYhHBHe0FJRoN6UXvw	checkout.session.completed	2025-11-22 16:48:45.945522	cs_test_a1UZcZxweOyO6mxqQmNdTM5vYPhdLuOm0nybie2yacxsWN4liXxYrT60Eb	60-2025	\N
evt_1SWKCnRYhHBHe0FJZc9gQves	checkout.session.completed	2025-11-22 17:02:38.317377	cs_test_a18HdExSlebxEe0U5lKYsBMC9Xq0lEa7RGgq39NvsvohkOIrGLCYveiRnH	61-2025	\N
evt_1SWKObRYhHBHe0FJbtz70GT5	checkout.session.completed	2025-11-22 17:14:49.626176	cs_test_a10PoMyGt5n0IWMcNzy4Aq95EC8ykKCvnnuxFDdZ9LtITWRHaQCkR5C0Jq	62-2025	\N
evt_1SWJYpRYhHBHe0FJijPzRvTb	checkout.session.completed	2025-11-22 17:21:07.70471	cs_test_a11tkRbaX0dFDyoB1Q0eFMvDHEHzjOTY4AF9HtMw21nY7qLYOwoKoLKAQy	63-2025	\N
evt_1SWJanRYhHBHe0FJC1RuiOcm	checkout.session.completed	2025-11-22 17:22:23.764047	cs_test_a1LsY5ZP9kDYf8GOwIiLdZBdnY9Buo1yr2v1utMF8Cx6b6M3EYKt8Zs8cj	64-2025	\N
evt_1SWJiFRYhHBHe0FJQ2qabg2J	checkout.session.completed	2025-11-22 17:31:22.705394	cs_test_a1u4cqx0Lyfxr9tLrsjoo61evbWTLXE6oijailgEBF1u4w07QrZDuq2VB7	65-2025	\N
evt_1SWKtYRYhHBHe0FJ4Iwp8PYv	checkout.session.completed	2025-11-22 17:46:49.216354	cs_test_a1pOz7ONBzX3txkySdxztrXL0YDc0wP1op5TGOoIhfRRs7fS0HQCleJwrZ	66-2025	\N
evt_1SWSBsRYhHBHe0FJEwNsSeUx	checkout.session.completed	2025-11-23 01:34:12.909239	cs_test_a1ii0yvsXuIxJ3LhbzuuK7DdJ5sT1RhsKRO0aRRFrHg49s5fwGjlUT89Y3	67-2025	\N
evt_1SWUEGRYhHBHe0FJOaoZL6zu	checkout.session.completed	2025-11-23 03:44:49.250504	cs_test_a1ysDwNmceGHzpz9SRzzZefNFgM4XxbF12BbQo7vb6TSUMUFO58V9vDVih	68-2025	\N
evt_1SWg61RYhHBHe0FJIxZVvBXY	checkout.session.completed	2025-11-23 16:25:06.515528	cs_test_a1Zs04LCnIitjgjPjxB2q3vtvHOG24xlFIeZA4yoDWFr4Vz7lQWo2A76xS	69-2025	\N
evt_1SWj6BRYhHBHe0FJTRXfK4oD	checkout.session.completed	2025-11-23 19:37:28.625212	cs_test_a1XDs4eHaVEad6XIu03JDr4ExtdUfq8in2ugs4O53ecWeTFjjvvp608p9M	70-2025	\N
evt_1SWj4bRYhHBHe0FJzURQFzPG	checkout.session.completed	2025-11-23 20:35:18.953824	cs_test_a1HEXqSjyk0LTmT430hZhTk1BZIKJ2emYiq9MOCwlNd4fPjvzUO9jDm49h	71-2025	\N
evt_1SWkdARYhHBHe0FJLlZq8sVr	checkout.session.completed	2025-11-23 21:15:36.810307	cs_test_a1Jk0lDrYy1sbP9G4vq8aMaSCo3Dou3Xfda9mKgfjQrXhisMLPQom6ovkR	72-2025	\N
\.


--
-- Name: home_maintenance_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.home_maintenance_tasks_id_seq', 20, true);


--
-- Name: home_profile_extras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.home_profile_extras_id_seq', 13, true);


--
-- Name: audit_events audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: home_maintenance_tasks home_maintenance_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_maintenance_tasks
    ADD CONSTRAINT home_maintenance_tasks_pkey PRIMARY KEY (id);


--
-- Name: home_profile_extras home_profile_extras_household_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_profile_extras
    ADD CONSTRAINT home_profile_extras_household_id_unique UNIQUE (household_id);


--
-- Name: home_profile_extras home_profile_extras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_profile_extras
    ADD CONSTRAINT home_profile_extras_pkey PRIMARY KEY (id);


--
-- Name: household_task_assignments household_task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household_task_assignments
    ADD CONSTRAINT household_task_assignments_pkey PRIMARY KEY (id);


--
-- Name: households households_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: order_magnet_audit_events order_magnet_audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_magnet_audit_events
    ADD CONSTRAINT order_magnet_audit_events_pkey PRIMARY KEY (id);


--
-- Name: order_magnet_batches order_magnet_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_magnet_batches
    ADD CONSTRAINT order_magnet_batches_pkey PRIMARY KEY (id);


--
-- Name: order_magnet_items order_magnet_items_activation_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_magnet_items
    ADD CONSTRAINT order_magnet_items_activation_code_unique UNIQUE (activation_code);


--
-- Name: order_magnet_items order_magnet_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_magnet_items
    ADD CONSTRAINT order_magnet_items_pkey PRIMARY KEY (id);


--
-- Name: order_magnet_orders order_magnet_orders_order_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_magnet_orders
    ADD CONSTRAINT order_magnet_orders_order_id_unique UNIQUE (order_id);


--
-- Name: order_magnet_orders order_magnet_orders_payment_ref_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_magnet_orders
    ADD CONSTRAINT order_magnet_orders_payment_ref_unique UNIQUE (payment_ref);


--
-- Name: order_magnet_orders order_magnet_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_magnet_orders
    ADD CONSTRAINT order_magnet_orders_pkey PRIMARY KEY (id);


--
-- Name: order_magnet_shipments order_magnet_shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_magnet_shipments
    ADD CONSTRAINT order_magnet_shipments_pkey PRIMARY KEY (id);


--
-- Name: pro_requests pro_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pro_requests
    ADD CONSTRAINT pro_requests_pkey PRIMARY KEY (id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: setup_form_notes setup_form_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setup_form_notes
    ADD CONSTRAINT setup_form_notes_pkey PRIMARY KEY (id);


--
-- Name: stripe_events stripe_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stripe_events
    ADD CONSTRAINT stripe_events_pkey PRIMARY KEY (event_id);


--
-- Name: home_maintenance_tasks unique_task_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_maintenance_tasks
    ADD CONSTRAINT unique_task_code UNIQUE (task_code);


--
-- Name: idx_household_task_assignments_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_household_task_assignments_due_date ON public.household_task_assignments USING btree (due_date);


--
-- Name: idx_household_task_assignments_household; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_household_task_assignments_household ON public.household_task_assignments USING btree (household_id);


--
-- Name: idx_household_task_assignments_household_due; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_household_task_assignments_household_due ON public.household_task_assignments USING btree (household_id, due_date);


--
-- Name: idx_household_task_assignments_household_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_household_task_assignments_household_status ON public.household_task_assignments USING btree (household_id, status);


--
-- Name: idx_household_task_assignments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_household_task_assignments_status ON public.household_task_assignments USING btree (status);


--
-- Name: idx_household_task_assignments_task; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_household_task_assignments_task ON public.household_task_assignments USING btree (task_id);


--
-- Name: idx_households_completed_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_households_completed_date ON public.households USING btree (setup_completed_at);


--
-- Name: idx_households_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_households_location ON public.households USING btree (state, zipcode);


--
-- Name: idx_households_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_households_order_id ON public.households USING btree (order_id);


--
-- Name: idx_households_setup_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_households_setup_status ON public.households USING btree (setup_status);


--
-- Name: idx_setup_notes_author; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_setup_notes_author ON public.setup_form_notes USING btree (created_by);


--
-- Name: idx_setup_notes_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_setup_notes_created ON public.setup_form_notes USING btree (created_at);


--
-- Name: idx_setup_notes_household; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_setup_notes_household ON public.setup_form_notes USING btree (household_id);


--
-- Name: household_task_assignments household_task_assignments_household_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household_task_assignments
    ADD CONSTRAINT household_task_assignments_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;


--
-- Name: household_task_assignments household_task_assignments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household_task_assignments
    ADD CONSTRAINT household_task_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.home_maintenance_tasks(id);


--
-- PostgreSQL database dump complete
--

\unrestrict PdFQhVUA6g6cGX6tlFQwb0qwZo1Du2n8BUg9bdXR2ofefj1aayrghRToEFl3vnD

