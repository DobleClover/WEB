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
            ]
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
            ]
        },
        {
            id: 3,
            name: "Campera Invierno",
            category: "Ropa",
            price: 120000,
            files: [
                { filename: "6.jpg", mainImage: true },
                { filename: "7.jpg", mainImage: false }
            ]
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
            ]
        }
    ];
    const main = document.querySelector('.main');

    products.forEach(prod => {
        const card = createProductCard({
            id: prod.id,
            name: prod.name,
            category: prod.category,
            price: prod.price,
            files: prod.files,
        });
        main.appendChild(card);
    });
    listenToProductCards();
})