const asset = (path) => `/shop-assets/${path}`;

export const SHOP_CATEGORIES = [
    { name: "Saree Drapes", count: 18, image: asset("icons/dress.svg") },
    { name: "Festive Kurtas", count: 24, image: asset("icons/tee.svg") },
    { name: "Jadau Jewellery", count: 16, image: asset("icons/jewelry.svg") },
    { name: "Wedding Shoes", count: 12, image: asset("icons/shoes.svg") },
    { name: "Occasion Bags", count: 9, image: asset("icons/bag.svg") },
    { name: "Fragrance", count: 7, image: asset("icons/perfume.svg") },
];

export const SHOP_PRODUCTS = [
    {
        id: "kantha-wrap-jacket",
        name: "Kantha Wrap Jacket",
        category: "Outerwear",
        price: 6490,
        compareAt: 8290,
        image: asset("products/jacket-3.jpg"),
        hoverImage: asset("products/jacket-4.jpg"),
        badge: "Live Pick",
    },
    {
        id: "mirrorwork-festive-set",
        name: "Mirrorwork Festive Set",
        category: "Festive Wear",
        price: 7890,
        compareAt: 9990,
        image: asset("products/clothes-3.jpg"),
        hoverImage: asset("products/clothes-4.jpg"),
        badge: "New",
    },
    {
        id: "rose-gold-jhumkas",
        name: "Rose Gold Jhumkas",
        category: "Jewellery",
        price: 2490,
        compareAt: 3190,
        image: asset("products/jewellery-1.jpg"),
        hoverImage: asset("products/jewellery-2.jpg"),
        badge: "Bestseller",
    },
    {
        id: "ivory-embroidered-shirt",
        name: "Ivory Embroidered Shirt",
        category: "Menswear",
        price: 3490,
        compareAt: 4290,
        image: asset("products/shirt-1.jpg"),
        hoverImage: asset("products/shirt-2.jpg"),
        badge: "Limited",
    },
    {
        id: "ceremony-party-heels",
        name: "Ceremony Party Heels",
        category: "Footwear",
        price: 4290,
        compareAt: 5790,
        image: asset("products/party-wear-1.jpg"),
        hoverImage: asset("products/party-wear-2.jpg"),
        badge: "Stylist Pick",
    },
    {
        id: "sandalwood-wardrobe-mist",
        name: "Sandalwood Wardrobe Mist",
        category: "Fragrance",
        price: 1490,
        compareAt: 1990,
        image: asset("products/perfume.jpg"),
        hoverImage: asset("products/shampoo.jpg"),
        badge: "Giftable",
    },
    {
        id: "heritage-leather-belt",
        name: "Heritage Leather Belt",
        category: "Accessories",
        price: 1890,
        compareAt: 2490,
        image: asset("products/belt.jpg"),
        hoverImage: asset("products/4.jpg"),
        badge: "Classic",
    },
    {
        id: "handfinished-formal-shoes",
        name: "Handfinished Formal Shoes",
        category: "Menswear",
        price: 5590,
        compareAt: 6990,
        image: asset("products/shoe-1.jpg"),
        hoverImage: asset("products/shoe-1_1.jpg"),
        badge: "Made To Order",
    },
];

export const SHOP_STORIES = [
    {
        title: "The Wedding Guest Edit",
        category: "Styling",
        image: asset("blog-1.jpg"),
    },
    {
        title: "How live consultations make sizing easier",
        category: "Experience",
        image: asset("blog-2.jpg"),
    },
    {
        title: "Jewellery pairings for modern lehengas",
        category: "Atelier Notes",
        image: asset("blog-3.jpg"),
    },
];

export const SHOP_HERO_IMAGES = {
    primary: asset("banner-1.jpg"),
    secondary: asset("cta-banner.jpg"),
    mens: asset("mens-banner.jpg"),
    womens: asset("womens-banner.jpg"),
};
