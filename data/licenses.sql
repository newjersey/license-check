CREATE TABLE njcovid.licenses
(
    id integer NOT NULL DEFAULT nextval('njcovid.licenses_id_seq'::regclass),
    license_number character varying(255) COLLATE "default" NOT NULL,
    first_name character varying(255) COLLATE "default" NOT NULL,
    last_name character varying(255) COLLATE "default" NOT NULL,
    state character varying(20) COLLATE "default" NOT NULL,
    status character varying(30) COLLATE "default" NOT NULL,
    date_of_birth character varying(10) COLLATE "default",
    CONSTRAINT license_data_id PRIMARY KEY (id),
    CONSTRAINT license_data_number UNIQUE (license_number)
);