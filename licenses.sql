
CREATE TABLE public.licenses
(
    license_number character varying(255) COLLATE pg_catalog."default" NOT NULL,
    first_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    last_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    state character varying(20) COLLATE pg_catalog."default" NOT NULL,
    status character varying(30) COLLATE pg_catalog."default" NOT NULL,
    date_of_birth character varying(10) COLLATE pg_catalog."default",
    CONSTRAINT person PRIMARY KEY (state, license_number, last_name)
)

CREATE UNIQUE INDEX license
    ON public.licenses USING btree
    (state COLLATE pg_catalog."default" ASC NULLS LAST, license_number COLLATE pg_catalog."default" ASC NULLS LAST)