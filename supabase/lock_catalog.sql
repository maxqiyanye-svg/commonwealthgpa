-- Lock the course catalog: only the /admin page (server-side, service-role key,
-- behind the admin password) can add, edit or delete catalog courses.
-- Everyone can still read it (signup, onboarding and "add course" need the list).
-- Safe to re-run.
drop policy if exists "catalog_insert_open" on public.catalog_courses;
drop policy if exists "catalog_update_open" on public.catalog_courses;
drop policy if exists "catalog_delete_open" on public.catalog_courses;
