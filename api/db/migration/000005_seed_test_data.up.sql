-- Seed Users (password is 'password123')
INSERT INTO users (id, email, password_hash, role) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'master1@test.com', '$2a$10$Y.qP6.bH3p.fU/SSGgH.GOeJd15iSj2t8xFCa.xL1y0G.q.UUv5z.', 'user'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'client1@test.com', '$2a$10$Y.qP6.bH3p.fU/SSGgH.GOeJd15iSj2t8xFCa.xL1y0G.q.UUv5z.', 'user'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'master2@test.com', '$2a$10$Y.qP6.bH3p.fU/SSGgH.GOeJd15iSj2t8xFCa.xL1y0G.q.UUv5z.', 'user'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'client2@test.com', '$2a$10$Y.qP6.bH3p.fU/SSGgH.GOeJd15iSj2t8xFCa.xL1y0G.q.UUv5z.', 'user')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_details (user_id, first_name, last_name, average_rating) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Иван', 'Мастеров', 4.8),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Анна', 'Заказчикова', null),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Петр', 'Электриков', 4.9),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Ольга', 'Новоселова', null)
ON CONFLICT (user_id) DO NOTHING;

-- Seed Categories
INSERT INTO service_categories (id, name, description) VALUES
    (1, 'Сантехника', 'Работы по установке и ремонту сантехнического оборудования'),
    (2, 'Электрика', 'Электромонтажные работы любой сложности'),
    (3, 'Сборка мебели', 'Сборка и разборка корпусной и мягкой мебели'),
    (4, 'Ремонт квартир', 'Косметический и капитальный ремонт помещений')
ON CONFLICT (id) DO NOTHING;

-- Seed Offers
INSERT INTO offers (id, author_id, offer_type, title, description, category_id) VALUES
    -- Offers from masters
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'service_offer', 'Установка смесителя', 'Быстро и качественно установлю любой смеситель в ванной или на кухне.', 1),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'service_offer', 'Монтаж электропроводки', 'Полная или частичная замена электропроводки в квартирах и домах. Гарантия качества.', 2),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'service_offer', 'Сборка кухонного гарнитура', 'Профессиональная сборка кухонной мебели от любых производителей.', 3),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'service_offer', 'Установка розеток и выключателей', 'Перенос, замена, установка новых розеток и выключателей.', 2),

    -- Requests from clients
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'request_for_service', 'Нужно повесить люстру', 'Требуется повесить новую люстру в гостиной. Потолок натяжной.', 2),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'request_for_service', 'Поклеить обои в комнате', 'Комната 18 кв.м. Нужно снять старые обои и поклеить новые. Материалы куплены.', 4),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'request_for_service', 'Прочистить засор в раковине', 'На кухне сильно засорилась раковина, вода почти не уходит.', 1)
ON CONFLICT (id) DO NOTHING;
