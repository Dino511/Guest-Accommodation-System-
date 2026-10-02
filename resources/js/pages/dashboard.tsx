import '../../css/landing.css';
import { Head, usePage } from '@inertiajs/react';
import {
    AirVent,
    Anchor,
    Armchair,
    ArrowRight,
    Bath,
    BedDouble,
    Coffee,
    Fan,
    Lamp,
    MapPin,
    Phone,
    Refrigerator,
    Sparkles,
    Table2,
    Tv,
    Users,
    Utensils,
    Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import {
    formatClock,
    formatDateTime,
    formatPeso,
    greeting,
    plural,
} from '@/lib/format';
import { cn } from '@/lib/utils';

// The guest's home: the "harbor at night" landing page from the Mindoro
// Marine design system (styles in resources/css/landing.css). It has its own
// floating nav instead of the staff sidebar. Online booking is a later phase,
// so every call to action routes to the front desk and says so.
type GuestReservation = {
    id: number;
    room: string;
    location: string;
    starts_at: string;
    ends_at: string;
    pax: number;
    payment_status: 'unpaid' | 'partial' | 'paid';
};

type GuestRoom = {
    id: number;
    name: string;
    location_id: number;
    location: string;
    description: string | null;
    pax_capacity: number;
    cover_url: string | null;
    photos: { url: string; caption: string | null }[];
    inclusions: { item: string; quantity: number }[];
    rates: { name: string; price: string; unit: string }[];
};

type GuestLocation = {
    id: number;
    name: string;
    description: string | null;
    rooms_count: number;
    max_pax: number;
    from_price: string | null;
    from_unit: string | null;
    cover_url: string | null;
};

type Props = {
    reservations: GuestReservation[];
    rooms: GuestRoom[];
    locations: GuestLocation[];
    checkInTime: string | null;
    checkOutTime: string | null;
};

type Amenity = { item: string; rooms: number; locations: string[] };

const paymentLabels: Record<GuestReservation['payment_status'], string> = {
    unpaid: 'Unpaid',
    partial: 'Partially paid',
    paid: 'Paid',
};

// Amenity names are typed freely by the Admin; pick an icon by keyword.
const amenityIcons: [RegExp, LucideIcon][] = [
    [/bed|deck|mattress|bunk/i, BedDouble],
    [/tv|television/i, Tv],
    [/fridge|ref|freezer/i, Refrigerator],
    [/wi-?fi|internet/i, Wifi],
    [/air ?con|a\/?c\b/i, AirVent],
    [/fan/i, Fan],
    [/sofa|couch|chair|seat/i, Armchair],
    [/table|desk/i, Table2],
    [/bath|shower|toilet|heater|towel/i, Bath],
    [/coffee|kettle|tea/i, Coffee],
    [/kitchen|stove|microwave|utensil|dining/i, Utensils],
    [/lamp|light/i, Lamp],
];

function amenityIcon(item: string): LucideIcon {
    return (
        amenityIcons.find(([pattern]) => pattern.test(item))?.[1] ?? Sparkles
    );
}

const pad = (value: number) => String(value).padStart(2, '0');

function reducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The same "random" numbers on the server and in the browser. */
function seeded(seed: number): () => number {
    let state = seed;

    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;

        return state / 4294967296;
    };
}

/** Lit windows for the skyline, in columns at the given x positions. */
function windows(xs: number[], top: number, bottom: number, seed: number) {
    const random = seeded(seed);
    const lit: { x: number; y: number; delay: string }[] = [];

    xs.forEach((x) => {
        for (let y = top + random() * 30; y < bottom; y += 18) {
            if (random() > 0.55) {
                lit.push({
                    x,
                    y: Math.round(y),
                    delay: `${(random() * 3).toFixed(2)}s`,
                });
            }
        }
    });

    return lit;
}

const skylineWindows = windows(
    [70, 84, 154, 170, 186, 256, 272, 286, 356, 372, 388],
    170,
    410,
    7,
);

/** The illustrated night skyline, for a villa that has no photo yet. */
function Skyline({ label, sub }: { label?: string; sub?: string }) {
    return (
        <svg
            className="skyline"
            viewBox="0 0 480 560"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
        >
            <rect width="480" height="560" fill="#10233f" />
            <circle cx="340" cy="120" r="46" fill="#f6b81a" />
            <circle cx="360" cy="110" r="42" fill="#10233f" />
            <g fill="#1f3a68">
                <rect x="0" y="250" width="60" height="170" />
                <rect x="56" y="200" width="50" height="220" />
                <rect x="104" y="270" width="40" height="150" />
                <rect x="142" y="160" width="62" height="260" />
                <rect x="202" y="230" width="44" height="190" />
                <rect x="244" y="140" width="56" height="280" />
                <rect x="298" y="210" width="48" height="210" />
                <rect x="344" y="180" width="60" height="240" />
                <rect x="402" y="250" width="80" height="170" />
            </g>
            <g>
                {skylineWindows.map((window) => (
                    <rect
                        key={`${window.x}-${window.y}`}
                        className="win"
                        x={window.x}
                        y={window.y}
                        width="4"
                        height="6"
                        style={{ animationDelay: window.delay }}
                    />
                ))}
            </g>
            <rect y="420" width="480" height="140" fill="#0a1628" />
            <g className="ref" fill="#f6b81a" opacity=".5">
                <rect x="318" y="438" width="46" height="2" rx="1" />
                <rect x="300" y="452" width="80" height="2" rx="1" />
                <rect x="326" y="466" width="30" height="2" rx="1" />
            </g>
            {label && (
                <text
                    x="30"
                    y="52"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="14"
                    letterSpacing="3"
                    fill="#a9b6cc"
                >
                    {label.toUpperCase()}
                </text>
            )}
            {sub && (
                <text
                    x="30"
                    y="74"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="13"
                    letterSpacing="3"
                    fill="#a9b6cc"
                    opacity=".6"
                >
                    {sub.toUpperCase()}
                </text>
            )}
        </svg>
    );
}

/** A porthole with the cabin number, for a room that has no photo yet. */
function Porthole({ number }: { number: string }) {
    return (
        <div className="porthole" aria-hidden="true">
            <div className="rivets">
                {Array.from({ length: 8 }, (_, index) => (
                    <i
                        key={index}
                        style={{ '--a': `${index * 45}deg` } as CSSProperties}
                    />
                ))}
            </div>
            <div className="porthole__ring">
                <b>{number}</b>
                <svg
                    className="porthole__sea"
                    viewBox="0 0 300 62"
                    preserveAspectRatio="none"
                >
                    <path d="M0 20 Q 37 0 75 20 T 150 20 T 225 20 T 300 20 V62 H0Z" />
                </svg>
            </div>
        </div>
    );
}

/** A photo that falls back to its children when missing or broken. */
function Photo({
    url,
    alt,
    children,
}: {
    url: string | null;
    alt: string;
    children: ReactNode;
}) {
    const [broken, setBroken] = useState(false);

    return url && !broken ? (
        <img
            src={url}
            alt={alt}
            loading="lazy"
            onError={() => setBroken(true)}
        />
    ) : (
        children
    );
}

/** Headline text that rises one character at a time. */
function Rise({ text, offset = 0 }: { text: string; offset?: number }) {
    return (
        <span aria-hidden="true">
            {Array.from(text).map((character, index) => (
                <span
                    key={index}
                    className="ch"
                    style={{ '--i': index + offset } as CSSProperties}
                >
                    {character}
                </span>
            ))}
        </span>
    );
}

/** A number that counts up from zero the first time it scrolls into view. */
function CountUp({ value }: { value: number }) {
    const element = useRef<HTMLSpanElement>(null);
    const [shown, setShown] = useState(value);

    useEffect(() => {
        const node = element.current;

        if (!node || reducedMotion() || !('IntersectionObserver' in window)) {
            return;
        }

        let frame = 0;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) {
                return;
            }

            observer.disconnect();

            let start: number | null = null;
            const step = (time: number) => {
                start ??= time;

                const progress = Math.min((time - start) / 1200, 1);

                setShown(Math.round(value * (1 - (1 - progress) ** 3)));

                if (progress < 1) {
                    frame = requestAnimationFrame(step);
                }
            };

            frame = requestAnimationFrame(step);
        });

        observer.observe(node);

        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [value]);

    return <span ref={element}>{pad(shown)}</span>;
}

// Buttons that lean toward the cursor.
function magnetMove(event: PointerEvent<HTMLElement>) {
    if (reducedMotion()) {
        return;
    }

    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left - box.width / 2) * 0.22;
    const y = (event.clientY - box.top - box.height / 2) * 0.3;

    event.currentTarget.style.transform = `translate(${x}px, ${y}px)`;
}

function magnetLeave(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.transform = '';
}

// Cards that tilt toward the cursor, with a spotlight following it.
function tiltMove(event: PointerEvent<HTMLElement>) {
    if (reducedMotion()) {
        return;
    }

    const card = event.currentTarget;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;

    card.style.setProperty('--mx', `${x * 100}%`);
    card.style.setProperty('--my', `${y * 100}%`);
    card.style.setProperty('--ry', `${(x - 0.5) * 6}deg`);
    card.style.setProperty('--rx', `${(0.5 - y) * 6}deg`);
}

function tiltLeave(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty('--rx', '0deg');
    event.currentTarget.style.setProperty('--ry', '0deg');
}

function Star() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
        </svg>
    );
}

function Arrow({ size = 14 }: { size?: number }) {
    return <ArrowRight size={size} strokeWidth={2.6} />;
}

// Stand-in renders; swap the files in public/images/journey to change them.
const walkScenes = [
    {
        id: 'top',
        image: '/images/journey/lobby.jpg',
        title: 'Arrive',
        text: '',
    },
    {
        id: 'walk-hall',
        image: '/images/journey/corridor.jpg',
        title: 'Down the hall',
        text: 'Every door is a place to stay. Choose where you drop anchor.',
    },
    {
        id: 'walk-room',
        image: '/images/journey/room.jpg',
        title: 'Your room',
        text: 'Fresh linens, a desk, and room to unpack. Find the one that fits your crew.',
    },
    {
        id: 'walk-view',
        image: '/images/journey/balcony.jpg',
        title: 'The view',
        text: 'Slide the doors open. Everything that comes with your stay is just below.',
    },
];

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

/**
 * The first-person walk behind the whole page: lobby, corridor, room,
 * balcony. Each scene fades in as its chapter scrolls up, and is slowly
 * walked into until the next one takes over.
 */
function Backdrop() {
    const images = useRef<(HTMLImageElement | null)[]>([]);
    const bar = useRef<HTMLSpanElement>(null);
    const [active, setActive] = useState(0);

    useEffect(() => {
        const still = reducedMotion();
        let frame = 0;

        const paint = () => {
            frame = 0;

            const y = window.scrollY;
            const view = window.innerHeight;
            const end = document.documentElement.scrollHeight - view;

            // A scene starts when its chapter reaches the bottom of the screen.
            const starts = walkScenes.map((scene, index) => {
                const node = index > 0 && document.getElementById(scene.id);

                return node ? node.getBoundingClientRect().top + y - view : 0;
            });
            let current = 0;

            images.current.forEach((image, index) => {
                if (!image) {
                    return;
                }

                const into = y - starts[index];
                const length = (starts[index + 1] ?? end) - starts[index];

                image.style.opacity =
                    index === 0 ? '1' : String(clamp(into / (view * 0.7)));
                image.style.transform = still
                    ? ''
                    : `scale(${1 + clamp(into / Math.max(length, 1)) * 0.14})`;

                if (into >= view * 0.45) {
                    current = index;
                }
            });

            if (bar.current) {
                bar.current.style.transform = `scaleX(${end > 0 ? clamp(y / end) : 0})`;
            }

            setActive(current);
        };

        const queue = () => {
            frame ||= requestAnimationFrame(paint);
        };

        paint();
        window.addEventListener('scroll', queue, { passive: true });
        window.addEventListener('resize', queue);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', queue);
            window.removeEventListener('resize', queue);
        };
    }, []);

    return (
        <>
            <div className="scene" aria-hidden="true">
                {walkScenes.map((scene, index) => (
                    <img
                        key={scene.id}
                        ref={(node) => {
                            images.current[index] = node;
                        }}
                        src={scene.image}
                        alt=""
                    />
                ))}
            </div>
            <span className="scene__bar" aria-hidden="true">
                <span ref={bar} />
            </span>
            <nav className="rail" aria-label="Walk-through">
                {walkScenes.map((scene, index) => (
                    <a
                        key={scene.id}
                        href={`#${scene.id}`}
                        aria-current={index === active ? 'step' : undefined}
                    >
                        <span>{scene.title}</span>
                        <i />
                    </a>
                ))}
            </nav>
        </>
    );
}

/** A full-screen pause on a scene before its part of the page. */
function Chapter({ index }: { index: number }) {
    const scene = walkScenes[index];

    return (
        <div className="chapter" id={scene.id}>
            <span className="mono" data-reveal>
                {pad(index + 1)} / {pad(walkScenes.length)}
            </span>
            <h2 data-reveal style={{ '--d': '.08s' } as CSSProperties}>
                {scene.title}
            </h2>
            <p data-reveal style={{ '--d': '.16s' } as CSSProperties}>
                {scene.text}
            </p>
        </div>
    );
}

export default function Dashboard({
    reservations,
    rooms,
    locations,
    checkInTime,
    checkOutTime,
}: Props) {
    const { auth } = usePage().props;
    const root = useRef<HTMLDivElement>(null);
    const filterTrack = useRef<HTMLDivElement>(null);
    const filterPill = useRef<HTMLSpanElement>(null);

    // `filter` is the chosen location; `previous` and `settled` drive the
    // cards' leave and return animations.
    const [filter, setFilter] = useState<number | null>(null);
    const [previous, setPrevious] = useState<number | null | undefined>();
    const [settled, setSettled] = useState<number | null>(null);
    const [open, setOpen] = useState<GuestRoom | null>(null);
    const [port, setPort] = useState(0);

    const checkIn = checkInTime ? formatClock(checkInTime) : null;
    const checkOut = checkOutTime ? formatClock(checkOutTime) : null;
    const cabin = (room: GuestRoom) => pad(rooms.indexOf(room) + 1);

    // Every amenity across the rooms, most common first.
    const amenities: Amenity[] = [
        ...rooms
            .reduce((found, room) => {
                room.inclusions.forEach(({ item }) => {
                    const key = item.trim().toLowerCase();
                    const entry = found.get(key) ?? {
                        item: item.trim(),
                        rooms: 0,
                        locations: [],
                    };

                    found.set(key, {
                        ...entry,
                        rooms: entry.rooms + 1,
                        locations: entry.locations.includes(room.location)
                            ? entry.locations
                            : [...entry.locations, room.location],
                    });
                });

                return found;
            }, new Map<string, Amenity>())
            .values(),
    ].sort((a, b) => b.rooms - a.rooms || a.item.localeCompare(b.item));

    // The bento leads with a bed (the featured tile), then a TV (the wide one).
    const bigTile =
        amenities.find((amenity) => /bed|deck|bunk/i.test(amenity.item)) ??
        amenities[0];
    const wideTile = amenities.find(
        (amenity) => amenity !== bigTile && /tv|television/i.test(amenity.item),
    );
    const tiles = [
        bigTile,
        wideTile,
        ...amenities.filter(
            (amenity) => amenity !== bigTile && amenity !== wideTile,
        ),
    ].filter((amenity): amenity is Amenity => amenity !== undefined);

    const marquee = [
        ...locations.map((location) => location.name),
        ...amenities.slice(0, 4).map((amenity) => amenity.item),
        ...(checkIn ? [`Check-in ${checkIn}`] : []),
    ].flatMap((text, index) =>
        index % 2 === 1
            ? [
                  { text, italic: false },
                  {
                      text: ['rest easy', 'drop anchor', 'sleep in'][
                          Math.floor(index / 2) % 3
                      ],
                      italic: true,
                  },
              ]
            : [{ text, italic: false }],
    );

    // Reveal content once as it scrolls into view.
    useEffect(() => {
        const targets = [
            ...(root.current?.querySelectorAll('[data-reveal], .steps') ?? []),
        ];

        if (reducedMotion() || !('IntersectionObserver' in window)) {
            targets.forEach((target) => target.classList.add('in'));

            return;
        }

        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in');
                        observer.unobserve(entry.target);
                    }
                }),
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
        );

        targets.forEach((target) => observer.observe(target));

        return () => observer.disconnect();
    }, []);

    // The ports of call take turns being highlighted.
    useEffect(() => {
        if (locations.length < 2) {
            return;
        }

        const timer = setInterval(
            () => setPort((current) => (current + 1) % locations.length),
            2600,
        );

        return () => clearInterval(timer);
    }, [locations.length]);

    // A filtered-out card leaves the grid once its fade has finished.
    useEffect(() => {
        const timer = setTimeout(() => setSettled(filter), 420);

        return () => clearTimeout(timer);
    }, [filter]);

    // Slide the navy pill under the active filter option.
    useLayoutEffect(() => {
        const place = () => {
            const active = filterTrack.current?.querySelector<HTMLElement>(
                '[aria-pressed="true"]',
            );

            if (active && filterPill.current) {
                filterPill.current.style.width = `${active.offsetWidth}px`;
                filterPill.current.style.transform = `translateX(${active.offsetLeft - 5}px)`;
            }
        };

        place();
        void document.fonts?.ready.then(place);
        window.addEventListener('resize', place);

        return () => window.removeEventListener('resize', place);
    }, [filter]);

    const choose = (id: number | null) => {
        setPrevious(filter);
        setFilter(id);
    };

    const browse = (id: number | null) => {
        choose(id);
        document
            .getElementById('rooms')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const matches = (room: GuestRoom, id: number | null | undefined) =>
        id === null || id === undefined || room.location_id === id;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400..800&display=swap"
                />
            </Head>

            <div className="mm" ref={root}>
                {/* ================= Hero ================= */}
                <Backdrop />

                <header className="hero" id="top">
                    <div className="wrap">
                        <nav className="nav" aria-label="Main">
                            <a className="brand" href="#top">
                                <span className="brand__mark">
                                    <Anchor size={20} strokeWidth={2.2} />
                                </span>
                                <span>
                                    <span className="brand__name">
                                        Guest Accommodation
                                    </span>
                                    <span className="brand__sub">
                                        Mindoro Marine
                                    </span>
                                </span>
                            </a>
                            <div className="nav__links">
                                <a href="#locations">Locations</a>
                                <a href="#rooms">Rooms</a>
                                <a href="#amenities">On board</a>
                                <a href="#reserve">Reserve</a>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="user"
                                        aria-label="Your account"
                                    >
                                        <span className="user__av">
                                            {auth.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </span>
                                        <span>
                                            <small>Welcome,</small>
                                            <b>{auth.user.name}</b>
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="min-w-56 rounded-lg"
                                >
                                    <UserMenuContent user={auth.user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </nav>

                        <div className="hero__grid">
                            <div>
                                <span className="greet mono">
                                    <span className="dot" />
                                    <span>
                                        {greeting()}, <b>{auth.user.name}</b>
                                    </span>
                                </span>
                                <h1
                                    className="hero__title"
                                    aria-label="Drop anchor. Rest easy."
                                >
                                    <span className="line">
                                        <Rise text="Drop anchor." />
                                    </span>
                                    <span className="line">
                                        <span className="gold">
                                            <Rise
                                                text="Rest easy."
                                                offset={12}
                                            />
                                            <svg
                                                className="squiggle"
                                                viewBox="0 0 400 30"
                                                preserveAspectRatio="none"
                                                aria-hidden="true"
                                            >
                                                <path d="M4 18 C 40 4, 70 28, 104 16 S 170 4, 204 16 S 270 28, 304 15 S 370 6, 396 14" />
                                            </svg>
                                        </span>
                                    </span>
                                </h1>
                                <p className="hero__lead">
                                    Comfortable, ready-to-stay rooms
                                    {locations.length > 0 && ' at '}
                                    {locations.map((location, index) => (
                                        <span key={location.id}>
                                            {index > 0 &&
                                                (index === locations.length - 1
                                                    ? ' and '
                                                    : ', ')}
                                            <b>{location.name}</b>
                                        </span>
                                    ))}
                                    . Pick the room that fits your crew and
                                    settle in like you never left home.
                                </p>
                                <div className="ctas">
                                    <a
                                        className="btn btn--gold"
                                        href="#rooms"
                                        onPointerMove={magnetMove}
                                        onPointerLeave={magnetLeave}
                                    >
                                        Find your room
                                        <span className="arr">
                                            <Arrow />
                                        </span>
                                    </a>
                                    <a
                                        className="btn btn--ghost"
                                        href="#locations"
                                        onPointerMove={magnetMove}
                                        onPointerLeave={magnetLeave}
                                    >
                                        <MapPin size={17} />
                                        See locations
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="logbook">
                            <div
                                className="log"
                                data-reveal
                                style={{ '--d': '.05s' } as CSSProperties}
                            >
                                <span className="mono">Rooms</span>
                                <div className="v">
                                    <CountUp value={rooms.length} />
                                </div>
                            </div>
                            <div
                                className="log"
                                data-reveal
                                style={{ '--d': '.15s' } as CSSProperties}
                            >
                                <span className="mono">Harbors</span>
                                <div className="v">
                                    <CountUp value={locations.length} />
                                </div>
                            </div>
                            <div
                                className="log"
                                data-reveal
                                style={{ '--d': '.25s' } as CSSProperties}
                            >
                                <span className="mono">Check-in</span>
                                <div className="v">
                                    {checkIn ? (
                                        <>
                                            {checkIn.split(' ')[0]}
                                            <small>
                                                {checkIn.split(' ')[1]}
                                            </small>
                                        </>
                                    ) : (
                                        '—'
                                    )}
                                </div>
                            </div>
                            <div
                                className="log"
                                data-reveal
                                style={{ '--d': '.35s' } as CSSProperties}
                            >
                                <span className="mono">Check-out</span>
                                <div className="v">
                                    {checkOut ? (
                                        <>
                                            {checkOut.split(' ')[0]}
                                            <small>
                                                {checkOut.split(' ')[1]}
                                            </small>
                                        </>
                                    ) : (
                                        '—'
                                    )}
                                </div>
                            </div>
                            <div
                                className="log log--ports"
                                data-reveal
                                style={{ '--d': '.45s' } as CSSProperties}
                            >
                                <span className="mono">Ports of call</span>
                                <div className="v">
                                    {locations.map((location, index) => (
                                        <span
                                            key={location.id}
                                            className={
                                                index === port ? 'on' : ''
                                            }
                                        >
                                            {location.name} ·{' '}
                                            {plural(
                                                location.rooms_count,
                                                'room',
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ================= Marquee ================= */}
                {marquee.length > 0 && (
                    <div className="mq-clip">
                        <div className="marquee" aria-hidden="true">
                            <div className="marquee__track">
                                {[0, 1].flatMap((copy) =>
                                    marquee.map((entry, index) => (
                                        <span key={`${copy}-${index}`}>
                                            {entry.italic ? (
                                                <i>{entry.text}</i>
                                            ) : (
                                                entry.text
                                            )}
                                            <Star />
                                        </span>
                                    )),
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <main className="wrap">
                    {/* ============ The guest's own bookings ============ */}
                    {reservations.length > 0 && (
                        <section className="s" id="stay">
                            <div className="s__head">
                                <div>
                                    <span className="eyebrow mono" data-reveal>
                                        Your logbook
                                    </span>
                                    <h2
                                        className="s__title"
                                        data-reveal
                                        style={
                                            { '--d': '.08s' } as CSSProperties
                                        }
                                    >
                                        Your upcoming{' '}
                                        <em className="acc">stay.</em>
                                    </h2>
                                </div>
                            </div>
                            <div className="stays">
                                {reservations.map((reservation) => (
                                    <article
                                        key={reservation.id}
                                        className="stay"
                                        data-reveal
                                    >
                                        <div>
                                            <h3>
                                                {reservation.location} ·{' '}
                                                {reservation.room}
                                            </h3>
                                            <p>
                                                {formatDateTime(
                                                    reservation.starts_at,
                                                )}{' '}
                                                –{' '}
                                                {formatDateTime(
                                                    reservation.ends_at,
                                                )}{' '}
                                                ·{' '}
                                                {plural(
                                                    reservation.pax,
                                                    'guest',
                                                )}
                                            </p>
                                        </div>
                                        <span className="tag">
                                            {
                                                paymentLabels[
                                                    reservation.payment_status
                                                ]
                                            }
                                        </span>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ================= Locations ================= */}
                    <Chapter index={1} />
                    {locations.length > 0 && (
                        <section className="s" id="locations">
                            <div className="s__head">
                                <div>
                                    <span className="eyebrow mono" data-reveal>
                                        01 — Where to stay
                                    </span>
                                    <h2
                                        className="s__title"
                                        data-reveal
                                        style={
                                            { '--d': '.08s' } as CSSProperties
                                        }
                                    >
                                        {locations.length === 2 ? (
                                            <>
                                                Two harbors,{' '}
                                                <em className="acc">
                                                    two moods.
                                                </em>
                                            </>
                                        ) : (
                                            <>
                                                Every harbor,{' '}
                                                <em className="acc">
                                                    its own mood.
                                                </em>
                                            </>
                                        )}
                                    </h2>
                                </div>
                                <p
                                    className="s__intro"
                                    data-reveal
                                    style={{ '--d': '.16s' } as CSSProperties}
                                >
                                    Each villa has its own character. Choose a
                                    place first, then pick the cabin that suits
                                    your crew.
                                </p>
                            </div>
                            <div className="locs">
                                {locations.map((location, index) => {
                                    const highlights = [
                                        ...new Set(
                                            rooms
                                                .filter(
                                                    (room) =>
                                                        room.location_id ===
                                                        location.id,
                                                )
                                                .flatMap((room) =>
                                                    room.inclusions.map(
                                                        (inclusion) =>
                                                            inclusion.item,
                                                    ),
                                                ),
                                        ),
                                    ].slice(0, 3);

                                    return (
                                        <div
                                            key={location.id}
                                            data-reveal="scale"
                                            style={
                                                {
                                                    '--d': `${(index % 2) * 0.15}s`,
                                                } as CSSProperties
                                            }
                                        >
                                            <button
                                                type="button"
                                                className="loc"
                                                onClick={() =>
                                                    browse(location.id)
                                                }
                                                onPointerMove={tiltMove}
                                                onPointerLeave={tiltLeave}
                                                aria-label={`View rooms at ${location.name}`}
                                            >
                                                <span className="loc__media">
                                                    <Photo
                                                        url={location.cover_url}
                                                        alt=""
                                                    >
                                                        <Skyline />
                                                    </Photo>
                                                </span>
                                                <span className="loc__top">
                                                    <span className="mono">
                                                        Port of call
                                                    </span>
                                                    <span className="loc__num">
                                                        {pad(index + 1)}
                                                    </span>
                                                </span>
                                                <span className="loc__body">
                                                    <span className="loc__meta">
                                                        <span className="pill pill--gold">
                                                            {plural(
                                                                location.rooms_count,
                                                                'room',
                                                            )}
                                                        </span>
                                                        <span className="pill">
                                                            Up to{' '}
                                                            {plural(
                                                                location.max_pax,
                                                                'guest',
                                                            )}
                                                        </span>
                                                        {highlights.length >
                                                            0 && (
                                                            <span className="pill">
                                                                {highlights.join(
                                                                    ' · ',
                                                                )}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="loc__name">
                                                        {location.name}
                                                    </span>
                                                    {location.description && (
                                                        <span className="loc__desc">
                                                            {
                                                                location.description
                                                            }
                                                        </span>
                                                    )}
                                                    <span className="loc__foot">
                                                        <span className="from">
                                                            {location.from_price ? (
                                                                <>
                                                                    From{' '}
                                                                    <b>
                                                                        {formatPeso(
                                                                            location.from_price,
                                                                        )}
                                                                    </b>{' '}
                                                                    /{' '}
                                                                    {location.from_unit?.toLowerCase()}
                                                                </>
                                                            ) : (
                                                                'Ask reception for rates'
                                                            )}
                                                        </span>
                                                        <span className="go">
                                                            <Arrow size={20} />
                                                        </span>
                                                    </span>
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ================= Rooms ================= */}
                    <Chapter index={2} />
                    <section className="s" id="rooms">
                        <div className="s__head">
                            <div>
                                <span className="eyebrow mono" data-reveal>
                                    02 — Find your cabin
                                </span>
                                <h2
                                    className="s__title"
                                    data-reveal
                                    style={{ '--d': '.08s' } as CSSProperties}
                                >
                                    Rooms made for a{' '}
                                    <em className="acc">good night’s rest.</em>
                                </h2>
                            </div>
                            {locations.length > 1 && (
                                <div
                                    className="filter"
                                    role="group"
                                    aria-label="Filter rooms by location"
                                    ref={filterTrack}
                                    data-reveal
                                    style={{ '--d': '.16s' } as CSSProperties}
                                >
                                    <span
                                        className="filter__pill"
                                        ref={filterPill}
                                    />
                                    <button
                                        type="button"
                                        aria-pressed={filter === null}
                                        onClick={() => choose(null)}
                                    >
                                        All
                                        <span className="n">
                                            {pad(rooms.length)}
                                        </span>
                                    </button>
                                    {locations.map((location) => (
                                        <button
                                            key={location.id}
                                            type="button"
                                            aria-pressed={
                                                filter === location.id
                                            }
                                            onClick={() => choose(location.id)}
                                        >
                                            {location.name}
                                            <span className="n">
                                                {pad(location.rooms_count)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {rooms.length === 0 ? (
                            <p className="empty">
                                No rooms are open for guests yet. Please check
                                back soon.
                            </p>
                        ) : (
                            <div className="rooms">
                                {rooms.map((room, index) => {
                                    const visible = matches(room, filter);

                                    return (
                                        <div
                                            key={room.id}
                                            className={cn(
                                                'room-slot',
                                                !visible && 'out',
                                                !visible &&
                                                    settled === filter &&
                                                    'gone',
                                                visible &&
                                                    !matches(room, previous) &&
                                                    'back',
                                            )}
                                        >
                                            <article
                                                className="room"
                                                data-reveal
                                                style={
                                                    {
                                                        '--d': `${(index % 3) * 0.1}s`,
                                                    } as CSSProperties
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className="room__vis"
                                                    onClick={() =>
                                                        setOpen(room)
                                                    }
                                                    aria-label={`View ${room.name}`}
                                                >
                                                    <span className="room__loc">
                                                        <MapPin
                                                            size={12}
                                                            strokeWidth={2.4}
                                                        />
                                                        {room.location}
                                                    </span>
                                                    {room.photos.length > 1 && (
                                                        <span className="room__count">
                                                            {room.photos.length}{' '}
                                                            photos
                                                        </span>
                                                    )}
                                                    <Photo
                                                        url={room.cover_url}
                                                        alt={room.name}
                                                    >
                                                        <Porthole
                                                            number={cabin(room)}
                                                        />
                                                    </Photo>
                                                </button>
                                                <div className="room__perf" />
                                                <div className="room__body">
                                                    <div className="room__top">
                                                        <span className="mono">
                                                            Cabin {cabin(room)}
                                                        </span>
                                                        <span className="cap">
                                                            <Users size={16} />
                                                            {plural(
                                                                room.pax_capacity,
                                                                'guest',
                                                            )}
                                                        </span>
                                                    </div>
                                                    <h3>{room.name}</h3>
                                                    {room.description && (
                                                        <p className="room__desc">
                                                            {room.description}
                                                        </p>
                                                    )}
                                                    {room.inclusions.length >
                                                        0 && (
                                                        <ul className="room__chips">
                                                            {room.inclusions
                                                                .slice(0, 3)
                                                                .map(
                                                                    (
                                                                        inclusion,
                                                                    ) => {
                                                                        const Icon =
                                                                            amenityIcon(
                                                                                inclusion.item,
                                                                            );

                                                                        return (
                                                                            <li
                                                                                key={
                                                                                    inclusion.item
                                                                                }
                                                                            >
                                                                                <Icon
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                                {
                                                                                    inclusion.item
                                                                                }
                                                                            </li>
                                                                        );
                                                                    },
                                                                )}
                                                            {room.inclusions
                                                                .length > 3 && (
                                                                <li>
                                                                    +
                                                                    {room
                                                                        .inclusions
                                                                        .length -
                                                                        3}{' '}
                                                                    more
                                                                </li>
                                                            )}
                                                        </ul>
                                                    )}
                                                    <div className="room__foot">
                                                        <span className="rate">
                                                            {room.rates[0] ? (
                                                                <>
                                                                    From
                                                                    <b>
                                                                        {formatPeso(
                                                                            room
                                                                                .rates[0]
                                                                                .price,
                                                                        )}{' '}
                                                                        <small>
                                                                            /{' '}
                                                                            {room.rates[0].unit.toLowerCase()}
                                                                        </small>
                                                                    </b>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Rate
                                                                    <b className="ask">
                                                                        Ask
                                                                        reception
                                                                    </b>
                                                                </>
                                                            )}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="btn btn--navy"
                                                            onClick={() =>
                                                                setOpen(room)
                                                            }
                                                        >
                                                            View room
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* ================= Amenities ================= */}
                    <Chapter index={3} />
                    {tiles.length > 0 && (
                        <section className="s" id="amenities">
                            <div className="s__head">
                                <div>
                                    <span className="eyebrow mono" data-reveal>
                                        03 — On board
                                    </span>
                                    <h2
                                        className="s__title"
                                        data-reveal
                                        style={
                                            { '--d': '.08s' } as CSSProperties
                                        }
                                    >
                                        Everything you need,{' '}
                                        <em className="acc">already there.</em>
                                    </h2>
                                </div>
                                <p
                                    className="s__intro"
                                    data-reveal
                                    style={{ '--d': '.16s' } as CSSProperties}
                                >
                                    What you’ll find waiting in our rooms. Open
                                    a room to see exactly what it includes.
                                </p>
                            </div>
                            <div className="bento">
                                {tiles.map((amenity, index) => {
                                    const Icon = amenityIcon(amenity.item);
                                    const big = amenity === bigTile;
                                    const wide = amenity === wideTile;

                                    return (
                                        <div
                                            key={amenity.item}
                                            className={cn(
                                                'am',
                                                big && 'am--big',
                                                wide && 'am--wide',
                                            )}
                                            data-reveal="scale"
                                            style={
                                                {
                                                    '--d': `${Math.min(index, 4) * 0.1}s`,
                                                } as CSSProperties
                                            }
                                        >
                                            {big && (
                                                <>
                                                    <span
                                                        className="zz"
                                                        aria-hidden="true"
                                                    >
                                                        <span>z</span>
                                                        <span>z</span>
                                                        <span>z</span>
                                                    </span>
                                                    <span
                                                        className="moon"
                                                        aria-hidden="true"
                                                    />
                                                    <svg
                                                        className="night"
                                                        viewBox="0 0 300 200"
                                                        aria-hidden="true"
                                                    >
                                                        <circle
                                                            cx="210"
                                                            cy="120"
                                                            r="54"
                                                            fill="#f6b81a"
                                                        />
                                                        <circle
                                                            cx="234"
                                                            cy="104"
                                                            r="50"
                                                            fill="#1f3a68"
                                                        />
                                                        <g fill="#fde9ad">
                                                            {[
                                                                [60, 40, 2, 0],
                                                                [
                                                                    120, 90,
                                                                    1.6, 0.8,
                                                                ],
                                                                [
                                                                    40, 140,
                                                                    1.4, 1.6,
                                                                ],
                                                                [
                                                                    150, 30,
                                                                    1.8, 2.2,
                                                                ],
                                                                [
                                                                    280, 40,
                                                                    1.5, 1.1,
                                                                ],
                                                            ].map(
                                                                ([
                                                                    cx,
                                                                    cy,
                                                                    r,
                                                                    delay,
                                                                ]) => (
                                                                    <circle
                                                                        key={`${cx}-${cy}`}
                                                                        className="tw"
                                                                        cx={cx}
                                                                        cy={cy}
                                                                        r={r}
                                                                        style={{
                                                                            animationDelay: `${delay}s`,
                                                                        }}
                                                                    />
                                                                ),
                                                            )}
                                                        </g>
                                                    </svg>
                                                </>
                                            )}
                                            {wide && (
                                                <span
                                                    className="tv-screen"
                                                    data-label={
                                                        amenity.item.match(
                                                            /\d+/,
                                                        )
                                                            ? `${amenity.item.match(/\d+/)?.[0]}″`
                                                            : 'TV'
                                                    }
                                                    aria-hidden="true"
                                                />
                                            )}
                                            {/fridge|ref|freezer/i.test(
                                                amenity.item,
                                            ) &&
                                                !big &&
                                                !wide && (
                                                    <svg
                                                        className="frost"
                                                        viewBox="0 0 140 140"
                                                        aria-hidden="true"
                                                    >
                                                        <circle
                                                            cx="70"
                                                            cy="70"
                                                            r="30"
                                                        />
                                                        <circle
                                                            cx="70"
                                                            cy="70"
                                                            r="48"
                                                            strokeDasharray="3 6"
                                                        />
                                                        <circle
                                                            cx="70"
                                                            cy="70"
                                                            r="66"
                                                            strokeDasharray="1 8"
                                                        />
                                                    </svg>
                                                )}
                                            <span className="am__ico">
                                                <Icon
                                                    size={26}
                                                    strokeWidth={1.9}
                                                />
                                            </span>
                                            <div>
                                                <h4>{amenity.item}</h4>
                                                <div className="mono">
                                                    In{' '}
                                                    {plural(
                                                        amenity.rooms,
                                                        'room',
                                                    )}
                                                    {amenity.locations
                                                        .length === 1 &&
                                                        ` · ${amenity.locations[0]}`}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ================= How to reserve ================= */}
                    <section className="s" id="reserve">
                        <div className="s__head">
                            <div>
                                <span className="eyebrow mono" data-reveal>
                                    04 — How to reserve
                                </span>
                                <h2
                                    className="s__title"
                                    data-reveal
                                    style={{ '--d': '.08s' } as CSSProperties}
                                >
                                    Three steps to{' '}
                                    <em className="acc">shore leave.</em>
                                </h2>
                            </div>
                        </div>
                        <div className="steps">
                            <svg
                                className="rope"
                                viewBox="0 0 1180 70"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                            >
                                <path d="M32 66 C 200 10, 300 10, 420 66 S 640 10, 820 66 S 1060 20, 1180 40" />
                            </svg>
                            <div className="step" data-reveal>
                                <span className="step__n">01</span>
                                <h4>Pick your cabin</h4>
                                <p>
                                    Browse the villas and open a room to see its
                                    photos, amenities and price.
                                </p>
                            </div>
                            <div
                                className="step"
                                data-reveal
                                style={{ '--d': '.15s' } as CSSProperties}
                            >
                                <span className="step__n">02</span>
                                <h4>Tell the front desk</h4>
                                <p>
                                    Contact reception with the room and dates
                                    you want — they’ll hold it for you.
                                </p>
                            </div>
                            <div
                                className="step"
                                data-reveal
                                style={{ '--d': '.3s' } as CSSProperties}
                            >
                                <span className="step__n">03</span>
                                <h4>Drop anchor</h4>
                                <p>
                                    {checkIn && checkOut
                                        ? `Check in from ${checkIn}. Check-out is at ${checkOut}, so sleep in a little.`
                                        : 'Check in, settle down and sleep in a little.'}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ================= Reservation band ================= */}
                    <div className="cta" data-reveal="scale">
                        <div className="beam" aria-hidden="true" />
                        <div>
                            <span className="eyebrow mono">Ready to dock?</span>
                            <h2>
                                Found a room <em className="acc">you like?</em>
                            </h2>
                            <p>
                                Tell the front desk which room and dates you
                                want and they’ll reserve it for you.
                            </p>
                            <span className="soon mono">
                                <span className="dot" />
                                Online booking — coming soon
                            </span>
                        </div>
                        <div className="cta__card">
                            <div className="cta__row">
                                <span className="mono">Check-in</span>
                                <b>{checkIn ?? '—'}</b>
                            </div>
                            <div className="cta__row">
                                <span className="mono">Check-out</span>
                                <b>{checkOut ?? '—'}</b>
                            </div>
                            <div className="cta__row">
                                <span className="mono">Reservations</span>
                                <b>Front desk</b>
                            </div>
                            <a
                                className="btn btn--gold"
                                href="#reserve"
                                onPointerMove={magnetMove}
                                onPointerLeave={magnetLeave}
                            >
                                <Phone size={17} strokeWidth={2.2} />
                                Contact reception
                            </a>
                        </div>
                    </div>

                    <footer className="foot">
                        <span className="brand">
                            <span className="brand__mark">
                                <Anchor size={16} strokeWidth={2.4} />
                            </span>
                            <span className="brand__name">
                                Mindoro Marine · Guest Accommodation
                            </span>
                        </span>
                        <span className="mono">
                            {locations
                                .map((location) => location.name)
                                .join(' · ')}
                        </span>
                    </footer>
                </main>
            </div>

            <Dialog
                open={open !== null}
                onOpenChange={(next) => !next && setOpen(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    {open && (
                        <RoomDetails
                            key={open.id}
                            room={open}
                            cabin={cabin(open)}
                            checkIn={checkIn}
                            checkOut={checkOut}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function RoomDetails({
    room,
    cabin,
    checkIn,
    checkOut,
}: {
    room: GuestRoom;
    cabin: string;
    checkIn: string | null;
    checkOut: string | null;
}) {
    const [photo, setPhoto] = useState(0);
    const current = room.photos[photo] ?? null;

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-2xl">{room.name}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Cabin {cabin}</span>
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="size-4" />
                        {room.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Users className="size-4" />
                        Up to {plural(room.pax_capacity, 'guest')}
                    </span>
                </DialogDescription>
            </DialogHeader>

            {room.photos.length > 0 && (
                <div className="space-y-2">
                    <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
                        <img
                            key={current?.url}
                            src={current?.url}
                            alt={current?.caption ?? room.name}
                            className="size-full object-cover"
                        />
                    </div>
                    {current?.caption && (
                        <p className="text-xs text-muted-foreground">
                            {current.caption}
                        </p>
                    )}
                    {room.photos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto p-1">
                            {room.photos.map((item, index) => (
                                <button
                                    key={item.url}
                                    type="button"
                                    onClick={() => setPhoto(index)}
                                    aria-label={`Photo ${index + 1}`}
                                    aria-pressed={index === photo}
                                    className={cn(
                                        'size-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-transparent outline-none focus-visible:ring-ring',
                                        index === photo && 'ring-primary',
                                    )}
                                >
                                    <img
                                        src={item.url}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {room.description && (
                <p className="text-sm text-muted-foreground">
                    {room.description}
                </p>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold">In this room</h3>
                    {room.inclusions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Ask reception what this room includes.
                        </p>
                    ) : (
                        <ul className="space-y-1.5 text-sm">
                            {room.inclusions.map((inclusion) => {
                                const Icon = amenityIcon(inclusion.item);

                                return (
                                    <li
                                        key={inclusion.item}
                                        className="flex items-center gap-2"
                                    >
                                        <Icon className="size-4 text-primary" />
                                        <span className="first-letter:uppercase">
                                            {inclusion.item}
                                        </span>
                                        {inclusion.quantity > 1 && (
                                            <span className="text-muted-foreground">
                                                × {inclusion.quantity}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Prices</h3>
                    {room.rates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Ask reception for this room’s rate.
                        </p>
                    ) : (
                        <ul className="divide-y rounded-xl border text-sm">
                            {room.rates.map((rate) => (
                                <li
                                    key={`${rate.name}-${rate.unit}-${rate.price}`}
                                    className="flex items-center justify-between gap-3 px-3 py-2"
                                >
                                    <span>
                                        {rate.name}
                                        <span className="block text-xs text-muted-foreground">
                                            per {rate.unit.toLowerCase()}
                                        </span>
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {formatPeso(rate.price)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="rounded-2xl bg-primary/5 p-4 text-sm">
                <p className="font-medium">Want this room?</p>
                <p className="text-muted-foreground">
                    Tell the front desk you would like {room.name} at{' '}
                    {room.location} and your dates. Online booking is coming
                    soon.
                    {checkIn && checkOut && (
                        <>
                            {' '}
                            Check-in is from {checkIn}, check-out by {checkOut}.
                        </>
                    )}
                </p>
            </div>
        </>
    );
}
