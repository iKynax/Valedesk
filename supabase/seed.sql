INSERT INTO amenities (name, icon) VALUES
  ('High-Speed WiFi', 'Wifi'),
  ('Whiteboard', 'PenLine'),
  ('4K TV Screen', 'Monitor'),
  ('Video Conferencing', 'Video'),
  ('Standing Desk', 'ArrowUpDown'),
  ('Coffee Machine', 'Coffee'),
  ('Air Conditioning', 'Wind'),
  ('Natural Lighting', 'Sun'),
  ('Parking', 'Car'),
  ('Accessible', 'Accessibility'),
  ('Printing', 'Printer'),
  ('Phone Booth', 'Phone'),
  ('Locker Storage', 'Lock'),
  ('Kitchen Access', 'UtensilsCrossed')
ON CONFLICT (name) DO NOTHING;

INSERT INTO rooms (name, slug, type, floor, capacity, description, price_hour, price_half, price_day, status, floor_x, floor_y, floor_w, floor_h, floor_level, rating, review_count) VALUES
  ('The Commons Hot Desk', 'commons-hot-desk', 'hot_desk', 'Level 2', 1, 'An open-plan collaborative hot desk in our vibrant coworking commons. Includes coffee bar, printing, and high-speed WiFi.', 15.00, 55.00, 90.00, 'active', 80, 60, 80, 50, 'L2', 4.6, 128),
  ('Sky Lounge Hot Desk', 'sky-lounge-hot-desk', 'hot_desk', 'Level 4', 1, 'Premium hot desking in our top-floor sky lounge with panoramic city views.', 20.00, 75.00, 120.00, 'active', 200, 60, 80, 50, 'L4', 4.8, 89),
  ('Focus Pod Alpha', 'focus-pod-alpha', 'focus_pod', 'Level 2', 1, 'A fully enclosed, soundproofed single-occupancy booth designed for maximum focus.', 25.00, 90.00, 150.00, 'active', 80, 140, 60, 60, 'L2', 4.9, 203),
  ('Focus Pod Beta', 'focus-pod-beta', 'focus_pod', 'Level 2', 1, 'A private focus pod with monitor setup and docking station for power users.', 30.00, 110.00, 180.00, 'active', 160, 140, 60, 60, 'L2', 4.7, 156),
  ('Catalyst Room', 'catalyst-room', 'meeting_room', 'Level 3', 6, 'A modern meeting room for small teams with display, conferencing, and writable glass walls.', 65.00, 240.00, 420.00, 'active', 80, 80, 120, 90, 'L3', 4.7, 312),
  ('Meridian Suite', 'meridian-suite', 'meeting_room', 'Level 3', 10, 'Our most popular meeting room with a solid oak table, conference audio, and natural light.', 90.00, 330.00, 580.00, 'active', 230, 80, 130, 100, 'L3', 4.8, 445),
  ('The Workshop', 'the-workshop', 'meeting_room', 'Level 3', 12, 'A flexible training and workshop space with modular furniture and a full whiteboard wall.', 85.00, 310.00, 540.00, 'active', 80, 200, 120, 100, 'L3', 4.6, 189),
  ('The Pinnacle Boardroom', 'pinnacle-boardroom', 'boardroom', 'Level 4', 20, 'Our flagship boardroom with executive presence, dual displays, conferencing, and city views.', 180.00, 660.00, 1200.00, 'active', 60, 80, 200, 130, 'L4', 4.9, 78),
  ('Summit Boardroom', 'summit-boardroom', 'boardroom', 'Level 4', 15, 'A sophisticated boardroom with walnut panelling, catering hatch, and integrated AV.', 150.00, 550.00, 980.00, 'active', 60, 240, 180, 120, 'L4', 4.7, 94),
  ('The Atrium', 'the-atrium', 'event_space', 'Level 2', 80, 'A double-height event space with exposed brick, windows, PA, and stage lighting.', 350.00, 1200.00, 2000.00, 'active', 300, 80, 200, 200, 'L2', 4.8, 45),
  ('Studio Office Suite', 'studio-office', 'private_office', 'Level 3', 4, 'A fully furnished private office for small teams with dedicated desks and 24/7 access.', 55.00, 200.00, 380.00, 'active', 380, 80, 150, 120, 'L3', 4.6, 67),
  ('Executive Office Suite', 'executive-office', 'private_office', 'Level 4', 8, 'A premium private office with meeting table, executive furniture, and branded door signage.', 120.00, 440.00, 800.00, 'active', 380, 220, 180, 140, 'L4', 4.9, 52)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO room_images (room_id, url, alt_text, is_primary, sort_order)
SELECT id, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', name, TRUE, 0 FROM rooms
ON CONFLICT DO NOTHING;

INSERT INTO announcements (title, content, type, active) VALUES
  ('Welcome to Valedesk', 'Book any space in seconds and manage your bookings all in one place.', 'info', TRUE),
  ('Sky Lounge Now Open', 'Our premium Level 4 Sky Lounge is fully operational with KL skyline views.', 'info', TRUE);
