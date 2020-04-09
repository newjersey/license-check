CREATE TABLE njcovid.license_types
(
    code character varying(20) COLLATE "default" NOT NULL,
    title character varying(50) COLLATE "default" NOT NULL,
    CONSTRAINT code_title PRIMARY KEY (code, title)
);