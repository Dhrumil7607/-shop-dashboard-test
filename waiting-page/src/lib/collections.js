// Featured collections — image + copy data
export const COLLECTIONS = [
    {
        slug: "navratri",
        name: "Navratri",
        tagline: "Nine nights, nine silhouettes.",
        description:
            "Mirror-worked chaniya cholis, oxidised jewels and rhythm-ready drapes for every garba night.",
        image:
            "https://images.unsplash.com/photo-1503160865267-af4660ce7bf2?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
        accent: "#C6A87C",
    },
    {
        slug: "mehendi",
        name: "Mehendi Looks",
        tagline: "Marigold afternoons.",
        description:
            "Sun-soaked yellows, sage greens and embroidered georgettes designed for the henna ceremony.",
        image:
            "https://images.unsplash.com/photo-1514178703120-3fa66528901d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
        accent: "#A6824B",
    },
    {
        slug: "wedding-guest",
        name: "Wedding Guest",
        tagline: "The art of being looked at.",
        description:
            "Hand-loomed silks, sculpted lehengas and contemporary saris — for the guest who arrives in stories.",
        image:
            "https://images.pexels.com/photos/30703859/pexels-photo-30703859.jpeg?auto=compress&cs=tinysrgb&w=1600",
        accent: "#8B3A3A",
    },
    {
        slug: "couple-matching",
        name: "Couple Matching",
        tagline: "Two halves of one heirloom.",
        description:
            "Coordinated kurta-lehenga and sherwani-sari pairings tailored to photograph as one composition.",
        image:
            "https://images.pexels.com/photos/36098369/pexels-photo-36098369.jpeg?auto=compress&cs=tinysrgb&w=1600",
        accent: "#6B2A2A",
    },
    {
        slug: "brides-sister",
        name: "Bride's Sister",
        tagline: "The second leading role.",
        description:
            "Statement lehengas and modern saris designed for the sister who shares the spotlight.",
        image:
            "https://images.pexels.com/photos/30703868/pexels-photo-30703868.jpeg?auto=compress&cs=tinysrgb&w=1600",
        accent: "#B68A4F",
    },
    {
        slug: "festive-wear",
        name: "Festive Wear",
        tagline: "Everyday occasion dressing.",
        description:
            "Lightweight festive sets — for Diwali drawing rooms, Karwa Chauth dinners and Raksha Bandhan brunches.",
        image:
            "https://images.pexels.com/photos/31371016/pexels-photo-31371016.png?auto=compress&cs=tinysrgb&w=1600",
        accent: "#D4AF37",
    },
];

export const COLLECTION_BY_SLUG = Object.fromEntries(
    COLLECTIONS.map((c) => [c.slug, c]),
);

// Hero / floating accent images
export const HERO_IMAGES = {
    primary:
        "https://images.unsplash.com/photo-1654764746225-e63f5e90facd?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    floatingA:
        "https://images.unsplash.com/photo-1629118477133-b8b1499f2b8a?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    floatingB:
        "https://images.pexels.com/photos/12959396/pexels-photo-12959396.jpeg?auto=compress&cs=tinysrgb&w=900",
};

export const KOMMODO_THUMBNAILS = [
    "https://plain-apac-prod-public.komododecks.com/202605/19/QiTRx9NtEhLMrQV3E6ti/image.jpg",
    "https://plain-apac-prod-public.komododecks.com/202605/19/oYSft1PR0gasOnefxuSO/image.jpg",
    "https://plain-apac-prod-public.komododecks.com/202605/19/z9omEac5lFcaFI8ppWex/image.jpg",
    "https://plain-apac-prod-public.komododecks.com/202605/19/FHSez80ELNrI31zKLC7w/image.jpg",
    "https://plain-apac-prod-public.komododecks.com/202605/19/p7IEbWTv5l6wsBSKXbie/image.jpg",
];
