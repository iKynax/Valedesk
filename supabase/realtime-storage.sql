ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', TRUE), ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public room images" ON storage.objects;
CREATE POLICY "Public room images" ON storage.objects FOR SELECT USING (bucket_id = 'room-images');
DROP POLICY IF EXISTS "Public avatars" ON storage.objects;
CREATE POLICY "Public avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Admins upload room images" ON storage.objects;
CREATE POLICY "Admins upload room images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-images' AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
