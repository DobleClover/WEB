import { createProductCard } from "./componentRenderer.js";
import { listenToProductCards } from "./utils.js"

window.addEventListener('load',()=>{
    const products = [
        {
            id: 1,
            name: "Remera Manga Corta",
            category: "Ropa",
            price: 35000,
            files: [
                { filename: "1.jpg", mainImage: true },
                { filename: "2.jpg", mainImage: false },
                { filename: "3.jpg", mainImage: false }
            ],
            discount: 0
        },
        {
            id: 2,
            name: "Zapatillas Running",
            category: "Calzado",
            price: 75000,
            files: [
                { filename: "3.jpg", mainImage: true },
                { filename: "5.jpg", mainImage: false },
                { filename: "7.jpg", mainImage: false },
                { filename: "1.jpg", mainImage: false }
            ],
            discount: 0.5
        },
        {
            id: 3,
            name: "Campera Invierno",
            category: "Ropa",
            price: 120000,
            files: [
                { filename: "6.jpg", mainImage: true },
                { filename: "7.jpg", mainImage: false }
            ],
            discount: 0.15
        },
        {
            id: 4,
            name: "Gorra Deportiva",
            category: "Accesorios",
            price: 20000,
            files: [
                { filename: "2.jpg", mainImage: true },
                { filename: "5.jpg", mainImage: false },
                { filename: "3.jpg", mainImage: false },
                { filename: "6.jpg", mainImage: false }
            ],
            discount: 0
        }
    ];
    const main = document.querySelector('.main');

    products.forEach(prod => {
        const card = createProductCard(prod);
        main.appendChild(card);
    });
    listenToProductCards();
})