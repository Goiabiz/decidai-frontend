select
  to_regclass('public.vw_v36_api_guided_connection_health') is not null as view_health_ok,
  (
    select count(*)
    from pg_indexes
    where schemaname='public'
      and indexname like 'idx_v36_api_guided%'
  ) as indexes_v36;
