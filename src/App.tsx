import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  Clock3,
  Instagram,
  MapPin,
  Menu as MenuIcon,
  Phone,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useReveal } from '@/lib/useReveal';
import type { MenuItem, RestaurantInfo, SessionUser } from '@/lib/types';
import { AdminPanel } from '@/components/AdminPanel';

const fallbackMenu: MenuItem[] = [
  { id: '1', name: 'Fiyel Kurt', description: 'Tender beef cubes, bright peppers, and house spices served with warm injera.', category: 'Canary signatures', price: 480, image_url: '/images/Screenshot_2026-09-14_195113.png', show_hover_image: true, is_available: true, sort_order: 1, user_id: null },
  { id: '2', name: 'Fish Tibs', description: 'Sizzling pan-seared fish with rosemary, lemon, and a little Canary heat.', category: 'Canary signatures', price: 560, image_url: '/images/Screenshot_2026-09-14_195101.png', show_hover_image: true, is_available: true, sort_order: 2, user_id: null },
  { id: '3', name: 'Doro Wot', description: 'Slow-cooked chicken and hard-boiled egg in a deep berbere sauce, served on injera.', category: 'Canary signatures', price: 650, image_url: '/images/Screenshot_2026-09-14_195054.png', show_hover_image: true, is_available: true, sort_order: 3, user_id: null },
  { id: '4', name: 'Kitfo Special', description: 'Hand-minched lean beef warmed in niter kibbeh and mitmita, plated with kibe and gomen.', category: 'Canary signatures', price: 720, image_url: '/images/Screenshot_2026-09-14_195040.png', show_hover_image: true, is_available: true, sort_order: 4, user_id: null },
  { id: '5', name: 'Aasa Lebleb', description: 'Crisp, golden fish bites with fresh herbs and a cool house dip.', category: 'From the kitchen', price: 420, image_url: null, show_hover_image: false, is_available: true, sort_order: 5, user_id: null },
  { id: '6', name: 'Aasa Tibit', description: 'Ethiopian-style fish sauté with onions, peppers, and fragrant butter.', category: 'From the kitchen', price: 520, image_url: null, show_hover_image: false, is_available: true, sort_order: 6, user_id: null },
  { id: '7', name: 'Beyaynetu', description: 'A colorful fasting platter: shiro, misir wot, atakilt, and split lentils over injera.', category: 'From the kitchen', price: 540, image_url: '/images/Screenshot_2026-09-14_195019.png', show_hover_image: true, is_available: true, sort_order: 7, user_id: null },
  { id: '8', name: 'Gored Gored', description: 'Cubed raw beef tossed in warm spiced butter and awaze, for the adventurous table.', category: 'From the kitchen', price: 680, image_url: null, show_hover_image: false, is_available: true, sort_order: 8, user_id: null },
  { id: '9', name: 'Shiro Wot', description: 'Velvety chickpea flour stew slow-simmered with garlic, onion, and berbere.', category: 'From the kitchen', price: 380, image_url: null, show_hover_image: false, is_available: true, sort_order: 9, user_id: null },
  { id: '10', name: 'Enkulal Firfir', description: 'Scrambled eggs with onions, tomato, and green chili, folded with fresh kita.', category: 'From the kitchen', price: 290, image_url: null, show_hover_image: false, is_available: true, sort_order: 10, user_id: null },
  { id: '11', name: 'Avocado Salad', description: 'Ripe avocado, tomato, onion, and jalapeno with lime and a pinch of mitmita.', category: 'From the kitchen', price: 250, image_url: null, show_hover_image: false, is_available: true, sort_order: 11, user_id: null },
  { id: '12', name: 'St. George Draft', description: 'A bright, crisp Ethiopian lager poured cold from the tap.', category: 'At the bar', price: 180, image_url: null, show_hover_image: false, is_available: true, sort_order: 12, user_id: null },
  { id: '13', name: 'Canary Old Fashioned', description: 'A slow-sipping pour with orange, bitters, and a warm finish.', category: 'At the bar', price: 420, image_url: null, show_hover_image: false, is_available: true, sort_order: 13, user_id: null },
  { id: '14', name: 'Tej (Honey Wine)', description: 'House-brewed Ethiopian honey wine, served in a traditional berele flask.', category: 'At the bar', price: 220, image_url: null, show_hover_image: false, is_available: true, sort_order: 14, user_id: null },
  { id: '15', name: 'Buna (Ethiopian Coffee)', description: 'Freshly roasted and brewed in a jebena, served with popcorn and incense.', category: 'At the bar', price: 120, image_url: null, show_hover_image: false, is_available: true, sort_order: 15, user_id: null },
  { id: '16', name: 'Canary Spritz', description: 'A bright, bubbly pour with a hint of citrus and a pomegranate finish.', category: 'At the bar', price: 380, image_url: null, show_hover_image: false, is_available: true, sort_order: 16, user_id: null },
];

const fallbackInfo: RestaurantInfo = {
  id: 1,
  address: '2R38+7QG, Addis Ababa',
  address_detail: 'Jacros, Addis Ababa',
  hours: '11:00 AM — 11:00 PM',
  hours_label: 'Open every day',
  phone: '097 998 8685',
  phone_label: 'Call for reservations',
};

const photos = [
  '/images/Screenshot_2026-09-14_195123.png',
  '/images/Screenshot_2026-09-14_195129.png',
  '/images/Screenshot_2026-09-14_195136.png',
  '/images/Screenshot_2026-09-14_195142.png',
  '/images/Screenshot_2026-09-14_195150.png',
];

const money = (value: number) => `${new Intl.NumberFormat('en-US').format(value)} ETB`;

function Reveal({ children, direction = 'bottom', delay = 0, className = '' }: { children: React.ReactNode; direction?: 'left' | 'right' | 'bottom' | 'scale'; delay?: number; className?: string }) {
  const { ref, visible, transform } = useReveal<HTMLDivElement>(direction);
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-in' : ''} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        '--reveal-transform': transform,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(fallbackMenu);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(fallbackInfo);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const loadMenu = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true });
    if (data?.length) setMenuItems(data as MenuItem[]);
    setLoadingMenu(false);
  };

  const loadInfo = async () => {
    const { data } = await supabase.from('restaurant_info').select('*').eq('id', 1).maybeSingle();
    if (data) setRestaurantInfo(data as RestaurantInfo);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    void loadMenu();
    void loadInfo();

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser({ id: data.session.user.id, email: data.session.user.email });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(menuItems.map((item) => item.category)))], [menuItems]);
  const visibleItems = useMemo(
    () => menuItems.filter((item) => item.is_available && (activeCategory === 'All' || item.category === activeCategory)),
    [activeCategory, menuItems],
  );

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="site-shell">
      <header className={scrolled ? 'site-header header-scrolled' : 'site-header'}>
        <a className="brand hero-anim" style={{ animationDelay: '0.1s' }} href="#top" onClick={() => scrollTo('top')}>
          <span className="brand-mark">C</span>
          <span><strong>CANARY</strong><small>BAR & RESTAURANT</small></span>
        </a>
        <nav className={isMobileMenuOpen ? 'nav-links nav-open' : 'nav-links'}>
          <button onClick={() => scrollTo('menu')}>Menu</button>
          <button onClick={() => scrollTo('story')}>Our story</button>
          <button onClick={() => scrollTo('gallery')}>The room</button>
          <button onClick={() => scrollTo('visit')}>Visit us</button>
        </nav>
        <div className="header-actions hero-anim" style={{ animationDelay: '0.3s' }}>
          <a className="header-phone" href={`tel:${restaurantInfo.phone}`}><Phone size={15} /> {restaurantInfo.phone}</a>
          <button className="book-button btn-press" onClick={() => scrollTo('visit')}>Book a table <ArrowUpRight size={16} /></button>
          <button className="menu-toggle" aria-label="Toggle menu" onClick={() => setIsMobileMenuOpen((open) => !open)}>
            {isMobileMenuOpen ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow hero-anim" style={{ animationDelay: '0.15s' }}><span /> Addis Ababa · Jacros</p>
            <h1 className="hero-anim" style={{ animationDelay: '0.25s' }}>Good food.<br /><em>Good energy.</em><br />Stay awhile.</h1>
            <p className="hero-intro hero-anim" style={{ animationDelay: '0.4s' }}>A spirited bar and restaurant serving bold Ethiopian plates, cold pours, and late-night conversations in the heart of Addis.</p>
            <div className="hero-buttons hero-anim" style={{ animationDelay: '0.55s' }}>
              <button className="primary-button btn-press" onClick={() => scrollTo('menu')}>Explore the menu <ArrowUpRight size={17} /></button>
              <button className="text-button" onClick={() => scrollTo('story')}>Discover Canary <span>↘</span></button>
            </div>
          </div>
          <div className="hero-art hero-anim" style={{ animationDelay: '0.35s' }}>
            <div className="hero-plate-wrap">
              <div className="hero-plate">
                <div className="hero-image-wrap"><img src={photos[0]} alt="Bartender pouring a fresh draft at Canary" /></div>
              </div>
            </div>
            <div className="hero-stamp hero-anim" style={{ animationDelay: '0.7s' }}><span>EST.</span><strong>2019</strong><small>ADDIS ABABA</small></div>
            <div className="hero-note hero-anim" style={{ animationDelay: '0.85s' }}>The best nights<br /><em>start here.</em></div>
          </div>
          <div className="hero-scroll hero-anim" style={{ animationDelay: '1s' }}><span>Scroll to explore</span><ChevronDown size={17} className="bounce" /></div>
        </section>

        <section className="marquee"><div>PLATES WITH A PULSE <span>✦</span> POUR SOMETHING GOOD <span>✦</span> PLATES WITH A PULSE <span>✦</span> POUR SOMETHING GOOD <span>✦</span> PLATES WITH A PULSE <span>✦</span> POUR SOMETHING GOOD</div></section>

        <section className="section story-section" id="story">
          <Reveal direction="left"><div className="section-kicker">01 / The Canary feeling</div></Reveal>
          <div className="story-grid">
            <Reveal direction="left" delay={100}><h2>Made for the<br /><em>in-between</em> hours.</h2></Reveal>
            <Reveal direction="bottom" delay={200} className="story-copy"><p>Not quite dinner. Not quite a night out. Canary lives in that sweet spot where a quick drink turns into a full table and nobody is checking the time.</p><p>We bring the warmth of Ethiopian hospitality to a room made for lingering: a little dim, a little playful, and always ready for one more round.</p><button className="circle-link btn-press" onClick={() => scrollTo('gallery')}>See the space <ArrowUpRight size={18} /></button></Reveal>
          </div>
          <Reveal direction="scale" delay={150} className="story-images">
            <ParallaxImage src={photos[2]} alt="Canary lounge with warm candlelight" className="story-main-image" />
            <div className="story-side-note"><span>COME AS YOU ARE</span><strong>Stay for<br /><em>the story.</em></strong><span>JACROS · ADDIS</span></div>
            <ParallaxImage src={photos[1]} alt="Canary bar and bartender" className="story-small-image" />
          </Reveal>
        </section>

        <section className="menu-section" id="menu">
          <div className="section menu-heading">
            <Reveal direction="left"><div><div className="section-kicker">02 / On the table</div><h2>Things worth<br /><em>sharing.</em></h2></div></Reveal>
            <Reveal direction="bottom" delay={150}><p>Our menu moves with the room — generous plates, Ethiopian favorites, and just enough surprise to keep the table talking.</p></Reveal>
          </div>
          <Reveal direction="right" delay={100}>
            <div className="menu-tabs">{categories.map((category) => <button key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
          </Reveal>
          <div className="menu-list">
            {loadingMenu ? <div className="menu-loading">Setting the table…</div> : visibleItems.map((item, index) => (
              <Reveal key={item.id} direction="bottom" delay={Math.min(index * 80, 400)}>
                <MenuRow item={item} number={String(index + 1).padStart(2, '0')} />
              </Reveal>
            ))}
          </div>
          <Reveal direction="bottom"><div className="menu-footer"><span>Prices shown in Ethiopian birr</span><span>Ask your server about tonight's specials <ArrowUpRight size={15} /></span></div></Reveal>
        </section>

        <section className="section gallery-section" id="gallery">
          <div className="gallery-heading">
            <Reveal direction="left"><div><div className="section-kicker">03 / Inside Canary</div><h2>A room with<br /><em>good stories.</em></h2></div></Reveal>
            <Reveal direction="bottom" delay={150}><p>Come for the food. Stay for the atmosphere. Find your corner, turn up the music, and let the evening take its shape.</p></Reveal>
          </div>
          <div className="gallery-grid">
            <Reveal direction="scale" className="gallery-img-1"><ParallaxImage src={photos[3]} alt="Canary lounge with fireplace" /></Reveal>
            <Reveal direction="scale" delay={120} className="gallery-img-2"><ParallaxImage src={photos[4]} alt="Canary dinner table and meal" /></Reveal>
            <Reveal direction="right" delay={240} className="gallery-quote">"A little fire,<br /><em>a lot of feeling.</em>"</Reveal>
          </div>
        </section>

        <section className="visit-section" id="visit">
          <div className="section visit-inner">
            <Reveal direction="left"><div><div className="section-kicker">04 / Find us</div><h2>Meet us<br /><em>at Canary.</em></h2></div></Reveal>
            <Reveal direction="right" delay={150}>
              <div className="visit-details">
                <div className="detail"><MapPin size={19} /><div><strong>{restaurantInfo.address}</strong><span>{restaurantInfo.address_detail}</span></div></div>
                <div className="detail"><Clock3 size={19} /><div><strong>{restaurantInfo.hours_label}</strong><span>{restaurantInfo.hours}</span></div></div>
                <div className="detail"><Phone size={19} /><div><strong>{restaurantInfo.phone}</strong><span>{restaurantInfo.phone_label}</span></div></div>
                <a className="map-button btn-press" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantInfo.address)}`} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={17} /></a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-brand"><span className="brand-mark">C</span><strong>CANARY</strong></div>
        <div className="footer-center">GOOD FOOD · GOOD ENERGY · GOOD COMPANY</div>
        <div className="footer-right">
          <a href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={17} /> Instagram</a>
          <button onClick={() => setIsAdminOpen(true)}>Staff portal</button>
        </div>
      </footer>

      {isAdminOpen && (
        <AdminPanel
          user={user}
          authMode={authMode}
          setAuthMode={setAuthMode}
          onClose={() => setIsAdminOpen(false)}
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          restaurantInfo={restaurantInfo}
          setRestaurantInfo={setRestaurantInfo}
          reloadMenu={loadMenu}
        />
      )}
    </div>
  );
}

function ParallaxImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const img = el.querySelector('img');
    if (!img) return;
    let rafId = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (rect.bottom < 0 || rect.top > windowHeight) return;
      const progress = (rect.top + rect.height / 2 - windowHeight / 2) / windowHeight;
      const offset = Math.max(-30, Math.min(30, progress * -30));
      img.style.transform = `translateY(${offset}px) scale(1.15)`;
    };
    const onScroll = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(rafId); };
  }, []);
  return (
    <div ref={ref} className={`parallax-img ${className}`}>
      <img src={src} alt={alt} />
      <div className="parallax-overlay" />
    </div>
  );
}

function MenuRow({ item, number }: { item: MenuItem; number: string }) {
  return (
    <article className="menu-row">
      <span className="menu-number">{number}</span>
      <div className="menu-item-info">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
      </div>
      <span className="menu-dots" />
      <strong className="menu-price">{money(item.price)}</strong>
      {item.show_hover_image && item.image_url && (
        <div className="menu-hover-image">
          <img src={item.image_url} alt={item.name} />
        </div>
      )}
    </article>
  );
}

export default App;
